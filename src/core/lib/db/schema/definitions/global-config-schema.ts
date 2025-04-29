import { TableSchema } from '../../types/database';
import {ColumnType} from '../../types/common'

import { schemaRegistry } from '../schema-registry-singleton';

export const globalConfigSchema: TableSchema = {
  name: 'global_configs',
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
