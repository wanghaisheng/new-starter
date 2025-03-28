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