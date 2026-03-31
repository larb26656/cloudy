export const env = {
    ASSISTANT_AI_BASE_PATH: process.env.ASSISTANT_AI_BASE_PATH || './base-path',
    OC_API_BASE_PATH: process.env.OC_API_BASE_PATH || 'http://localhost:4096',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'file:local.db',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
} as const;
