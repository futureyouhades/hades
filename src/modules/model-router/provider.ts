/**
 * Model provider abstraction — Phase 1a (IMPLEMENTATION_ROADMAP §Phase 1a).
 *
 * The Model Router talks to every LLM backend through this one interface, so a
 * new provider (OpenAI, Gemini, Grok, DeepSeek, …) is added by implementing
 * `ModelProvider` and registering it — never by changing the router (R10.4).
 *
 * Providers are passive and stateless w.r.t. routing: they translate a neutral
 * CompletionRequest into their own API and back, report health, and throw a
 * `ProviderError` (with an honest `retryable`) on failure. They do NOT decide
 * routing, fallback, or retry — that is the router's / Commander's job (R7.3).
 */

/** Neutral chat message, provider-agnostic. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  /** Explicit model id; when absent the provider uses its configured default. */
  model?: string;
  /** Upper bound on generated tokens; provider falls back to its config default. */
  maxTokens?: number;
  /**
   * Sampling temperature. Provider-specific: providers that reject it (e.g.
   * Claude Opus 4.8) MUST ignore it rather than forward it. See ClaudeProvider.
   */
  temperature?: number;
  /** Request incremental output as events (ADR-001 #6); see StreamHooks. */
  stream?: boolean;
}

export interface CompletionResult {
  text: string;
  /** The concrete model that served the request. */
  model: string;
  /** The provider name that served the request. */
  provider: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  stopReason?: string;
}

/** Optional streaming sink — the router wires this to ModuleEvents (ADR-001 #6). */
export interface StreamHooks {
  onToken?: (delta: string) => void;
}

export interface ProviderHealth {
  ok: boolean;
  detail?: string;
  latencyMs?: number;
}

/**
 * A provider failure expressed as data the router can act on. `retryable` is set
 * honestly (R7.3) so the router can fall through to the next provider on a
 * transient failure (429/5xx/network) but stop on a permanent one (4xx).
 */
export class ProviderError extends Error {
  readonly providerName: string;
  readonly retryable: boolean;
  readonly detail: string | undefined;

  constructor(
    providerName: string,
    message: string,
    options: { retryable: boolean; detail?: string },
  ) {
    super(message);
    this.name = "ProviderError";
    this.providerName = providerName;
    this.retryable = options.retryable;
    this.detail = options.detail;
  }
}

export interface ModelProvider {
  /** Stable provider name (e.g. "claude", "ollama"). */
  readonly name: string;
  /** Selection priority: lower wins. Claude (primary) < Ollama (fallback). */
  readonly priority: number;
  /** The model used when a request names none. */
  readonly defaultModel: string;

  /** True if this provider serves the given capability (e.g. "complete"). */
  supports(capability: string): boolean;
  /** True if this provider can serve an explicitly-requested model id. */
  serves(model: string): boolean;

  /** Perform a completion, optionally streaming tokens via `hooks`. */
  complete(request: CompletionRequest, hooks?: StreamHooks): Promise<CompletionResult>;

  /** Cheap, side-effect-light health probe for routing/health (R4.1, R4.2). */
  health(): Promise<ProviderHealth>;
}
