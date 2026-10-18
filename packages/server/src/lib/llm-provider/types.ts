import type { ModelInfo } from "@repo/ai-core";
import z from "zod";

export interface ChatEvent {
  text: string;
}

export interface ChatInput {
  model: string;
  messages?: { role: "system" | "user" | "assistant"; content: string }[];
  message: string;
  signal?: AbortSignal;
}

export interface LLMProviderAdapter {
  chat(input: ChatInput): Promise<string>;
  chatAsync(input: ChatInput): AsyncIterable<ChatEvent>;
}

export interface LLMProviderDefinition<TConfig = unknown> {
  configSchema: z.ZodType<TConfig>;
  settings: {
    name: string;
    configFields: {
      key: string;
      label: string;
      type: "text" | "url" | "secret";
      required?: boolean;
    }[];
  };
  create(config: TConfig): LLMProviderAdapter;
}

export interface LLMClient extends LLMProviderAdapter {
  id: string;
  providerType: string;
  models: ModelInfo[];
}
