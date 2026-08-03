import { describe, it, expect, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ensureConfigFile, expanduser, loadFileConfig } from "./file-loader";

const dirs: string[] = [];

function makeTmpDir(): string {
  const dir = join(tmpdir(), "cloudy-test-" + randomUUID());
  mkdirSync(dir, { recursive: true });
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("expanduser", () => {
  it("expands ~/path to home directory", () => {
    expect(expanduser("~/foo")).toBe(join(homedir(), "foo"));
  });

  it("expands bare ~ to home directory", () => {
    expect(expanduser("~")).toBe(homedir());
  });

  it("keeps absolute path unchanged", () => {
    expect(expanduser("/abs/path")).toBe("/abs/path");
  });

  it("keeps relative path unchanged", () => {
    expect(expanduser("relative/path")).toBe("relative/path");
  });
});

describe("ensureConfigFile", () => {
  it("creates dir and writes default config when file is missing", () => {
    const dir = makeTmpDir();
    rmSync(dir, { recursive: true, force: true });

    const configPath = ensureConfigFile(dir);
    expect(existsSync(configPath)).toBe(true);
    const content = JSON.parse(readFileSync(configPath, "utf8"));
    expect(content).toEqual({ host: "localhost", port: 4122 });
  });

  it("creates nested directories recursively", () => {
    const dir = join(makeTmpDir(), "nested", "deep");
    ensureConfigFile(dir);
    expect(existsSync(join(dir, "config.json"))).toBe(true);
  });

  it("does not overwrite an existing file", () => {
    const dir = makeTmpDir();
    const existing = { host: "example.com", port: 9999 };
    writeFileSync(join(dir, "config.json"), JSON.stringify(existing));

    ensureConfigFile(dir);
    const content = JSON.parse(readFileSync(join(dir, "config.json"), "utf8"));
    expect(content).toEqual(existing);
  });

  it("writes custom defaults when provided", () => {
    const dir = makeTmpDir();
    rmSync(dir, { recursive: true, force: true });

    const customDefaults = { host: "custom.host", port: 5555 };
    ensureConfigFile(dir, customDefaults);
    const content = JSON.parse(readFileSync(join(dir, "config.json"), "utf8"));
    expect(content).toEqual(customDefaults);
  });
});

describe("loadFileConfig", () => {
  it("reads and parses an existing JSON config", () => {
    const dir = makeTmpDir();
    const config = { host: "from.file", port: 1234 };
    writeFileSync(join(dir, "config.json"), JSON.stringify(config));

    expect(loadFileConfig(dir)).toEqual(config);
  });

  it("creates file with defaults then reads it when missing", () => {
    const dir = makeTmpDir();
    rmSync(dir, { recursive: true, force: true });

    expect(loadFileConfig(dir)).toEqual({ host: "localhost", port: 4122 });
    expect(existsSync(join(dir, "config.json"))).toBe(true);
  });
});
