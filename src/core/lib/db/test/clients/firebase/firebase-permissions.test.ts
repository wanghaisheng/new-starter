import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebasePermissionsService } from '../../../../clients/firebase/firebase-permissions';
import { mockFirestore, testUser, createMockError } from './mocks';

describe('FirebasePermissionsService', () => {
  let permissionsService: FirebasePermissionsService;

  beforeEach(() => {
    permissionsService = new FirebasePermissionsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should get user permissions', async () => {
      const userId = testUser.id;
      const mockDoc = {
        exists: () => true,
        data: () => ({
          role: testUser.role,
          permissions: testUser.permissions,
        }),
      };

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce(mockDoc),
      });

      const result = await permissionsService.getUserPermissions(userId);

      expect(result).toEqual({
        role: testUser.role,
        permissions: testUser.permissions,
      });
      expect(mockFirestore.doc).toHaveBeenCalledWith('users', userId);
    });

    it('should handle non-existent user', async () => {
      const userId = 'non-existent-id';
      const mockDoc = {
        exists: () => false,
      };

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce(mockDoc),
      });

      await expect(permissionsService.getUserPermissions(userId)).rejects.toThrow(
        'User not found'
      );
    });

    it('should handle permission fetch error', async () => {
      const userId = testUser.id;

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockRejectedValueOnce(
          createMockError('permission-denied', 'Permission denied')
        ),
      });

      await expect(permissionsService.getUserPermissions(userId)).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('setUserRole', () => {
    it('should set user role', async () => {
      const userId = testUser.id;
      const newRole = 'admin';

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockResolvedValueOnce(undefined),
      });

      await permissionsService.setUserRole(userId, newRole);

      expect(mockFirestore.doc).toHaveBeenCalledWith('users', userId);
      expect(mockFirestore.doc().update).toHaveBeenCalledWith({
        role: newRole,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle role update error', async () => {
      const userId = testUser.id;
      const newRole = 'admin';

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockRejectedValueOnce(
          createMockError('permission-denied', 'Permission denied')
        ),
      });

      await expect(permissionsService.setUserRole(userId, newRole)).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('checkAccess', () => {
    it('should check user access permissions', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';
      const action = 'read';

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: userId,
            permissions: {
              [userId]: ['read', 'write'],
            },
          }),
        }),
      });

      const result = await permissionsService.checkAccess(
        userId,
        resourceId,
        action
      );

      expect(result).toBe(true);
      expect(mockFirestore.doc).toHaveBeenCalledWith('resources', resourceId);
    });

    it('should deny access when user has no permissions', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';
      const action = 'write';

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'other-user',
            permissions: {
              [userId]: ['read'],
            },
          }),
        }),
      });

      const result = await permissionsService.checkAccess(
        userId,
        resourceId,
        action
      );

      expect(result).toBe(false);
    });

    it('should handle access check error', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';
      const action = 'read';

      mockFirestore.doc.mockReturnValueOnce({
        get: vi.fn().mockRejectedValueOnce(
          createMockError('permission-denied', 'Permission denied')
        ),
      });

      await expect(
        permissionsService.checkAccess(userId, resourceId, action)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('grantAccess', () => {
    it('should grant access permissions', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';
      const permissions = ['read', 'write'];

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockResolvedValueOnce(undefined),
      });

      await permissionsService.grantAccess(userId, resourceId, permissions);

      expect(mockFirestore.doc).toHaveBeenCalledWith('resources', resourceId);
      expect(mockFirestore.doc().update).toHaveBeenCalledWith({
        [`permissions.${userId}`]: permissions,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle access grant error', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';
      const permissions = ['read', 'write'];

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockRejectedValueOnce(
          createMockError('permission-denied', 'Permission denied')
        ),
      });

      await expect(
        permissionsService.grantAccess(userId, resourceId, permissions)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke access permissions', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockResolvedValueOnce(undefined),
      });

      await permissionsService.revokeAccess(userId, resourceId);

      expect(mockFirestore.doc).toHaveBeenCalledWith('resources', resourceId);
      expect(mockFirestore.doc().update).toHaveBeenCalledWith({
        [`permissions.${userId}`]: null,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle access revocation error', async () => {
      const userId = testUser.id;
      const resourceId = 'test-resource';

      mockFirestore.doc.mockReturnValueOnce({
        update: vi.fn().mockRejectedValueOnce(
          createMockError('permission-denied', 'Permission denied')
        ),
      });

      await expect(
        permissionsService.revokeAccess(userId, resourceId)
      ).rejects.toThrow('Permission denied');
    });
  });
}); 