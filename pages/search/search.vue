<template>
  <view class="page-container">
    <!-- 顶部搜索栏 - 儿童友好设计 -->
    <view class="search-bar safe-area-top" :style="{ paddingTop: statusBarPadding }">
      <view class="search-header">
        <view class="search-brand">
          <image class="search-logo" src="/static/logo.png" mode="aspectFit" />
          <text class="search-title">视频搜索</text>
        </view>
        
        <view class="search-decoration">
          <text class="deco-emoji">🔍</text>
        </view>
      </view>
      
      <view class="search-input-wrapper" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <view class="search-icon">
          <view class="search-dot"></view>
          <view class="search-line"></view>
        </view>
        <input 
          class="search-input" 
          v-model="keyword" 
          placeholder="🔎 搜索你想看的视频..." 
          :focus="isFocused"
          @confirm="handleSearch"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
        <view class="cancel-btn" v-if="keyword" @click="clearKeyword">
          <text class="cancel-text">✕</text>
        </view>
      </view>
      
      <!-- 热门提示 -->
      <view class="hot-hint" v-if="!keyword && !isFocused">
        <text class="hint-emoji">💡</text>
        <text class="hint-text">试试搜索：动画片、儿歌、故事...</text>
      </view>
    </view>
    
    <!-- 搜索结果 -->
    <scroll-view 
      scroll-y 
      class="content-scroll"
      v-if="searchResults.length > 0 || isSearching"
      @scrolltolower="loadMore"
    >
      <view class="results-header">
        <view class="results-info">
          <text class="results-icon">📺</text>
          <text class="results-count">找到 {{ searchResults.length }} 个视频</text>
        </view>
        
        <view class="sort-btn" @click="toggleSort">
          <text class="sort-text">{{ sortOrder === 'default' ? '默认排序' : '最新优先' }}</text>
          <text class="sort-arrow">⇅</text>
        </view>
      </view>
      
      <view class="search-results">
        <VideoCard 
          v-for="item in searchResults" 
          :key="item._id"
          :data="item"
          @click="goToVideo(item)"
        />
      </view>
      
      <!-- 加载状态 -->
      <view class="load-status" v-if="isSearching && searchResults.length === 0">
        <view class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">正在搜索中...</text>
        </view>
      </view>
      
      <view class="load-status" v-if="hasMore && !isSearching && searchResults.length > 0">
        <view class="loading-container">
          <view class="loading-spinner small"></view>
          <text class="loading-text">加载更多...</text>
        </view>
      </view>
      
      <view class="load-status" v-if="!hasMore && searchResults.length > 0">
        <view class="no-more-card">
          <text class="no-more-emoji">🎉</text>
          <text class="no-more-text">已经到底啦！</text>
        </view>
      </view>
    </scroll-view>
    
    <!-- 搜索历史 - 儿童友好设计 -->
    <view class="search-history" v-else-if="searchHistory.length > 0 && !isSearching">
      <view class="history-header">
        <view class="history-title-wrapper">
          <text class="history-icon">🕐</text>
          <text class="history-title">搜索记录</text>
        </view>
        <view class="clear-history" @click="clearHistory" @touchstart="onTouchStart" @touchend="onTouchEnd">
          <text class="clear-icon">🗑️</text>
          <text class="clear-text">清空</text>
        </view>
      </view>
      
      <view class="history-list">
        <view 
          class="history-item" 
          v-for="(item, index) in searchHistory" 
          :key="index"
          @click="searchKeyword(item)"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <text class="history-icon-item">🔍</text>
          <text class="history-text">{{ item }}</text>
          <text class="history-arrow">→</text>
        </view>
      </view>
      
      <!-- 快捷搜索建议 -->
      <view class="suggestions-section">
        <view class="suggestions-header">
          <text class="suggestions-icon">✨</text>
          <text class="suggestions-title">热门推荐</text>
        </view>
        <view class="suggestions-list">
          <view 
            class="suggestion-item" 
            v-for="(suggestion, index) in hotSuggestions" 
            :key="index"
            @click="searchKeyword(suggestion)"
            @touchstart="onTouchStart"
            @touchend="onTouchEnd"
          >
            <text class="suggestion-emoji">{{ suggestion.emoji }}</text>
            <text class="suggestion-text">{{ suggestion.text }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 空状态 - 儿童友好设计 -->
    <view class="empty-state" v-if="searchResults.length === 0 && searchHistory.length === 0 && !isSearching && !keyword">
      <view class="empty-content">
        <view class="empty-icon-wrapper">
          <text class="empty-main-emoji">🔍</text>
          <view class="empty-ring"></view>
        </view>
        
        <text class="empty-title">发现精彩视频</text>
        <text class="empty-subtitle">输入关键词开始搜索吧！</text>
        
        <view class="quick-search-list">
          <view 
            class="quick-search-item" 
            v-for="(item, index) in quickSearchItems" 
            :key="index"
            @click="searchKeyword(item.keyword)"
          >
            <text class="quick-emoji">{{ item.emoji }}</text>
            <text class="quick-text">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 搜索无结果状态 -->
    <view class="no-results-state" v-if="keyword && !isSearching && searchResults.length === 0">
      <view class="no-results-content">
        <view class="no-results-icon-wrapper">
          <text class="no-results-emoji">😢</text>
        </view>
        
        <text class="no-results-title">没有找到相关视频</text>
        <text class="no-results-subtitle">换个关键词试试看？</text>
        
        <view class="try-suggestions">
          <text class="try-label">你可以尝试：</text>
          <view class="try-keywords">
            <view 
              class="try-keyword" 
              v-for="(kw, index) in tryKeywords" 
              :key="index"
              @click="searchKeyword(kw)"
            >
              <text class="keyword-text">{{ kw }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/video-card/VideoCard.vue'
import { callFunction, getStorage, setStorage, removeStorage } from '@/utils/index.js'

const keyword = ref('')
const isFocused = ref(false)
const isSearching = ref(false)
const searchResults = ref([])
const searchHistory = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const statusBarPadding = ref('24rpx')
const sortOrder = ref('default')

// 热门搜索建议
const hotSuggestions = ref([
  { emoji: '🎬', text: '动画片' },
  { emoji: '🎵', text: '儿歌' },
  { emoji: '📖', text: '故事' },
  { emoji: '🎨', text: '画画' }
])

// 快速搜索项
const quickSearchItems = ref([
  { emoji: '🐰', text: '小兔子', keyword: '小兔子' },
  { emoji: '🌈', text: '彩虹', keyword: '彩虹' },
  { emoji: '⭐', text: '星星', keyword: '星星' }
])

// 推荐关键词
const tryKeywords = ref(['动画片', '儿歌', '故事', '英语'])

const loadSearchHistory = () => {
  const history = getStorage('searchHistory') || []
  searchHistory.value = history
}

const saveSearchHistory = (kw) => {
  let history = getStorage('searchHistory') || []
  history = history.filter(item => item !== kw)
  history.unshift(kw)
  history = history.slice(0, 20)
  setStorage('searchHistory', history)
  searchHistory.value = history
}

const clearHistory = () => {
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
  
  removeStorage('searchHistory')
  searchHistory.value = []
  
  uni.showToast({
    title: '已清空',
    icon: 'success'
  })
}

const clearKeyword = () => {
  keyword.value = ''
  searchResults.value = []
  isFocused.value = false
  page.value = 1
  hasMore.value = true
}

const searchKeyword = (kw) => {
  keyword.value = kw
  
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
  
  handleSearch()
}

const handleSearch = async (isLoadMore = false) => {
  if (!keyword.value.trim()) return
  
  if (!isLoadMore) {
    isSearching.value = true
    searchResults.value = []
    page.value = 1
    hasMore.value = true
  }
  
  if (isLoadMore && (!hasMore.value || isSearching.value)) return
  
  isSearching.value = true
  
  try {
    const res = await callFunction('video', {
      action: 'search',
      keyword: keyword.value,
      page: page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 0) {
      if (isLoadMore) {
        searchResults.value = [...searchResults.value, ...res.data.list]
      } else {
        searchResults.value = res.data.list
        saveSearchHistory(keyword.value)
      }
      
      hasMore.value = searchResults.value.length < res.data.total
      page.value++
    }
  } catch (e) {
    console.error('搜索失败:', e)
    uni.showToast({
      title: '搜索失败',
      icon: 'none'
    })
  } finally {
    isSearching.value = false
  }
}

const loadMore = () => {
  handleSearch(true)
}

const goToVideo = (item) => {
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
  
  uni.navigateTo({
    url: `/pages/video/video?id=${item._id}`
  })
}

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'default' ? 'latest' : 'default'
  
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
}

const onTouchStart = () => {
}

const onTouchEnd = () => {
}

onMounted(() => {
  loadSearchHistory()
  const sysInfo = uni.getSystemInfoSync()
  const statusBarHeight = sysInfo.statusBarHeight || 0
  statusBarPadding.value = (statusBarHeight + 12) + 'px'
})
</script>

<style scoped>
.page-container {
  background: #f5f6fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.search-bar {
  background: #ffffff;
  padding: 20rpx 32rpx 24rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.search-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }

.search-brand { display: flex; align-items: center; gap: 14rpx; }
.search-logo { width: 52rpx; height: 52rpx; border-radius: 14rpx; }
.search-title { font-size: 34rpx; font-weight: 600; color: #1a1a1a; }

.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f7f7f7;
  border-radius: 44rpx;
  padding: 22rpx 26rpx;
  transition: all 0.25s ease;
}
.search-input-wrapper:focus-within { background-color: #f0f0f0; }

.search-icon { width: 40rpx; height: 40rpx; position: relative; margin-right: 16rpx; flex-shrink: 0; }
.search-dot { position: absolute; width: 16rpx; height: 16rpx; border-radius: 50%; top: 8rpx; left: 8rpx; background-color: #999; }
.search-line { position: absolute; width: 10rpx; height: 4rpx; background-color: #999; border-radius: 2rpx; transform: rotate(45deg); bottom: 9rpx; right: 7rpx; }

.search-input { flex: 1; font-size: 28rpx; color: #1a1a1a; font-weight: 400; background: transparent; border: none; outline: none; }
.search-input::placeholder { color: #bbb; font-weight: 400; }

.cancel-btn { display: flex; align-items: center; justify-content: center; width: 44rpx; height: 44rpx; margin-left: 12rpx; background-color: #f0f0f0; border-radius: 50%; transition: all 0.2s ease; }
.cancel-btn:active { transform: scale(0.9); background-color: #e5e5e5; }
.cancel-text { font-size: 22rpx; color: #999; font-weight: normal; }

.hot-hint { display: flex; align-items: center; gap: 10rpx; margin-top: 16rpx; padding: 14rpx 18rpx; background-color: #fafafa; border-radius: 14rpx; }
.hint-emoji { font-size: 24rpx; }
.hint-text { font-size: 22rpx; color: #999; font-weight: 400; }

.content-scroll { flex: 1; height: 0; position: relative; z-index: 1; }

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 28rpx;
  background-color: #ffffff;
}

.results-info { display: flex; align-items: center; gap: 10rpx; }
.results-icon { font-size: 28rpx; }
.results-count { font-size: 26rpx; font-weight: 500; color: #333; }

.sort-btn { display: flex; align-items: center; gap: 8rpx; padding: 10rpx 18rpx; background-color: #f5f5f5; border-radius: 20rpx; transition: all 0.2s ease; }
.sort-btn:active { transform: scale(0.95); }
.sort-text { font-size: 22rpx; font-weight: 500; color: #666; }
.sort-arrow { font-size: 22rpx; color: #666; }

.search-results { padding: 0; }

.load-status { padding: 36rpx 0; display: flex; justify-content: center; }
.loading-container { display: flex; flex-direction: column; align-items: center; gap: 14rpx; }
.loading-spinner { width: 48rpx; height: 48rpx; border: 3rpx solid #eee; border-top-color: #999; border-radius: 50%; animation: spin 0.8s linear infinite; }
.loading-spinner.small { width: 36rpx; height: 36rpx; border-width: 2rpx; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 24rpx; color: #999; font-weight: 400; }

.no-more-card { display: flex; align-items: center; gap: 10rpx; padding: 16rpx 32rpx; background-color: #fafafa; border-radius: 28rpx; }
.no-more-emoji { font-size: 28rpx; }
.no-more-text { font-size: 24rpx; font-weight: 400; color: #999; }

.search-history { padding: 28rpx; flex: 1; position: relative; z-index: 1; }

.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.history-title-wrapper { display: flex; align-items: center; gap: 10rpx; }
.history-icon { font-size: 30rpx; }
.history-title { font-size: 30rpx; font-weight: 600; color: #1a1a1a; }

.clear-history { display: flex; align-items: center; gap: 6rpx; padding: 10rpx 16rpx; background-color: #f5f5f5; border-radius: 18rpx; transition: all 0.2s ease; }
.clear-history:active { transform: scale(0.95); }
.clear-icon { font-size: 24rpx; }
.clear-text { font-size: 22rpx; font-weight: 400; color: #999; }

.history-list { display: flex; flex-direction: column; gap: 12rpx; margin-bottom: 32rpx; }

.history-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03);
  transition: all 0.25s ease;
}
.history-item:active { transform: scale(0.98); box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06); }

.history-icon-item { font-size: 28rpx; margin-right: 14rpx; color: #ccc; }
.history-text { flex: 1; font-size: 26rpx; font-weight: 400; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-arrow { font-size: 24rpx; color: #ddd; margin-left: 10rpx; }

.suggestions-section { background: #ffffff; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03); }

.suggestions-header { display: flex; align-items: center; gap: 10rpx; margin-bottom: 16rpx; }
.suggestions-icon { font-size: 28rpx; }
.suggestions-title { font-size: 26rpx; font-weight: 600; color: #333; }

.suggestions-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx;
  background-color: #f7f7f7;
  border-radius: 14rpx;
  transition: all 0.2s ease;
}
.suggestion-item:active { transform: scale(0.96); background-color: #efefef; }
.suggestion-emoji { font-size: 28rpx; }
.suggestion-text { font-size: 24rpx; font-weight: 500; color: #555; }

.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48rpx 28rpx; position: relative; z-index: 1; }

.empty-content { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 480rpx; }

.empty-icon-wrapper {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}
.empty-main-emoji { font-size: 64rpx; }

.empty-title { font-size: 30rpx; font-weight: 600; color: #333; margin-bottom: 10rpx; display: block; }
.empty-subtitle { font-size: 24rpx; color: #999; font-weight: 400; margin-bottom: 32rpx; display: block; }

.quick-search-list { display: flex; flex-wrap: wrap; gap: 12rpx; justify-content: center; }

.quick-search-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background-color: #1a1a1a;
  border-radius: 36rpx;
  transition: all 0.2s ease;
}
.quick-search-item:active { opacity: 0.85; }
.quick-emoji { font-size: 26rpx; }
.quick-text { font-size: 24rpx; font-weight: 500; color: #fff; }

.no-results-state { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48rpx 28rpx; position: relative; z-index: 1; }

.no-results-content { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 480rpx; }

.no-results-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}
.no-results-emoji { font-size: 56rpx; }

.no-results-title { font-size: 28rpx; font-weight: 500; color: #333; margin-bottom: 10rpx; display: block; }
.no-results-subtitle { font-size: 24rpx; color: #999; font-weight: 400; margin-bottom: 28rpx; display: block; }

.try-suggestions { width: 100%; background: #ffffff; border-radius: 18rpx; padding: 20rpx; box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03); }
.try-label { font-size: 24rpx; font-weight: 500; color: #666; display: block; margin-bottom: 14rpx; text-align: left; }

.try-keywords { display: flex; flex-wrap: wrap; gap: 10rpx; }
.try-keyword { padding: 12rpx 20rpx; background-color: #f5f5f5; border-radius: 20rpx; transition: all 0.2s ease; }
.try-keyword:active { transform: scale(0.95); background-color: #ebebeb; }
.keyword-text { font-size: 22rpx; font-weight: 400; color: #555; }
</style>