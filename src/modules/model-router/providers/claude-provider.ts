/**
 * ClaudeProvider — the primary reasoning model (roadmap Confirmed Decision 1).
 *
 * Translates the neutral CompletionRequest into an Anthropic Messages call via
 * the injected AnthropicClient port. Two model-specific rules from the Claude
 * API reference are enforced here:
 *  - system-role messages are hoisted into the top-level `system` field;
 *  - `temperature` is NOT forwarded (Opus 4.8 rejects it with a 400).
 */

import { COMPLETE_CAPABILITY } from "../capabilities.js";
import {
  ProviderError,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResult,
  type ModelProvider,
  type ProviderHealth,
  type StreamHooks,
} from "../provider.js";
import type { AnthropicClient } from "./anthropic-client.js";

export interface ClaudeProviderOptions {
  client: AnthropicClient;
  defaultModel: string;
  maxTokens: number;
  priority: number;
}

export class ClaudeProvider implements ModelProvider {
  readonly name = "claude";
  readonly priority: number;
  readonly defaultModel: string;

  private readonly client: AnthropicClient;
  private readonly maxTokens: number;

  constructor(options: ClaudeProviderOptions) {
    this.client = options.client;
    this.defaultModel = options.defaultModel;
    this.maxTokens = options.maxTokens;
    this.priority = options.priority;
  }

  supports(capability: string): boolean {
    return capability === COMPLETE_CAPABILITY;
  }

  serves(model: string): boolean {
    return model.toLowerCase().startsWith("claude");
  }

  async complete(request: CompletionRequest, hooks?: StreamHooks): Promise<CompletionResult> {
    const system = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const turns = request.messages
      .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const model = request.model ?? this.defaultModel;

    try {
      // temperature intentionally dropped — Opus 4.8 rejects sampling params.
      const result = await this.client.createMessage({
        model,
        maxTokens: request.maxTokens ?? this.maxTokens,
        ...(system.length > 0 ? { system } : {}),
        messages: turns,
      });

      // Phase 1a wires the streaming event path (ADR-001 #6) with a single
      // chunk; incremental token streaming is a later enhancement and needs no
      // contract change.
      if (request.stream === true && hooks?.onToken && result.text.length > 0) {
        hooks.onToken(result.text);
      }

      return {
        text: result.text,
        model: result.model,
        provider: this.name,
        usage: result.usage,
        ...(result.stopReason !== null ? { stopReason: result.stopReason } : {}),
      };
    } catch (err) {
      throw toProviderError(this.name, err);
    }
  }

  async health(): Promise<ProviderHealth> {
    // Cheap by design (R4.1): a live ping would incur per-call billing/latency.
    // The provider only exists when an API key was configured, so report ready.
    return { ok: true, detail: "configured (not live-probed)" };
  }
}

/** Map an SDK/transport error to a ProviderError with an honest `retryable`. */
function toProviderError(provider: string, err: unknown): ProviderError {
  const status = (err as { status?: number }).status;
  const message = err instanceof Error ? err.message : String(err);
  // 429 and 5xx are transient; a missing status means a connection error.
  const retryable = status === undefined || status === 429 || status >= 500;
  return new ProviderError(provider, `claude request failed: ${message}`, {
    retryable,
    detail: status !== undefined ? `http ${status}` : "connection error",
  });
}
