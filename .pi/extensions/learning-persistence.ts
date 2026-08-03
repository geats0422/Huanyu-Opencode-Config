/**
 * learning-persistence (Pi extension) — 复利学习的存储引擎
 *
 * Converted from .opencode/plugins/learning-persistence.ts.
 * Data lives under ~/.pi/learnings/<projectId>/entries/*.md (Pi-native,
 * via _shared.LEARNINGS_ROOT).
 *
 * Hooks:
 *   session_start  -> detect project, register/update registry, load stats,
 *                     notify high-confidence learnings
 * Tools (backend for /learn /learn-status /learn-evolve):
 *   learn_add     -> create or confirm (bump confidence) a learning entry
 *   learn_list    -> list entries (optionally filtered by min confidence)
 *   learn_stats   -> return aggregate stats
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
import {
  detectProject, notify, ensureDir, safeReadJson, safeWriteJson,
  LEARNINGS_ROOT, REGISTRY_FILE,
} from "./_shared";

// ─── Types ──────────────────────────────────────────────
type Domain = "code-style" | "testing" | "debugging" | "security" | "workflow" | "performance" | "project";
type EntryType = "pattern" | "fix" | "convention" | "tool" | "architecture";
type Scope = "project" | "global";

interface LearningEntry {
  id: string;
  type: EntryType;
  domain: Domain;
  scope: Scope;
  project_id: string;
  project_name: string;
  confidence: number;
  confirmed_in: number;
  sessions: string[];
  created: string;
  updated: string;
  what: string;
  trigger: string;
  why: string;
  evidence: string[];
  suggested_promotion?: { target: "rule" | "skill" | "agent" | "command"; path: string; reason: string };
}

interface ProjectRegistry {
  [projectId: string]: { name: string; path: string; created: string; entryCount: number };
}

interface LearningStats {
  total: number;
  confirmed: number;
  readyToPromote: number;
  promoted: number;
  byDomain: Record<string, number>;
  latestEntries: { what: string; confidence: number }[];
}

const toIso = () => new Date().toISOString();
const DOMAINS: Domain[] = ["code-style", "testing", "debugging", "security", "workflow", "performance", "project"];
const TYPES: EntryType[] = ["pattern", "fix", "convention", "tool", "architecture"];

const coerce = <T extends string>(v: unknown, allowed: readonly T[], dflt: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : dflt;

// ─── Registry ───────────────────────────────────────────
const loadRegistry = (): ProjectRegistry => safeReadJson<ProjectRegistry>(REGISTRY_FILE, {});
const saveRegistry = (registry: ProjectRegistry) => safeWriteJson(REGISTRY_FILE, registry);

// ─── Entry persistence ──────────────────────────────────
const entriesDir = (projectId: string): string =>
  path.join(LEARNINGS_ROOT, projectId, "entries");

const loadEntries = (projectId: string): LearningEntry[] => {
  const dir = entriesDir(projectId);
  if (!fs.existsSync(dir)) return [];
  const entries: LearningEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    try {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      const entry = parseEntryFile(content);
      if (entry) entries.push(entry);
    } catch { /* skip */ }
  }
  return entries.sort((a, b) => b.confidence - a.confidence);
};

const saveEntry = (projectId: string, entry: LearningEntry) => {
  const dir = entriesDir(projectId);
  ensureDir(dir);

  const yamlBlock = `---
id: "${entry.id}"
type: ${entry.type}
domain: ${entry.domain}
scope: ${entry.scope}
project_id: "${entry.project_id}"
confidence: ${entry.confidence}
confirmed_in: ${entry.confirmed_in}
created: "${entry.created}"
updated: "${entry.updated}"
sessions:
${entry.sessions.map((s) => `  - "${s}"`).join("\n")}
---

# What
${entry.what}

# Trigger
${entry.trigger}

# Why It Matters
${entry.why}

# Evidence
${entry.evidence.map((e) => `- ${e}`).join("\n")}
`;
  fs.writeFileSync(path.join(dir, `${entry.id}.md`), yamlBlock, "utf8");
};

const parseEntryFile = (content: string): LearningEntry | null => {
  try {
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!yamlMatch) return null;

    const yaml: Record<string, any> = {};
    for (const line of yamlMatch[1].split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let value: any = line.slice(colonIdx + 1).trim();
        value = value.replace(/^["']|["']$/g, "");
        if (!isNaN(Number(value))) value = Number(value);
        yaml[key] = value;
      }
    }

    const body = content.slice(yamlMatch[0].length);
    const whatMatch = body.match(/# What\n([\s\S]*?)(?=\n# |$)/);
    const triggerMatch = body.match(/# Trigger\n([\s\S]*?)(?=\n# |$)/);
    const whyMatch = body.match(/# Why It Matters\n([\s\S]*?)(?=\n# |$)/);
    const evidenceMatch = body.match(/# Evidence\n([\s\S]*?)$/);

    const conf = (yaml.confidence as number) || 0.3;
    return {
      id: yaml.id || "",
      type: coerce<EntryType>(yaml.type, TYPES, "pattern"),
      domain: coerce<Domain>(yaml.domain, DOMAINS, "workflow"),
      scope: yaml.scope === "global" ? "global" : "project",
      project_id: yaml.project_id || "",
      project_name: yaml.project_name || "",
      confidence: conf,
      confirmed_in: (yaml.confirmed_in as number) || 1,
      sessions: Array.isArray(yaml.sessions) ? yaml.sessions : [],
      created: yaml.created || toIso(),
      updated: yaml.updated || toIso(),
      what: whatMatch ? whatMatch[1].trim() : "",
      trigger: triggerMatch ? triggerMatch[1].trim() : "",
      why: whyMatch ? whyMatch[1].trim() : "",
      evidence: evidenceMatch
        ? evidenceMatch[1].trim().split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2))
        : [],
      suggested_promotion: confidenceCheck(conf, yaml.type, yaml.domain),
    };
  } catch {
    return null;
  }
};

const confidenceCheck = (
  confidence: number,
  type: string,
  domain: string,
): LearningEntry["suggested_promotion"] | undefined => {
  if (confidence < 0.7) return undefined;
  if (["convention", "pattern"].includes(type) && domain === "code-style")
    return { target: "rule", path: "rules/common.md", reason: "编码约定 → 通用规则" };
  if (["fix", "tool"].includes(type))
    return { target: "skill", path: `skills/${type}-${domain}/SKILL.md`, reason: "操作经验 → 可复用技能" };
  if (type === "workflow")
    return { target: "command", path: ".pi/prompts/", reason: "工作流模式 → 斜杠命令" };
  if (type === "architecture")
    return { target: "agent", path: ".pi/agents/", reason: "架构知识 → Agent 提示词" };
  return { target: "rule", path: "rules/common.md", reason: "通用模式 → 自动规则" };
};

const findSimilarEntries = (
  newWhat: string,
  existing: LearningEntry[],
): { entry: LearningEntry; similarity: number }[] => {
  const keywords = newWhat.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  return existing
    .map((e) => {
      const target = (e.what + " " + e.trigger).toLowerCase();
      const matches = keywords.filter((k) => target.includes(k)).length;
      const similarity = keywords.length > 0 ? matches / keywords.length : 0;
      return { entry: e, similarity };
    })
    .filter((m) => m.similarity > 0.4)
    .sort((a, b) => b.similarity - a.similarity);
};

const getStats = (projectId: string): LearningStats => {
  const entries = loadEntries(projectId);
  const byDomain: Record<string, number> = {};
  for (const e of entries) byDomain[e.domain] = (byDomain[e.domain] || 0) + 1;
  return {
    total: entries.length,
    confirmed: entries.filter((e) => e.confidence >= 0.4).length,
    readyToPromote: entries.filter((e) => e.confidence >= 0.7 && e.suggested_promotion).length,
    promoted: entries.filter((e) => e.confidence >= 0.9).length,
    byDomain,
    latestEntries: entries.slice(0, 5).map((e) => ({ what: e.what.slice(0, 80), confidence: e.confidence })),
  };
};

const updateRegistryCount = (projectId: string) => {
  const reg = loadRegistry();
  if (reg[projectId]) {
    reg[projectId].entryCount = loadEntries(projectId).length;
    saveRegistry(reg);
  }
};

// ─── Extension ──────────────────────────────────────────
export default function (pi: ExtensionAPI) {
  let cwd = "";
  let project: { id: string; name: string } | null = null;
  let sessionTag = "";

  const resolveProject = (dir: string): { id: string; name: string } | null => {
    if (project) return project;
    project = detectProject(dir);
    return project;
  };

  pi.on("session_start", async (_e, ctx) => {
    cwd = ctx.cwd;
    sessionTag = `s-${Date.now()}`;
    const proj = resolveProject(cwd);
    if (!proj) {
      notify(ctx, "learning-persistence: no git project detected, learning disabled", "info");
      return;
    }

    const registry = loadRegistry();
    if (!registry[proj.id]) {
      registry[proj.id] = { name: proj.name, path: cwd, created: toIso(), entryCount: 0 };
      saveRegistry(registry);
    }

    const stats = getStats(proj.id);
    notify(ctx, `Project "${proj.name}" — ${stats.total} learnings (${stats.readyToPromote} ready to promote)`, "info");

    const entries = loadEntries(proj.id);
    const highConfidence = entries.filter((e) => e.confidence >= 0.4);
    if (highConfidence.length > 0) {
      const reminders = highConfidence
        .slice(0, 8)
        .map((e) => `  • [${e.domain}] ${e.what.slice(0, 100)} (confidence ${e.confidence.toFixed(1)})`)
        .join("\n");
      notify(ctx, `Active learnings for this project:\n${reminders}`, "info");
    }
    updateRegistryCount(proj.id);
  });

  // ─── learn_add: create or confirm a learning ─────────
  pi.registerTool({
    name: "learn_add",
    label: "Add Learning",
    description:
      "Record a reusable learning for the current project. If a similar entry exists, " +
      "its confidence is bumped instead of creating a duplicate. Backend for the /learn command.",
    parameters: Type.Object({
      what: Type.String({ description: "What the learning / pattern is" }),
      trigger: Type.String({ description: "When it applies (situation)" }),
      why: Type.String({ description: "Why it matters" }),
      type: Type.Optional(Type.String({ description: "pattern | fix | convention | tool | architecture" })),
      domain: Type.Optional(Type.String({ description: "code-style | testing | debugging | security | workflow | performance | project" })),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const dir = ctx?.cwd || cwd;
      const proj = resolveProject(dir);
      if (!proj) {
        return { content: [{ type: "text", text: "No git project detected; cannot store learning." }] };
      }

      const what = String(params.what ?? "").trim();
      const trigger = String(params.trigger ?? "").trim();
      const why = String(params.why ?? "").trim();
      if (!what) {
        return { content: [{ type: "text", text: "Missing required field: what" }], details: { error: true } };
      }

      const type = coerce<EntryType>(params.type, TYPES, "pattern");
      const domain = coerce<Domain>(params.domain, DOMAINS, "workflow");
      const existing = loadEntries(proj.id);
      const matches = findSimilarEntries(what, existing);

      if (matches.length > 0) {
        const entry = matches[0].entry;
        entry.confidence = Math.min(1, +(entry.confidence + 0.1).toFixed(2));
        entry.confirmed_in += 1;
        if (!entry.sessions.includes(sessionTag)) entry.sessions.push(sessionTag);
        entry.updated = toIso();
        entry.suggested_promotion = confidenceCheck(entry.confidence, entry.type, entry.domain);
        saveEntry(proj.id, entry);
        updateRegistryCount(proj.id);
        return {
          content: [{
            type: "text",
            text: `Confirmed existing learning (similarity ${(matches[0].similarity * 100).toFixed(0)}%): "${entry.what.slice(0, 80)}". confidence ${entry.confidence.toFixed(2)} (confirmed ${entry.confirmed_in}x).`,
          }],
          details: { action: "confirmed", id: entry.id, confidence: entry.confidence },
        };
      }

      const newEntry: LearningEntry = {
        id: randomBytes(6).toString("hex"),
        type, domain, scope: "project",
        project_id: proj.id, project_name: proj.name,
        confidence: 0.3, confirmed_in: 1, sessions: [sessionTag],
        created: toIso(), updated: toIso(),
        what, trigger, why, evidence: [],
      };
      newEntry.suggested_promotion = confidenceCheck(newEntry.confidence, type, domain);
      saveEntry(proj.id, newEntry);
      updateRegistryCount(proj.id);
      return {
        content: [{ type: "text", text: `Created new learning [${domain}/${type}]: "${what.slice(0, 80)}" (confidence 0.30).` }],
        details: { action: "created", id: newEntry.id },
      };
    },
  });

  // ─── learn_list: list entries ────────────────────────
  pi.registerTool({
    name: "learn_list",
    label: "List Learnings",
    description:
      "List learning entries for the current project, optionally filtered by minimum confidence. " +
      "Backend for the /learn-status command.",
    parameters: Type.Object({
      min_confidence: Type.Optional(Type.Number({ description: "Only entries with confidence >= this (0-1)" })),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const dir = ctx?.cwd || cwd;
      const proj = resolveProject(dir);
      if (!proj) {
        return { content: [{ type: "text", text: "No git project detected." }] };
      }
      const min = typeof params.min_confidence === "number" ? params.min_confidence : 0;
      const entries = loadEntries(proj.id)
        .filter((e) => e.confidence >= min)
        .map((e) => ({
          id: e.id, type: e.type, domain: e.domain,
          confidence: e.confidence, confirmed_in: e.confirmed_in,
          what: e.what.slice(0, 120),
          ready: e.confidence >= 0.7 && !!e.suggested_promotion,
          promotion: e.suggested_promotion ?? null,
        }));
      return {
        content: [{ type: "text", text: `${entries.length} entries (min_confidence ${min}) for "${proj.name}".` }],
        details: { count: entries.length, entries },
      };
    },
  });

  // ─── learn_stats: aggregate stats ────────────────────
  pi.registerTool({
    name: "learn_stats",
    label: "Learning Stats",
    description: "Return aggregate learning statistics for the current project. Backend for /learn-evolve.",
    parameters: Type.Object({}),
    async execute(_id, _params, _signal, _onUpdate, ctx) {
      const dir = ctx?.cwd || cwd;
      const proj = resolveProject(dir);
      if (!proj) {
        return { content: [{ type: "text", text: "No git project detected." }] };
      }
      const stats = getStats(proj.id);
      return {
        content: [{
          type: "text",
          text: `Project "${proj.name}": ${stats.total} total, ${stats.confirmed} confirmed, ${stats.readyToPromote} ready to promote, ${stats.promoted} promoted.`,
        }],
        details: { stats, projectId: proj.id },
      };
    },
  });
}
