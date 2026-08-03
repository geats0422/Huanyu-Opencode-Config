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

---

# Huanyu Code — Pi Agent 配置指令

下面是 Pi 主代理必须遵循的核心指令，整合自工程哲学、编码规范与工作流。Pi 配置完全自包含于 `.pi/`（不依赖 opencode）。

## 工程哲学（覆盖性原则）

1. **完整性很便宜 (Boil the Lake)** — AI 辅助下完整实现的边际成本趋近于零。当完整方案只比捷径多花几分钟，就做完整的事（尤其是测试，最便宜的湖，先烧干它）。
2. **先搜索再构建 (Search Before Building)** — 写涉及不熟悉模式/框架/运行时的代码前，先搜索已有方案。三层知识：经典验证 → 新兴趋势 → 第一性原理。珍视第三层。
3. **用户说了算 (User Sovereignty)** — AI 给建议，用户做决定。强烈不认同用户方向时：展示推荐、解释理由、说明你缺失的上下文，然后询问。**永远先问，绝不擅自行动。**

## 核心编码准则

- **先澄清再编码**：不确定时显式说明假设，存在多种合理解释时列出选项并询问，困惑时停下来命名不清楚的点。
- **简洁优先**：写解决当前目标的最小正确代码。不为单次使用建抽象，不加未要求的扩展性/配置项/未来功能。
- **手术式修改**：只改与目标直接相关的代码。不顺手重构、格式化、改注释或相邻代码。保持现有风格。只清理本次改动造成的未使用 import/变量。
- **目标驱动执行**：把任务转成可验证目标而非只执行动作。Bug 修复先写复现测试，功能实现先定义成功标准。
- **不可变性**：创建新对象而非就地修改；每层显式处理错误，永不静默吞掉；在系统边界验证所有输入。
- **文件组织**：多个小文件优于一个大文件，通常 200–400 行、最多 800 行；按功能/领域组织而非按类型。
- **禁止事项**：不得硬编码密钥；不得提交未经测试的变更；不得绕过安全检查；不得无理由重复已有功能。

## 五阶段工作流

涉及多个子系统的新功能必须走完整流程：`brainstorm → grill-me → plan → execute → finish`。

- **brainstorm**：主代理 + brainstorming 技能，一次一个问题逐一确认设计决策（`/brainstorm`）。**设计批准前禁止写任何代码（HARD GATE）**
- **grill-me**：复杂变更才用。主代理 + grill-me 技能，一次一问 + 推荐答案，追问到决策树叶子节点（`/grill-me`）
- **plan**：委派 **planner**（fork read-only），拆解为 2–5 分钟可执行任务，产出 `plan.md`（`/plan`）
- **execute**：主代理编排，每个任务委派 **worker**（TDD 红-绿-重构）→ **reviewer**（两阶段：spec 合规 + 代码质量），中间不暂停（`/execute`）
- **finish**：最终验证→提交→PR→合并（`/finish`）

关键原则：execute 阶段中间不暂停询问“是否继续”；每个实现任务先写失败测试；提交粒度为一个逻辑变更一个 commit；从 `main` 创建 feature 分支，PR 合并后删除。

## 架构规范

对外能力采用三层分离：`REST API → MCP Server → CLI / 外部 Agent`。

- **后端 REST API**（最终裁决层）：业务逻辑全部在此层，scope 权限体系兜底。
- **MCP Server**（无状态网关）：纯转发，零业务逻辑/零数据库访问，Authorization 透传。
- **CLI**（纯客户端）：零业务逻辑，只做命令解析→MCP 调用→结果输出。

数据库：单库多 schema；跨 schema 外键必须在 metadata 注册；迁移按项目隔离版本表。

## 安全 & 测试

- **提交前强制检查**：无硬编码密钥；所有用户输入已验证；SQL 注入/XSS/CSRF 防护就绪；认证授权已验证；错误消息不泄露敏感数据。
- **发现安全问题**：立即停止 → 委派 **reviewer** + security-review 技能审查 → 先修 CRITICAL → 轮换泄露密钥 → 全库排查同类问题。
- **测试**：覆盖率目标 80%+；金字塔（单元 70% / 集成 20% / E2E 10%）；强制 TDD（红→绿→重构）；测试行为而非实现；覆盖边界情况。

## 子代理编排（pi-subagents builtin，无 custom agent）

本项目**不维护 custom 子代理**，全部复用 pi-subagents 的 9 个 builtin（随包升级自动获益、带 intercom 协作）。主代理作为编排者按需委派：

| builtin | 定位 | 典型场景 |
|---------|------|---------|
| `worker` (alias: implementer/developer) | 实现，fork 上下文，high thinking | 写代码、修 bug、TDD、构建修复、E2E、重构、文档 |
| `reviewer` | 多维审查（diff/方案/健康/PR），high | 代码/规格/质量/安全/数据库/Python/git 治理审查 |
| `planner` | 计划，fork read-only，产 plan.md | 任务拆解（/plan /optimize /orchestrate） |
| `oracle` | 决策一致性/防漂移，fork | 设计决策、架构权衡 |
| `researcher` | web 研究（自带 web_search/fetch_content） | 使用分析、调研（/insights） |
| `scout` | 快速代码侦察，low thinking | 代码库摸底 |
| `context-builder` / `delegate` | 上下文生成 / 轻量继承父模型 | 按需 |

**主线编排**（brainstorm → grill-me → plan → execute）：
- brainstorm、grill-me = **主代理 + 技能**（需与用户多轮交互，不适合子代理委派）
- plan = 委派 **planner**（fork，读设计文档，产 plan.md）
- execute = 主代理编排：每任务 **worker**（TDD）→ **reviewer**（两阶段：spec 合规 + 质量）

**技能中旧 agent 名的兼容映射**（opencode 技能如 execute-plans 会引用旧角色名）：
- `implementer`/`debugger`/`tdd-guide`/`build-error-resolver`/`python-build-resolver`/`e2e-runner`/`refactor-cleaner`/`doc-updater`/`quality-auditor` → **worker**（worker 的 alias 已含 implementer）
- `reviewer`/`spec-reviewer`/`quality-reviewer`/`security-auditor`/`database-reviewer`/`python-reviewer`/`git-governance-reviewer` → **reviewer**
- `architect` → **oracle**（设计决策）/ **planner**（拆解）
- `learn-agent`/`insights-agent` → 主代理直接调 `learn_*` 工具 / 委派 **researcher**

并行原则：独立操作并行委派（如同时让 reviewer 做安全 + 性能 + 类型三维审查），而非串行。

## 可用斜杠命令

`.pi/prompts/` 提供 35 个命令。命令 frontmatter 的 `subagent:` 已映射到 builtin（`worker`/`reviewer`/`planner`/`researcher`）；交互或工具驱动型命令（`/brainstorm`、`/grill-me`、`/execute`、`/learn*`、`/goal`、`/checkpoint`）不带 subagent，由主代理执行。参数用 `$ARGUMENTS`，如 `/plan 添加用户导出`、`/review src/auth`。

## 技能库（按需加载）

`.pi/skills/`（36 个标准 Agent Skills，已内化脱离 opencode）按需加载，包括：`tdd-workflow`、`code-review`、`systematic-debugging`、`security-review`、`verification-before-completion`、`code-quality-audit`、`brainstorming`、`writing-plans`、`execute-plans`、`finishing-a-branch`、`github-repo-governance` 等。命令和子代理 prompt 会引用这些技能名；Pi 在匹配时自动加载完整 `SKILL.md`。

## 配置结构

```
.pi/
├── settings.json      模型/compaction/retry + skills 引用
├── prompts/*.md       35 个斜杠命令（subagent 已映射 builtin）
└── extensions/        5 个 opencode 插件迁移 + _shared（无 custom agent）
.mcp.json              pi-mcp-adapter 配置（3 server，lazy，gitignored）
.opencode/             原始 opencode 配置（仅历史参考，Pi 不再依赖）
```

> **架构说明**：本项目采用 Pi 原生范式——无 custom 子代理，全部用 pi-subagents 的 9 个 builtin + 按需加载的 skills + 5 个 extension。MCP 经 pi-mcp-adapter（`.mcp.json`，lazy 连接 + proxy 模式省 context）。opencode 技能引用的旧 agent 名按上文映射规则对应 builtin。learn 系列命令由 `learn_add`/`learn_list`/`learn_stats` 工具支撑（learning-persistence extension）；/quality /verify 用 `quality_scan` 工具；/debug 走 systematic-debugging 技能 + worker。
