import type { ModelInfo } from "@repo/ai-core";

export interface ChatEvent {
  text: string;
}

export interface ChatInput {
  model: string;
  message: string;
}

export interface ApiProviderAdapter {
  chat(input: ChatInput): Promise<string>;
  chatAsync(input: ChatInput): AsyncIterable<ChatEvent>;
}

export interface ApiProvider extends ApiProviderAdapter {
  id: string;
  models: ModelInfo[];
}

export interface ApiProviderRegistry {
  list(): Array<ApiProvider>;
  listModels(): ModelInfo[];
  getById(id: string): ApiProvider | undefined;
  register(
    id: string,
    adapter: ApiProviderAdapter,
    models: Omit<ModelInfo, "providerId">[],
  ): void;
  deleteById(id: string): boolean;
}
