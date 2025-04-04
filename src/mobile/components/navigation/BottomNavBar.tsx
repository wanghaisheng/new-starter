'use client';

import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

// 定义简单的图标组件替代IonIcon
const NavIcon = ({ 
  children, 
  active 
}: { 
  children: React.ReactNode;
  active: boolean;
}) => (
  <div className={`w-5 h-5 flex items-center justify-center ${active ? 'text-secondary-500' : 'text-gray-500'}`}>
    {children}
  </div>
);

// SVG图标以替代Ionic图标
const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    {filled ? (
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    )}
  </svg>
);

const DiscoverIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    {filled ? (
      <path d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    )}
  </svg>
);

const MatchesIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    {filled ? (
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    )}
  </svg>
);

const MessagesIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    {filled ? (
      <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    )}
  </svg>
);

const ProfileIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    {filled ? (
      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    )}
  </svg>
);

const SettingsIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    {filled ? (
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    )}
  </svg>
);

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isActive = (path: string) => pathname?.startsWith(path);

  // 使用标准的JavaScript函数处理点击事件，避免任何框架特定逻辑
  const navigateTo = (path: string) => {
    // 阻止任何可能的默认事件或冒泡
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 使用setTimeout确保事件完全处理完毕
      setTimeout(() => {
        // 使用纯JavaScript导航
        window.location.href = path;
      }, 0);
    };
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-lg z-50">
      <div className="grid grid-cols-6 h-full">
        {/* Home */}
        <button 
          onClick={navigateTo('/mobile/home')}
          className="flex flex-col items-center justify-center outline-none focus:outline-none"
        >
          <NavIcon active={isActive('/mobile/home')}>
            <HomeIcon filled={isActive('/mobile/home')} />
          </NavIcon>
          <span className={`text-[10px] mt-1 font-medium ${isActive('/mobile/home') ? 'text-secondary-500' : 'text-gray-500'}`}>
            Home
          </span>
        </button>
        
        {/* Discover */}
        <button 
          onClick={navigateTo('/mobile/discover')}
          className="flex flex-col items-center justify-center outline-none focus:outline-none"
        >
          <NavIcon active={isActive('/mobile/discover')}>
            <DiscoverIcon filled={isActive('/mobile/discover')} />
          </NavIcon>
          <span className={`text-[10px] mt-1 font-medium ${isActive('/mobile/discover') ? 'text-secondary-500' : 'text-gray-500'}`}>
            Discover
          </span>
        </button>
        
        {/* Matches */}
        <button 
          onClick={navigateTo('/mobile/matches')}
          className="flex flex-col items-center justify-center outline-none focus:outline-none"
        >
          <NavIcon active={isActive('/mobile/matches') && !isActive('/mobile/matches/messages') && !isActive('/mobile/matches/chat')}>
            <MatchesIcon filled={isActive('/mobile/matches') && !isActive('/mobile/matches/messages') && !isActive('/mobile/matches/chat')} />
          </NavIcon>
          <span className={`text-[10px] mt-1 font-medium ${isActive('/mobile/matches') && !isActive('/mobile/matches/messages') && !isActive('/mobile/matches/chat') ? 'text-secondary-500' : 'text-gray-500'}`}>
            Matches
          </span>
        </button>
        
        {/* Messages */}
        <button 
          onClick={navigateTo('/mobile/matches/messages')}
          className="flex flex-col items-center justify-center outline-none focus:outline-none"
        >
          <NavIcon active={isActive('/mobile/matches/messages') || isActive('/mobile/matches/chat')}>
            <MessagesIcon filled={isActive('/mobile/matches/messages') || isActive('/mobile/matches/chat')} />
          </NavIcon>
          <span className={`text-[10px] mt-1 font-medium ${isActive('/mobile/matches/messages') || isActive('/mobile/matches/chat') ? 'text-secondary-500' : 'text-gray-500'}`}>
            Messages
          </span>
        </button>
        
        {/* Profile */}
        <button 
          onClick={navigateTo('/mobile/profile')}
          className="flex flex-col items-center justify-center outline-none focus:outline-none"
        >
          <NavIcon active={isActive('/mobile/profile')}>
            <ProfileIcon filled={isActive('/mobile/profile')} />
          </NavIcon>
          <span className={`text-[10px] mt-1 font-medium ${isActive('/mobile/profile') ? 'text-secondary-500' : 'text-gray-500'}`}>
            Profile
          </span>
        </button>
        
        {/* Settings */}
        <button 
          onClick={navigateTo('/mobile/settings')}
          className="flex flex-col items-center justify-center outline-none focus:outline-none"
        >
          <NavIcon active={isActive('/mobile/settings')}>
            <SettingsIcon filled={isActive('/mobile/settings')} />
          </NavIcon>
          <span className={`text-[10px] mt-1 font-medium ${isActive('/mobile/settings') ? 'text-secondary-500' : 'text-gray-500'}`}>
            Settings
          </span>
        </button>
      </div>
    </div>
  );
} 