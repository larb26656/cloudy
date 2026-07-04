import { cp, rm, mkdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverDist = join(root, "apps", "server", "dist");

const sources = {
  public: join(root, "apps", "web-app", "dist"),
  drizzle: join(root, "packages", "database", "drizzle"),
};

const targets = {
  public: join(serverDist, "public"),
  drizzle: join(serverDist, "drizzle"),
};

async function existsDir(p: string): Promise<boolean> {
  const s = await stat(p).catch(() => null);
  return !!s?.isDirectory();
}

async function copyDir(src: string, dest: string): Promise<void> {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
  console.log(`✓ ${relative(root, src)} → ${relative(root, dest)}`);
}

async function main() {
  if (!(await existsDir(serverDist))) {
    console.error(
      `✗ server dist not built: ${relative(root, serverDist)} (run 'pnpm build' first)`,
    );
    process.exit(1);
  }

  if (await existsDir(sources.public)) {
    await copyDir(sources.public, targets.public);
  } else {
    console.log(
      "· skip public (web-app not built; run 'pnpm build:web-app' first)",
    );
  }

  await copyDir(sources.drizzle, targets.drizzle);

  console.log(`\n✓ Bundle assets assembled in ${relative(root, serverDist)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
