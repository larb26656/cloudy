import { serve, type ServerType } from '@hono/node-server';
import { createApp } from '../server';
import { initContainer } from '../container';
import { loadConfig } from '../config/config';
import { migrate, getMigrationFiles } from '../db/migrate';
import { startCleanupCron } from '../features/serve';
import { join } from 'path';

export interface ServerOptions {
  host?: string;
  port?: number;
  dataDir?: string;
  configDir?: string;
  corsOrigins?: string[];
  enableUI?: boolean;
}

const getServerMigrationsDir = () => {
  const serverSrcDir = join(process.cwd(), 'apps', 'server', 'src', 'db', 'migrations');
  const localMigrationsDir = join(process.cwd(), 'src', 'db', 'migrations');
  if (require('fs').existsSync(serverSrcDir)) {
    return serverSrcDir;
  }
  return localMigrationsDir;
};

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

    const migrationsDir = getServerMigrationsDir();
    // await migrate(config.dbDatabaseUrl);
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