import { BaseRepository } from './base-repository';
import type { Match, CreateMatchData, UpdateMatchData } from '@/core/lib/db/types/match.types';
import type { IDataService } from '@/core/services/data/types';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { matchSchema } from '@/core/lib/db/schema/definitions/match-schema';
import { SortDirection } from '@/core/lib/db/types/common';

const matchConverter = new EntityConverter<Match>(matchSchema);

/**
 * MatchRepository 实现
 * - 只负责 match 表数据访问
 * - 注册到全局工厂，解耦主注册表
 */
export class MatchRepository extends BaseRepository<Match, Match> {
  constructor(dataService: IDataService<Match>) {
    super(dataService as any, 'matches', matchConverter);
  }

  /**
   * 根据用户ID获取所有与之相关的匹配（userAId 或 userBId）
   */
  async findByUserId(userId: string): Promise<Match[]> {
    const results = await this.client.query(this.table, {
      where: { $or: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { field: 'createdAt', direction: SortDirection.DESC }
    });
    if (results && results.items) {
      return results.items.map(match => this.converter.fromDatabase(match));
    }
    return [];
  }

  /**
   * 创建新匹配
   */
  async createMatch(data: CreateMatchData): Promise<Match> {
    const dbRecord = this.converter.toDatabase(data as Match);
    const saved = await this.client.create(this.table, dbRecord);
    return this.converter.fromDatabase(saved);
  }

  /**
   * 更新匹配
   */
  async updateMatch(id: string, data: UpdateMatchData): Promise<Match | null> {
    const dbRecord = this.converter.toDatabase(data as Match);
    await this.client.update(this.table, id, dbRecord);
    return this.findById(id);
  }

  /**
   * 根据ID查找匹配（自动做类型安全转换）
   */
  async findById(id: string): Promise<Match | null> {
    const result = await this.client.findById(this.table, id);
    return result ? this.converter.fromDatabase(result) : null;
  }

  /**
   * 新增匹配（自动做类型安全转换）
   */
  async create(entity: Match): Promise<Match> {
    const dbRecord = this.converter.toDatabase(entity);
    const saved = await this.client.create(this.table, dbRecord);
    return this.converter.fromDatabase(saved);
  }

  /**
   * 更新匹配（自动做类型安全转换）
   */
  async update(id: string, data: Partial<Match>): Promise<Match | null> {
    const dbRecord = this.converter.toDatabase(data as Match);
    await this.client.update(this.table, id, dbRecord);
    return this.findById(id);
  }
}

// 工厂注册，支持插件式解耦
RepositoryFactoryRegistry.registerFactory('match', (options: { dataService: IDataService<Match> }) => new MatchRepository(options.dataService));
