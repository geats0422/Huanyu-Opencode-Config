/**
 * openwolf-lite (Pi extension) — session metrics + file anatomy + buglog +
 * do-not-repeat rules.
 *
 * Converted from .opencode/plugins/openwolf-lite.ts.
 * State lives under <cwd>/.pi/state/openwolf-lite/.
 *
 * Hooks:
 *   session_start   -> init/reset state files + per-session counters
 *   tool_call       -> repeated-read warning, anatomy hit, do-not-repeat check
 *   tool_result     -> accumulate read/write token stats, update anatomy
 *   session_shutdown-> persist session ledger
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  ensureDir, safeReadJson, safeWriteJson, notify,
  estimateTokens, normalizeRelativePath, resolveAbsolutePath, isInsideProject,
  contentToText,
} from "./_shared";

// ─── Types ──────────────────────────────────────────────
type AnatomyEntry = { desc: string; tokenEstimate: number; lastSeenAt: string };
type AnatomyState = { version: number; updatedAt: string; files: Record<string, AnatomyEntry> };

type SessionSnapshot = {
  id: string; startedAt: string; endedAt: string;
  reads: number; writes: number;
  repeatedReadWarnings: number; doNotRepeatWarnings: number; anatomyHits: number;
  estimatedTokensRead: number; estimatedTokensWritten: number;
};

type LedgerLifetime = {
  sessions: number; reads: number; writes: number;
  repeatReadWarnings: number; doNotRepeatWarnings: number; anatomyHits: number;
  estimatedTokensRead: number; estimatedTokensWritten: number;
};
type LedgerState = { version: number; lifetime: LedgerLifetime; sessions: SessionSnapshot[] };

type DoNotRepeatRule = { id: string; pattern: string; hint: string; enabled: boolean };
type DoNotRepeatState = { version: number; rules: DoNotRepeatRule[] };

const toIso = () => new Date().toISOString();

const summarizeFile = (relPath: string, content: string): string => {
  const firstLine = content
    .split(/\r?\n/)
    .map((x) => x.trim())
    .find((x) => x.length > 0);
  return firstLine
    ? `${path.basename(relPath)}: ${firstLine.slice(0, 80)}`
    : `${path.basename(relPath)}: empty or binary content`;
};

const newLifetime = (): LedgerLifetime => ({
  sessions: 0, reads: 0, writes: 0,
  repeatReadWarnings: 0, doNotRepeatWarnings: 0, anatomyHits: 0,
  estimatedTokensRead: 0, estimatedTokensWritten: 0,
});

export default function (pi: ExtensionAPI) {
  let cwd = "";
  let stateDir = "";
  let anatomyFile = "";
  let ledgerFile = "";
  let dnrFile = "";
  let sessionReads = new Map<string, number>();
  let snap: SessionSnapshot | null = null;

  const ensureDefaultStateFiles = () => {
    if (!fs.existsSync(anatomyFile))
      safeWriteJson(anatomyFile, { version: 1, updatedAt: toIso(), files: {} });
    if (!fs.existsSync(ledgerFile))
      safeWriteJson(ledgerFile, { version: 1, lifetime: newLifetime(), sessions: [] });
    if (!fs.existsSync(dnrFile))
      safeWriteJson(dnrFile, {
        version: 1,
        rules: [{ id: "dnr-001", pattern: "never use var", hint: "use const/let", enabled: true }],
      });
  };

  const resetSession = () => {
    sessionReads = new Map<string, number>();
    snap = {
      id: `session-${Date.now()}`, startedAt: toIso(), endedAt: toIso(),
      reads: 0, writes: 0, repeatedReadWarnings: 0, doNotRepeatWarnings: 0,
      anatomyHits: 0, estimatedTokensRead: 0, estimatedTokensWritten: 0,
    };
  };

  pi.on("session_start", async (_e, ctx) => {
    cwd = ctx.cwd;
    stateDir = path.join(cwd, ".pi", "state", "openwolf-lite");
    anatomyFile = path.join(stateDir, "anatomy-lite.json");
    ledgerFile = path.join(stateDir, "session-ledger.json");
    dnrFile = path.join(stateDir, "do-not-repeat.json");
    ensureDir(stateDir);
    ensureDefaultStateFiles();
    resetSession();
    notify(ctx, "openwolf-lite initialized", "info");
  });

  pi.on("tool_call", async (event, ctx) => {
    if (!snap || !cwd) return;
    const tool = event.toolName;

    if (tool === "read") {
      const fp = (event.input as any)?.path;
      if (typeof fp !== "string" || !fp) return;
      const abs = resolveAbsolutePath(cwd, fp);
      if (!isInsideProject(cwd, abs)) return;
      const rel = normalizeRelativePath(cwd, abs);

      if ((sessionReads.get(rel) || 0) >= 1) {
        snap.repeatedReadWarnings += 1;
        notify(ctx, `Repeated read in same session: ${rel}`, "warn");
      }
      const anatomy = safeReadJson<AnatomyState>(anatomyFile, { version: 1, updatedAt: toIso(), files: {} });
      const entry = anatomy.files[rel];
      if (entry) {
        snap.anatomyHits += 1;
        notify(ctx, `anatomy hit: ${rel} (~${entry.tokenEstimate} tok) - ${entry.desc}`, "info");
      }
    }

    if (tool === "write" || tool === "edit") {
      const content = String((event.input as any)?.content ?? "");
      if (!content) return;
      const dnr = safeReadJson<DoNotRepeatState>(dnrFile, { version: 1, rules: [] });
      for (const rule of dnr.rules) {
        if (!rule.enabled) continue;
        if (content.toLowerCase().includes(rule.pattern.toLowerCase())) {
          snap.doNotRepeatWarnings += 1;
          notify(ctx, `DNR warning (${rule.id}): ${rule.pattern}. Hint: ${rule.hint}`, "warn");
        }
      }
    }
  });

  pi.on("tool_result", async (event, ctx) => {
    if (!snap || !cwd) return;
    const tool = event.toolName;

    if (tool === "read") {
      const fp = (event.input as any)?.path;
      if (typeof fp !== "string" || !fp) return;
      const abs = resolveAbsolutePath(cwd, fp);
      if (!isInsideProject(cwd, abs)) return;
      const rel = normalizeRelativePath(cwd, abs);
      sessionReads.set(rel, (sessionReads.get(rel) || 0) + 1);
      snap.reads += 1;

      let content = contentToText(event.content);
      if (!content) {
        try {
          content = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
        } catch {
          content = "";
        }
      }
      snap.estimatedTokensRead += estimateTokens(content, rel);
    }

    if (tool === "write" || tool === "edit") {
      const fp = (event.input as any)?.path;
      if (typeof fp !== "string" || !fp) return;
      const abs = resolveAbsolutePath(cwd, fp);
      if (!isInsideProject(cwd, abs)) return;
      const rel = normalizeRelativePath(cwd, abs);
      snap.writes += 1;

      let content = String((event.input as any)?.content ?? "");
      if (!content) {
        try {
          content = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
        } catch {
          content = "";
        }
      }
      const tokenEstimate = estimateTokens(content, rel);
      snap.estimatedTokensWritten += tokenEstimate;

      const anatomy = safeReadJson<AnatomyState>(anatomyFile, { version: 1, updatedAt: toIso(), files: {} });
      anatomy.files[rel] = { desc: summarizeFile(rel, content), tokenEstimate, lastSeenAt: toIso() };
      anatomy.updatedAt = toIso();
      safeWriteJson(anatomyFile, anatomy);
    }
  });

  pi.on("session_shutdown", async (_e, ctx) => {
    if (!snap) return;
    if (snap.reads === 0 && snap.writes === 0) return;
    snap.endedAt = toIso();

    const ledger = safeReadJson<LedgerState>(ledgerFile, {
      version: 1, lifetime: newLifetime(), sessions: [],
    });
    const lt = ledger.lifetime;
    lt.sessions += 1;
    lt.reads += snap.reads;
    lt.writes += snap.writes;
    lt.repeatReadWarnings += snap.repeatedReadWarnings;
    lt.doNotRepeatWarnings += snap.doNotRepeatWarnings;
    lt.anatomyHits += snap.anatomyHits;
    lt.estimatedTokensRead += snap.estimatedTokensRead;
    lt.estimatedTokensWritten += snap.estimatedTokensWritten;
    ledger.sessions.push(snap);
    if (ledger.sessions.length > 200) ledger.sessions = ledger.sessions.slice(-200);
    safeWriteJson(ledgerFile, ledger);

    notify(ctx, `session saved: reads=${snap.reads}, writes=${snap.writes}`, "info");
    resetSession();
  });
}
