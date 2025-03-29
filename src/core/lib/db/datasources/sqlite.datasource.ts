import { DataSource } from 'typeorm';
import { SQLITE_CONFIG } from '../clients/capacitor-sqlite/sqlite-config';
import { schemaRegistry } from '../schema';

// Convert schema registry to SQLite table definitions
const getTableDefinitions = () => {
  const schemas = schemaRegistry.getAll();
  return schemas.map(schema => ({
    name: schema.name,
    columns: schema.columns.map(col => ({
      name: col.name,
      type: mapColumnType(col.type),
      primaryKey: col.primaryKey || false,
      notNull: col.notNull || false,
      defaultValue: col.defaultValue
    })),
    indexes: schema.indexes || []
  }));
};

// Map our schema types to SQLite types
const mapColumnType = (type: string): string => {
  switch (type) {
    case 'string':
      return 'TEXT';
    case 'integer':
      return 'INTEGER';
    case 'float':
      return 'REAL';
    case 'boolean':
      return 'INTEGER';
    case 'date':
      return 'TEXT';
    case 'json':
      return 'TEXT';
    default:
      return 'TEXT';
  }
};

export const sqliteDataSource = new DataSource({
  type: 'capacitor',
  driver: require('@capacitor-community/sqlite'),
  database: SQLITE_CONFIG.database.name,
  mode: 'no-encryption' as 'no-encryption' | 'encryption' | 'secret' | 'newsecret',
  version: SQLITE_CONFIG.database.version,
  tables: getTableDefinitions(),
  synchronize: true, // Development only, use migrations in production
  logging: true,
});

// Initialize the data source
export const initializeSqliteDataSource = async () => {
  try {
    if (!sqliteDataSource.isInitialized) {
      await sqliteDataSource.initialize();
      console.log('SQLite data source has been initialized');
    }
    return sqliteDataSource;
  } catch (error) {
    console.error('Error during SQLite data source initialization:', error);
    throw error;
  }
}; 