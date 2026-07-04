#!/usr/bin/env node

import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Command, InvalidOptionArgumentError } from "commander";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PACKAGES_PATH = join(ROOT, "packages");

interface Templates {
  packageJson: (name: string) => string;
  tsconfigJson: (name: string) => string;
  tsupConfig: (name: string) => string;
  vitestConfig: (name: string) => string;
  eslintConfig: (name: string) => string;
  srcIndex: (name: string) => string;
}

const TEMPLATES: Templates = {
  packageJson: (name) => `{
  "name": "@repo/${name}",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./*": "./dist/*.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^22.15.3",
    "eslint": "^9.39.1",
    "tsup": "^8.0.0",
    "typescript": "5.9.2",
    "vitest": "^2.0.0"
  }
}
`,

  tsconfigJson: () => `{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src", "*.test.ts"],
  "exclude": ["node_modules", "dist"]
}
`,

  tsupConfig: () => `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
`,

  vitestConfig: () => `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
`,

  eslintConfig: () => `import { config } from "@repo/eslint-config/base";

export default config;
`,

  srcIndex: () => ``,
};

function isValidPackageName(name: string): boolean {
  const kebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
  return kebabCaseRegex.test(name);
}

function packageExists(name: string): boolean {
  return readdirSync(PACKAGES_PATH).includes(name);
}

function validateName(name: string): string {
  if (!isValidPackageName(name)) {
    throw new InvalidOptionArgumentError(
      "Must be in kebab-case (e.g., my-package, my-new-package)",
    );
  }
  if (packageExists(name)) {
    throw new InvalidOptionArgumentError(
      `Package "${name}" already exists in packages/`,
    );
  }
  return name;
}

function createPackage(packageName: string, dryRun: boolean): void {
  const pkgPath = join(PACKAGES_PATH, packageName);
  const files: Record<string, string> = {
    "package.json": TEMPLATES.packageJson(packageName),
    "tsconfig.json": TEMPLATES.tsconfigJson(packageName),
    "tsup.config.ts": TEMPLATES.tsupConfig(packageName),
    "vitest.config.ts": TEMPLATES.vitestConfig(packageName),
    "eslint.config.js": TEMPLATES.eslintConfig(packageName),
    "src/index.ts": TEMPLATES.srcIndex(packageName),
  };

  console.log("\n" + "=".repeat(50));
  console.log(dryRun ? "🔍 [DRY RUN] Preview" : "🚀 Creating");
  console.log("=".repeat(50));

  if (dryRun) {
    console.log(`\n📁 Would create: ${pkgPath}/\n`);
    for (const file of Object.keys(files)) {
      console.log(`📄 Would create: ${file}`);
    }
    console.log("\n--- File Contents Preview ---\n");
    for (const [file, content] of Object.entries(files)) {
      console.log(`=== ${file} ===`);
      console.log(content);
      console.log();
    }
  } else {
    mkdirSync(pkgPath, { recursive: true });
    mkdirSync(join(pkgPath, "src"), { recursive: true });

    for (const [file, content] of Object.entries(files)) {
      const filePath = join(pkgPath, file);
      writeFileSync(filePath, content);
      console.log(`✅ Created: ${file}`);
    }

    console.log("\n✨ Package created successfully!");
    console.log(`\nNext steps:`);
    console.log(`  cd packages/${packageName}`);
    console.log(`  pnpm install`);
  }

  console.log();
}

async function main() {
  const program = new Command();

  program
    .name("generate:package")
    .description("📦 Generate a new package for agent-cloud-task monorepo")
    .version("1.0.0")
    .requiredOption(
      "-n, --name <name>",
      "Package name (kebab-case)",
      validateName,
    )
    .option("-d, --dry-run", "Preview without creating files", false);

  program.action((options) => {
    const { name, dryRun } = options;

    console.log("\n📦 Package Generator for agent-cloud-task\n");
    console.log("=".repeat(50));

    createPackage(name, dryRun);
  });

  await program.parseAsync(process.argv);
}

main().catch(console.error);
