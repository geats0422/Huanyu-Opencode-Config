# Contributing

Thanks for improving `Huanyu-Opencode-Config`.

## Scope

- This repository stores a global OpenCode configuration under `.opencode/`.
- Project business code should live under `Project/{项目名称}/`.
- Each project gets its own `.opencode/` initialized from `.opencode/templates/project-opencode.json`.

## Architecture

### Two-Level Config

```
根目录 .opencode/          → 唯一源（agents、skills、plugins、commands 等）
Project/{名称}/.opencode/  → 项目级镜像（从模板初始化，可独立优化）
```

### Commands 文件化

命令模板存放在 `.opencode/commands/` 目录：

- `create-project.md`：根目录命令，创建项目结构
- `sync-config.md`：项目命令，将配置同步回根目录

项目级 `opencode.json` 通过 `{file:commands/xxx.md}` 引用命令文件，而非内联模板。

### 关键路径规范

- `plugin` 路径：`./plugins/...`（不带 `.opencode/` 前缀）
- `instructions` 路径：`AGENTS.md`、`rules/...`、`skills/...`
- `prompt` 引用：`{file:agents/...}`、`{file:prompts/...}`

## What to contribute

- Better agent/command routing
- Plugin behavior improvements
- Reusable skills/rules that improve cross-project efficiency
- Documentation updates for workflow clarity

## Change guidelines

1. Keep changes small and focused.
2. Prefer updating global config over project-local hacks.
3. Preserve warning-only behavior unless blocking is explicitly required.
4. Avoid committing secrets or environment files.

## Suggested workflow

1. Create a branch.
2. Make focused changes.
3. Run config validation:

```bash
opencode debug config --print-logs --log-level DEBUG
```

4. Open a PR with:
   - Why this change improves collaboration efficiency
   - Which parts were changed (`agent`, `command`, `plugin`, `skill`, `rule`)
   - Any migration notes

## Commit style

- `feat:` new capability
- `fix:` bug fix
- `docs:` documentation updates
- `style:` formatting-only changes
- `refactor:` code changes without feature or bug-fix intent
- `perf:` performance improvements
- `test:` adding or updating tests
- `chore:` maintenance
