/**
 * Model Router capability manifest — MODULE_CONTRACT.md §5.
 *
 * The router advertises a single `complete` capability with machine-readable
 * input/output schemas (R5.2) so Commander can route to it purely by capability
 * (R5.1) and validate payloads. Adding providers never changes this manifest;
 * adding a *new* capability would (R5.3, R10.1).
 */

import type { Capability, JSONSchema } from "../../kernel/contract/index.js";

export const COMPLETE_CAPABILITY = "complete";

const MESSAGE_SCHEMA: JSONSchema = {
  type: "object",
  required: ["role", "content"],
  properties: {
    role: { type: "string", enum: ["system", "user", "assistant"] },
    content: { type: "string" },
  },
  additionalProperties: false,
};

const COMPLETE_INPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["messages"],
  properties: {
    messages: { type: "array", minItems: 1, items: MESSAGE_SCHEMA },
    model: { type: "string" },
    provider: { type: "string" },
    maxTokens: { type: "integer", minimum: 1 },
    temperature: { type: "number" },
    stream: { type: "boolean" },
  },
  additionalProperties: false,
};

const COMPLETE_OUTPUT_SCHEMA: JSONSchema = {
  type: "object",
  required: ["text", "model", "provider"],
  properties: {
    text: { type: "string" },
    model: { type: "string" },
    provider: { type: "string" },
    usage: {
      type: "object",
      properties: {
        inputTokens: { type: "integer" },
        outputTokens: { type: "integer" },
      },
    },
    stopReason: { type: "string" },
  },
};

export const COMPLETE_CAPABILITY_SPEC: Capability = {
  name: COMPLETE_CAPABILITY,
  description:
    "Generate a chat completion, automatically selecting the best available model provider (Claude primary, Ollama fallback).",
  inputSchema: COMPLETE_INPUT_SCHEMA,
  outputSchema: COMPLETE_OUTPUT_SCHEMA,
  tags: ["llm", "completion", "route-model"],
};
