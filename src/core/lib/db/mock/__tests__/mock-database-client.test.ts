import { describe, expect, it, beforeEach } from 'bun:test';
import { MockDatabaseClient } from '../mock-database-client';
import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

describe('MockDatabaseClient', () => {
  let client: MockDatabaseClient;

  beforeEach(async () => {
    client = new MockDatabaseClient();
    await client.initialize();
  });

  describe('User operations', () => {
    const testUser: User = {
      id: '3',
      name: '测试用户',
      age: 30,
      bio: '测试简介',
      images: ['https://picsum.photos/400/600?random=3'],
      interests: ['测试'],
      location: { latitude: 39.9042, longitude: 116.4074 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should save and retrieve a user', async () => {
      await client.saveUser(testUser);
      const retrieved = await client.getUser(testUser.id);
      expect(retrieved).toEqual(testUser);
    });

    it('should return null for non-existent user', async () => {
      const retrieved = await client.getUser('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should update an existing user', async () => {
      await client.saveUser(testUser);
      const updatedUser = { ...testUser, name: '更新后的名字' };
      await client.updateUser(updatedUser);
      const retrieved = await client.getUser(testUser.id);
      expect(retrieved?.name).toBe('更新后的名字');
    });

    it('should throw error when updating non-existent user', async () => {
      const updatedUser = { ...testUser, id: 'non-existent' };
      await expect(client.updateUser(updatedUser)).rejects.toThrow();
    });

    it('should delete a user', async () => {
      await client.saveUser(testUser);
      await client.deleteUser(testUser.id);
      const retrieved = await client.getUser(testUser.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Match operations', () => {
    const testMatch: Match = {
      id: '1',
      userId1: '1',
      userId2: '2',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should save and retrieve a match', async () => {
      await client.saveMatch(testMatch);
      const retrieved = await client.getMatch(testMatch.id);
      expect(retrieved).toEqual(testMatch);
    });

    it('should get matches by user ID', async () => {
      await client.saveMatch(testMatch);
      const matches = await client.getMatchesByUserId(testMatch.userId1);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual(testMatch);
    });

    it('should update a match status', async () => {
      await client.saveMatch(testMatch);
      const updatedMatch = { ...testMatch, status: 'accepted' as const };
      await client.updateMatch(updatedMatch);
      const retrieved = await client.getMatch(testMatch.id);
      expect(retrieved?.status).toBe('accepted');
    });

    it('should delete a match', async () => {
      await client.saveMatch(testMatch);
      await client.deleteMatch(testMatch.id);
      const retrieved = await client.getMatch(testMatch.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Message operations', () => {
    const testMessage: Message = {
      id: '1',
      matchId: '1',
      senderId: '1',
      content: '测试消息',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('should save and retrieve a message', async () => {
      await client.saveMessage(testMessage);
      const retrieved = await client.getMessage(testMessage.id);
      expect(retrieved).toEqual(testMessage);
    });

    it('should get messages by match ID', async () => {
      await client.saveMessage(testMessage);
      const messages = await client.getMessagesByMatchId(testMessage.matchId);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(testMessage);
    });

    it('should update a message', async () => {
      await client.saveMessage(testMessage);
      const updatedMessage = { ...testMessage, content: '更新后的消息' };
      await client.updateMessage(updatedMessage);
      const retrieved = await client.getMessage(testMessage.id);
      expect(retrieved?.content).toBe('更新后的消息');
    });

    it('should delete a message', async () => {
      await client.saveMessage(testMessage);
      await client.deleteMessage(testMessage.id);
      const retrieved = await client.getMessage(testMessage.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Database management', () => {
    it('should clear all data', async () => {
      const testUser: User = {
        id: '3',
        name: '测试用户',
        age: 30,
        bio: '测试简介',
        images: ['https://picsum.photos/400/600?random=3'],
        interests: ['测试'],
        location: { latitude: 39.9042, longitude: 116.4074 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveUser(testUser);
      await client.clear();
      const retrieved = await client.getUser(testUser.id);
      expect(retrieved).toBeNull();
    });
  });
}); 