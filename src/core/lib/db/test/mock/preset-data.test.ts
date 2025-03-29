import { generateUsers, generateMatches, generateMessages, generatePresetData } from './preset-data';

describe('Preset Data Generation', () => {
  describe('User Generation', () => {
    it('should generate users with correct structure', () => {
      const users = generateUsers(5);
      
      expect(users).toHaveLength(5);
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('photoUrl');
        expect(user).toHaveProperty('bio');
        expect(user).toHaveProperty('interests');
        expect(user).toHaveProperty('birthDate');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        
        expect(Array.isArray(user.interests)).toBe(true);
        expect(user.interests.length).toBeGreaterThan(0);
        expect(user.interests.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Match Generation', () => {
    it('should generate matches with correct structure', () => {
      const users = generateUsers(10);
      const matches = generateMatches(users, 3);
      
      expect(matches).toHaveLength(3);
      matches.forEach(match => {
        expect(match).toHaveProperty('id');
        expect(match).toHaveProperty('user1Id');
        expect(match).toHaveProperty('user2Id');
        expect(match).toHaveProperty('isMatched');
        expect(match).toHaveProperty('createdAt');
        expect(match).toHaveProperty('updatedAt');
        
        expect(match.user1Id).not.toBe(match.user2Id);
        expect(users.some(u => u.id === match.user1Id)).toBe(true);
        expect(users.some(u => u.id === match.user2Id)).toBe(true);
      });
    });

    it('should not generate duplicate matches', () => {
      const users = generateUsers(5);
      const matches = generateMatches(users, 10);
      
      const matchPairs = new Set();
      matches.forEach(match => {
        const pair = [match.user1Id, match.user2Id].sort().join('-');
        expect(matchPairs.has(pair)).toBe(false);
        matchPairs.add(pair);
      });
    });
  });

  describe('Message Generation', () => {
    it('should generate messages with correct structure', () => {
      const users = generateUsers(10);
      const matches = generateMatches(users, 5);
      const messages = generateMessages(users, matches, 5);
      
      expect(messages).toHaveLength(5);
      messages.forEach(message => {
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('senderId');
        expect(message).toHaveProperty('receiverId');
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('isRead');
        expect(message).toHaveProperty('createdAt');
        expect(message).toHaveProperty('updatedAt');
        
        expect(message.senderId).not.toBe(message.receiverId);
        expect(users.some(u => u.id === message.senderId)).toBe(true);
        expect(users.some(u => u.id === message.receiverId)).toBe(true);
      });
    });

    it('should generate messages only between matched users', () => {
      const users = generateUsers(10);
      const matches = generateMatches(users, 5);
      const messages = generateMessages(users, matches, 10);
      
      messages.forEach(message => {
        const match = matches.find(m => 
          (m.user1Id === message.senderId && m.user2Id === message.receiverId) ||
          (m.user2Id === message.senderId && m.user1Id === message.receiverId)
        );
        expect(match).toBeDefined();
      });
    });
  });

  describe('Complete Preset Data Generation', () => {
    it('should generate complete preset data', () => {
      const data = generatePresetData();
      
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('matches');
      expect(data).toHaveProperty('messages');
      
      expect(data.users).toHaveLength(10);
      expect(data.matches).toHaveLength(5);
      expect(data.messages).toHaveLength(20);
    });
  });
}); 