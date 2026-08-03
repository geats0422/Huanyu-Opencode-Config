---
description: "Review database schema, migrations, indexes, and query risks"
subagent: reviewer
---

<!-- Converted from opencode command `db-review` (delegates to subagent: database-reviewer). -->
审查数据库相关变更。

范围: $ARGUMENTS

检查 schema 设计、迁移可回滚性、索引、N+1 查询、参数化查询、敏感数据处理。
