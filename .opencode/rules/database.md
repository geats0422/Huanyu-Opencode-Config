# 数据库与迁移规范

适用于 PostgreSQL + SQLAlchemy (async) + Alembic 项目。

## 关系型数据迁移（高风险）

- **迁移前必须穷举边界**：多对多关系、降级冲突、唯一性约束、软删除交互
  → 在 brainstorm/grill-me 阶段列出所有组合矩阵
- **schema 变更与数据迁移分离**：先改结构，验证空表，再做数据回填
- **行数提取用 `.rowcount` 或显式 COUNT**，不要依赖 fetchall 长度（曾导致 30cda9a 修复）
- **软删除字段必须参与唯一性约束**：downgrade uniqueness 冲突需显式处理（350e915 教训）
- **downgrade 必须先处理数据再恢复约束**：如果新值在旧约束中不合法，先 UPDATE 再 drop_constraint（025 迁移教训）

## 跨 Schema 外键

- 文衡使用单库多 schema（goulong_auth / wenheng / public）
- 跨 schema 外键必须在 `Base.metadata` 注册：`_register_auth_tables()`
- Alembic `version_table_schema` 按项目隔离（wenheng vs public）

## 异步事务

- 审计日志使用 best-effort 落库（失败不阻断业务）
- 但业务事务必须显式 commit/rollback，禁止隐式提交
- 长事务拆分为小批次，避免连接池耗尽

## 迁移文件命名

- 文件名格式：`<序号>_<简述>.py`（如 `025_agent_safe_api_key_template.py`）
- revision 用文件名全称，down_revision 指向上一个
- 每个迁移必须有 upgrade + downgrade 函数

## 测试

- 每个迁移必须有 up + down 测试（`test_api_key_migration.py` 模式）
- 数据迁移测试必须验证行数 + 抽样数据完整性
- CHECK 约束变更测试：断言约束文本包含新值
- 使用 `importlib.util.spec_from_file_location` 加载迁移模块做源码级断言
