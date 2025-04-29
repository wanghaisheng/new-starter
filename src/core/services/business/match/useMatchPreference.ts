import { useState, useEffect, useCallback } from 'react';
import { useService } from '@/providers/ServiceProvider';
import type { MatchPreference } from './match-preference-service';

export function useMatchPreference(userId: string) {
  const { userService } = useService();
  const [preference, setPreference] = useState<MatchPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPreference = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await userService.getUserById(userId);
      setPreference(user?.preferences || { algoOrder: [], disableAlgos: [] });
    } catch (e: any) {
      setError(e.message || '加载失败');
    }
    setLoading(false);
  }, [userId, userService]);

  const savePreference = useCallback(async (data: Partial<MatchPreference>) => {
    setSaving(true);
    setError(null);
    try {
      await userService.updatePreference(userId, data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
      await fetchPreference();
    } catch (e: any) {
      setError(e.message || '保存失败');
    }
    setSaving(false);
  }, [userId, fetchPreference, userService]);

  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  return {
    preference,
    loading,
    error,
    saving,
    saveSuccess,
    savePreference,
    refresh: fetchPreference
  };
}
