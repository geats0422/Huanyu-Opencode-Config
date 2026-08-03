---
description: "Systematic root-cause debugging"
subagent: worker
---

<!-- Converted from opencode command `debug` (delegates to subagent: debugger). -->
先检索 .pi/state/openwolf-lite/buglog.json 中是否有相似错误模式（errorPattern/tags/rootCause/fix）。若命中，先基于已有修复路径验证；若未命中，再使用 systematic-debugging 技能调查以下问题：

$ARGUMENTS
