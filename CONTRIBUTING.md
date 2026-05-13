# Contributing

Thanks for improving `Huanyu-Opencode-Config`.

## Scope

- This repository stores a global OpenCode configuration under `.opencode/`.
- Project business code should live under `Project/{项目名称}/`.
- Do not add per-project `.opencode/` folders.

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
- `chore:` maintenance
