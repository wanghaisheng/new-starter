import { useState } from 'react';
import { useService } from '@/providers/ServiceProvider';
import { useToast } from './useToast';

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const { triggerToast } = useToast();
  // 使用ServiceProvider获取服务实例
  const { userService } = useService();

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
