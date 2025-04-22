// 用于演示 useConfig 多场景的测试页面
'use client';
import { useConfig } from '@/core/hooks/useConfig';
import React from 'react';

export default function ConfigDemoPage() {
  const config = useConfig();
  // 模拟配置结构
  const theme = config?.theme || 'light';
  const apiBaseUrl = config?.apiBaseUrl || 'https://api.example.com';
  const featureFlags = config?.featureFlags || { newChatEnabled: false };
  const language = config?.language || 'zh-CN';

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>
  {t('auto.page.ConfigH')}
</h1>
      {/* 1. 主题切换 */}
      <section style={{ margin: '24px 0', background: theme === 'dark' ? '#222' : '#fafafa', color: theme === 'dark' ? '#fff' : '#222', padding: 16 }}>
        <h2>
  {t('auto.page.')}
</h2>
        <span>
  {t('auto.page.')}
</span>
        <b>{theme}</b>
      </section>

      {/* 2. 环境变量/API 地址 */}
      <section style={{ margin: '24px 0', padding: 16, border: '1px solid #eee' }}>
        <h2>
  {t('auto.page.API')}
</h2>
        <span>
  {t('auto.page.APIB')}
</span>
        <b>{apiBaseUrl}</b>
      </section>

      {/* 3. 动态 Feature Flag */}
      <section style={{ margin: '24px 0', padding: 16, border: '1px solid #eee' }}>
        <h2>
  {t('auto.page.Featu')}
</h2>
        <span>
  {t('auto.page.')}
</span>
        <b style={{ color: featureFlags?.newChatEnabled ? 'green' : 'red' }}>{featureFlags?.newChatEnabled ? '已开启' : '未开启'}</b>
        {featureFlags?.newChatEnabled && (
          <div style={{ marginTop: 12, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
            <strong>
  {t('auto.page.')}
</strong>
          </div>
        )}
      </section>

      {/* 4. 国际化/多语言 */}
      <section style={{ margin: '24px 0', padding: 16, border: '1px solid #eee' }}>
        <h2>
  {t('auto.page.')}
</h2>
        <span>
  {t('auto.page.')}
</span>
        <b>{language}</b>
        <div style={{ marginTop: 8 }}>
          {language === 'en-US' ? 'Hello!' : language === 'zh-CN' ? '你好！' : 'Welcome!'}
        </div>
      </section>

      {/* 其它全局参数（可扩展） */}
      <section style={{ margin: '24px 0', padding: 16, border: '1px solid #eee' }}>
        <h2>
  {t('auto.page.')}
</h2>
        <pre style={{ fontSize: 12, background: '#f6f8fa', padding: 12, borderRadius: 4 }}>
          {JSON.stringify(config, null, 2)}
        </pre>
      </section>
    </div>
  );
}
