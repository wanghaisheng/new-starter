import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';
import { MatchServiceTypeOptions } from '@/core/lib/db/types/common';
import { MatchPreference } from '@/core/lib/db/types/match-preference.types';

export class MatchPreferenceService {
  static async getUserPreference(userId: string): Promise<MatchPreference & { algoOrder: MatchServiceTypeOptions[]; disableAlgos: MatchServiceTypeOptions[] }> {
    const user = await UserRepository.getById(userId);
    // 默认顺序为 ['random']，禁用算法为空
    return user?.preferences || { algoOrder: [MatchServiceTypeOptions.RANDOM], disableAlgos: [] };
  }

  static async setUserPreference(userId: string, data: Partial<MatchPreference & { algoOrder: MatchServiceTypeOptions[]; disableAlgos: MatchServiceTypeOptions[] }>): Promise<void> {
    await UserRepository.updatePreference(userId, data);
  }
}
