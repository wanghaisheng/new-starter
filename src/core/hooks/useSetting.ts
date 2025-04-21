import { useState, useCallback } from 'react';
import type { ISettingService } from '@/core/services/business/user/types/setting-service';
import { SettingService } from '@/core/services/business/user/service/setting-service';
import type { User, UserPreferences } from '@/core/lib/db/types/user';
import type { PrivacySettings, NotificationSettings, SecuritySettings } from '@/core/lib/db/types/settings';
import { useToast } from './useToast';

// TODO: Replace direct SettingService instantiation with Registry if/when available

export function useSetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [theme, setTheme] = useState<any>(null); // Replace 'any' with a Theme type if available
  const { triggerToast } = useToast();

  // For now, instantiate directly; ideally use a registry for consistency
  const service: ISettingService = new SettingService();

  const updateTheme = useCallback(
    async (themeValue: any) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await service.updateTheme(userId, themeValue);
        setTheme(updated);
        setEmpty(!updated);
        triggerToast('主题设置已更新');
        return updated;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('主题设置失败');
        setError(errorObj);
        setEmpty(true);
        triggerToast(errorObj.message);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [service, userId, triggerToast]
  );

  // Optionally, add more setting operations (privacy, notifications, etc.)

  return {
    theme,
    loading,
    error,
    empty,
    updateTheme,
  };
}

// 新增：语言设置相关操作
export function useLanguageSetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [language, setLanguage] = useState<string>('en');
  const { triggerToast } = useToast();
  // 依赖 SettingService（可后续切换为 Registry 获取实例）
  const service: ISettingService = new SettingService();

  // 加载语言设置（可扩展为实际后端获取）
  const loadLanguage = useCallback(async (user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setLanguage(user.preferences?.language || 'en');
      setEmpty(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载语言失败'));
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新语言设置
  const updateLanguage = useCallback(async (newLang: string, user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 这里假设 updateAccount 支持 language 字段
      const updated = await service.updateAccount({ ...user, preferences: { ...user.preferences, language: newLang } });
      setLanguage(newLang);
      setEmpty(false);
      triggerToast('语言设置已更新');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('语言设置失败'));
      setEmpty(true);
      triggerToast('语言设置失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return {
    language,
    loading,
    error,
    empty,
    loadLanguage,
    updateLanguage,
  };
}

// 联系方式设置
export function useContactSetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [contact, setContact] = useState<User | null>(null);
  const { triggerToast } = useToast();
  const service: ISettingService = new SettingService();

  const loadContact = useCallback(async (user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setContact(user);
      setEmpty(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载联系方式失败'));
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContact = useCallback(async (updates: Partial<User>, user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await service.updateAccount({ ...user, ...updates });
      setContact(updated);
      setEmpty(false);
      triggerToast('联系方式已更新');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('联系方式更新失败'));
      setEmpty(true);
      triggerToast('联系方式更新失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return {
    contact,
    loading,
    error,
    empty,
    loadContact,
    updateContact,
  };
}

// 发现设置
export function useDiscoverySetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const { triggerToast } = useToast();
  const service: ISettingService = new SettingService();

  const loadDiscovery = useCallback(async (user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setPreferences(user.preferences);
      setEmpty(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载发现设置失败'));
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDiscovery = useCallback(async (updates: Partial<UserPreferences>, user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await service.updateAccount({ ...user, preferences: { ...user.preferences, ...updates } });
      setPreferences(updated.preferences);
      setEmpty(false);
      triggerToast('发现设置已更新');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('发现设置更新失败'));
      setEmpty(true);
      triggerToast('发现设置更新失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return {
    preferences,
    loading,
    error,
    empty,
    loadDiscovery,
    updateDiscovery,
  };
}

// 隐私设置
export function usePrivacySetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const { triggerToast } = useToast();
  const service: ISettingService = new SettingService();

  const defaultPrivacy: PrivacySettings = {
    showProfileToEveryone: true,
    showOnlineStatus: true,
    showLastActive: true,
    showInDiscovery: true,
    allowFriendRequests: true,
    allowMessagesFromNonFriends: true,
    allowTagging: true,
    allowSearchByEmail: false,
    allowSearchByPhone: false,
    profileVisible: true,
    searchEngineIndexed: false,
    showDistance: false,
    allowDataCollection: false,
    allowPersonalizedAds: false,
    showEmailToMatches: false,
    showPhoneToMatches: false,
    allowProfileSharing: false,
  };

  const loadPrivacy = useCallback(async (user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const newPrivacy: PrivacySettings = {
        ...defaultPrivacy,
        ...user?.privacySettings,
      };
      setPrivacy(newPrivacy);
      setEmpty(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载隐私设置失败'));
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrivacy = useCallback(async (updates: Partial<PrivacySettings>, user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated: PrivacySettings = {
        ...defaultPrivacy,
        ...updates,
      };
      const updatedUser = await service.updateAccount({ ...user, privacySettings: updated });
      setPrivacy(updated);
      setEmpty(false);
      triggerToast('隐私设置已更新');
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('隐私设置更新失败'));
      setEmpty(true);
      triggerToast('隐私设置更新失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return {
    privacy,
    loading,
    error,
    empty,
    loadPrivacy,
    updatePrivacy,
  };
}

// 通知设置
export function useNotificationSetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [notification, setNotification] = useState<NotificationSettings | null>(null);
  const { triggerToast } = useToast();
  const service: ISettingService = new SettingService();

  const defaultNotification: NotificationSettings = {
    newMatches: true,
    matchMessages: true,
    profileViews: true,
    profileLikes: true,
    friendRequests: true,
    marketing: false,
    email: true,
    sms: false,
    push: true,
    appUpdates: true,
    promotions: false,
  };

  const loadNotification = useCallback(async (user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const newNotification: NotificationSettings = {
        ...defaultNotification,
        ...user?.notificationSettings,
      };
      setNotification(newNotification);
      setEmpty(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载通知设置失败'));
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNotification = useCallback(async (updates: Partial<NotificationSettings>, user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated: NotificationSettings = {
        ...defaultNotification,
        ...updates,
      };
      const updatedUser = await service.updateAccount({ ...user, notificationSettings: updated });
      setNotification(updated);
      setEmpty(false);
      triggerToast('通知设置已更新');
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('通知设置更新失败'));
      setEmpty(true);
      triggerToast('通知设置更新失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return {
    notification,
    loading,
    error,
    empty,
    loadNotification,
    updateNotification,
  };
}

// 安全设置（示例，具体字段可扩展）
export function useSecuritySetting(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const { triggerToast } = useToast();
  const service: ISettingService = new SettingService();

  const defaultSecurity: SecuritySettings = {
    twoFactorEnabled: false,
    loginHistory: [],
    emailNotifications: true,
    loginAlerts: false,
  };

  const loadSecurity = useCallback(async (user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const sec: SecuritySettings = {
        ...defaultSecurity,
        ...user?.securitySettings,
      };
      setSecurity(sec);
      setEmpty(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载安全设置失败'));
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSecurity = useCallback(async (updates: Partial<SecuritySettings>, user?: User) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const updated: SecuritySettings = {
        ...defaultSecurity,
        ...updates,
      };
      const updatedUser = await service.updateAccount({ ...user, securitySettings: updated });
      const sec: SecuritySettings = {
        ...defaultSecurity,
        ...updatedUser.securitySettings,
      };
      setSecurity(sec);
      setEmpty(false);
      triggerToast('安全设置已更新');
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('安全设置更新失败'));
      setEmpty(true);
      triggerToast('安全设置更新失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return {
    security,
    loading,
    error,
    empty,
    loadSecurity,
    updateSecurity,
  };
}
