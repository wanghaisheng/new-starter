import { MatchServiceTypeOptions } from '@/core/lib/db/types/common';

/**
 * 匹配偏好（Match Preference）类型定义
 * 仅用于匹配业务，与全局 UserSettings 分离
 */
export interface MatchPreference {
  useMBTI?: boolean;
  useLocation?: boolean;
  useTag?: boolean;
  useRandom?: boolean;
  useBazi?: boolean;
  maxDistanceKm?: number;
  includeTags?: string[];
  excludeTags?: string[];
  mbtiType?: string;
  limit?: number;
  baseFilter?: import('@/core/services/business/match/match-service').UserBaseFilter;
  // 支持算法顺序和禁用（用于前端灵活控制）
  algoOrder?: MatchServiceTypeOptions[];
  disableAlgos?: MatchServiceTypeOptions[];
  // 可根据实际业务扩展更多匹配相关选项
}
