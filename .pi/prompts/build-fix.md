---
description: "Fix build and TypeScript errors with minimal behavior changes"
subagent: worker
---

<!-- Converted from opencode command `build-fix` (delegates to subagent: build-error-resolver). -->
修复构建和 TypeScript 错误，要求最小修改并保持现有行为。

任务: $ARGUMENTS

步骤: 运行类型/构建检查 → 收集错误 → 逐个修复 → 重新验证。禁止通过放宽配置、滥用 any 或 @ts-ignore 掩盖问题。
