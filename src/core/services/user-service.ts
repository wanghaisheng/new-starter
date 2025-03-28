import { User, Match, Message } from '../models/user';
import { StorageService } from './storage-service';
import { getFirebaseConfig } from '../config/firebase';

export class UserService {
  private static instance: UserService;
  private storageService: StorageService;

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.storageService.initialize(getFirebaseConfig());
    } catch (error) {
      console.error('Error initializing UserService:', error);
    }
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // 用户相关方法
  public async getCurrentUser(): Promise<User | null> {
    return await this.storageService.getCurrentUser();
  }

  public async saveCurrentUser(user: User): Promise<void> {
    await this.storageService.saveCurrentUser(user);
    // 同步到云端
    await this.storageService.syncToCloud('users', user.id, this.storageService.STORAGE_KEYS.CURRENT_USER);
  }

  public async getUsers(): Promise<User[]> {
    return await this.storageService.getUsers();
  }

  public async saveUsers(users: User[]): Promise<void> {
    await this.storageService.saveUsers(users);
    // 同步到云端
    for (const user of users) {
      await this.storageService.syncToCloud('users', user.id, this.storageService.STORAGE_KEYS.USERS);
    }
  }

  // 匹配相关方法
  public async getMatches(): Promise<Match[]> {
    return await this.storageService.getMatches();
  }

  public async saveMatches(matches: Match[]): Promise<void> {
    await this.storageService.saveMatches(matches);
    // 同步到云端
    for (const match of matches) {
      await this.storageService.syncToCloud('matches', match.id, this.storageService.STORAGE_KEYS.MATCHES);
    }
  }

  // 消息相关方法
  public async getMessages(): Promise<Message[]> {
    return await this.storageService.getMessages();
  }

  public async saveMessages(messages: Message[]): Promise<void> {
    await this.storageService.saveMessages(messages);
    // 同步到云端
    for (const message of messages) {
      await this.storageService.syncToCloud('messages', message.id, this.storageService.STORAGE_KEYS.MESSAGES);
    }
  }

  // 用户操作
  public async createUser(userData: Partial<User>): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name || '',
      age: userData.age || 0,
      bio: userData.bio || '',
      images: userData.images || [],
      interests: userData.interests || [],
      location: userData.location || { latitude: 0, longitude: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    await this.saveUsers(users);
    return newUser;
  }

  public async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date()
    };

    await this.saveUsers(users);
    return users[userIndex];
  }

  public async deleteUser(userId: string): Promise<boolean> {
    const users = await this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (filteredUsers.length === users.length) return false;

    await this.saveUsers(filteredUsers);
    return true;
  }

  // 匹配操作
  public async createMatch(user1Id: string, user2Id: string): Promise<Match> {
    const matches = await this.getMatches();
    const newMatch: Match = {
      id: `match_${Date.now()}`,
      users: [user1Id, user2Id],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    matches.push(newMatch);
    await this.saveMatches(matches);
    return newMatch;
  }

  public async deleteMatch(matchId: string): Promise<boolean> {
    const matches = await this.getMatches();
    const filteredMatches = matches.filter(m => m.id !== matchId);
    
    if (filteredMatches.length === matches.length) return false;

    await this.saveMatches(filteredMatches);
    return true;
  }

  // 消息操作
  public async sendMessage(matchId: string, senderId: string, text: string): Promise<{ success: boolean; message?: Message; errors?: string[] }> {
    try {
      const messages = await this.getMessages();
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        matchId,
        senderId,
        text,
        timestamp: new Date(),
        read: false
      };

      messages.push(newMessage);
      await this.saveMessages(messages);
      return { success: true, message: newMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, errors: ['Failed to send message'] };
    }
  }

  public async markMessageAsRead(messageId: string): Promise<boolean> {
    const messages = await this.getMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) return false;

    messages[messageIndex].read = true;
    await this.saveMessages(messages);
    return true;
  }

  // 数据同步
  public async syncData(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser) {
      // 同步用户数据
      await this.storageService.syncFromCloud('users', currentUser.id, this.storageService.STORAGE_KEYS.CURRENT_USER);
      
      // 同步匹配数据
      const matches = await this.getMatches();
      for (const match of matches) {
        await this.storageService.syncFromCloud('matches', match.id, this.storageService.STORAGE_KEYS.MATCHES);
      }
      
      // 同步消息数据
      const messages = await this.getMessages();
      for (const message of messages) {
        await this.storageService.syncFromCloud('messages', message.id, this.storageService.STORAGE_KEYS.MESSAGES);
      }
    }
  }
} 