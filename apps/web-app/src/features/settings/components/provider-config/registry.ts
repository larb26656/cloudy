import type { ComponentType } from "react";
import type { AgentProviderInstance } from "@/hooks/queries/useAgentProviderSettings";
import { OpenCodeConfigFields } from "./OpenCodeConfigFields";

type ProviderConfigFieldsProps = {
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  label?: string;
};

export const providerConfigForms = {
  opencode: OpenCodeConfigFields,
} satisfies Record<
  AgentProviderInstance["templateId"],
  ComponentType<ProviderConfigFieldsProps>
>;

export function getProviderConfigForm(templateId: string) {
  if (!Object.hasOwn(providerConfigForms, templateId)) return undefined;
  return providerConfigForms[templateId as keyof typeof providerConfigForms];
}
