<template>
  <view class="page-container">
    <!-- 顶部导航栏 - 儿童友好设计 -->
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <view class="app-brand">
          <image class="app-logo" src="/static/logo.png" mode="aspectFit" />
          <text class="app-name">我的空间</text>
        </view>
        
        <view class="nav-decoration">
          <view class="deco-star">⭐</view>
          <view class="deco-heart">❤️</view>
        </view>
      </view>
    </view>
    
    <!-- 用户信息卡片 - 儿童友好设计 -->
    <view class="user-info-section" v-if="userInfo">
      <view class="user-card">
        <view class="user-avatar-container">
          <image class="user-avatar" :src="userInfo.avatar || userInfo.avatar_url || '/static/logo.png'" mode="aspectFill" />
          <view class="avatar-ring"></view>
        </view>
        <text class="user-name">{{ userInfo.nickname || userInfo.nick_name || '微信用户' }}</text>
        <view class="user-badge">
          <text class="badge-text">🎉 小小探险家</text>
        </view>
        
        <!-- 统计信息卡片 -->
        <view class="stats-container">
          <view class="stat-card">
            <view class="stat-icon">📺</view>
            <text class="stat-value">{{ stats.videoCount || 0 }}</text>
            <text class="stat-label">观看视频</text>
          </view>
          
          <view class="stat-divider">
            <view class="divider-line"></view>
          </view>
          
          <view class="stat-card">
            <view class="stat-icon">⏱️</view>
            <text class="stat-value">{{ formatTime(stats.totalDuration || 0) }}</text>
            <text class="stat-label">观看时长</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 登录提示卡片 - 儿童友好设计 -->
    <view class="login-section" v-else>
      <view class="login-card" @click="handleLogin" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <view class="login-header">
          <view class="login-avatar-placeholder">
            <view class="placeholder-icon">👤</view>
          </view>
          <view class="login-welcome">
            <text class="welcome-title">欢迎回来！</text>
            <text class="welcome-subtitle">登录后查看你的精彩记录</text>
          </view>
        </view>
        
        <view class="login-button">
          <text class="button-text">🚀 点击登录</text>
          <view class="button-arrow">→</view>
        </view>
      </view>
    </view>
    
    <!-- 标签栏 - 儿童友好设计 -->
    <view class="profile-tabs" v-if="userInfo">
      <view class="tab-container">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'favorites' }" 
          @click="switchTab('favorites')"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <view class="tab-icon-wrapper favorites">
            <text class="tab-emoji">⭐</text>
          </view>
          <text class="tab-text">我的收藏</text>
          <view class="tab-indicator" v-if="activeTab === 'favorites'"></view>
        </view>
        
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'history' }" 
          @click="switchTab('history')"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <view class="tab-icon-wrapper history">
            <text class="tab-emoji">🕐</text>
          </view>
          <text class="tab-text">观看历史</text>
          <view class="tab-indicator" v-if="activeTab === 'history'"></view>
        </view>
      </view>
    </view>
    
    <!-- 内容区域 -->
    <scroll-view scroll-y class="content-scroll" v-if="userInfo && activeTab === 'favorites'">
      <view class="content-container">
        <view class="empty-state" v-if="favorites.length === 0 && !isLoading">
          <view class="empty-icon-wrapper">
            <text class="empty-emoji">🌟</text>
          </view>
          <text class="empty-title">还没有收藏哦~</text>
          <text class="empty-subtitle">快去发现喜欢的视频吧！</text>
          <view class="empty-action" @click="goToHome">
            <text class="action-text">去探索 →</text>
          </view>
        </view>
        
        <view class="loading-state" v-else-if="isLoading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <view class="favorites-list" v-else>
          <VideoCard 
            v-for="item in favorites" 
            :key="item._id"
            :data="item"
            @click="goToVideo(item)"
          />
        </view>
      </view>
    </scroll-view>
    
    <scroll-view scroll-y class="content-scroll" v-if="userInfo && activeTab === 'history'">
      <view class="content-container">
        <view class="empty-state" v-if="history.length === 0 && !isLoading">
          <view class="empty-icon-wrapper">
            <text class="empty-emoji">📺</text>
          </view>
          <text class="empty-title">暂无观看历史</text>
          <text class="empty-subtitle">开始观看视频后这里会显示哦！</text>
          <view class="empty-action" @click="goToHome">
            <text class="action-text">去观看 →</text>
          </view>
        </view>
        
        <view class="loading-state" v-else-if="isLoading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <view class="history-list" v-else>
          <VideoCard 
            v-for="item in history" 
            :key="item._id"
            :data="item"
            @click="goToVideo(item)"
          />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/video-card/VideoCard.vue'
import { callFunction, formatTime } from '@/utils/index.js'

const userInfo = ref(null)
const stats = ref({
  totalDuration: 0,
  videoCount: 0
})
const activeTab = ref('favorites')
const favorites = ref([])
const history = ref([])
const isLoading = ref(false)

const loadUserInfo = () => {
  const user = uni.getStorageSync('userInfo')
  if (user) {
    userInfo.value = user
    loadStats()
    loadFavorites()
    loadHistory()
  }
}

const loadStats = async () => {
  try {
    const res = await callFunction('watch-history', {
      action: 'getStats'
    })
    
    if (res.code === 0) {
      stats.value = {
        totalDuration: res.data.totalDuration || 0,
        videoCount: res.data.videoCount || 0
      }
    }
  } catch (e) {
    console.error('获取统计失败:', e)
  }
}

const loadFavorites = async () => {
  isLoading.value = true
  try {
    const res = await callFunction('favorite', {
      action: 'getList',
      page: 1,
      pageSize: 20
    })
    
    if (res.code === 0) {
      favorites.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载收藏失败:', e)
  } finally {
    isLoading.value = false
  }
}

const loadHistory = async () => {
  isLoading.value = true
  try {
    const res = await callFunction('watch-history', {
      action: 'getList',
      page: 1,
      pageSize: 20
    })
    
    if (res.code === 0) {
      history.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载历史失败:', e)
  } finally {
    isLoading.value = false
  }
}

const handleLogin = () => {
  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      const code = loginRes.code
      
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: async (profileRes) => {
          const userInfoData = profileRes.userInfo
          
          try {
            const loginResult = await callFunction('auth', {
              action: 'loginByWeixin',
              code: code,
              userInfo: {
                nickName: userInfoData.nickName,
                avatarUrl: userInfoData.avatarUrl
              }
            })
            
            if (loginResult.code === 0) {
              if (loginResult.data.token) {
                uni.setStorageSync('uni_id_token', loginResult.data.token)
                uni.setStorageSync('uni_id_token_expired', loginResult.data.tokenExpired)
              }
              
              const user = {
                nickname: loginResult.data.userInfo.nickname || userInfoData.nickName,
                avatar: loginResult.data.userInfo.avatar || userInfoData.avatarUrl,
                _id: loginResult.data.uid
              }
              userInfo.value = user
              uni.setStorageSync('userInfo', user)
              
              uni.showToast({
                title: '登录成功',
                icon: 'success'
              })
              
              loadStats()
              loadFavorites()
              loadHistory()
            } else {
              uni.showToast({
                title: loginResult.message || '登录失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('调用登录云函数失败:', error)
            uni.showToast({
              title: '登录失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err)
          uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
        }
      })
    },
    fail: (err) => {
      console.error('微信登录失败:', err)
      uni.showToast({
        title: '微信登录失败',
        icon: 'none'
      })
    }
  })
}

const switchTab = (tab) => {
  activeTab.value = tab
  
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
}

const goToVideo = (item) => {
  if (uni.canIUse('vibrate')) {
    uni.vibrateShort()
  }
  
  uni.navigateTo({
    url: `/pages/video/video?id=${item._id || item.video_id}`
  })
}

const goToHome = () => {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

const onTouchStart = () => {
}

const onTouchEnd = () => {
}

onMounted(() => {
  loadUserInfo()
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

.app-brand { display: flex; align-items: center; gap: 14rpx; }

.app-logo { width: 52rpx; height: 52rpx; border-radius: 14rpx; }

.app-name { font-size: 34rpx; font-weight: 600; color: #1a1a1a; }

.user-info-section { padding: 28rpx; position: relative; z-index: 1; }

.user-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 28rpx 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar-container {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.user-avatar { width: 100%; height: 100%; }

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12rpx;
  text-align: center;
}

.user-badge {
  padding: 10rpx 24rpx;
  background: #f7f7f7;
  border-radius: 20rpx;
  margin-bottom: 28rpx;
}

.badge-text { font-size: 24rpx; font-weight: 500; color: #666; }

.stats-container {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: stretch;
  gap: 20rpx;
  background: #fafafa;
  border-radius: 16rpx;
  padding: 20rpx;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.stat-icon { font-size: 36rpx; margin-bottom: 4rpx; }

.stat-value { font-size: 36rpx; font-weight: 600; color: #1a1a1a; }

.stat-label { font-size: 22rpx; color: #999; font-weight: 400; }

.stat-divider { display: flex; align-items: center; padding: 0 6rpx; }

.divider-line { width: 1rpx; height: 64rpx; background: #eee; border-radius: 1rpx; }

.login-section {
  padding: 48rpx 28rpx;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 480rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 28rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.login-card:active { transform: scale(0.98); }

.login-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 28rpx; }

.login-avatar-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.placeholder-icon { font-size: 48rpx; color: #ccc; }

.login-welcome { text-align: center; }

.welcome-title { font-size: 30rpx; font-weight: 600; color: #1a1a1a; display: block; margin-bottom: 8rpx; }

.welcome-subtitle { font-size: 24rpx; color: #999; font-weight: 400; }

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 22rpx 28rpx;
  background: #1a1a1a;
  border-radius: 44rpx;
  transition: all 0.25s ease;
}

.login-card:active .login-button { opacity: 0.85; }

.button-text { font-size: 28rpx; font-weight: 500; color: #fff; }

.button-arrow { font-size: 26rpx; color: #fff; }

.profile-tabs {
  background: #ffffff;
  margin: 0 28rpx;
  border-radius: 18rpx;
  padding: 10rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 1;
}

.tab-container {
  display: flex;
  height: 96rpx;
  border-radius: 14rpx;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14rpx 0;
  border-radius: 14rpx;
  transition: all 0.25s ease;
  position: relative;
}

.tab-item.active { background: #1a1a1a; }
.tab-item:active { transform: scale(0.95); }

.tab-icon-wrapper {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6rpx;
}

.tab-icon-wrapper.favorites { background-color: #f5f5f5; }
.tab-icon-wrapper.history { background-color: #f5f5f5; }
.tab-item.active .tab-icon-wrapper { background-color: rgba(255,255,255,0.15); }

.tab-emoji { font-size: 30rpx; }

.tab-text { font-size: 24rpx; font-weight: 500; color: #999; transition: all 0.25s ease; }
.tab-item.active .tab-text { color: #fff; }

.content-scroll { flex: 1; height: 0; position: relative; z-index: 1; }
.content-container { padding: 20rpx 28rpx 36rpx; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 28rpx;
  text-align: center;
}

.empty-icon-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.empty-emoji { font-size: 56rpx; }

.empty-title { font-size: 28rpx; font-weight: 500; color: #333; margin-bottom: 10rpx; display: block; }

.empty-subtitle { font-size: 24rpx; color: #999; font-weight: 400; margin-bottom: 28rpx; display: block; }

.empty-action {
  padding: 18rpx 36rpx;
  background: #1a1a1a;
  border-radius: 40rpx;
  transition: all 0.25s ease;
}
.empty-action:active { opacity: 0.85; }

.action-text { font-size: 26rpx; font-weight: 500; color: #fff; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  gap: 20rpx;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 3rpx solid #eee;
  border-top-color: #999;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text { font-size: 24rpx; color: #999; font-weight: 400; }

.favorites-list,
.history-list { display: flex; flex-direction: column; gap: 20rpx; }
</style>