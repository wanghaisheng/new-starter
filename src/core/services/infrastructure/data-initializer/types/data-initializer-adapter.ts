import { IDatabaseClient } from '@/core/lib/db/interfaces';

export interface IDataInitializerAdapter {
  initialize(): Promise<void>;
  getClient(): IDatabaseClient;
}
