<template>
  <view 
    class="video-card" 
    @click="handleClick"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    :class="{ 'card-active': isTouching }"
  >
    <view class="thumbnail-container">
      <image class="thumbnail-image" :src="data.cover_url" mode="aspectFill" />
      
      <view class="play-overlay">
        <view class="play-circle">
          <text class="play-icon">▶</text>
        </view>
      </view>
      
      <view class="duration-badge" v-if="data.duration">
        <text class="duration-text">{{ formatDuration }}</text>
      </view>
    </view>
    
    <view class="info-container">
      <text class="video-title">{{ data.title }}</text>
      <text class="video-description">{{ data.description || '适合儿童观看的内容' }}</text>
      
      <view class="meta-row">
        <view class="author-info">
          <image class="avatar-image" :src="data.author_avatar || '/static/logo.png'" mode="aspectFill" />
          <text class="author-name">{{ data.author_name || 'VidFlow' }}</text>
        </view>
        
        <view class="age-tag" v-if="data.age_range">
          <text class="age-text">{{ data.age_range }}+</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatTime } from '@/utils/index.js'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const isTouching = ref(false)

const formatDuration = computed(() => {
  if (props.data.duration) {
    return formatTime(props.data.duration)
  }
  return ''
})

const onTouchStart = () => {
  isTouching.value = true
}

const onTouchEnd = () => {
  isTouching.value = false
}

const handleClick = () => {
  emit('click', props.data)
}
</script>

<style scoped>
.video-card {
  width: 710rpx;
  background-color: #ffffff;
  margin: 24rpx auto;
  overflow: hidden;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.06);
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.video-card.card-active {
  transform: scale(0.98);
  box-shadow: 0 8rpx 48rpx rgba(0, 0, 0, 0.1);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 400rpx;
  overflow: hidden;
  background-color: #f5f5f5;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease;
  object-fit: cover;
}

.video-card.card-active .thumbnail-image {
  transform: scale(1.04);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.08);
  transition: background 0.35s ease;
}

.video-card.card-active .play-overlay {
  background: rgba(0, 0, 0, 0.15);
}

.play-circle {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10rpx);
  transition: all 0.35s ease;
}

.video-card.card-active .play-circle {
  transform: scale(1.08);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.18);
}

.play-icon {
  font-size: 30rpx;
  color: #333;
  margin-left: 6rpx;
}

.duration-badge {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
  backdrop-filter: blur(16rpx);
}

.duration-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5rpx;
}

.info-container {
  padding: 28rpx 28rpx 32rpx;
}

.video-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.45;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  letter-spacing: 0.3rpx;
}

.video-description {
  font-size: 24rpx;
  color: #999;
  line-height: 1.4;
  margin-bottom: 20rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.avatar-image {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
}

.author-name {
  font-size: 24rpx;
  color: #888;
  font-weight: 500;
}

.age-tag {
  background: #f0f0f0;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.age-text {
  font-size: 22rpx;
  color: #666;
  font-weight: 600;
}
</style>