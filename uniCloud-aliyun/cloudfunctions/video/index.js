'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { uid } = context;

  switch (action) {
    case 'getList':
      return await getList(params);
    case 'search':
      return await search(params);
    case 'getDetail':
      return await getDetail(params);
    case 'addViewCount':
      return await addViewCount({ ...params, userId: uid });
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function getList({ page = 1, pageSize = 10, category }) {
  try {
    let query = db.collection('video');
    
    if (category) {
      query = query.where({ category });
    }
    
    const countResult = await query.count();
    const total = countResult.total;
    
    const skip = (page - 1) * pageSize;
    const listResult = await query
      .orderBy('create_time', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        list: listResult.data,
        total,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('getList error:', e);
    return { code: 500, message: '获取失败: ' + e.message };
  }
}

async function search({ keyword, page = 1, pageSize = 10 }) {
  try {
    if (!keyword) {
      return { code: 400, message: '搜索关键词不能为空' };
    }
    
    const skip = (page - 1) * pageSize;
    
    const collection = db.collection('video');
    
    const countResult = await collection
      .where(dbCmd.or([
        { title: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { category: new RegExp(keyword, 'i') }
      ]))
      .count();
    const total = countResult.total;
    
    const listResult = await collection
      .where(dbCmd.or([
        { title: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { category: new RegExp(keyword, 'i') }
      ]))
      .orderBy('create_time', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    
    return {
      code: 0,
      message: '搜索成功',
      data: {
        list: listResult.data,
        total,
        page,
        pageSize
      }
    };
  } catch (e) {
    console.error('search error:', e);
    return { code: 500, message: '搜索失败: ' + e.message };
  }
}

async function getDetail({ id }) {
  try {
    if (!id) {
      return { code: 400, message: '视频ID不能为空' };
    }
    
    const result = await db.collection('video').doc(id).get();
    
    if (!result.data || result.data.length === 0) {
      return { code: 404, message: '视频不存在' };
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: result.data[0]
    };
  } catch (e) {
    console.error('getDetail error:', e);
    return { code: 500, message: '获取失败: ' + e.message };
  }
}

async function addViewCount({ id, userId }) {
  try {
    if (!id) {
      return { code: 400, message: '视频ID不能为空' };
    }
    
    await db.collection('video').doc(id).update({
      view_count: dbCmd.inc(1)
    });
    
    return { code: 0, message: '更新成功' };
  } catch (e) {
    console.error('addViewCount error:', e);
    return { code: 500, message: '更新失败: ' + e.message };
  }
}
