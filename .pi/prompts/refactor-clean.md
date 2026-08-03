---
description: "Remove dead code and consolidate duplicates safely"
subagent: worker
---

<!-- Converted from opencode command `refactor-clean` (delegates to subagent: refactor-cleaner). -->
分析并清理死代码、未使用依赖、重复逻辑。

范围: $ARGUMENTS

要求: 先搜索引用和外部导出风险，分小步修改，每步验证，不做无关重构。
