'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * 玻璃卡片组件
 * 
 * 实现原型中的玻璃卡片效果(glass-card)，带有背景模糊和半透明效果
 * 可用于各种需要玻璃态效果的UI元素
 */
export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg p-4',
        'border border-white/20',
        'hover:bg-white/40 transition-colors duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}