import { describe, it, expect } from 'vitest';
import { DataMigrationService } from './data-migration-service';

describe('DataMigrationService', () => {
  it('should log migration steps', () => {
    const service = new DataMigrationService();
    service['logs'] = [{ step: 'init', status: 'ok' }];
    expect(service.getLogs()).toEqual([{ step: 'init', status: 'ok' }]);
  });

  it('should add and get logs', () => {
    const service = new DataMigrationService();
    service.addLog('step1', 'ok');
    expect(service.getLogs()).toEqual([{ step: 'step1', status: 'ok' }]);
  });

  it('should clear logs', () => {
    const service = new DataMigrationService();
    service.addLog('step1', 'ok');
    service.clearLogs();
    expect(service.getLogs()).toEqual([]);
  });
});
