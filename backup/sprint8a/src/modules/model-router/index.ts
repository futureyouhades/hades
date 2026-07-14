/**
 * Model Router module — public surface (Phase 1a).
 *
 * Claude primary, Ollama fallback, behind a provider abstraction that admits new
 * providers (OpenAI, Gemini, Grok, …) by implementing ModelProvider — no change
 * to the router or Commander (R10.4).
 */

export { ModelRouterModule, type ModelRouterOptions } from "./model-router.js";
export {
  MODEL_ROUTER_CONFIG_SCHEMA,
  MODEL_ROUTER_DEFAULTS,
  parseModelRouterConfig,
  type ModelRouterConfig,
} from "./config.js";
export { COMPLETE_CAPABILITY, COMPLETE_CAPABILITY_SPEC } from "./capabilities.js";
export { ModelRouterErrorCode } from "./errors.js";
export {
  PrioritySelectionPolicy,
  type SelectionPolicy,
  type SelectionQuery,
} from "./selection.js";
export {
  ProviderError,
  type ModelProvider,
  type CompletionRequest,
  type CompletionResult,
  type ChatMessage,
  type ProviderHealth,
  type StreamHooks,
} from "./provider.js";
export { ClaudeProvider, type ClaudeProviderOptions } from "./providers/claude-provider.js";
export { OllamaProvider, type OllamaProviderOptions, type FetchLike } from "./providers/ollama-provider.js";
export {
  SdkAnthropicClient,
  type AnthropicClient,
  type AnthropicMessageParams,
  type AnthropicMessageResult,
} from "./providers/anthropic-client.js";
