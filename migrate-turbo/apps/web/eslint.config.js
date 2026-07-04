import { nextJsConfig } from "@repo/eslint-config/next-js";

/**
 * ESLint config for the Next.js web app.
 *
 * Layered on top of the shared Next.js config to enforce the type-only
 * boundary: this app may only consume API types via `@repo/contracts`.
 *
 * Importing `@repo/server` (or `@repo/database`) directly is forbidden because
 * those packages carry Node-only transitive deps (PGlite, `node:fs`, commander,
 * etc.) that would either fail to bundle for the browser or silently inflate
 * the bundle with dead code.
 *
 * Allowed:  `import type { AppType } from "@repo/contracts";`
 * Blocked:  `import { anything } from "@repo/server";`
 *
 * Schema note: ESLint 9's `no-restricted-imports` schema 1 wraps paths/patterns
 * inside a single options object. Both `paths` (exact match) and `patterns`
 * (glob match) are required to live in that same wrapper; mixing flat-array
 * (schema 0) and wrapper (schema 1) forms is rejected by the anyOf.
 */
const noServerRuntimeImports = {
  name: "web/no-server-runtime-imports",
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@repo/server",
            message:
              "Import @repo/server carries Node-only runtime deps that break browser bundles. Import types from @repo/contracts instead.",
            allowTypeImports: true,
          },
          {
            name: "@repo/database",
            message:
              "Import @repo/database carries Node-only runtime deps (PGlite, node:fs) that break browser bundles. Use @repo/contracts for types.",
            allowTypeImports: true,
          },
        ],
        patterns: [
          {
            group: ["@repo/server/*"],
            message:
              "Subpath imports from @repo/server are blocked in the browser. Use @repo/contracts.",
            allowTypeImports: true,
          },
          {
            group: ["@repo/database/*"],
            message:
              "Subpath imports from @repo/database are blocked in the browser. Use @repo/contracts.",
            allowTypeImports: true,
          },
        ],
      },
    ],
  },
};

/** @type {import("eslint").Linter.Config[]} */
export default [...nextJsConfig, noServerRuntimeImports];
