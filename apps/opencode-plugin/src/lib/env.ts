export const env = {
  ASSISTANT_AI_BASE_PATH: process.env.ASSISTANT_AI_BASE_PATH || "./base-path",
  OC_API_BASE_PATH: process.env.OC_API_BASE_PATH || "http://localhost:4096",
  DB_DATA_DIR: process.env.DB_DATA_DIR || "./data",
  DB_DATABASE_URL: process.env.DB_DATABASE_URL || "file:./data/local.db",
} as const;
