// mock global config data for testing and development
import type { GlobalConfig } from '@/core/lib/db/types/global-config.types';

export const mockGlobalConfig: GlobalConfig = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  updatedBy: 'mock-admin',
  items: [
    {
      key: 'app.theme',
      value: 'light',
      description: 'Default application theme',
      ext: { note: '可切�?dark/light' }
    },
    {
      key: 'feature.matching.enabled',
      value: true,
      description: 'Is matching feature enabled',
      ext: {}
    },
    {
      key: 'max.upload.size',
      value: 10,
      description: 'Max upload size (MB)',
      ext: { unit: 'MB' }
    }
  ],
  metadata: {
    environment: 'mock',
    region: 'CN'
  }
};
