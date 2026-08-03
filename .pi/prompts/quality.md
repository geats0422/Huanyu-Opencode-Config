---
description: "Universal code quality audit. Auto-detects project type (frontend/backend/database/fullstack) and applies corresponding evaluation framework. Usage: /quality [--fix]"
subagent: worker
argument-hint: "[--fix]"
---

<!-- Converted from opencode command `quality` (delegates to subagent: quality-auditor). -->
使用 code-quality-audit 技能对代码库进行质量评估。先自动检测项目类型（前端/后端/数据库/全栈），然后使用对应的评估框架。

范围: $ARGUMENTS

流程: 检测项目类型 → 收集定量数据 → 定性分析 → 生成加权评分报告(0-100) → (可选)执行优化。报告保存到 docs/audits/。
