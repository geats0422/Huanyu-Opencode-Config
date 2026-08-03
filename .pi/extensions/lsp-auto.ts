/**
 * lsp-auto (Pi extension) — automatic LSP server detection.
 *
 * Converted from .opencode/plugins/lsp-auto.ts.
 *
 * Behavior:
 *   - On first session (startup) it scans the project for known LSP servers
 *     and notifies available / missing ones (with install hints).
 *   - Registers an `lsp_detect` tool the agent can call to get a structured
 *     { available, unavailable, languages } report on demand.
 *   - Detection is cached per process to avoid repeated 1-3s scans.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { notify } from "./_shared";

// ─── LSP server definitions ─────────────────────────────
interface LspDefinition {
  name: string;
  languages: string[];
  detectFiles: string[];
  detectDirs: string[];
  command: string[];
  installHint: string;
}

const LSP_DEFINITIONS: LspDefinition[] = [
  {
    name: "typescript-language-server",
    languages: ["typescript", "javascript", "tsx", "jsx"],
    detectFiles: ["tsconfig.json", "jsconfig.json"],
    detectDirs: ["src"],
    command: ["typescript-language-server", "npx typescript-language-server"],
    installHint: "npm install -g typescript-language-server typescript",
  },
  {
    name: "vscode-eslint-language-server",
    languages: ["typescript", "javascript", "tsx", "jsx"],
    detectFiles: [".eslintrc.js", ".eslintrc.json", ".eslintrc.yaml", ".eslintrc.yml", "eslint.config.js", "eslint.config.mjs", "eslint.config.ts"],
    detectDirs: [],
    command: ["vscode-eslint-language-server"],
    installHint: "npm install -g vscode-langservers-extracted",
  },
  {
    name: "pyright",
    languages: ["python"],
    detectFiles: ["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt"],
    detectDirs: [],
    command: ["pyright-langserver", "npx pyright"],
    installHint: "pip install pyright",
  },
  {
    name: "ruff-lsp",
    languages: ["python"],
    detectFiles: ["pyproject.toml", "ruff.toml"],
    detectDirs: [],
    command: ["ruff-lsp"],
    installHint: "pip install ruff-lsp",
  },
  {
    name: "gopls",
    languages: ["go"],
    detectFiles: ["go.mod", "go.sum"],
    detectDirs: [],
    command: ["gopls"],
    installHint: "go install golang.org/x/tools/gopls@latest",
  },
  {
    name: "rust-analyzer",
    languages: ["rust"],
    detectFiles: ["Cargo.toml", "Cargo.lock"],
    detectDirs: [],
    command: ["rust-analyzer"],
    installHint: "rustup component add rust-analyzer",
  },
  {
    name: "jdtls",
    languages: ["java"],
    detectFiles: ["pom.xml", "build.gradle", "build.gradle.kts"],
    detectDirs: ["src/main/java"],
    command: ["jdtls"],
    installHint: "从 https://download.eclipse.org/jdtls/ 下载",
  },
  {
    name: "kotlin-language-server",
    languages: ["kotlin"],
    detectFiles: ["build.gradle.kts", "settings.gradle.kts"],
    detectDirs: ["src/main/kotlin"],
    command: ["kotlin-language-server"],
    installHint: "从 https://github.com/fwcd/kotlin-language-server/releases 下载",
  },
  {
    name: "clangd",
    languages: ["c", "cpp", "c++"],
    detectFiles: ["CMakeLists.txt", "Makefile", "compile_commands.json"],
    detectDirs: [],
    command: ["clangd"],
    installHint: "安装 LLVM/clangd: https://clangd.llvm.org/installation",
  },
  {
    name: "tailwindcss-language-server",
    languages: ["typescript", "javascript", "tsx", "jsx", "html", "css"],
    detectFiles: ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs"],
    detectDirs: [],
    command: ["tailwindcss-language-server", "npx @tailwindcss/language-server"],
    installHint: "npm install -g @tailwindcss/language-server",
  },
  {
    name: "json-language-server",
    languages: ["json", "jsonc"],
    detectFiles: [],
    detectDirs: [],
    command: ["vscode-json-language-server"],
    installHint: "npm install -g vscode-langservers-extracted",
  },
  {
    name: "css-language-server",
    languages: ["css", "scss", "less"],
    detectFiles: [],
    detectDirs: ["styles", "css"],
    command: ["vscode-css-language-server"],
    installHint: "npm install -g vscode-langservers-extracted",
  },
  {
    name: "html-language-server",
    languages: ["html"],
    detectFiles: [],
    detectDirs: [],
    command: ["vscode-html-language-server"],
    installHint: "npm install -g vscode-langservers-extracted",
  },
  {
    name: "lua-language-server",
    languages: ["lua"],
    detectFiles: [".luarc.json", ".luacheckrc"],
    detectDirs: ["lua"],
    command: ["lua-language-server"],
    installHint: "从 https://github.com/LuaLS/lua-language-server/releases 下载",
  },
  {
    name: "marksman",
    languages: ["markdown"],
    detectFiles: [],
    detectDirs: ["docs"],
    command: ["marksman"],
    installHint: "从 https://github.com/artempyanykh/marksman/releases 下载",
  },
];

// ─── Detection logic ────────────────────────────────────
const isExecutable = (cmd: string): boolean => {
  try {
    if (process.platform === "win32") {
      const result = spawnSync("where", [cmd], {
        stdio: "pipe",
        shell: true,
        timeout: 3000,
      });
      return result.status === 0 && result.stdout.length > 0;
    }
    const result = spawnSync("which", [cmd], {
      stdio: "pipe",
      timeout: 3000,
    });
    return result.status === 0 && result.stdout.length > 0;
  } catch {
    return false;
  }
};

const findCommand = (commands: string[]): string | null => {
  for (const cmd of commands) {
    if (isExecutable(cmd)) return cmd;
  }
  return null;
};

type DetectionResult = {
  available: { name: string; command: string; languages: string[] }[];
  unavailable: { name: string; languages: string[]; installHint: string }[];
};

const detectLspForProject = (projectDir: string): DetectionResult => {
  const available: DetectionResult["available"] = [];
  const unavailable: DetectionResult["unavailable"] = [];

  for (const def of LSP_DEFINITIONS) {
    let detected = false;

    if (def.detectFiles.length > 0) {
      for (const file of def.detectFiles) {
        if (fs.existsSync(path.join(projectDir, file))) {
          detected = true;
          break;
        }
      }
    }

    if (!detected && def.detectDirs.length > 0) {
      for (const dir of def.detectDirs) {
        if (fs.existsSync(path.join(projectDir, dir))) {
          detected = true;
          break;
        }
      }
    }

    if (!detected) continue;

    const cmd = findCommand(def.command);
    if (cmd) {
      available.push({ name: def.name, command: cmd, languages: def.languages });
    } else {
      unavailable.push({
        name: def.name,
        languages: def.languages,
        installHint: def.installHint,
      });
    }
  }

  return { available, unavailable };
};

const inferLanguages = (
  available: { name: string; languages: string[] }[],
): string[] => {
  const langSet = new Set<string>();
  for (const item of available) {
    for (const lang of item.languages) langSet.add(lang);
  }
  return [...langSet];
};

// ─── Extension body ─────────────────────────────────────
export default function (pi: ExtensionAPI) {
  // Cache detection per process to avoid repeated scans.
  let cached: { cwd: string; result: DetectionResult; languages: string[] } | null = null;

  const runDetection = (projectDir: string): DetectionResult => {
    if (cached && cached.cwd === projectDir) return cached.result;
    const result = detectLspForProject(projectDir);
    const languages = inferLanguages(result.available);
    cached = { cwd: projectDir, result, languages };
    return result;
  };

  pi.on("session_start", async (event, ctx) => {
    // Only run the (expensive) full scan on first startup.
    if (event.reason !== "startup") return;

    const result = runDetection(ctx.cwd);
    const languages = cached ? cached.languages : inferLanguages(result.available);

    notify(
      ctx,
      `LSP auto-detection complete: ${result.available.length} available (${languages.join(", ") || "none"})`,
      "info",
    );

    if (result.unavailable.length > 0) {
      const hints = result.unavailable
        .map((u) => `  - ${u.name}: ${u.installHint}`)
        .join("\n");
      notify(ctx, `Some LSP servers not installed:\n${hints}`, "warn");
    }

    // TypeScript present but ESLint LSP missing -> recommend it.
    const hasTs = result.available.some((l) => l.name === "typescript-language-server");
    const hasEslint = result.available.some((l) => l.name === "vscode-eslint-language-server");
    if (hasTs && !hasEslint) {
      notify(
        ctx,
        "Tip: Install ESLint LSP for real-time lint feedback: npm install -g vscode-langservers-extracted",
        "info",
      );
    }
  });

  // Agent-callable tool: structured detection report.
  pi.registerTool({
    name: "lsp_detect",
    label: "Detect LSP",
    description:
      "Detect available LSP servers for the current project. Returns available LSPs " +
      "(with resolved command + languages), unavailable ones (with install hints), and " +
      "the inferred set of languages. Use when you need to know which language servers " +
      "are installed/relevant for the project.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const result = runDetection(ctx.cwd);
      const languages = cached ? cached.languages : inferLanguages(result.available);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                available: result.available,
                unavailable: result.unavailable,
                languages,
              },
              null,
              2,
            ),
          },
        ],
        details: {
          availableCount: result.available.length,
          unavailableCount: result.unavailable.length,
          languages,
        },
      };
    },
  });
}
