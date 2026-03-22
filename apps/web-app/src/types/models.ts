// types/models.ts

export interface ModelConfig {
  providerID: string;      // "openai", "anthropic", "local"
  modelID: string;         // "gpt-4", "claude-3-opus"
  name: string;            // Display name
  description?: string;    // Model capabilities
  maxTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

export interface ModelProvider {
  id: string;
  name: string;
  icon?: string;
  models: ModelConfig[];
}