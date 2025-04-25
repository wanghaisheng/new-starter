import { describe, it, expect } from 'vitest';
import { DataMigrationService } from './data-migration-service';

describe('DataMigrationService', () => {
  it('should log migration steps', () => {
    const service = new DataMigrationService();
    service['logs'] = [{ step: 'init', status: 'ok' }];
    expect(service.getLogs()).toEqual([{ step: 'init', status: 'ok' }]);
  });
});
