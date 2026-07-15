/**
 * 儿童友好内容处理工具
 * 专门为唐氏综合征儿童优化
 */

// 儿童安全关键词过滤
const UNSAFE_KEYWORDS = [
  '暴力', '恐怖', '血腥', '成人', '色情', '赌博', '毒品',
  '自杀', '自残', '仇恨', '歧视', '战争', '武器', '犯罪'
]

// 儿童友好关键词
const CHILD_FRIENDLY_KEYWORDS = [
  '学习', '教育', '音乐', '舞蹈', '故事', '动画', '游戏',
  '运动', '健康', '安全', '友谊', '爱心', '帮助', '分享',
  '创造', '想象', '探索', '发现', '成长', '快乐'
]

// 内容分类映射
const CATEGORY_MAP = {
  'educational': { 
    name: '教育学习', 
    emoji: '📚',
    description: '帮助孩子学习新知识',
    ageRange: '3+',
    learningGoals: ['认知', '语言', '逻辑']
  },
  'music': { 
    name: '音乐舞蹈', 
    emoji: '🎵',
    description: '培养音乐节奏感',
    ageRange: '2+',
    learningGoals: ['听觉', '节奏', '表达']
  },
  'story': { 
    name: '故事动画', 
    emoji: '📖',
    description: '有趣的动画故事',
    ageRange: '3+',
    learningGoals: ['语言', '想象', '情感']
  },
  'exercise': { 
    name: '运动游戏', 
    emoji: '🏃',
    description: '促进身体协调性',
    ageRange: '3+',
    learningGoals: ['运动', '协调', '健康']
  },
  'life': { 
    name: '生活技能', 
    emoji: '🧩',
    description: '学习日常生活技能',
    ageRange: '4+',
    learningGoals: ['自理', '社交', '安全']
  },
  'art': { 
    name: '艺术创作', 
    emoji: '🎨',
    description: '激发创造力',
    ageRange: '4+',
    learningGoals: ['创造', '审美', '精细动作']
  },
  'science': { 
    name: '科学探索', 
    emoji: '🔬',
    description: '探索科学奥秘',
    ageRange: '5+',
    learningGoals: ['观察', '思考', '探索']
  },
  'language': { 
    name: '语言学习', 
    emoji: '🗣️',
    description: '提高语言能力',
    ageRange: '3+',
    learningGoals: ['语言', '沟通', '表达']
  }
}

/**
 * 检查内容是否适合儿童
 * @param {Object} content - 内容对象
 * @returns {Object} 检查结果
 */
export const checkChildSafety = (content) => {
  const { title = '', description = '', tags = [] } = content
  
  const allText = `${title} ${description} ${tags.join(' ')}`.toLowerCase()
  
  // 检查不安全关键词
  const unsafeMatches = UNSAFE_KEYWORDS.filter(keyword => 
    allText.includes(keyword.toLowerCase())
  )
  
  // 检查儿童友好关键词
  const friendlyMatches = CHILD_FRIENDLY_KEYWORDS.filter(keyword =>
    allText.includes(keyword.toLowerCase())
  )
  
  const isSafe = unsafeMatches.length === 0
  const safetyScore = friendlyMatches.length * 10
  
  return {
    isSafe,
    unsafeKeywords: unsafeMatches,
    friendlyKeywords: friendlyMatches,
    safetyScore: Math.min(safetyScore, 100),
    recommendation: isSafe ? '适合儿童观看' : '建议家长审核'
  }
}

/**
 * 获取儿童友好的分类信息
 * @param {string} category - 分类标识
 * @returns {Object} 分类信息
 */
export const getChildFriendlyCategory = (category) => {
  return CATEGORY_MAP[category] || {
    name: '儿童视频',
    emoji: '🎬',
    description: '适合儿童观看的内容',
    ageRange: '3+',
    learningGoals: ['综合发展']
  }
}

/**
 * 根据年龄范围过滤内容
 * @param {Array} contents - 内容列表
 * @param {string} ageRange - 年龄范围，如 '3-6'
 * @returns {Array} 过滤后的内容
 */
export const filterByAgeRange = (contents, ageRange) => {
  const [minAge] = ageRange.split('-').map(Number)
  
  return contents.filter(content => {
    const categoryInfo = getChildFriendlyCategory(content.category)
    const categoryMinAge = parseInt(categoryInfo.ageRange)
    return categoryMinAge <= minAge
  })
}

/**
 * 计算内容的教育价值评分
 * @param {Object} content - 内容对象
 * @returns {number} 评分 (0-100)
 */
export const calculateEducationalValue = (content) => {
  let score = 50 // 基础分
  
  // 根据分类加分
  const categoryInfo = getChildFriendlyCategory(content.category)
  if (categoryInfo.learningGoals.length > 1) {
    score += 20
  }
  
  // 根据时长加分（适当时长更好）
  if (content.duration) {
    if (content.duration >= 60 && content.duration <= 600) { // 1-10分钟
      score += 20
    } else if (content.duration > 600) { // 太长扣分
      score -= 10
    }
  }
  
  // 有描述加分
  if (content.description && content.description.length > 10) {
    score += 10
  }
  
  // 有标签加分
  if (content.tags && content.tags.length > 0) {
    score += Math.min(content.tags.length * 5, 20)
  }
  
  return Math.min(Math.max(score, 0), 100)
}

/**
 * 生成学习进度报告
 * @param {Array} watchHistory - 观看历史
 * @returns {Object} 学习报告
 */
export const generateLearningReport = (watchHistory) => {
  const today = new Date().toDateString()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const todayHistory = watchHistory.filter(item => 
    new Date(item.timestamp).toDateString() === today
  )
  
  const weekHistory = watchHistory.filter(item => 
    new Date(item.timestamp) >= weekAgo
  )
  
  // 计算各类别观看时间
  const categoryTime = {}
  weekHistory.forEach(item => {
    const category = item.category || 'unknown'
    categoryTime[category] = (categoryTime[category] || 0) + (item.duration || 0)
  })
  
  // 找出最喜爱的类别
  let favoriteCategory = '未知'
  let maxTime = 0
  Object.entries(categoryTime).forEach(([category, time]) => {
    if (time > maxTime) {
      maxTime = time
      favoriteCategory = getChildFriendlyCategory(category).name
    }
  })
  
  // 计算总学习时间
  const totalStudyTime = weekHistory.reduce((sum, item) => sum + (item.duration || 0), 0)
  const todayStudyTime = todayHistory.reduce((sum, item) => sum + (item.duration || 0), 0)
  
  // 计算学习天数
  const studyDays = new Set(weekHistory.map(item => 
    new Date(item.timestamp).toDateString()
  )).size
  
  return {
    todayStudyTime: Math.round(todayStudyTime / 60), // 转换为分钟
    weekStudyTime: Math.round(totalStudyTime / 60),
    studyDays,
    favoriteCategory,
    categoryBreakdown: Object.entries(categoryTime).map(([category, time]) => ({
      category: getChildFriendlyCategory(category).name,
      time: Math.round(time / 60),
      percentage: Math.round((time / totalStudyTime) * 100) || 0
    })),
    recommendations: generateRecommendations(weekHistory)
  }
}

/**
 * 生成个性化推荐
 * @param {Array} watchHistory - 观看历史
 * @returns {Array} 推荐列表
 */
const generateRecommendations = (watchHistory) => {
  const recommendations = []
  
  // 分析观看模式
  const categories = watchHistory.map(item => item.category).filter(Boolean)
  const uniqueCategories = [...new Set(categories)]
  
  // 如果观看类别较少，推荐多样化
  if (uniqueCategories.length < 3) {
    const allCategories = Object.keys(CATEGORY_MAP)
    const missingCategories = allCategories.filter(cat => !uniqueCategories.includes(cat))
    
    if (missingCategories.length > 0) {
      recommendations.push({
        type: '多样化',
        message: '尝试不同类型的视频，促进全面发展',
        categories: missingCategories.slice(0, 2).map(cat => getChildFriendlyCategory(cat).name)
      })
    }
  }
  
  // 检查学习时间是否充足
  const totalTime = watchHistory.reduce((sum, item) => sum + (item.duration || 0), 0)
  if (totalTime < 1800) { // 少于30分钟
    recommendations.push({
      type: '时间',
      message: '建议每天观看30分钟以上的教育内容'
    })
  }
  
  return recommendations
}

/**
 * 简化文本，使其更适合儿童理解
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 简化后的文本
 */
export const simplifyTextForChildren = (text, maxLength = 100) => {
  if (!text) return ''
  
  // 移除复杂标点
  let simplified = text
    .replace(/[，。；：！？]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // 截断到合适长度
  if (simplified.length > maxLength) {
    simplified = simplified.substring(0, maxLength) + '...'
  }
  
  return simplified
}

export default {
  checkChildSafety,
  getChildFriendlyCategory,
  filterByAgeRange,
  calculateEducationalValue,
  generateLearningReport,
  simplifyTextForChildren
}