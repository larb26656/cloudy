import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { mkdirSync } from "node:fs";
import type { DatabaseConfig } from "./config";
import * as schema from "./schema";

export type AppDatabase = ReturnType<DbClient["getDb"]>;

export class DbClient {
  private db: PGlite | null = null;
  private drizzle: ReturnType<typeof drizzle> | null = null;

  constructor(private config: DatabaseConfig) {}

  private ensureDataDir() {
    mkdirSync(this.config.dbPath, { recursive: true });
  }

  async init(): Promise<void> {
    this.ensureDataDir();
    this.db = new PGlite({ dataDir: this.config.dbPath });
    await this.db.waitReady;
    this.drizzle = drizzle(this.db, { schema });
  }

  getDb() {
    if (!this.drizzle) {
      throw new Error("DbClient not initialized. Call init() first.");
    }
    return this.drizzle;
  }

  async close(): Promise<void> {
    await this.db?.close();
    this.db = null;
    this.drizzle = null;
  }
}
