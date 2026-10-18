import type { ModelInfo } from "@repo/ai-core";
import z from "zod";

export interface ChatEvent {
  text: string;
}

export interface ChatInput {
  model: string;
  message: string;
}

export interface LLMProviderAdapter {
  chat(input: ChatInput): Promise<string>;
  chatAsync(input: ChatInput): AsyncIterable<ChatEvent>;
}

export interface LLMProviderDefinition<TConfig = unknown> {
  configSchema: z.ZodType<TConfig>;
  create(config: TConfig): LLMProviderAdapter;
}

export interface LLMClient extends LLMProviderAdapter {
  id: string;
  providerType: string;
  models: ModelInfo[];
}
