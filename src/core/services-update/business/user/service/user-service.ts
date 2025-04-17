import { IUserService } from '../types/user-service';
import { IDataService } from '@/core/services-update/data/types';
import { User } from '@/core/lib/db/models';
import { NetworkService } from '@/core/services/data/network-service';

/**
 * 领域聚合用户服务，负责离线同步、网络监听、批量等复合业务逻辑
 */
export class UserDomainService {
  private static instance: UserDomainService;
  private offlineProfileUpdates: { userId: string; data: Partial<User>; timestamp: Date }[] = [];
  private offlineStorageKey = 'offline_profile_updates';
  private currentUser: User | null = null;
  private initialized = false;

  constructor(
    private userService: IUserService,
    private networkService: NetworkService = NetworkService.getInstance()
  ) {
    this.loadOfflineProfileUpdates();
    this.networkService.addNetworkStatusListener((status) => {
      if (status.connected && this.offlineProfileUpdates.length > 0) {
        this.syncOfflineProfileUpdates();
      }
    });
  }

  public static getInstance(userService: IUserService): UserDomainService {
    if (!UserDomainService.instance) {
      UserDomainService.instance = new UserDomainService(userService);
    }
    return UserDomainService.instance;
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    // 可扩展初始化逻辑
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser || this.userService.getCurrentUser();
  }

  async saveCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
    await this.userService.saveCurrentUser(user);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }> {
    if (this.networkService.getConnectionStatus() === 'online') {
      return this.userService.updateUserProfile(userId, updates);
    } else {
      this.offlineProfileUpdates.push({ userId, data: updates, timestamp: new Date() });
      this.persistOfflineProfileUpdates();
      return { success: true };
    }
  }

  async syncOfflineProfileUpdates(): Promise<number> {
    if (this.offlineProfileUpdates.length === 0) return 0;
    let count = 0;
    for (const update of this.offlineProfileUpdates) {
      await this.userService.updateUserProfile(update.userId, update.data);
      count++;
    }
    this.offlineProfileUpdates = [];
    this.persistOfflineProfileUpdates();
    return count;
  }

  // 兼容旧服务的可序列化持久化方法
  private persistOfflineProfileUpdates(): void {
    try {
      const serializable = this.offlineProfileUpdates.map(update => ({
        ...update,
        timestamp: update.timestamp instanceof Date ? update.timestamp.toISOString() : update.timestamp
      }));
      localStorage.setItem('offlineProfileUpdates', JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to persist offline profile updates:', error);
    }
  }

  // 兼容旧服务的 ISO 字符串反序列化
  private loadOfflineProfileUpdates(): void {
    try {
      const data = localStorage.getItem('offlineProfileUpdates');
      if (data) {
        this.offlineProfileUpdates = JSON.parse(data).map((update: any) => ({
          ...update,
          timestamp: typeof update.timestamp === 'string' ? new Date(update.timestamp) : update.timestamp
        }));
      } else {
        this.offlineProfileUpdates = [];
      }
    } catch (error) {
      console.error('Failed to load offline profile updates:', error);
      this.offlineProfileUpdates = [];
    }
  }

  // 添加离线资料更新到队列
  private addOfflineProfileUpdate(userId: string, data: Partial<User>): void {
    const update = { userId, data, timestamp: new Date() };
    this.offlineProfileUpdates.push(update);
    this.persistOfflineProfileUpdates();
  }

  // 计算年龄
  public calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // 其它聚合方法可继续扩展，如批量、推荐等
}
