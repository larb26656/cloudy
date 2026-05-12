import { defineConfig } from 'vite';
import path from 'node:path';

const serverPath = path.resolve(__dirname, '../server/src');

export default defineConfig({
  resolve: {
    alias: {
      '@cloudy/server': serverPath,
    },
  },
  build: {
    rollupOptions: {
      external: [
        '@libsql/*',
        'picocolors',
        'gray-matter',
        '@hono/node-server',
        '@hono/zod-validator',
        '@libsql/client',
        'commander',
        'node-cron',
        'hono-openapi',
      ],
    },
  },
});
