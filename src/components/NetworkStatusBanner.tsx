"use client";
import React from 'react';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

/**
 * 全局网络状态提示横幅，友好展示弱网/慢速/代理/离线等状态
 */
export const NetworkStatusBanner: React.FC = () => {
  const { status, isLimited, isProxy, isOffline, isUnknown } = useNetworkStatus();

  if (status === 'online') return null;

  let message = '';
  let color = '';
  if (isOffline) {
    message = '当前离线，请检查您的网络连接';
    color = 'bg-red-500';
  } else if (isLimited) {
    message = '网络较弱，体验可能受影响';
    color = 'bg-yellow-500';
  } else if (isProxy) {
    message = '检测到代理网络，部分功能可能异常';
    color = 'bg-orange-500';
  } else if (isUnknown) {
    message = '网络状态未知';
    color = 'bg-gray-500';
  } else {
    message = '网络状态异常';
    color = 'bg-gray-500';
  }

  return (
    <div className={`w-full text-center text-white py-2 ${color} z-50`}
         style={{ position: 'fixed', top: 0, left: 0 }}>
      {message}
    </div>
  );
};
