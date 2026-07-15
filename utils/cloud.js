const db = uniCloud.database()
const dbCmd = db.command

export { db, dbCmd }

export const callFunction = async (name, data = {}) => {
  try {
    const res = await uniCloud.callFunction({
      name,
      data
    })
    return res.result
  } catch (e) {
    console.error('云函数调用失败:', e)
    uni.showToast({
      title: '网络错误',
      icon: 'none'
    })
    throw e
  }
}

export const uploadFile = async (filePath) => {
  try {
    const res = await uniCloud.uploadFile({
      cloudPath: Date.now() + '-' + filePath.split('/').pop(),
      filePath
    })
    return res.fileID
  } catch (e) {
    console.error('文件上传失败:', e)
    uni.showToast({
      title: '上传失败',
      icon: 'none'
    })
    throw e
  }
}
