import type { ApiProvider, ApiProviderRegistry } from "./type";

export function createApiProviderRegistry(): ApiProviderRegistry {
  const providers = new Map<string, ApiProvider>();

  return {
    list: () => Array.from(providers.values()),

    listModels: () =>
      Array.from(providers.values()).flatMap((provider) => provider.models),

    getById: (id) => providers.get(id),

    register: (id, adapter, models) => {
      providers.set(id, {
        id,
        ...adapter,
        models: models.map((model) => ({ ...model, providerId: id })),
      });
    },

    deleteById: (id) => providers.delete(id),
  };
}
