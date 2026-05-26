# Huanyu-Opencode-Config

这是我的专属 OpenCode 开发配置仓库，采用"全局配置 + 多项目目录 + 项目级配置镜像"模式。

## 目录结构

```text
- .opencode/                        # 全局 OpenCode 配置（唯一源）
    - commands/                     # 全局命令文件（commands 文件化）
        - create-project.md         # /create-project 命令模板
        - sync-config.md            # /sync-config 命令模板（供项目复制）
    - templates/
        - project-opencode.json     # 项目级 opencode.json 模板
    - agents/                       # Agent 定义
    - skills/                       # 技能定义
    - plugins/                      # 插件
    - prompts/                      # 子代理提示词
    - rules/                        # 规则
    - instructions/                 # 指令文件
    - state/                        # 运行时状态
- Project/
    - {项目名称}/
        - .opencode/                # 项目级 OpenCode 配置（从模板初始化）
            - opencode.json         # 使用 templates/project-opencode.json
            - commands/             # 命令文件（含 sync-config.md）
            - agents/, skills/, ... # 与全局配置保持同步
        - backend/                  # 后端代码与测试
        - frontend/                 # 前端代码与测试
        - docs/                     # 项目文档
```

## 核心命令

| 命令 | 执行位置 | 功能 |
|------|---------|------|
| `/create-project {名称}` | 根目录 | 在 `Project/` 下创建项目结构并初始化 `.opencode` 配置 |
| `/sync-config` | 项目目录 | 将项目优化后的配置同步回根目录 `.opencode/` |

### 复利循环

```
/create-project → 项目开发 → 优化配置 → /sync-config → 根目录配置升级
```

1. 在根目录执行 `/create-project {名称}` 创建项目
2. 进入 `Project/{名称}/` 目录进行开发
3. 开发过程中优化 skills/agents/rules 等配置
4. 执行 `/sync-config` 将优化后的配置同步回根目录
5. 新项目自动继承升级后的全局配置

## 使用原则

- 全局维护一份 `.opencode/` 作为唯一源，每个项目从模板初始化独立的 `.opencode/`。
- 项目级 `.opencode/` 使用相对路径引用（`./plugins/...`、`{file:agents/...}`），不嵌套 `.opencode/`。
- 方法论持续沉淀到全局配置：做完项目 A 后优化配置，`/sync-config` 回写，项目 B 直接复用优化结果。
- commands 文件化：命令模板存放在 `.opencode/commands/` 目录，便于版本管理和跨项目复用。

## 配置校验规则

- `plugin` 路径必须是 `./plugins/...`（不能是 `./.opencode/plugins/...`）
- `instructions` 路径不带 `.opencode/` 前缀
- `prompt` 引用必须是 `{file:agents/...}` 或 `{file:prompts/...}`（不能是 `{file:.opencode/...}`）

## 协作目标

通过持续优化 agent、commands、plugins 和工作流，让 AI 协作体验"越用越顺手"，形成复利效应。

## 许可

本仓库使用 MIT License，鼓励共享、交流与改进，共同推动 AI 工程实践进步。
