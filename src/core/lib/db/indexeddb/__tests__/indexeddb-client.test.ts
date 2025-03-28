import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

import type { User, Match, Message } from '@/core/types';

import { IndexedDBClient } from '@/core/lib/db/indexeddb/indexeddb-client';
import '@/core/test/mock-indexeddb';

// Extend expect with toContainEqual
declare module 'bun:test' {
  interface Expect {
    toContainEqual(expected: any): void;
  }
}

describe('IndexedDBClient', () => {
  let client: IndexedDBClient;

  beforeEach(async () => {
    client = new IndexedDBClient({
      name: 'test-db',
      version: 1
    });
    await client.initialize();
  });

  afterEach(async () => {
    await client.clear();
  });

  describe('User operations', () => {
    it('should save and retrieve a user', async () => {
      const now = new Date().toISOString();
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        age: 25,
        bio: 'Test bio',
        images: ['https://example.com/image1.jpg'],
        interests: ['music', 'travel'],
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York'
        },
        createdAt: now,
        updatedAt: now
      };

      await client.saveUser(user);
      const retrieved = await client.getUser(user.id);
      expect(retrieved).toEqual(user);
    });

    it('should return null for non-existent user', async () => {
      const user = await client.getUser('non-existent');
      expect(user).toBeNull();
    });

    it('should update an existing user', async () => {
      const now = new Date().toISOString();
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        age: 25,
        bio: 'Test bio',
        images: ['https://example.com/image1.jpg'],
        interests: ['music', 'travel'],
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York'
        },
        createdAt: now,
        updatedAt: now
      };

      await client.saveUser(user);
      const updatedUser = { ...user, name: 'Updated User', updatedAt: new Date().toISOString() };
      await client.updateUser(updatedUser);
      const retrieved = await client.getUser(user.id);
      expect(retrieved).toEqual(updatedUser);
    });

    it('should throw error when updating non-existent user', async () => {
      const now = new Date().toISOString();
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        age: 25,
        bio: 'Test bio',
        images: ['https://example.com/image1.jpg'],
        interests: ['music', 'travel'],
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York'
        },
        createdAt: now,
        updatedAt: now
      };

      try {
        await client.updateUser(user);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const err = error as Error;
        expect(err.message).toBe('User not found');
      }
    });

    it('should delete a user', async () => {
      const now = new Date().toISOString();
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        age: 25,
        bio: 'Test bio',
        images: ['https://example.com/image1.jpg'],
        interests: ['music', 'travel'],
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York'
        },
        createdAt: now,
        updatedAt: now
      };

      await client.saveUser(user);
      await client.deleteUser(user.id);
      const retrieved = await client.getUser(user.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Match operations', () => {
    it('should save and retrieve a match', async () => {
      const match: Match = {
        id: '1',
        userId1: 'user1',
        userId2: 'user2',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMatch(match);
      const retrieved = await client.getMatch(match.id);
      expect(retrieved).toEqual(match);
    });

    it('should get matches by user ID', async () => {
      const match1: Match = {
        id: '1',
        userId1: 'user1',
        userId2: 'user2',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const match2: Match = {
        id: '2',
        userId1: 'user1',
        userId2: 'user3',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMatch(match1);
      await client.saveMatch(match2);
      const matches = await client.getMatchesByUserId('user1');
      expect(matches).toHaveLength(2);
      expect(matches).toEqual([match1, match2]);
    });

    it('should update a match status', async () => {
      const match: Match = {
        id: '1',
        userId1: 'user1',
        userId2: 'user2',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMatch(match);
      const updatedMatch = { ...match, status: 'accepted' as const };
      await client.updateMatch(updatedMatch);
      const retrieved = await client.getMatch(match.id);
      expect(retrieved).toEqual(updatedMatch);
    });

    it('should delete a match', async () => {
      const match: Match = {
        id: '1',
        userId1: 'user1',
        userId2: 'user2',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMatch(match);
      await client.deleteMatch(match.id);
      const retrieved = await client.getMatch(match.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Message operations', () => {
    it('should save and retrieve a message', async () => {
      const message: Message = {
        id: '1',
        matchId: 'match1',
        senderId: 'user1',
        content: 'Hello!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMessage(message);
      const retrieved = await client.getMessage(message.id);
      expect(retrieved).toEqual(message);
    });

    it('should get messages by match ID', async () => {
      const message1: Message = {
        id: '1',
        matchId: 'match1',
        senderId: 'user1',
        content: 'Hello!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const message2: Message = {
        id: '2',
        matchId: 'match1',
        senderId: 'user2',
        content: 'Hi!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMessage(message1);
      await client.saveMessage(message2);
      const messages = await client.getMessagesByMatchId('match1');
      expect(messages).toHaveLength(2);
      expect(messages).toEqual([message1, message2]);
    });

    it('should update a message', async () => {
      const message: Message = {
        id: '1',
        matchId: 'match1',
        senderId: 'user1',
        content: 'Hello!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMessage(message);
      const updatedMessage = { ...message, content: 'Updated message' };
      await client.updateMessage(updatedMessage);
      const retrieved = await client.getMessage(message.id);
      expect(retrieved).toEqual(updatedMessage);
    });

    it('should delete a message', async () => {
      const message: Message = {
        id: '1',
        matchId: 'match1',
        senderId: 'user1',
        content: 'Hello!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await client.saveMessage(message);
      await client.deleteMessage(message.id);
      const retrieved = await client.getMessage(message.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Database management', () => {
    it('should clear all data', async () => {
      const now = new Date().toISOString();
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        age: 25,
        bio: 'Test bio',
        images: ['https://example.com/image1.jpg'],
        interests: ['music', 'travel'],
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York'
        },
        createdAt: now,
        updatedAt: now
      };

      const match: Match = {
        id: '1',
        userId1: 'user1',
        userId2: 'user2',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };

      const message: Message = {
        id: '1',
        matchId: 'match1',
        senderId: 'user1',
        content: 'Hello!',
        createdAt: now,
        updatedAt: now
      };

      await client.saveUser(user);
      await client.saveMatch(match);
      await client.saveMessage(message);

      await client.clear();

      const retrievedUser = await client.getUser(user.id);
      const retrievedMatch = await client.getMatch(match.id);
      const retrievedMessage = await client.getMessage(message.id);

      expect(retrievedUser).toBeNull();
      expect(retrievedMatch).toBeNull();
      expect(retrievedMessage).toBeNull();
    });
  });
}); 