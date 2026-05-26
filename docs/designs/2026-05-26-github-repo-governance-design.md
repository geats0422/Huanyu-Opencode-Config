# GitHub 仓库治理配置设计文档

## 目标

为个人项目仓库建立一套轻量但可靠的 GitHub/Git 治理配置，核心目标是避免直接在 `main` 上开发、统一分支命名和分支流转、规范 commit message，并在提交、推送、release、hotfix 前进行半强制检查。

这套配置面向一人公司当前使用场景，同时保留未来扩展到团队协作的空间。

## 用户场景

主要使用者是个人开发者，在多个项目仓库中独立完成开发、提交、推送、发布和紧急修复。

典型流程：

1. 开始新功能时运行 `/branch-guide` 获取分支建议。
2. 开发过程中运行 `/git-check` 检查当前仓库状态。
3. 提交前运行 `/commit-guide` 检查 diff 并生成 commit message 建议。
4. 发版前运行 `/release-check` 检查 release 分支和发版准备。
5. 线上紧急修复时运行 `/hotfix-check` 检查 hotfix 分支和回合并路径。

## 技术方案

本阶段采用 `Skill + Subagent + Commands`，暂不加入 Plugin。

原因：

- 不自动拦截 Git 命令，避免流程过重。
- 通过显式命令触发，更稳定、更容易调试。
- 后续如果命令使用频率高，再升级为提醒型或半强制 Plugin。

## 分支规范

默认启用以下分支模型：

```text
main
develop
feature/*
release/*
hotfix/*
```

| 分支 | 作用 | 来源 | 合并目标 |
|------|------|------|----------|
| `main` | 稳定生产分支 | 无 | 不直接开发 |
| `develop` | 日常开发集成分支 | `main` 初始化 | `release/*` 或最终回 `main` |
| `feature/*` | 新功能开发 | `develop` | `develop` |
| `release/*` | 预发布稳定 | `develop` | `main` + `develop` |
| `hotfix/*` | 紧急线上修复 | `main` | `main` + `develop` |

分支命名示例：

```text
feature/user-login
feature/payment-flow
hotfix/auth-token-expiry
release/v1.2.0
```

## Commit 规范

采用混合 Conventional Commits：

```text
<type>: <description>
```

类型固定英文，描述可中文或英文。

示例：

```text
feat: 新增登录页面
fix: handle auth timeout
docs: 更新部署说明
```

允许类型：

```text
feat, fix, docs, style, refactor, perf, test, chore
```

轻量提交大小提醒规则：

- 变更文件数量过多时提醒。
- diff 行数过大时提醒。
- 同时修改前端、后端、文档、配置时提醒。
- 不默认阻断，但要求用户确认是否拆分。

## 配置组件

### Skill

新增 skill：

```text
.opencode/skills/github-repo-governance/SKILL.md
```

作用：

- 定义 Git/GitHub 仓库治理总规则。
- 在用户提到 Git 规范、分支、commit、push、merge、release、hotfix、PR 时触发。
- 为提交信息、分支建议、发布检查提供统一规则来源。

### Subagent

新增 subagent：

```text
.opencode/agents/git-governance-reviewer.md
```

职责：

- 检查当前分支是否符合规范。
- 检查是否有未提交变更。
- 检查 staged / unstaged diff。
- 判断 commit 类型建议。
- 检查 commit message 是否合规。
- 检查是否存在 `main` 直改风险。
- 检查 release/hotfix 合并路径。
- 输出风险等级和建议操作。

建议模式：

```text
mode: subagent
tools: read + bash
write: false
edit: false
```

该 agent 不直接写文件，只输出可保存到 `docs/git/` 的报告内容；由主流程或用户确认后保存。

### Commands

新增 5 个命令，并采用 commands 文件化方式：

```text
.opencode/commands/git-check.md
.opencode/commands/branch-guide.md
.opencode/commands/commit-guide.md
.opencode/commands/release-check.md
.opencode/commands/hotfix-check.md
```

| 命令 | 作用 |
|------|------|
| `/git-check` | 综合检查当前 Git 状态、分支、变更、风险 |
| `/branch-guide` | 根据任务类型建议创建分支 |
| `/commit-guide` | 检查 diff 并建议 commit 类型和 message |
| `/release-check` | 检查 release 分支和发版准备 |
| `/hotfix-check` | 检查 hotfix 分支和回合并路径 |

`opencode.json` 中使用文件引用：

```json
"git-check": {
  "description": "Review current Git state against personal GitHub governance rules",
  "template": "{file:commands/git-check.md}",
  "agent": "git-governance-reviewer",
  "subtask": true
}
```

## 报告输出

默认输出可保存到：

```text
Project/{项目名称}/docs/git/
```

示例：

```text
Project/Xirang/docs/git/2026-05-26-git-check.md
Project/Xirang/docs/git/2026-05-26-commit-guide.md
```

报告结构：

```text
# Git Check Report

## 当前状态
- 当前分支
- upstream
- staged / unstaged 文件
- 最近 commits

## 规范检查
- 分支命名
- main/develop 使用风险
- commit 类型建议
- 提交大小提醒

## 风险等级
- Low / Medium / High

## 建议操作
- 是否继续
- 是否拆分 commit
- 是否新建 feature/hotfix/release 分支
```

## 半强制规则

不会直接阻断，但以下情况标为 High Risk：

- 当前在 `main` 上有未提交业务改动。
- `hotfix/*` 不是从 `main` 创建。
- `feature/*` 不是从 `develop` 创建。
- commit message 缺少合法 type。
- staged diff 同时混合多个明显意图。
- release 分支有未完成测试或未更新文档。

High Risk 行为需要用户显式确认后才继续。

## 错误处理

- 如果当前仓库没有 `develop`，命令应提示创建 `develop`，而不是静默跳过。
- 如果当前目录不是 Git 仓库，应输出明确错误并停止检查。
- 如果没有 staged diff，`/commit-guide` 应提示先 `git add` 或说明仅分析 unstaged diff。
- 如果无法判断项目名称，应要求用户提供项目名称或输出报告到当前仓库的 `docs/git/`。

## 测试策略

验证重点：

- `opencode.json` 能正确加载新增 agent 和 commands。
- 所有 commands 文件路径存在。
- `git-governance-reviewer` 能只读检查 Git 状态并输出可保存到 `docs/git/` 的报告内容。
- `/git-check` 能识别当前分支、未提交变更、最近提交。
- `/commit-guide` 能根据 diff 推荐 commit 类型和 message。
- `/release-check` 和 `/hotfix-check` 能识别错误分支来源或缺失回合并路径。

## 后续实施建议

1. 新建 `github-repo-governance` skill。
2. 新建 `git-governance-reviewer` subagent。
3. 新建 5 个 command 文件。
4. 更新根目录和项目模板的 `opencode.json`。
5. 更新 README / 初始化流程文档。
6. 使用一个测试项目验证 `/git-check` 和 `/commit-guide`。
