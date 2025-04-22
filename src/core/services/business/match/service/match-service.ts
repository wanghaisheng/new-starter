import { IMatchService } from '../types/match-service';
import { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match';
import { User } from '@/core/lib/db/types/user';
import { IMatchAIAdapter } from '../ai-adapters/match-ai-adapter';
import { DefaultMatchAIAdapter } from '../ai-adapters/default-match-ai-adapter';
import { MatchServiceFactory, MatchServiceType, MatchServiceOptions } from '../factory/match-service-factory';
import type { IDataService } from '@/core/services/data/types';

/**
 * MatchService：负责根据地理位置、用户标签等匹配机制，触发匹配等
 */
export class MatchService implements IMatchService {
  private adapter: IMatchService;
  private aiAdapter: IMatchAIAdapter;
  private userService: any;
  private dataService: IDataService;

  constructor(type: MatchServiceType = 'mock', options: MatchServiceOptions = {}, dataService: IDataService, aiAdapter?: IMatchAIAdapter, userService?: any) {
    this.adapter = MatchServiceFactory.getAdapter(type, options, dataService) ?? MatchServiceFactory.getAdapter('mock', {}, dataService)!;
    this.aiAdapter = aiAdapter || new DefaultMatchAIAdapter();
    this.userService = userService;
    this.dataService = dataService;
  }

  /**
   * quiz 结果联动入口：接收标签和报告，自动刷新用户标签、触发推荐等
   */
  async onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void> {
    return this.adapter.onQuizResult(userId, tags, report, userService);
  }

  /**
   * 根据最新标签/画像刷新推荐池
   */
  async refreshUserMatches(userId: string): Promise<void> {
    return this.adapter.refreshUserMatches(userId);
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    return this.adapter.getUserMatches(userId);
  }

  async getMatchedUsers(userId: string): Promise<User[]> {
    return this.adapter.getMatchedUsers(userId);
  }

  async createMatch(data: CreateMatchData): Promise<Match> {
    return this.adapter.createMatch(data);
  }

  async updateMatch(matchId: string, data: UpdateMatchData): Promise<Match> {
    return this.adapter.updateMatch(matchId, data);
  }

  async deleteMatch(matchId: string): Promise<void> {
    return this.adapter.deleteMatch(matchId);
  }

  async isMatchedWith(userId: string, targetUserId: string): Promise<boolean> {
    return this.adapter.isMatchedWith(userId, targetUserId);
  }

  async getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'> {
    return this.adapter.getMatchStatus(userId, targetUserId);
  }

  /**
   * 综合多机制智能匹配（委托 aiAdapter）
   */
  async matchUsers(userId: string, opts: {
    maxDistanceKm?: number;
    includeTags?: string[];
    excludeTags?: string[];
    useRandom?: boolean;
    useBazi?: boolean;
    useMBTI?: boolean;
    mbtiType?: string;
    limit?: number;
  }): Promise<User[]> {
    const candidates: User[] = await this.adapter.getMatchedUsers(userId);
    const user = candidates.find(u => u.id === userId);
    if (!user) return [];
    return this.aiAdapter.matchUsers(user, candidates, opts);
  }

  /**
   * 获取用户所有相关的历史匹配对象（含已过期/已解除/所有历史）
   */
  async getUserMatchHistory(userId: string): Promise<User[]> {
    // 1. 获取所有历史 Match 记录
    const matches = await this.adapter.getUserMatches(userId);
    // 2. 聚合所有相关用户ID（去重，排除自己）
    const allUserIds = Array.from(new Set(
      matches.flatMap(match => match.users).filter(id => id !== userId)
    ));
    // 3. 查询用户对象（需注入 userService 或 dataService）
    if (!this.userService || typeof this.userService.findUsersByIds !== 'function') {
      throw new Error('userService.findUsersByIds 未注入');
    }
    const users = await this.userService.findUsersByIds(allUserIds);
    return users.filter(Boolean);
  }
}
