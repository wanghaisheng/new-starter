import { User } from '@/core/lib/db/types/user';
import { MockDatabaseClient } from './mock-client';
import { Logger } from '@/core/lib/utils/logger';
import { Photo } from '@/core/lib/db/types/photo';

const logger = new Logger('DemoUsers');

/**
 * 添加演示用户到模拟数据库
 * @param client 模拟数据库客户端
 * 
 * 演示用户登录凭据:
 * - 邮箱: demo@example.com
 * - 密码: password
 * 
 * 注意: 在mock模式下，所有用户都使用相同的密码 "password"
 */
export async function addDemoUsers(client: MockDatabaseClient): Promise<void> {
  try {
    logger.info('Adding demo users to mock database');
    
    // 检查是否已经存在演示用户
    const existingUsers = await client.query<User>('users', {
      filter: (user: User) => user.email === 'demo@example.com'
    });
    
    if (existingUsers.data.length > 0) {
      logger.info('Demo users already exist, skipping');
      return;
    }
    
    // 创建演示用户 (密码统一为 "password")
    const demoUser: User = {
      id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@example.com',
      phoneNumber: '13800000000',
      birthDate: new Date('1990-01-01'),
      gender: 'male',
      bio: '这是一个演示用户，用于测试登录功能。使用密码 "password" 登录。',
      interests: ['编程', '旅行', '音乐'],
      photos: [
        {
          id: 'photo-demo-1',
          url: 'https://example.com/photos/demo-1.jpg',
          isMain: true,
          order: 1,
          userId: 'demo-user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        city: '北京',
        country: '中国'
      },
      preferences: {
        ageRange: {
          min: 25,
          max: 40
        },
        distance: 50,
        gender: ['female'],
        interests: ['旅行', '音乐', '美食']
      },
      isVerified: true,
      lastActive: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      phoneVerified: true,
      isOnline: true,
      provider: 'email',
      displayName: 'Demo User',
      privacySettings: {
        showProfileToEveryone: true,
        showOnlineStatus: true,
        showLastActive: true,
        showInDiscovery: true,
        showDistance: true,
        allowDataCollection: true,
        allowPersonalizedAds: true,
        showEmailToMatches: false,
        showPhoneToMatches: false,
        allowProfileSharing: true
      },
      notificationSettings: {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: false
      },
      matching: {
        completedTests: [],
        testWeights: {},
        testResults: {}
      }
    };
    
    // 添加用户到数据库
    await client.create('users', demoUser);
    
    logger.info('Demo users added successfully');
    logger.info('Demo user credentials:', {
      email: 'demo@example.com',
      password: 'password'
    });
  } catch (error) {
    logger.error('Failed to add demo users', { error });
    throw error;
  }
} 