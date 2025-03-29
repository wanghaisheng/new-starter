import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebaseClient } from '../../../../clients/firebase/firebase-client';
import { FirebaseAuthService } from '../../../../clients/firebase/firebase-auth';
import { FirebasePermissionsService } from '../../../../clients/firebase/firebase-permissions';
import { FirebaseSyncService } from '../../../../clients/firebase/firebase-sync';
import { FirebaseConflictService } from '../../../../clients/firebase/firebase-conflict';
import { FirebasePerformanceService } from '../../../../clients/firebase/firebase-performance';
import { FirebaseDeploymentService } from '../../../../clients/firebase/firebase-deployment';
import { mockFirestore, mockAuth, mockAnalytics, createMockError } from './mocks';

describe('Firebase Integration Tests', () => {
  let firebaseClient: FirebaseClient;
  let authService: FirebaseAuthService;
  let permissionsService: FirebasePermissionsService;
  let syncService: FirebaseSyncService;
  let conflictService: FirebaseConflictService;
  let performanceService: FirebasePerformanceService;
  let deploymentService: FirebaseDeploymentService;

  beforeEach(() => {
    firebaseClient = new FirebaseClient();
    authService = new FirebaseAuthService();
    permissionsService = new FirebasePermissionsService();
    syncService = new FirebaseSyncService();
    conflictService = new FirebaseConflictService();
    performanceService = new FirebasePerformanceService();
    deploymentService = new FirebaseDeploymentService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication and Permissions Integration', () => {
    it('should handle user registration with default permissions', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'user1', email: userData.email },
      });

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      const user = await authService.signUp(userData.email, userData.password);
      await permissionsService.setUserRole(user.uid, 'user');

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        userData.email,
        userData.password
      );
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('user_registered', {
        userId: user.uid,
      });
    });

    it('should handle permission changes affecting sync', async () => {
      const userId = 'user1';
      const collection = 'test-collection';

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          get: vi.fn().mockResolvedValueOnce({
            data: () => ({ role: 'admin' }),
          }),
        }),
      });

      await permissionsService.setUserRole(userId, 'admin');
      await syncService.syncData(collection);

      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('permission_changed', {
        userId,
        newRole: 'admin',
      });
    });
  });

  describe('Sync and Conflict Resolution Integration', () => {
    it('should handle concurrent updates with conflict resolution', async () => {
      const docId = 'doc1';
      const data = { field: 'value' };

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          get: vi.fn().mockResolvedValueOnce({
            data: () => ({ field: 'old-value', version: 1 }),
          }),
        }),
      });

      const hasConflict = await conflictService.detectConflicts(docId, data);
      if (hasConflict) {
        await conflictService.resolveConflicts(docId, data);
      }
      await syncService.syncDocument(docId, data);

      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('conflict_resolved', {
        docId,
      });
    });

    it('should handle offline changes with sync', async () => {
      const docId = 'doc1';
      const offlineData = { field: 'offline-value' };

      await syncService.syncDocument(docId, offlineData, true);
      await syncService.syncData('documents');

      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('offline_sync_completed', {
        docId,
      });
    });
  });

  describe('Performance and Monitoring Integration', () => {
    it('should track performance metrics during sync', async () => {
      const collection = 'test-collection';
      const startTime = Date.now();

      mockFirestore.collection.mockReturnValueOnce({
        get: vi.fn().mockImplementationOnce(() => new Promise(resolve => {
          setTimeout(() => {
            resolve({ docs: [] });
          }, 100);
        })),
      });

      const trace = await performanceService.startTrace('sync_operation');
      await syncService.syncData(collection);
      await trace.stop();

      expect(mockPerformance.trace).toHaveBeenCalledWith('sync_operation');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('performance_metrics', {
        operation: 'sync',
        duration: expect.any(Number),
      });
    });

    it('should monitor resource usage during batch operations', async () => {
      const operations = [
        { type: 'set', ref: 'doc1', data: { field: 'value1' } },
        { type: 'update', ref: 'doc2', data: { field: 'value2' } },
      ];

      const startTime = Date.now();
      await performanceService.optimizeBatchOperations(operations);
      const duration = Date.now() - startTime;

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('resource_usage', {
        operation: 'batch',
        duration,
        operationsCount: operations.length,
      });
    });
  });

  describe('Deployment and Health Monitoring Integration', () => {
    it('should handle deployment with health checks', async () => {
      const config = {
        version: '1.0.0',
        environment: 'production',
        features: ['feature1', 'feature2'],
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      await deploymentService.deploy(config);
      const isHealthy = await deploymentService.checkHealth();

      expect(mockFirestore.collection).toHaveBeenCalledWith('deployments');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('deployment_started', config);
      expect(isHealthy).toBe(true);
    });

    it('should handle deployment failures with rollback', async () => {
      const config = {
        version: '1.0.0',
        environment: 'production',
        features: ['feature1', 'feature2'],
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockRejectedValueOnce(
            createMockError('deployment-failed', 'Deployment failed')
          ),
        }),
      });

      try {
        await deploymentService.deploy(config);
      } catch (error) {
        await deploymentService.rollback(config.version, 'Deployment failed');
      }

      expect(mockFirestore.collection).toHaveBeenCalledWith('rollbacks');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('rollback_started', {
        version: config.version,
        reason: 'Deployment failed',
      });
    });
  });

  describe('Full System Integration', () => {
    it('should handle complete user workflow', async () => {
      // 1. 用户注册
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'user1', email: userData.email },
      });

      const user = await authService.signUp(userData.email, userData.password);

      // 2. 设置权限
      await permissionsService.setUserRole(user.uid, 'user');

      // 3. 创建文档
      const docId = 'doc1';
      const data = { field: 'value' };

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      await firebaseClient.createDocument('documents', docId, data);

      // 4. 同步数据
      await syncService.syncDocument(docId, data);

      // 5. 监控性能
      const trace = await performanceService.startTrace('user_workflow');
      await trace.stop();

      // 6. 检查健康状态
      const isHealthy = await deploymentService.checkHealth();

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockPerformance.trace).toHaveBeenCalledWith('user_workflow');
      expect(isHealthy).toBe(true);
    });

    it('should handle system-wide error scenarios', async () => {
      // 1. 模拟认证失败
      mockAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
        createMockError('auth-failed', 'Authentication failed')
      );

      // 2. 尝试登录
      try {
        await authService.signIn('test@example.com', 'password');
      } catch (error) {
        // 3. 记录错误
        await deploymentService.handleAlert({
          type: 'error',
          message: 'Authentication failed',
          severity: 'high',
          timestamp: new Date(),
        });

        // 4. 检查系统健康状态
        const isHealthy = await deploymentService.checkHealth();
        expect(isHealthy).toBe(false);
      }

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('alert_created');
      expect(mockAnalytics.logEvent).toHaveBeenCalledWith('health_check_failed');
    });
  });
}); 