'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationBar } from '@/mobile/components/navigation/NavigationBar';
import { IonApp, IonPage, IonContent } from '@ionic/react';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // 根据当前路径设置活动标签
    if (pathname.includes('/mobile/home')) {
      setActiveTab('home');
    } else if (pathname.includes('/mobile/discover')) {
      setActiveTab('discover');
    } else if (pathname.includes('/mobile/matches')) {
      setActiveTab('messages');
    } else if (pathname.includes('/mobile/profile')) {
      setActiveTab('profile');
    }
  }, [pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // 根据选择的标签导航到相应的页面
    switch (tab) {
      case 'home':
        router.push('/mobile/home');
        break;
      case 'discover':
        router.push('/mobile/discover');
        break;
      case 'messages':
        router.push('/mobile/matches');
        break;
      case 'profile':
        router.push('/mobile/profile');
        break;
    }
  };

  return (
    <IonPage>
      <IonContent>
        {children}
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <NavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </IonContent>
    </IonPage>
  );
}