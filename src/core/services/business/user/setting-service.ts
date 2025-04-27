import { ISettingService } from './types/setting-service';
import { User } from '@/core/lib/db/types/user.types';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import type { IDataService } from '@/core/services/data/types';

export class SettingService implements ISettingService {
  private dataService: IDataService;

  constructor(dataService?: IDataService) {
    // 支持外部注入，默认 fallback 到全局注册表
    const resolved = dataService ?? DataServiceRegistry.get('default');
    if (!resolved) throw new Error('[SettingService] DataServiceRegistry default 实例未注册');
    this.dataService = resolved;
  }

  async updateAccount(data: Partial<User>) {
    // 示例：假设有 user 表
    if (!data.id) throw new Error('缺少 user id');
    await this.dataService.update('users', data.id, data);
    return { ...data } as User;
  }
  async updatePrivacy(userId: string, privacy: any) {
    // 示例：假设有 user 表
    await this.dataService.update('users', userId, { privacySettings: privacy });
    return privacy;
  }
  async updateSecurity(userId: string, security: any) {
    await this.dataService.update('users', userId, { securitySettings: security });
    return security;
  }
  async updateNotifications(userId: string, notifications: any) {
    await this.dataService.update('users', userId, { notificationSettings: notifications });
    return notifications;
  }
  async updateTheme(userId: string, theme: any) {
    await this.dataService.update('users', userId, { theme });
    return theme;
  }
}
