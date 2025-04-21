// NetworkStatusIndicator: 通用网络状态指示器，遵循原型风格
'use client';
import React from 'react';

interface NetworkStatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting';
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ status }) => {
  let color = 'bg-green-500';
  let text = '在线';
  if (status === 'offline') {
    color = 'bg-red-500';
    text = '离线';
  } else if (status === 'connecting') {
    color = 'bg-yellow-500';
    text = '连接中';
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${color} inline-block`}></span>
      <span>{text}</span>
    </div>
  );
};
