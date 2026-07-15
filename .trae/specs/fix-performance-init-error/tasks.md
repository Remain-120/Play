# Tasks

- [x] Task 1: 修复 utils/performance.js - 重命名导出并延迟初始化
  - [x] SubTask 1.1: 将导出名从 `performance` 改为 `perfMonitor`
  - [x] SubTask 1.2: 将 `Performance.getInstance()` 从模块顶层移除，改为延迟获取
  - [x] SubTask 1.3: 将 `PerformanceMetrics` 构造函数中的 `setupPerformanceObserver()` 和 `startMonitoring()` 改为仅在 Web 环境延迟执行
  - [x] SubTask 1.4: 确保 `monitorFPS()`、`monitorMemory()`、`monitorNetwork()` 不在小程序环境执行

- [x] Task 2: 修复 utils/accessibility.js - 延迟初始化 Web-only 类
  - [x] SubTask 2.1: 将 `Accessibility` 类的静态属性 `focusManager`、`speech`、`navigation` 从直接实例化改为 getter 延迟实例化
  - [x] SubTask 2.2: 确保 `FocusManager`、`SpeechSynthesis`、`SimpleNavigation` 仅在 Web 环境实例化
  - [x] SubTask 2.3: 确保 `HapticFeedback` 在小程序环境使用 `uni.vibrateShort` 替代 `navigator.vibrate`

- [x] Task 3: 修复 utils/child-safety.js - 延迟初始化
  - [x] SubTask 3.1: 将 `SafetyAnalyzer` 和 `TimeTracker` 的导出改为延迟初始化工厂函数（确认无需修改，已是类定义导出）
  - [x] SubTask 3.2: 确保 `storage` 工具在小程序环境优先使用 `uni.setStorageSync`（确认已正确实现）

- [x] Task 4: 修复 utils/index.js - 更新导出名
  - [x] SubTask 4.1: 将 `export * from './performance.js'` 改为 `export { perfMonitor } from './performance.js'`
  - [x] SubTask 4.2: 更新 `isChildFriendlyContent` 和 `getRecommendedContent` 中的 `require` 调用为 ES Module import

- [x] Task 5: 修复 App.vue - 移除 Web-only DOM 操作
  - [x] SubTask 5.1: 将 `addGlobalClass` 方法移除，改用响应式数据 + 计算属性 + 模板绑定
  - [x] SubTask 5.2: 简化 `applyAccessibilitySettings`，移除 DOM 操作
  - [x] SubTask 5.3: 修复 `loadAccessibilityConfig` 中的 `require` 调用（小程序不支持）

# Task Dependencies
- Task 4 depends on Task 1 (导出名修改后才能更新 index.js)
- Task 5 独立于其他 Task
