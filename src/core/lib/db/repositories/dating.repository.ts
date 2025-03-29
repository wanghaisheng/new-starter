import { IDatabaseClient } from '../interfaces';
import {
  User,
  Photo,
  Match,
  Message,
  UserPreferences,
  IDatingRepository,
  MatchAction,
  Report,
  Block
} from '../types/dating';
import { CreateEntityData, UpdateEntityData } from '../types/base-entity';
import { EntityConverter } from '../schema/entity-converter';
import userSchema from '../schema/definitions/user-schema';
import matchSchema from '../schema/definitions/match-schema';
import messageSchema from '../schema/definitions/message-schema';
import {
  photoSchema,
  matchActionSchema,
  reportSchema,
  blockSchema
} from '../schema/definitions/dating-schemas';

export class DatingRepositoryImpl implements IDatingRepository {
  private userConverter: EntityConverter<User>;
  private photoConverter: EntityConverter<Photo>;
  private matchConverter: EntityConverter<Match>;
  private messageConverter: EntityConverter<Message>;
  private matchActionConverter: EntityConverter<MatchAction>;
  private reportConverter: EntityConverter<Report>;
  private blockConverter: EntityConverter<Block>;

  constructor(private readonly db: IDatabaseClient) {
    // 初始化各个实体的转换器
    this.userConverter = new EntityConverter<User>(userSchema);
    this.photoConverter = new EntityConverter<Photo>(photoSchema);
    this.matchConverter = new EntityConverter<Match>(matchSchema);
    this.messageConverter = new EntityConverter<Message>(messageSchema);
    this.matchActionConverter = new EntityConverter<MatchAction>(matchActionSchema);
    this.reportConverter = new EntityConverter<Report>(reportSchema);
    this.blockConverter = new EntityConverter<Block>(blockSchema);
  }

  // 用户相关
  async createUser(user: CreateEntityData<User>): Promise<User> {
    const dbUser = this.userConverter.toDatabase(user);
    const createdUser = await this.db.createUser(dbUser);
    return this.userConverter.fromDatabase(createdUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.db.findUsers({ id });
    return users[0] ? this.userConverter.fromDatabase(users[0]) : null;
  }

  async updateUser(id: string, data: UpdateEntityData<User>): Promise<User> {
    const dbData = this.userConverter.toDatabase(data);
    await this.db.updateUser(id, dbData);
    const user = await this.getUserById(id);
    if (!user) throw new Error(`User not found: ${id}`);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.deleteUser(id);
  }

  // 照片相关
  async addPhoto(userId: string, photo: CreateEntityData<Photo>): Promise<Photo> {
    const photoData = {
      ...photo,
      userId
    };
    const dbPhoto = this.photoConverter.toDatabase(photoData);
    const newPhoto = await this.db.create('photos', dbPhoto);
    return this.photoConverter.fromDatabase(newPhoto);
  }

  async updatePhoto(id: string, data: UpdateEntityData<Photo>): Promise<Photo> {
    const dbData = this.photoConverter.toDatabase(data);
    await this.db.update('photos', id, dbData);
    const photo = await this.db.findById('photos', id);
    if (!photo) throw new Error(`Photo not found: ${id}`);
    return this.photoConverter.fromDatabase(photo);
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.delete('photos', id);
  }

  async getPhotosByUserId(userId: string): Promise<Photo[]> {
    const photos = await this.db.findAll('photos', { userId });
    return photos.map(photo => this.photoConverter.fromDatabase(photo));
  }

  // 匹配相关
  async createMatch(match: CreateEntityData<Match>): Promise<Match> {
    const dbMatch = this.matchConverter.toDatabase(match);
    const createdMatch = await this.db.createMatch(dbMatch);
    return this.matchConverter.fromDatabase(createdMatch);
  }

  async getMatchById(id: string): Promise<Match | null> {
    const matches = await this.db.findMatches({ id });
    return matches[0] ? this.matchConverter.fromDatabase(matches[0]) : null;
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    const matches = await this.db.findMatches({
      $or: [
        { users: { $contains: userId } }
      ]
    });
    return matches.map(match => this.matchConverter.fromDatabase(match));
  }

  async updateMatchStatus(id: string, status: Match['status']): Promise<Match> {
    const dbData = this.matchConverter.toDatabase({ status });
    await this.db.updateMatch(id, dbData);
    const match = await this.getMatchById(id);
    if (!match) throw new Error(`Match not found: ${id}`);
    return match;
  }

  // 消息相关
  async sendMessage(message: CreateEntityData<Message>): Promise<Message> {
    const dbMessage = this.messageConverter.toDatabase(message);
    const createdMessage = await this.db.createMessage(dbMessage);
    return this.messageConverter.fromDatabase(createdMessage);
  }

  async getMessagesByMatchId(matchId: string): Promise<Message[]> {
    const messages = await this.db.findMessages({ matchId });
    return messages.map(message => this.messageConverter.fromDatabase(message));
  }

  async updateMessageStatus(id: string, status: Message['status']): Promise<Message> {
    const dbData = this.messageConverter.toDatabase({ status });
    await this.db.updateMessage(id, dbData);
    const messages = await this.db.findMessages({ id });
    if (!messages[0]) throw new Error(`Message not found: ${id}`);
    return this.messageConverter.fromDatabase(messages[0]);
  }

  // 查询相关
  async findPotentialMatches(userId: string, preferences: UserPreferences): Promise<User[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    const users = await this.db.findUsers({
      $and: [
        { id: { $ne: userId } },
        { gender: { $in: preferences.gender } },
        { birthDate: { 
          $gte: new Date(new Date().getFullYear() - preferences.ageRange.max, 0, 1),
          $lte: new Date(new Date().getFullYear() - preferences.ageRange.min, 11, 31)
        }},
        { interests: { $in: preferences.interests } }
      ]
    });
    return users.map(user => this.userConverter.fromDatabase(user));
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = await this.db.findUsers({
      $or: [
        { name: { $contains: query } },
        { bio: { $contains: query } },
        { interests: { $contains: query } }
      ]
    });
    return users.map(user => this.userConverter.fromDatabase(user));
  }

  // 匹配操作相关
  async createMatchAction(action: CreateEntityData<MatchAction>): Promise<MatchAction> {
    const dbAction = this.matchActionConverter.toDatabase(action);
    const newAction = await this.db.create('match_actions', dbAction);
    return this.matchActionConverter.fromDatabase(newAction);
  }

  async getMatchActionsByUserId(userId: string): Promise<MatchAction[]> {
    const actions = await this.db.findAll('match_actions', { userId });
    return actions.map(action => this.matchActionConverter.fromDatabase(action));
  }

  // 用户互动相关
  async createReport(report: CreateEntityData<Report>): Promise<Report> {
    const dbReport = this.reportConverter.toDatabase(report);
    const newReport = await this.db.create('reports', dbReport);
    return this.reportConverter.fromDatabase(newReport);
  }

  async getReportsByTargetId(targetId: string): Promise<Report[]> {
    const reports = await this.db.findAll('reports', { targetUserId: targetId });
    return reports.map(report => this.reportConverter.fromDatabase(report));
  }

  async updateReportStatus(id: string, status: Report['status'], resolution?: Report['resolution']): Promise<Report> {
    const dbData = this.reportConverter.toDatabase({ status, resolution });
    await this.db.update('reports', id, dbData);
    const report = await this.db.findById('reports', id);
    if (!report) throw new Error(`Report not found: ${id}`);
    return this.reportConverter.fromDatabase(report);
  }

  async createBlock(block: CreateEntityData<Block>): Promise<Block> {
    const dbBlock = this.blockConverter.toDatabase(block);
    const newBlock = await this.db.create('blocks', dbBlock);
    return this.blockConverter.fromDatabase(newBlock);
  }

  async getBlocksByBlockerId(blockerId: string): Promise<Block[]> {
    const blocks = await this.db.findAll('blocks', { blockerId });
    return blocks.map(block => this.blockConverter.fromDatabase(block));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blocks = await this.db.findAll('blocks', {
      blockerId,
      blockedId,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });
    return blocks.length > 0;
  }

  // 推荐系统相关
  async getRecommendedUsers(userId: string, options?: {
    limit?: number;
    offset?: number;
    filters?: {
      ageRange?: UserPreferences['ageRange'];
      distance?: number;
      gender?: UserPreferences['gender'];
    };
  }): Promise<{ users: User[]; total: number }> {
    const user = await this.getUserById(userId);
    if (!user) return { users: [], total: 0 };

    const filters = options?.filters || user.preferences;
    const query = {
      $and: [
        { id: { $ne: userId } },
        { gender: { $in: filters.gender } },
        { birthDate: { 
          $gte: new Date(new Date().getFullYear() - (filters.ageRange?.max || user.preferences.ageRange.max), 0, 1),
          $lte: new Date(new Date().getFullYear() - (filters.ageRange?.min || user.preferences.ageRange.min), 11, 31)
        }},
        { interests: { $in: user.interests } }
      ]
    };

    const dbUsers = await this.db.findUsers(query);
    const users = dbUsers.map(user => this.userConverter.fromDatabase(user));
    const total = users.length;

    if (options?.limit && options?.offset) {
      const start = options.offset;
      const end = start + options.limit;
      return {
        users: users.slice(start, end),
        total
      };
    }

    return {
      users,
      total
    };
  }
} 