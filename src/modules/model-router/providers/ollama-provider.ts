/**
 * OllamaProvider — the local fallback model (roadmap Confirmed Decision 1).
 *
 * Talks to a local Ollama server's /api/chat endpoint over an injected fetch
 * (so it is unit-testable without a network). Ollama, unlike Claude, accepts a
 * sampling temperature, so it is forwarded when provided.
 */

import { COMPLETE_CAPABILITY } from "../capabilities.js";
import {
  ProviderError,
  type CompletionRequest,
  type CompletionResult,
  type ModelProvider,
  type ProviderHealth,
  type StreamHooks,
} from "../provider.js";

export type FetchLike = typeof fetch;

export interface OllamaProviderOptions {
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
  priority: number;
  fetchImpl: FetchLike;
}

interface OllamaChatResponse {
  message?: { content?: string };
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaProvider implements ModelProvider {
  readonly name = "ollama";
  readonly priority: number;
  readonly defaultModel: string;

  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: OllamaProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.defaultModel = options.defaultModel;
    this.maxTokens = options.maxTokens;
    this.priority = options.priority;
    this.fetchImpl = options.fetchImpl;
  }

  supports(capability: string): boolean {
    return capability === COMPLETE_CAPABILITY;
  }

  serves(model: string): boolean {
    // Ollama serves any non-Claude model id (llama*, mistral*, qwen*, …).
    return !model.toLowerCase().startsWith("claude");
  }

  async complete(request: CompletionRequest, hooks?: StreamHooks): Promise<CompletionResult> {
    const model = request.model ?? this.defaultModel;
    const options: Record<string, unknown> = {
      num_predict: request.maxTokens ?? this.maxTokens,
    };
    if (request.temperature !== undefined) options.temperature = request.temperature;

    const body = JSON.stringify({
      model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      options,
    });

    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
    } catch (err) {
      throw new ProviderError(this.name, `ollama request failed: ${errText(err)}`, {
        retryable: true,
        detail: "connection error",
      });
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new ProviderError(this.name, `ollama returned http ${response.status}`, {
        retryable,
        detail: `http ${response.status}`,
      });
    }

    const data = (await response.json()) as OllamaChatResponse;
    const text = data.message?.content ?? "";

    if (request.stream === true && hooks?.onToken && text.length > 0) {
      hooks.onToken(text);
    }

    return {
      text,
      model,
      provider: this.name,
      usage: {
        ...(data.prompt_eval_count !== undefined ? { inputTokens: data.prompt_eval_count } : {}),
        ...(data.eval_count !== undefined ? { outputTokens: data.eval_count } : {}),
      },
      ...(data.done_reason !== undefined ? { stopReason: data.done_reason } : {}),
    };
  }

  async health(): Promise<ProviderHealth> {
    // Real dependency probe (R4.2): list local models. Cheap and local (R4.1).
    const start = Date.now();
    try {
      const res = await this.fetchImpl(`${this.baseUrl}/api/tags`, { method: "GET" });
      const latencyMs = Date.now() - start;
      return res.ok
        ? { ok: true, latencyMs }
        : { ok: false, latencyMs, detail: `http ${res.status}` };
    } catch (err) {
      return { ok: false, detail: errText(err) };
    }
  }
}

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
