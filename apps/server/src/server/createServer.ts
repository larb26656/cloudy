import { serve, type ServerType } from '@hono/node-server';
import { createApp } from '../server';
import { initContainer } from '../container';
import { loadConfig } from '../config/config';
import { startCleanupCron } from '../features/serve';
import { migrate } from '@server/db/migrate';

export interface ServerOptions {
  host?: string;
  port?: number;
  dataDir?: string;
  configDir?: string;
  corsOrigins?: string[];
  enableUI?: boolean;
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

    await migrate(config.dbDatabaseUrl, options.dbMigrationsDir);
    initContainer(config);

    const app = createApp({ corsOrigins: config.cors, enableUI: config.ui });
    startCleanupCron();

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