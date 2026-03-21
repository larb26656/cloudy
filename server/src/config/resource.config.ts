import { env } from './env';

export const resourceConfig = {
    base: env.ASSISTANT_AI_BASE_PATH,
    idea: `${env.ASSISTANT_AI_BASE_PATH}/idea`,
    memory: `${env.ASSISTANT_AI_BASE_PATH}/memory`,
} as const;
