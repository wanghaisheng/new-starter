import { Match } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services-update/data/types';

/**
 * 获取用户所有相关匹配（通用聚合逻辑）
 */
export async function getUserRelatedMatches(dataService: IDataService, userId: string): Promise<Match[]> {
  const matches = await dataService.query<Match>('matches', {
    $or: [
      { users: [userId] },
      { users: { $elemMatch: userId } },
    ]
  });
  return matches.filter(match => match.users.includes(userId));
}

/**
 * 获取已匹配用户列表（通用聚合逻辑）
 */
export async function getMatchedUsers(dataService: IDataService, userId: string): Promise<User[]> {
  const matches = await getUserRelatedMatches(dataService, userId);
  const matchedUserIds = matches
    .filter(match => match.status === 'matched')
    .map(match => match.users[0] === userId ? match.users[1] : match.users[0]);
  if (matchedUserIds.length === 0) return [];
  const users = await Promise.all(
    matchedUserIds.map(id => dataService.findOne<User>('users', id))
  );
  return users.filter((user): user is User => !!user);
}

/**
 * 通用过滤：按字段值过滤匹配
 */
export function filterMatchesByField(matches: Match[], field: keyof Match, value: any): Match[] {
  return matches.filter(match => match[field] === value);
}

/**
 * 通用排序：按字段降序排列
 */
export function sortMatchesByFieldDesc(matches: Match[], field: keyof Match): Match[] {
  return [...matches].sort((a, b) => {
    if (a[field] === b[field]) return 0;
    return a[field] < b[field] ? 1 : -1;
  });
}

/**
 * 通用排序：按字段升序排列
 */
export function sortMatchesByFieldAsc(matches: Match[], field: keyof Match): Match[] {
  return [...matches].sort((a, b) => {
    if (a[field] === b[field]) return 0;
    return a[field] > b[field] ? 1 : -1;
  });
}

/**
 * 通用分组：按字段分组
 */
export function groupMatchesByField(matches: Match[], field: keyof Match): Record<string, Match[]> {
  return matches.reduce((groups, match) => {
    const key = String(match[field]);
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
    return groups;
  }, {} as Record<string, Match[]>);
}
