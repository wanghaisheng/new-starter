import { schemaRegistry } from '../schema';
export * from './database.types';
export * from './base-entity';

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
  interests?: string[];
  birthDate?: Date;
}

// Match type definition
export interface Match extends BaseEntity {
  userId: string;
  matchedUserId: string;
  status: string;
}

// Message type definition
export interface Message extends BaseEntity {
  senderId: string;
  receiverId: string;
  content: string;
  status: string;
}

// Export schema-based type generator
export const getSchemaType = <T extends BaseEntity>(tableName: string): T => {
  const schema = schemaRegistry.getSchema(tableName);
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return {} as T; // This is just for type inference, actual data comes from the database
}; 