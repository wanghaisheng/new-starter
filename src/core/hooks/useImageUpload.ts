import { useState } from 'react';

export function useImageUpload() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(true);

  // 上传图片（模拟，实际可对接服务）
  const uploadPhoto = async (fileUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      // 实际应为 File/FileList，这里演示用 URL fetch Blob
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error('图片下载失败');
      const blob = await res.blob();
      const filename = fileUrl.split('/').pop() || `photo-${Date.now()}`;
      // 这里模拟上传，直接用 URL 代替
      setPhotos(prev => {
        const next = [...prev, URL.createObjectURL(blob)];
        setEmpty(next.length === 0);
        return next;
      });
    } catch (e: any) {
      setError(e.message || '上传失败');
      throw e;
    } finally {
      setLoading(false);
      setEmpty(photos.length === 0);
    }
  };

  // 删除图片（仅本地模拟）
  const removePhoto = async (idx: number) => {
    setLoading(true);
    setError(null);
    try {
      setPhotos(prev => {
        const next = prev.filter((_, i) => i !== idx);
        setEmpty(next.length === 0);
        return next;
      });
    } catch (e: any) {
      setError(e.message || '删除失败');
      throw e;
    } finally {
      setLoading(false);
      setEmpty(photos.length === 0);
    }
  };

  return { photos, uploadPhoto, removePhoto, loading, error, empty };
}
