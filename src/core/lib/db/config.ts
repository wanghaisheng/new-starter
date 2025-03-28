import { PlatformDatabaseConfig } from './interfaces';

export function getDatabaseConfig(): PlatformDatabaseConfig {
  const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
  const dbName = process.env.NEXT_PUBLIC_OFFLINE_STORAGE_NAME || 'tinder_app';
  const dbVersion = parseInt(process.env.NEXT_PUBLIC_OFFLINE_STORAGE_VERSION || '1');

  const baseConfig: PlatformDatabaseConfig = {
    engine: env as any,
    name: dbName,
    version: dbVersion,
  };

  switch (env) {
    case 'mock':
      return baseConfig;

    case 'local':
      return {
        ...baseConfig,
        engine: 'sqlite',
        sqlite: {
          location: 'local.db',
        },
      };

    case 'production':
      const cloudType = process.env.NEXT_PUBLIC_CLOUD_DB_TYPE || 'supabase';
      const cloudUrl = process.env.NEXT_PUBLIC_CLOUD_DB_URL;
      const cloudKey = process.env.NEXT_PUBLIC_CLOUD_DB_KEY;

      if (!cloudUrl || !cloudKey) {
        throw new Error('Cloud database configuration is missing');
      }

      return {
        ...baseConfig,
        engine: cloudType as any,
        cloud: {
          url: cloudUrl,
          key: cloudKey,
          projectId: process.env.NEXT_PUBLIC_CLOUD_DB_PROJECT_ID,
        },
      };

    default:
      throw new Error(`Unsupported database environment: ${env}`);
  }
}

// 数据库表结构定义
export const DATABASE_SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      profile_image TEXT,
      bio TEXT,
      preferences TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      deleted_at DATETIME
    )
  `,
  matches: `
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      user_id1 TEXT NOT NULL,
      user_id2 TEXT NOT NULL,
      status TEXT NOT NULL,
      matched_at DATETIME,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      deleted_at DATETIME,
      FOREIGN KEY (user_id1) REFERENCES users(id),
      FOREIGN KEY (user_id2) REFERENCES users(id)
    )
  `,
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      deleted_at DATETIME,
      FOREIGN KEY (match_id) REFERENCES matches(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `,
  sync_metadata: `
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `,
};

// 数据库索引定义
export const DATABASE_INDEXES = {
  users: [
    { name: 'email', unique: true },
    { name: 'created_at' },
  ],
  matches: [
    { name: 'user_id1' },
    { name: 'user_id2' },
    { name: 'status' },
    { name: 'created_at' },
  ],
  messages: [
    { name: 'match_id' },
    { name: 'sender_id' },
    { name: 'created_at' },
  ],
}; 