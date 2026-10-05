import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);

const sqliteDir = dirname(require.resolve("better-sqlite3/package.json"));
const { version: electronVersion } = require("electron/package.json") as {
  version: string;
};
const nodeGypBin = require.resolve("node-gyp/bin/node-gyp.js");

console.log(
  `rebuilding better-sqlite3 at ${sqliteDir} for electron ${electronVersion} (${process.arch})`,
);

execFileSync(
  process.execPath,
  [
    nodeGypBin,
    "rebuild",
    "--release",
    `--target=${electronVersion}`,
    `--arch=${process.arch}`,
    "--dist-url=https://electronjs.org/headers",
  ],
  { cwd: sqliteDir, stdio: "inherit" },
);
