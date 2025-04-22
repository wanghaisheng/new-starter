// 迁移�?src/core/types/settings.ts
// 此处�?settings 相关类型定义

// 用户设置相关类型定义
export interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  notificationsEnabled: boolean;
}

// 用户隐私设置（字段补全，确保与业务一致）
export interface PrivacySettings {
  showProfileToEveryone: boolean;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showInDiscovery: boolean;
  allowFriendRequests: boolean;
  allowMessagesFromNonFriends: boolean;
  allowTagging: boolean;
  allowSearchByEmail: boolean;
  allowSearchByPhone: boolean;
  profileVisible: boolean;
  searchEngineIndexed: boolean;
  showDistance: boolean;
  allowDataCollection: boolean;
  allowPersonalizedAds: boolean;
  showEmailToMatches: boolean;
  showPhoneToMatches: boolean;
  allowProfileSharing: boolean;
}

// 用户通知设置（字段补全，确保与业务一致）
export interface NotificationSettings {
  newMatches: boolean;
  matchMessages: boolean;
  profileViews: boolean;
  profileLikes: boolean;
  friendRequests: boolean;
  marketing: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  appUpdates: boolean;
  promotions: boolean;
}

// 用户安全设置（字段补全，确保与业务一致）
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginHistory: Array<{ time: string; ip: string }>;
  emailNotifications: boolean;
  loginAlerts: boolean;
}

// 可扩展其�?settings 相关类型
