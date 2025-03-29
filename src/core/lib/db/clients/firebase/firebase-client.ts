import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { IDatabaseClient, QueryOptions } from '../../interfaces';
import { User, Match, Message, BaseEntity } from '../../types';
import { QueryResult, BatchOperation } from '../../types/database.types';
import { FirebaseError } from './firebase-error';
import { FirebaseAuthService } from './firebase-auth';
import { FirebasePermissionsService, UserRole, UserPermissions } from './firebase-permissions';
import { FirebaseSyncService, SyncOptions, SyncListener } from './firebase-sync';
import { FirebaseConflictService, ConflictResolutionOptions, ConflictMetadata } from './firebase-conflict';
import { FirebasePerformanceService, PerformanceOptions } from './firebase-performance';
import { FirebaseDeploymentService, DeploymentOptions, DeploymentStatus, HealthCheckResult } from './firebase-deployment';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export class FirebaseClient implements IDatabaseClient {
  private app: FirebaseApp;
  private db: Firestore;
  private auth: Auth;
  private permissions: FirebasePermissionsService;
  private sync: FirebaseSyncService;
  private conflict: FirebaseConflictService;
  private performance: FirebasePerformanceService;
  private deployment: FirebaseDeploymentService;
  private initialized = false;
  private currentUser: FirebaseUser | null = null;

  constructor(
    private config: FirebaseConfig,
    private syncOptions: SyncOptions = {},
    private conflictOptions: ConflictResolutionOptions = {
      strategy: 'SERVER_FIRST',
      maxRetries: 3,
      retryDelay: 1000
    },
    private performanceOptions: PerformanceOptions = {},
    private deploymentOptions: DeploymentOptions = {
      environment: 'development',
      backupEnabled: true,
      rollbackEnabled: true,
      healthCheckEnabled: true,
      monitoringEnabled: true
    }
  ) {
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.permissions = new FirebasePermissionsService(config);
    this.sync = new FirebaseSyncService(config, syncOptions);
    this.conflict = new FirebaseConflictService(this.db, conflictOptions);
    this.performance = new FirebasePerformanceService(performanceOptions);
    this.deployment = new FirebaseDeploymentService(deploymentOptions);

    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async close(): Promise<void> {
    // Firebase 会自动管理连接
    this.initialized = false;
  }

  async clear(): Promise<void> {
    await this.initialize();
    // 清除所有数据
    throw new FirebaseError('Clear operation is not supported in Firebase');
  }

  // 认证方法
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;
      return this.currentUser;
    } catch (error) {
      throw new FirebaseError('Authentication failed', error as Error);
    }
  }

  async signUp(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;
      return this.currentUser;
    } catch (error) {
      throw new FirebaseError('Registration failed', error as Error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser = null;
    } catch (error) {
      throw new FirebaseError('Sign out failed', error as Error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw new FirebaseError('Password reset failed', error as Error);
    }
  }

  async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    if (!this.currentUser) {
      throw new FirebaseError('No user logged in');
    }

    try {
      await updateProfile(this.currentUser, { displayName, photoURL });
    } catch (error) {
      throw new FirebaseError('Profile update failed', error as Error);
    }
  }

  onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  // 权限管理方法
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    return this.permissions.getUserPermissions(userId);
  }

  async setUserRole(userId: string, role: UserRole): Promise<void> {
    return this.permissions.setUserRole(userId, role);
  }

  async addUserPermission(userId: string, permission: string): Promise<void> {
    return this.permissions.addUserPermission(userId, permission);
  }

  async removeUserPermission(userId: string, permission: string): Promise<void> {
    return this.permissions.removeUserPermission(userId, permission);
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    return this.permissions.hasPermission(userId, permission);
  }

  async isAdmin(userId: string): Promise<boolean> {
    return this.permissions.isAdmin(userId);
  }

  async isModerator(userId: string): Promise<boolean> {
    return this.permissions.isModerator(userId);
  }

  // 数据库操作方法
  async create<T extends BaseEntity>(
    tableName: string,
    data: Omit<T, keyof BaseEntity>
  ): Promise<T> {
    await this.initialize();
    
    try {
      const docRef = doc(collection(this.db, tableName));
      const entity = {
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as T;

      await setDoc(docRef, this.serialize(entity));
      return entity;
    } catch (error) {
      throw new FirebaseError('Failed to create document', error as Error);
    }
  }

  async findById<T extends BaseEntity>(
    tableName: string,
    id: string
  ): Promise<T | null> {
    await this.initialize();
    
    try {
      const docRef = doc(this.db, tableName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      if (!data) {
        return null;
      }

      return this.deserialize<T>(data);
    } catch (error) {
      throw new FirebaseError('Failed to find document', error as Error);
    }
  }

  async findAll<T extends BaseEntity>(tableName: string): Promise<T[]> {
    return this.find<T>(tableName);
  }

  async find<T extends BaseEntity>(
    tableName: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    await this.initialize();
    
    try {
      const collectionRef = collection(this.db, tableName);
      const constraints: QueryConstraint[] = [];

      // 添加过滤条件
      if (options.where) {
        constraints.push(where(options.where.field, options.where.operator, options.where.value));
      }

      // 添加排序
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // 添加分页
      if (options.limit) {
        constraints.push(limit(options.limit));
      }

      // 添加游标
      if (options.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.deserialize<T>(doc.data()));
    } catch (error) {
      throw new FirebaseError('Failed to find documents', error as Error);
    }
  }

  async query<T extends BaseEntity>(
    tableName: string,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    const items = await this.find<T>(tableName, options);
    return {
      data: items,
      total: items.length,
      hasMore: false
    };
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    const items = await this.find(tableName, filter ? {
      where: {
        field: Object.keys(filter)[0],
        operator: '==',
        value: filter[Object.keys(filter)[0]]
      }
    } : undefined);
    return items.length;
  }

  async update<T extends BaseEntity>(
    tableName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    await this.initialize();
    
    try {
      const docRef = doc(this.db, tableName, id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await updateDoc(docRef, this.serialize(updateData));
    } catch (error) {
      throw new FirebaseError('Failed to update document', error as Error);
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.initialize();
    
    try {
      const docRef = doc(this.db, tableName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw new FirebaseError('Failed to delete document', error as Error);
    }
  }

  async transaction<T>(
    callback: (transaction: any) => Promise<T>
  ): Promise<T> {
    await this.initialize();
    
    try {
      return await callback(this.db);
    } catch (error) {
      throw new FirebaseError('Transaction failed', error as Error);
    }
  }

  async executeRawQuery<T>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    // Firebase 不支持原始 SQL 查询
    throw new FirebaseError('Raw SQL queries are not supported in Firebase');
  }

  private serialize(data: any): DocumentData {
    // 将 Date 对象转换为 Firestore Timestamp
    const serialized = { ...data };
    for (const key in serialized) {
      if (serialized[key] instanceof Date) {
        serialized[key] = serialized[key].toISOString();
      }
    }
    return serialized;
  }

  private deserialize<T>(data: DocumentData): T {
    // 将 ISO 字符串转换回 Date 对象
    const deserialized = { ...data };
    for (const key in deserialized) {
      if (typeof deserialized[key] === 'string' && deserialized[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
        deserialized[key] = new Date(deserialized[key]);
      }
    }
    return deserialized as T;
  }

  // 同步方法
  async subscribe<T extends BaseEntity>(
    collectionName: string,
    listener: SyncListener<T>,
    queryOptions?: {
      where?: { field: string; operator: string; value: any }[];
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
    }
  ): Promise<() => void> {
    return this.sync.subscribe(collectionName, listener, queryOptions);
  }

  async unsubscribeAll(): Promise<void> {
    return this.sync.unsubscribeAll();
  }

  async getCacheStatus(collectionName: string): Promise<{
    size: number;
    lastSync: Date | null;
    isOnline: boolean;
  }> {
    return this.sync.getCacheStatus(collectionName);
  }

  async clearCache(collectionName: string): Promise<void> {
    return this.sync.clearCache(collectionName);
  }

  // 冲突解决方法
  async saveWithConflictResolution<T extends BaseEntity>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    await this.initialize();
    
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new FirebaseError('User not authenticated', new Error('Authentication required'));
      }

      return await this.conflict.saveWithConflictResolution(
        collectionName,
        id,
        data,
        currentUser.uid
      );
    } catch (error) {
      throw new FirebaseError('Failed to save with conflict resolution', error as Error);
    }
  }

  async getConflictHistory(
    collectionName: string,
    id: string
  ): Promise<ConflictMetadata[]> {
    await this.initialize();
    
    try {
      return await this.conflict.getConflictHistory(collectionName, id);
    } catch (error) {
      throw new FirebaseError('Failed to get conflict history', error as Error);
    }
  }

  // 性能优化方法
  async optimizeQuery<T extends BaseEntity>(
    collectionName: string,
    options: QueryOptions
  ): Promise<T[]> {
    await this.initialize();
    
    try {
      const queryOptions = {
        where: options.where ? [options.where] : undefined,
        orderBy: options.orderBy ? [options.orderBy] : undefined,
        limit: options.limit,
        startAfter: options.startAfter
      };

      return await this.performance.optimizeQuery<T>(
        collectionName,
        queryOptions
      );
    } catch (error) {
      throw new FirebaseError('Failed to optimize query', error as Error);
    }
  }

  async queueBatchOperation<T extends BaseEntity>(
    collectionName: string,
    operation: 'create' | 'update' | 'delete',
    data: T
  ): Promise<void> {
    await this.initialize();
    
    try {
      await this.performance.queueBatchOperation(
        collectionName,
        operation,
        data
      );
    } catch (error) {
      throw new FirebaseError('Failed to queue batch operation', error as Error);
    }
  }

  async optimizeIndexes(collectionName: string): Promise<void> {
    await this.initialize();
    
    try {
      await this.performance.optimizeIndexes(collectionName);
    } catch (error) {
      throw new FirebaseError('Failed to optimize indexes', error as Error);
    }
  }

  getQueryMetrics(collectionName: string) {
    return this.performance.getQueryMetrics(collectionName);
  }

  clearCache(): void {
    this.performance.clearCache();
  }

  // 部署和监控方法
  async deploy(version: string): Promise<void> {
    await this.initialize();
    
    try {
      await this.deployment.deploy(version);
    } catch (error) {
      throw new FirebaseError('Failed to deploy', error as Error);
    }
  }

  async rollback(): Promise<void> {
    await this.initialize();
    
    try {
      await this.deployment.rollback();
    } catch (error) {
      throw new FirebaseError('Failed to rollback', error as Error);
    }
  }

  async runHealthCheck(): Promise<HealthCheckResult> {
    await this.initialize();
    
    try {
      return await this.deployment.runHealthCheck();
    } catch (error) {
      throw new FirebaseError('Failed to run health check', error as Error);
    }
  }

  getDeploymentStatus(): DeploymentStatus | null {
    return this.deployment.getDeploymentStatus();
  }

  getHealthCheckResults(): HealthCheckResult[] {
    return this.deployment.getHealthCheckResults();
  }

  startMonitoring(): void {
    this.deployment.startMonitoring();
  }

  stopMonitoring(): void {
    this.deployment.stopMonitoring();
  }

  // 实现 IDatabaseClient 接口的其他方法
  async findUsers(query?: any): Promise<User[]> {
    return this.find<User>('users', query);
  }

  async findMatches(query?: any): Promise<Match[]> {
    return this.find<Match>('matches', query);
  }

  async findMessages(query?: any): Promise<Message[]> {
    return this.find<Message>('messages', query);
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    return this.create<User>('users', data);
  }

  async createMatch(data: Omit<Match, 'id'>): Promise<Match> {
    return this.create<Match>('matches', data);
  }

  async createMessage(data: Omit<Message, 'id'>): Promise<Message> {
    return this.create<Message>('messages', data);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.update<User>('users', id, data);
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    return this.update<Match>('matches', id, data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    return this.update<Message>('messages', id, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete('users', id);
  }

  async deleteMatch(id: string): Promise<void> {
    return this.delete('matches', id);
  }

  async deleteMessage(id: string): Promise<void> {
    return this.delete('messages', id);
  }

  async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    await this.initialize();
    
    try {
      const batch = writeBatch(this.db);
      
      for (const operation of operations) {
        const docRef = doc(this.db, tableName, operation.data.id);
        
        switch (operation.type) {
          case 'add':
          case 'put':
            batch.set(docRef, this.serialize(operation.data));
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }
      
      await batch.commit();
    } catch (error) {
      throw new FirebaseError('Failed to execute batch operation', error as Error);
    }
  }

  async beginTransaction(): Promise<void> {
    // Firebase 不支持显式事务
    throw new FirebaseError('Explicit transactions are not supported in Firebase');
  }

  async commitTransaction(): Promise<void> {
    // Firebase 不支持显式事务
    throw new FirebaseError('Explicit transactions are not supported in Firebase');
  }

  async rollbackTransaction(): Promise<void> {
    // Firebase 不支持显式事务
    throw new FirebaseError('Explicit transactions are not supported in Firebase');
  }
} 