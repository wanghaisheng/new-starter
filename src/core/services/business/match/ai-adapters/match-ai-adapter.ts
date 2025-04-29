import { User } from '@/core/lib/db/types/user.types';

/**
 * 匹配算法策略接口：每个算法只需实现自己的主入口
 * 推荐用法：每种算法单独适配器，实现 matchUsers
 */
export interface IMatchStrategy {
  /**
   * 主入口：根据用户、候选人和参数进行筛选
   * @param user 当前用户
   * @param candidates 候选用户列表
   * @param opts 策略相关参数
   */
  matchUsers(user: User, candidates: User[], opts: any): User[];
}

/**
 * 策略注册表类型（可选，用于组合/动态扩展）
 */
export type MatchStrategyMap = Record<string, IMatchStrategy>;
