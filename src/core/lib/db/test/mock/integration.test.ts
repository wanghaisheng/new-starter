import { MockIndexedDBClient } from '../../../../clients/mock/indexeddb-client';
import { schemaRegistry } from '../../../../schema';
import { v4 as uuidv4 } from 'uuid';
import { IDBPTransaction } from 'idb';

describe('Mock IndexedDB Client Integration Tests', () => {
  let client: MockIndexedDBClient;
  const testDbName = 'test_db';

  beforeAll(async () => {
    client = new MockIndexedDBClient(testDbName);
    await client.initialize();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await client.clear();
  });

  describe('User Operations', () => {
    const testUser = {
      id: uuidv4(),
      name: 'Test User',
      email: 'test@example.com',
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Test bio',
      interests: ['coding', 'reading'],
      birthDate: new Date('1990-01-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create and retrieve a user', async () => {
      // Create user
      const createdUser = await client.create('users', testUser);
      expect(createdUser).toEqual(testUser);

      // Retrieve user
      const retrievedUser = await client.findById('users', testUser.id);
      expect(retrievedUser).toEqual(testUser);
    });

    it('should update a user', async () => {
      // Create user
      await client.create('users', testUser);

      // Update user
      const updateData = { name: 'Updated Name' };
      await client.update('users', testUser.id, updateData);

      // Verify update
      const updatedUser = await client.findById('users', testUser.id);
      expect(updatedUser?.name).toBe('Updated Name');
    });

    it('should delete a user', async () => {
      // Create user
      await client.create('users', testUser);

      // Delete user
      await client.delete('users', testUser.id);

      // Verify deletion
      const deletedUser = await client.findById('users', testUser.id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Match Operations', () => {
    const testMatch = {
      id: uuidv4(),
      user1Id: uuidv4(),
      user2Id: uuidv4(),
      isMatched: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create and retrieve a match', async () => {
      // Create match
      const createdMatch = await client.create('matches', testMatch);
      expect(createdMatch).toEqual(testMatch);

      // Retrieve match
      const retrievedMatch = await client.findById('matches', testMatch.id);
      expect(retrievedMatch).toEqual(testMatch);
    });

    it('should query matches by user ID', async () => {
      // Create multiple matches
      await client.create('matches', testMatch);
      await client.create('matches', {
        ...testMatch,
        id: uuidv4(),
        user1Id: uuidv4()
      });

      // Query matches
      const matches = await client.query('matches', {
        where: { user1Id: testMatch.user1Id }
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual(testMatch);
    });
  });

  describe('Message Operations', () => {
    const testMessage = {
      id: uuidv4(),
      senderId: uuidv4(),
      receiverId: uuidv4(),
      content: 'Test message',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create and retrieve a message', async () => {
      // Create message
      const createdMessage = await client.create('messages', testMessage);
      expect(createdMessage).toEqual(testMessage);

      // Retrieve message
      const retrievedMessage = await client.findById('messages', testMessage.id);
      expect(retrievedMessage).toEqual(testMessage);
    });

    it('should query messages between users', async () => {
      // Create multiple messages
      await client.create('messages', testMessage);
      await client.create('messages', {
        ...testMessage,
        id: uuidv4(),
        senderId: uuidv4()
      });

      // Query messages
      const messages = await client.query('messages', {
        where: {
          senderId: testMessage.senderId,
          receiverId: testMessage.receiverId
        }
      });
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(testMessage);
    });
  });

  describe('Transaction Operations', () => {
    it('should handle transaction rollback', async () => {
      const testUser = {
        id: uuidv4(),
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        await client.transaction(async (tx: IDBPTransaction) => {
          await client.create('users', testUser);
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Transaction should be rolled back
        const user = await client.findById('users', testUser.id);
        expect(user).toBeNull();
      }
    });

    it('should handle transaction commit', async () => {
      const testUser = {
        id: uuidv4(),
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.transaction(async (tx: IDBPTransaction) => {
        await client.create('users', testUser);
      });

      // Transaction should be committed
      const user = await client.findById('users', testUser.id);
      expect(user).toEqual(testUser);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Create test data
      const users = [
        { id: uuidv4(), name: 'User 1', email: 'user1@example.com', createdAt: new Date(), updatedAt: new Date() },
        { id: uuidv4(), name: 'User 2', email: 'user2@example.com', createdAt: new Date(), updatedAt: new Date() },
        { id: uuidv4(), name: 'User 3', email: 'user3@example.com', createdAt: new Date(), updatedAt: new Date() }
      ];

      for (const user of users) {
        await client.create('users', user);
      }
    });

    it('should support pagination', async () => {
      const users = await client.query('users', {
        limit: 2,
        offset: 0
      });
      expect(users).toHaveLength(2);
    });

    it('should support sorting', async () => {
      const users = await client.query('users', {
        orderBy: 'name'
      });
      expect(users[0].name).toBe('User 1');
    });

    it('should support field selection', async () => {
      const users = await client.query('users', {
        select: ['name', 'email']
      });
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).not.toHaveProperty('id');
    });
  });
}); 