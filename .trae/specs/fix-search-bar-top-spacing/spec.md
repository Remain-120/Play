# 搜索页搜索栏顶部间距修复 Spec

## Why
用户反馈搜索页面中，搜索栏过于靠近屏幕上方（状态栏区域），与状态栏内容重叠或距离过近，影响视觉效果和可用性。

## What Changes
- 增加搜索栏（`.search-bar`）的顶部内边距，确保在微信小程序环境中与状态栏保持适当距离
- 调整 `padding-top` 值，增加额外的顶部间距

## Impact
- Affected code: `pages/search/search.vue`
- 仅影响搜索页面的搜索栏样式

## MODIFIED Requirements
### Requirement: 搜索栏顶部安全区域适配
搜索栏的顶部内边距 SHALL 在微信小程序中正确处理安全区域（刘海屏/状态栏），确保搜索输入框不与系统状态栏重叠。

#### Scenario: 搜索页正常显示
- **WHEN** 用户进入搜索页面
- **THEN** 搜索栏与屏幕顶部（状态栏下方）保持合理的视觉间距（至少包含完整的安全区域内边距 + 额外间距）
