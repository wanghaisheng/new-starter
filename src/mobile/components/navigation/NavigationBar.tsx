'use client';

import React from 'react';
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, search, chatbubbles, person } from 'ionicons/icons';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
  const handleTabClick = (tab: string) => {
    if (tab && typeof tab === 'string' && tab.trim() !== '') {
      console.log('Tab clicked:', tab); // 添加日志以便调试
      if (onTabChange) {
        onTabChange(tab);
      }
    } else {
      console.error('Invalid tab value:', tab); // 记录错误的tab值
    }
  };
  return (
    <IonTabBar slot="bottom" className="border-t border-neutral-200 dark:border-neutral-800 shadow-lg py-1">
      <IonTabButton 
        tab="home" 
        selected={activeTab === 'home'}
        onClick={() => handleTabClick('home')}
        className="transition-all duration-200"
      >
        <IonIcon icon={home} className={activeTab === 'home' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'home' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>首页</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="discover" 
        selected={activeTab === 'discover'}
        onClick={() => handleTabClick('discover')}
        className="transition-all duration-200"
      >
        <IonIcon icon={search} className={activeTab === 'discover' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'discover' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>发现</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="messages" 
        selected={activeTab === 'messages'}
        onClick={() => handleTabClick('messages')}
        className="transition-all duration-200"
      >
        <IonIcon icon={chatbubbles} className={activeTab === 'messages' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'messages' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>消息</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="profile" 
        selected={activeTab === 'profile'}
        onClick={() => handleTabClick('profile')}
        className="transition-all duration-200"
      >
        <IonIcon icon={person} className={activeTab === 'profile' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'profile' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>我的</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default NavigationBar;