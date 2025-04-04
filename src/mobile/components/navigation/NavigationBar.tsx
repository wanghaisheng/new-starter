'use client';

import React from 'react';
import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, search, chatbubbles, person } from 'ionicons/icons';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <IonTabBar slot="bottom" className="border-t border-neutral-200 dark:border-neutral-800 shadow-lg py-1">
      <IonTabButton 
        tab="home" 
        selected={activeTab === 'home'}
        onClick={() => onTabChange('home')}
        className="transition-all duration-200"
      >
        <IonIcon icon={home} className={activeTab === 'home' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'home' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>首页</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="discover" 
        selected={activeTab === 'discover'}
        onClick={() => onTabChange('discover')}
        className="transition-all duration-200"
      >
        <IonIcon icon={search} className={activeTab === 'discover' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'discover' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>发现</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="messages" 
        selected={activeTab === 'messages'}
        onClick={() => onTabChange('messages')}
        className="transition-all duration-200"
      >
        <IonIcon icon={chatbubbles} className={activeTab === 'messages' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'messages' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>消息</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="profile" 
        selected={activeTab === 'profile'}
        onClick={() => onTabChange('profile')}
        className="transition-all duration-200"
      >
        <IonIcon icon={person} className={activeTab === 'profile' ? 'text-primary-600 text-lg' : 'text-neutral-500 text-lg'} />
        <IonLabel className={activeTab === 'profile' ? 'text-primary-600 text-xs font-medium' : 'text-neutral-500 text-xs font-medium'}>我的</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default NavigationBar;