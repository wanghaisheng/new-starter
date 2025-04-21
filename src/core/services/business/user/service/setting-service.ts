import { ISettingService } from '../types/setting-service';
import { User } from '@/core/lib/db/types/user';

export class SettingService implements ISettingService {
  async updateAccount(data: Partial<User>) {
    return { ...data, id: data.id || 'mock-id' } as User;
  }
  async updatePrivacy(userId: string, privacy: any) {
    return privacy;
  }
  async updateSecurity(userId: string, security: any) {
    return security;
  }
  async updateNotifications(userId: string, notifications: any) {
    return notifications;
  }
  async updateTheme(userId: string, theme: any) {
    return theme;
  }
}
