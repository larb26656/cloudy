#!/usr/bin/env node
/**
 * Build-time extraction of a curated subset of vscode-icons into
 * `apps/web-app/src/lib/file-icons.generated.json`.
 *
 * The full `@iconify-json/vscode-icons` collection is ~1 MB gzipped (1574
 * icons). We only bundle the ~50 icons referenced by string literals in
 * `file-icons.ts` (≈30 KB gzipped), keeping the web-app bundle lean.
 *
 * Usage:
 *   pnpm --filter web-app generate:file-icons
 *
 * Re-run whenever the icon-name literals in `src/lib/file-icons.ts` change.
 * The generated file is committed so installs without the source collection
 * still work.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const webAppDir = resolve(repoRoot, "apps/web-app");

const sourcePath = resolve(webAppDir, "src/lib/file-icons.ts");
const outPath = resolve(webAppDir, "src/lib/file-icons.generated.json");

// Resolve through the web-app's node_modules so pnpm's symlink layout works.
const webAppRequire = createRequire(resolve(webAppDir, "package.json"));
const collectionPath = webAppRequire.resolve(
  "@iconify-json/vscode-icons/icons.json",
);

const source = readFileSync(sourcePath, "utf8");
const collection = JSON.parse(readFileSync(collectionPath, "utf8"));

// Match string literals that look like vscode-icons names.
// Covers EXTENSION_TO_ICON values, FILENAME_TO_ICON values, DEFAULT_FILE_ICON.
const nameRegex = /["']((?:file-type|default-file|folder-type|default-folder)[a-z0-9-]*)["']/g;
const wanted = new Set();
for (const match of source.matchAll(nameRegex)) wanted.add(match[1]);

if (wanted.size === 0) {
  console.error("✖ No icon names found in %s", sourcePath);
  process.exit(1);
}

const present = new Set(Object.keys(collection.icons ?? {}));
const missing = [...wanted].filter((n) => !present.has(n));
if (missing.length > 0) {
  console.warn(
    "⚠️  %d referenced icon(s) not present in collection (skipped):",
    missing.length,
  );
  for (const name of missing) console.warn("   • %s", name);
}

const icons = {};
for (const name of wanted) {
  if (present.has(name)) icons[name] = collection.icons[name];
}

const out = {
  prefix: collection.prefix,
  icons,
  // Preserve the source set's intrinsic dimensions — individual icons don't
  // carry width/height, so the collection-level value is the viewBox the
  // Iconify <Icon> uses. The `size` prop on <FileTypeIcon> still scales the
  // rendered <svg> to whatever pixel size we want.
  width: collection.width,
  height: collection.height,
};

writeFileSync(outPath, JSON.stringify(out) + "\n", "utf8");

const kbRaw = Buffer.byteLength(JSON.stringify(out), "utf8") / 1024;
console.log(
  "✓ Wrote %d icons → %s (%s KB raw)",
  Object.keys(icons).length,
  outPath.replace(repoRoot + "/", ""),
  kbRaw.toFixed(1),
);
