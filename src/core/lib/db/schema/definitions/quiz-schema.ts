import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../schema-registry-singleton';

export const quizSchema: TableSchema = {
  name: 'quizzes',
  columns: [
    { name: 'id', type: ColumnType.STRING, notNull: true, primaryKey: true },
    { name: 'createdAt', type: ColumnType.STRING, notNull: true },
    { name: 'updatedAt', type: ColumnType.STRING, notNull: true },
    { name: 'title', type: ColumnType.STRING, notNull: true },
    { name: 'description', type: ColumnType.STRING, notNull: false },
    { name: 'type', type: ColumnType.JSON, notNull: true },
    { name: 'questions', type: ColumnType.JSON, notNull: true },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [
    { name: 'pk_id', columns: ["id"], unique: true }
  ]
};

schemaRegistry.register(quizSchema);

export default quizSchema;
