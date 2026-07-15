<template>
  <view class="page-container">
    <view class="content">
      <view class="custom-nav safe-area-top">
        <view class="nav-back" @click="goBack">
          <Icon name="stopwatch-start" theme="outline" :size="36" fill="#333" />
        </view>
        <text class="nav-title">观看历史</text>
        <view class="nav-clear" @click="handleClear" v-if="historyList.length > 0">
          <text>清空</text>
        </view>
      </view>

      <scroll-view 
        scroll-y 
        class="history-scroll"
        refresher-enabled
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
      >
        <view class="history-list" v-if="historyList.length > 0">
          <view 
            class="history-item card" 
            v-for="item in historyList" 
            :key="item._id"
            @click="goToVideo(item.video)"
          >
            <image class="item-cover" :src="item.video?.cover_url" mode="aspectFill" />
            <view class="item-info">
              <text class="item-title">{{ item.video?.title }}</text>
              <view class="item-meta">
                <text class="meta-text">观看 {{ formatTime(item.total_duration || 0) }}</text>
                <text class="meta-text">{{ item.watch_count }} 次</text>
              </view>
            </view>
          </view>
        </view>

        <view class="load-more" v-if="hasMore">
          <text>加载中...</text>
        </view>
        <view class="no-more" v-else-if="historyList.length > 0">
          <text>没有更多了</text>
        </view>
        <view class="empty-state" v-if="historyList.length === 0 && !isLoading">
          <Icon name="history" theme="outline" :size="120" fill="#ddd" />
          <text>暂无观看历史</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { callFunction, formatTime } from '@/utils/index.js'

const historyList = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const isLoading = ref(false)
const isRefreshing = ref(false)

const loadHistoryList = async (isRefresh = false) => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const res = await callFunction('watch-history', {
      action: 'getList',
      page: isRefresh ? 1 : page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 0) {
      if (isRefresh) {
        historyList.value = res.data.list
      } else {
        historyList.value = [...historyList.value, ...res.data.list]
      }
      
      hasMore.value = historyList.value.length < res.data.total
      
      if (isRefresh) {
        page.value = 2
      } else {
        page.value++
      }
    }
  } catch (e) {
    console.error('加载历史失败:', e)
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
  loadHistoryList(true)
}

const loadMore = () => {
  if (!hasMore.value || isLoading.value) return
  loadHistoryList(false)
}

const handleClear = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空所有观看历史吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await callFunction('watch-history', {
            action: 'clear'
          })
          historyList.value = []
          uni.showToast({
            title: '清空成功',
            icon: 'success'
          })
        } catch (e) {
          console.error('清空失败:', e)
        }
      }
    }
  })
}

const goToVideo = (video) => {
  if (video) {
    uni.navigateTo({
      url: `/pages/video/video?id=${video._id}`
    })
  }
}

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  loadHistoryList(true)
})
</script>

<style scoped>
.page-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #f5f6fa;
}

.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.custom-nav {
  position: relative;
  z-index: 2;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background-color: #ffffff;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-back,
.nav-clear { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.nav-clear text { font-size: 28rpx; color: #999; }
.nav-title { font-size: 32rpx; font-weight: 500; color: #1a1a1a; }

.history-scroll { flex: 1; height: 0; }
.history-list { padding: 16rpx 0; }

.history-item {
  margin: 16rpx 24rpx;
  padding: 20rpx;
  display: flex;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03);
}

.item-cover {
  width: 200rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }

.item-title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-meta { display: flex; align-items: center; }
.meta-text { font-size: 22rpx; color: #999; margin-right: 20rpx; }

.load-more,
.no-more,
.empty-state { padding: 30rpx 0; text-align: center; font-size: 24rpx; color: #999; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-state text { margin-top: 30rpx; }
</style>
