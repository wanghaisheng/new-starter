// ErrorScreen: 通用错误页，遵循 product-research 原型风格
'use client';
import React from 'react';
import { GlassCard } from '@/core/components/ui/GlassCard';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = '出错了',
  message = '网络异常或服务不可用',
  actionText = '重试',
  onAction
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
    <GlassCard className="w-full max-w-sm flex flex-col items-center p-8">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-4 text-rose-500"><path d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-slate-400 mb-6 text-center">{message}</p>
      {onAction && (
        <button className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-6 rounded-full font-medium transition-all" onClick={onAction}>{actionText}</button>
      )}
    </GlassCard>
  </div>
);

export default ErrorScreen;