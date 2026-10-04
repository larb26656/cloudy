export interface ModelReference {
  providerId: string;
  modelId: string;
}

export interface ModelCapabilities {
  streaming?: boolean;
  tools?: boolean;
  reasoning?: boolean;
  vision?: boolean;
  attachments?: boolean;
  structuredOutput?: boolean;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface ModelVariantInfo {
  id: string;
  name: string;
}

export interface ModelInfo extends ModelReference {
  name: string;
  description?: string;
  capabilities?: ModelCapabilities;
  variants?: ModelVariantInfo[];
  variantId?: string;
  metadata?: Record<string, unknown>;
}
