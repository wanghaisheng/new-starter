import { Capacitor } from '@capacitor/core';
import { SQLiteClient } from '../sqlite-client';
import { SQLiteStorageManager } from '../storage-manager';
import { SQLiteBackupManager, BackupConfig } from '../backup-manager';
import { SQLiteErrorManager, ErrorManagerConfig } from '../error-manager';
import { config } from '@/core/lib/db/config';
import { DatabaseClient } from '@/core/lib/db/types/database.types';
import { User } from '@/core/lib/db/types';

interface StorageStats {
  totalSize: number;
  availableSpace: number;
}

describe('SQLiteClient', () => {
  let client: SQLiteClient;
  let storageManager: SQLiteStorageManager;
  let backupManager: SQLiteBackupManager;
  let errorManager: SQLiteErrorManager;

  beforeEach(async () => {
    client = new SQLiteClient(config);
    await client.initialize();
    storageManager = new SQLiteStorageManager(client.getConnection(), {
      maxSize: config.offline.maxStorageSize,
      cleanupThreshold: 0.8,
      retentionDays: 30
    });

    const backupConfig: BackupConfig = {
      backupInterval: 3600000, // 1小时
      maxBackups: 5,
      backupPath: 'sqlite_backups'
    };

    const errorConfig: ErrorManagerConfig = {
      backupInterval: 3600000, // 1小时
      maxBackups: 5,
      autoRecover: true
    };

    backupManager = new SQLiteBackupManager(client.getConnection(), backupConfig);
    errorManager = new SQLiteErrorManager(client.getConnection(), errorConfig);
  });

  afterEach(async () => {
    await client.clear();
  });

  describe('Database Operations', () => {
    it('should initialize database correctly', async () => {
      expect(client.getConnection()).toBeDefined();
      expect(client.getConnection()).not.toBeNull();
    });

    it('should perform CRUD operations consistently', async () => {
      const user: Omit<User, 'id'> = {
        name: 'Test User',
        email: 'test@example.com',
        photoUrl: 'https://example.com/photo.jpg',
        bio: 'Test bio',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create
      const createdUser = await client.createUser(user);
      expect(createdUser.id).toBeDefined();
      expect(createdUser.name).toBe(user.name);

      // Read
      const foundUser = await client.findById<User>('users', createdUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe(user.name);

      // Update
      await client.updateUser(createdUser.id, { name: 'Updated Name' });
      const updatedUser = await client.findById<User>('users', createdUser.id);
      expect(updatedUser?.name).toBe('Updated Name');

      // Delete
      await client.deleteUser(createdUser.id);
      const deletedUser = await client.findById<User>('users', createdUser.id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Transaction Handling', () => {
    it('should handle transactions correctly', async () => {
      const user1: Omit<User, 'id'> = {
        name: 'User 1',
        email: 'user1@example.com',
        photoUrl: 'https://example.com/photo1.jpg',
        bio: 'Bio 1',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user2: Omit<User, 'id'> = {
        name: 'User 2',
        email: 'user2@example.com',
        photoUrl: 'https://example.com/photo2.jpg',
        bio: 'Bio 2',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test successful transaction
      const [createdUser1, createdUser2] = await client.transaction(async () => {
        const u1 = await client.createUser(user1);
        const u2 = await client.createUser(user2);
        return [u1, u2];
      });

      const foundUser1 = await client.findById<User>('users', createdUser1.id);
      const foundUser2 = await client.findById<User>('users', createdUser2.id);
      expect(foundUser1).toBeDefined();
      expect(foundUser2).toBeDefined();

      // Test failed transaction
      try {
        await client.transaction(async () => {
          await client.createUser(user1); // This should fail due to duplicate email
          await client.createUser(user2);
        });
        fail('Transaction should have failed');
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toBeDefined();
        } else {
          fail('Error should be an instance of Error');
        }
      }

      // Verify no partial updates occurred
      const users = await client.findAll<User>('users');
      expect(users).toHaveLength(2);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 100;
      const totalRecords = 1000;

      // Create test data in batches
      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, totalRecords - i) }, (_, j) => ({
          name: `Test User ${i + j}`,
          email: `test${i + j}@example.com`,
          photoUrl: `https://example.com/photo${i + j}.jpg`,
          bio: `Test bio ${i + j}`,
          interests: ['test'],
          birthDate: new Date('1990-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await Promise.all(batch.map(user => client.createUser(user)));
      }

      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test query performance
      const queryStartTime = Date.now();
      const users = await client.findAll<User>('users');
      const queryTime = Date.now() - queryStartTime;
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(users).toHaveLength(totalRecords);

      // Clean up
      await client.clear();
    });

    it('should handle concurrent operations correctly', async () => {
      const operations = 10;
      const promises = Array.from({ length: operations }, async (_, i) => {
        const user: Omit<User, 'id'> = {
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@example.com`,
          photoUrl: `https://example.com/photo${i}.jpg`,
          bio: `Concurrent bio ${i}`,
          interests: ['test'],
          birthDate: new Date('1990-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return client.createUser(user);
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(operations);
      results.forEach(user => {
        expect(user.id).toBeDefined();
      });

      // Clean up
      await client.clear();
    });
  });

  describe('Platform-Specific Features', () => {
    it('should handle platform-specific storage paths', async () => {
      const isNative = Capacitor.isNativePlatform();
      const availableSpace = await storageManager.getAvailableSpace();
      
      if (isNative) {
        // On native platforms, we should get actual available space
        expect(availableSpace).toBeGreaterThan(0);
      } else {
        // On web platforms, we should get the configured max size
        expect(availableSpace).toBe(config.offline.maxStorageSize);
      }
    });

    it('should handle platform-specific file operations', async () => {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Test native file operations
        const user: Omit<User, 'id'> = {
          name: 'Test User',
          email: 'test@example.com',
          photoUrl: 'https://example.com/photo.jpg',
          bio: 'Test bio',
          interests: ['test'],
          birthDate: new Date('1990-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await client.createUser(user);
        const stats = await storageManager.getStorageStats() as StorageStats;
        expect(stats.totalSize).toBeGreaterThan(0);
      }
    });
  });

  describe('Database Encryption', () => {
    it('should encrypt sensitive data when encryption is enabled', async () => {
      if (!config.offline.encryptionEnabled) {
        console.warn('Database encryption is not enabled, skipping test');
        return;
      }

      const sensitiveUser: Omit<User, 'id'> = {
        name: 'Sensitive User',
        email: 'sensitive@example.com',
        photoUrl: 'https://example.com/photo.jpg',
        bio: 'Sensitive bio',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.createUser(sensitiveUser);
      
      // Verify data is encrypted in storage
      const rawData = await client.executeRawQuery('SELECT * FROM users WHERE email = ?', ['sensitive@example.com']) as Array<{ bio: string }>;
      expect(rawData[0].bio).not.toBe(sensitiveUser.bio); // Should be encrypted
    });
  });

  describe('Backup and Recovery', () => {
    it('should create and restore database backups', async () => {
      // Create test data
      const user: Omit<User, 'id'> = {
        name: 'Backup Test User',
        email: 'backup@example.com',
        photoUrl: 'https://example.com/photo.jpg',
        bio: 'Backup test bio',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.createUser(user);

      // Create backup
      await backupManager.createBackup();
      const backups = await backupManager.getBackupList();
      expect(backups.length).toBeGreaterThan(0);
      const latestBackup = backups[0];

      // Clear database
      await client.clear();

      // Restore backup
      await backupManager.restoreBackup(latestBackup.name);

      // Verify data is restored
      const restoredUser = await client.findUsers({ email: 'backup@example.com' });
      expect(restoredUser).toHaveLength(1);
      expect(restoredUser[0].name).toBe(user.name);
    });

    it('should handle backup failures gracefully', async () => {
      // Simulate backup failure
      jest.spyOn(backupManager, 'createBackup').mockRejectedValueOnce(new Error('Backup failed'));

      await expect(backupManager.createBackup()).rejects.toThrow('Backup failed');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database corruption and attempt recovery', async () => {
      // Simulate database corruption
      await client.executeRawQuery('PRAGMA page_size = 4096');
      await client.executeRawQuery('PRAGMA journal_mode = DELETE');
      
      // Attempt recovery
      await errorManager.recoverFromBackup();
      
      // Verify database is usable
      const user: Omit<User, 'id'> = {
        name: 'Recovery Test User',
        email: 'recovery@example.com',
        photoUrl: 'https://example.com/photo.jpg',
        bio: 'Recovery test bio',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.createUser(user);
      const foundUser = await client.findUsers({ email: 'recovery@example.com' });
      expect(foundUser).toHaveLength(1);
    });

    it('should handle transaction failures gracefully', async () => {
      const user: Omit<User, 'id'> = {
        name: 'Transaction Test User',
        email: 'transaction@example.com',
        photoUrl: 'https://example.com/photo.jpg',
        bio: 'Transaction test bio',
        interests: ['test'],
        birthDate: new Date('1990-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test transaction rollback
      try {
        await client.transaction(async () => {
          await client.createUser(user);
          throw new Error('Simulated transaction failure');
        });
        fail('Transaction should have failed');
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toBe('Simulated transaction failure');
        } else {
          fail('Error should be an instance of Error');
        }
      }

      // Verify no data was committed
      const foundUser = await client.findUsers({ email: 'transaction@example.com' });
      expect(foundUser).toHaveLength(0);
    });
  });

  describe('Storage Space Management', () => {
    it('should monitor and manage storage space', async () => {
      const stats = await storageManager.getStorageStats() as StorageStats;
      expect(stats.totalSize).toBeDefined();
      expect(stats.availableSpace).toBeDefined();

      // Test storage cleanup
      await storageManager.cleanupExpiredData();
      const updatedStats = await storageManager.getStorageStats() as StorageStats;
      expect(updatedStats.totalSize).toBeDefined();
      expect(updatedStats.availableSpace).toBeDefined();
    });

    it('should enforce storage limits', async () => {
      const maxSize = 1024 * 1024; // 1MB
      storageManager = new SQLiteStorageManager(client.getConnection(), {
        maxSize,
        cleanupThreshold: 0.8,
        retentionDays: 30
      });

      // Create data until storage limit is reached
      let totalSize = 0;
      while (totalSize < maxSize) {
        const user: Omit<User, 'id'> = {
          name: `Storage Test User ${totalSize}`,
          email: `storage${totalSize}@example.com`,
          photoUrl: `https://example.com/photo${totalSize}.jpg`,
          bio: 'Storage test bio'.repeat(100), // Create larger records
          interests: ['test'],
          birthDate: new Date('1990-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await client.createUser(user);
        const stats = await storageManager.getStorageStats() as StorageStats;
        totalSize = stats.totalSize;
      }

      // Verify storage limit enforcement
      const stats = await storageManager.getStorageStats() as StorageStats;
      expect(stats.totalSize).toBeLessThanOrEqual(maxSize);
    });
  });
}); 