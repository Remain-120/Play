export const setStorage = (key, value) => {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    console.error('存储失败:', e)
  }
}

export const getStorage = (key) => {
  try {
    return uni.getStorageSync(key)
  } catch (e) {
    console.error('获取存储失败:', e)
    return null
  }
}

export const removeStorage = (key) => {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error('删除存储失败:', e)
  }
}

export const clearStorage = () => {
  try {
    uni.clearStorageSync()
  } catch (e) {
    console.error('清空存储失败:', e)
  }
}
