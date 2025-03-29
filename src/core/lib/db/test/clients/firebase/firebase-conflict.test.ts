import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebaseConflictService } from '../../../../clients/firebase/firebase-conflict';
import { mockFirestore, testDocument, createMockError } from './mocks';

describe('FirebaseConflictService', () => {
  let conflictService: FirebaseConflictService;

  beforeEach(() => {
    conflictService = new FirebaseConflictService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectConflicts', () => {
    it('should detect conflicts between versions', async () => {
      const docId = testDocument.id;
      const localVersion = 1;
      const remoteVersion = 2;

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            version: remoteVersion,
            updatedAt: new Date(),
          }),
        }),
      });

      const result = await conflictService.detectConflicts(docId, localVersion);

      expect(result).toBe(true);
      expect(mockFirestore.doc).toHaveBeenCalledWith('documents', docId);
    });

    it('should not detect conflicts for same version', async () => {
      const docId = testDocument.id;
      const version = 1;

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            version,
            updatedAt: new Date(),
          }),
        }),
      });

      const result = await conflictService.detectConflicts(docId, version);

      expect(result).toBe(false);
    });

    it('should handle conflict detection error', async () => {
      const docId = testDocument.id;
      const version = 1;

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockRejectedValueOnce(
          createMockError('conflict-detection-failed', 'Conflict detection failed')
        ),
      });

      await expect(conflictService.detectConflicts(docId, version)).rejects.toThrow(
        'Conflict detection failed'
      );
    });
  });

  describe('resolveConflicts', () => {
    it('should resolve conflicts using latest version', async () => {
      const docId = testDocument.id;
      const localData = { field: 'local' };
      const remoteData = { field: 'remote' };
      const remoteVersion = 2;

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ...remoteData,
            version: remoteVersion,
            updatedAt: new Date(),
          }),
        }),
        update: vi.fn().mockResolvedValueOnce(undefined),
      });

      const result = await conflictService.resolveConflicts(
        docId,
        localData,
        remoteData
      );

      expect(result).toEqual({
        ...remoteData,
        version: remoteVersion,
        updatedAt: expect.any(Date),
      });
      expect(mockFirestore.doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          version: remoteVersion,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should handle conflict resolution error', async () => {
      const docId = testDocument.id;
      const localData = { field: 'local' };
      const remoteData = { field: 'remote' };

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockRejectedValueOnce(
          createMockError('conflict-resolution-failed', 'Conflict resolution failed')
        ),
      });

      await expect(
        conflictService.resolveConflicts(docId, localData, remoteData)
      ).rejects.toThrow('Conflict resolution failed');
    });
  });

  describe('mergeChanges', () => {
    it('should merge changes from multiple versions', async () => {
      const docId = testDocument.id;
      const changes = [
        { field: 'value1', version: 1 },
        { field: 'value2', version: 2 },
      ];

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockResolvedValueOnce(undefined),
      });

      const result = await conflictService.mergeChanges(docId, changes);

      expect(result).toBeDefined();
      expect(mockFirestore.doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'value2',
          version: 2,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should handle merge error', async () => {
      const docId = testDocument.id;
      const changes = [
        { field: 'value1', version: 1 },
        { field: 'value2', version: 2 },
      ];

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockRejectedValueOnce(
          createMockError('merge-failed', 'Merge failed')
        ),
      });

      await expect(conflictService.mergeChanges(docId, changes)).rejects.toThrow(
        'Merge failed'
      );
    });
  });

  describe('getConflictHistory', () => {
    it('should get conflict history', async () => {
      const docId = testDocument.id;
      const history = [
        {
          version: 1,
          changes: { field: 'value1' },
          timestamp: new Date(),
        },
        {
          version: 2,
          changes: { field: 'value2' },
          timestamp: new Date(),
        },
      ];

      mockFirestore.collection.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValueOnce({
          docs: history.map(item => ({
            exists: () => true,
            data: () => item,
          })),
        }),
      });

      const result = await conflictService.getConflictHistory(docId);

      expect(result).toEqual(history);
      expect(mockFirestore.collection).toHaveBeenCalledWith('conflicts');
    });

    it('should handle history fetch error', async () => {
      const docId = testDocument.id;

      mockFirestore.collection.mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValueOnce(
          createMockError('history-fetch-failed', 'History fetch failed')
        ),
      });

      await expect(conflictService.getConflictHistory(docId)).rejects.toThrow(
        'History fetch failed'
      );
    });
  });

  describe('resolveConflictsWithStrategy', () => {
    it('should resolve conflicts using specified strategy', async () => {
      const docId = testDocument.id;
      const localData = { field: 'local' };
      const remoteData = { field: 'remote' };
      const strategy = 'latest-wins';

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ...remoteData,
            version: 2,
            updatedAt: new Date(),
          }),
        }),
        update: vi.fn().mockResolvedValueOnce(undefined),
      });

      const result = await conflictService.resolveConflictsWithStrategy(
        docId,
        localData,
        remoteData,
        strategy
      );

      expect(result).toEqual({
        ...remoteData,
        version: 2,
        updatedAt: expect.any(Date),
      });
      expect(mockFirestore.doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should handle strategy resolution error', async () => {
      const docId = testDocument.id;
      const localData = { field: 'local' };
      const remoteData = { field: 'remote' };
      const strategy = 'latest-wins';

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockRejectedValueOnce(
          createMockError('strategy-resolution-failed', 'Strategy resolution failed')
        ),
      });

      await expect(
        conflictService.resolveConflictsWithStrategy(
          docId,
          localData,
          remoteData,
          strategy
        )
      ).rejects.toThrow('Strategy resolution failed');
    });
  });
}); 