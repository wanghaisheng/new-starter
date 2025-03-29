import { DatabaseVersion } from '../types';

// 数据库版本定义
export const databaseVersions: DatabaseVersion[] = [
  {
    version: 1,
    statements: [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        photoUrl TEXT,
        bio TEXT,
        interests TEXT,
        birthDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );`,
      
      // 匹配表
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        user1Id TEXT NOT NULL,
        user2Id TEXT NOT NULL,
        isMatched INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (user1Id) REFERENCES users(id),
        FOREIGN KEY (user2Id) REFERENCES users(id)
      );`,
      
      // 消息表
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,
        matchId TEXT NOT NULL,
        isRead INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (senderId) REFERENCES users(id),
        FOREIGN KEY (receiverId) REFERENCES users(id),
        FOREIGN KEY (matchId) REFERENCES matches(id)
      );`
    ]
  },
  {
    version: 2,
    statements: [
      // 添加用户表索引
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(createdAt);`,
      
      // 添加匹配表索引
      `CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1Id);`,
      `CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2Id);`,
      `CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(createdAt);`,
      
      // 添加消息表索引
      `CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);`,
      `CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiverId);`,
      `CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(matchId);`,
      `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(createdAt);`
    ]
  }
];

// 获取最新版本号
export const getLatestVersion = (): number => {
  return Math.max(...databaseVersions.map(v => v.version));
};

// 获取指定版本的所有升级语句
export const getUpgradeStatements = (fromVersion: number, toVersion: number): string[] => {
  return databaseVersions
    .filter(v => v.version > fromVersion && v.version <= toVersion)
    .flatMap(v => v.statements);
};

// 验证数据库版本
export const validateVersion = (version: number): boolean => {
  return databaseVersions.some(v => v.version === version);
}; 