import { TableSchema, ColumnType } from '../types';
import { schemaRegistry } from '../index';

export const onboardSchema: TableSchema = {
  name: 'onboards',
  columns: [
    { name: 'title', type: ColumnType.STRING, notNull: true },
    { name: 'desc', type: ColumnType.STRING, notNull: true },
    { name: 'image', type: ColumnType.STRING, notNull: true },
    { name: 'videoUrl', type: ColumnType.STRING, notNull: false },
    { name: 'lottieUrl', type: ColumnType.STRING, notNull: false },
    { name: 'backgroundColor', type: ColumnType.STRING, notNull: false },
    { name: 'action', type: ColumnType.JSON, notNull: false }
  ],
  indexes: [

  ]
};

schemaRegistry.register(onboardSchema);

export default onboardSchema;
