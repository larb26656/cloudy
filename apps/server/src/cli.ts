#!/usr/bin/env bun
import { Command } from "commander";
import { createServer } from "./server";
import { initContainer } from "./container";
import { loadConfig } from "./config";
import { migrate } from "./db/migrate";

async function serveCommand(options: {
  ui?: boolean;
  host?: string;
  port?: string;
  cors?: string;
  config?: string;
  dataDir?: string;
}) {
  const config = loadConfig({
    configDir: options.config,
    dataDir: options.dataDir,
    ui: options.ui,
    host: options.host,
    port: options.port,
    cors: options.cors,
  });
  initContainer(config);

  console.log("Running migrations...");
  await migrate(config.dbDatabaseUrl);

  const server = createServer({ corsOrigins: config.cors, enableUI: config.ui });
  server.listen({ port: config.port, hostname: config.host });

  console.log(
    `Starting server on ${config.host}:${config.port}...`
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
  .option("--dataDir <path>", "Config data directory (default: ~/.config/cloudy/data)")
  .action(serveCommand);

program.parse();
