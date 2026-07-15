<template>
  <view class="icon-wrapper" :style="wrapperStyle">
    <svg
      v-if="name === 'home'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 9.5L12 3L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z"
        :fill="fill1"
        stroke-linecap="butt"
      />
      <path
        d="M9 22V14H15V22"
        :fill="fill2"
        stroke-linecap="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'search'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        :stroke="fill1"
        stroke-width="2"
        :fill="theme === 'two-tone' ? fill2 : 'none'"
        stroke-linecap="butt"
      />
      <path
        d="M20.5 20.5L16.65 16.65"
        :stroke="fill1"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'stopwatch-start'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"
        :fill="fill1"
        stroke-linecap="butt"
      />
      <path
        d="M12 8V12L15 14"
        :stroke="fill2"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
      <path
        d="M9 1H15"
        :stroke="fill1"
        stroke-width="2"
        stroke-linecap="butt"
      />
      <path
        d="M12 1V3"
        :stroke="fill1"
        stroke-width="2"
        stroke-linecap="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'history'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
        :fill="fill1"
        stroke-linecap="butt"
      />
      <path
        d="M12 7V12L16 14"
        :stroke="fill2"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'time'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        :fill="fill1"
        stroke-linecap="butt"
      />
      <path
        d="M12 7V12L16 14"
        :stroke="fill2"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'like'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.84 4.61C20.3292 4.09832 19.7228 3.69286 19.0554 3.41676C18.3879 3.14065 17.6725 3 16.95 3C16.2275 3 15.5121 3.14065 14.8446 3.41676C14.1772 3.69286 13.5708 4.09832 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 3.00031 7.05 3.00031C5.59096 3.00031 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.55031 7.04096 1.55031 8.5C1.55031 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3517 11.8792 21.7571 11.2728 22.0332 10.6054C22.3093 9.93789 22.45 9.22251 22.45 8.5C22.45 7.77749 22.3093 7.06211 22.0332 6.39464C21.7571 5.72717 21.3517 5.12075 20.84 4.61V4.61Z"
        :fill="fill1"
        stroke-linecap="butt"
      />
      <path
        d="M12 21.23L4.22 13.45L3.16 12.39C2.1283 11.3583 1.55031 9.95903 1.55031 8.5C1.55031 7.04096 2.1283 5.64169 3.16 4.61C4.19169 3.57831 5.59096 3.00031 7.05 3.00031C8.50903 3.00031 9.9083 3.57831 10.94 4.61L12 5.67"
        :fill="fill2"
        stroke-linecap="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'video-one'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        :fill="fill1"
        stroke-linecap="butt"
      />
      <path
        d="M10 9L15 12L10 15V9Z"
        :fill="fill2"
        stroke-linecap="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'star'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        :fill="fill1"
        stroke-linecap="butt"
      />
    </svg>
    
    <svg
      v-else-if="name === 'download'"
      :class="['icon-svg', iconClass]"
      :style="iconStyle"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
        :stroke="fill1"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
      <path
        d="M7 10L12 15L17 10"
        :stroke="fill1"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
      <path
        d="M12 3V15"
        :stroke="fill1"
        stroke-width="2"
        stroke-linecap="butt"
        stroke-linejoin="butt"
      />
    </svg>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    default: 'outline',
    validator: (v) => ['outline', 'two-tone', 'filled'].includes(v)
  },
  size: {
    type: [Number, String],
    default: 48
  },
  fill: {
    type: [String, Array],
    default: '#333'
  },
  strokeLinecap: {
    type: String,
    default: 'butt'
  }
})

const wrapperStyle = computed(() => ({
  width: typeof props.size === 'number' ? `${props.size}rpx` : props.size,
  height: typeof props.size === 'number' ? `${props.size}rpx` : props.size
}))

const iconStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

const iconClass = computed(() => ({
  'icon-outline': props.theme === 'outline',
  'icon-two-tone': props.theme === 'two-tone',
  'icon-filled': props.theme === 'filled'
}))

const fill1 = computed(() => {
  if (Array.isArray(props.fill)) {
    return props.fill[0] || '#333'
  }
  return props.fill
})

const fill2 = computed(() => {
  if (Array.isArray(props.fill)) {
    return props.fill[1] || '#2ff0ff'
  }
  return '#2ff0ff'
})
</script>

<style scoped>
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-svg {
  display: block;
}
</style>
