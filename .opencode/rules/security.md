# 安全规范（基于 learn-evolve 20260627-002）

## Agent 能力层三层防护

为外部 Agent 暴露业务能力时，必须采用三层防护：

1. **后端 scope 权限**：`check_scope()` 作为最终裁决层，API Key DELETE 一律 403
2. **MCP 工具白名单**：不注册 DELETE/settings/api-keys 工具
3. **capabilities 能力发现**：Agent 先调 `wenheng_capabilities` 查询可用工具

## 安全约束

- 所有 API Key 禁止 DELETE（session 不受影响）
- 写/run/upload/high_impact 工具失败不自动重试（非幂等操作）
- 上传文件限制 25MB
- 审计日志 best-effort 落库（失败不阻断业务，记录服务端错误日志）
- 审计日志保留到 API Key 失效后 30 天
- 审计记录 risk_level：read=low, write/run/search=medium, verify/reparse/cancel/project-roles=high

## 权限模板

- `mcp_readonly`：只读
- `cli_review`：只读 + AI 生成
- `agent_safe`：读写 + AI 生成 + 搜索 + 核验（推荐默认）
- `custom`：用户自选，不自动隐含 read
