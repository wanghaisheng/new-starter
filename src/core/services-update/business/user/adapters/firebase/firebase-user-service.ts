import { IUserService } from '../../types/user-service';
import { ServiceConfig } from '../../../types/config';
import { User } from '@/core/lib/db/types/user';
import { logger } from '@/core/lib/logger';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

/**
 * Firebase 用户服务
 */
export class FirebaseUserService implements IUserService {
  private db: any;
  private initialized: boolean = false;

  constructor(private config: ServiceConfig) {
    const app = initializeApp({
      apiKey: config.config?.apiKey,
      authDomain: config.config?.authDomain,
      projectId: config.config?.projectId
    });
    this.db = getFirestore(app);
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    logger.info('Firebase user service initialized');
  }

  /**
   * 释放服务资源
   */
  public async dispose(): Promise<void> {
    this.initialized = false;
    logger.info('Firebase user service disposed');
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取服务配置
   */
  public getConfig(): ServiceConfig {
    return this.config;
  }

  /**
   * 获取用户
   */
  public async getUser(id: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.db, 'users', id));
    if (!userDoc.exists()) {
      return null;
    }
    return this.convertFirebaseUser(userDoc.data());
  }

  /**
   * 通过邮箱获取用户
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    const usersRef = collection(this.db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return this.convertFirebaseUser(querySnapshot.docs[0].data());
  }

  /**
   * 通过手机号获取用户
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const usersRef = collection(this.db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return this.convertFirebaseUser(querySnapshot.docs[0].data());
  }

  /**
   * 更新用户
   */
  public async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(this.db, 'users', id);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };
    await updateDoc(userRef, updatedData);
    return this.convertFirebaseUser({ ...userDoc.data(), ...updatedData });
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string): Promise<void> {
    const userRef = doc(this.db, 'users', id);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    await deleteDoc(userRef);
  }

  /**
   * 创建用户
   */
  public async createUser(data: Partial<User>): Promise<User> {
    const usersRef = collection(this.db, 'users');
    const userData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(usersRef, userData);
    return this.convertFirebaseUser({ ...userData, id: docRef.id });
  }

  /**
   * 转换 Firebase 用户为应用用户
   */
  private convertFirebaseUser(firebaseUser: any): User {
    return {
      id: firebaseUser.id,
      email: firebaseUser.email,
      name: firebaseUser.name,
      phoneNumber: firebaseUser.phoneNumber,
      emailVerified: firebaseUser.emailVerified,
      phoneVerified: firebaseUser.phoneVerified,
      photoURL: firebaseUser.photoURL,
      birthDate: firebaseUser.birthDate || new Date(),
      gender: firebaseUser.gender || 'other',
      createdAt: firebaseUser.createdAt || new Date(),
      updatedAt: firebaseUser.updatedAt || new Date(),
      photos: firebaseUser.photos || [],
      interests: firebaseUser.interests || [],
      location: firebaseUser.location || {
        latitude: 0,
        longitude: 0
      },
      privacySettings: firebaseUser.privacySettings || {
        showProfile: false,
        showLocation: false
      },
      notificationSettings: firebaseUser.notificationSettings || {
        push: true,
        email: true
      },
      preferences: firebaseUser.preferences || {
        language: 'en',
        theme: 'light'
      },
      status: firebaseUser.status || 'active',
      matching: firebaseUser.matching || false,
      isVerified: firebaseUser.isVerified || false,
      lastActive: firebaseUser.lastActive || new Date(),
      isOnline: firebaseUser.isOnline || false
    };
  }
} 