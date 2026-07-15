<template>
  <view class="page-container">
    <view class="content">
      <view class="custom-nav safe-area-top">
        <view class="nav-back" @click="goBack">
          <Icon name="stopwatch-start" theme="outline" :size="36" fill="#333" />
        </view>
        <text class="nav-title">我的收藏</text>
        <view class="nav-spacer"></view>
      </view>

      <scroll-view 
        scroll-y 
        class="favorites-scroll"
        refresher-enabled
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
      >
        <view class="favorites-list" v-if="favoritesList.length > 0">
          <VideoCard 
            v-for="item in favoritesList" 
            :key="item._id"
            :data="item.video"
            @click="goToVideo(item.video)"
          />
        </view>

        <view class="load-more" v-if="hasMore">
          <text>加载中...</text>
        </view>
        <view class="no-more" v-else-if="favoritesList.length > 0">
          <text>没有更多了</text>
        </view>
        <view class="empty-state" v-if="favoritesList.length === 0 && !isLoading">
          <Icon name="star" theme="outline" :size="120" fill="#ddd" />
          <text>暂无收藏内容</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import VideoCard from '@/components/video-card/VideoCard.vue'
import { callFunction } from '@/utils/index.js'

const favoritesList = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const isLoading = ref(false)
const isRefreshing = ref(false)

const loadFavoritesList = async (isRefresh = false) => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const res = await callFunction('favorite', {
      action: 'getList',
      page: isRefresh ? 1 : page.value,
      pageSize: pageSize.value
    })
    
    if (res.code === 0) {
      if (isRefresh) {
        favoritesList.value = res.data.list
      } else {
        favoritesList.value = [...favoritesList.value, ...res.data.list]
      }
      
      hasMore.value = favoritesList.value.length < res.data.total
      
      if (isRefresh) {
        page.value = 2
      } else {
        page.value++
      }
    }
  } catch (e) {
    console.error('加载收藏失败:', e)
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
  loadFavoritesList(true)
}

const loadMore = () => {
  if (!hasMore.value || isLoading.value) return
  loadFavoritesList(false)
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
  loadFavoritesList(true)
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

.nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.nav-spacer { width: 60rpx; }
.nav-title { font-size: 32rpx; font-weight: 500; color: #1a1a1a; }

.favorites-scroll { flex: 1; height: 0; }
.favorites-list { padding: 16rpx 0; }

.load-more,
.no-more,
.empty-state { padding: 30rpx 0; text-align: center; font-size: 24rpx; color: #999; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-state text { margin-top: 30rpx; }
</style>
