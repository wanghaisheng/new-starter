import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../index';

export const globalConfigSchema: TableSchema = {
  name: 'global-configs',
  columns: [
    { name: 'key', type: ColumnType.STRING, notNull: true },
    { name: 'value', type: ColumnType.JSON, notNull: true },
    { name: 'description', type: ColumnType.STRING, notNull: false },
    { name: 'ext', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [

  ]
};

schemaRegistry.register(globalConfigSchema);

export default globalConfigSchema;
