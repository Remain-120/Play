/**
 * 性能优化工具
 * 为特殊儿童应用优化性能
 */

// 环境检测
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// 性能监控配置
const PERFORMANCE_CONFIG = {
  enabled: true,
  logLevel: 'warn', // 'debug', 'info', 'warn', 'error'
  metrics: {
    fps: true,
    memory: true,
    network: true,
    loading: true
  },
  thresholds: {
    fps: 30,          // 最低FPS
    memory: 100,      // 最大内存使用(MB)
    loadTime: 2000,   // 最大加载时间(ms)
    networkTime: 1000 // 最大网络请求时间(ms)
  }
};

// 性能指标类
class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.init();
  }
  
  init() {
    if (!PERFORMANCE_CONFIG.enabled) return;
    
    if (!isWeb) return;
    
    this.setupPerformanceObserver();
    
    this.startMonitoring();
  }
  
  setupPerformanceObserver() {
    // 监听长任务
    if (isWeb && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // 超过50ms的任务
            this.log('warn', `长任务检测: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
    
    // 监听布局偏移
    if (isWeb && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.hadRecentInput) return;
          
          const cls = entry.value;
          if (cls > 0.1) { // 超过0.1的布局偏移
            this.log('warn', `布局偏移检测: ${cls.toFixed(3)}`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  startMonitoring() {
    // 监控FPS
    if (PERFORMANCE_CONFIG.metrics.fps) {
      this.monitorFPS();
    }
    
    // 监控内存
    if (PERFORMANCE_CONFIG.metrics.memory && isWeb && typeof performance !== 'undefined' && 'memory' in performance) {
      this.monitorMemory();
    }
    
    // 监控网络
    if (PERFORMANCE_CONFIG.metrics.network) {
      this.monitorNetwork();
    }
  }
  
  monitorFPS() {
    if (!isWeb) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    const checkFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) { // 每秒检查一次
        const fps = Math.round((frameCount * 1000) / elapsed);
        this.setMetric('fps', fps);
        
        if (fps < PERFORMANCE_CONFIG.thresholds.fps) {
          this.log('warn', `低FPS警告: ${fps}`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(checkFPS);
    };
    
    requestAnimationFrame(checkFPS);
  }
  
  monitorMemory() {
    if (!isWeb) return;
    
    const checkMemory = () => {
      try {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        this.setMetric('memory', usedMB);
        
        if (usedMB > PERFORMANCE_CONFIG.thresholds.memory) {
          this.log('warn', `高内存使用警告: ${usedMB}MB`);
        }
      } catch (e) {
        // 内存API可能不可用
      }
      
      setTimeout(checkMemory, 5000); // 每5秒检查一次
    };
    
    checkMemory();
  }
  
  monitorNetwork() {
    if (!isWeb) return;
    
    // 拦截fetch请求
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        Performance.getInstance().logNetworkRequest(args[0], duration, response.ok);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        Performance.getInstance().logNetworkRequest(args[0], duration, false);
        throw error;
      }
    };
  }
  
  logNetworkRequest(url, duration, success) {
    this.setMetric('network', duration);
    
    if (duration > PERFORMANCE_CONFIG.thresholds.networkTime) {
      this.log('warn', `慢网络请求: ${url} - ${duration.toFixed(2)}ms`);
    }
    
    if (!success) {
      this.log('error', `网络请求失败: ${url}`);
    }
  }
  
  setMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now()
    });
  }
  
  getMetric(name) {
    return this.metrics.get(name);
  }
  
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }
  
  log(level, message) {
    if (this.shouldLog(level)) {
      console[level](`[Performance] ${message}`);
    }
  }
  
  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(PERFORMANCE_CONFIG.logLevel);
    const messageLevel = levels.indexOf(level);
    
    return messageLevel >= configLevel;
  }
}

// 资源管理类
class ResourceManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // 最大缓存项目数
    this.init();
  }
  
  init() {
    // 监听页面可见性变化
    if (isWeb && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.cleanup(); // 页面隐藏时清理资源
        }
      });
    }
    
    // 监听内存警告
    if (isWeb && typeof window !== 'undefined') {
      window.addEventListener('memorywarning', () => {
        this.clearCache();
      });
    }
  }
  
  async loadImage(url, options = {}) {
    if (!isWeb) {
      // 小程序环境，返回空对象
      return {};
    }
    
    const cacheKey = `image:${url}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 加载图片
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin;
      }
      
      img.onload = () => {
        // 缓存图片
        this.setCache(cacheKey, img);
        resolve(img);
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }
  
  async loadVideo(url, options = {}) {
    if (!isWeb) {
      // 小程序环境，返回空对象
      return {};
    }
    
    const cacheKey = `video:${url}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 预加载视频
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.preload = 'metadata';
      video.muted = true;
      
      if (options.crossOrigin) {
        video.crossOrigin = options.crossOrigin;
      }
      
      video.onloadedmetadata = () => {
        // 缓存视频元数据
        this.setCache(cacheKey, {
          url,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        resolve(video);
      };
      
      video.onerror = reject;
      video.src = url;
    });
  }
  
  setCache(key, value) {
    // 清理过期缓存
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }
  
  getCache(key) {
    const item = this.cache.get(key);
    
    if (item) {
      item.accessCount++;
      item.timestamp = Date.now();
      return item.value;
    }
    
    return null;
  }
  
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分钟
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > maxAge && item.accessCount === 0) {
        this.cache.delete(key);
      }
    }
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  getCacheStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        age: Date.now() - item.timestamp,
        accessCount: item.accessCount
      }))
    };
  }
}

// 懒加载类
class LazyLoader {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = null;
    this.elements = new Map();
    this.init();
  }
  
  init() {
    if (isWeb && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.options
      );
    }
  }
  
  observe(element, callback) {
    if (!this.observer) {
      // 如果不支持IntersectionObserver，立即加载
      callback();
      return;
    }
    
    this.elements.set(element, callback);
    this.observer.observe(element);
  }
  
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const callback = this.elements.get(element);
        
        if (callback) {
          callback();
          this.unobserve(element);
        }
      }
    });
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elements.clear();
  }
}

// 图片懒加载
class ImageLazyLoader extends LazyLoader {
  constructor(options = {}) {
    super(options);
  }
  
  lazyLoadImage(imgElement) {
    const src = imgElement.dataset.src;
    if (!src) return;
    
    this.observe(imgElement, () => {
      imgElement.src = src;
      imgElement.classList.add('lazy-loaded');
      
      // 加载完成后移除data-src属性
      imgElement.removeAttribute('data-src');
    });
  }
  
  lazyLoadBackground(element) {
    const bgImage = element.dataset.bg;
    if (!bgImage) return;
    
    this.observe(element, () => {
      element.style.backgroundImage = `url(${bgImage})`;
      element.classList.add('lazy-loaded');
      
      // 加载完成后移除data-bg属性
      element.removeAttribute('data-bg');
    });
  }
}

// 视频预加载类
class VideoPreloader {
  constructor() {
    this.queue = [];
    this.maxConcurrent = 2; // 最大并发数
    this.currentDownloads = 0;
  }
  
  preload(videoUrl, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.queue.push({
        url: videoUrl,
        priority,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }
  
  processQueue() {
    while (this.currentDownloads < this.maxConcurrent && this.queue.length > 0) {
      // 按优先级排序
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      const task = this.queue.shift();
      this.downloadVideo(task);
    }
  }
  
  async downloadVideo(task) {
    this.currentDownloads++;
    
    try {
      const response = await fetch(task.url, { method: 'HEAD' });
      
      if (response.ok) {
        // 视频可访问，开始预加载
        const video = document.createElement('video');
        video.preload = 'auto';
        video.src = task.url;
        
        video.onloadeddata = () => {
          task.resolve(video);
          this.currentDownloads--;
          this.processQueue();
        };
        
        video.onerror = (error) => {
          task.reject(error);
          this.currentDownloads--;
          this.processQueue();
        };
      } else {
        task.reject(new Error(`视频不可访问: ${response.status}`));
        this.currentDownloads--;
        this.processQueue();
      }
    } catch (error) {
      task.reject(error);
      this.currentDownloads--;
      this.processQueue();
    }
  }
  
  clearQueue() {
    this.queue = [];
  }
  
  setMaxConcurrent(max) {
    this.maxConcurrent = Math.max(1, max);
  }
}

// 性能优化主类
class Performance {
  static instance = null;
  
  constructor() {
    this.metrics = new PerformanceMetrics();
    this.resourceManager = new ResourceManager();
    this.imageLazyLoader = new ImageLazyLoader();
    this.videoPreloader = new VideoPreloader();
    this.init();
  }
  
  static getInstance() {
    if (!Performance.instance) {
      Performance.instance = new Performance();
    }
    return Performance.instance;
  }
  
  init() {
    console.log('性能优化模块初始化');
    
    if (!isWeb) return;
    
    this.applyOptimizations();
    
    this.startPerformanceMonitoring();
  }
  
  applyOptimizations() {
    // 1. 图片懒加载
    this.setupImageLazyLoading();
    
    // 2. 视频预加载
    this.setupVideoPreloading();
    
    // 3. 资源预加载
    this.setupResourcePreloading();
    
    // 4. 内存优化
    this.setupMemoryOptimization();
  }
  
  setupImageLazyLoading() {
    // 小程序环境没有document对象，跳过
    if (!isWeb || typeof document === 'undefined') return;
    
    // 自动为所有data-src图片启用懒加载
    document.addEventListener('DOMContentLoaded', () => {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        this.imageLazyLoader.lazyLoadImage(img);
      });
      
      const bgElements = document.querySelectorAll('[data-bg]');
      bgElements.forEach(el => {
        this.imageLazyLoader.lazyLoadBackground(el);
      });
    });
  }
  
  setupVideoPreloading() {
    // 小程序环境没有document对象，跳过
    if (!isWeb || typeof document === 'undefined') return;
    
    // 预加载即将播放的视频
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.preloadVisibleVideos();
      }
    });
  }
  
  async preloadVisibleVideos() {
    // 小程序环境没有document对象，跳过
    if (!isWeb || typeof document === 'undefined') return;
    
    // 获取可见区域内的视频元素
    const videos = document.querySelectorAll('video[data-src]');
    
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      const isVisible = (
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      );
      
      if (isVisible) {
        const videoUrl = video.dataset.src;
        if (videoUrl) {
          try {
            await this.videoPreloader.preload(videoUrl, 'high');
          } catch (error) {
            console.warn('视频预加载失败:', error);
          }
        }
      }
    }
  }
  
  setupResourcePreloading() {
    // 小程序环境没有document对象，跳过
    if (!isWeb || typeof document === 'undefined') return;
    
    // 预加载关键资源
    const criticalResources = [
      // 添加关键资源URL
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = this.getResourceType(resource);
      link.href = resource;
      document.head.appendChild(link);
    });
  }
  
  getResourceType(url) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (url.match(/\.(mp4|webm|ogg)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
    if (url.match(/\.(css)$/i)) return 'style';
    if (url.match(/\.(js)$/i)) return 'script';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'fetch';
  }
  
  setupMemoryOptimization() {
    // 小程序环境跳过内存优化
    if (!isWeb) return;
    
    // 定期清理内存
    setInterval(() => {
      this.resourceManager.cleanup();
    }, 60000); // 每分钟清理一次
    
    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  startPerformanceMonitoring() {
    // 讑录首次内容绘制时间
    if (isWeb && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.metrics.setMetric('fcp', entry.startTime);
          this.log('info', `首次内容绘制: ${entry.startTime.toFixed(2)}ms`);
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
    }
    
    // 记录最大内容绘制时间
    if (isWeb && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.metrics.setMetric('lcp', entry.startTime);
          this.log('info', `最大内容绘制: ${entry.startTime.toFixed(2)}ms`);
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }
}

// 导出
let _perfMonitor = null;
const perfMonitor = {
  get instance() {
    if (!_perfMonitor && isWeb) {
      _perfMonitor = Performance.getInstance();
    }
    return _perfMonitor;
  }
};
export { perfMonitor };
export default Performance;