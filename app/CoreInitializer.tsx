"use client";
import { useEffect, useState } from "react";
import { initializeCoreServices } from "@/core/services/init";
import { initAppService } from '@/core/services/business/app-service-init';
// import { LocaleProvider } from '@/core/providers/LocaleProvider';
// 已废弃 LocaleProvider，国际化由全局 I18nProvider 提供，如需 locale hooks 请用 '@/core/lib/i18n/hooks'


export function CoreInitializer({ children }: { children?: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeCoreServices(); // 1. 配置、日志、schema、适配器等
      await initAppService();         // 2. 业务服务初始化
      setReady(true);
    })();
  }, []);

  if (!ready) return null; // 或可用 loading spinner
  return <>{children || null}</>;
}
