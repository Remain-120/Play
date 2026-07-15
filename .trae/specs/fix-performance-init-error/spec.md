# 修复 performance 初始化前引用错误和无障碍模块小程序兼容性 Spec

## Why
项目运行时报错 `ReferenceError: Cannot access 'performance' before initialization`，导致页面无法加载。根本原因是 `utils/performance.js` 中导出的变量名 `performance` 与全局对象 `performance` 冲突，且在模块初始化时使用了 `Performance.getInstance()` 会在小程序环境中触发大量 Web-only API 调用。同时 `utils/accessibility.js`、`utils/child-safety.js` 中的类在模块顶层实例化，也会在小程序环境中调用 `document.querySelectorAll` 等不存在的 API。

## What Changes
- **BREAKING**: 重写 `utils/performance.js`，将导出名从 `performance` 改为 `perfMonitor`，避免与全局 `performance` 对象冲突；所有 Web-only 代码改为延迟初始化而非模块顶层执行
- 重写 `utils/accessibility.js`，将模块顶层的类实例化改为延迟初始化，确保小程序环境不执行 Web-only 代码
- 重写 `utils/child-safety.js`，将模块顶层的类实例化改为延迟初始化
- 修改 `utils/index.js`，更新导出名从 `performance` 为 `perfMonitor`
- 修改 `App.vue`，移除对 `addGlobalClass` 的调用（使用 `document` API），简化无障碍初始化逻辑

## Impact
- Affected specs: 无障碍功能、性能监控功能
- Affected code: `utils/performance.js`, `utils/accessibility.js`, `utils/child-safety.js`, `utils/index.js`, `App.vue`

## ADDED Requirements

### Requirement: performance 模块安全导出
系统 SHALL 将 `performance.js` 中导出的变量名从 `performance` 改为 `perfMonitor`，避免与 JavaScript 全局 `performance` 对象产生命名冲突导致 `ReferenceError`。

#### Scenario: 小程序环境正常加载
- **WHEN** 小程序环境加载 `utils/performance.js`
- **THEN** 不应在模块顶层执行任何 Web-only API 调用（如 `PerformanceObserver`、`requestAnimationFrame`、`window.fetch`）
- **AND** 导出的 `perfMonitor` 应为延迟初始化的实例

### Requirement: 无障碍模块小程序兼容
系统 SHALL 确保 `accessibility.js` 在小程序环境中不执行任何依赖 `document`、`window`、`navigator` 的代码。

#### Scenario: 小程序环境加载无障碍模块
- **WHEN** 小程序环境加载 `utils/accessibility.js`
- **THEN** 不应在模块顶层创建 `FocusManager`、`SpeechSynthesis`、`SimpleNavigation` 实例
- **AND** 这些实例应延迟到 Web 环境才创建

### Requirement: child-safety 模块小程序兼容
系统 SHALL 确保 `child-safety.js` 在小程序环境中不执行任何依赖 `document`、`window` 的代码。

#### Scenario: 小程序环境加载 child-safety 模块
- **WHEN** 小程序环境加载 `utils/child-safety.js`
- **THEN** 不应在模块顶层执行 Web-only 操作
- **AND** `SafetyAnalyzer` 和 `TimeTracker` 应延迟初始化

### Requirement: App.vue 无障碍初始化安全
系统 SHALL 确保 `App.vue` 中的 `addGlobalClass` 方法不使用 `document` 或 `querySelectorAll` 等 Web-only API。

#### Scenario: 小程序环境启动应用
- **WHEN** 小程序环境启动应用并执行 `onLaunch`
- **THEN** 不应调用任何 `document.querySelectorAll` 或 `classList.add` 等 DOM 操作
- **AND** 无障碍设置应通过 CSS 类或 uni API 安全应用

## MODIFIED Requirements

### Requirement: utils/index.js 导出更新
`utils/index.js` 中从 `performance.js` 的导出名 SHALL 从 `performance` 改为 `perfMonitor`。
