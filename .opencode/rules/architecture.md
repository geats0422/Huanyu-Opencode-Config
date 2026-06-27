# 架构规范（基于 learn-evolve 20260627-004）

## 三层架构

对外能力暴露采用三层分离：

```
REST API → MCP Server → CLI / 外部 Agent
```

### 后端 REST API（最终裁决层）
- FastAPI + Pydantic + SQLAlchemy async
- scope 权限体系（`check_scope` 兜底）
- 业务逻辑全部在此层

### MCP Server（无状态网关）
- 纯转发，零业务逻辑、零数据库访问
- 每请求独立 transport，Authorization 透传
- 工具静态注册（不做动态注册/注销）
- 支持 `format: markdown | json`

### CLI（纯 MCP 客户端）
- 零业务逻辑，只做命令解析 → MCP 调用 → 结果输出
- 工具定义只维护一处（MCP），CLI 自动映射
- 通用参数模式：`--arg`/`--json-arg`/`--file`/`--format`

## 数据库

- 单库多 schema：`goulong_auth`（用户中心）/ `wenheng`（文衡业务）/ `public`（照胆业务）
- 跨 schema 外键必须在 `Base.metadata` 注册
- Alembic 版本表按项目隔离
