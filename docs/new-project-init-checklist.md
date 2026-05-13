# 新项目初始化清单（共享 .opencode + Project 多项目结构）

## 目标

- 仅维护一套全局配置：根目录 `.opencode/`
- 所有业务项目都放在 `Project/{项目名称}/`
- 不在每个项目里重复创建 `.opencode/`

## 目录结构（正确版）

```text
- .opencode # opencode 配置文件（全局唯一）
- Project   # 项目根目录
    - {项目名称} # 比如 项目A、项目B
        - frontend # 前端代码与测试
        - backend  # 后端代码与测试
        - docs     # 项目文档
```

## A. 新增一个项目（仅创建业务目录）

1. 在 `Project/` 下新建目录：`Project/{项目名称}/`
2. 创建子目录：
   - `Project/{项目名称}/frontend/`
   - `Project/{项目名称}/backend/`
   - `Project/{项目名称}/docs/`
3. 可按需初始化该项目自己的 Git 仓库（在 `Project/{项目名称}` 内执行）

> 说明：**不要**在 `Project/{项目名称}` 下再创建 `.opencode/`。

## B. 全局配置使用规则

- 所有命令、skills、agents 都从根目录 `.opencode/` 读取。
- 涉及文档输出时，路径统一指向：`Project/{项目名称}/docs/...`。
- 使用命令时，先明确当前目标项目名称（例如：项目A）。

## C. 首次验证（全局）

在配置根目录运行：

```bash
opencode debug config --print-logs --log-level DEBUG
```

验证点：
- 配置可解析
- plugins 可加载
- instructions 路径可读取

## D. 开发流程（针对某个项目）

1. 先选定目标项目：`Project/{项目名称}/`
2. 设计：`/brainstorm`
3. 计划：`/plan`
4. 执行：`/execute 1`
5. 收尾：`/finish`

## E. 文档落点约定

- 设计文档：`Project/{项目名称}/docs/designs/`
- 实施计划：`Project/{项目名称}/docs/plans/`
- 质量审计：`Project/{项目名称}/docs/audits/`
- 洞察报告：`Project/{项目名称}/docs/insights/`
- 优化规格：`Project/{项目名称}/docs/optimizations/`

## F. 常见误区

- 误区 1：每个项目再复制一份 `.opencode/`
  - 正确：只保留根目录这一份 `.opencode/`
- 误区 2：文档写回根目录 `docs/`
  - 正确：写到 `Project/{项目名称}/docs/`
