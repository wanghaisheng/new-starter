import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const userSchema: TableSchema = {
  name: 'users',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'phone', type: ColumnType.STRING, notNull: false },
    { name: 'email', type: ColumnType.STRING, notNull: false },
    { name: 'googleId', type: ColumnType.STRING, notNull: false },
    { name: 'name', type: ColumnType.STRING, notNull: true },
    { name: 'nickname', type: ColumnType.STRING, notNull: false },
    { name: 'avatar', type: ColumnType.STRING, notNull: false },
    { name: 'birthDate', type: ColumnType.STRING, notNull: true },
    { name: 'birthTime', type: ColumnType.STRING, notNull: false },
    { name: 'bazi', type: ColumnType.JSON, notNull: false },
    { name: 'gender', type: ColumnType.STRING, notNull: true },
    { name: 'photos', type: ColumnType.JSON, notNull: true },
    { name: 'bio', type: ColumnType.STRING, notNull: false },
    { name: 'interests', type: ColumnType.JSON, notNull: true },
    { name: 'occupation', type: ColumnType.STRING, notNull: false },
    { name: 'education', type: ColumnType.STRING, notNull: false },
    { name: 'location', type: ColumnType.JSON, notNull: true },
    { name: 'preferences', type: ColumnType.JSON, notNull: true },
    { name: 'privacySettings', type: ColumnType.JSON, notNull: true },
    { name: 'notificationSettings', type: ColumnType.JSON, notNull: true },
    { name: 'securitySettings', type: ColumnType.JSON, notNull: false },
    { name: 'isVerified', type: ColumnType.BOOLEAN, notNull: true },
    { name: 'lastActive', type: ColumnType.DATETIME, notNull: true },
    { name: 'isOnline', type: ColumnType.BOOLEAN, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: true },
    { name: 'emailVerified', type: ColumnType.BOOLEAN, notNull: false },
    { name: 'phoneVerified', type: ColumnType.BOOLEAN, notNull: false },
    { name: 'passwordHash', type: ColumnType.STRING, notNull: false },
    { name: 'provider', type: ColumnType.STRING, notNull: false },
    { name: 'displayName', type: ColumnType.STRING, notNull: false },
    { name: 'photoURL', type: ColumnType.STRING, notNull: false },
    { name: 'phoneNumber', type: ColumnType.STRING, notNull: false },
    { name: 'unreadNotifications', type: ColumnType.NUMBER, notNull: false },
    { name: 'tags', type: ColumnType.JSON, notNull: false },
    { name: 'profile', type: ColumnType.JSON, notNull: false },
    { name: 'mbti', type: ColumnType.STRING, notNull: false },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_phone', columns: ["phone"], unique: true },
    { name: 'idx_email', columns: ["email"], unique: true },
    { name: 'idx_googleId', columns: ["googleId"], unique: true },
    { name: 'idx_emailVerified', columns: ["emailVerified"], unique: true },
    { name: 'idx_phoneVerified', columns: ["phoneVerified"], unique: true },
    { name: 'idx_phoneNumber', columns: ["phoneNumber"], unique: true }
  ]
};

schemaRegistry.register(userSchema);

export default userSchema;
