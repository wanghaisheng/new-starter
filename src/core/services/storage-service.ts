import { User, Match, Message } from '../models/user';
import { Storage } from '@capacitor/storage';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

export interface StorageConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export class StorageService {
  private static instance: StorageService;
  private db: any;
  private auth: any;
  private isInitialized = false;
  public readonly STORAGE_KEYS = {
    USERS: 'app_users',
    MATCHES: 'app_matches',
    MESSAGES: 'app_messages',
    CURRENT_USER: 'app_current_user'
  };

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // 获取当前数据库环境配置
      const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      
      // 根据数据库环境决定存储策略
      switch (dbEnv) {
        case 'mock':
          // Mock数据阶段 - 使用内存存储
          console.log('数据库环境: Mock数据阶段');
          this.useLocalStorage = true;
          return;
          
        case 'local':
          // 本地数据库阶段 - 使用IndexedDB或SQLite
          console.log('数据库环境: 本地数据库阶段');
          const localDbType = process.env.NEXT_PUBLIC_LOCAL_DB_TYPE || 'indexeddb';
          this.useLocalStorage = true;
          // 这里可以根据localDbType初始化不同的本地数据库
          return;
          
        case 'production':
          // 生产环境阶段 - 使用Firebase或其他云服务
          console.log('数据库环境: 生产环境阶段');
          const cloudDbType = process.env.NEXT_PUBLIC_CLOUD_DB_TYPE || 'firebase';
          
          if (cloudDbType === 'firebase') {
            const config = getFirebaseConfig();
            
            // 检查Firebase配置是否有效
            if (!config.firebase.apiKey || config.firebase.apiKey === '') {
              console.warn('Firebase配置无效，回退到本地存储');
              this.useLocalStorage = true;
              return;
            }
            
            const app = initializeApp(config.firebase);
            this.db = getFirestore(app);
            this.auth = getAuth(app);
            
            // 匿名登录
            await signInAnonymously(this.auth);
          } else {
            // 其他云服务的初始化逻辑
            console.log(`使用云服务: ${cloudDbType}`);
            this.useLocalStorage = true; // 临时回退，直到实现其他云服务
          }
          return;
          
        default:
          // 未知环境 - 回退到本地存储
          console.warn(`未知数据库环境: ${dbEnv}，回退到本地存储`);
          this.useLocalStorage = true;
          return;
      }
    } catch (error) {
      console.error('初始化存储服务失败:', error);
      console.log('回退到本地存储模式');
      this.useLocalStorage = true;
      // 不抛出错误，而是回退到本地存储
      // throw new Error('Failed to initialize storage service');
    }
  }

  // 本地存储方法
  public async setLocalItem(key: string, value: any): Promise<void> {
    try {
      await Storage.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.error('Error setting local storage item:', error);
      throw error;
    }
  }

  public async getLocalItem<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Storage.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting local storage item:', error);
      return null;
    }
  }

  public async removeLocalItem(key: string): Promise<void> {
    try {
      await Storage.remove({ key });
    } catch (error) {
      console.error('Error removing local storage item:', error);
      throw error;
    }
  }

  public async clearLocalStorage(): Promise<void> {
    try {
      await Storage.clear();
    } catch (error) {
      console.error('Error clearing local storage:', error);
      throw error;
    }
  }

  // 云端存储方法
  public async setCloudItem(collectionName: string, docId: string, data: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const docRef = doc(this.db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error('Error setting cloud storage item:', error);
      throw error;
    }
  }

  public async getCloudItem<T>(collectionName: string, docId: string): Promise<T | null> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const docRef = doc(this.db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as T : null;
    } catch (error) {
      console.error('Error getting cloud storage item:', error);
      throw error;
    }
  }

  public async getCloudItems<T>(
    collectionName: string,
    field: string,
    value: any
  ): Promise<T[]> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const q = query(
        collection(this.db, collectionName),
        where(field, '==', value)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data() as T);
    } catch (error) {
      console.error('Error getting cloud storage items:', error);
      throw error;
    }
  }

  public async updateCloudItem(
    collectionName: string,
    docId: string,
    data: Partial<any>
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const docRef = doc(this.db, collectionName, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating cloud storage item:', error);
      throw error;
    }
  }

  public async deleteCloudItem(collectionName: string, docId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const docRef = doc(this.db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting cloud storage item:', error);
      throw error;
    }
  }

  // 同步方法
  public async syncToCloud<T>(
    collectionName: string,
    docId: string,
    localKey: string
  ): Promise<void> {
    try {
      const localData = await this.getLocalItem<T>(localKey);
      if (localData) {
        await this.setCloudItem(collectionName, docId, localData);
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      throw error;
    }
  }

  public async syncFromCloud<T>(
    collectionName: string,
    docId: string,
    localKey: string
  ): Promise<void> {
    try {
      const cloudData = await this.getCloudItem<T>(collectionName, docId);
      if (cloudData) {
        await this.setLocalItem(localKey, cloudData);
      }
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      throw error;
    }
  }

  // 用户数据存储
  public async saveUsers(users: User[]): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.USERS, users);
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  public async getUsers(): Promise<User[]> {
    try {
      const users = await this.getLocalItem<User[]>(this.STORAGE_KEYS.USERS);
      return users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  public async saveCurrentUser(user: User): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.CURRENT_USER, user);
    } catch (error) {
      console.error('Error saving current user:', error);
      throw error;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    try {
      return await this.getLocalItem<User>(this.STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // 匹配数据存储
  public async saveMatches(matches: Match[]): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.MATCHES, matches);
    } catch (error) {
      console.error('Error saving matches:', error);
      throw error;
    }
  }

  public async getMatches(): Promise<Match[]> {
    try {
      const matches = await this.getLocalItem<Match[]>(this.STORAGE_KEYS.MATCHES);
      return matches || [];
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  // 消息数据存储
  public async saveMessages(messages: Message[]): Promise<void> {
    try {
      await this.setLocalItem(this.STORAGE_KEYS.MESSAGES, messages);
    } catch (error) {
      console.error('Error saving messages:', error);
      throw error;
    }
  }

  public async getMessages(): Promise<Message[]> {
    try {
      const messages = await this.getLocalItem<Message[]>(this.STORAGE_KEYS.MESSAGES);
      return messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // 清除所有数据
  public async clearAll(): Promise<void> {
    try {
      await this.clearLocalStorage();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // 检查存储是否可用
  public async isStorageAvailable(): Promise<boolean> {
    try {
      const testKey = '__storage_test__';
      await this.setLocalItem(testKey, testKey);
      await this.removeLocalItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}