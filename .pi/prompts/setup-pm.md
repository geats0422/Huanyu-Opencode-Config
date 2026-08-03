---
description: "Detect and document package manager preference"
---

<!-- Converted from opencode command `setup-pm`. -->
检测项目包管理器偏好并给出使用建议。

范围: $ARGUMENTS

检查 lockfile、packageManager 字段、脚本习惯，输出应使用 npm/pnpm/yarn/bun 的依据。
