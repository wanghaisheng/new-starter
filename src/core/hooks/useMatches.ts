import { useState, useEffect, useCallback, useRef } from 'react';
import { MatchServiceRegistry } from '@/core/services/business/match/registry/match-service-registry';
import type { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import type { User } from '@/core/lib/db/types/user';
import type { IMatchService } from '@/core/services/business/match/types/match-service';
import { useToast } from './useToast';
import { DataServiceFactory } from '@/core/services/data/factory/data-service-factory';

export interface UseMatchesResult {
  matches: Match[];
  loading: boolean;
  error: null | { type: string; message: string };
  empty: boolean;
  getUserMatches: (userId: string) => Promise<Match[]>;
  createMatch: (data: CreateMatchData) => Promise<Match>;
  updateMatch: (matchId: string, data: UpdateMatchData) => Promise<Match>;
  deleteMatch: (matchId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
}

export function useMatches(userId: string): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const serviceRef = useRef<IMatchService | null>(null);

  useEffect(() => {
    const allowedTypes = ['mock', 'remote', 'hybrid', 'brandA', 'brandB'] as const;
    type MatchServiceType = typeof allowedTypes[number];
    const envType = process.env.NEXT_PUBLIC_MATCH_SERVICE_TYPE;
    const type: MatchServiceType = allowedTypes.includes(envType as MatchServiceType)
      ? (envType as MatchServiceType)
      : (process.env.NODE_ENV === 'development' ? 'mock' : 'remote');
    const dataService = DataServiceFactory.createService();
    const provider = MatchServiceRegistry.getInstance().getProvider(type, 'default', dataService);
    serviceRef.current = provider ? provider() : null;
    if (userId) getUserMatches(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const getUserMatches = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const data = await serviceRef.current.getUserMatches(uid);
      setMatches(data);
      setEmpty(data.length === 0);
      return data;
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取匹配失败' });
      setEmpty(true);
      triggerToast(err?.message || '获取匹配失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  const createMatch = useCallback(async (data: CreateMatchData) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const match = await serviceRef.current.createMatch(data);
      await getUserMatches(data.users[0]);
      return match;
    } catch (err: any) {
      setError({ type: 'create', message: err?.message || '创建匹配失败' });
      triggerToast(err?.message || '创建匹配失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUserMatches, triggerToast]);

  const updateMatch = useCallback(async (matchId: string, data: UpdateMatchData) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const match = await serviceRef.current.updateMatch(matchId, data);
      await getUserMatches(userId);
      return match;
    } catch (err: any) {
      setError({ type: 'update', message: err?.message || '更新匹配失败' });
      triggerToast(err?.message || '更新匹配失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUserMatches, triggerToast, userId]);

  const deleteMatch = useCallback(async (matchId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      await serviceRef.current.deleteMatch(matchId);
      await getUserMatches(userId);
    } catch (err: any) {
      setError({ type: 'delete', message: err?.message || '删除匹配失败' });
      triggerToast(err?.message || '删除匹配失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUserMatches, triggerToast, userId]);

  const refresh = getUserMatches;

  return {
    matches,
    loading,
    error,
    empty,
    getUserMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    refresh,
  };
}
