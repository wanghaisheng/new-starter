"use client";
import { useState, useEffect } from "react";
import { initializeCoreServices, initAppService } from "./CoreInitializer";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      await initializeCoreServices();
      await initAppService();
      setReady(true);
    })();
  }, []);

  if (!mounted) return null;

  if (!ready)
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
        数据库初始化中，请稍候...
      </div>
    );
  return <>{children}</>;
}
