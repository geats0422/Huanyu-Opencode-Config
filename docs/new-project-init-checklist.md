# 新项目初始化清单（全局配置 + 项目级镜像 + Commands 文件化）

## 目标

- 全局维护一套 `.opencode/` 作为唯一源
- 每个业务项目在 `Project/{项目名称}/` 下拥有独立的 `.opencode/`（从模板初始化）
- 通过 `/create-project` 下发配置模板，并通过 `/sync-config` 将项目优化回写根配置

## 目录结构（正确版）

```text
- .opencode/                        # 全局 OpenCode 配置（唯一源）
    - commands/                     # 命令文件（commands 文件化）
        - create-project.md         # /create-project 命令模板
        - sync-config.md            # /sync-config 命令模板（供项目复制）
    - templates/
        - project-opencode.json     # 项目级 opencode.json 模板
    - agents/, skills/, plugins/    # 核心配置
- Project/
    - {项目名称}/
        - .opencode/                # 项目级配置（从模板初始化）
            - opencode.json         # 使用 project-opencode.json 模板
            - commands/
                - sync-config.md    # 项目级同步命令
            - agents/, skills/ ...  # 与全局配置同步
        - frontend/                 # 前端代码与测试
        - backend/                  # 后端代码与测试
        - docs/                     # 项目文档
```

## A. 创建新项目

在根目录执行 `/create-project {项目名称}`，自动完成：

1. 创建 `Project/{项目名称}/` 目录
2. 创建子目录：`.opencode/`、`backend/`、`frontend/`、`docs/`
3. 从根目录复制配置文件到 `.opencode/`：
   - `AGENTS.md`、`ETHOS.md`、`.gitignore`
   - `agents/`、`instructions/`、`plugins/`、`prompts/`、`rules/`、`skills/`、`state/`、`commands/`
4. 使用 `.opencode/templates/project-opencode.json` 作为项目的 `opencode.json`
5. 自动校验路径规范（防止重复 `.opencode` 嵌套）

### 配置校验规则

- `plugin` 路径必须是 `./plugins/...`（不能是 `./.opencode/plugins/...`）
- `instructions` 路径不带 `.opencode/` 前缀
- `prompt` 引用必须是 `{file:agents/...}` 或 `{file:prompts/...}`（不能是 `{file:.opencode/...}`）

## B. 项目开发流程

1. 进入项目目录：`Project/{项目名称}/`
2. 设计：`/brainstorm`
3. 计划：`/plan`
4. 执行：`/execute 1`
5. 收尾：`/finish`

### Git 治理流程

新项目建议从 `main` 初始化 `develop` 分支，并基于任务类型创建规范分支：

- 新功能：从 `develop` 创建 `feature/*`
- 发版准备：从 `develop` 创建 `release/*`
- 线上紧急修复：从 `main` 创建 `hotfix/*`

常用治理命令：

1. 开始任务前运行 `/branch-guide`，确认推荐分支名和来源分支。
2. 开发过程中运行 `/git-check`，检查当前分支、upstream、diff 和风险等级。
3. 提交前运行 `/commit-guide`，分析 staged/unstaged diff 并生成 commit message 建议。
4. 发版前运行 `/release-check`，线上紧急修复时运行 `/hotfix-check`。
5. 若命令报告 High Risk，必须显式回复 `确认继续 <原因>` 后再继续。

## C. 配置同步回写

项目开发完成后，若优化了 skills/agents/rules 等配置：

1. 进入项目目录
2. 执行 `/sync-config`
3. 同步范围：
   - `opencode.json`（合并 command，保留根目录的 `create-project`）
   - `AGENTS.md`、`ETHOS.md`、`.gitignore`
   - `agents/`、`instructions/`、`plugins/`、`prompts/`、`rules/`、`skills/`、`commands/`
   - `state/` 不同步（项目特定状态）
4. 同步后校验 `create-project` 和 `sync-config` 的命令引用是否正确

## D. 复利循环

```
/create-project → 项目开发 → 优化配置 → /sync-config → 根目录配置升级
```

1. `/create-project` 创建项目（继承全局配置）
2. 项目开发中可独立优化配置
3. `/sync-config` 将优化回写全局
4. 下一个项目自动继承升级后的配置

## E. 文档落点约定

- 设计文档：`Project/{项目名称}/docs/designs/`
- 实施计划：`Project/{项目名称}/docs/plans/`
- 质量审计：`Project/{项目名称}/docs/audits/`
- 洞察报告：`Project/{项目名称}/docs/insights/`
- 优化规格：`Project/{项目名称}/docs/optimizations/`

## F. 常见误区

- 误区 1：手动创建项目 `.opencode/` 而不使用 `/create-project`
  - 正确：始终使用 `/create-project` 确保配置完整性和路径规范
- 误区 2：在项目 `opencode.json` 中使用 `.opencode/` 前缀路径
  - 正确：项目配置使用相对路径（`./plugins/...`、`{file:agents/...}`）
- 误区 3：文档写回根目录 `docs/`
  - 正确：写到 `Project/{项目名称}/docs/`
- 误区 4：直接修改根目录 `.opencode/` 而不通过 `/sync-config`
  - 正确：在项目中优化后执行 `/sync-config` 统一回写
