import type { ModelCapabilities, ModelInfo } from "@repo/contracts";

interface LegacyModelConfig {
  providerID?: string;
  modelID?: string;
  name?: string;
  description?: string;
  maxTokens?: number;
  supportsStreaming?: boolean;
  supportsTools?: boolean;
}

function toCapabilities(legacy: LegacyModelConfig): ModelCapabilities {
  const capabilities: ModelCapabilities = {};
  if (legacy.supportsStreaming !== undefined) {
    capabilities.streaming = legacy.supportsStreaming;
  }
  if (legacy.supportsTools !== undefined) {
    capabilities.tools = legacy.supportsTools;
  }
  if (legacy.maxTokens !== undefined) {
    capabilities.maxInputTokens = legacy.maxTokens;
  }
  return capabilities;
}

/**
 * Normalize a persisted model reference to `ModelInfo`. Accepts the current
 * `providerId`/`modelId` shape as well as the legacy `providerID`/`modelID`
 * shape written by pre-migration stores; returns null when the value carries
 * no usable identity.
 */
export function toModelInfo(value: unknown): ModelInfo | null {
  if (!value || typeof value !== "object") return null;
  const model = value as LegacyModelConfig & Partial<ModelInfo>;
  const providerId = model.providerId ?? model.providerID;
  const modelId = model.modelId ?? model.modelID;
  if (!providerId || !modelId) return null;
  const legacyCapabilities = toCapabilities(model);
  return {
    providerId,
    modelId,
    name: model.name ?? modelId,
    description: model.description,
    capabilities:
      Object.keys(legacyCapabilities).length > 0
        ? legacyCapabilities
        : model.capabilities,
  };
}
