// Node 22+ 强制全局 mock fetch，覆盖原生 fetch，避免测试真实请求
global.fetch = jest.fn(() => {
  console.log('MOCK FETCH CALLED');
  return Promise.resolve(
    new Response(JSON.stringify({ data: 'mocked' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );
});

import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Capacitor core
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

// Mock Capacitor SQLite
jest.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {
    createConnection: jest.fn(),
    closeConnection: jest.fn(),
    execute: jest.fn(),
    query: jest.fn(),
    run: jest.fn(),
    isConnection: jest.fn(),
    isDatabase: jest.fn(),
    isTable: jest.fn(),
    getTableList: jest.fn(),
    getDatabaseList: jest.fn(),
    getConnectionList: jest.fn(),
    deleteDatabase: jest.fn(),
    deleteTable: jest.fn(),
    deleteConnection: jest.fn(),
    importFromJson: jest.fn(),
    exportToJson: jest.fn(),
    copyFromAssets: jest.fn(),
    isJsonValid: jest.fn(),
    isSecretStored: jest.fn(),
    setEncryptionSecret: jest.fn(),
    changeEncryptionSecret: jest.fn(),
  },
}));

// Mock Capacitor Filesystem
jest.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    deleteFile: jest.fn(),
    mkdir: jest.fn(),
    rmdir: jest.fn(),
    readdir: jest.fn(),
    getUri: jest.fn(),
    stat: jest.fn(),
    rename: jest.fn(),
    copy: jest.fn(),
  },
}));

// Mock Capacitor Storage
jest.mock('@capacitor/storage', () => ({
  Storage: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  },
}));

// Mock Capacitor Network
jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock Capacitor App
jest.mock('@capacitor/app', () => ({
  App: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    exitApp: jest.fn(),
  },
}));

// Mock Capacitor Haptics
jest.mock('@capacitor/haptics', () => ({
  Haptics: {
    vibrate: jest.fn(),
    impact: jest.fn(),
    notification: jest.fn(),
    selectionStart: jest.fn(),
    selectionChanged: jest.fn(),
    selectionEnd: jest.fn(),
  },
}));

// Mock Capacitor Keyboard
jest.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    setAccessoryBarVisible: jest.fn(),
    setScroll: jest.fn(),
    setResizeMode: jest.fn(),
    setStyle: jest.fn(),
    setColor: jest.fn(),
  },
}));

// Mock Capacitor StatusBar
jest.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    getInfo: jest.fn(),
    setOverlaysWebView: jest.fn(),
  },
}));

// Mock Capacitor SplashScreen
jest.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

// Mock Capacitor Camera
jest.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: jest.fn(),
    pickImages: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
  },
}));

// Mock Capacitor Geolocation
jest.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
  },
}));

// Mock Capacitor PushNotifications
jest.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    register: jest.fn(),
    unregister: jest.fn(),
    getDeliveredNotifications: jest.fn(),
    removeDeliveredNotifications: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
    createChannel: jest.fn(),
    deleteChannel: jest.fn(),
    listChannels: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock Capacitor LocalNotifications
jest.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: jest.fn(),
    getPending: jest.fn(),
    registerActionTypes: jest.fn(),
    cancel: jest.fn(),
    areEnabled: jest.fn(),
    requestPermissions: jest.fn(),
    checkPermissions: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock Capacitor Device
jest.mock('@capacitor/device', () => ({
  Device: {
    getInfo: jest.fn(),
    getLanguageCode: jest.fn(),
    getLanguageTag: jest.fn(),
    getId: jest.fn(),
  },
}));

// Mock Capacitor ScreenReader
jest.mock('@capacitor/screen-reader', () => ({
  ScreenReader: {
    isEnabled: jest.fn(),
    speak: jest.fn(),
  },
}));

// Mock Capacitor Share
jest.mock('@capacitor/share', () => ({
  Share: {
    share: jest.fn(),
  },
}));

// Mock Capacitor Toast
jest.mock('@capacitor/toast', () => ({
  Toast: {
    show: jest.fn(),
  },
}));

// Mock Capacitor Browser
jest.mock('@capacitor/browser', () => ({
  Browser: {
    open: jest.fn(),
    close: jest.fn(),
  },
}));

// Mock Capacitor Clipboard
jest.mock('@capacitor/clipboard', () => ({
  Clipboard: {
    write: jest.fn(),
    read: jest.fn(),
  },
}));

// Mock Capacitor Preferences
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  },
}));

// Mock Capacitor ActionSheet
jest.mock('@capacitor/action-sheet', () => ({
  ActionSheet: {
    showActions: jest.fn(),
  },
}));

// Mock Capacitor AppLauncher
jest.mock('@capacitor/app-launcher', () => ({
  AppLauncher: {
    canOpenUrl: jest.fn(),
    openUrl: jest.fn(),
  },
}));

// Mock Capacitor Browser
jest.mock('@capacitor/browser', () => ({
  Browser: {
    open: jest.fn(),
    close: jest.fn(),
  },
}));

// Mock Capacitor Camera
jest.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: jest.fn(),
    pickImages: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
  },
}));

// Mock Capacitor Clipboard
jest.mock('@capacitor/clipboard', () => ({
  Clipboard: {
    write: jest.fn(),
    read: jest.fn(),
  },
}));

// Mock Capacitor Device
jest.mock('@capacitor/device', () => ({
  Device: {
    getInfo: jest.fn(),
    getLanguageCode: jest.fn(),
    getLanguageTag: jest.fn(),
    getId: jest.fn(),
  },
}));

// Mock Capacitor Filesystem
jest.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    deleteFile: jest.fn(),
    mkdir: jest.fn(),
    rmdir: jest.fn(),
    readdir: jest.fn(),
    getUri: jest.fn(),
    stat: jest.fn(),
    rename: jest.fn(),
    copy: jest.fn(),
  },
}));

// Mock Capacitor Geolocation
jest.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
  },
}));

// Mock Capacitor Haptics
jest.mock('@capacitor/haptics', () => ({
  Haptics: {
    vibrate: jest.fn(),
    impact: jest.fn(),
    notification: jest.fn(),
    selectionStart: jest.fn(),
    selectionChanged: jest.fn(),
    selectionEnd: jest.fn(),
  },
}));

// Mock Capacitor Keyboard
jest.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    setAccessoryBarVisible: jest.fn(),
    setScroll: jest.fn(),
    setResizeMode: jest.fn(),
    setStyle: jest.fn(),
    setColor: jest.fn(),
  },
}));

// Mock Capacitor LocalNotifications
jest.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: jest.fn(),
    getPending: jest.fn(),
    registerActionTypes: jest.fn(),
    cancel: jest.fn(),
    areEnabled: jest.fn(),
    requestPermissions: jest.fn(),
    checkPermissions: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock Capacitor Network
jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock Capacitor Preferences
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  },
}));

// Mock Capacitor PushNotifications
jest.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    register: jest.fn(),
    unregister: jest.fn(),
    getDeliveredNotifications: jest.fn(),
    removeDeliveredNotifications: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
    createChannel: jest.fn(),
    deleteChannel: jest.fn(),
    listChannels: jest.fn(),
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// Mock Capacitor ScreenReader
jest.mock('@capacitor/screen-reader', () => ({
  ScreenReader: {
    isEnabled: jest.fn(),
    speak: jest.fn(),
  },
}));

// Mock Capacitor Share
jest.mock('@capacitor/share', () => ({
  Share: {
    share: jest.fn(),
  },
}));

// Mock Capacitor SplashScreen
jest.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

// Mock Capacitor StatusBar
jest.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    getInfo: jest.fn(),
    setOverlaysWebView: jest.fn(),
  },
}));

// Mock Capacitor Storage
jest.mock('@capacitor/storage', () => ({
  Storage: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  },
}));

// Mock Capacitor Toast
jest.mock('@capacitor/toast', () => ({
  Toast: {
    show: jest.fn(),
  },
}));

// 模拟 Capacitor
global.Capacitor = {
  getPlatform: () => 'ios',
  isNativePlatform: () => true
};

// 模拟 SQLite
jest.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {
    createConnection: jest.fn(),
    checkConnectionsConsistency: jest.fn(),
    isConnection: jest.fn(),
    retrieveConnection: jest.fn(),
    closeConnection: jest.fn()
  },
  SQLiteConnection: jest.fn().mockImplementation(() => ({
    createConnection: jest.fn(),
    checkConnectionsConsistency: jest.fn(),
    isConnection: jest.fn(),
    retrieveConnection: jest.fn(),
    closeConnection: jest.fn()
  })),
  SQLiteDBConnection: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    close: jest.fn(),
    execute: jest.fn(),
    query: jest.fn()
  }))
}));

// Polyfill crypto.randomUUID for test env if needed
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => Math.random().toString(36).substring(2, 10) + Date.now();
}