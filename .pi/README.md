# Pi Agent 配置（Huanyu Code）

本目录是 **opencode 配置 (`.opencode/`) 迁移到 Pi Agent** 的产物，采用 **Pi 原生范式**：不维护 custom 子代理，全部复用 pi-subagents 的 builtin + 按需 skills + extensions + pi-mcp-adapter。

## 目录结构

```
.pi/
├── settings.json        模型 / compaction / retry + skills 引用
├── prompts/*.md         35 个斜杠命令（subagent 已映射 builtin）
├── skills/              36 个标准 Agent Skills（已内化，脱离 opencode）
└── extensions/
    ├── _shared.ts              共享工具（项目检测/路径/notify）
    ├── my-plugin.ts            会话摘要 / .env 与配置文件保护 / 危险命令警告
    ├── quality-metrics.ts      质量工具检测 + quality_scan 工具
    ├── lsp-auto.ts             LSP 检测 + lsp_detect 工具
    ├── learning-persistence.ts 复利学习 + learn_* 工具
    └── openwolf-lite.ts        会话度量 / 文件解剖 / do-not-repeat
.mcp.json               pi-mcp-adapter 配置（3 server，lazy，gitignored）
AGENTS.md               主代理核心指令（GitNexus + 哲学/规范/工作流/编排）
```

## 启用

1. 本目录启动 `pi`；首次提示**信任项目**（有 `.pi/` 配置）→ 选信任
2. 模型：默认主代理 `minimax-cn/MiniMax-M3`；子代理双套餐分层（见末「已知差异」）。`/model` 切主代理、`/subagents` 切子代理
3. 已装包：`pi-subagents`、`pi-mcp-adapter`、`pi-web-access`（全局 settings.packages）

## 主线工作流（brainstorm → grill-me → plan → execute）

| 阶段 | 执行方 | 产物 |
|------|--------|------|
| `/brainstorm` | **主代理** + brainstorming 技能（Socratic 对话，HARD GATE 禁码） | 设计文档 `Project/*/docs/designs/` |
| `/grill-me` | **主代理** + grill-me 技能（复杂变更才用，一次一问追到叶子节点） | 需求对齐总结 |
| `/plan` | 委派 **planner** builtin（fork read-only） | `plan.md`（2-5 分钟任务） |
| `/execute` | **主代理编排**：每任务 worker(TDD) → reviewer(两阶段：spec+quality) | 实现 + 审查 |
| `/finish` | **主代理** + finishing-a-branch 技能 | 验证/提交/PR |

## 子代理（pi-subagents 9 个 builtin，无 custom）

不维护 custom 子代理，全部复用 builtin（随包升级、带 intercom 协作）：

| builtin | 用途 |
|---------|------|
| `worker` (alias: implementer) | 实现/修 bug/TDD/构建修复/E2E/重构/文档 |
| `reviewer` | 代码/规格/质量/安全/数据库/Python/git 审查 |
| `planner` | 任务拆解（产 plan.md） |
| `oracle` | 设计决策一致性（fork） |
| `researcher` | web 研究（自带 web_search/fetch_content） |
| `scout` / `context-builder` / `delegate` | 侦察 / 上下文 / 轻量继承 |

**技能中旧 agent 名的兼容**：opencode 技能（execute-plans 等）引用的 `implementer`/`debugger`/`tdd-guide`/`spec-reviewer`/`security-auditor` 等 → 见 AGENTS.md「兼容映射」对应 builtin。

## 命令 `.pi/prompts/`（35 个）

frontmatter 的 `subagent:` 已映射 builtin（11→worker、9→reviewer、3→planner、1→researcher）；交互/工具驱动型命令（`/brainstorm` `/grill-me` `/execute` `/learn*` `/goal`）不带 subagent 由主代理执行。参数 `$ARGUMENTS`。

## 技能 `.pi/skills/`（36 个，按需加载，已内化脱离 opencode）

`settings.json` 的 `"skills": ["./skills"]` 引用（已内化到 `.pi/skills`，脱离 opencode）。Pi 兼容 Agent Skills 标准，**progressive disclosure**：仅描述常驻上下文，匹配时自动读完整 `SKILL.md`。

## MCP（pi-mcp-adapter）

经 `pi-mcp-adapter` 集成（**非** 手写 extension）。`.mcp.json` 定义 3 个 server（MiniMax/stitch/智谱），**lazy 连接**（首次调用才启动）+ **proxy 模式**（一个 `mcp` 工具 ~200 tokens 代替全部工具定义，省 context）。

- 运行时依赖：`uvx`（MiniMax）、`npx`（智谱）须在 PATH
- `.mcp.json` 含内联密钥，已 gitignored
- `/mcp` 打开交互面板，`mcp({search:"..."})` 搜索工具，`mcp({tool:"...",args:{}})` 调用
- 想把特定工具暴露为一级工具：`.mcp.json` 里给 server 加 `"directTools": true` 或工具名数组

## 扩展 `.pi/extensions/`（5 插件 + _shared）

| extension | 功能 | 工具 |
|-----------|------|------|
| `my-plugin` | 会话摘要；`.env`/linter 配置写入阻断（tool_call block）；危险命令警告 | — |
| `quality-metrics` | 项目类型+16 工具检测 | `quality_scan` |
| `lsp-auto` | 15 LSP 检测 | `lsp_detect` |
| `learning-persistence` | 复利学习条目读写/置信度进化 | `learn_add`/`learn_list`/`learn_stats` |
| `openwolf-lite` | 会话度量/文件解剖/DNR（`.pi/state/`） | — |

## 迁移对照表

| opencode | Pi Agent | 说明 |
|----------|----------|------|
| `model` | `settings.json` defaultProvider/defaultModel | 拆分 |
| `instructions`+`ETHOS`+`rules` | `AGENTS.md` | 整合核心指令 |
| `skills/*/SKILL.md` (36) | `.pi/skills`（已内化） | 脱离 opencode 依赖 |
| `agents` subagent×20 | **pi-subagents 9 builtin**（删全部 custom） | 方案①：原生范式 |
| `agents.build` | Pi 默认代理 + AGENTS.md | — |
| `commands`×36 | `.pi/prompts/*.md`×37（+grill-me） | subagent 映射 builtin |
| `plugins/*.ts`×5 | `.pi/extensions/*.ts`×5 + `_shared` | Pi ExtensionAPI 重写 |
| `mcp`×3 | `.mcp.json` + pi-mcp-adapter | lazy + proxy，替代手写 extension |

## 已知差异

- **细粒度 bash 权限**：opencode 按命令白名单（architect 仅 git log/diff）；Pi `tools` 是工具级白名单。只读靠 builtin reviewer 不写文件 + prompt 约律。
- **temperature**：Pi 用 thinking level（已设 medium），未保留 opencode 的 temperature 值。
- **skills 范式**：opencode 全量注入 → Pi 按需加载；核心原则在 AGENTS.md 常驻，其余 skill 描述匹配触发。
- **模型分层（C 已实施，双国内套餐分工，可手动切换）**：核心用两个国内编码套餐——智谱 (`zai-coding-cn`) + MiniMax (`minimax-cn`)，额度内不另计费。默认：`MiniMax-M3`（主代理/planner/oracle/scout）+ `glm-5.2`（reviewer/worker/researcher/context-builder/delegate/advisor）。glm-5-turbo 实测不可调用已弃用。**手动切换**：`/subagents` 编辑任意子代理的 model/thinking，`/model` 切主代理；有代理时 `/model openai-codex/gpt-5.6-sol` 白嫖 ChatGPT plus。
