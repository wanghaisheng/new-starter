import type { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match.types';
import type { User } from '@/core/lib/db/types/user.types';
/**
 * 匹配服务 Adapter 接口
 * 仅实现基础数据访问、与外部 API 的适配，不包含聚合/业务编排逻辑
 */
export interface IMatchAdapter {
  getUserMatches(userId: string): Promise<Match[]>;
  getMatchedUsers(userId: string): Promise<User[]>;
  createMatch(data: CreateMatchData): Promise<Match>;
  updateMatch(matchId: string, data: UpdateMatchData): Promise<Match>;
  deleteMatch(matchId: string): Promise<void>;
  isMatchedWith(userId: string, targetUserId: string): Promise<boolean>;
  getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'>;
  matchUsers(userId: string, opts: MatchServiceOptions): Promise<User[]>;
  getUserMatchHistory(userId: string): Promise<User[]>;
}

/**
 * 匹配服务接口（新架构，业务聚合/编排层，仅依赖 IMatchAdapter）
 * 仅定义聚合逻辑、业务方法，不直接操作外部 API/DB
 */
export interface IMatchService {
  /** 获取用户所有匹配关系（含推荐池、历史等） */
  getUserMatches(userId: string): Promise<Match[]>;
  /** 获取用户当前已匹配的用户对象 */
  getMatchedUsers(userId: string): Promise<User[]>;
  /** 创建匹配关系 */
  createMatch(data: CreateMatchData): Promise<Match>;
  /** 更新匹配关系 */
  updateMatch(matchId: string, data: UpdateMatchData): Promise<Match>;
  /** 删除匹配关系 */
  deleteMatch(matchId: string): Promise<void>;
  /** 是否已与目标用户匹配 */
  isMatchedWith(userId: string, targetUserId: string): Promise<boolean>;
  /** 获取与目标用户的匹配状态 */
  getMatchStatus(userId: string, targetUserId: string): Promise<'matched' | 'pending' | 'none'>;
  /**
   * 综合多机制智能匹配
   * 支持地理、兴趣、mbti、八字等任意组合
   */
  matchUsers(userId: string, opts: MatchServiceOptions): Promise<User[]>;
  /**
   * 获取用户所有相关的历史匹配对象（含已过期/已解除/所有历史）
   */
  getUserMatchHistory(userId: string): Promise<User[]>;
  /**
   * quiz 结果联动入口：接收标签和报告，自动刷新用户标签、触发推荐等
   */
  onQuizResult(userId: string, tags: string[], report: any, userService?: any): Promise<void>;
  /**
   * 根据最新标签/画像刷新推荐池
   */
  refreshUserMatches(userId: string): Promise<void>;
  /**
   * 监听匹配数据变更（如有适配器支持），返回取消订阅函数
   */
  onMatchChange?(callback: (matches: Match[]) => void): () => void;
}

// Service 工厂类型定义
export type MatchServiceType = 'mock' | 'remote' | 'hybrid' | 'brandA' | 'brandB';

// 新增多维 options/context 支持
export interface MatchServiceOptions {
  apiBaseUrl?: string;
  brand?: string;
  algoVersion?: string | number;
  featureFlag?: string;
  userType?: 'vip' | 'normal' | 'guest';
  region?: string;
  env?: 'dev' | 'test' | 'prod';
  maxDistanceKm?: number;
  includeTags?: string[];
  excludeTags?: string[];
  useRandom?: boolean;
  useBazi?: boolean;
  useMBTI?: boolean;
  mbtiType?: string;
  limit?: number;
  [key: string]: any;
}
