# 前端开发规范

## CSS 基础

- 所有新页面必须包含全局 CSS reset（消除 body 默认 margin、padding）
- 布局定位策略：Topbar 使用 `position: sticky; top: 0`，Sidebar 使用 `position: fixed`，主内容区使用 `margin-left` 补偿
- 三栏布局优先使用 `display: grid` + `grid-template-columns`，不用 float 或 inline-block
- 组件间距使用设计系统变量（`#e4beb9` 边框、`#faf8f5` 背景、`24px` 标准间距），避免硬编码 magic number
- 方角（`border-radius: 4px` 或 `0`），主色 `#93000b`，暖色 surface

## 组件拆分

- 单个 Vue 组件超过 300 行（template + script + style）必须拆分为子组件
- 通用组件（Topbar、Sidebar）必须按逻辑区域拆分为子组件
- 页面级 HTML 文件（三分离架构）只做布局和数据加载，交互逻辑委托给 `<script>` 标签内 JS
- 弹窗/下拉菜单必须独立为子组件，父组件只负责 open/close 状态

## JS 双模式

- 经典脚本（`api.js`、`toast.js`、各页面独立 JS）：通过 `<script src>` 加载，挂载到 `window`，不使用 `export`
- ES Module（`wizard-base.js`、`calendar.js`、Vue 组件）：通过 `type="module"` 或 Vite 构建，使用 `export`
- 新文件必须先确定模式再编码：独立 HTML 页面用经典脚本，Vite 管理的用 ES Module
- 两模式之间通过 `window` 全局变量桥接（如 `window.apiFetch`）

## 测试要求

- Vue 组件（`src/components/*.vue`）必须有对应测试文件
- 新组件必须通过 `npm test` 测试
- 修改现有组件必须先确认测试通过
- 独立 HTML 页面的验证脚本放在 `frontend/verify-*.mjs`，通过 `node` 运行

## 布局锁死规则（Wizard 类页面）

- 当页面需要三栏固定视口布局时，给 `body` 加状态类（如 `contract-step-6-active`）
- 状态类下 `body` 设 `overflow: hidden`，主容器锁 `100vh`
- 各栏内部滚动由各自 `overflow-y: auto` 控制，不由页面主滚动条控制
- 使用 `flex: 1; min-height: 0` 让内容区吃满剩余高度，不用估算 `calc(100vh - Npx)`
