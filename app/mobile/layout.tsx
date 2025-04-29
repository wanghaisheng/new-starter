'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { IonPage, IonContent, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTabs, IonRouterOutlet } from '@ionic/react';
import { homeOutline, chatbubbleEllipsesOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { usePathname, useRouter } from 'next/navigation';
// 动态导入 IonicProvider，禁止 SSR
const IonicProvider = dynamic(() => import('@/providers/ionic').then(mod => mod.IonicProvider), { ssr: false });
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { useTranslations } from 'next-intl';

// 集中配置公开页面白名单
const PUBLIC_ROUTES = [
  '/mobile/onboard',
  '/mobile/page',
  '/mobile/auth/login',
  '/mobile/auth/register',
  '/mobile/auth/phone',
  // 如有其它公开页面请补充
];

// 测试阶段：全部页面公开开关（通过环境变量控制）
const ALL_PUBLIC = process.env.NEXT_PUBLIC_DATABASE_ENV === 'dev';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();

  // 判断当前路径是否在公开页面白名单，测试阶段可全公开
  const isPublic = ALL_PUBLIC || PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  // 只有非公开页面才守卫
  if (!isPublic) {
    useRequireAuth();
  }

  return (
    <IonicProvider>
      <IonPage>
        <IonContent>
          {children}
        </IonContent>
        <IonTabBar slot="bottom" className="bg-[#1e293b]">
          <IonTabButton selected={pathname.startsWith('/mobile/home')} onClick={() => router.push('/mobile/home')} tab="home">
            <IonIcon icon={homeOutline} />
            <IonLabel>{t('auto.layout.home') || '首页'}</IonLabel>
          </IonTabButton>
          <IonTabButton selected={pathname.startsWith('/mobile/chat')} onClick={() => router.push('/mobile/chat/list')} tab="chat">
            <IonIcon icon={chatbubbleEllipsesOutline} />
            <IonLabel>{t('auto.layout.chat') || '消息'}</IonLabel>
          </IonTabButton>
          <IonTabButton selected={pathname.startsWith('/mobile/profile')} onClick={() => router.push('/mobile/profile/view')} tab="profile">
            <IonIcon icon={personOutline} />
            <IonLabel>{t('auto.layout.profile') || '我的'}</IonLabel>
          </IonTabButton>
          <IonTabButton selected={pathname.startsWith('/mobile/settings')} onClick={() => router.push('/mobile/settings')} tab="settings">
            <IonIcon icon={settingsOutline} />
            <IonLabel>{t('auto.layout.settings') || '设置'}</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonPage>
    </IonicProvider>
  );
}