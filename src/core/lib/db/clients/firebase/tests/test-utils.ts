/**
 * Firebase 客户端测试工具
 * 提供测试辅助函数和配置
 */

import { FirebaseConfig } from '@/core/lib/db/clients/firebase/firebase-config';
import { FirebaseOptions } from 'firebase/app';

/**
 * 获取用于测试的 Firebase 模拟器配置
 * @returns Firebase配置对象
 */
export function getEmulatorConfig(): FirebaseConfig {
  // 测试用 Firebase 选项
  const firebaseOptions: FirebaseOptions = {
    apiKey: 'test-api-key',
    authDomain: 'test-project.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456789'
  };

  return {
    name: 'test-db',
    version: 1,
    engine: 'firebase',
    firebaseOptions,
    
    // 开启模拟器
    firestore: {
      useEmulator: true,
      emulatorHost: 'localhost',
      emulatorPort: 8080
    },
    
    // 离线配置
    offline: {
      maxStorageSize: 10 * 1024 * 1024,
      maxEntitiesPerTable: 1000,
      compressionEnabled: false,
      encryptionEnabled: false,
      enabled: true
    },
    
    // 表结构定义
    tables: {
      users: {
        columns: {
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'number' }
        }
      },
      matches: {
        columns: {
          userId1: { type: 'string' },
          userId2: { type: 'string' },
          matchDate: { type: 'date' }
        }
      },
      messages: {
        columns: {
          senderId: { type: 'string' },
          receiverId: { type: 'string' },
          content: { type: 'string' },
          timestamp: { type: 'date' }
        }
      }
    }
  };
}

/**
 * 创建测试用户对象
 * @param overrides 要覆盖的字段
 * @returns 用户对象
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    name: '测试用户',
    email: 'test@example.com',
    age: 30,
    ...overrides
  };
}

// 测试用户类型
export interface TestUser {
  id?: string;
  name: string;
  email: string;
  age: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 扩展的基础实体类型，用于测试
export interface TestEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
} 