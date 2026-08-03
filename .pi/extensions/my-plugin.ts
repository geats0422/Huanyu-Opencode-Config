/**
 * my-plugin (Pi extension) — fused hook automation.
 *
 * Converted from .opencode/plugins/my-plugin.ts.
 *
 * Hooks:
 *   session_start        -> reset session timers + load recent learnings
 *   session_shutdown     -> save session summary to ~/.pi/learnings/<slug>/
 *   tool_call            -> guard .env reads, config-file writes, destructive cmds
 *   tool_result          -> track edited files (write/edit)
 *   session_before_compact -> notify user (see note below)
 *
 * NOTE: opencode's experimental.session.compacting pushed text to output.context
 * so the summarizer preserved "current work state". Pi's session_before_compact
 * can only cancel or provide a full custom summary — it cannot append to the
 * summarizer input. Work-state preservation is instead covered by the
 * session_shutdown handler that writes a detailed summary file. This is a
 * documented behavioral difference.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  notify, ensureDir, getProjectSlug, isDestructiveCommand, isConfigFile,
  LEARNINGS_ROOT, LATEST_LEARNINGS,
} from "./_shared";

export default function (pi: ExtensionAPI) {
  let cwd = "";
  let sessionStartTime = Date.now();
  let editedFiles = new Set<string>();

  // ═══ session.created → session_start ═══
  pi.on("session_start", async (_e, ctx) => {
    cwd = ctx.cwd;
    sessionStartTime = Date.now();
    editedFiles = new Set<string>();
    ensureDir(LEARNINGS_ROOT);
    notify(ctx, `Plugin initialized in ${cwd}`, "info");

    // Load recent learnings (last 5 .md files in LEARNINGS_ROOT)
    try {
      const recentFiles = fs
        .readdirSync(LEARNINGS_ROOT)
        .filter((f) => f.endsWith(".md"))
        .sort()
        .slice(-5);
      if (recentFiles.length > 0) {
        notify(ctx, `Recent learnings: ${recentFiles.join(", ")}`, "info");
      }
    } catch {
      /* LEARNINGS_ROOT may not exist yet */
    }
  });

  // ═══ tool.execute.before → tool_call (can block) ═══
  pi.on("tool_call", async (event, ctx) => {
    const tool = event.toolName;

    // Protect .env files from being read
    if (tool === "read") {
      const fp = String((event.input as any)?.path ?? "");
      if (fp.includes(".env")) {
        return {
          block: true,
          reason: "禁止读取 .env 文件。这些文件可能包含敏感信息（密钥、token）。",
        };
      }
    }

    // Guard linter/formatter config files from being modified
    if (tool === "write" || tool === "edit") {
      const fp = String((event.input as any)?.path ?? "");
      if (fp && isConfigFile(fp)) {
        return {
          block: true,
          reason: `禁止修改 linter/formatter 配置文件 "${fp}"。修复代码使其符合现有规范，不要削弱配置。`,
        };
      }
    }

    // Warn on destructive commands (non-blocking)
    if (tool === "bash") {
      const cmd = String((event.input as any)?.command ?? "");
      if (cmd && isDestructiveCommand(cmd)) {
        notify(ctx, `Destructive command detected: ${cmd.slice(0, 100)}`, "warn");
      }
    }
  });

  // ═══ tool.execute.after + file.edited → tool_result ═══
  pi.on("tool_result", async (event, _ctx) => {
    const tool = event.toolName;
    if (tool === "write" || tool === "edit") {
      const fp = String((event.input as any)?.path ?? "");
      if (fp) editedFiles.add(fp);
    }
  });

  // ═══ experimental.session.compacting → session_before_compact ═══
  pi.on("session_before_compact", async (_e, ctx) => {
    // opencode pushed a "preserve work state" reminder to the summarizer.
    // Pi cannot append to summarizer input; notify instead. Detailed state
    // is captured by the session_shutdown summary file below.
    notify(ctx, "Compaction in progress — work state will be preserved in session summary.", "info");
  });

  // ═══ session.idle + session.deleted → session_shutdown ═══
  pi.on("session_shutdown", async (_e, ctx) => {
    if (!cwd) return;

    const duration = Math.round((Date.now() - sessionStartTime) / 60000);
    const projectSlug = getProjectSlug(cwd);
    const projectDir = path.join(LEARNINGS_ROOT, projectSlug);
    ensureDir(projectDir);

    const today = new Date().toISOString().slice(0, 10);
    const sessionFile = path.join(projectDir, `${today}-session.md`);

    const summary = `# 会话记录 - ${today}

## 项目
- 目录: ${cwd}
- 持续时间: ~${duration} 分钟
- 编辑文件数: ${editedFiles.size}

## 编辑的文件
${[...editedFiles].map((f) => `- ${f}`).join("\n") || "_(无)_"}

## 关键决策
_[运行 /learn 来记录关键决策]_

## 经验教训
_[运行 /learn 来记录经验教训]_
`;

    try {
      fs.writeFileSync(sessionFile, summary, "utf8");

      // Update latest-session link (symlink, fallback to plain file)
      try {
        fs.unlinkSync(LATEST_LEARNINGS);
      } catch {
        /* may not exist */
      }
      try {
        fs.symlinkSync(sessionFile, LATEST_LEARNINGS);
      } catch {
        fs.writeFileSync(LATEST_LEARNINGS, summary, "utf8");
      }
    } catch {
      /* write failure — keep going */
    }

    notify(
      ctx,
      `Session ended (${duration}min, ${editedFiles.size} files). Use /learn to record insights.`,
      "info",
    );

    // session.deleted cleanup: clear edited files
    editedFiles = new Set<string>();
  });
}
