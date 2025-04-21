'use client';

import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonItemDivider,
  IonItemGroup,
  IonNote,
  IonButton
} from '@ionic/react';
import { 
  informationCircleOutline,
  codeOutline,
  globeOutline,
  heartOutline,
  logoGithub,
  logoTwitter
} from 'ionicons/icons';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';

export default function AboutSettingsPage() {
  const router = useRouter();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const buildNumber = process.env.NEXT_PUBLIC_BUILD_NUMBER || '1';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle{t('auto.page.About')}/IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-[#0f172a]">
        <div className="flex flex-col items-center justify-center py-8">
          <img
            src="/assets/images/logo.png"
            alt={t('auto.page.HeyTCML')}
            className="w-24 h-24 mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2"{t('auto.page.HeyTCM')}/h1>
          <p className="text-gray-400 text-center px-4">
            Connecting people through meaningful relationships
          </p>
        </div>
        
        <IonList lines="full">
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel{t('auto.page.APPINFO')}/IonLabel>
            </IonItemDivider>
            
            <IonItem>
              <IonIcon icon={informationCircleOutline} slot="start" />
              <IonLabel{t('auto.page.Version')}/IonLabel>
              <IonNote slot="end">{appVersion} ({buildNumber})</IonNote>
            </IonItem>
            
            <IonItem>
              <IonIcon icon={codeOutline} slot="start" />
              <IonLabel{t('auto.page.BuildDa')}/IonLabel>
              <IonNote slot="end">{process.env.NEXT_PUBLIC_BUILD_DATE || 'Development'}</IonNote>
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel{t('auto.page.LINKS')}/IonLabel>
            </IonItemDivider>
            
            <IonItem button onClick={() => window.open('https://github.com/your-org/heytcm', '_blank')}>
              <IonIcon icon={logoGithub} slot="start" />
              <IonLabel{t('auto.page.GitHub')}/IonLabel>
            </IonItem>
            
            <IonItem button onClick={() => window.open('https://twitter.com/heytcm', '_blank')}>
              <IonIcon icon={logoTwitter} slot="start" />
              <IonLabel{t('auto.page.Twitter')}/IonLabel>
            </IonItem>
            
            <IonItem button onClick={() => window.open('https://heytcm.com', '_blank')}>
              <IonIcon icon={globeOutline} slot="start" />
              <IonLabel{t('auto.page.Website')}/IonLabel>
            </IonItem>
          </IonItemGroup>
          
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel{t('auto.page.LEGAL')}/IonLabel>
            </IonItemDivider>
            
            <IonItem button onClick={() => router.push('/mobile/settings/terms')}>
              <IonIcon icon={informationCircleOutline} slot="start" />
              <IonLabel{t('auto.page.Termsof')}/IonLabel>
            </IonItem>
            
            <IonItem button onClick={() => router.push('/mobile/settings/privacy-policy')}>
              <IonIcon icon={informationCircleOutline} slot="start" />
              <IonLabel{t('auto.page.Privacy')}/IonLabel>
            </IonItem>
          </IonItemGroup>
        </IonList>
        
        <div className="p-4 text-center text-gray-400">
          <p className="mb-2"{t('auto.page.Madewit')}/p>
          <IonIcon icon={heartOutline} className="text-pink-500 text-xl" />
          <p className="mt-4 text-sm">
            {new Date().getFullYear()} HeyTCM. All rights reserved.
          </p>
        </div>
      </IonContent>
      
      <BottomNavBar />
    </IonPage>
  );
} 