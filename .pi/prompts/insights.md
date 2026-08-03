---
description: "AI coach — analyze 30-day usage patterns, identify friction points, and generate optimization recommendations"
subagent: researcher
---

<!-- Converted from opencode command `insights` (delegates to subagent: insights-agent). -->
使用 insights 技能分析过去 30 天的使用模式，生成优化报告和配置更新建议。

数据源:
1. git log --since="30 days ago" → 活动概览、热点文件、fix/revert 模式
2. ~/.pi/learnings/<project>/entries/ → 学习系统健康度
3. docs/friction-log.md (如存在) → 手动记录的摩擦事件
4. .pi/ 现有配置 → 完整度诊断

输出: docs/insights/YYYY-MM-DD-insights.md

$ARGUMENTS
