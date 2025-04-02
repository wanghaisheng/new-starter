'use client';

import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  opacity?: number; // 0-100
  blur?: number; // 0-16
  border?: boolean;
  borderColor?: string;
  onClick?: () => void;
}

/**
 * 玻璃卡片组件
 * 
 * 实现原型中的玻璃卡片效果(glass-card)，带有背景模糊和半透明效果
 * 可用于各种需要玻璃态效果的UI元素
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  rounded = 'xl',
  opacity = 75,
  blur = 16,
  border = true,
  borderColor = 'rgba(255, 255, 255, 0.125)',
  onClick,
}) => {
  // 构建圆角类名
  const roundedClass = rounded !== 'none' ? `rounded-${rounded}` : '';
  
  // 构建内联样式
  const style: React.CSSProperties = {
    backdropFilter: `blur(${blur}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
    backgroundColor: `rgba(17, 25, 40, ${opacity / 100})`,
    border: border ? `1px solid ${borderColor}` : 'none',
  };

  return (
    <div 
      className={`${roundedClass} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;