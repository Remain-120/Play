/**
 * 无障碍功能增强工具
 * 为特殊儿童（特别是唐氏综合症儿童）优化
 */

// 环境检测
const isMiniProgram = typeof uni !== 'undefined' || typeof document === 'undefined';
const isWeb = typeof document !== 'undefined' && typeof window !== 'undefined';

// 语音合成配置
const SPEECH_CONFIG = {
  rate: 0.8,      // 语速（0.1-10）
  pitch: 1.0,     // 音高（0-2）
  volume: 1.0,    // 音量（0-1）
  lang: 'zh-CN',  // 语言
  voice: null     // 语音类型
};

// 触觉反馈类型
const HAPTIC_TYPES = {
  LIGHT: 'light',      // 轻触反馈
  MEDIUM: 'medium',    // 中等反馈
  HEAVY: 'heavy',      // 重触反馈
  SUCCESS: 'success',  // 成功反馈
  ERROR: 'error',      // 错误反馈
  WARNING: 'warning'   // 警告反馈
};

// 焦点管理类
class FocusManager {
  constructor() {
    this.focusableElements = [];
    this.currentIndex = -1;
    this.init();
  }
  
  init() {
    // 收集所有可聚焦元素
    this.updateFocusableElements();
    
    // 小程序环境没有document对象，跳过事件监听
    if (typeof document === 'undefined') {
      return;
    }
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 添加触摸事件监听
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
  }
  
  updateFocusableElements() {
    // 小程序环境没有document对象，返回空数组
    if (typeof document === 'undefined') {
      this.focusableElements = [];
      return;
    }
    
    this.focusableElements = Array.from(
      document.querySelectorAll(
        'button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"]), a[href]'
      )
    ).filter(el => !el.disabled && el.offsetParent !== null);
  }
  
  handleKeyDown(event) {
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          this.focusPrevious();
        } else {
          this.focusNext();
        }
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPrevious();
        break;
        
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusNext();
        break;
        
      case 'Enter':
      case ' ':
        if (this.currentElement) {
          event.preventDefault();
          this.currentElement.click();
        }
        break;
    }
  }
  
  handleTouchStart(event) {
    // 触摸时提供触觉反馈
    Accessibility.hapticFeedback(HAPTIC_TYPES.LIGHT);
  }
  
  focusNext() {
    if (this.focusableElements.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    this.focusCurrentElement();
  }
  
  focusPrevious() {
    if (this.focusableElements.length === 0) return;
    
    this.currentIndex = this.currentIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentIndex - 1;
    this.focusCurrentElement();
  }
  
  focusCurrentElement() {
    if (this.currentElement) {
      this.currentElement.focus();
      Accessibility.speak(this.getElementDescription(this.currentElement));
      Accessibility.hapticFeedback(HAPTIC_TYPES.MEDIUM);
    }
  }
  
  get currentElement() {
    return this.focusableElements[this.currentIndex];
  }
  
  getElementDescription(element) {
    // 获取元素的描述文本
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    const text = element.textContent?.trim();
    if (text) return text;
    
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;
    
    return '可操作元素';
  }
}

// 语音合成类
class SpeechSynthesis {
  constructor() {
    // 小程序环境没有window对象，不支持语音合成
    if (typeof window === 'undefined') {
      this.supported = false;
      this.voices = [];
      return;
    }
    this.supported = 'speechSynthesis' in window;
    this.voices = [];
    this.init();
  }
  
  async init() {
    if (!this.supported) {
      console.warn('浏览器不支持语音合成');
      return;
    }
    
    // 加载可用语音
    await this.loadVoices();
    
    // 选择中文语音
    this.selectChineseVoice();
  }
  
  loadVoices() {
    return new Promise((resolve) => {
      if (!this.supported || typeof speechSynthesis === 'undefined') {
        resolve();
        return;
      }
      
      if (speechSynthesis.getVoices().length > 0) {
        this.voices = speechSynthesis.getVoices();
        resolve();
      } else {
        speechSynthesis.onvoiceschanged = () => {
          this.voices = speechSynthesis.getVoices();
          resolve();
        };
      }
    });
  }
  
  selectChineseVoice() {
    // 优先选择中文语音
    const chineseVoice = this.voices.find(voice => 
      voice.lang.startsWith('zh') || voice.lang.startsWith('cmn')
    );
    
    if (chineseVoice) {
      SPEECH_CONFIG.voice = chineseVoice;
    }
  }
  
  speak(text, config = {}) {
    if (!this.supported || !text || typeof speechSynthesis === 'undefined') return;
    
    // 停止当前语音
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 应用配置
    Object.assign(utterance, SPEECH_CONFIG, config);
    
    // 设置语音
    if (SPEECH_CONFIG.voice) {
      utterance.voice = SPEECH_CONFIG.voice;
    }
    
    // 语音事件
    utterance.onstart = () => {
      console.log('语音开始:', text);
    };
    
    utterance.onend = () => {
      console.log('语音结束');
    };
    
    utterance.onerror = (error) => {
      console.error('语音错误:', error);
    };
    
    speechSynthesis.speak(utterance);
  }
  
  stop() {
    if (this.supported && typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }
  
  setRate(rate) {
    SPEECH_CONFIG.rate = Math.max(0.1, Math.min(10, rate));
  }
  
  setPitch(pitch) {
    SPEECH_CONFIG.pitch = Math.max(0, Math.min(2, pitch));
  }
  
  setVolume(volume) {
    SPEECH_CONFIG.volume = Math.max(0, Math.min(1, volume));
  }
}

// 触觉反馈类
class HapticFeedback {
  constructor() {
    if (isMiniProgram) {
      this.supported = true;
      this.isMiniProgram = true;
      return;
    }
    if (typeof navigator === 'undefined') {
      this.supported = false;
      this.isMiniProgram = false;
      return;
    }
    this.supported = 'vibrate' in navigator;
    this.isMiniProgram = false;
  }
  
  vibrate(pattern) {
    if (!this.supported) return;
    
    try {
      if (this.isMiniProgram) {
        const duration = typeof pattern === 'number' ? pattern : 200;
        if (duration > 100) {
          uni.vibrateLong();
        } else {
          uni.vibrateShort();
        }
      } else {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('触觉反馈失败:', error);
    }
  }
  
  light() {
    this.vibrate(50);
  }
  
  medium() {
    this.vibrate(100);
  }
  
  heavy() {
    this.vibrate(200);
  }
  
  success() {
    this.vibrate([50, 100, 50]);
  }
  
  error() {
    this.vibrate([200, 100, 200]);
  }
  
  warning() {
    this.vibrate([100, 50, 100]);
  }
}

// 颜色对比度检查
class ColorContrast {
  static calculateLuminance(r, g, b) {
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    
    const rL = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const gL = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const bL = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  }
  
  static calculateContrast(color1, color2) {
    const lum1 = this.calculateLuminance(...color1);
    const lum2 = this.calculateLuminance(...color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  static checkWCAGAA(color1, color2) {
    const contrast = this.calculateContrast(color1, color2);
    return contrast >= 4.5; // WCAG AA 标准
  }
  
  static checkWCAGAAA(color1, color2) {
    const contrast = this.calculateContrast(color1, color2);
    return contrast >= 7; // WCAG AAA 标准
  }
}

// 简化导航类
class SimpleNavigation {
  constructor() {
    this.largeTouchTargets = true;
    this.simpleGestures = true;
    this.init();
  }
  
  init() {
    this.enlargeTouchTargets();
    this.simplifyGestures();
  }
  
  enlargeTouchTargets() {
    if (!this.largeTouchTargets) return;
    
    // 小程序环境没有document对象，跳过
    if (typeof document === 'undefined') {
      return;
    }
    
    // 为所有交互元素添加大触摸目标类
    const interactiveElements = document.querySelectorAll(
      'button, [role="button"], input, a, .video-card, .action-item'
    );
    
    interactiveElements.forEach(el => {
      el.classList.add('large-touch-target');
    });
  }
  
  simplifyGestures() {
    if (!this.simpleGestures) return;
    
    // 小程序环境没有document对象，跳过事件监听
    if (typeof document === 'undefined') {
      return;
    }
    
    // 简化手势识别
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // 简化手势识别阈值
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        // 提供触觉反馈
        Accessibility.hapticFeedback(HAPTIC_TYPES.MEDIUM);
      }
    });
  }
}

// 主无障碍类
class Accessibility {
  static _focusManager = null;
  static get focusManager() { if (!this._focusManager && isWeb) { this._focusManager = new FocusManager(); } return this._focusManager; }
  static _speech = null;
  static get speech() { if (!this._speech && isWeb) { this._speech = new SpeechSynthesis(); } return this._speech; }
  static _haptic = null;
  static get haptic() { if (!this._haptic) { this._haptic = new HapticFeedback(); } return this._haptic; }
  static _navigation = null;
  static get navigation() { if (!this._navigation && isWeb) { this._navigation = new SimpleNavigation(); } return this._navigation; }
  
  static init() {
    console.log('无障碍功能初始化');
    
    // 初始化各个模块
    if (isWeb) {
      this.focusManager.init();
      this.speech.init();
    }
    
    // 添加无障碍提示
    this.addAccessibilityHint();
    
    // 应用无障碍样式
    this.applyAccessibilityStyles();
  }
  
  static speak(text, config) {
    if (isWeb && this.speech) {
      this.speech.speak(text, config);
    }
  }
  
  static hapticFeedback(type = HAPTIC_TYPES.LIGHT) {
    switch (type) {
      case HAPTIC_TYPES.LIGHT:
        this.haptic.light();
        break;
      case HAPTIC_TYPES.MEDIUM:
        this.haptic.medium();
        break;
      case HAPTIC_TYPES.HEAVY:
        this.haptic.heavy();
        break;
      case HAPTIC_TYPES.SUCCESS:
        this.haptic.success();
        break;
      case HAPTIC_TYPES.ERROR:
        this.haptic.error();
        break;
      case HAPTIC_TYPES.WARNING:
        this.haptic.warning();
        break;
    }
  }
  
  static addAccessibilityHint() {
    // 小程序环境没有document对象，跳过
    if (typeof document === 'undefined') {
      return;
    }
    
    const hint = document.createElement('div');
    hint.className = 'accessibility-hint';
    hint.innerHTML = `
      <div class="hint-content">
        <span class="hint-icon">♿</span>
        <span class="hint-text">无障碍模式已启用</span>
      </div>
    `;
    
    document.body.appendChild(hint);
    
    // 3秒后隐藏
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => hint.remove(), 300);
    }, 3000);
  }
  
  static applyAccessibilityStyles() {
    // 小程序环境没有document对象，跳过
    if (typeof document === 'undefined') {
      return;
    }
    
    const style = document.createElement('style');
    style.textContent = `
      /* 大触摸目标 */
      .large-touch-target {
        min-height: 88rpx !important;
        min-width: 88rpx !important;
        padding: 16rpx !important;
      }
      
      /* 高对比度焦点样式 */
      :focus {
        outline: 3px solid #2ff0ff !important;
        outline-offset: 2px !important;
      }
      
      /* 无障碍提示 */
      .accessibility-hint {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20rpx;
        text-align: center;
        font-size: 28rpx;
        z-index: 9999;
        transition: opacity 0.3s ease;
      }
      
      .hint-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
      }
      
      .hint-icon {
        font-size: 32rpx;
      }
      
      .hint-text {
        font-weight: 500;
      }
      
      /* 简化动画 */
      .reduce-motion * {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  static enableHighContrast() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('high-contrast');
  }
  
  static disableHighContrast() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('high-contrast');
  }
  
  static enableLargeText() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('large-text');
  }
  
  static disableLargeText() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('large-text');
  }
  
  static enableReduceMotion() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('reduce-motion');
  }
  
  static disableReduceMotion() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('reduce-motion');
  }
}

// 导出
export {
  Accessibility,
  FocusManager,
  SpeechSynthesis,
  HapticFeedback,
  ColorContrast,
  SimpleNavigation,
  HAPTIC_TYPES,
  SPEECH_CONFIG
};

export default Accessibility;