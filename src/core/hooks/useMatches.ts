import { useState, useEffect, useCallback, useRef } from 'react';
import { MatchServiceRegistry } from '@/core/services/business/match/registry/match-service-registry';
import type { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import type { User } from '@/core/lib/db/types/user';
import type { IMatchService, MatchServiceOptions } from '@/core/services/business/match/types/match-service';
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

/**
 * useMatches 支持多维 options/context 分流
 * @param options 必须包含 userId，可包含 provider/brand/region/featureFlag 等所有 context 维度
 */
export function useMatches(options: MatchServiceOptions & { userId: string }): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const serviceRef = useRef<IMatchService | null>(null);

  useEffect(() => {
    const dataService = DataServiceFactory.createService();
    // 直接透传 options，registry 内部自动分流
    const provider = MatchServiceRegistry.getInstance().getProvider(
      (options.provider as any) || 'remote',
      'default',
      dataService,
      options
    );
    serviceRef.current = provider ? provider() : null;
    if (options.userId) getUserMatches(options.userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options)]);

  const getUserMatches = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      // 修复：getUserMatches 只传 1 个参数
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
      await getUserMatches(options.userId);
      return match;
    } catch (err: any) {
      setError({ type: 'create', message: err?.message || '创建匹配失败' });
      triggerToast(err?.message || '创建匹配失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUserMatches, options.userId, triggerToast]);

  const updateMatch = useCallback(async (matchId: string, data: UpdateMatchData) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const match = await serviceRef.current.updateMatch(matchId, data);
      await getUserMatches(options.userId);
      return match;
    } catch (err: any) {
      setError({ type: 'update', message: err?.message || '更新匹配失败' });
      triggerToast(err?.message || '更新匹配失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUserMatches, options.userId, triggerToast]);

  const deleteMatch = useCallback(async (matchId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      await serviceRef.current.deleteMatch(matchId);
      await getUserMatches(options.userId);
    } catch (err: any) {
      setError({ type: 'delete', message: err?.message || '删除匹配失败' });
      triggerToast(err?.message || '删除匹配失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getUserMatches, options.userId, triggerToast]);

  const refresh = useCallback(async (uid: string) => {
    await getUserMatches(uid);
  }, [getUserMatches]);

  return { matches, loading, error, empty, getUserMatches, createMatch, updateMatch, deleteMatch, refresh };
}
