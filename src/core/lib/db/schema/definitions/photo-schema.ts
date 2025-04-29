import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../schema-registry-singleton';

export const photoSchema: TableSchema = {
  name: 'photos',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'url', type: ColumnType.STRING, notNull: true },
    { name: 'thumbnailUrl', type: ColumnType.STRING, notNull: false },
    { name: 'isAvatar', type: ColumnType.BOOLEAN, notNull: false },
    { name: 'isMain', type: ColumnType.BOOLEAN, notNull: false },
    { name: 'order', type: ColumnType.NUMBER, notNull: false },
    { name: 'caption', type: ColumnType.STRING, notNull: false },
    { name: 'tags', type: ColumnType.JSON, notNull: false },
    { name: 'status', type: ColumnType.STRING, notNull: false },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true }
  ]
};

schemaRegistry.register(photoSchema);

export default photoSchema;
