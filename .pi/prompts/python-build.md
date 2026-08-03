---
description: "Fix Python syntax, lint, type-check, and test failures"
subagent: worker
---

<!-- Converted from opencode command `python-build` (delegates to subagent: python-build-resolver). -->
修复 Python 构建、ruff、mypy、pytest 错误。

任务: $ARGUMENTS

顺序: 语法错误 → 导入错误 → 类型错误 → lint → 测试。保持最小修改。
