#!/usr/bin/env bun
import { Command } from "commander";
import pc from "picocolors";
import { createServer } from "./server";
import { initContainer } from "./container";
import { loadConfig } from "./config";
import { migrate } from "./db/migrate";

function makeText(): string {
	return pc.cyan([
		"  .oooooo.   oooo                              .o8             ",
		" d8P'  `Y8b  `888                             \"888             ",
		"888           888   .ooooo.  oooo  oooo   .oooo888  oooo    ooo",
		"888           888  d88' `88b `888  `888  d88' `888   `88.  .8' ",
		"888           888  888   888  888   888  888   888    `88..8'  ",
		"`88b    ooo   888  888   888  888   888  888   888     `888'   ",
		" `Y8bood8P'  o888o `Y8bod8P'  `V88V\"V8P' `Y8bod88P\"     .8'    ",
		"                                                    .o..P'     ",
		"                                                    `Y8P'      ",
	].join("\n"))
}

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

  console.log(makeText());
  console.log("");
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
