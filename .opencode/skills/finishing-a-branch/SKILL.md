---
name: finishing-a-branch
description: 当所有实施任务完成后使用。执行最终验证、代码整理、提交，并提供交付选项（创建 PR / 合并 / 保留 / 清理）。
---

# 完成开发分支

所有任务完成后的标准化收尾。

## L2 质量保障联动（硬性触发）

收尾阶段必须触发以下 L2 组件，不可跳过：

| 节点 | L2 组件 | 说明 |
|------|---------|------|
| 最终验证 | `verification-before-completion` skill | build/test/type/lint 全部实际运行，证据先于声明 |
| 提交前 | `security-review` skill → `security-auditor` agent | 密钥/注入/认证扫描；CRITICAL 问题修复并轮换密钥后才允许提交 |

## 流程

### 1. 最终验证（按 verification-before-completion skill）

必须实际运行命令并确认输出，禁止假设通过：
```bash
npm test              # 或项目对应的测试命令
npm run build         # 确认构建通过
npx tsc --noEmit      # TypeScript 项目类型检查
npm run lint          # Lint 无警告
```
- 检查 git status 确认没有遗漏的未跟踪文件
- 检查是否有遗留的 console.log / debugger 语句
- 检查是否有 TODO/FIXME 需要处理

### 2. 代码整理
- 运行 linter: `npm run lint`
- 运行 formatter: `npm run format`
- 检查未使用的 import
- 删除临时/测试用的代码

### 3. 审查报告
生成一个简要的完成报告：

```markdown
## 完成报告

### 功能: [功能名称]

### 变更概要
| 类型 | 文件数 | 说明 |
|------|--------|------|
| 新增 | 3 | User 模型、Auth 服务、Login 页面 |
| 修改 | 2 | 路由配置、API 中间件 |

### 测试结果
| 层级 | 数量 | 状态 |
|------|------|------|
| 单元测试 | 12 | ✅ |
| 集成测试 | 5 | ✅ |
| E2E | 2 | ✅ |
```

### 4. 提交前安全审查 → 提交

**安全门（提交前必做）**：按 `security-review` skill 逐项核查；若本次改动涉及认证/支付/用户输入/密钥，委派 `security-auditor` agent 做深度审计。发现 CRITICAL 问题（密钥泄露、注入、越权）→ 修复 + 轮换泄露密钥后才允许提交。

- 使用 `git status` 检查变更
- 使用 `git diff --stat` 查看统计
- 提交: `git commit -m "feat: 实现用户认证系统"`
- 提交粒度: 一个逻辑变更一个 commit

### 5. 交付
提供用户以下选项：
1. **创建 PR**: `git push -u origin <branch>` → `gh pr create`
2. **合并到主分支**: 直接 merge
3. **保留分支**: 暂不合并，保留用于后续修改
4. **清理**: `git branch -d <branch>` 删除已完成的分支

### 6. 保存上下文
- 记录关键决策和剩余待办到 `~/.opencode/learnings/`
- 更新项目对应的计划文档状态

## 检查清单

- [ ] 所有测试通过
- [ ] 构建通过
- [ ] 代码已格式化
- [ ] 无遗留调试代码
- [ ] 提交信息清晰（约定式格式）
- [ ] 无未跟踪的重要文件
- [ ] 无硬编码密钥
- [ ] 交付选项已给用户
- [ ] 上下文已保存
