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
    <IonTabBar slot="bottom" className="border-t border-gray-200">
      <IonTabButton 
        tab="home" 
        selected={activeTab === 'home'}
        onClick={() => onTabChange('home')}
      >
        <IonIcon icon={home} />
        <IonLabel>首页</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="discover" 
        selected={activeTab === 'discover'}
        onClick={() => onTabChange('discover')}
      >
        <IonIcon icon={search} />
        <IonLabel>发现</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="messages" 
        selected={activeTab === 'messages'}
        onClick={() => onTabChange('messages')}
      >
        <IonIcon icon={chatbubbles} />
        <IonLabel>消息</IonLabel>
      </IonTabButton>

      <IonTabButton 
        tab="profile" 
        selected={activeTab === 'profile'}
        onClick={() => onTabChange('profile')}
      >
        <IonIcon icon={person} />
        <IonLabel>我的</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default NavigationBar;