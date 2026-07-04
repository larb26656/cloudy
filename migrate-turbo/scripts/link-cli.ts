import { existsSync, lstatSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliEntry = join(root, "apps", "server", "dist", "cli.js");
const target = "/usr/local/bin/cloudy";
const bunCloudy = join(homedir(), ".bun", "bin", "cloudy");

function main() {
  if (!existsSync(cliEntry)) {
    console.error(
      `✗ CLI not built: ${relative(root, cliEntry)}\n  Run 'pnpm build:full' first.`,
    );
    process.exit(1);
  }

  if (existsSync(bunCloudy)) {
    rmSync(bunCloudy, { force: true });
    console.log(`✓ Removed old cloudy at ${relative(homedir(), bunCloudy)}`);
  }

  if (existsSync(target) || isBrokenSymlink(target)) {
    rmSync(target, { force: true });
  }

  try {
    symlinkSync(cliEntry, target);
    console.log(`✓ Linked cloudy → ${relative(root, cliEntry)}`);
    console.log(`  ${target} → ${cliEntry}`);
    console.log(`\n  Run: cloudy serve --ui`);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EACCES") {
      console.log(`✗ Need sudo to write to ${target}\n`);
      console.log(`  Run this command:\n`);
      console.log(`  sudo ln -sf ${cliEntry} ${target}`);
      process.exit(1);
    }
    throw err;
  }
}

function isBrokenSymlink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink() && !existsSync(p);
  } catch {
    return false;
  }
}

main();
