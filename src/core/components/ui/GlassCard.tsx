// GlassCard: 通用毛玻璃卡片，遵循 product-research 原型
'use client';
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...rest }) => (
  <div
    className={`glass-card rounded-2xl p-4 bg-[rgba(17,25,40,0.75)] border border-white/10 shadow-lg backdrop-blur-md ${className}`}
    style={{backdropFilter:'blur(16px) saturate(180%)', WebkitBackdropFilter:'blur(16px) saturate(180%)'}}
    {...rest}
  >
    {children}
  </div>
);
