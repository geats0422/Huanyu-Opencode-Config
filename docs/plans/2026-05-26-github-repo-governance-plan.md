# GitHub 仓库治理配置实施计划

## 总览

本计划将 `docs/designs/2026-05-26-github-repo-governance-design.md` 中的 GitHub/Git 仓库治理方案拆解为可执行任务。

实现范围：新增一个治理 Skill、一个 Git 检查 Subagent、五个文件化 Commands，并更新 `.opencode/opencode.json` 使命令可被调用。

本阶段不实现自动拦截 Git 命令，不新增 Plugin，仅通过显式命令完成半强制检查与报告输出。

## 前置准备

- [ ] 确认设计文档已批准：`docs/designs/2026-05-26-github-repo-governance-design.md`
- [ ] 运行 `git status` 确认当前工作区状态
- [ ] 检查 `.opencode/opencode.json`
- [ ] 确认 `.opencode/commands/`、`.opencode/agents/`、`.opencode/skills/` 目录存在

## 任务列表

### 任务 1: 创建 GitHub 仓库治理 Skill

- **描述**: 新增 `github-repo-governance` skill，集中定义分支规范、commit 规范、风险等级、触发场景和命令使用说明。
- **文件**: `.opencode/skills/github-repo-governance/SKILL.md`
- **验证**:
  - 文件存在
  - 包含触发场景：Git 规范、分支、commit、push、merge、release、hotfix、PR
  - 包含分支模型：`main`、`develop`、`feature/*`、`release/*`、`hotfix/*`
  - 包含 commit 类型：`feat, fix, docs, style, refactor, perf, test, chore`

### 任务 2: 创建 Git 治理 Subagent Prompt

- **描述**: 新增 `git-governance-reviewer` agent prompt，定义只读 Git 检查、diff 分析、commit message 检查、release/hotfix 检查和报告输出职责。
- **文件**: `.opencode/agents/git-governance-reviewer.md`
- **验证**:
  - 文件存在
  - 明确禁止直接修改业务代码
  - 明确不直接写文件，只输出可保存到 `docs/git/` 的报告内容
  - 包含 High Risk 规则
  - 包含非 Git 仓库、缺少 develop、无 staged diff 等错误处理

### 任务 3: 创建 `/git-check` 命令文件

- **描述**: 创建综合 Git 状态检查命令模板，要求 agent 检查当前分支、upstream、staged/unstaged diff、最近 commits、风险等级和建议操作。
- **文件**: `.opencode/commands/git-check.md`
- **验证**:
  - 文件存在
  - 模板要求输出可保存到 `docs/git/YYYY-MM-DD-git-check.md` 的报告内容
  - 模板要求识别 `main` 直改风险

### 任务 4: 创建 `/branch-guide` 命令文件

- **描述**: 创建分支建议命令模板，根据用户任务类型建议 `feature/*`、`hotfix/*` 或 `release/*` 分支，并检查来源分支是否合理。
- **文件**: `.opencode/commands/branch-guide.md`
- **验证**:
  - 文件存在
  - 模板包含命名示例
  - 模板包含缺少 `develop` 时的提示

### 任务 5: 创建 `/commit-guide` 命令文件

- **描述**: 创建 commit 指导命令模板，分析 staged diff 或 unstaged diff，建议 Conventional Commit 类型和 message，并提示提交大小风险。
- **文件**: `.opencode/commands/commit-guide.md`
- **验证**:
  - 文件存在
  - 模板包含合法 commit type 列表
  - 模板包含无 staged diff 时的处理逻辑
  - 模板包含大 diff、多意图变更提醒

### 任务 6: 创建 `/release-check` 命令文件

- **描述**: 创建 release 检查命令模板，检查当前是否在 `release/*` 分支、是否从 `develop` 创建、是否准备合并到 `main` 和回合并到 `develop`。
- **文件**: `.opencode/commands/release-check.md`
- **验证**:
  - 文件存在
  - 模板包含 release 分支命名检查
  - 模板包含测试、文档、版本准备检查
  - 模板包含回合并路径检查

### 任务 7: 创建 `/hotfix-check` 命令文件

- **描述**: 创建 hotfix 检查命令模板，检查当前是否在 `hotfix/*` 分支、是否从 `main` 创建、是否准备合并回 `main` 和 `develop`。
- **文件**: `.opencode/commands/hotfix-check.md`
- **验证**:
  - 文件存在
  - 模板包含 hotfix 分支来源检查
  - 模板包含紧急修复范围检查
  - 模板包含回合并 `develop` 检查

### 任务 8: 更新 `.opencode/opencode.json` agent 配置

- **描述**: 在 `.opencode/opencode.json` 的 `agent` 区域新增 `git-governance-reviewer` 配置。
- **文件**: `.opencode/opencode.json`
- **验证**:
  - `git-governance-reviewer` agent 存在
  - `mode` 为 `subagent`
  - `prompt` 指向 `{file:agents/git-governance-reviewer.md}`
  - `tools` 至少包含 `read: true`、`bash: true`、`write: false`、`edit: false`

### 任务 9: 更新 `.opencode/opencode.json` command 配置

- **描述**: 在 `.opencode/opencode.json` 的 `command` 区域新增五个命令入口，并指向对应 command 文件。
- **文件**: `.opencode/opencode.json`
- **验证**:
  - 新增 `git-check`、`branch-guide`、`commit-guide`、`release-check`、`hotfix-check`
  - 每个命令使用 `{file:commands/<name>.md}`
  - 每个命令指定 `agent: git-governance-reviewer`
  - 每个命令设置 `subtask: true`

### 任务 10: 将治理 Skill 加入 instructions 列表

- **描述**: 将新增 skill 加入 `.opencode/opencode.json` 的 `instructions`，确保规则可被全局加载。
- **文件**: `.opencode/opencode.json`
- **验证**:
  - `instructions` 中包含 `skills/github-repo-governance/SKILL.md`
  - 原有 instructions 未被删除或重排破坏

### 任务 11: 补充 Git 报告目录说明文档

- **描述**: 新增报告目录说明，定义 `docs/git/` 的报告用途、命名规则和保留策略。
- **文件**: `docs/git/README.md`
- **验证**:
  - 文件存在
  - 包含报告命名示例
  - 包含报告结构说明

### 任务 12: 更新项目初始化/使用文档

- **描述**: 更新现有项目初始化文档，说明新仓库应使用 Git 治理命令。
- **文件**: `docs/new-project-init-checklist.md`
- **验证**:
  - 文档提到 `/branch-guide`、`/git-check`、`/commit-guide`
  - 文档说明新项目建议初始化 `develop` 分支

### 任务 13: 验证配置文件可解析

- **描述**: 验证 `.opencode/opencode.json` 修改后仍为合法 JSON。
- **文件**: `.opencode/opencode.json`
- **验证**:
  - JSON 解析成功
  - 没有尾逗号、重复结构破坏或括号错误

### 任务 14: 验证文件路径完整性

- **描述**: 检查所有新增 commands、agent、skill 文件路径是否存在，并与 `opencode.json` 引用一致。
- **文件**:
  - `.opencode/opencode.json`
  - `.opencode/commands/*.md`
  - `.opencode/agents/git-governance-reviewer.md`
  - `.opencode/skills/github-repo-governance/SKILL.md`
- **验证**:
  - 所有 `{file:...}` 引用都有对应文件
  - 无拼写不一致

### 任务 15: 手动试运行 `/git-check` 和 `/commit-guide`

- **描述**: 在当前仓库中试运行核心命令，确认 agent 能读取 Git 状态并生成报告建议。
- **可能生成**:
  - `docs/git/YYYY-MM-DD-git-check.md`
  - `docs/git/YYYY-MM-DD-commit-guide.md`
- **验证**:
  - `/git-check` 能识别当前分支、未提交变更、最近 commits
  - `/commit-guide` 能在有 staged 或 unstaged diff 时给出 commit 类型建议
  - 输出包含风险等级和建议操作

## 并行机会

- 任务 3、4、5、6、7 可在任务 2 完成后并行执行。
- 任务 11 和任务 12 可在命令文件完成后并行执行。
- 任务 8 和任务 10 可在任务 1、2 完成后并行执行。

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| `opencode.json` JSON 格式损坏 | 中 | 高 | 每次修改后运行 JSON parse 检查 |
| command 文件路径和配置引用不一致 | 中 | 中 | 增加路径完整性验证任务 |
| agent 权限过宽导致可修改业务代码 | 低 | 高 | 明确设置 `edit: false`，prompt 中禁止修改业务代码 |
| 命令输出过重影响日常使用 | 中 | 中 | 保持 warning-only，不自动阻断 |
| 缺少 `develop` 的旧仓库误报 | 中 | 低 | 命令提示创建 `develop`，不静默失败 |

## 最终验收标准

- `.opencode/skills/github-repo-governance/SKILL.md` 已创建。
- `.opencode/agents/git-governance-reviewer.md` 已创建。
- 五个 command 文件已创建。
- `.opencode/opencode.json` 已注册 agent 和 commands。
- JSON 配置可解析。
- `/git-check` 和 `/commit-guide` 可手动运行并输出合理建议。
- 文档中包含新流程说明。
