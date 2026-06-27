---
name: goal-tracking
description: Goal tracking and persistence — reads `.opencode/goal.md` on every turn and aligns responses to the active objective. Use when the project has an active goal set via `/goal`, when the user references "the goal" or "current objective", or when checking whether work advances the stated target. Front-load keywords: `/goal`, goal.md, objective, current goal, 完成目标, 推进目标.
---

# Goal Tracking — 持续对齐当前目标

## 职责

本 skill 被注册在 `instructions` 中，**每轮对话都会自动加载**。职责是让模型始终知道当前项目目标，并在每次响应时对齐。

## 1. 读取目标

每个 turn 的第一件事：

```
读取 .opencode/goal.md（如果存在）
```

如果文件不存在或 `status: clear` → 无目标，正常工作即可。

## 2. 状态语义

| status | 含义 | 模型行为 |
|--------|------|---------|
| `active` | 目标生效中 | 每次响应前在心里对照目标；用户给新任务时优先评估是否推进目标 |
| `paused` | 暂停中 | 不主动推进；用户明确说"继续目标"或 `/goal resume` 才恢复 |
| `clear` | 无目标 | 忽略目标机制 |

## 3. 自动对齐规则

**仅在 status=active 时执行**：

1. **响应前 1 秒**：在心中默念当前 goal 文本，提醒自己用户的总体方向。
2. **用户给新任务时**：
   - 若任务与 goal 直接相关 → 明确告知"该任务在推进当前 goal"
   - 若任务与 goal 不相关 → 简短提醒"这与当前 goal (X) 不直接相关，是否需要先暂停 goal？"
   - 若 goal 包含该任务的同类项 → 提议更新 checklist
3. **完成一项子任务后**：主动询问"是否将 'XXX' 标记为已完成并更新 goal.md？"
4. **用户反馈"目标已达成"**：提议将 `status` 改为 `clear`（或 `paused`），更新 `progress: 100`。

**在 status=paused 时**：不主动推进，但若用户做的工作明显在达成原 goal，可温柔提醒一次。

## 4. 文件格式契约

`.opencode/goal.md` 遵循：

```yaml
---
status: active | paused | clear
objective: "目标文本（≤4000 字符）"
created_at: ISO-8601 时间戳
updated_at: ISO-8601 时间戳
progress: 0-100
checklist:
  - [ ] 待办项
  - [x] 已完成项
---
```

**写入规则**：
- `updated_at` 每次修改都要刷新
- `progress` 由用户显式设定（不自动计算）
- `checklist` 用 `- [ ]` / `- [x]` 维护
- 文件超过 4000 字符 → 建议将细节挪到独立文档，goal.md 中改为 `@path/to/file.md` 引用形式

## 5. 引用外部文件

支持 `objective: "@docs/goals/migration.md"` 形式：

- 读到 `@` 前缀 → 通过 `read` 工具加载文件，把文件**首段**作为目标摘要
- 完整内容由 `objective_ref` 字段记录（`yaml` 自由扩展）
- 任何 turn 中目标变更时，**原始文件不得被本 skill 修改**（只读）

## 6. 与 /goal 命令的协作

`/goal` 命令是用户交互入口，本 skill 是自动对齐机制。两者关系：

| 用户操作 | /goal 命令负责 | 本 skill 负责 |
|---------|--------------|--------------|
| 设置目标 | 写入 goal.md | 下轮起自动加载 |
| 查看目标 | 输出 goal.md 内容 | - |
| 暂停/恢复/清除 | 修改 status 字段 | 后续 turn 按新 status 行为 |
| 子任务推进 | - | 询问并提议更新 checklist |
| 目标达成 | - | 提议 status=clear + progress=100 |

## 7. 不要做的事

- ❌ 不要在没有目标时强加目标（不要凭空创建 goal.md）
- ❌ 不要在 status=paused 时强行推进
- ❌ 不要把"用户讨论 goal 本身"也算作推进任务（避免循环）
- ❌ 不要修改 goal.md 之外的任何文件来"帮助达成目标"
- ❌ 不要在响应正文里大段复读目标（用户已知），只在内部对齐

## 8. 故障处理

| 现象 | 处理 |
|------|------|
| goal.md 解析失败（yaml 错） | 读取原始文本，回显给用户，提示"goal.md 格式异常，请用 `/goal` 重新设置" |
| goal.md 缺失 status 字段 | 视为 `clear` |
| objective 超过 4000 字符 | 截断警告 + 建议用 `@file.md` 引用 |
| 用户明确说"别管 goal 了" | 当作一次性豁免，不修改 goal.md |
