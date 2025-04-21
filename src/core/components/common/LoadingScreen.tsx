// LoadingScreen: 通用加载页，遵循 product-research 原型风格
'use client';
import React from 'react';
import { GlassCard } from '@/core/components/ui/GlassCard';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
    <GlassCard className="w-full max-w-sm flex flex-col items-center p-8">
      <svg className="animate-spin mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="4" opacity="0.3"/><path d="M22 12A10 10 0 0 1 12 22" stroke="#6366f1" strokeWidth="4" strokeLinecap="round"/></svg>
      <p className="text-slate-400">加载中...</p>
    </GlassCard>
  </div>
);

export default LoadingScreen;