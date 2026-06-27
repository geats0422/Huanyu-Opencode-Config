# 后端开发规范（Python + FastAPI）

## 分层架构（强制）

- **Router 层**：极薄，仅做参数注入和 HTTP 语义（如 workspace.py 12 行）
- **Service 层**：纯业务逻辑，签名以 `(db: AsyncSession, ...)` 开头，禁止导入 FastAPI
- **Model 层**：SQLAlchemy 异步模型，不包含业务方法
- **Schema 层**：Pydantic 模型，响应统一用 schema，禁止返回裸 dict

## 工具链（uv）

- 所有 Python 命令必须通过 `uv run` 执行
- 添加依赖用 `uv add`，禁止手动编辑 requirements
- 环境一致性：`uv sync` 后直接可运行

## 测试纪律

- Service 层必须可独立测试（不依赖 FastAPI 请求栈）
- 测试位于 `backend/tests/`，pytest + httpx + pytest-asyncio
- 提交前运行：
  ```bash
  uv run ruff check .
  uv run mypy .
  uv run pytest -v
  ```

## API 设计

- RESTful 资源命名，版本化前缀 `/api/v1/`
- 错误响应包含 error code + message
- 双轨认证：JWT（session）+ API Key（Bearer gl_...）
- scope 权限通过 `check_scope(scopes, method, path)` 强制校验

## 错误处理

- 401：认证失败（Key 无效/过期）
- 403：权限不足或 DELETE 被禁止
- 404：资源不存在
- 422：参数校验失败（Pydantic 自动）
- 审计落库失败：不阻断业务，记录服务端错误日志

## 提交规范

- 类型：`feat, fix, docs, refactor, test, chore`
- 描述用中文或英文
- 示例：`feat(agent-safe): Phase 3 安全 Agent 自动化能力层`
