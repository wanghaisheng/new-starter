import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebasePerformanceService } from '../../../../clients/firebase/firebase-performance';
import { mockFirestore, mockPerformance, testDocument, createMockError } from './mocks';

describe('FirebasePerformanceService', () => {
  let performanceService: FirebasePerformanceService;

  beforeEach(() => {
    performanceService = new FirebasePerformanceService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Performance', () => {
    it('should optimize query with caching', async () => {
      const collection = 'test-collection';
      const query = {
        where: [['field', '==', 'value']],
        orderBy: [['field', 'desc']],
        limit: 10,
      };

      mockFirestore.collection.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValueOnce({
          docs: [testDocument],
        }),
      });

      const result = await performanceService.optimizeQuery(collection, query);

      expect(result).toBeDefined();
      expect(mockFirestore.collection).toHaveBeenCalledWith(collection);
      expect(mockPerformance.trace).toHaveBeenCalledWith('query_execution');
    });

    it('should handle query timeout', async () => {
      const collection = 'test-collection';
      const query = {
        where: [['field', '==', 'value']],
        orderBy: [['field', 'desc']],
        limit: 10,
      };

      mockFirestore.collection.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 6000))),
      });

      await expect(performanceService.optimizeQuery(collection, query)).rejects.toThrow(
        'Query timeout'
      );
    });
  });

  describe('Cache Management', () => {
    it('should implement LRU cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      await performanceService.setCache(key, value);
      const result = await performanceService.getCache(key);

      expect(result).toEqual(value);
    });

    it('should handle cache expiration', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      await performanceService.setCache(key, value, 1000); // 1 second expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      const result = await performanceService.getCache(key);

      expect(result).toBeNull();
    });

    it('should clear expired cache entries', async () => {
      const entries = [
        { key: 'key1', value: 'value1', timestamp: Date.now() - 2000 },
        { key: 'key2', value: 'value2', timestamp: Date.now() },
      ];

      await performanceService.clearExpiredCache(entries);
      const result = await performanceService.getCache('key1');

      expect(result).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should optimize batch operations', async () => {
      const operations = [
        { type: 'set', ref: 'doc1', data: { field: 'value1' } },
        { type: 'update', ref: 'doc2', data: { field: 'value2' } },
        { type: 'delete', ref: 'doc3' },
      ];

      mockFirestore.batch.mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValueOnce(undefined),
      });

      await performanceService.optimizeBatchOperations(operations);

      expect(mockFirestore.batch).toHaveBeenCalled();
      expect(mockPerformance.trace).toHaveBeenCalledWith('batch_operations');
    });

    it('should handle batch operation errors', async () => {
      const operations = [
        { type: 'set', ref: 'doc1', data: { field: 'value1' } },
      ];

      mockFirestore.batch.mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        commit: vi.fn().mockRejectedValueOnce(
          createMockError('batch-failed', 'Batch operation failed')
        ),
      });

      await expect(performanceService.optimizeBatchOperations(operations)).rejects.toThrow(
        'Batch operation failed'
      );
    });
  });

  describe('Index Management', () => {
    it('should create and manage indexes', async () => {
      const collection = 'test-collection';
      const fields = ['field1', 'field2'];

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      await performanceService.createIndex(collection, fields);

      expect(mockFirestore.collection).toHaveBeenCalledWith('indexes');
      expect(mockPerformance.trace).toHaveBeenCalledWith('index_creation');
    });

    it('should handle index creation errors', async () => {
      const collection = 'test-collection';
      const fields = ['field1', 'field2'];

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockRejectedValueOnce(
            createMockError('index-creation-failed', 'Index creation failed')
          ),
        }),
      });

      await expect(performanceService.createIndex(collection, fields)).rejects.toThrow(
        'Index creation failed'
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const metricName = 'test_metric';
      const value = 100;

      await performanceService.trackMetric(metricName, value);

      expect(mockPerformance.recordMetric).toHaveBeenCalledWith(metricName, value);
    });

    it('should set performance attributes', async () => {
      const attributeName = 'test_attribute';
      const value = 'test_value';

      await performanceService.setAttribute(attributeName, value);

      expect(mockPerformance.setAttribute).toHaveBeenCalledWith(attributeName, value);
    });

    it('should start and stop performance traces', async () => {
      const traceName = 'test_trace';

      const trace = await performanceService.startTrace(traceName);
      await trace.stop();

      expect(mockPerformance.trace).toHaveBeenCalledWith(traceName);
      expect(mockPerformance.stop).toHaveBeenCalled();
    });
  });

  describe('Query Optimization', () => {
    it('should optimize query with pagination', async () => {
      const collection = 'test-collection';
      const pageSize = 10;
      const lastDoc = testDocument;

      mockFirestore.collection.mockReturnValueOnce({
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValueOnce({
          docs: [testDocument],
        }),
      });

      const result = await performanceService.optimizePagination(collection, pageSize, lastDoc);

      expect(result).toBeDefined();
      expect(mockFirestore.collection).toHaveBeenCalledWith(collection);
      expect(mockPerformance.trace).toHaveBeenCalledWith('pagination_query');
    });

    it('should optimize query with field selection', async () => {
      const collection = 'test-collection';
      const fields = ['field1', 'field2'];

      mockFirestore.collection.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValueOnce({
          docs: [testDocument],
        }),
      });

      const result = await performanceService.optimizeFieldSelection(collection, fields);

      expect(result).toBeDefined();
      expect(mockFirestore.collection).toHaveBeenCalledWith(collection);
      expect(mockPerformance.trace).toHaveBeenCalledWith('field_selection_query');
    });
  });
}); 