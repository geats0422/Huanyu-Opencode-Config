/**
 * Shared helpers for Huanyu Pi extensions.
 *
 * No-op default export so Pi auto-discovery loads this as a harmless
 * extension; other extensions import the named helpers from here.
 *
 * Paths under ~/.pi (Pi-native data root; no longer shared with opencode).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createHash } from "node:crypto";

// ─── Paths ──────────────────────────────────────────────
export const HOME = os.homedir();
export const LEARNINGS_ROOT = path.join(HOME, ".pi", "learnings");
export const REGISTRY_FILE = path.join(LEARNINGS_ROOT, "projects.json");
export const LATEST_LEARNINGS = path.join(LEARNINGS_ROOT, "latest-session.md");

// ─── FS helpers ─────────────────────────────────────────
export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function safeReadJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function safeWriteJson(file: string, value: unknown) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

// ─── Notify (works in TUI and RPC; silent in print) ─────
type AnyCtx = { ui?: { notify: (msg: string, level?: string) => void } };
export function notify(ctx: AnyCtx, message: string, level: "info" | "warn" | "error" = "info") {
  try {
    ctx.ui?.notify(message, level);
  } catch {
    /* ignore */
  }
}

// ─── Project detection (git remote -> stable id) ────────
export function detectProject(directory: string): { id: string; name: string } | null {
  try {
    const gitDir = path.join(directory, ".git");
    if (!fs.existsSync(gitDir)) return null;
    const configPath = path.join(gitDir, "config");
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, "utf8");
      const match = config.match(
        /url\s*=\s*(?:git@|https:\/\/)(?:github\.com\/|gitlab\.com\/)?(.+?)(?:\.git)?\s*$/m,
      );
      if (match) {
        const repoPath = match[1].replace(/[:\/]/g, "-");
        return { id: repoPath, name: repoPath.split("/").pop() || repoPath };
      }
    }
    const dirName = path.basename(directory);
    return {
      id: createHash("sha256").update(directory).digest("hex").slice(0, 12),
      name: dirName,
    };
  } catch {
    return null;
  }
}

export function getProjectSlug(directory: string): string {
  const p = detectProject(directory);
  return p ? p.id : path.basename(directory).replace(/\s+/g, "-").toLowerCase();
}

// ─── Token estimation ───────────────────────────────────
export function estimateTokens(text: string, filePath: string): number {
  const ext = path.extname(filePath).toLowerCase();
  const ratio = [".md", ".txt", ".rst"].includes(ext) ? 4.0 : 3.5;
  return Math.max(1, Math.round(text.length / ratio));
}

// ─── Guards ─────────────────────────────────────────────
export function isDestructiveCommand(command: string): boolean {
  const dangerous = [
    /\brm\s+-rf\b/, /\bDROP\s+TABLE\b/, /\bDELETE\s+FROM\b/,
    /\bgit\s+push\s+--force\b/, /\bgit\s+reset\s+--hard\b/,
    /\bformat\s+(c:|d:)/i, /\bDROP\s+DATABASE\b/, /\bTRUNCATE\b/,
  ];
  return dangerous.some((p) => p.test(command));
}

export function isConfigFile(filePath: string): boolean {
  const configs = [
    ".prettierrc", ".eslintrc", "eslint.config", "tsconfig.json",
    ".editorconfig", "biome.json", "prettier.config",
  ];
  const base = path.basename(filePath);
  return configs.some((c) => base.includes(c));
}

// ─── Path helpers ───────────────────────────────────────
export function normalizeRelativePath(projectDir: string, filePath: string): string {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(projectDir, filePath);
  return path.relative(projectDir, abs).replace(/\\/g, "/");
}

export function resolveAbsolutePath(projectDir: string, filePath: string): string {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(projectDir, filePath);
  return path.resolve(abs);
}

export function isInsideProject(projectDir: string, absPath: string): boolean {
  const projectRoot = path.resolve(projectDir);
  const rel = path.relative(projectRoot, absPath);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

// Extract a string blob from a Pi tool_result content (string | content blocks[]).
export function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c: any) => (typeof c === "string" ? c : c?.text ?? ""))
      .join("");
  }
  return "";
}

// No-op default so Pi auto-discovery treats this file as a harmless extension.
export default function _noop() {}
