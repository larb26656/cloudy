export const env = {
    ASSISTANT_AI_BASE_PATH: process.env.ASSISTANT_AI_BASE_PATH || './base-path',
    OC_API_BASE_PATH: process.env.OC_API_BASE_PATH || 'http://localhost:4096'
} as const;
