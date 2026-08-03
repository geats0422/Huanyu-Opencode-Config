---
description: "Run verification gates (build/test/type/lint) before declaring work complete"
subagent: worker
---

<!-- Converted from opencode command `verify` (delegates to subagent: quality-auditor). -->
使用 verification-before-completion 技能执行完成前验证：构建、类型检查、lint、测试。证据先于声明，禁止未验证就声称完成。

范围: $ARGUMENTS
