'use strict';
const db = uniCloud.database()
const dbCmd = db.command

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
    case 'toggle':
      return await toggleLike({ ...params, userId: uid })
    case 'check':
      return await checkLike({ ...params, userId: uid })
    case 'getList':
      return await getLikeList({ ...params, userId: uid })
    default:
      return {
        code: 400,
        message: '未知操作'
      }
  }
}

async function toggleLike({ userId, videoId }) {
  try {
    if (!videoId) {
      return {
        code: 400,
        message: '视频ID不能为空'
      }
    }

    const collection = db.collection('likes')
    const existing = await collection.where({
      userId: userId,
      videoId: videoId
    }).get()

    let isLiked = false

    if (existing.data.length > 0) {
      await collection.doc(existing.data[0]._id).remove()
      await updateVideoLikeCount(videoId, -1)
      isLiked = false
    } else {
      await collection.add({
        userId: userId,
        videoId: videoId
      })
      await updateVideoLikeCount(videoId, 1)
      isLiked = true
    }

    return {
      code: 0,
      message: isLiked ? '点赞成功' : '取消点赞',
      data: {
        isLiked
      }
    }
  } catch (e) {
    console.error('toggleLike error:', e)
    return {
      code: 500,
      message: '操作失败'
    }
  }
}

async function checkLike({ userId, videoId }) {
  try {
    if (!videoId) {
      return {
        code: 400,
        message: '视频ID不能为空'
      }
    }

    const res = await db.collection('likes').where({
      userId: userId,
      videoId: videoId
    }).get()

    return {
      code: 0,
      message: '获取成功',
      data: {
        isLiked: res.data.length > 0
      }
    }
  } catch (e) {
    console.error('checkLike error:', e)
    return {
      code: 500,
      message: '获取失败'
    }
  }
}

async function getLikeList({ userId, page = 1, pageSize = 10 }) {
  try {
    const collection = db.collection('likes')
    const likes = await collection
      .where({ userId: userId })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    if (likes.data.length === 0) {
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

    const videoIds = likes.data.map(item => item.videoId)
    const videos = await db.collection('videos')
      .where({
        _id: dbCmd.in(videoIds)
      })
      .get()

    const videoMap = {}
    videos.data.forEach(video => {
      videoMap[video._id] = video
    })

    const list = likes.data.map(like => ({
      ...like,
      video: videoMap[like.videoId] || null
    })).filter(item => item.video !== null)

    const countRes = await collection.where({ userId: userId }).count()

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
    console.error('getLikeList error:', e)
    return {
      code: 500,
      message: '获取失败'
    }
  }
}

async function updateVideoLikeCount(videoId, delta) {
  try {
    await db.collection('videos').doc(videoId).update({
      likeCount: dbCmd.inc(delta)
    })
  } catch (e) {
    console.error('updateVideoLikeCount error:', e)
  }
}
