# 修复微信小程序运行时错误 Spec

## Why
项目可以运行到微信开发者工具，但只有底部dock栏能加载，页面无法正常显示，并出现多个运行时错误：
1. 无障碍模块使用了Web API（如document、window、localStorage）在小程序环境中不可用
2. 页面未正确注册，导致无法显示页面内容
3. 部分API已弃用，需替换为新的API

## What Changes
- **无障碍模块适配**：修改无障碍模块，移除或替代Web-only API，使其在小程序环境中正常工作
- **页面注册检查**：检查页面配置和注册逻辑，确保所有页面正确注册
- **API更新**：将已弃用的API更新为新的API
- **环境检测**：添加运行环境检测，针对不同平台提供不同的实现

## Impact
- **Affected specs**：无障碍功能、页面路由系统、性能监控
- **Affected code**：
  - `utils/accessibility.js` - 无障碍功能模块
  - `utils/performance.js` - 性能监控模块（可能使用了Web API）
  - `utils/child-safety.js` - 儿童安全模块（可能使用了localStorage）
  - `App.vue` - 应用启动和配置
  - `pages/**/*.vue` - 所有页面组件

## ADDED Requirements
### Requirement: 小程序环境兼容性
系统SHALL在小程序环境中正常运行，不使用Web-only API

#### Scenario: 无障碍功能初始化
- **WHEN** 应用在小程序环境中启动
- **THEN** 无障碍模块应检测到小程序环境，不调用document/window等Web API
- **AND** 无障碍功能应降级为小程序可用的实现

#### Scenario: 存储适配
- **WHEN** 应用在小程序环境中需要本地存储
- **THEN** 应使用uni.setStorageSync/uni.getStorageSync替代localStorage

#### Scenario: 页面注册
- **WHEN** 页面在小程序环境中加载
- **THEN** 所有页面应正确注册并显示内容

## MODIFIED Requirements
### Requirement: 无障碍功能
修改无障碍功能模块，使其在小程序环境中可用。移除document.querySelectorAll、window.addEventListener等Web-only API，使用uni-app提供的API替代。

### Requirement: 性能监控
修改性能监控模块，移除PerformanceObserver等Web API，使用小程序性能API或降级实现。

## REMOVED Requirements
### Requirement: 浏览器特定功能
移除在小程序环境中不可用的浏览器特定功能，如：
- `document.querySelectorAll`
- `window.addEventListener`
- `localStorage`
- `PerformanceObserver`

**Reason**：这些API在小程序环境中不可用，会导致运行时错误
**Migration**：使用uni-app提供的跨平台API替代