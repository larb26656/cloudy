// hooks/useModels.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { ModelConfig, ModelProvider } from '../types';

interface ProviderResponse {
  all: {
    id: string;
    name: string;
    source: string;
    models: Record<string, {
      id: string;
      providerID: string;
      name: string;
      family: string;
      capabilities: {
        reasoning: boolean;
        toolcall: boolean;
        attachment: boolean;
      };
      limit: {
        context: number;
        output: number;
      };
      status: string;
    }>;
  }[];
}

interface UseModelsReturn {
  providers: ModelProvider[];
  models: ModelConfig[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ProviderResponse>('/provider');
      
      const mappedProviders: ModelProvider[] = response.all.map((p) => ({
        id: p.id,
        name: p.name,
        models: Object.values(p.models)
          .filter((m) => m.status === 'active')
          .map((m) => ({
            providerID: p.id,
            modelID: m.id,
            name: m.name,
            description: `${m.family} • ${m.limit.context.toLocaleString()} context`,
            maxTokens: m.limit.context,
            supportsStreaming: true,
            supportsTools: m.capabilities.toolcall,
          })),
      })).filter((p) => p.models.length > 0);
      
      setProviders(mappedProviders);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch models:', err);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Flatten all models
  const allModels = providers.flatMap((p) => p.models);

  return {
    providers,
    models: allModels,
    isLoading,
    error,
    refetch: fetchModels,
  };
}
