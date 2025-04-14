import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';
import { Match, CreateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';

export interface UseMatchesResult {
  matches: Match[];
  matchedUsers: User[];
  loading: boolean;
  error: Error | null;
  getUserMatches: (userId: string) => Promise<Match[]>;
  createMatch: (userId: string, targetUserId: string) => Promise<Match>;
  updateMatch: (matchId: string, data: Partial<Match>) => Promise<Match>;
  deleteMatch: (matchId: string) => Promise<void>;
  getMatchedUsers: (userId: string) => Promise<User[]>;
  acceptMatch: (matchId: string) => Promise<Match>;
  rejectMatch: (matchId: string) => Promise<Match>;
}

export function useMatches(): UseMatchesResult {
  const { isAuthenticated, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);

  const matchApi = useApi(() => Promise.resolve(matches), {
    offlineFirst: true,
    requireAuth: true
  });

  const getUserMatches = useCallback(async (userId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.getMatches(userId);
    });
    setMatches(result);
    return result;
  }, [matchApi, isAuthenticated]);

  const createMatch = useCallback(async (userId: string, targetUserId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      const now = new Date();
      const matchData: Match = {
        users: [userId, targetUserId],
        status: 'pending',
        id: '', // 将由服务生成
        createdAt: now,
        updatedAt: now
      };
      return service.createMatch(matchData);
    });
    setMatches(prev => [...prev, result]);
    return result;
  }, [matchApi, isAuthenticated]);

  const updateMatch = useCallback(async (matchId: string, data: Partial<Match>) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.updateMatch(matchId, data);
    });
    setMatches(prev => prev.map(match => match.id === matchId ? result : match));
    return result;
  }, [matchApi, isAuthenticated]);

  const deleteMatch = useCallback(async (matchId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      await service.deleteMatch(matchId);
    });
    setMatches(prev => prev.filter(match => match.id !== matchId));
  }, [matchApi, isAuthenticated]);

  const getMatchedUsers = useCallback(async (userId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      const userMatches = await service.getMatches(userId);
      const matchedUserIds = userMatches
        .filter(match => match.status === 'matched' && match.users.includes(userId))
        .map(match => match.users.find(id => id !== userId))
        .filter((id): id is string => id !== undefined);
      
      const matchedUsers = await Promise.all(
        matchedUserIds.map(id => service.getUser(id))
      );
      
      return matchedUsers.filter((user): user is User => user !== null);
    });
    setMatchedUsers(result);
    return result;
  }, [matchApi, isAuthenticated]);

  const acceptMatch = useCallback(async (matchId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.updateMatch(matchId, { status: 'matched' });
    });
    setMatches(prev => prev.map(match => match.id === matchId ? result : match));
    return result;
  }, [matchApi, isAuthenticated]);

  const rejectMatch = useCallback(async (matchId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.updateMatch(matchId, { status: 'rejected' });
    });
    setMatches(prev => prev.map(match => match.id === matchId ? result : match));
    return result;
  }, [matchApi, isAuthenticated]);

  // 自动加载用户匹配列表
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      getUserMatches(user.id);
    }
  }, [isAuthenticated, user?.id, getUserMatches]);

  return {
    matches,
    matchedUsers,
    loading: matchApi.loading,
    error: matchApi.error,
    getUserMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    getMatchedUsers,
    acceptMatch,
    rejectMatch
  };
} 