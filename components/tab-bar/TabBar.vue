<template>
  <view class="tab-bar">
    <view 
      v-for="(item, index) in tabList" 
      :key="index"
      class="tab-item"
      :class="{ active: currentIndex === index }"
      @click="handleTabClick(index, item)"
    >
      <Icon 
        :name="item.icon" 
        :theme="currentIndex === index ? 'two-tone' : 'outline'" 
        :size="48" 
        :fill="currentIndex === index ? ['#333', '#2ff0ff'] : '#999'" 
      />
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'

const props = defineProps({
  current: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change'])

const currentIndex = ref(props.current)

const tabList = [
  {
    icon: 'home',
    text: '首页',
    pagePath: '/pages/index/index'
  },
  {
    icon: 'search',
    text: '搜索',
    pagePath: '/pages/search/search'
  },
  {
    icon: 'stopwatch-start',
    text: '我的',
    pagePath: '/pages/user/user'
  }
]

const handleTabClick = (index, item) => {
  currentIndex.value = index
  emit('change', index, item)
  
  uni.switchTab({
    url: item.pagePath
  })
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  padding-bottom: 0rpx;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-top: 8rpx;
}

.tab-item.active .tab-text {
  color: #2ff0ff;
  font-weight: 500;
}

.tab-text {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}
</style>
