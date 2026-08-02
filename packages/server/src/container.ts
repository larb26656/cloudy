import type { CloudyConfig } from "./config";
import { createProxyService } from "./features/proxy/proxy.service";
import { createInMemoryPtyRepository } from "./features/pty/in-memory-pty.repository";
import { createPtyService } from "./features/pty/pty.service";

/**
 * Build all wired services for the application. Manual DI: repositories →
 * services → controllers. Both features are factory-based after Phase 2. The
 * returned object is consumed by `createApp` / `createServer`.
 */
export function createContainer(config: CloudyConfig) {
  const ptyRepository = createInMemoryPtyRepository();
  const ptyService = createPtyService(ptyRepository);
  const proxyService = createProxyService(config.opencodeApiBase);
  return { ptyService, proxyService };
}

export type Container = ReturnType<typeof createContainer>;
