'use client';

import React from 'react';
import { IonPage, IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet } from '@ionic/react';
import { homeOutline, chatbubbleEllipsesOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { usePathname, useRouter } from 'next/navigation';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const router = useRouter();

  return (
    <IonPage>
      <IonContent>
        {children}
      </IonContent>
      <IonTabBar slot="bottom" className="bg-[#1e293b]">
        <IonTabButton selected={pathname.startsWith('/mobile/home')} onClick={() => router.push('/mobile/home')} tab="home">
          <IonIcon icon={homeOutline} />
          <IonLabel>首页</IonLabel>
        </IonTabButton>
        <IonTabButton selected={pathname.startsWith('/mobile/chat')} onClick={() => router.push('/mobile/chat/list')} tab="chat">
          <IonIcon icon={chatbubbleEllipsesOutline} />
          <IonLabel>消息</IonLabel>
        </IonTabButton>
        <IonTabButton selected={pathname.startsWith('/mobile/profile')} onClick={() => router.push('/mobile/profile/view')} tab="profile">
          <IonIcon icon={personOutline} />
          <IonLabel>我的</IonLabel>
        </IonTabButton>
        <IonTabButton selected={pathname.startsWith('/mobile/settings')} onClick={() => router.push('/mobile/settings')} tab="settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>设置</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
}