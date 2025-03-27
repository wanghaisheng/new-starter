'use client';

import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { homeOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState('home');
  
  // 根据路径更新选中的标签
  useEffect(() => {
    if (pathname.includes('/tabs/home')) {
      setSelectedTab('home');
    } else if (pathname.includes('/tabs/profile')) {
      setSelectedTab('profile');
    } else if (pathname.includes('/tabs/settings')) {
      setSelectedTab('settings');
    }
  }, [pathname]);

  return (
    <IonTabs>
      <IonRouterOutlet>
        {children}
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home" selected={selectedTab === 'home'}>
          <IonIcon icon={homeOutline} />
          <IonLabel>首页</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile" selected={selectedTab === 'profile'}>
          <IonIcon icon={personOutline} />
          <IonLabel>个人</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings" selected={selectedTab === 'settings'}>
          <IonIcon icon={settingsOutline} />
          <IonLabel>设置</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
