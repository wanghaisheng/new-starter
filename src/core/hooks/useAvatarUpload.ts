import { useState } from 'react';
import { UserServiceRegistry } from '@/core/services/business/user/registry/user-service-registry';
import { useToast } from './useToast';

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const { triggerToast } = useToast();
  // 推荐 hooks 场景统一用 provider 获取实例
  const userService = UserServiceRegistry.getProvider()();

  // 推荐：直接更新用户资料的头像字段
  const uploadAvatar = async (userId: string, avatarUrl: string) => {
    setUploading(true);
    setUploadError(null);
    try {
      await userService.updateUserProfile(userId, { avatar: avatarUrl });
      triggerToast('头像上传成功');
    } catch (e: any) {
      setUploadError(e);
      triggerToast(e.message || '头像上传失败');
      throw e;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading, uploadError };
}
