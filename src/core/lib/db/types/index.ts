import { schemaRegistry } from '../schema';
export * from './database.types';

// Base type for all entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User type definition
export interface User extends BaseEntity {
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  birthDate?: Date;
}

// Match type definition
export interface Match extends BaseEntity {
  user1Id: string;
  user2Id: string;
  isMatched: boolean;
}

// Message type definition
export interface Message extends BaseEntity {
  content: string;
  senderId: string;
  receiverId: string;
  matchId: string;
  isRead: boolean;
}

// Export schema-based type generator
export const getSchemaType = <T extends BaseEntity>(tableName: string): T => {
  const schema = schemaRegistry.getSchema(tableName);
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return {} as T; // This is just for type inference, actual data comes from the database
}; 