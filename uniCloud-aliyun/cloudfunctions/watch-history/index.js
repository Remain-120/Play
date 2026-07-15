'use strict';
const db = uniCloud.database()
const dbCmd = db.command
const $ = dbCmd.aggregate

exports.main = async (event, context) => {
  const { action, ...params } = event
  const { uid } = context

  if (!uid) {
    return {
      code: 401,
      message: '请先登录'
    }
  }

  switch (action) {
    case 'record':
      return await recordWatch({ ...params, userId: uid })
    case 'getList':
      return await getWatchList({ ...params, userId: uid })
    case 'getStats':
      return await getWatchStats({ ...params, userId: uid })
    case 'delete':
      return await deleteHistory({ ...params, userId: uid })
    case 'clear':
      return await clearHistory({ ...params, userId: uid })
    default:
      return {
        code: 400,
        message: '未知操作'
      }
  }
}

async function recordWatch({ userId, videoId, duration = 0 }) {
  try {
    if (!videoId) {
      return {
        code: 400,
        message: '视频ID不能为空'
      }
    }

    const collection = db.collection('watchHistory')
    const existing = await collection.where({
      user_id: userId,
      video_id: videoId
    }).get()

    if (existing.data.length > 0) {
      const record = existing.data[0]
      await collection.doc(record._id).update({
        watch_duration: duration,
        total_duration: dbCmd.inc(duration),
        watch_count: dbCmd.inc(1),
        last_watch_time: Date.now()
      })
    } else {
      await collection.add({
        user_id: userId,
        video_id: videoId,
        watch_duration: duration,
        total_duration: duration,
        watch_count: 1,
        last_watch_time: Date.now()
      })
    }

    return {
      code: 0,
      message: '记录成功'
    }
  } catch (e) {
    console.error('recordWatch error:', e)
    return {
      code: 500,
      message: '记录失败'
    }
  }
}

async function getWatchList({ userId, page = 1, pageSize = 10 }) {
  try {
    const collection = db.collection('watchHistory')
    const histories = await collection
      .where({ user_id: userId })
      .orderBy('last_watch_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    if (histories.data.length === 0) {
      return {
        code: 0,
        message: '获取成功',
        data: {
          list: [],
          total: 0,
          page,
          pageSize
        }
      }
    }

    const videoIds = histories.data.map(item => item.video_id)
    const videos = await db.collection('videos')
      .where({
        _id: dbCmd.in(videoIds)
      })
      .get()

    const videoMap = {}
    videos.data.forEach(video => {
      videoMap[video._id] = video
    })

    const list = histories.data.map(history => ({
      ...history,
      video: videoMap[history.video_id] || null
    })).filter(item => item.video !== null)

    const countRes = await collection.where({ user_id: userId }).count()

    return {
      code: 0,
      message: '获取成功',
      data: {
        list,
        total: countRes.total,
        page,
        pageSize
      }
    }
  } catch (e) {
    console.error('getWatchList error:', e)
    return {
      code: 500,
      message: '获取失败'
    }
  }
}

async function getWatchStats({ userId }) {
  try {
    const collection = db.collection('watchHistory')
    const histories = await collection.where({ user_id: userId }).get()

    let totalDuration = 0
    let videoCount = 0

    histories.data.forEach(item => {
      totalDuration += item.total_duration || 0
      videoCount++
    })

    return {
      code: 0,
      message: '获取成功',
      data: {
        totalDuration,
        videoCount
      }
    }
  } catch (e) {
    console.error('getWatchStats error:', e)
    return {
      code: 500,
      message: '获取失败'
    }
  }
}

async function deleteHistory({ userId, id }) {
  try {
    if (!id) {
      return {
        code: 400,
        message: '记录ID不能为空'
      }
    }

    await db.collection('watchHistory').doc(id).remove()

    return {
      code: 0,
      message: '删除成功'
    }
  } catch (e) {
    console.error('deleteHistory error:', e)
    return {
      code: 500,
      message: '删除失败'
    }
  }
}

async function clearHistory({ userId }) {
  try {
    const records = await db.collection('watchHistory')
      .where({ user_id: userId })
      .get()

    const deletePromises = records.data.map(record => 
      db.collection('watchHistory').doc(record._id).remove()
    )

    await Promise.all(deletePromises)

    return {
      code: 0,
      message: '清空成功'
    }
  } catch (e) {
    console.error('clearHistory error:', e)
    return {
      code: 500,
      message: '清空失败'
    }
  }
}
