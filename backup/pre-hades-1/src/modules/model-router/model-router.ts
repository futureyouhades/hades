/**
 * ModelRouterModule — Phase 1a (IMPLEMENTATION_ROADMAP §Phase 1a).
 *
 * A HadesModule exposing the `complete` capability. It selects a provider
 * (Claude primary, Ollama fallback) via a replaceable SelectionPolicy, performs
 * the completion over the provider abstraction, and reports per-provider health.
 * It hardcodes no provider identity in its routing contract — new providers are
 * additive (R10.4). Cross-module retry/abort remains Commander's concern (R7.3);
 * this module only falls through to the next of *its own* providers on a
 * retryable error (see selection.ts).
 */

import {
  KernelErrorCode,
  type CapabilityManifest,
  type HadesModule,
  type HealthStatus,
  type Logger,
  type ModuleContext,
  type ModuleError,
  type ModuleRequest,
  type ModuleResponse,
  type CheckResult,
} from "../../kernel/contract/index.js";
import { COMPLETE_CAPABILITY, COMPLETE_CAPABILITY_SPEC } from "./capabilities.js";
import {
  MODEL_ROUTER_CONFIG_SCHEMA,
  MODEL_ROUTER_DEFAULTS,
  parseModelRouterConfig,
  type ModelRouterConfig,
} from "./config.js";
import { ModelRouterErrorCode } from "./errors.js";
import {
  ProviderError,
  type ChatMessage,
  type CompletionRequest,
  type ModelProvider,
  type StreamHooks,
} from "./provider.js";
import { PrioritySelectionPolicy, type SelectionPolicy } from "./selection.js";
import {
  SdkAnthropicClient,
  type AnthropicClient,
  type SdkAnthropicClientOptions,
} from "./providers/anthropic-client.js";
import { ClaudeProvider } from "./providers/claude-provider.js";
import { OllamaProvider, type FetchLike } from "./providers/ollama-provider.js";

export interface ModelRouterOptions {
  /** Inject providers directly (tests / custom wiring); otherwise built from config. */
  providers?: ModelProvider[];
  selectionPolicy?: SelectionPolicy;
  /** fetch implementation for the Ollama provider; defaults to global fetch. */
  fetchImpl?: FetchLike;
  /** Factory for the Anthropic client; defaults to the real SDK adapter. */
  anthropicClientFactory?: (options: SdkAnthropicClientOptions) => AnthropicClient;
}

interface ParsedPayload {
  messages: ChatMessage[];
  model: string | undefined;
  provider: string | undefined;
  maxTokens: number | undefined;
  temperature: number | undefined;
  stream: boolean;
}

export class ModelRouterModule implements HadesModule {
  readonly id = "model-router";
  readonly name = "Model Router";
  readonly version = "0.1.0";

  private readonly injectedProviders: ModelProvider[] | undefined;
  private readonly selectionPolicy: SelectionPolicy;
  private readonly fetchImpl: FetchLike;
  private readonly anthropicClientFactory: (
    options: SdkAnthropicClientOptions,
  ) => AnthropicClient;

  private providers: ModelProvider[] = [];
  private logger: Logger | undefined;
  private emit: ModuleContext["emit"] | undefined;

  constructor(options: ModelRouterOptions = {}) {
    this.injectedProviders = options.providers;
    this.selectionPolicy = options.selectionPolicy ?? new PrioritySelectionPolicy();
    this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args));
    this.anthropicClientFactory =
      options.anthropicClientFactory ?? ((opts) => new SdkAnthropicClient(opts));
  }

  async init(context: ModuleContext): Promise<void> {
    this.logger = context.logger;
    this.emit = context.emit;
    const config = parseModelRouterConfig(context.config.values);
    this.providers = this.injectedProviders ?? this.buildProviders(config);
    this.logger.info("model-router initialized", {
      providers: this.providers.map((p) => p.name),
    });
  }

  async start(): Promise<void> {
    this.logger?.info("model-router started");
  }

  async stop(): Promise<void> {
    // Providers hold no live handles (stateless HTTP/SDK clients); nothing to release.
    this.logger?.info("model-router stopped");
  }

  describeCapabilities(): CapabilityManifest {
    return {
      moduleId: this.id,
      capabilities: [COMPLETE_CAPABILITY_SPEC],
      dependsOn: [],
      requires: [{ name: "ollama", required: false }],
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const checkedAt = new Date().toISOString();
    if (this.providers.length === 0) {
      return { state: "unhealthy", moduleId: this.id, checkedAt, message: "no providers configured" };
    }

    const ordered = [...this.providers].sort((a, b) => a.priority - b.priority);
    const probes = await Promise.all(
      ordered.map(async (p) => ({ name: p.name, health: await p.health() })),
    );

    const details: Record<string, CheckResult> = {};
    for (const probe of probes) {
      details[probe.name] = {
        ok: probe.health.ok,
        ...(probe.health.latencyMs !== undefined ? { latencyMs: probe.health.latencyMs } : {}),
        ...(probe.health.ok ? {} : { error: probe.health.detail ?? "unhealthy" }),
      };
    }

    const primaryOk = probes[0]?.health.ok === true;
    const anyOk = probes.some((p) => p.health.ok);
    const state = primaryOk ? "healthy" : anyOk ? "degraded" : "unhealthy";
    const message = primaryOk
      ? undefined
      : anyOk
        ? "primary provider unavailable; fallback in use"
        : "all providers unavailable";

    return { state, moduleId: this.id, checkedAt, details, ...(message ? { message } : {}) };
  }

  async execute(request: ModuleRequest): Promise<ModuleResponse> {
    const log = this.logger?.child({ requestId: request.requestId });

    if (request.capability !== COMPLETE_CAPABILITY) {
      return this.fail(request.requestId, {
        code: KernelErrorCode.UNKNOWN_CAPABILITY,
        category: "validation",
        message: `unknown capability "${request.capability}"`,
        retryable: false,
      });
    }

    const parsed = parsePayload(request.payload);
    if (parsed === null) {
      return this.fail(request.requestId, {
        code: ModelRouterErrorCode.BAD_REQUEST,
        category: "validation",
        message: "payload.messages must be a non-empty array of {role, content}",
        retryable: false,
      });
    }

    if (deadlinePassed(request.context.deadline)) {
      return this.fail(request.requestId, {
        code: KernelErrorCode.TIMEOUT,
        category: "timeout",
        message: "deadline already passed",
        retryable: false,
      });
    }

    const candidates = this.selectionPolicy.select(this.providers, {
      capability: request.capability,
      provider: parsed.provider,
      model: parsed.model,
    });

    if (candidates.length === 0) {
      return this.fail(request.requestId, {
        code: ModelRouterErrorCode.NO_PROVIDER,
        category: "dependency",
        message: "no configured provider can serve this request",
        retryable: false,
      });
    }

    const completionRequest: CompletionRequest = {
      messages: parsed.messages,
      ...(parsed.model !== undefined ? { model: parsed.model } : {}),
      ...(parsed.maxTokens !== undefined ? { maxTokens: parsed.maxTokens } : {}),
      ...(parsed.temperature !== undefined ? { temperature: parsed.temperature } : {}),
      stream: parsed.stream,
    };
    const hooks: StreamHooks | undefined = parsed.stream
      ? {
          onToken: (delta) =>
            this.emit?.({
              moduleId: this.id,
              type: "model.token",
              requestId: request.requestId,
              data: { delta },
            }),
        }
      : undefined;

    const start = Date.now();
    let lastError: ProviderError | undefined;

    for (let i = 0; i < candidates.length; i += 1) {
      const provider = candidates[i] as ModelProvider;
      try {
        const result = await provider.complete(completionRequest, hooks);
        return {
          requestId: request.requestId,
          ok: true,
          result: {
            text: result.text,
            model: result.model,
            provider: result.provider,
            ...(result.usage ? { usage: result.usage } : {}),
            ...(result.stopReason !== undefined ? { stopReason: result.stopReason } : {}),
          },
          meta: {
            provider: result.provider,
            model: result.model,
            durationMs: Date.now() - start,
            ...(result.usage ? { usage: result.usage } : {}),
          },
        };
      } catch (err) {
        const pe =
          err instanceof ProviderError
            ? err
            : new ProviderError(provider.name, errText(err), { retryable: false });
        lastError = pe;
        log?.warn("provider failed", { provider: provider.name, retryable: pe.retryable });

        const hasNext = i < candidates.length - 1;
        if (pe.retryable && hasNext) {
          this.emit?.({
            moduleId: this.id,
            type: "model.fallback",
            requestId: request.requestId,
            data: { from: provider.name, reason: pe.message },
          });
          continue;
        }
        break; // non-retryable, or no remaining candidates
      }
    }

    return this.fail(request.requestId, {
      code: ModelRouterErrorCode.PROVIDER_FAILED,
      category: "dependency",
      message: lastError?.message ?? "all providers failed",
      retryable: lastError?.retryable ?? false,
      ...(lastError?.detail !== undefined ? { cause: lastError.detail } : {}),
    });
  }

  private buildProviders(config: ModelRouterConfig): ModelProvider[] {
    const providers: ModelProvider[] = [];

    if (config.claude.enabled) {
      if (config.claude.apiKey !== undefined) {
        const client = this.anthropicClientFactory({
          apiKey: config.claude.apiKey,
          baseUrl: config.claude.baseUrl,
        });
        providers.push(
          new ClaudeProvider({
            client,
            defaultModel: config.claude.model,
            maxTokens: config.claude.maxTokens,
            priority: MODEL_ROUTER_DEFAULTS.claude.priority,
          }),
        );
      } else {
        this.logger?.warn("claude enabled but no apiKey configured; skipping provider");
      }
    }

    if (config.ollama.enabled) {
      providers.push(
        new OllamaProvider({
          baseUrl: config.ollama.baseUrl,
          defaultModel: config.ollama.model,
          maxTokens: config.ollama.maxTokens,
          priority: MODEL_ROUTER_DEFAULTS.ollama.priority,
          fetchImpl: this.fetchImpl,
        }),
      );
    }

    return providers;
  }

  private fail(requestId: string, error: ModuleError): ModuleResponse {
    return { requestId, ok: false, error };
  }
}

export { MODEL_ROUTER_CONFIG_SCHEMA };

function parsePayload(payload: unknown): ParsedPayload | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;

  if (!Array.isArray(p.messages) || p.messages.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const raw of p.messages) {
    if (typeof raw !== "object" || raw === null) return null;
    const m = raw as Record<string, unknown>;
    if (m.role !== "system" && m.role !== "user" && m.role !== "assistant") return null;
    if (typeof m.content !== "string") return null;
    messages.push({ role: m.role, content: m.content });
  }

  return {
    messages,
    model: typeof p.model === "string" ? p.model : undefined,
    provider: typeof p.provider === "string" ? p.provider : undefined,
    maxTokens: typeof p.maxTokens === "number" ? p.maxTokens : undefined,
    temperature: typeof p.temperature === "number" ? p.temperature : undefined,
    stream: p.stream === true,
  };
}

function deadlinePassed(deadline: string | undefined): boolean {
  if (deadline === undefined) return false;
  const ms = Date.parse(deadline);
  return Number.isFinite(ms) && ms <= Date.now();
}

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
