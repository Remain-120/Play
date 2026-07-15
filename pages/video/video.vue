<template>
  <view class="page-container">
    <view class="content safe-area-top">
      <view class="video-player-container">
        <video
          id="videoPlayer"
          class="video-player"
          :src="videoData.video_url"
          :poster="videoData.cover_url"
          :controls="true"
          :show-center-play-btn="true"
          :enable-play-gesture="true"
          :auto-pause-if-navigate="true"
          :auto-pause-if-open-native="true"
          :show-screen-lock-button="true"
          @play="onPlay"
          @pause="onPause"
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
          @fullscreenchange="onFullscreenChange"
        >
        </video>
      </view>

      <view class="video-info card">
        <view class="info-title">{{ videoData.title }}</view>
        <view class="info-meta">
          <view class="meta-item">
            <view class="meta-icon view-icon"></view>
            <text>{{ videoData.view_count || 0 }} 次播放</text>
          </view>
          <view class="meta-item">
            <view class="meta-icon time-icon"></view>
            <text>{{ formatDate }}</text>
          </view>
        </view>
        <view class="info-description" v-if="videoData.description">
          <text>{{ videoData.description }}</text>
        </view>
      </view>

      <view class="action-bar card">
        <view class="action-item" @click="handleLike">
          <view :class="['like-icon', { active: isLiked }]">
            <view class="heart-shape"></view>
          </view>
          <text :class="['action-text', { active: isLiked }]">{{ videoData.like_count || 0 }}</text>
        </view>
        <view class="action-item" @click="handleFavorite">
          <view :class="['favorite-icon', { active: isFavorited }]">
            <view class="star-point"></view>
            <view class="star-point"></view>
            <view class="star-point"></view>
            <view class="star-point"></view>
            <view class="star-point"></view>
          </view>
          <text :class="['action-text', { active: isFavorited }]">收藏</text>
        </view>
        <view class="action-item" @click="handleDownload">
          <view class="download-icon">
            <view class="arrow-line"></view>
            <view class="arrow-head"></view>
          </view>
          <text class="action-text">下载</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { callFunction, formatRelativeTime } from '@/utils/index.js'

const videoId = ref('')
const videoData = ref({})
const isLiked = ref(false)
const isFavorited = ref(false)
const watchStartTime = ref(0)
const currentTime = ref(0)

const formatDate = computed(() => {
  if (videoData.value.create_time) {
    return formatRelativeTime(videoData.value.create_time)
  }
  return ''
})

const loadVideoDetail = async () => {
  try {
    const res = await callFunction('video', {
      action: 'getDetail',
      id: videoId.value
    })
    
    if (res.code === 0) {
      videoData.value = res.data
    }
  } catch (e) {
    console.error('加载视频详情失败:', e)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

const checkLikeAndFavorite = async () => {
  try {
    const [likeRes, favoriteRes] = await Promise.all([
      callFunction('like', {
        action: 'check',
        videoId: videoId.value
      }),
      callFunction('favorite', {
        action: 'check',
        videoId: videoId.value
      })
    ])
    
    if (likeRes.code === 0) {
      isLiked.value = likeRes.data.isLiked
    }
    
    if (favoriteRes.code === 0) {
      isFavorited.value = favoriteRes.data.isFavorited
    }
  } catch (e) {
    console.error('检查状态失败:', e)
  }
}

const addViewCount = async () => {
  try {
    await callFunction('video', {
      action: 'addViewCount',
      id: videoId.value
    })
  } catch (e) {
    console.error('增加观看次数失败:', e)
  }
}

const recordWatchHistory = async (duration) => {
  try {
    await callFunction('watch-history', {
      action: 'record',
      videoId: videoId.value,
      duration: Math.floor(duration)
    })
  } catch (e) {
    console.error('记录观看历史失败:', e)
  }
}

const onPlay = () => {
  watchStartTime.value = Date.now()
  addViewCount()
}

const onPause = () => {
  const duration = (Date.now() - watchStartTime.value) / 1000
  if (duration > 3) {
    recordWatchHistory(duration)
  }
}

const onTimeUpdate = (e) => {
  currentTime.value = e.detail.currentTime
}

const onEnded = () => {
  const duration = (Date.now() - watchStartTime.value) / 1000
  if (duration > 3) {
    recordWatchHistory(duration)
  }
}

const onFullscreenChange = (e) => {
  console.log('全屏状态变化:', e.detail.fullScreen)
}

const handleLike = async () => {
  try {
    const res = await callFunction('like', {
      action: 'toggle',
      videoId: videoId.value
    })
    
    if (res.code === 0) {
      isLiked.value = res.data.isLiked
      if (isLiked.value) {
        videoData.value.like_count = (videoData.value.like_count || 0) + 1
      } else {
        videoData.value.like_count = Math.max(0, (videoData.value.like_count || 0) - 1)
      }
    }
  } catch (e) {
    console.error('点赞失败:', e)
    if (e.code === 401) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
    }
  }
}

const handleFavorite = async () => {
  try {
    const res = await callFunction('favorite', {
      action: 'toggle',
      videoId: videoId.value
    })
    
    if (res.code === 0) {
      isFavorited.value = res.data.isFavorited
    }
  } catch (e) {
    console.error('收藏失败:', e)
    if (e.code === 401) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
    }
  }
}

const handleDownload = () => {
  uni.showToast({
    title: '下载功能开发中',
    icon: 'none'
  })
}

onLoad((options) => {
  if (options.id) {
    videoId.value = options.id
    loadVideoDetail()
    checkLikeAndFavorite()
  }
})

onUnload(() => {
  const duration = (Date.now() - watchStartTime.value) / 1000
  if (duration > 3) {
    recordWatchHistory(duration)
  }
})
</script>

<style scoped>
.page-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(to bottom, #81D8D0, #7FFFD4);
  padding-bottom: calc(200rpx + env(safe-area-inset-bottom));
}

.content {
  position: relative;
  z-index: 1;
  padding-bottom: env(safe-area-inset-bottom);
}

.video-player-container {
  position: relative;
  width: 100%;
  background-color: #000;
  padding-top: env(safe-area-inset-top);
}

.video-player {
  width: 100%;
}

.video-info {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.info-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.info-meta {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: #6b7280;
  margin-right: 24rpx;
}

.meta-icon {
  width: 20rpx;
  height: 20rpx;
  margin-right: 8rpx;
  background-color: #9ca3af;
  border-radius: 50%;
}

.view-icon {
  background-color: #9ca3af;
}

.time-icon {
  background-color: #9ca3af;
}

.info-description {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
}

.action-bar {
  margin: 20rpx 24rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-text {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}

.action-text.active {
  color: #ff4d4f;
}

/* 点赞图标 - 心形 */
.like-icon {
  width: 48rpx;
  height: 48rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.like-icon .heart-shape {
  width: 24rpx;
  height: 24rpx;
  background-color: #9ca3af;
  transform: rotate(45deg);
  position: relative;
}

.like-icon .heart-shape::before,
.like-icon .heart-shape::after {
  content: '';
  width: 24rpx;
  height: 24rpx;
  background-color: #9ca3af;
  border-radius: 50%;
  position: absolute;
}

.like-icon .heart-shape::before {
  top: -12rpx;
  left: 0;
}

.like-icon .heart-shape::after {
  top: 0;
  left: -12rpx;
}

.like-icon.active .heart-shape,
.like-icon.active .heart-shape::before,
.like-icon.active .heart-shape::after {
  background-color: #ff4d4f;
}

/* 收藏图标 - 五角星 */
.favorite-icon {
  width: 48rpx;
  height: 48rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-icon .star-point {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  background-color: #9ca3af;
  border-radius: 50%;
  transform-origin: center;
}

.favorite-icon .star-point:nth-child(1) {
  top: 8rpx;
  left: 20rpx;
}

.favorite-icon .star-point:nth-child(2) {
  top: 16rpx;
  left: 8rpx;
}

.favorite-icon .star-point:nth-child(3) {
  top: 16rpx;
  right: 8rpx;
}

.favorite-icon .star-point:nth-child(4) {
  bottom: 8rpx;
  left: 12rpx;
}

.favorite-icon .star-point:nth-child(5) {
  bottom: 8rpx;
  right: 12rpx;
}

.favorite-icon.active .star-point {
  background-color: #faad14;
}

/* 下载图标 - 箭头 */
.download-icon {
  width: 48rpx;
  height: 48rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.download-icon .arrow-line {
  width: 24rpx;
  height: 2rpx;
  background-color: #9ca3af;
  position: absolute;
  bottom: 12rpx;
}

.download-icon .arrow-head {
  width: 12rpx;
  height: 12rpx;
  border-right: 2rpx solid #9ca3af;
  border-bottom: 2rpx solid #9ca3af;
  transform: rotate(45deg);
  position: absolute;
  bottom: 8rpx;
}
</style>
