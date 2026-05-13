# OpenWolf P1-P2 集成实施计划

## 总览
基于已批准设计，采用单插件内聚方案新增 `openwolf-lite`，并以最小侵入方式接入现有配置。先落地数据结构与插件骨架，再接入 pre-read/pre-write 与会话账本，最后增强 `/debug` 模板并做端到端验证。

## 前置准备
- [x] 设计文档已批准：`docs/designs/2026-05-13-openwolf-p1-p2-integration-design.md`
- [x] 确认 `.opencode/plugins/` 与 `.opencode/state/` 目录可写
- [x] 记录当前 `opencode.json` 快照（便于快速回滚）

## 任务列表

### 任务 1: 创建状态目录与说明文件 (~3 min) [x]
- **描述**: 创建 OpenWolf-lite 状态目录及说明文档，定义 anatomy/ledger/buglog/dnr 文件职责。
- **文件**:
  - 创建 `.opencode/state/openwolf-lite/.gitkeep`
  - 创建 `.opencode/state/openwolf-lite/README.md`
- **测试**: 无
- **验证**: 目录与文件存在且内容可读
- **依赖**: 无

### 任务 2: 实现插件骨架与核心类型 (~5 min) [x]
- **描述**: 新增 `openwolf-lite.ts`，实现路径工具、JSON 安全读写、token 估算、会话状态结构。
- **文件**:
  - 创建 `.opencode/plugins/openwolf-lite.ts`
- **测试**: 无（先实现可运行骨架）
- **验证**: `opencode debug config` 能识别插件路径且无语法错误
- **依赖**: 任务 1

### 任务 3: 实现 pre-read 重复读取预警与 anatomy 提示 (~5 min) [x]
- **描述**: 在 `tool.execute.before` 中处理 read 请求；重复读取时 warning；存在 anatomy 条目时输出摘要与 token 估算。
- **文件**:
  - 修改 `.opencode/plugins/openwolf-lite.ts`
- **测试**: 构造同文件重复 read 场景
- **验证**: 第二次读取同文件出现 warning；anatomy 命中有提示
- **依赖**: 任务 2

### 任务 4: 实现 pre-write Do-Not-Repeat 预警 (~4 min) [x]
- **描述**: 对 write/edit 内容执行 DNR 规则匹配，命中时 warning（非阻断）。
- **文件**:
  - 修改 `.opencode/plugins/openwolf-lite.ts`
  - 初始化 `.opencode/state/openwolf-lite/do-not-repeat.json`（按需自动生成）
- **测试**: 构造包含禁忌模式的写入内容
- **验证**: 命中规则时日志告警；写入仍可继续
- **依赖**: 任务 2

### 任务 5: 实现 post-read/post-write 统计与 anatomy 更新 (~5 min) [x]
- **描述**: 在 `tool.execute.after` 累积会话读写计数、token 估算；write/edit 后 upsert anatomy-lite 条目。
- **文件**:
  - 修改 `.opencode/plugins/openwolf-lite.ts`
- **测试**: read + edit 最小链路
- **验证**: anatomy-lite.json 有对应文件条目，session 内统计递增
- **依赖**: 任务 3, 任务 4

### 任务 6: 实现 session-start/session-idle 账本落盘 (~4 min) [x]
- **描述**: `session.created` 初始化会话状态；`session.idle` 追加会话到 ledger 并更新 lifetime 聚合。
- **文件**:
  - 修改 `.opencode/plugins/openwolf-lite.ts`
- **测试**: 启动会话 -> 执行读写 -> 触发 idle
- **验证**: `session-ledger.json` 新增会话，lifetime 指标递增
- **依赖**: 任务 5

### 任务 7: 注册插件并增强 /debug 模板 (~4 min) [x]
- **描述**: 在配置中注册 `openwolf-lite` 插件；更新 `/debug` 模板，要求先检索 buglog 再进入系统化调试。
- **文件**:
  - 修改 `.opencode/opencode.json`
- **测试**: 无
- **验证**: `opencode debug config --print-logs --log-level DEBUG` 显示插件已加载；`/debug` 模板包含 buglog 检索步骤
- **依赖**: 任务 6

### 任务 8: 更新 AGENTS 说明与最终验证 (~5 min) [x]
- **描述**: 在 `AGENTS.md` 增加 OpenWolf-lite 自动机制说明（warning-only）；执行端到端验证并记录结果。
- **文件**:
  - 修改 `.opencode/AGENTS.md`
- **测试**: 端到端手工验证
- **验证**:
  - 重复 read 预警有效
  - DNR 预警有效
  - ledger/anatomy 文件更新有效
  - debug config 通过
- **依赖**: 任务 7

## 并行机会
- 任务 1 与“记录 `opencode.json` 快照”可并行。
- 任务 3 和任务 4 在任务 2 完成后可并行实现。

## 风险 & 缓解
| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 日志告警过多影响体验 | 中 | 中 | 仅重复读取触发 warning，不做阻断 |
| JSON 状态文件损坏 | 低 | 中 | 读写采用容错默认值 + 原子写入 |
| 与现有插件行为冲突 | 低 | 高 | 保持 warning-only，不拦截现有流程 |

## 测试策略
| 层级 | 内容 | 覆盖目标 |
|------|------|----------|
| 配置验证 | 插件加载与配置解析 | 100% |
| 会话链路验证 | read->read->edit->idle | 关键路径 |
| 行为验证 | 重复读/DNR warning | 关键路径 |
