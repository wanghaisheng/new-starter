// hybrid-translation-service-adapter.ts
import type { ITranslationAdapter } from '../types/translation-service';
import { RemoteTranslationServiceAdapter } from './remote-translation-service-adapter';
import { MockTranslationServiceAdapter } from './mock-translation-service-adapter';

export class HybridTranslationServiceAdapter implements ITranslationAdapter {
  private remote = new RemoteTranslationServiceAdapter();
  private mock = new MockTranslationServiceAdapter();

  async getTranslationsByKeys(keys: string[], locale?: string) {
    // 先查远程/数据库
    const remoteResult = await this.remote.getTranslationsByKeys(keys, locale);
    // fallback 到 mock
    const missingKeys = keys.filter(k => !remoteResult[k] || remoteResult[k] === k);
    let mockResult: { [key: string]: string } = {};
    if (missingKeys.length > 0) {
      mockResult = await this.mock.getTranslationsByKeys(missingKeys, locale);
    }
    return { ...remoteResult, ...mockResult };
  }
}
