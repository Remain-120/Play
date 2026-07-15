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
      return await toggleFavorite({ ...params, userId: uid })
    case 'check':
      return await checkFavorite({ ...params, userId: uid })
    case 'getList':
      return await getFavoriteList({ ...params, userId: uid })
    default:
      return {
        code: 400,
        message: '未知操作'
      }
  }
}

async function toggleFavorite({ userId, videoId }) {
  try {
    if (!videoId) {
      return {
        code: 400,
        message: '视频ID不能为空'
      }
    }

    const collection = db.collection('favorites')
    const existing = await collection.where({
      user_id: userId,
      video_id: videoId
    }).get()

    let isFavorited = false

    if (existing.data.length > 0) {
      await collection.doc(existing.data[0]._id).remove()
      isFavorited = false
    } else {
      await collection.add({
        user_id: userId,
        video_id: videoId
      })
      isFavorited = true
    }

    return {
      code: 0,
      message: isFavorited ? '收藏成功' : '取消收藏',
      data: {
        isFavorited
      }
    }
  } catch (e) {
    console.error('toggleFavorite error:', e)
    return {
      code: 500,
      message: '操作失败'
    }
  }
}

async function checkFavorite({ userId, videoId }) {
  try {
    if (!videoId) {
      return {
        code: 400,
        message: '视频ID不能为空'
      }
    }

    const res = await db.collection('favorites').where({
      user_id: userId,
      video_id: videoId
    }).get()

    return {
      code: 0,
      message: '获取成功',
      data: {
        isFavorited: res.data.length > 0
      }
    }
  } catch (e) {
    console.error('checkFavorite error:', e)
    return {
      code: 500,
      message: '获取失败'
    }
  }
}

async function getFavoriteList({ userId, page = 1, pageSize = 10 }) {
  try {
    const collection = db.collection('favorites')
    const favorites = await collection
      .where({ user_id: userId })
      .orderBy('create_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    if (favorites.data.length === 0) {
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

    const videoIds = favorites.data.map(item => item.video_id)
    const videos = await db.collection('videos')
      .where({
        _id: dbCmd.in(videoIds)
      })
      .get()

    const videoMap = {}
    videos.data.forEach(video => {
      videoMap[video._id] = video
    })

    const list = favorites.data.map(fav => ({
      ...fav,
      video: videoMap[fav.video_id] || null
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
    console.error('getFavoriteList error:', e)
    return {
      code: 500,
      message: '获取失败'
    }
  }
}
