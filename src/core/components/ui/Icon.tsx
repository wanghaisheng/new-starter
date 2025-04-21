// Icon: 通用图标组件，支持自定义 SVG/ionicons
'use client';
import { IonIcon } from '@ionic/react';
import React from 'react';

interface IconProps {
  icon: string;
  className?: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ icon, className = '', size = 24, color = 'currentColor' }) => (
  <IonIcon icon={icon} className={className} style={{ fontSize: size, color }} />
);
