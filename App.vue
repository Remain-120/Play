<template>
  <view :class="accessibilityClasses">
    <view v-if="showAccessibilityHint" class="accessibility-hint">
      <text>无障碍模式已启用</text>
    </view>
    <slot />
  </view>
</template>

<script>
export default {
  data() {
    return {
      accessibilityConfig: {},
      showAccessibilityHint: false,
      accessibilityTimer: null,
      highContrast: false,
      largeText: false,
      simpleNavigation: false
    }
  },
  computed: {
    accessibilityClasses() {
      const classes = []
      if (this.highContrast) classes.push('high-contrast')
      if (this.largeText) classes.push('large-text')
      if (this.simpleNavigation) classes.push('simple-navigation')
      return classes.join(' ')
    }
  },
  onLaunch: function() {
    console.log('App Launch')
    this.initCloud()
    this.loadAccessibilityConfig()
    this.applyAccessibilitySettings()
    this.initVoiceNavigation()
    this.initHapticFeedback()
    this.checkTimeLimit()
  },
  onShow: function() {
    console.log('App Show')
    this.checkSessionTime()
  },
  onHide: function() {
    console.log('App Hide')
    this.saveSessionTime()
  },
  methods: {
    initCloud() {
      if (typeof uniCloud !== 'undefined') {
        uniCloud.init({
          provider: 'aliyun',
          spaceId: 'mp-d912b70b-1c22-467c-b3e0-4d2cfc495612',
          clientSecret: 'mcmueJX9df6m3CvaJDQvXQ=='
        })
        console.log('uniCloud 初始化成功')
      }
    },
    
    loadAccessibilityConfig() {
      this.accessibilityConfig = {
        accessibility: {
          highContrast: true,
          largeText: true,
          simpleNavigation: true
        }
      }
      this.showAccessibilityHint = true
      if (this.accessibilityTimer) {
        clearTimeout(this.accessibilityTimer)
      }
      this.accessibilityTimer = setTimeout(() => {
        this.showAccessibilityHint = false
        this.accessibilityTimer = null
      }, 3000)
    },
    
    applyAccessibilitySettings() {
      const config = this.accessibilityConfig.accessibility
      this.highContrast = !!config.highContrast
      this.largeText = !!config.largeText
      this.simpleNavigation = !!config.simpleNavigation
      console.log('无障碍设置已应用', config)
    },
    
    initVoiceNavigation() {
      // 初始化语音导航
      if (this.accessibilityConfig.accessibility?.voiceNavigation) {
        console.log('语音导航已启用')
        // 这里可以初始化TTS引擎
      }
    },
    
    initHapticFeedback() {
      // 初始化触觉反馈
      if (this.accessibilityConfig.accessibility?.hapticFeedback) {
        console.log('触觉反馈已启用')
        // 这里可以初始化震动反馈
      }
    },
    
    checkTimeLimit() {
      // 检查每日使用时间限制
      const today = new Date().toDateString()
      const todayUsage = uni.getStorageSync('daily_usage_' + today) || 0
      const dailyLimit = this.accessibilityConfig.parentControls?.timeLimits?.daily || 60
      
      if (todayUsage >= dailyLimit * 60) { // 转换为秒
        uni.showModal({
          title: '时间限制提醒',
          content: '今日使用时间已达到限制，请休息一下',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    },
    
    checkSessionTime() {
      // 检查单次使用时间
      const sessionStart = uni.getStorageSync('session_start_time')
      if (sessionStart) {
        const sessionLimit = this.accessibilityConfig.parentControls?.timeLimits?.session || 20
        const elapsedMinutes = (Date.now() - sessionStart) / (1000 * 60)
        
        if (elapsedMinutes >= sessionLimit) {
          uni.showModal({
            title: '休息提醒',
            content: '您已经连续使用' + Math.floor(elapsedMinutes) + '分钟，建议休息一下',
            showCancel: false,
            confirmText: '好的，休息一下'
          })
        }
      } else {
        uni.setStorageSync('session_start_time', Date.now())
      }
    },
    
    saveSessionTime() {
      // 保存本次使用时间
      const sessionStart = uni.getStorageSync('session_start_time')
      if (sessionStart) {
        const duration = (Date.now() - sessionStart) / 1000 // 秒
        const today = new Date().toDateString()
        const todayUsage = uni.getStorageSync('daily_usage_' + today) || 0
        uni.setStorageSync('daily_usage_' + today, todayUsage + duration)
        uni.removeStorageSync('session_start_time')
      }
    },
    
    beforeDestroy() {
      // 清理定时器
      if (this.accessibilityTimer) {
        clearTimeout(this.accessibilityTimer)
        this.accessibilityTimer = null
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  box-sizing: border-box;
}

/* 无障碍模式提示 */
.accessibility-hint {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #4CAF50;
  color: white;
  padding: 16rpx;
  text-align: center;
  font-size: 26rpx;
  z-index: 9999;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

/* 高对比度模式 */
.high-contrast page,
.high-contrast .page-container,
.high-contrast .video-card,
.high-contrast .video-info,
.high-contrast .action-bar {
  background-color: #000000 !important;
  color: #FFFFFF !important;
  border-color: #FFFFFF !important;
}

.high-contrast .nav-bar,
.high-contrast .search-container {
  background-color: #222222 !important;
  color: #FFFFFF !important;
}

.high-contrast .video-title,
.high-contrast .info-title {
  color: #FFFFFF !important;
}

.high-contrast .video-description,
.high-contrast .info-description {
  color: #CCCCCC !important;
}

/* 大字体模式 */
.large-text .nav-title {
  font-size: 40rpx !important;
}

.large-text .search-text,
.large-text .video-title,
.large-text .info-title {
  font-size: 32rpx !important;
}

.large-text .video-description,
.large-text .info-description,
.large-text .action-text {
  font-size: 28rpx !important;
}

.large-text .meta-item,
.large-text .loading-text,
.large-text .no-more-text,
.large-text .empty-text {
  font-size: 26rpx !important;
}

/* 简化导航模式 */
.simple-navigation .video-card,
.simple-navigation .search-container,
.simple-navigation .action-item {
  min-height: 88rpx !important;
  min-width: 88rpx !important;
}

.simple-navigation .dot,
.simple-navigation .meta-icon {
  min-width: 12rpx !important;
  min-height: 12rpx !important;
}

/* 儿童友好颜色方案 - 避免红绿色盲问题 */
.child-friendly {
  --primary-color: #2196F3; /* 蓝色 */
  --secondary-color: #FF9800; /* 橙色 */
  --success-color: #4CAF50; /* 绿色 */
  --warning-color: #FFC107; /* 黄色 */
  --danger-color: #F44336; /* 红色 */
  --text-primary: #212121;
  --text-secondary: #757575;
  --background-primary: #F5F5F5;
  --background-secondary: #FFFFFF;
}

/* 微信小程序顶部安全区适配 - 状态栏 + 胶囊按钮双避让 */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 微信小程序底部安全区适配 - home指示条避让 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 完整安全区适配 */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* tabbar页面底部安全区 - 确保tabbar不与home指示条重叠 */
.tabbar-safe-area {
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
}

/* 全屏背景图容器 */
.page-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* 全屏背景图 - 铺满整个屏幕 */
.fullscreen-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

/* 内容层 - 在背景图之上 */
.content-layer {
  position: relative;
  z-index: 1;
}

/* 基础组件样式 */
view, text, button, image, scroll-view, navigator, input, textarea, picker, picker-view, swiper, swiper-item, checkbox, radio, switch, form, label, icon, progress, slider, movable-area, movable-view, cover-view, cover-image, map, canvas, video {
  box-sizing: border-box;
}

/* 全局背景图片样式 - 适配各种屏幕 */
.bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* 页面内容层 */
.page-content {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

/* tabbar页面容器 */
.tabbar-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

/* 视频卡片封面占位背景 */
.video-cover-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
