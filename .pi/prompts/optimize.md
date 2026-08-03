---
description: "Transform insights/quality report into a structured optimization spec with priority matrix, before/after metrics, and rollback plans"
subagent: planner
---

<!-- Converted from opencode command `optimize` (delegates to subagent: planner). -->
使用 optimization-spec 技能将分析报告转化为可执行的优化规格。

步骤:
1. 读取最新的 insights 或 quality 报告
2. 提取所有可优化项 → 按 影响/成本 优先级排序
3. 为 Top 3 项编写完整的优化 spec（问题→方案→预期→验证）
4. 保存到 docs/optimizations/YYYY-MM-DD-optimization.md
5. 用户批准后 → 建议运行 /plan

$ARGUMENTS
