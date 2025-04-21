import { useState, useEffect } from 'react';
import { Photo } from '@/core/lib/db/types/photo';
import { PhotoRepository } from '@/core/lib/db/repositories/photo-repository';
import { useServiceRegistry } from '@/core/services/business/registry/useServiceRegistry';

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
  const serviceRegistry = useServiceRegistry();
  const photoRepo = serviceRegistry.get(PhotoRepository);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await photoRepo.findByUserIdOrdered(userId);
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
      await photoRepo.updateCaption(photoId, caption);
      await fetchPhotos();
    } catch (e: any) {
      setError({ type: 'update', message: e?.message || '更新标题失败' });
    }
  };

  const updateTags = async (photoId: string, tags: string[]) => {
    try {
      await photoRepo.updateTags(photoId, tags);
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
    updateTags,
  };
}
