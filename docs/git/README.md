# Git 治理报告

`docs/git/` 用于保存 Git/GitHub 仓库治理命令生成的检查报告，帮助追踪分支、提交、release 和 hotfix 风险。

## 命名规则

报告使用日期和命令名命名，例如：

```text
2026-05-26-git-check.md
2026-05-26-commit-guide.md
2026-05-26-release-check.md
2026-05-26-hotfix-check.md
```

## 报告结构

建议包含以下部分：

```text
# Git Check Report

## 当前状态
## 规范检查
## 风险等级
## 建议操作
```

## 保留策略

- 保留与重要 release、hotfix、风险决策相关的报告。
- 日常临时检查报告可在确认无追踪价值后清理。
- 不在报告中写入密钥、token 或其他敏感信息。
