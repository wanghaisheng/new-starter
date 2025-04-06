import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { Match, CreateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { DataServiceFactory } from '@/core/services/data-service-factory';

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
}

export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);

  const matchApi = useApi(() => Promise.resolve(matches), {
    offlineFirst: true,
    useHybridClient: true
  });

  const getUserMatches = useCallback(async (userId: string) => {
    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.getMatches(userId);
    });
    setMatches(result);
    return result;
  }, [matchApi]);

  const createMatch = useCallback(async (userId: string, targetUserId: string) => {
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
  }, [matchApi]);

  const updateMatch = useCallback(async (matchId: string, data: Partial<Match>) => {
    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.updateMatch(matchId, data);
    });
    setMatches(prev => prev.map(match => match.id === matchId ? result : match));
    return result;
  }, [matchApi]);

  const deleteMatch = useCallback(async (matchId: string) => {
    await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      await service.deleteMatch(matchId);
    });
    setMatches(prev => prev.filter(match => match.id !== matchId));
  }, [matchApi]);

  const getMatchedUsers = useCallback(async (userId: string) => {
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
  }, [matchApi]);

  return {
    matches,
    matchedUsers,
    loading: matchApi.loading,
    error: matchApi.error,
    getUserMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    getMatchedUsers
  };
} 