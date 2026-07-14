/**
 * Model Router configuration — MODULE_CONTRACT.md §9.
 *
 * The module declares this schema; the Kernel's ConfigLoader validates resolved
 * values against it before init() (R9.1) and resolves the Claude API key from
 * the secrets layer (R9.3). Every value has a documented default or is optional
 * (R9.5); nothing is hardcoded in behavior (R3.2).
 */

import type { JSONSchema } from "../../kernel/contract/index.js";

/** Defaults (R9.5). Claude is primary; Ollama is the local fallback. */
export const MODEL_ROUTER_DEFAULTS = {
  claude: { model: "claude-opus-4-8", maxTokens: 4096, priority: 0 },
  ollama: { model: "llama3.1", maxTokens: 4096, baseUrl: "http://localhost:11434", priority: 10 },
} as const;

export const MODEL_ROUTER_CONFIG_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    claude: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        model: { type: "string" },
        /** Resolved from a `{ $secret: "CLAUDE_API_KEY" }` reference (R9.3). */
        apiKey: { type: "string" },
        maxTokens: { type: "integer", minimum: 1 },
        baseUrl: { type: "string" },
      },
      additionalProperties: false,
    },
    ollama: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        model: { type: "string" },
        baseUrl: { type: "string" },
        maxTokens: { type: "integer", minimum: 1 },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

export interface ClaudeProviderConfig {
  enabled: boolean;
  model: string;
  apiKey: string | undefined;
  maxTokens: number;
  baseUrl: string | undefined;
}

export interface OllamaProviderConfig {
  enabled: boolean;
  model: string;
  baseUrl: string;
  maxTokens: number;
}

export interface ModelRouterConfig {
  claude: ClaudeProviderConfig;
  ollama: OllamaProviderConfig;
}

/** Read a nested object value defensively (config is `unknown`-typed at the edge). */
function section(values: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = values[key];
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

/**
 * Project validated config values onto a typed, fully-defaulted shape. The
 * loader has already validated against the schema, so this only applies
 * defaults and narrows types — it performs no I/O.
 */
export function parseModelRouterConfig(values: Record<string, unknown>): ModelRouterConfig {
  const claude = section(values, "claude");
  const ollama = section(values, "ollama");
  const d = MODEL_ROUTER_DEFAULTS;

  return {
    claude: {
      enabled: typeof claude.enabled === "boolean" ? claude.enabled : true,
      model: typeof claude.model === "string" ? claude.model : d.claude.model,
      apiKey: typeof claude.apiKey === "string" ? claude.apiKey : undefined,
      maxTokens: typeof claude.maxTokens === "number" ? claude.maxTokens : d.claude.maxTokens,
      baseUrl: typeof claude.baseUrl === "string" ? claude.baseUrl : undefined,
    },
    ollama: {
      enabled: typeof ollama.enabled === "boolean" ? ollama.enabled : true,
      model: typeof ollama.model === "string" ? ollama.model : d.ollama.model,
      baseUrl: typeof ollama.baseUrl === "string" ? ollama.baseUrl : d.ollama.baseUrl,
      maxTokens: typeof ollama.maxTokens === "number" ? ollama.maxTokens : d.ollama.maxTokens,
    },
  };
}
