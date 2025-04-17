import { IMatchService } from '../types/match-service';
import { IDataService } from '@/core/services-update/data/types';
import { Match } from '@/core/lib/db/models';

export class MockMatchServiceAdapter implements IMatchService {
  constructor(private dataService: IDataService) {}
  async saveMatch(match: Match): Promise<void> {
    if (match.id) {
      await this.dataService.update('matches', match.id, match);
    } else {
      await this.dataService.insert('matches', match);
    }
  }
  async getMatch(id: string): Promise<Match | null> {
    const result = await this.dataService.findOne<Match>('matches', { id });
    return result ? new Match(result) : null;
  }
  async getMatches(): Promise<Match[]> {
    const matches = await this.dataService.query<Match>('matches', {});
    return matches.map(match => new Match(match));
  }
  async getMatchesByUserId(userId: string): Promise<Match[]> {
    const matches = await this.dataService.query<Match>('matches', { userId });
    return matches.map(match => new Match(match));
  }
  async deleteMatch(id: string): Promise<void> {
    await this.dataService.delete('matches', id);
  }
}
