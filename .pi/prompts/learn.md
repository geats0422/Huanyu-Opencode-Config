---
description: "Extract reusable patterns from current session. Compound-interest engine — each learning builds on previous sessions."
---

使用 continuous-learning 技能分析当前会话，提取可复用模式（复利学习）。

步骤：
1. 用 `learn_list` 工具读取已有学习条目（或读取 `~/.pi/learnings/<project>/entries/`）
2. 分析本次会话 → 用 `learn_add` 工具提取 2-5 个模式（命中已有条目会自动提升 confidence，新模式则创建）
3. 用 `learn_stats` 工具查看复利统计（总数/已确认/待升级）
4. 输出：新增 / 确认 / 建议升级清单
5. 如有升级建议（confidence ≥ 0.7）→ 询问用户是否升级为 rule / skill / prompt

$ARGUMENTS
