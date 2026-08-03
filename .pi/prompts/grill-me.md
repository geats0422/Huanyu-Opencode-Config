---
description: "Pressure-test a design before planning. AI grills you one question at a time until every decision branch reaches a leaf. Use after /brainstorm for complex changes."
---

使用 grill-me 技能对当前设计进行压力测试（复杂变更在 /plan 前使用）。

铁律：
- **一次只问一个问题**，不要一次抛多个
- 每个问题都给出**推荐答案**，不要只问不答
- 能通过查代码库回答的，自己查，不浪费用户时间
- 发现设计中的模糊地带，必须追问到决策树的叶子节点

维度：用户场景 / 边界条件 / 数据模型 / 错误处理 / 安全风险 / 性能 / 兼容性 / 可测试性。

完成后输出"需求对齐总结"（3-5 条关键决策），然后建议运行 /plan。

设计文档：$ARGUMENTS（留空则读取最新的 `Project/*/docs/designs/`）
