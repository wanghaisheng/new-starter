import { 
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { BaseEntity } from '../../interfaces';

export interface ConflictResolutionStrategy {
  // 服务器优先：使用服务器版本
  SERVER_FIRST: 'SERVER_FIRST';
  // 客户端优先：使用客户端版本
  CLIENT_FIRST: 'CLIENT_FIRST';
  // 合并：合并两个版本
  MERGE: 'MERGE';
  // 自定义：使用自定义合并函数
  CUSTOM: 'CUSTOM';
}

export interface ConflictMetadata {
  version: number;
  lastModified: Date;
  modifiedBy: string;
  changes: string[];
}

export interface ConflictResolutionOptions {
  strategy: keyof ConflictResolutionStrategy;
  customMerge?: (serverData: any, clientData: any) => any;
  maxRetries?: number;
  retryDelay?: number;
}

export class FirebaseConflictService {
  private readonly VERSION_FIELD = '_version';
  private readonly METADATA_FIELD = '_metadata';

  constructor(
    private db: Firestore,
    private options: ConflictResolutionOptions = {
      strategy: 'SERVER_FIRST',
      maxRetries: 3,
      retryDelay: 1000
    }
  ) {}

  async saveWithConflictResolution<T extends BaseEntity>(
    collectionName: string,
    id: string,
    data: Partial<T>,
    userId: string
  ): Promise<T> {
    let retries = 0;
    while (retries < (this.options.maxRetries || 3)) {
      try {
        const docRef = doc(this.db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // 文档不存在，直接创建
          const newData = {
            ...data,
            [this.VERSION_FIELD]: 1,
            [this.METADATA_FIELD]: {
              version: 1,
              lastModified: serverTimestamp(),
              modifiedBy: userId,
              changes: Object.keys(data)
            }
          };
          await setDoc(docRef, newData);
          return newData as T;
        }

        const serverData = docSnap.data();
        const serverVersion = serverData[this.VERSION_FIELD] || 0;
        const clientVersion = data[this.VERSION_FIELD] || 0;

        if (serverVersion > clientVersion) {
          // 服务器版本更新，需要解决冲突
          const resolvedData = await this.resolveConflict(
            serverData,
            data,
            serverVersion,
            clientVersion,
            userId
          );
          await updateDoc(docRef, resolvedData);
          return resolvedData as T;
        } else {
          // 客户端版本更新或相等，直接保存
          const newData = {
            ...data,
            [this.VERSION_FIELD]: serverVersion + 1,
            [this.METADATA_FIELD]: {
              version: serverVersion + 1,
              lastModified: serverTimestamp(),
              modifiedBy: userId,
              changes: Object.keys(data)
            }
          };
          await updateDoc(docRef, newData);
          return newData as T;
        }
      } catch (error) {
        retries++;
        if (retries === (this.options.maxRetries || 3)) {
          throw error;
        }
        await new Promise(resolve => 
          setTimeout(resolve, this.options.retryDelay || 1000)
        );
      }
    }
    throw new Error('Max retries exceeded');
  }

  private async resolveConflict(
    serverData: any,
    clientData: any,
    serverVersion: number,
    clientVersion: number,
    userId: string
  ): Promise<any> {
    switch (this.options.strategy) {
      case 'SERVER_FIRST':
        return this.serverFirstStrategy(serverData, clientData, serverVersion, userId);
      case 'CLIENT_FIRST':
        return this.clientFirstStrategy(serverData, clientData, serverVersion, userId);
      case 'MERGE':
        return this.mergeStrategy(serverData, clientData, serverVersion, userId);
      case 'CUSTOM':
        if (this.options.customMerge) {
          return this.options.customMerge(serverData, clientData);
        }
        throw new Error('Custom merge function not provided');
      default:
        throw new Error('Invalid conflict resolution strategy');
    }
  }

  private serverFirstStrategy(
    serverData: any,
    clientData: any,
    serverVersion: number,
    userId: string
  ): any {
    return {
      ...serverData,
      [this.VERSION_FIELD]: serverVersion + 1,
      [this.METADATA_FIELD]: {
        version: serverVersion + 1,
        lastModified: serverTimestamp(),
        modifiedBy: userId,
        changes: Object.keys(clientData)
      }
    };
  }

  private clientFirstStrategy(
    serverData: any,
    clientData: any,
    serverVersion: number,
    userId: string
  ): any {
    return {
      ...clientData,
      [this.VERSION_FIELD]: serverVersion + 1,
      [this.METADATA_FIELD]: {
        version: serverVersion + 1,
        lastModified: serverTimestamp(),
        modifiedBy: userId,
        changes: Object.keys(clientData)
      }
    };
  }

  private mergeStrategy(
    serverData: any,
    clientData: any,
    serverVersion: number,
    userId: string
  ): any {
    const mergedData = { ...serverData };
    const changes: string[] = [];

    for (const key in clientData) {
      if (key === this.VERSION_FIELD || key === this.METADATA_FIELD) {
        continue;
      }

      if (clientData[key] !== serverData[key]) {
        mergedData[key] = clientData[key];
        changes.push(key);
      }
    }

    return {
      ...mergedData,
      [this.VERSION_FIELD]: serverVersion + 1,
      [this.METADATA_FIELD]: {
        version: serverVersion + 1,
        lastModified: serverTimestamp(),
        modifiedBy: userId,
        changes
      }
    };
  }

  // 获取文档的冲突历史
  async getConflictHistory(
    collectionName: string,
    id: string
  ): Promise<ConflictMetadata[]> {
    const docRef = doc(this.db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return [];
    }

    const data = docSnap.data();
    const metadata = data[this.METADATA_FIELD];
    if (!metadata) {
      return [];
    }

    return [{
      version: metadata.version,
      lastModified: (metadata.lastModified as Timestamp).toDate(),
      modifiedBy: metadata.modifiedBy,
      changes: metadata.changes
    }];
  }
} 