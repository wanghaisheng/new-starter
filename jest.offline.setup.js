/**
 * Jest离线测试环境设置
 * 
 * 这个文件在每个测试文件运行前执行，用于设置全局模拟对象
 */

// 模拟浏览器本地存储
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// 模拟IndexedDB
const indexedDB = require('fake-indexeddb');
const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// 模拟网络状态
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true,
});

// 模拟在线/离线事件
global.dispatchEvent = jest.fn();
global.addEventListener = jest.fn();
global.removeEventListener = jest.fn();

// 模拟Service Worker
global.navigator.serviceWorker = {
  register: jest.fn().mockResolvedValue({
    active: {
      postMessage: jest.fn(),
    },
    update: jest.fn(),
    unregister: jest.fn().mockResolvedValue(true),
  }),
  ready: Promise.resolve({
    active: {
      postMessage: jest.fn(),
    },
    sync: {
      register: jest.fn().mockResolvedValue(undefined),
    },
  }),
  getRegistration: jest.fn().mockResolvedValue({
    active: {
      postMessage: jest.fn(),
    },
  }),
  controller: {
    postMessage: jest.fn(),
  },
};

// 模拟网络请求限制
const originalFetch = global.fetch;
global.fetch = jest.fn().mockImplementation((url, options) => {
  // 检查navigator.onLine，模拟网络状态影响请求
  if (!global.navigator.onLine) {
    return Promise.reject(new Error('Network error: No internet connection'));
  }
  // 否则调用原始fetch
  if (originalFetch) {
    return originalFetch(url, options);
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  });
});

// 模拟控制台以减少测试输出噪音
const originalConsoleError = console.error;
console.error = jest.fn((...args) => {
  // 过滤一些已知的错误消息
  if (args[0] && typeof args[0] === 'string' && (
    args[0].includes('网络错误') || 
    args[0].includes('Network error')
  )) {
    // 完全抑制这些错误
    return;
  }
  // 其他消息仍然记录
  originalConsoleError(...args);
});

// 清理函数，在每个测试文件结束后恢复
afterAll(() => {
  console.error = originalConsoleError;
  if (originalFetch) {
    global.fetch = originalFetch;
  }
});

// 模拟计时器
jest.useFakeTimers(); 