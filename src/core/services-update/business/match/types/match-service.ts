import { Match } from '@/core/lib/db/models';
import { IService } from '@/core/services-update/types';

export interface IMatchService extends IService {
  saveMatch(match: Match): Promise<void>;
  getMatch(id: string): Promise<Match | null>;
  getMatches(): Promise<Match[]>;
  getMatchesByUserId(userId: string): Promise<Match[]>;
  deleteMatch(id: string): Promise<void>;
}
