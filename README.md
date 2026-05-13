# Huanyu-Opencode-Config

这是我的专属 OpenCode 开发配置仓库，采用“全局配置 + 多项目目录”模式。

## 目录结构

```text
- .opencode/            # 全局 OpenCode 配置（唯一）
- Project/
    - {项目名称}/
        - frontend/     # 前端代码与测试
        - backend/      # 后端代码与测试
        - docs/         # 项目文档
```

## 使用原则

- 全局只维护一份 `.opencode`，不在每个项目重复创建配置。
- 每个项目的业务代码和文档都落在 `Project/{项目名称}`。
- 方法论持续沉淀到全局配置：做完项目 A 后优化配置，项目 B 直接复用优化结果。

## 协作目标

通过持续优化 agent、commands、plugins 和工作流，让 AI 协作体验“越用越顺手”，形成复利效应。

## 许可

本仓库使用 MIT License，鼓励共享、交流与改进，共同推动 AI 工程实践进步。
