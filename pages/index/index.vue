<template>
  <view class="page-container">
    <!-- 顶部导航栏 - 儿童友好设计 -->
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <!-- 应用Logo和名称 -->
        <view class="app-brand">
          <image class="app-logo" src="/static/logo.png" mode="aspectFit" />
          <text class="app-name">儿童乐园</text>
        </view>
        
        <!-- 语音助手按钮 -->
        <view class="voice-assistant" @click="toggleVoiceAssistant" @touchstart="onTouchStart" @touchend="onTouchEnd">
          <view class="voice-icon">
            <view class="voice-wave"></view>
            <view class="voice-wave"></view>
            <view class="voice-wave"></view>
          </view>
          <text class="voice-text">语音助手</text>
        </view>
      </view>
      
      <!-- 搜索区域 -->
      <view class="search-container" @click="goToSearch" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <view class="search-icon">
          <view class="search-dot"></view>
          <view class="search-line"></view>
        </view>
        <text class="search-text">搜索视频</text>
        <view class="search-hint">👆 点击搜索</view>
      </view>
      
      <!-- 今日使用时间提示 -->
      <view class="time-reminder" v-if="showTimeReminder">
        <text class="time-text">⏰ 今日已使用 {{ formatTime(todayUsage) }}</text>
      </view>
    </view>
    
    <!-- 欢迎横幅 - 儿童友好 -->
    <view class="welcome-banner" v-if="showWelcome">
      <view class="banner-content">
        <text class="banner-title">🎉 欢迎来到儿童乐园！</text>
        <text class="banner-subtitle">这里有好多有趣的视频等着你发现哦！</text>
      </view>
      <view class="banner-close" @click="closeWelcome">✕</view>
    </view>
    
    <!-- 分类导航 - 简化版 -->
    <view class="category-nav">
      <scroll-view scroll-x class="category-scroll">
        <view 
          class="category-item" 
          v-for="category in categories" 
          :key="category.value"
          :class="{ active: activeCategory === category.value }"
          @click="selectCategory(category.value)"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <text class="category-icon">{{ category.icon }}</text>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </scroll-view>
    </view>
    
    <!-- 视频列表 -->
    <scroll-view 
      scroll-y 
      class="video-scroll"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      :scroll-with-animation="true"
      :enhanced="true"
      :show-scrollbar="false"
    >
      <!-- 语音提示 -->
      <view class="voice-hint" v-if="voiceAssistantActive">
        <text class="hint-text">🎤 语音助手已开启，可以说"播放视频"或"搜索"</text>
      </view>
      
      <view class="video-list">
        <VideoCard 
          v-for="item in filteredVideos" 
          :key="item._id"
          :data="item"
          @click="goToVideo(item)"
        />
      </view>
      
      <!-- 加载状态 -->
      <view class="load-status" v-if="isLoading">
        <text class="loading-text">加载中...</text>
      </view>
      
      <view class="load-status" v-else-if="!hasMore && videoList.length > 0">
        <text class="no-more-text">没有更多内容了</text>
      </view>
      
      <view class="load-status" v-else-if="videoList.length === 0 && !isLoading">
        <text class="empty-text">暂无视频</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import VideoCard from '@/components/video-card/VideoCard.vue'
import { callFunction, formatTime } from '@/utils/index.js'

const videoList = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const isLoading = ref(false)
const isRefreshing = ref(false)
const showWelcome = ref(true)
const voiceAssistantActive = ref(false)
const activeCategory = ref('all')
const todayUsage = ref(0)
const showTimeReminder = ref(false)

// 儿童友好分类
const categories = ref([
  { icon: '🌟', name: '全部', value: 'all' },
  { icon: '📚', name: '学习', value: 'educational' },
  { icon: '🎵', name: '音乐', value: 'music' },
  { icon: '📖', name: '故事', value: 'story' },
  { icon: '🏃', name: '运动', value: 'exercise' },
  { icon: '🎨', name: '画画', value: 'art' },
  { icon: '🔬', name: '科学', value: 'science' },
  { icon: '🧩', name: '游戏', value: 'game' }
])

// 过滤后的视频列表
const filteredVideos = computed(() => {
  if (activeCategory.value === 'all') {
    return videoList.value
  }
  return videoList.value.filter(video => video.category === activeCategory.value)
})

const loadVideoList = async (isRefresh = false) => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const res = await callFunction('video', {
      action: 'getList',
      page: isRefresh ? 1 : page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 0) {
      if (isRefresh) {
        videoList.value = res.data.list
      } else {
        videoList.value = [...videoList.value, ...res.data.list]
      }
      
      hasMore.value = videoList.value.length < res.data.total
      
      if (isRefresh) {
        page.value = 2
      } else {
        page.value++
      }
    }
  } catch (e) {
    console.error('加载视频失败:', e)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

const onRefresh = () => {
  isRefreshing.value = true
  page.value = 1
  hasMore.value = true
  loadVideoList(true)
}

const loadMore = () => {
  if (!hasMore.value || isLoading.value) return
  loadVideoList(false)
}

const goToSearch = () => {
  uni.switchTab({
    url: '/pages/search/search'
  })
}

const goToVideo = (item) => {
  // 添加触觉反馈
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
  
  // 语音提示
  if (voiceAssistantActive.value) {
    speak(`正在播放${item.title}`)
  }
  
  uni.navigateTo({
    url: `/pages/video/video?id=${item._id}`
  })
}

const toggleVoiceAssistant = () => {
  voiceAssistantActive.value = !voiceAssistantActive.value
  
  if (voiceAssistantActive.value) {
    speak('语音助手已开启，可以说播放视频或搜索')
    uni.vibrateShort({ type: 'medium' })
  } else {
    speak('语音助手已关闭')
    uni.vibrateShort()
  }
}

const speak = (text) => {
  // 简单的语音提示
  uni.showToast({
    title: text,
    icon: 'none',
    duration: 2000
  })
}

const selectCategory = (category) => {
  activeCategory.value = category
  
  // 触觉反馈
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
  
  // 语音提示
  if (voiceAssistantActive.value) {
    speak(`切换到${categories.value.find(c => c.value === category)?.name}分类`)
  }
}

const closeWelcome = () => {
  showWelcome.value = false
  
  // 触觉反馈
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
}

const onTouchStart = () => {
  // 触摸开始时的视觉反馈
  // 可以在元素上添加active类来实现
}

const onTouchEnd = () => {
  // 触摸结束
}

const checkTodayUsage = () => {
  const today = new Date().toDateString()
  const usage = uni.getStorageSync('daily_usage_' + today) || 0
  todayUsage.value = usage
  
  // 如果使用时间超过30分钟，显示提醒
  if (usage > 30 * 60) {
    showTimeReminder.value = true
  }
}

onMounted(() => {
  loadVideoList(true)
  checkTodayUsage()
  
  // 每5分钟检查一次使用时间
  setInterval(checkTodayUsage, 5 * 60 * 1000)
})
</script>

<style scoped>
.page-container {
  background: #f5f6fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  background: #ffffff;
  padding: 20rpx 32rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.app-logo {
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
}

.app-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.voice-assistant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 18rpx;
  background-color: #f5f5f5;
  border-radius: 20rpx;
  min-width: 100rpx;
  min-height: 100rpx;
  justify-content: center;
}

.voice-assistant:active {
  transform: scale(0.95);
  background-color: #ebebeb;
}

.voice-icon {
  position: relative;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-wave {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #bbb;
  opacity: 0.3;
  animation: voice-pulse 1.5s ease-in-out infinite;
}

.voice-wave:nth-child(2) { animation-delay: 0.5s; }
.voice-wave:nth-child(3) { animation-delay: 1s; }

@keyframes voice-pulse {
  0% { transform: scale(0.8); opacity: 0.3; }
  100% { transform: scale(1.5); opacity: 0; }
}

.voice-text {
  font-size: 22rpx;
  color: #666;
  font-weight: 500;
}

.search-container {
  display: flex;
  align-items: center;
  background-color: #f7f7f7;
  border-radius: 44rpx;
  padding: 20rpx 24rpx;
  margin-top: 16rpx;
  transition: background 0.25s ease;
  min-height: 88rpx;
}

.search-container:active {
  background-color: #eeeeee;
}

.search-icon {
  width: 40rpx;
  height: 40rpx;
  position: relative;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.search-dot {
  position: absolute;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  top: 8rpx;
  left: 8rpx;
  background-color: #999;
}

.search-line {
  position: absolute;
  width: 10rpx;
  height: 4rpx;
  background-color: #999;
  border-radius: 2rpx;
  transform: rotate(45deg);
  bottom: 9rpx;
  right: 7rpx;
}

.search-text {
  font-size: 28rpx;
  color: #999;
  flex: 1;
  font-weight: 400;
  margin-right: 12rpx;
}

.search-hint {
  font-size: 22rpx;
  color: #bbb;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
}

.time-reminder {
  margin-top: 14rpx;
  padding: 10rpx 18rpx;
  background-color: #f0f4ef;
  border-radius: 16rpx;
}

.time-text {
  font-size: 24rpx;
  color: #5a7a55;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.welcome-banner {
  margin: 20rpx 28rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
}

.banner-subtitle {
  font-size: 26rpx;
  color: #888;
  font-weight: 400;
}

.banner-close {
  width: 52rpx;
  height: 52rpx;
  background-color: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  font-weight: normal;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.banner-close:active {
  background-color: #ebebeb;
}

.category-nav {
  margin: 0 28rpx 20rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 16rpx 18rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03);
}

.category-scroll {
  white-space: nowrap;
}

.category-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 20rpx;
  margin-right: 16rpx;
  background-color: #f7f7f7;
  border-radius: 16rpx;
  min-width: 104rpx;
  min-height: 104rpx;
  justify-content: center;
  transition: all 0.25s ease;
}

.category-item:last-child { margin-right: 0; }

.category-item:active { transform: scale(0.95); }

.category-item.active {
  background-color: #1a1a1a;
}

.category-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
  display: block;
}

.category-item.active .category-icon { filter: brightness(10); }

.category-name {
  font-size: 24rpx;
  font-weight: 500;
  color: #666;
}

.category-item.active .category-name { color: #fff; }

.voice-hint {
  margin: 16rpx 28rpx;
  padding: 16rpx 20rpx;
  background-color: #f0f4ef;
  border-radius: 14rpx;
}

.hint-text {
  font-size: 26rpx;
  color: #5a7a55;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.video-scroll {
  flex: 1;
  height: 0;
  padding: 0 0 40rpx;
  position: relative;
  z-index: 1;
}

.video-list {
  padding: 0 20rpx;
}

.load-status {
  padding: 60rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.loading-text::before {
  content: '';
  width: 20rpx;
  height: 20rpx;
  border: 2rpx solid #ddd;
  border-top-color: #999;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-more-text {
  font-size: 26rpx;
  color: #bbb;
  font-weight: 400;
  padding: 16rpx 36rpx;
  background-color: #f7f7f7;
  border-radius: 32rpx;
  display: inline-block;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  font-weight: 400;
  padding: 40rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  display: inline-block;
}
</style>