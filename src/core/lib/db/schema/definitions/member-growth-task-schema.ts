import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'
// import { EntityStatus } from '../../types/entity'; // 已移除无效引用

import { schemaRegistry } from '../schema-registry-singleton';

export const memberGrowthTaskSchema: TableSchema = {
  name: 'member_growth_tasks',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'userId', type: ColumnType.STRING, notNull: true },
    { name: 'taskId', type: ColumnType.STRING, notNull: true },
    { name: 'status', type: ColumnType.STRING, notNull: false },
    { name: 'progress', type: ColumnType.NUMBER, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true },
    { name: 'idx_userId', columns: ["userId"], unique: true },
    { name: 'idx_taskId', columns: ["taskId"], unique: true }
  ]
};

schemaRegistry.register(memberGrowthTaskSchema);

export default memberGrowthTaskSchema;
