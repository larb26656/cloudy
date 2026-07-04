import { serve, type ServerType } from '@hono/node-server';
import { createApp } from '../server';
import { initContainer } from '../container';
import { loadConfig } from '../config/config';
import { runMigrations } from '@repo/database';

export interface ServerOptions {
  host?: string;
  port?: number;
  dataDir?: string;
  configDir?: string;
  corsOrigins?: string[];
  enableUI?: boolean;
  publicDir?: string;
  dbMigrationsDir?: string;
}

export function createServer(options: ServerOptions) {
  let server: ServerType | null = null;

  const start = async () => {
    const config = loadConfig({
      configDir: options.configDir,
      dataDir: options.dataDir,
      ui: options.enableUI,
      host: options.host?.toString(),
      port: options.port?.toString(),
      cors: options.corsOrigins?.join(','),
    });

    await runMigrations(config.dataDir, options.dbMigrationsDir);

    await initContainer(config);

    const app = createApp({
      corsOrigins: config.cors,
      enableUI: config.ui,
      publicDir: options.publicDir,
    });

    server = serve({
      fetch: app.fetch,
      port: config.port,
      hostname: config.host,
    });

    const url = `http://${config.host}:${config.port}`;
    return { url };
  };

  const stop = async () => {
    server?.close();
    server = null;
  };

  return { start, stop };
}