import path from "node:path";
import type { AppConfig } from "../../config";
import { updateFileConfig } from "../../config/file-loader";
import type { ProviderSettings } from "./model";

export function createSettingsService(config: AppConfig, configDir?: string) {
  const settingsDir = configDir ?? path.dirname(config.dbPath);

  return {
    getProviders() {
      return config.providers;
    },
    updateProviders(providers: { opencode: ProviderSettings }) {
      updateFileConfig(settingsDir, (current) => {
        const next = { ...current, providers };
        Reflect.deleteProperty(next, "opencodeApiBase");
        return next;
      });
      return { providers, restartRequired: true };
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
