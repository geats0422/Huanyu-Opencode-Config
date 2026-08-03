---
description: "Coordinate multiple specialized agents for complex analysis"
subagent: planner
---

<!-- Converted from opencode command `orchestrate` (delegates to subagent: planner). -->
对复杂任务进行多专家编排分析。

任务: $ARGUMENTS

根据需要并行使用 planner、reviewer、security-auditor、database-reviewer、doc-updater 等角色，输出统一结论和下一步计划。
