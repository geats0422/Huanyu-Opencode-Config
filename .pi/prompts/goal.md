---
description: "Set / view / pause / resume / clear the project's active goal. Usage: /goal <objective> | /goal | /goal pause | /goal resume | /goal clear | /goal progress <0-100> | /goal @<file> | /goal check [item]"
argument-hint: "<objective>"
---

<!-- Converted from opencode command `goal`. -->
管理 .pi/goal.md 中的当前目标。

用户输入: $ARGUMENTS

按以下规则路由（必须严格执行）：

【1. 参数解析】
- 空 → VIEW
- "pause" → PAUSE
- "resume" → RESUME
- "clear" → CLEAR
- 以 "progress " 开头（如 "progress 60"）→ PROGRESS
- 以 "@" 开头（如 "@docs/goals/migration.md"）→ SET_FROM_FILE
- 以 "check " 开头（如 "check 步骤 1"）→ CHECK
- 其他任意非空文本 → SET（视为目标文本）

【2. 文件路径】
始终操作 .pi/goal.md（项目根目录下）。如果文件不存在，先创建带 status: clear 的初始文件。

【3. 格式契约】
文件必须是 yaml frontmatter 形式：
---
status: active | paused | clear
objective: "文本（≤4000 字符）"
created_at: ISO-8601
updated_at: ISO-8601
progress: 0-100
checklist:
  - [ ] 待办
  - [x] 已完成
---

【4. 各操作行为】

VIEW: 读取并格式化输出（状态、目标、进度、检查清单、创建/更新时间）。

SET: 把目标文本写入 objective 字段（自动用双引号包裹，内部双引号转义）；
  - status → active
  - created_at → 首次设置填当前时间，已存在则保留原值
  - updated_at → 当前时间
  - progress → 保留已有值或 0
  - checklist → 保留已有值或 []
  - 长度校验：objective 字段 > 4000 字符 → 拒绝并提示使用 @file 形式

SET_FROM_FILE: 用 read 工具加载 @ 后面的路径文件，把文件首段（≤4000 字符）作为 objective；
  - 其他字段同 SET
  - 原始文件保持不动

PAUSE: status → paused，updated_at → 当前时间。

RESUME: status → active，updated_at → 当前时间。

CLEAR: status → clear，updated_at → 当前时间；objective 保留作为历史记录。

PROGRESS: 解析 "progress " 后面的 0-100 数字，写入 progress 字段；
  - 非法值（非数字、<0、>100）→ 拒绝并提示
  - progress=100 时建议将 status 改为 clear

CHECK: 解析 "check " 后面的文本作为检查项名；
  - 在 checklist 中查找匹配项（模糊匹配包含关系）
  - 找到 → 切换 [ ]/[x] 状态，更新 updated_at
  - 找不到 → 询问用户是追加新项还是放弃

【5. 输出格式】

中文输出，简洁：
- VIEW: 表格或列表展示 5 个字段
- SET/PAUSE/RESUME/CLEAR/PROGRESS/CHECK: 一行确认 + 关键字段值
- 错误: 明确说明问题和建议

【6. 注意事项】
- 时间戳使用 ISO-8601 格式（YYYY-MM-DDTHH:MM:SSZ 或本地时区带偏移）
- 写文件时用 write 工具整体覆盖，不要用 edit 部分修改（避免 yaml 格式错乱）
- 修改前如有重要信息，先备份当前内容到对话中（避免覆盖丢失）
- 如果 goal.md 中已有重要 checklist，SET 新目标时询问是否保留 checklist

【7. 故障处理】
- goal.md 存在但解析失败（yaml 错）→ 读取原始文本回显，提示用户修复或重新设置
- .pi/ 目录不存在 → 自动创建
- 写入失败 → 报错并保留原文件不变
