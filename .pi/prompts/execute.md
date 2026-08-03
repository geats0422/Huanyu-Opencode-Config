---
description: "Execute implementation plan tasks with TDD + two-phase review (spec-compliance → code-quality). Auto-continues to next task. Usage: /execute <task-number>"
argument-hint: "<task-number>"
---

<!-- Converted from opencode command `execute`. -->
使用 execute-plans 技能执行计划中的任务。

任务编号: $ARGUMENTS

先读取实施计划文档 (docs/plans/)。严格按照 TDD 流程：先写测试 → 实现 → spec-compliance-review → code-quality-review。完成后自动继续下一个任务。全部完成时建议运行 /finish。
