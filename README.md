# Huanyu AI 开发配置

个人 AI 编码协作配置仓库，采用「双配置演进」：保留原始 **opencode** 配置，并已迁移出原生 **Pi Agent** 配置作为当前主力方向。两套配置可独立运行。

## 配置对照总览

| 维度 | opencode (`.opencode/`) | Pi Agent (`.pi/`) |
|------|------------------------|-------------------|
| 定位 | 原始配置（历史/全局源） | 迁移后主力（未来方向） |
| 启动 | `opencode` | `pi` |
| 主配置 | `opencode.json` | `settings.json` + `AGENTS.md` |
| 主模型 | `openai/gpt-5.5`（单一） | `minimax-cn/MiniMax-M3` + `glm-5.2`（双国内套餐分层） |
| 子代理 | 21 个 custom agent | 9 个 pi-subagents builtin（零 custom） |
| 命令 | 36 个 | 35 个 prompt（+ `/grill-me`，- `sync-config`/`create-project`） |
| 技能 | 37 个，**全量注入** context | 36 个，**按需加载**（progressive disclosure） |
| 插件 | 5 个 TS plugin | 5 个 Pi extension（+ `_shared`） |
| MCP | 原生 `mcp` 字段（即时连接） | pi-mcp-adapter + `.mcp.json`（lazy + proxy，省 context） |
| 权限 | 命令级 bash 白名单 | 工具级白名单 |
| 自包含 | 是 | ✅ 完全自包含（已脱离 opencode，可独立删除 `.opencode/`） |

---

## opencode 配置 (`.opencode/`)

原始配置，采用「全局配置 + 多项目目录 + 项目级镜像」模式。

### 目录结构

```text
.opencode/
├── opencode.json        主配置（model / instructions / agent / command / mcp / plugin）
├── AGENTS.md            主代理指令
├── ETHOS.md             工程哲学
├── agents/              Agent 定义（21 个：build/architect/planner + 17 subagent）
├── commands/            命令模板文件
├── prompts/             子代理提示词
├── skills/              37 个技能
├── plugins/             5 个插件
├── rules/  instructions/  state/
```

### 核心机制

- **21 个细分 agent**：`build`（主）/ `architect`（只读规划）/ `planner` + 17 个专职 subagent（implementer / reviewer / debugger / security-auditor / …）
- **36 个命令**：`/brainstorm` `/plan` `/execute` `/finish` `/review` `/debug` `/learn` `/quality` 等
- **技能全量注入**：`instructions` 数组列出 33 个 `SKILL.md`，常驻 context
- **复利循环**：`/create-project` → 开发 → 优化配置 → `/sync-config` 回写全局

### 配置校验规则

- `plugin` 路径必须是 `./plugins/...`（非 `./.opencode/plugins/...`）
- `instructions` 路径不带 `.opencode/` 前缀
- `prompt` 引用必须是 `{file:agents/...}` 或 `{file:prompts/...}`

---

## Pi Agent 配置 (`.pi/`)

迁移后主力配置，采用 Pi 原生范式。完整文档见 [`.pi/README.md`](.pi/README.md)，主代理指令见 [AGENTS.md](AGENTS.md)。

### 目录结构

```text
.pi/
├── settings.json        模型分层（双套餐）+ compaction/retry + skills 引用
├── README.md            Pi 配置完整文档（迁移对照 / 工作流 / 已知差异）
├── prompts/             35 个斜杠命令（subagent 映射 builtin）
├── skills/              36 个技能（已内化，脱离 opencode）
└── extensions/          5 个 Pi extension + _shared.ts
.mcp.json                3 个 MCP server（pi-mcp-adapter，lazy，gitignored）
AGENTS.md                主代理核心指令（项目根，GitNexus + 哲学/工作流/编排）
```

### 核心机制

- **9 个 builtin 子代理**（零 custom，随 pi-subagents 升级）：`worker` / `reviewer` / `planner` / `oracle` / `advisor` / `researcher` / `scout` / `context-builder` / `delegate`
- **模型分层**（双国内编码套餐，额度内不另计费）：
  - `MiniMax-M3`：主代理 + planner + oracle + scout（minimax token plan）
  - `glm-5.2`：reviewer + worker + researcher + 其余（智谱 Z coding plan）
  - 手动切换：`/subagents`（子代理 model/thinking）、`/model`（主代理）
- **主线工作流**：`/brainstorm` →（复杂用 `/grill-me`）→ `/plan` → `/execute` → `/finish`
- **技能按需加载**：仅描述常驻上下文，匹配时才读完整 `SKILL.md`
- **学习系统**：`/learn` `/learn-status` `/learn-evolve`，数据存 `~/.pi/learnings/`

---

## 使用

```bash
opencode     # 原始配置
pi           # 当前主力（Pi Agent）
```

两套配置可在同一项目并存、互不影响。Pi 已完全自包含——即使删除整个 `.opencode/`，Pi 仍可独立运行（skills / 数据 / 命令全部内化在 `.pi/` 与 `~/.pi/`）。

## 迁移关系

Pi 配置由 opencode 配置完整迁移而来，关键转换：

| opencode | → | Pi |
|----------|---|-----|
| `instructions` + `ETHOS` + `rules` | → | `AGENTS.md`（核心指令常驻） |
| 21 custom agent | → | 9 builtin（审查类 7→1、实现类 7→1 收敛） |
| 36 command | → | 35 prompt（弃 opencode 专有的 sync-config/create-project，增 `/grill-me`） |
| skills 全量注入 | → | 按需加载 |
| 手写 MCP | → | pi-mcp-adapter |
| `~/.opencode/learnings` | → | `~/.pi/learnings` |

详细对照见 [`.pi/README.md`](.pi/README.md)。

## 许可

MIT License。
