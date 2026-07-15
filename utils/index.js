export * from './cloud.js'
export * from './storage.js'
export * from './child-friendly.js'
export * from './accessibility.js'
export { perfMonitor } from './performance.js'
export { default as Performance } from './performance.js'
export * from './child-safety.js'

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  } else if (diff < 604800000) {
    return Math.floor(diff / 86400000) + '天前'
  } else {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }
}

export const debounce = (func, wait) => {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const getAccessibilityLevel = () => {
  return {
    highContrast: true,
    largeText: true,
    simpleNavigation: true
  }
}

import { checkChildSafety, filterByAgeRange, calculateEducationalValue } from './child-friendly.js'

export const isChildFriendlyContent = (content) => {
  const result = checkChildSafety(content)
  return result.isSafe && result.safetyScore >= 60
}

export const getRecommendedContent = (contents, childAge = '3-6') => {
  let filtered = filterByAgeRange(contents, childAge)
  filtered = filtered.filter(isChildFriendlyContent)
  filtered.sort((a, b) => {
    const scoreA = calculateEducationalValue(a)
    const scoreB = calculateEducationalValue(b)
    return scoreB - scoreA
  })
  return filtered
}
