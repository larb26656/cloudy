#!/usr/bin/env bun
import { Command } from "commander";
import { createServer } from "./server";
import { initContainer } from "./container";
import { loadConfig } from "./config";
import { migrate } from "./db/migrate";

async function serveCommand(options: {
  ui: boolean;
  host: string;
  port: string;
  cors?: string;
  config?: string;
}) {
  const config = loadConfig(options.config);
  initContainer(config);

  console.log("Running migrations...");
  await migrate(config.dbDatabaseUrl);

  const port = parseInt(options.port, 10);
  const corsOrigins = options.cors?.split(",").map((o) => o.trim()) ?? [];
  const enableUI = options.ui;

  const server = createServer({ corsOrigins, enableUI });
  server.listen(port);

  console.log(
    `Starting server on ${server.server?.hostname}:${server.server?.port}...`
  );
  console.log(`📁 Config: ${config.configDir}`);
}

const program = new Command();

program
  .name("cloudy")
  .description("Cloudy AI agent CLI")
  .version("1.0.0");

program
  .command("serve")
  .description("Start Cloudy server")
  .option("--ui", "Serve static UI from public/")
  .option("-h, --host <address>", "Host to bind", "localhost")
  .option("-p, --port <number>", "Port number", "3000")
  .option("--cors <origins>", "Allowed CORS origins (comma-separated)")
  .option("--config <path>", "Config directory (default: ~/.config/cloudy)")
  .action(serveCommand);

program.parse();
