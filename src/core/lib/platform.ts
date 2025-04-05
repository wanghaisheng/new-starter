/**
 * 平台检测工具
 * 
 * 此文件提供了检测当前运行平台的工具函数，用于在不同平台上实现不同的行为。
 * 支持检测 Web、Android、iOS 平台以及开发、测试和生产环境。
 */

/**
 * 平台类型
 */
export type AppPlatform = 'web' | 'android' | 'ios' | 'unknown';

/**
 * 环境类型
 */
export type AppEnvironment = 'development' | 'test' | 'production';

/**
 * 检查是否在 Capacitor 环境中运行
 */
function isCapacitorAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as any).Capacitor !== 'undefined';
}

/**
 * 获取当前应用运行的平台
 * 
 * @returns 平台类型: 'web', 'android', 'ios' 或 'unknown'
 */
export function getAppPlatform(): AppPlatform {
  if (typeof window === 'undefined') {
    return 'unknown'; // 服务器端渲染环境
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // 检查是否是移动端应用中
  if (isCapacitorAvailable()) {
    try {
      const platform = (window as any).Capacitor.getPlatform();
      if (platform === 'android') return 'android';
      if (platform === 'ios') return 'ios';
    } catch (e) {
      console.warn('Error getting Capacitor platform:', e);
      // 降级到用户代理检测
      if (userAgent.indexOf('android') > -1) return 'android';
      if (userAgent.indexOf('iphone') > -1 || userAgent.indexOf('ipad') > -1) return 'ios';
    }
  } else {
    // 基于用户代理进行检测
    if (userAgent.indexOf('android') > -1) return 'android';
    if (userAgent.indexOf('iphone') > -1 || userAgent.indexOf('ipad') > -1) return 'ios';
  }
  
  // 默认为 Web 平台
  return 'web';
}

/**
 * 检查是否是 Web 平台
 * 
 * @returns true 如果是 Web 平台，否则 false
 */
export function isWebPlatform(): boolean {
  return getAppPlatform() === 'web';
}

/**
 * 检查是否是移动平台（Android 或 iOS）
 * 
 * @returns true 如果是移动平台，否则 false
 */
export function isMobilePlatform(): boolean {
  const platform = getAppPlatform();
  return platform === 'android' || platform === 'ios';
}

/**
 * 检查是否是 Android 平台
 * 
 * @returns true 如果是 Android 平台，否则 false
 */
export function isAndroidPlatform(): boolean {
  return getAppPlatform() === 'android';
}

/**
 * 检查是否是 iOS 平台
 * 
 * @returns true 如果是 iOS 平台，否则 false
 */
export function isIOSPlatform(): boolean {
  return getAppPlatform() === 'ios';
}

/**
 * 获取当前应用运行的环境
 * 
 * @returns 环境类型: 'development', 'test' 或 'production'
 */
export function getAppEnvironment(): AppEnvironment {
  // 从环境变量获取
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test') {
      return 'test';
    }
    
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
  }
  
  return 'development';
}

/**
 * 检查是否是开发环境
 * 
 * @returns true 如果是开发环境，否则 false
 */
export function isDevelopment(): boolean {
  return getAppEnvironment() === 'development';
}

/**
 * 检查是否是生产环境
 * 
 * @returns true 如果是生产环境，否则 false
 */
export function isProduction(): boolean {
  return getAppEnvironment() === 'production';
}

/**
 * 检查是否是测试环境
 * 
 * @returns true 如果是测试环境，否则 false
 */
export function isTest(): boolean {
  return getAppEnvironment() === 'test';
} 