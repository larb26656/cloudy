import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/features/**/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    driver: 'pglite',
});