'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/core/utils/cn';

const navItems = [
  {
    name: '主页',
    href: '/mobile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L8.707 1.5Z"/>
        <path d="M8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6Z"/>
  </svg>
    ),
  },
  {
    name: '测试',
    href: '/mobile/tests',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/>
  </svg>
    ),
  },
  {
    name: '匹配',
    href: '/mobile/matches',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16a8 8 0 0 0 8-8 8 8 0 0 0-16 0 8 8 0 0 0 8 8zm0-2a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
        <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
  </svg>
    ),
  },
  {
    name: '消息',
    href: '/mobile/messages',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16a8 8 0 0 0 8-8 8 8 0 0 0-16 0 8 8 0 0 0 8 8zm0-2a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
        <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
  </svg>
    ),
  },
  {
    name: '我的',
    href: '/mobile/profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 16a8 8 0 0 0 8-8 8 8 0 0 0-16 0 8 8 0 0 0 8 8zm0-2a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
        <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
  </svg>
    ),
  },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full',
                  'text-gray-600 hover:text-purple-600 transition-colors',
                  isActive && 'text-purple-600'
                )}
              >
                <div className="w-6 h-6 mb-1">{item.icon}</div>
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 