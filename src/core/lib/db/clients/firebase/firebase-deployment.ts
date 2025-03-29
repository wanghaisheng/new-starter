import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, Timestamp, Firestore, getDocs, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

export interface DeploymentOptions {
  environment: 'development' | 'staging' | 'production';
  backupEnabled: boolean;
  rollbackEnabled: boolean;
  healthCheckEnabled: boolean;
  monitoringEnabled: boolean;
}

export interface DeploymentStatus {
  version: string;
  environment: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  timestamp: Date;
  backupUrl?: string;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  metrics: {
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  issues: string[];
}

export class FirebaseDeploymentService {
  private readonly defaultOptions: DeploymentOptions = {
    environment: 'development',
    backupEnabled: true,
    rollbackEnabled: true,
    healthCheckEnabled: true,
    monitoringEnabled: true
  };

  private deploymentStatus: DeploymentStatus | null = null;
  private healthCheckResults: HealthCheckResult[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private options: DeploymentOptions = {
      environment: 'development',
      backupEnabled: true,
      rollbackEnabled: true,
      healthCheckEnabled: true,
      monitoringEnabled: true
    }
  ) {
    this.options = { ...this.defaultOptions, ...options };
  }

  async deploy(version: string): Promise<void> {
    try {
      // Update deployment status
      this.deploymentStatus = {
        version,
        environment: this.options.environment,
        status: 'in_progress',
        timestamp: new Date()
      };

      // Create backup if enabled
      if (this.options.backupEnabled) {
        await this.createBackup();
      }

      // Execute deployment
      await this.executeDeployment(version);

      // Run health check if enabled
      if (this.options.healthCheckEnabled) {
        await this.runHealthCheck();
      }

      // Start monitoring if enabled
      if (this.options.monitoringEnabled) {
        this.startMonitoring();
      }

      // Update deployment status to completed
      if (this.deploymentStatus) {
        this.deploymentStatus.status = 'completed';
        await this.saveDeploymentStatus();
      }

    } catch (error) {
      if (this.deploymentStatus) {
        this.deploymentStatus.status = 'failed';
        this.deploymentStatus.error = error instanceof Error ? error.message : 'Unknown error';
        await this.saveDeploymentStatus();
      }
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (!this.deploymentStatus || !this.options.rollbackEnabled) {
      throw new Error('Rollback is not available');
    }

    try {
      this.deploymentStatus.status = 'in_progress';
      await this.saveDeploymentStatus();

      // Restore from backup
      await this.restoreFromBackup();

      this.deploymentStatus.status = 'rolled_back';
      await this.saveDeploymentStatus();
    } catch (error) {
      if (this.deploymentStatus) {
        this.deploymentStatus.status = 'failed';
        this.deploymentStatus.error = error instanceof Error ? error.message : 'Unknown error';
        await this.saveDeploymentStatus();
      }
      throw error;
    }
  }

  async runHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date(),
      metrics: {
        responseTime: 0,
        errorRate: 0,
        activeConnections: 0
      },
      issues: []
    };

    try {
      // Check database connectivity
      const db = getFirestore();
      const healthCheckRef = doc(db, 'health_check', 'test');
      await getDoc(healthCheckRef);

      // Check storage connectivity
      const storage = getStorage();
      const healthCheckStorageRef = ref(storage, 'health_check.txt');
      await getDownloadURL(healthCheckStorageRef);

      // Calculate metrics
      result.metrics.responseTime = Date.now() - startTime;
      result.metrics.activeConnections = await this.getActiveConnections();

      // Update health check results
      this.healthCheckResults.push(result);
      if (this.healthCheckResults.length > 100) {
        this.healthCheckResults.shift();
      }

      return result;
    } catch (error) {
      result.status = 'unhealthy';
      result.issues.push(error instanceof Error ? error.message : 'Unknown error');
      this.healthCheckResults.push(result);
      throw error;
    }
  }

  getDeploymentStatus(): DeploymentStatus | null {
    return this.deploymentStatus;
  }

  getHealthCheckResults(): HealthCheckResult[] {
    return this.healthCheckResults;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async createBackup(): Promise<void> {
    if (!this.deploymentStatus) return;

    const db = getFirestore();
    const storage = getStorage();
    const backupRef = ref(storage, `backups/${this.deploymentStatus.version}_${Date.now()}.json`);

    // Create backup data
    const backupData = await this.generateBackupData();

    // Upload backup
    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    await uploadBytes(backupRef, blob);
    const backupUrl = await getDownloadURL(backupRef);

    // Update deployment status with backup URL
    this.deploymentStatus.backupUrl = backupUrl;
    await this.saveDeploymentStatus();
  }

  private async restoreFromBackup(): Promise<void> {
    if (!this.deploymentStatus?.backupUrl) {
      throw new Error('No backup available');
    }

    // Download and restore backup data
    const backupData = await this.downloadBackup(this.deploymentStatus.backupUrl);
    await this.restoreBackupData(backupData);
  }

  private async generateBackupData(): Promise<any> {
    const db = getFirestore();
    const collections = ['users', 'matches', 'messages', 'settings'];
    const backupData: Record<string, any[]> = {};

    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      backupData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString()
      }));
    }

    return {
      timestamp: new Date().toISOString(),
      collections: backupData
    };
  }

  private async downloadBackup(backupUrl: string): Promise<any> {
    try {
      const response = await fetch(backupUrl);
      if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async restoreBackupData(backupData: any): Promise<void> {
    const db = getFirestore();
    const batch = writeBatch(db);

    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
      for (const doc of documents as any[]) {
        const docRef = doc(db, collectionName, doc.id);
        const { id, createdAt, updatedAt, ...data } = doc;
        
        batch.set(docRef, {
          ...data,
          createdAt: Timestamp.fromDate(new Date(createdAt)),
          updatedAt: Timestamp.fromDate(new Date(updatedAt))
        });
      }
    }

    await batch.commit();
  }

  private async getActiveConnections(): Promise<number> {
    const db = getFirestore();
    const connectionsRef = collection(db, 'connections');
    const activeConnectionsRef = doc(connectionsRef, 'active');
    
    try {
      const docSnap = await getDoc(activeConnectionsRef);
      if (docSnap.exists()) {
        return docSnap.data().count || 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get active connections:', error);
      return 0;
    }
  }

  private async saveDeploymentStatus(): Promise<void> {
    if (!this.deploymentStatus) return;

    const db = getFirestore();
    const statusRef = doc(db, 'deployment_status', this.deploymentStatus.version);
    await setDoc(statusRef, {
      ...this.deploymentStatus,
      timestamp: Timestamp.fromDate(this.deploymentStatus.timestamp)
    });
  }

  private async executeDeployment(version: string): Promise<void> {
    const db = getFirestore();
    const deploymentRef = doc(db, 'deployments', version);
    
    try {
      // 1. 更新部署状态
      await setDoc(deploymentRef, {
        version,
        environment: this.options.environment,
        status: 'in_progress',
        timestamp: Timestamp.fromDate(new Date())
      });

      // 2. 执行数据库迁移（如果有）
      await this.executeMigrations(version);

      // 3. 更新数据库索引
      await this.updateIndexes();

      // 4. 更新部署状态为完成
      await updateDoc(deploymentRef, {
        status: 'completed',
        completedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      // 5. 如果失败，更新状态并抛出错误
      await updateDoc(deploymentRef, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: Timestamp.fromDate(new Date())
      });
      throw error;
    }
  }

  private async executeMigrations(version: string): Promise<void> {
    const db = getFirestore();
    const migrationsRef = collection(db, 'migrations');
    const versionRef = doc(migrationsRef, version);

    try {
      const migrationDoc = await getDoc(versionRef);
      if (!migrationDoc.exists()) {
        return; // 没有需要执行的迁移
      }

      const migration = migrationDoc.data();
      if (migration.executed) {
        return; // 迁移已经执行过
      }

      // 执行迁移逻辑
      await this.runMigration(migration);

      // 标记迁移为已执行
      await updateDoc(versionRef, {
        executed: true,
        executedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateIndexes(): Promise<void> {
    const db = getFirestore();
    const indexesRef = collection(db, 'indexes');

    try {
      const indexesSnapshot = await getDocs(indexesRef);
      for (const doc of indexesSnapshot.docs) {
        const index = doc.data();
        await this.createOrUpdateIndex(index);
      }
    } catch (error) {
      throw new Error(`Failed to update indexes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runMigration(migration: any): Promise<void> {
    // 实现具体的迁移逻辑
    // 这里可以根据迁移类型执行不同的操作
    switch (migration.type) {
      case 'schema_update':
        await this.updateSchema(migration.changes);
        break;
      case 'data_transform':
        await this.transformData(migration.transform);
        break;
      case 'index_update':
        await this.updateIndexes();
        break;
      default:
        throw new Error(`Unknown migration type: ${migration.type}`);
    }
  }

  private async updateSchema(changes: any): Promise<void> {
    // 实现模式更新逻辑
    // 例如：添加新字段、修改字段类型等
  }

  private async transformData(transform: any): Promise<void> {
    // 实现数据转换逻辑
    // 例如：数据格式转换、数据清理等
  }

  private async createOrUpdateIndex(index: any): Promise<void> {
    // 实现索引创建或更新逻辑
    // 例如：创建复合索引、更新索引配置等
  }
} 