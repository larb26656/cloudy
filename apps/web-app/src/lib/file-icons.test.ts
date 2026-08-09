import { describe, it, expect } from "vitest";
import {
  getFileIconName,
  EXTENSION_TO_ICON,
  FILENAME_TO_ICON,
  DEFAULT_FILE_ICON,
} from "./file-icons";
// Static import so the test fails the build if the generated file is missing.
import bundledIcons from "./file-icons.generated.json" with { type: "json" };

const bundledNames = new Set(Object.keys(bundledIcons.icons ?? {}));

describe("getFileIconName", () => {
  describe("extension lookup", () => {
    it.each([
      ["foo.ts", "file-type-typescript"],
      ["foo.tsx", "file-type-reactts"],
      ["foo.js", "file-type-js"],
      ["foo.jsx", "file-type-reactjs"],
      ["foo.mjs", "file-type-js"],
      ["foo.cjs", "file-type-js"],
      ["foo.json", "file-type-json"],
      ["foo.jsonc", "file-type-json"],
      ["foo.md", "file-type-markdown"],
      ["foo.mdx", "file-type-markdown"],
      ["foo.py", "file-type-python"],
      ["foo.go", "file-type-go"],
      ["foo.rs", "file-type-rust"],
      ["foo.css", "file-type-css"],
      ["foo.scss", "file-type-scss"],
      ["foo.vue", "file-type-vue"],
      ["foo.yml", "file-type-yaml"],
      ["foo.yaml", "file-type-yaml"],
      ["foo.png", "file-type-image"],
      ["foo.jpg", "file-type-image"],
      ["foo.svg", "file-type-svg"],
      ["foo.mp4", "file-type-video"],
      ["foo.mp3", "file-type-audio"],
      ["foo.zip", "file-type-zip"],
      ["foo.pdf", "file-type-pdf2"],
      ["Dockerfile", "file-type-docker"],
      ["package.json", "file-type-npm"],
    ] as const)("%s → %s", (input, expected) => {
      expect(getFileIconName(input)).toBe(expected);
    });
  });

  describe("case-insensitivity", () => {
    it("lowercases the extension before lookup", () => {
      expect(getFileIconName("FOO.TS")).toBe("file-type-typescript");
      expect(getFileIconName("ReadMe.MD")).toBe("file-type-markdown");
      expect(getFileIconName("App.TSX")).toBe("file-type-reactts");
    });
  });

  describe("full-filename overrides (checked before extension)", () => {
    it("package.json resolves to npm, not generic json", () => {
      expect(getFileIconName("package.json")).toBe("file-type-npm");
      expect(getFileIconName("PACKAGE.JSON")).toBe("file-type-npm");
    });

    it("pnpm-lock.yaml resolves to pnpm", () => {
      expect(getFileIconName("pnpm-lock.yaml")).toBe("file-type-pnpm");
    });

    it("yarn.lock resolves to yarn", () => {
      expect(getFileIconName("yarn.lock")).toBe("file-type-yarn");
    });

    it("tsconfig.json resolves to tsconfig, not json", () => {
      expect(getFileIconName("tsconfig.json")).toBe("file-type-tsconfig");
    });

    it("Dockerfile resolves to docker", () => {
      expect(getFileIconName("Dockerfile")).toBe("file-type-docker");
    });

    it(".gitignore resolves to git", () => {
      expect(getFileIconName(".gitignore")).toBe("file-type-git");
    });

    it(".env variants resolve to dotenv", () => {
      expect(getFileIconName(".env")).toBe("file-type-dotenv");
      expect(getFileIconName(".env.local")).toBe("file-type-dotenv");
      expect(getFileIconName(".env.production")).toBe("file-type-dotenv");
    });

    it("LICENSE resolves to license", () => {
      expect(getFileIconName("LICENSE")).toBe("file-type-license");
      expect(getFileIconName("license.md")).toBe("file-type-license");
    });
  });

  describe("dotfiles", () => {
    it("returns the configured icon for a known dotfile", () => {
      expect(getFileIconName(".gitignore")).toBe("file-type-git");
    });

    it("falls back to default for unknown dotfiles", () => {
      expect(getFileIconName(".unknownrc")).toBe(DEFAULT_FILE_ICON);
    });
  });

  describe("fallbacks", () => {
    it("returns the default icon for unknown extensions", () => {
      expect(getFileIconName("foo.xyz123")).toBe(DEFAULT_FILE_ICON);
    });

    it("returns the default icon for extensionless files", () => {
      expect(getFileIconName("Makefile")).toBe("file-type-config");
      expect(getFileIconName("noext")).toBe(DEFAULT_FILE_ICON);
    });

    it("returns the default icon for empty string", () => {
      expect(getFileIconName("")).toBe(DEFAULT_FILE_ICON);
    });
  });

  describe("map integrity", () => {
    it("every value in EXTENSION_TO_ICON is a non-empty string", () => {
      for (const v of Object.values(EXTENSION_TO_ICON)) {
        expect(typeof v).toBe("string");
        expect(v.length).toBeGreaterThan(0);
      }
    });

    it("every value in FILENAME_TO_ICON is a non-empty string", () => {
      for (const v of Object.values(FILENAME_TO_ICON)) {
        expect(typeof v).toBe("string");
        expect(v.length).toBeGreaterThan(0);
      }
    });

    it("DEFAULT_FILE_ICON is set", () => {
      expect(DEFAULT_FILE_ICON).toBe("default-file");
    });
  });

  describe("generated JSON sync", () => {
    // Guards against editing the maps in file-icons.ts without re-running
    // `pnpm --filter web-app generate:file-icons`. A missing icon would
    // render as a blank square at runtime.
    it("every icon referenced by EXTENSION_TO_ICON is present in the bundle", () => {
      const missing = Object.values(EXTENSION_TO_ICON).filter(
        (name) => !bundledNames.has(name),
      );
      expect(missing).toEqual([]);
    });

    it("every icon referenced by FILENAME_TO_ICON is present in the bundle", () => {
      const missing = Object.values(FILENAME_TO_ICON).filter(
        (name) => !bundledNames.has(name),
      );
      expect(missing).toEqual([]);
    });

    it("DEFAULT_FILE_ICON is present in the bundle", () => {
      expect(bundledNames.has(DEFAULT_FILE_ICON)).toBe(true);
    });
  });
});
