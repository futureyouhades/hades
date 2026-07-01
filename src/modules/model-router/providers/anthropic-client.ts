/**
 * Anthropic client port + SDK adapter.
 *
 * ClaudeProvider depends on this narrow port, not on the SDK directly, so it is
 * unit-testable with a fake and the official `@anthropic-ai/sdk` stays isolated
 * to one adapter (the skill's "call Claude through the official SDK" rule).
 */

import Anthropic from "@anthropic-ai/sdk";

export interface AnthropicMessageParams {
  model: string;
  maxTokens: number;
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AnthropicMessageResult {
  text: string;
  model: string;
  stopReason: string | null;
  usage: { inputTokens: number; outputTokens: number };
}

export interface AnthropicClient {
  createMessage(params: AnthropicMessageParams): Promise<AnthropicMessageResult>;
}

export interface SdkAnthropicClientOptions {
  apiKey: string;
  baseUrl?: string | undefined;
}

/**
 * Real adapter over the official SDK. Note: Opus 4.8 rejects `temperature` /
 * `top_p` / `top_k` (400), so this adapter never forwards sampling params — the
 * ClaudeProvider strips them before calling here.
 */
export class SdkAnthropicClient implements AnthropicClient {
  private readonly client: Anthropic;

  constructor(options: SdkAnthropicClientOptions) {
    this.client = new Anthropic({
      apiKey: options.apiKey,
      ...(options.baseUrl !== undefined ? { baseURL: options.baseUrl } : {}),
    });
  }

  async createMessage(params: AnthropicMessageParams): Promise<AnthropicMessageResult> {
    const message = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      ...(params.system !== undefined ? { system: params.system } : {}),
      messages: params.messages,
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      text,
      model: message.model,
      stopReason: message.stop_reason,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
