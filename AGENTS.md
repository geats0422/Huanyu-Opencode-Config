<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Huanyu-Opencode-Config** (73759 symbols, 155869 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Huanyu-Opencode-Config/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Huanyu-Opencode-Config/clusters` | All functional areas |
| `gitnexus://repo/Huanyu-Opencode-Config/processes` | All execution flows |
| `gitnexus://repo/Huanyu-Opencode-Config/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Components area (1047 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Interactive area (458 symbols) | `.claude/skills/generated/interactive/SKILL.md` |
| Work in the Plugins area (425 symbols) | `.claude/skills/generated/plugins/SKILL.md` |
| Work in the Hooks area (405 symbols) | `.claude/skills/generated/hooks/SKILL.md` |
| Work in the Permissions area (370 symbols) | `.claude/skills/generated/permissions/SKILL.md` |
| Work in the Test area (351 symbols) | `.claude/skills/generated/test/SKILL.md` |
| Work in the Bridge area (316 symbols) | `.claude/skills/generated/bridge/SKILL.md` |
| Work in the Api area (277 symbols) | `.claude/skills/generated/api/SKILL.md` |
| Work in the Extensions area (267 symbols) | `.claude/skills/generated/extensions/SKILL.md` |
| Work in the Mcp area (255 symbols) | `.claude/skills/generated/mcp/SKILL.md` |
| Work in the Providers area (220 symbols) | `.claude/skills/generated/providers/SKILL.md` |
| Work in the Ink area (208 symbols) | `.claude/skills/generated/ink/SKILL.md` |
| Work in the Tools area (188 symbols) | `.claude/skills/generated/tools/SKILL.md` |
| Work in the Bash area (170 symbols) | `.claude/skills/generated/bash/SKILL.md` |
| Work in the Swarm area (151 symbols) | `.claude/skills/generated/swarm/SKILL.md` |
| Work in the Model area (150 symbols) | `.claude/skills/generated/model/SKILL.md` |
| Work in the BashTool area (150 symbols) | `.claude/skills/generated/bashtool/SKILL.md` |
| Work in the Bootstrap area (124 symbols) | `.claude/skills/generated/bootstrap/SKILL.md` |
| Work in the Scripts area (119 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Services area (110 symbols) | `.claude/skills/generated/services/SKILL.md` |

<!-- gitnexus:end -->
