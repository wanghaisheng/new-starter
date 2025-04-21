// sync-translation-mock-to-db.ts
// 用于开发/测试环境：批量将 translation.mock.ts 数据写入本地数据库 translations 表
import { db } from '@/core/lib/db';
import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';

async function syncTranslationMockToDb() {
  const config = ConfigService.getInstance();
  const mockData = config.get<{ key: string; locale: string; value: string }[]>('translationMockData') || [];
  if (!mockData.length) {
    console.log('[sync] No mock translation data found in config.');
    return;
  }
  // 检查数据库中已存在的 key-locale 组合，避免重复写入
  const existing = await db.translations.toArray();
  const existsSet = new Set(existing.map(row => `${row.key}|${row.locale}`));
  const toInsert = mockData.filter(item => !existsSet.has(`${item.key}|${item.locale}`));
  if (!toInsert.length) {
    console.log('[sync] All mock translations already exist in db.');
    return;
  }
  await db.translations.bulkAdd(toInsert.map(item => ({
    key: item.key,
    locale: item.locale,
    value: item.value,
    type: item.type || 'system',
    updatedAt: item.updatedAt || new Date(),
  })));
  console.log(`[sync] Inserted ${toInsert.length} mock translations to db.`);
}

// 仅在本地开发/测试环境下自动执行
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  syncTranslationMockToDb();
}

export { syncTranslationMockToDb };
