import { toHtml } from "hast-util-to-html";
import refractor from "./refractor-custom";

export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  md: "markdown",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  ps1: "powershell",
  dockerfile: "dockerfile",
  makefile: "makefile",
  cmake: "cmake",
  toml: "toml",
  ini: "ini",
  cfg: "ini",
  conf: "nginx",
  vue: "vue",
  svelte: "svelte",
};

export function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
}

/**
 * Mapping from the language names used in `EXTENSION_TO_LANGUAGE` to the
 * corresponding refractor/Prism language identifiers. Keys not present
 * here have no refractor counterpart registered in `lib/refractor-custom.ts`
 * and will render as plain text in the diff viewer.
 */
const LANGUAGE_TO_REFRACTOR: Record<string, string> = {
  typescript: "typescript",
  tsx: "tsx",
  javascript: "javascript",
  jsx: "jsx",
  python: "python",
  ruby: "ruby",
  go: "go",
  rust: "rust",
  java: "java",
  kotlin: "kotlin",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  php: "php",
  html: "markup",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  xml: "markup",
  markdown: "markdown",
  sql: "sql",
  bash: "bash",
  powershell: "powershell",
  dockerfile: "docker",
  makefile: "makefile",
  cmake: "cmake",
  toml: "toml",
  ini: "ini",
  nginx: "nginx",
  vue: "markup",
  svelte: "markup",
};

/**
 * Resolve a file path to a registered refractor language id, or `null` if no
 * suitable language is available (in which case the diff viewer renders plain
 * text without syntax highlighting).
 */
export function getRefractorLanguage(filePath: string): string | null {
  return resolveRefractorLanguage(detectLanguage(filePath));
}

export function highlightCode(code: string, language: string): string {
  if (!code) return "";

  const refractorLanguage = resolveRefractorLanguage(language);
  if (!refractorLanguage || !refractor.registered(refractorLanguage)) {
    return escapeHtml(code);
  }

  try {
    return toHtml(refractor.highlight(code, refractorLanguage));
  } catch {
    return escapeHtml(code);
  }
}

function resolveRefractorLanguage(language: string): string | null {
  if (language === "plaintext") return null;
  return LANGUAGE_TO_REFRACTOR[language] ?? null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
