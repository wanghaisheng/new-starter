import { useState, useEffect } from 'react';
import { Photo } from '@/core/lib/db/types/photo.types';
import { PhotoServiceRegistry } from '@/core/services/business/photo/registry/photo-service-registry';

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  error: null | { type: string; message: string };
  empty: boolean;
  refresh: () => Promise<void>;
  updateCaption: (photoId: string, caption: string) => Promise<void>;
  updateTags: (photoId: string, tags: string[]) => Promise<void>;
}

export function usePhotos(userId: string): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const photoService = PhotoServiceRegistry.getDefaultService();

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await photoService.findByUserIdOrdered(userId);
      setPhotos(data);
      setEmpty(data.length === 0);
    } catch (e: any) {
      setError({ type: 'fetch', message: e?.message || '获取照片失败' });
    } finally {
      setLoading(false);
    }
  };

  const updateCaption = async (photoId: string, caption: string) => {
    try {
      await photoService.updateCaption(photoId, caption);
      await fetchPhotos();
    } catch (e: any) {
      setError({ type: 'update', message: e?.message || '更新标题失败' });
    }
  };

  const updateTags = async (photoId: string, tags: string[]) => {
    try {
      await photoService.updateTags(photoId, tags);
      await fetchPhotos();
    } catch (e: any) {
      setError({ type: 'update', message: e?.message || '更新标签失败' });
    }
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    photos,
    loading,
    error,
    empty,
    refresh: fetchPhotos,
    updateCaption,
    updateTags
  };
}
