import type { ProviderAdapter } from "@repo/ai-core";
import { createOpenCodeAdapter } from "./opencode/opencode.adapter";

const providerTemplates = {
  opencode: {
    id: "opencode",
    name: "OpenCode",
    description: "Connect to an OpenCode server.",
    create(config: ProviderInstanceConfig): ProviderAdapter {
      return createOpenCodeAdapter({ id: config.id, baseUrl: config.baseUrl });
    },
  },
} as const;

export interface ProviderInstanceConfig {
  id: string;
  name: string;
  templateId: keyof typeof providerTemplates;
  enabled: boolean;
  baseUrl: string;
}

export function createProviderTemplateRegistry() {
  return {
    list() {
      return Object.values(providerTemplates).map(
        ({ id, name, description }) => ({
          id,
          name,
          description,
        }),
      );
    },
    create(config: ProviderInstanceConfig): ProviderAdapter {
      const template = providerTemplates[config.templateId];
      return template.create(config);
    },
  };
}
