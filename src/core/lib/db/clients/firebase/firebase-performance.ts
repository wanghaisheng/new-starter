import { getFirestore, collection, doc, query, where, orderBy, limit, startAfter, getDocs, writeBatch, Query, CollectionReference } from 'firebase/firestore';
import { LRUCache } from 'lru-cache';

export interface PerformanceOptions {
  cacheSize?: number;
  cacheTTL?: number;
  batchSize?: number;
  queryLimit?: number;
  indexFields?: string[];
}

export interface QueryMetrics {
  executionTime: number;
  documentCount: number;
  cacheHit: boolean;
  timestamp: Date;
}

export class FirebasePerformanceService {
  private cache: LRUCache<string, any>;
  private batchQueue: any[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private metrics: Map<string, QueryMetrics[]> = new Map();
  private readonly defaultOptions: PerformanceOptions = {
    cacheSize: 1000,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    batchSize: 500,
    queryLimit: 100,
    indexFields: ['createdAt', 'updatedAt']
  };

  constructor(private options: PerformanceOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
    this.cache = new LRUCache({
      max: this.options.cacheSize || 1000,
      ttl: this.options.cacheTTL || 5 * 60 * 1000, // Default 5 minutes
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      ttlAutopurge: true
    });
  }

  async optimizeQuery<T>(
    collectionName: string,
    queryOptions: {
      where?: { field: string; operator: string; value: any }[];
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
      startAfter?: any;
    }
  ): Promise<T[]> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(collectionName, queryOptions);

    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      this.recordMetrics(collectionName, {
        executionTime: Date.now() - startTime,
        documentCount: cachedResult.length,
        cacheHit: true,
        timestamp: new Date()
      });
      return cachedResult;
    }

    // Build Firestore query
    let firestoreQuery: Query = collection(getFirestore(), collectionName);
    
    // Apply where clauses
    if (queryOptions.where) {
      for (const condition of queryOptions.where) {
        firestoreQuery = query(firestoreQuery, where(condition.field, condition.operator as any, condition.value));
      }
    }

    // Apply orderBy
    if (queryOptions.orderBy) {
      for (const order of queryOptions.orderBy) {
        firestoreQuery = query(firestoreQuery, orderBy(order.field, order.direction));
      }
    }

    // Apply limit
    const queryLimit = Math.min(queryOptions.limit || this.options.queryLimit!, this.options.queryLimit!);
    firestoreQuery = query(firestoreQuery, limit(queryLimit));

    // Apply startAfter if provided
    if (queryOptions.startAfter) {
      firestoreQuery = query(firestoreQuery, startAfter(queryOptions.startAfter));
    }

    // Execute query
    const snapshot = await getDocs(firestoreQuery);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));

    // Cache results
    this.cache.set(cacheKey, results);

    // Record metrics
    this.recordMetrics(collectionName, {
      executionTime: Date.now() - startTime,
      documentCount: results.length,
      cacheHit: false,
      timestamp: new Date()
    });

    return results;
  }

  async queueBatchOperation<T extends { id: string }>(
    collectionName: string,
    operation: {
      type: 'create' | 'update' | 'delete';
      data?: T;
      id?: string;
    }
  ): Promise<void> {
    this.batchQueue.push({ collectionName, ...operation });

    if (this.batchQueue.length >= this.options.batchSize!) {
      await this.executeBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatch(), 1000);
    }
  }

  private async executeBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = writeBatch(getFirestore());
    const operations = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    for (const op of operations) {
      const { collectionName, type, data, id } = op;
      const ref = doc(getFirestore(), collectionName, id || data?.id || '');

      switch (type) {
        case 'create':
          if (data) batch.set(ref, data);
          break;
        case 'update':
          if (data) batch.update(ref, data);
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    }

    await batch.commit();
  }

  async optimizeIndexes(collectionName: string): Promise<void> {
    const db = getFirestore();
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    // Check existing indexes
    const existingIndexes = await this.getExistingIndexes(collectionName);
    
    // Create missing indexes
    for (const field of this.options.indexFields!) {
      if (!existingIndexes.includes(field)) {
        await this.createIndex(collectionName, field);
      }
    }
  }

  private async getExistingIndexes(collectionName: string): Promise<string[]> {
    // This is a placeholder. In a real implementation, you would query Firestore's index collection
    return [];
  }

  private async createIndex(collectionName: string, field: string): Promise<void> {
    // This is a placeholder. In a real implementation, you would create a Firestore index
    console.log(`Creating index for ${collectionName}.${field}`);
  }

  private generateCacheKey(collectionName: string, queryOptions: any): string {
    return `${collectionName}:${JSON.stringify(queryOptions)}`;
  }

  private recordMetrics(collectionName: string, metrics: QueryMetrics): void {
    if (!this.metrics.has(collectionName)) {
      this.metrics.set(collectionName, []);
    }
    const collectionMetrics = this.metrics.get(collectionName)!;
    collectionMetrics.push(metrics);
    
    // Keep only last 100 metrics per collection
    if (collectionMetrics.length > 100) {
      collectionMetrics.shift();
    }
  }

  getQueryMetrics(collectionName: string): QueryMetrics[] {
    return this.metrics.get(collectionName) || [];
  }

  clearCache(): void {
    this.cache.clear();
    this.metrics.clear();
  }
} 