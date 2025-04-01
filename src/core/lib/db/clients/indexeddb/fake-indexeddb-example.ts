/**
 * Fake IndexedDB 使用示例
 * 
 * 此文件展示了如何在测试环境中使用 fake-indexeddb
 */

import { 
  setupFakeIndexedDB, 
  resetFakeIndexedDB, 
  IndexedDBTestHelper,
  fakeIndexedDB
} from './fake-indexeddb';

// 类型定义示例
interface TestUser {
  id?: number;
  name: string;
  email: string;
  age: number;
  createdAt?: Date;
}

/**
 * 示例1: 基本用法
 * 
 * 使用底层API直接操作 fake-indexeddb
 */
async function basicExample(): Promise<void> {
  // 设置全局 IndexedDB 环境
  setupFakeIndexedDB();
  
  // 打开数据库
  const dbRequest = fakeIndexedDB.open('TestDB', 1);
  
  // 处理数据库升级
  dbRequest.onupgradeneeded = (event) => {
    const db = dbRequest.result;
    
    // 创建对象存储
    const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    
    // 创建索引
    usersStore.createIndex('by_email', 'email', { unique: true });
    usersStore.createIndex('by_name', 'name', { unique: false });
    
    console.log('数据库创建完成');
  };
  
  // 等待数据库打开
  await new Promise<void>((resolve, reject) => {
    dbRequest.onsuccess = () => {
      console.log('数据库连接成功');
      resolve();
    };
    dbRequest.onerror = () => {
      console.error('数据库连接失败:', dbRequest.error);
      reject(dbRequest.error);
    };
  });
  
  const db = dbRequest.result;
  
  // 添加示例数据
  try {
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    
    // 添加用户
    store.add({
      name: '张三',
      email: 'zhangsan@example.com',
      age: 30,
      createdAt: new Date()
    });
    
    store.add({
      name: '李四',
      email: 'lisi@example.com',
      age: 25,
      createdAt: new Date()
    });
    
    // 等待事务完成
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    console.log('添加数据成功');
    
    // 查询数据
    const readTx = db.transaction('users', 'readonly');
    const readStore = readTx.objectStore('users');
    const emailIndex = readStore.index('by_email');
    
    const request = emailIndex.get('zhangsan@example.com');
    
    // 等待查询完成
    await new Promise<void>((resolve) => {
      request.onsuccess = () => {
        const user = request.result;
        console.log('查询结果:', user);
        resolve();
      };
    });
    
  } finally {
    // 关闭数据库
    db.close();
    
    // 重置 IndexedDB 环境
    resetFakeIndexedDB();
  }
}

/**
 * 示例2: 使用 IndexedDBTestHelper
 * 
 * 使用帮助类简化测试代码
 */
async function helperExample(): Promise<void> {
  // 设置全局 IndexedDB 环境
  setupFakeIndexedDB();
  
  // 创建测试帮助类
  const dbHelper = new IndexedDBTestHelper('TestDB');
  
  try {
    // 打开数据库并设置架构
    await dbHelper.openDatabase(1, (db) => {
      // 创建存储和索引
      const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
      store.createIndex('by_email', 'email', { unique: true });
      store.createIndex('by_name', 'name', { unique: false });
    });
    
    // 添加测试数据
    const testUsers: TestUser[] = [
      { name: '张三', email: 'zhangsan@example.com', age: 30, createdAt: new Date() },
      { name: '李四', email: 'lisi@example.com', age: 25, createdAt: new Date() },
      { name: '王五', email: 'wangwu@example.com', age: 28, createdAt: new Date() }
    ];
    
    await dbHelper.addTestData('users', testUsers);
    console.log('添加测试数据成功');
    
    // 获取所有数据
    const allUsers = await dbHelper.getAllData<TestUser>('users');
    console.log('所有用户:', allUsers);
    
    // 清空存储
    await dbHelper.clearStore('users');
    console.log('清空用户存储成功');
    
    // 验证是否清空
    const emptyUsers = await dbHelper.getAllData<TestUser>('users');
    console.log('清空后用户数量:', emptyUsers.length);
    
  } finally {
    // 清理
    await dbHelper.deleteDatabase();
    
    // 重置 IndexedDB 环境
    resetFakeIndexedDB();
  }
}

/**
 * 示例3: 在单元测试中使用
 * 
 * 以下代码展示了如何在 Jest 或其他测试框架中使用
 */
async function testExample(): Promise<void> {
  // Jest 示例 (注释掉的代码)
  /*
  // 在测试前设置
  beforeAll(() => {
    setupFakeIndexedDB();
  });
  
  // 在测试后清理
  afterAll(() => {
    resetFakeIndexedDB();
  });
  
  // 在每个测试前重置数据库
  beforeEach(() => {
    resetFakeIndexedDB();
  });
  
  // 测试用例
  test('should store and retrieve data', async () => {
    const helper = new IndexedDBTestHelper('TestDB');
    
    await helper.openDatabase(1, (db) => {
      db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    });
    
    const testUser = { name: '测试用户', email: 'test@example.com', age: 30 };
    await helper.addTestData('users', [testUser]);
    
    const users = await helper.getAllData<TestUser>('users');
    
    expect(users.length).toBe(1);
    expect(users[0].name).toBe('测试用户');
    
    await helper.deleteDatabase();
  });
  */
  
  console.log('测试示例代码 - 实际使用时需要在测试框架中运行');
}

// 运行示例
export async function runFakeIndexedDBExamples(): Promise<void> {
  console.log('===== 开始基本示例 =====');
  await basicExample();
  
  console.log('\n===== 开始帮助类示例 =====');
  await helperExample();
  
  console.log('\n===== 测试框架示例说明 =====');
  await testExample();
}

export default {
  basicExample,
  helperExample,
  testExample,
  runFakeIndexedDBExamples
}; 