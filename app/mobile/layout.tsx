'use client';

import React from 'react';
import { IonPage, IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet } from '@ionic/react';
import { homeOutline, chatbubbleEllipsesOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { usePathname, useRouter } from 'next/navigation';
import { Providers } from '@/src/providers';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

// 集中配置公开页面白名单
const PUBLIC_ROUTES = [
  '/mobile/onboard',
  '/mobile/page',
  '/mobile/auth/login',
  '/mobile/auth/register',
  '/mobile/auth/phone',
  // 如有其它公开页面请补充
];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const router = useRouter();

  // 判断当前路径是否在公开页面白名单
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  // 只有非公开页面才守卫
  if (!isPublic) {
    useRequireAuth();
  }

  return (
    <Providers>
      <IonPage>
        <IonContent>
          {children}
        </IonContent>
        <IonTabBar slot="bottom" className="bg-[#1e293b]">
          <IonTabButton selected={pathname.startsWith('/mobile/home')} onClick={() => router.push('/mobile/home')} tab={t('auto.layout.home')}>
            <IonIcon icon={homeOutline} />
            <IonLabel{t('auto.layout.')}/IonLabel>
          </IonTabButton>
          <IonTabButton selected={pathname.startsWith('/mobile/chat')} onClick={() => router.push('/mobile/chat/list')} tab={t('auto.layout.chat')}>
            <IonIcon icon={chatbubbleEllipsesOutline} />
            <IonLabel{t('auto.layout.')}/IonLabel>
          </IonTabButton>
          <IonTabButton selected={pathname.startsWith('/mobile/profile')} onClick={() => router.push('/mobile/profile/view')} tab={t('auto.layout.profile')}>
            <IonIcon icon={personOutline} />
            <IonLabel{t('auto.layout.')}/IonLabel>
          </IonTabButton>
          <IonTabButton selected={pathname.startsWith('/mobile/settings')} onClick={() => router.push('/mobile/settings')} tab={t('auto.layout.settings')}>
            <IonIcon icon={settingsOutline} />
            <IonLabel{t('auto.layout.')}/IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonPage>
    </Providers>
  );
}