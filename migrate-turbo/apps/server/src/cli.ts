import { Command } from "commander";
import pc from "picocolors";
import { createServer } from "@repo/server";

function makeText(): string {
  return pc.cyan(
    [
      "  .oooooo.   oooo                              .o8             ",
      " d8P'  `Y8b  `888                             \"888             ",
      "888           888   .ooooo.  oooo  oooo   .oooo888  oooo    ooo",
      "888           888  d88' `88b `888  `888  d88' `888   `88.  .8' ",
      "888           888  888   888  888   888  888   888    `88..8'  ",
      "`88b    ooo   888  888   888  888   888  888   888     `888'   ",
      " `Y8bood8P'  o888o `Y8bod8P'  `V88V\"V8P' `Y8bod88P\"     .8'    ",
      "                                                    .o..P'     ",
      "                                                    `Y8P'      ",
    ].join("\n"),
  );
}

async function serveCommand(options: {
  ui?: boolean;
  host?: string;
  port?: string;
  cors?: string;
  config?: string;
  dataDir?: string;
}) {
  const server = createServer({
    configDir: options.config,
    dataDir: options.dataDir,
    enableUI: options.ui,
    host: options.host,
    port: options.port ? Number.parseInt(options.port, 10) : undefined,
    corsOrigins: options.cors
      ? options.cors.split(",").map((o) => o.trim())
      : undefined,
  });

  console.log(makeText());
  console.log("");
  console.log("Running migrations...");

  const { url } = await server.start();
  console.log(`Starting server on ${url}...`);
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
  .option("-h, --host <address>", "Host to bind")
  .option("-p, --port <number>", "Port number")
  .option("--cors <origins>", "Allowed CORS origins (comma-separated)")
  .option(
    "--config <path>",
    "Config directory (default: ~/.config/cloudy)",
  )
  .option(
    "--dataDir <path>",
    "Config data directory (default: ~/.config/cloudy/data)",
  )
  .action(serveCommand);

program.parse();
