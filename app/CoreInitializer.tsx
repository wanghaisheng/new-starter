"use client";
import { useEffect } from "react";
import { initializeCoreServices } from "@/core/services/init";
import { LocaleProvider } from '@/core/providers/LocaleProvider';

export function CoreInitializer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    initializeCoreServices();
  }, []);
  return <LocaleProvider>{children || null}</LocaleProvider>;
}
