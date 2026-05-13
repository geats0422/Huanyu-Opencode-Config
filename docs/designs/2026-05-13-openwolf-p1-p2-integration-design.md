# OpenWolf P1-P2 能力集成设计

## 目标
在不改变现有 OpenCode 工作流的前提下，集成 OpenWolf 的高价值机制（P1+P2），实现更低 token 浪费、更少重复错误、更快问题定位。

## 用户场景
- 日常编码会话中，Agent 频繁读取文件，容易重复读取同一文件并浪费 token。
- 用户纠正过的错误（例如某类实现偏好或禁忌）在后续会话仍可能重复出现。
- 调试时常重复踩同类问题，缺少结构化“错误->根因->修复”记忆。
- 用户希望这些机制自动运行，尽量不改变现有命令习惯。

## 范围
本次仅集成 P1+P2：

1. P1
   - anatomy-lite（文件摘要索引 + 粗 token 估算）
   - session-ledger（会话读写统计）
   - Do-Not-Repeat 预警（pre-write）
2. P2
   - pre-read 重复读取预警
   - buglog（错误模式记忆）+ `/debug` 检索接入

不包含 P3（designqc 截图流程）。

## 方案对比

### 方案 A（推荐）：单插件内聚实现
- 方式：新增一个 `openwolf-lite.ts` 插件，集中处理 pre-read/pre-write/session-start/session-idle。
- 优点：
  - 集成路径清晰，便于度量和回滚。
  - 避免分散到多个插件造成状态一致性问题。
  - 与现有 `my-plugin.ts`、`learning-persistence.ts` 低耦合。
- 缺点：
  - 插件体积会增大，需要更严格的模块划分。

### 方案 B：分散增强现有插件
- 方式：在 `my-plugin.ts`、`learning-persistence.ts` 中分别加逻辑。
- 优点：
  - 文件数量少，不引入新插件。
- 缺点：
  - 边界不清，后续维护和测试成本高。
  - 会话状态与记忆状态分散，容易遗漏。

最终选择：方案 A。

## 技术方案

### 总体架构
- 新增轻量状态目录：`.opencode/state/openwolf-lite/`
- 插件生命周期事件：
  - `session.created`：初始化 session 状态
  - `tool.execute.before`：pre-read / pre-write 预警
  - `tool.execute.after`：记录 read/write 事件并更新 anatomy-lite
  - `session.idle`：落盘会话汇总到 token ledger

### 数据模型

1. `anatomy-lite.json`
```json
{
  "version": 1,
  "updatedAt": "ISO",
  "files": {
    "relative/path.ts": {
      "desc": "一句话摘要",
      "tokenEstimate": 380,
      "lastSeenAt": "ISO"
    }
  }
}
```

2. `session-ledger.json`
```json
{
  "version": 1,
  "lifetime": {
    "sessions": 0,
    "reads": 0,
    "writes": 0,
    "repeatReadWarnings": 0,
    "doNotRepeatWarnings": 0,
    "anatomyHits": 0,
    "estimatedTokensRead": 0,
    "estimatedTokensWritten": 0
  },
  "sessions": []
}
```

3. `buglog.json`
```json
{
  "version": 1,
  "items": [
    {
      "id": "bug-2026-05-13-001",
      "errorPattern": "TypeError: ...",
      "rootCause": "...",
      "fix": "...",
      "tags": ["typescript", "null-check"],
      "createdAt": "ISO",
      "lastUsedAt": "ISO"
    }
  ]
}
```

4. `do-not-repeat.json`
```json
{
  "version": 1,
  "rules": [
    {
      "id": "dnr-001",
      "pattern": "never use var",
      "hint": "使用 const/let",
      "enabled": true
    }
  ]
}
```

### 关键行为

1. pre-read（P2）
- 识别读取目标路径，检查本会话是否已读。
- 已读则输出 warning（不阻断）。
- 若 anatomy-lite 有该文件摘要，附带摘要和估算 token。

2. pre-write（P1）
- 对 write/edit 内容应用 `do-not-repeat.json` 规则匹配。
- 命中则 warning（不阻断），提示规则来源和建议。

3. post-read / post-write（P1）
- read：累积会话读计数与 token 估算。
- write/edit：累积写计数；更新目标文件的 anatomy-lite 条目（摘要+token）。

4. stop/session-idle（P1）
- 将会话汇总追加到 `session-ledger.json`。
- 更新 lifetime 聚合指标。

5. `/debug` 接入 buglog（P2）
- 更新 `opencode.json` 中 `/debug` 模板：在执行 systematic-debugging 前，先读取并检索 `buglog.json` 的相似错误条目。
- 若命中，优先回放“根因/修复”作为调查起点。

## 文件与改动点

1. 新增
- `.opencode/plugins/openwolf-lite.ts`
- `.opencode/state/openwolf-lite/.gitkeep`
- `.opencode/state/openwolf-lite/README.md`（说明数据文件用途）

2. 修改
- `.opencode/opencode.json`
  - `plugin` 新增 `./plugins/openwolf-lite.ts`
  - `/debug` 命令模板增强：增加 buglog 检索步骤说明
- `.opencode/AGENTS.md`
  - 增加 OpenWolf-lite 自动机制说明（warning-only，非阻断）

3. 可选（本轮不做）
- 为 buglog 提供独立命令（如 `/buglog-add` / `/buglog-search`）

## 错误处理与安全
- 所有状态文件读写采用“失败降级”策略：读取失败不阻断会话，只记录 warning。
- 所有路径写入限制在当前项目目录和 `.opencode/state/openwolf-lite/`。
- 不读取 `.env` 内容，不记录敏感字段。
- 日志输出仅包含文件相对路径和统计值，不落地命令明文机密。

## 测试策略

### 单元测试
- token 估算函数
- 路径归一化函数（Windows/Linux）
- do-not-repeat 匹配器
- ledger 聚合器

### 集成验证
1. `opencode debug config --print-logs --log-level DEBUG`
   - 验证插件可加载。
2. 构造最小会话（read -> read same file -> edit）
   - 观察 pre-read 重复预警。
   - 观察 pre-write dnr 预警。
   - 检查 `session-ledger.json` 指标递增。
3. 触发 `/debug` 模板
   - 验证包含 buglog 检索提示。

## 验收标准
- 能稳定加载 `openwolf-lite` 插件，无配置报错。
- 同会话重复读取同一路径时必定出现 warning。
- 命中 DNR 规则时出现 warning，且不阻断写入。
- 会话结束后 ledger 有新增会话条目，lifetime 指标递增。
- `/debug` 模板文本中明确包含 buglog 检索步骤。

## 回滚策略
- 从 `opencode.json.plugin` 移除 `./plugins/openwolf-lite.ts`。
- 保留 `.opencode/state/openwolf-lite/` 数据文件，不影响现有插件。
- 恢复 `/debug` 模板到变更前版本。

## 风险与缓解
- 风险：过多 warning 影响体验。
  - 缓解：默认只在重复读取>=2次触发；后续可加阈值配置。
- 风险：anatomy 摘要质量不稳定。
  - 缓解：先使用简单规则摘要（文件名+首段注释），后续再迭代。
- 风险：状态文件增长。
  - 缓解：会话列表保留最近 N 条（如 200），更旧聚合到 lifetime。

## 成功指标（两周观察）
- repeated read warning 数量先上升后下降（表示行为被纠偏）。
- anatomy hit rate 稳定提升。
- 同类 bug 二次排查耗时下降（由 buglog 命中率间接反映）。
