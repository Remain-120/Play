'use strict';
const UniIdCommon = require('uni-id-common');
const uniId = new UniIdCommon({ context: { source: 'cloudfunction' } });
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { action, code, userInfo } = event;

  if (action === 'loginByWeixin') {
    try {
      // 1. 通过code获取微信用户信息（包括openid）
      const weixinRes = await uniCloud.getWeixinUserInfo({
        provider: 'weixin',
        code
      });

      if (weixinRes.errCode) {
        return {
          code: 400,
          message: '获取微信用户信息失败: ' + weixinRes.errMsg
        };
      }

      const { openId: openid } = weixinRes;

      if (!openid) {
        return {
          code: 400,
          message: '获取openid失败'
        };
      }

      // 2. 检查用户是否已存在
      const usersCollection = db.collection('users');
      
      let user = await usersCollection.doc(openid).get();

      let userId;
      const now = Date.now();
      
      if (!user.data || user.data.length === 0) {
        // 3. 创建新用户
        const newUser = {
          _id: openid,
          nickname: userInfo?.nickName || '微信用户',
          avatar: userInfo?.avatarUrl || '',
          createdAt: {
            $date: now
          },
          averageWatchTime: 0,
          totalWatchCount: 0,
          totalWatchTime: 0
        };
        
        const addResult = await usersCollection.add(newUser);
        userId = openid;
      } else {
        // 4. 已存在用户，更新信息
        userId = user.data[0]._id;
        const updateData = {};
        
        if (userInfo?.nickName && userInfo.nickName !== user.data[0].nickname) {
          updateData.nickname = userInfo.nickName;
        }
        
        if (userInfo?.avatarUrl && userInfo.avatarUrl !== user.data[0].avatar) {
          updateData.avatar = userInfo.avatarUrl;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = {
            $date: now
          };
          await usersCollection.doc(userId).update(updateData);
        }
      }

      // 5. 创建uni-id token
      const tokenResult = await uniId.createToken({
        uid: userId,
        role: ['user'],
        permission: []
      });

      if (!tokenResult.token) {
        return {
          code: 500,
          message: '生成token失败'
        };
      }

      // 6. 获取用户信息
      const currentUser = await usersCollection.doc(userId).get();
      const userData = currentUser.data[0] || {};

      // 7. 返回token和用户信息
      return {
        code: 0,
        message: '登录成功',
        data: {
          token: tokenResult.token,
          tokenExpired: tokenResult.tokenExpired,
          uid: userId,
          userInfo: {
            _id: userId,
            nickname: userData.nickname || userInfo?.nickName || '微信用户',
            avatar: userData.avatar || userInfo?.avatarUrl || ''
          }
        }
      };
    } catch (error) {
      console.error('微信登录失败:', error);
      return {
        code: 500,
        message: '微信登录失败: ' + error.message
      };
    }
  }

  return {
    code: 404,
    message: '未知操作'
  };
};