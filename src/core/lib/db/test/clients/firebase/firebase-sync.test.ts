import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebaseSyncService } from '../../../../clients/firebase/firebase-sync';
import { mockFirestore, testDocument, createMockSnapshot, createMockError } from './mocks';

describe('FirebaseSyncService', () => {
  let syncService: FirebaseSyncService;

  beforeEach(() => {
    syncService = new FirebaseSyncService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('syncData', () => {
    it('should sync data in real-time', async () => {
      const collection = 'test-collection';
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockFirestore.collection.mockReturnValueOnce({
        onSnapshot: vi.fn().mockImplementationOnce((callback) => {
          callback(createMockSnapshot(testDocument));
          return unsubscribe;
        }),
      });

      const result = await syncService.syncData(collection, callback);

      expect(result).toBe(unsubscribe);
      expect(mockFirestore.collection).toHaveBeenCalledWith(collection);
      expect(callback).toHaveBeenCalledWith(testDocument);
    });

    it('should handle sync error', async () => {
      const collection = 'test-collection';
      const callback = vi.fn();

      mockFirestore.collection.mockReturnValueOnce({
        onSnapshot: vi.fn().mockImplementationOnce((callback, errorCallback) => {
          errorCallback(createMockError('sync-failed', 'Sync failed'));
        }),
      });

      await expect(syncService.syncData(collection, callback)).rejects.toThrow(
        'Sync failed'
      );
    });
  });

  describe('syncDocument', () => {
    it('should sync single document', async () => {
      const collection = 'test-collection';
      const docId = testDocument.id;
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockFirestore.doc.mockReturnValueOnce({
        onSnapshot: vi.fn().mockImplementationOnce((callback) => {
          callback(createMockSnapshot(testDocument));
          return unsubscribe;
        }),
      });

      const result = await syncService.syncDocument(collection, docId, callback);

      expect(result).toBe(unsubscribe);
      expect(mockFirestore.doc).toHaveBeenCalledWith(collection, docId);
      expect(callback).toHaveBeenCalledWith(testDocument);
    });

    it('should handle document sync error', async () => {
      const collection = 'test-collection';
      const docId = testDocument.id;
      const callback = vi.fn();

      mockFirestore.doc.mockReturnValueOnce({
        onSnapshot: vi.fn().mockImplementationOnce((callback, errorCallback) => {
          errorCallback(createMockError('sync-failed', 'Sync failed'));
        }),
      });

      await expect(
        syncService.syncDocument(collection, docId, callback)
      ).rejects.toThrow('Sync failed');
    });
  });

  describe('syncQuery', () => {
    it('should sync query results', async () => {
      const collection = 'test-collection';
      const query = {
        where: [['field', '==', 'value']],
        orderBy: [['field', 'desc']],
        limit: 10,
      };
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockFirestore.collection.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        onSnapshot: vi.fn().mockImplementationOnce((callback) => {
          callback(createMockSnapshot(testDocument));
          return unsubscribe;
        }),
      });

      const result = await syncService.syncQuery(collection, query, callback);

      expect(result).toBe(unsubscribe);
      expect(mockFirestore.collection).toHaveBeenCalledWith(collection);
      expect(callback).toHaveBeenCalledWith(testDocument);
    });

    it('should handle query sync error', async () => {
      const collection = 'test-collection';
      const query = {
        where: [['field', '==', 'value']],
        orderBy: [['field', 'desc']],
        limit: 10,
      };
      const callback = vi.fn();

      mockFirestore.collection.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        onSnapshot: vi.fn().mockImplementationOnce((callback, errorCallback) => {
          errorCallback(createMockError('sync-failed', 'Sync failed'));
        }),
      });

      await expect(syncService.syncQuery(collection, query, callback)).rejects.toThrow(
        'Sync failed'
      );
    });
  });

  describe('batchSync', () => {
    it('should sync multiple documents in batch', async () => {
      const collection = 'test-collection';
      const docIds = ['doc-1', 'doc-2'];
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      mockFirestore.batch.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          docs: docIds.map(id => createMockSnapshot({ id, data: {} })),
        }),
      });

      const result = await syncService.batchSync(collection, docIds, callback);

      expect(result).toBeDefined();
      expect(mockFirestore.batch).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining(
          docIds.map(id => expect.objectContaining({ id }))
        )
      );
    });

    it('should handle batch sync error', async () => {
      const collection = 'test-collection';
      const docIds = ['doc-1', 'doc-2'];
      const callback = vi.fn();

      mockFirestore.batch.mockReturnValueOnce({
        get: vi.fn().mockRejectedValueOnce(
          createMockError('sync-failed', 'Sync failed')
        ),
      });

      await expect(syncService.batchSync(collection, docIds, callback)).rejects.toThrow(
        'Sync failed'
      );
    });
  });

  describe('offlineSync', () => {
    it('should handle offline data sync', async () => {
      const collection = 'test-collection';
      const data = { field: 'value' };
      const callback = vi.fn();

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockResolvedValueOnce(undefined),
        }),
      });

      await syncService.offlineSync(collection, data, callback);

      expect(mockFirestore.collection).toHaveBeenCalledWith(collection);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining(data));
    });

    it('should handle offline sync error', async () => {
      const collection = 'test-collection';
      const data = { field: 'value' };
      const callback = vi.fn();

      mockFirestore.collection.mockReturnValueOnce({
        doc: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockRejectedValueOnce(
            createMockError('sync-failed', 'Sync failed')
          ),
        }),
      });

      await expect(syncService.offlineSync(collection, data, callback)).rejects.toThrow(
        'Sync failed'
      );
    });
  });
}); 