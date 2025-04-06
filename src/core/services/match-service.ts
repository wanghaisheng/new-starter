import { User } from '@/core/lib/db/types';
import { UserService } from './user-service';
import { TestService } from './test';
import { LocationService } from './location-service';

export class MatchService {
  private static instance: MatchService;
  private userService: UserService;
  private testService: TestService;
  private locationService: LocationService;

  private constructor() {
    this.userService = UserService.getInstance();
    this.testService = TestService.getInstance();
    this.locationService = LocationService.getInstance();
  }

  public static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  public async findMatches(): Promise<User[]> {
    const currentUser = await this.userService.getCurrentUser();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    // 获取所有用户
    const users = await this.userService.getUsers();
    
    // 过滤掉当前用户
    const otherUsers = users.filter(user => user.id !== currentUser.id);

    // 计算匹配分数
    const matches = await Promise.all(
      otherUsers.map(async (user: User) => {
        const score = await this.calculateMatchScore(currentUser, user);
        return { ...user, matchScore: score };
      })
    );

    // 按匹配分数排序
    return matches
      .sort((a: User & { matchScore: number }, b: User & { matchScore: number }) => 
        (b.matchScore || 0) - (a.matchScore || 0))
      .map(({ matchScore, ...user }) => user);
  }

  private async calculateMatchScore(user1: User, user2: User): Promise<number> {
    let score = 0;

    // 1. 兴趣匹配
    const commonInterests = user1.interests.filter(interest => 
      user2.interests.includes(interest)
    );
    score += (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 100 * 0.5; // 兴趣匹配占50%权重

    // 2. 地理位置匹配
    if (user1.location && user2.location) {
      const distance = this.locationService.calculateDistance(
        user1.location.latitude,
        user1.location.longitude,
        user2.location.latitude,
        user2.location.longitude
      );
      // 距离越近，分数越高
      score += (100 - Math.min(distance / 10, 100)) * 0.5; // 地理位置占50%权重
    }

    return Math.round(score);
  }

  public async likeUser(userId: string): Promise<void> {
    const currentUser = await this.userService.getCurrentUser();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    // 检查对方是否已经喜欢了当前用户
    const targetUser = await this.userService.getUserById(userId);
    if (!targetUser) {
      throw new Error('用户不存在');
    }

    // 创建匹配记录
    await this.userService.createMatch([currentUser.id, userId]);

    // 发送匹配通知
    await this.userService.sendMessage(
      `${currentUser.id}-${userId}`,
      currentUser.id,
      userId,
      '我们匹配成功了！',
      'system'
    );
    await this.userService.sendMessage(
      `${userId}-${currentUser.id}`,
      userId,
      currentUser.id,
      '我们匹配成功了！',
      'system'
    );
  }

  public async dislikeUser(userId: string): Promise<void> {
    const currentUser = await this.userService.getCurrentUser();
    if (!currentUser) {
      throw new Error('用户未登录');
    }

    // 创建不喜欢记录
    await this.userService.createMatch([currentUser.id, userId]);
  }
} 