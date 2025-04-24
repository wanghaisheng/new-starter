import type { User } from '@/core/lib/db/types/user.types';
import type { PrivacySettings, NotificationSettings, SecuritySettings } from '@/core/lib/db/types/settings.types';

export interface ISettingService {
  updateAccount(data: Partial<User>): Promise<User>;
  updatePrivacy(userId: string, privacy: PrivacySettings): Promise<PrivacySettings>;
  updateSecurity(userId: string, security: SecuritySettings): Promise<SecuritySettings>;
  updateNotifications(userId: string, notifications: NotificationSettings): Promise<NotificationSettings>;
  updateTheme(userId: string, theme: any): Promise<any>;
}
