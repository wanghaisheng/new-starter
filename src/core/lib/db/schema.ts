import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  users: UserTable;
  matches: MatchTable;
  messages: MessageTable;
}

export interface UserTable {
  id: Generated<string>;
  name: string;
  email: string;
  phone: string;
  bio: string | null;
  birthDate: Date;
  gender: string;
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
  } | null;
  photos: string[];
  isVerified: boolean;
  status: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  privacySettings: Record<string, any>;
  preferences: Record<string, any>;
  notificationSettings: Record<string, any>;
  matching: Record<string, any>;
  isOnline: boolean;
}

export interface MatchTable {
  id: Generated<string>;
  users: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTable {
  id: Generated<string>;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// 导出类型别名，方便使用
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Match = Selectable<MatchTable>;
export type NewMatch = Insertable<MatchTable>;
export type MatchUpdate = Updateable<MatchTable>;

export type Message = Selectable<MessageTable>;
export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>; 