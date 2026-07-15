/**
 * 儿童安全增强工具
 * 为特殊儿童提供更安全的内容过滤和保护
 */

// 环境检测
const isMiniProgram = typeof uni !== 'undefined';
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// 存储工具函数
const storage = {
  setItem: (key, value) => {
    if (isMiniProgram) {
      try {
        uni.setStorageSync(key, value);
      } catch (e) {
        console.warn('存储数据失败:', e);
      }
    } else if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('存储数据失败:', e);
      }
    }
  },
  getItem: (key) => {
    if (isMiniProgram) {
      try {
        return uni.getStorageSync(key);
      } catch (e) {
        console.warn('获取数据失败:', e);
        return null;
      }
    } else if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('获取数据失败:', e);
        return null;
      }
    }
    return null;
  }
};

// 安全配置
const SAFETY_CONFIG = {
  enabled: true,
  strictMode: true, // 严格模式
  realTimeFiltering: true, // 实时过滤
  ageBasedFiltering: true, // 基于年龄的过滤
  learningMode: true // 学习模式
};

// 不安全关键词库
const UNSAFE_KEYWORDS = {
  violence: ['暴力', '打架', '武器', '战争', '杀人', '伤害', '血腥', '恐怖'],
  adult: ['成人', '色情', '性感', '裸露', '性', '情色', '淫秽'],
  gambling: ['赌博', '赌场', '彩票', '下注', '赌钱'],
  drugs: ['毒品', '吸毒', '大麻', '可卡因', '海洛因'],
  selfHarm: ['自杀', '自残', '抑郁', '焦虑', '绝望'],
  hate: ['仇恨', '歧视', '种族主义', '性别歧视', '欺凌'],
  inappropriate: ['脏话', '骂人', '侮辱', '诅咒', '粗口']
};

// 年龄分级配置
const AGE_RATINGS = {
  '0-2': {
    name: '婴幼儿',
    allowedCategories: ['music', 'simple_animation', 'colors', 'shapes'],
    maxDuration: 10, // 分钟
    educationalFocus: ['sensory', 'motor', 'language_basic']
  },
  '3-6': {
    name: '学龄前儿童',
    allowedCategories: ['educational', 'music', 'story', 'exercise', 'art', 'life'],
    maxDuration: 20,
    educationalFocus: ['cognitive', 'social', 'language', 'creativity']
  },
  '7-12': {
    name: '小学生',
    allowedCategories: ['educational', 'science', 'history', 'math', 'language', 'art', 'sports'],
    maxDuration: 30,
    educationalFocus: ['academic', 'critical_thinking', 'problem_solving']
  }
};

// 内容分类映射
const CONTENT_CATEGORIES = {
  educational: {
    name: '教育学习',
    safetyLevel: 'high',
    ageRange: '3+',
    educationalValue: 90
  },
  music: {
    name: '音乐舞蹈',
    safetyLevel: 'high',
    ageRange: '0+',
    educationalValue: 70
  },
  story: {
    name: '故事动画',
    safetyLevel: 'medium',
    ageRange: '3+',
    educationalValue: 80
  },
  exercise: {
    name: '运动游戏',
    safetyLevel: 'high',
    ageRange: '3+',
    educationalValue: 85
  },
  science: {
    name: '科学探索',
    safetyLevel: 'high',
    ageRange: '7+',
    educationalValue: 95
  },
  art: {
    name: '艺术创作',
    safetyLevel: 'high',
    ageRange: '3+',
    educationalValue: 75
  }
};

// 安全分析类
class SafetyAnalyzer {
  constructor() {
    this.safetyCache = new Map();
    this.init();
  }
  
  init() {
    console.log('儿童安全分析器初始化');
  }
  
  // 分析文本内容安全性
  analyzeText(text, ageGroup = '3-6') {
    if (!text || typeof text !== 'string') {
      return this.createSafetyResult(true, 100, '无文本内容');
    }
    
    const cacheKey = `text:${text}:${ageGroup}`;
    if (this.safetyCache.has(cacheKey)) {
      return this.safetyCache.get(cacheKey);
    }
    
    let safetyScore = 100;
    const warnings = [];
    const violations = [];
    
    // 检查不安全关键词
    Object.entries(UNSAFE_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          safetyScore -= 10;
          violations.push({
            category,
            keyword,
            severity: 'high'
          });
        }
      });
    });
    
    // 检查年龄适宜性
    const ageConfig = AGE_RATINGS[ageGroup];
    if (ageConfig) {
      // 检查内容复杂度
      const wordCount = text.split(/\s+/).length;
      const sentenceCount = text.split(/[.!?。！？]/).length;
      
      if (wordCount > 100 && ageGroup === '0-2') {
        safetyScore -= 5;
        warnings.push({
          type: 'complexity',
          message: '内容对婴幼儿可能过于复杂',
          severity: 'medium'
        });
      }
    }
    
    // 检查教育价值
    const educationalValue = this.calculateEducationalValue(text);
    if (educationalValue < 30) {
      safetyScore -= 5;
      warnings.push({
        type: 'educational_value',
        message: '教育价值较低',
        severity: 'low'
      });
    }
    
    // 确保分数在0-100之间
    safetyScore = Math.max(0, Math.min(100, safetyScore));
    
    const result = this.createSafetyResult(
      safetyScore >= 60,
      safetyScore,
      safetyScore >= 60 ? '内容安全' : '内容不安全',
      warnings,
      violations
    );
    
    // 缓存结果
    this.safetyCache.set(cacheKey, result);
    
    return result;
  }
  
  // 分析视频内容安全性
  async analyzeVideo(videoData, ageGroup = '3-6') {
    const cacheKey = `video:${videoData.id || videoData.url}:${ageGroup}`;
    if (this.safetyCache.has(cacheKey)) {
      return this.safetyCache.get(cacheKey);
    }
    
    let safetyScore = 100;
    const warnings = [];
    const violations = [];
    
    // 分析标题
    if (videoData.title) {
      const titleAnalysis = this.analyzeText(videoData.title, ageGroup);
      safetyScore = Math.min(safetyScore, titleAnalysis.safetyScore);
      warnings.push(...titleAnalysis.warnings);
      violations.push(...titleAnalysis.violations);
    }
    
    // 分析描述
    if (videoData.description) {
      const descAnalysis = this.analyzeText(videoData.description, ageGroup);
      safetyScore = Math.min(safetyScore, descAnalysis.safetyScore);
      warnings.push(...descAnalysis.warnings);
      violations.push(...descAnalysis.violations);
    }
    
    // 分析标签
    if (videoData.tags && Array.isArray(videoData.tags)) {
      videoData.tags.forEach(tag => {
        const tagAnalysis = this.analyzeText(tag, ageGroup);
        safetyScore = Math.min(safetyScore, tagAnalysis.safetyScore);
      });
    }
    
    // 检查视频时长
    if (videoData.duration) {
      const ageConfig = AGE_RATINGS[ageGroup];
      if (ageConfig && videoData.duration > ageConfig.maxDuration * 60) {
        safetyScore -= 5;
        warnings.push({
          type: 'duration',
          message: `视频时长超过${ageGroup}年龄组推荐时长`,
          severity: 'medium'
        });
      }
    }
    
    // 检查内容分类
    if (videoData.category) {
      const categoryInfo = CONTENT_CATEGORIES[videoData.category];
      if (categoryInfo) {
        // 检查年龄适宜性
        const minAge = parseInt(categoryInfo.ageRange);
        const childAge = parseInt(ageGroup.split('-')[0]);
        
        if (minAge > childAge) {
          safetyScore -= 15;
          violations.push({
            category: 'age_inappropriate',
            message: `内容适合${categoryInfo.ageRange}+，当前儿童年龄${ageGroup}`,
            severity: 'high'
          });
        }
      }
    }
    
    // 确保分数在0-100之间
    safetyScore = Math.max(0, Math.min(100, safetyScore));
    
    const result = this.createSafetyResult(
      safetyScore >= 60,
      safetyScore,
      safetyScore >= 60 ? '视频内容安全' : '视频内容不安全',
      warnings,
      violations
    );
    
    // 缓存结果
    this.safetyCache.set(cacheKey, result);
    
    return result;
  }
  
  // 计算教育价值
  calculateEducationalValue(text) {
    if (!text) return 0;
    
    let score = 50; // 基础分
    
    // 教育相关关键词加分
    const educationalKeywords = [
      '学习', '教育', '知识', '科学', '数学', '语文', '英语',
      '历史', '地理', '物理', '化学', '生物', '艺术', '音乐',
      '运动', '健康', '安全', '礼貌', '分享', '合作', '创造'
    ];
    
    educationalKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 2;
      }
    });
    
    // 文本长度适中加分
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) {
      score += 10;
    }
    
    // 句子结构完整加分
    const sentenceCount = text.split(/[.!?。！？]/).length;
    if (sentenceCount >= 3) {
      score += 5;
    }
    
    return Math.min(100, score);
  }
  
  createSafetyResult(isSafe, safetyScore, message, warnings = [], violations = []) {
    return {
      isSafe,
      safetyScore,
      message,
      warnings,
      violations,
      timestamp: Date.now(),
      recommendations: this.generateRecommendations(isSafe, safetyScore, warnings, violations)
    };
  }
  
  generateRecommendations(isSafe, safetyScore, warnings, violations) {
    const recommendations = [];
    
    if (!isSafe) {
      recommendations.push({
        type: 'block',
        priority: 'high',
        message: '建议阻止此内容',
        action: 'block_content'
      });
    }
    
    if (safetyScore < 80) {
      recommendations.push({
        type: 'review',
        priority: 'medium',
        message: '建议家长审查此内容',
        action: 'flag_for_review'
      });
    }
    
    if (warnings.length > 0) {
      recommendations.push({
        type: 'monitor',
        priority: 'low',
        message: '建议监控儿童观看此内容',
        action: 'enable_parental_monitoring'
      });
    }
    
    if (violations.length > 0) {
      recommendations.push({
        type: 'report',
        priority: 'high',
        message: '发现违规内容，建议报告',
        action: 'report_violation'
      });
    }
    
    return recommendations;
  }
  
  clearCache() {
    this.safetyCache.clear();
  }
}

// 时间跟踪类
class TimeTracker {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
    this.dailyUsage = { minutes: 0, startDate: this.getToday() };
    this.init();
  }
  
  init() {
    this.loadFromStorage();
    this.startNewDayCheck();
  }
  
  startSession() {
    this.currentSession = {
      startTime: Date.now(),
      paused: false,
      pauses: []
    };
    
    this.sessions.push(this.currentSession);
    this.saveToStorage();
  }
  
  pauseSession() {
    if (this.currentSession && !this.currentSession.paused) {
      this.currentSession.paused = true;
      this.currentSession.pauses.push({
        start: Date.now()
      });
    }
  }
  
  resumeSession() {
    if (this.currentSession && this.currentSession.paused) {
      this.currentSession.paused = false;
      const lastPause = this.currentSession.pauses[this.currentSession.pauses.length - 1];
      if (lastPause) {
        lastPause.end = Date.now();
        lastPause.duration = lastPause.end - lastPause.start;
      }
    }
  }
  
  endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
      
      // 减去暂停时间
      let pauseDuration = 0;
      this.currentSession.pauses.forEach(pause => {
        if (pause.duration) {
          pauseDuration += pause.duration;
        }
      });
      
      this.currentSession.activeDuration = this.currentSession.duration - pauseDuration;
      this.currentSession.activeMinutes = Math.floor(this.currentSession.activeDuration / 60000);
      
      // 更新每日使用时间
      this.updateDailyUsage(this.currentSession.activeMinutes);
      
      this.currentSession = null;
      this.saveToStorage();
    }
  }
  
  updateDailyUsage(minutes) {
    const today = this.getToday();
    
    if (this.dailyUsage.startDate !== today) {
      // 新的一天，重置计数器
      this.dailyUsage = { minutes: 0, startDate: today };
    }
    
    this.dailyUsage.minutes += minutes;
    this.saveToStorage();
  }
  
  getSessionUsage() {
    if (!this.currentSession) {
      return { minutes: 0, seconds: 0 };
    }
    
    const now = Date.now();
    let activeDuration = now - this.currentSession.startTime;
    
    // 减去暂停时间
    this.currentSession.pauses.forEach(pause => {
      if (pause.start && !pause.end) {
        activeDuration -= (now - pause.start);
      } else if (pause.duration) {
        activeDuration -= pause.duration;
      }
    });
    
    const minutes = Math.floor(activeDuration / 60000);
    const seconds = Math.floor((activeDuration % 60000) / 1000);
    
    return { minutes, seconds };
  }
  
  getTodayUsage() {
    const today = this.getToday();
    
    if (this.dailyUsage.startDate !== today) {
      return { minutes: 0, date: today };
    }
    
    return {
      minutes: this.dailyUsage.minutes,
      date: this.dailyUsage.startDate
    };
  }
  
  getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }
  
  startNewDayCheck() {
    // 每小时检查一次是否是新的一天
    setInterval(() => {
      const today = this.getToday();
      if (this.dailyUsage.startDate !== today) {
        this.dailyUsage = { minutes: 0, startDate: today };
        this.saveToStorage();
      }
    }, 3600000); // 1小时
  }
  
  saveToStorage() {
    try {
      const data = {
        sessions: this.sessions.slice(-100), // 保存最近100个会话
        dailyUsage: this.dailyUsage,
        timestamp: Date.now()
      };
      
      storage.setItem('time_tracker_data', JSON.stringify(data));
    } catch (e) {
      console.warn('保存时间跟踪数据失败:', e);
    }
  }
  
  loadFromStorage() {
    try {
      const saved = storage.getItem('time_tracker_data');
      if (saved) {
        const data = JSON.parse(saved);
        this.sessions = data.sessions || [];
        this.dailyUsage = data.dailyUsage || { minutes: 0, startDate: this.getToday() };
      }
    } catch (e) {
      console.warn('加载时间跟踪数据失败:', e);
    }
  }
  
  getUsageReport() {
    const today = this.getTodayUsage();
    const session = this.getSessionUsage();
    const totalSessions = this.sessions.length;
    
    // 计算平均会话时长
    let totalMinutes = 0;
    this.sessions.forEach(session => {
      if (session.activeMinutes) {
        totalMinutes += session.activeMinutes;
      }
    });
    
    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    
    return {
      today: today,
      currentSession: session,
      totalSessions,
      totalMinutes,
      avgSessionMinutes,
      lastSession: this.sessions[this.sessions.length - 1]
    };
  }
}

// 内容过滤器类
class ContentFilter {
  constructor() {
    this.filters = this.loadFilters();
    this.blockedItems = new Set();
    this.init();
  }
  
  init() {
    console.log('内容过滤器初始化');
    this.loadBlockedItems();
  }
  
  loadFilters() {
    try {
      const saved = storage.getItem('content_filters');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('加载内容过滤器失败:', e);
    }
    
    // 默认过滤器
    return {
      ageRange: '3-6',
      allowedCategories: ['educational', 'music', 'story', 'exercise'],
      blockedKeywords: [],
      strictMode: true,
      safeSearch: true
    };
  }
  
  saveFilters() {
    try {
      storage.setItem('content_filters', JSON.stringify(this.filters));
    } catch (e) {
      console.error('保存内容过滤器失败:', e);
    }
  }
  
  loadBlockedItems() {
    try {
      const saved = storage.getItem('blocked_content_items');
      if (saved) {
        const items = JSON.parse(saved);
        this.blockedItems = new Set(items);
      }
    } catch (e) {
      console.warn('加载阻止内容项失败:', e);
    }
  }
  
  saveBlockedItems() {
    try {
      storage.setItem('blocked_content_items', JSON.stringify([...this.blockedItems]));
    } catch (e) {
      console.error('保存阻止内容项失败:', e);
    }
  }
  
  // 检查内容是否应该被过滤
  shouldFilter(content, ageGroup = null) {
    const age = ageGroup || this.filters.ageRange;
    
    // 检查是否在阻止列表中
    if (this.blockedItems && this.blockedItems.has(content.id)) {
      return true;
    }
    
    // 这里应该有更多过滤逻辑
    return false;
  }
}

// 导出
export { SafetyAnalyzer, TimeTracker };
export default SafetyAnalyzer;