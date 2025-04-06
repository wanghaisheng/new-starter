'use client';

import React, { useEffect, useState } from 'react';
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
  IonText
} from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { Network } from '@capacitor/network';
import { useI18n } from '@/core/lib/i18n/I18nProvider';
import styles from './page.module.css';

const PrivacyPolicySettingsPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const t = useI18n();

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkNetwork();

    let networkListener: any = null;
    
    const setupListener = async () => {
      networkListener = await Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
      });
    };

    setupListener();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/settings" text={t('common.back')} />
          </IonButtons>
          <IonTitle>{t('privacyPolicy.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" data-testid="privacy-policy-content">
        {!isOnline && (
          <div className={styles.offlineMessage} data-testid="offline-message">
            {t('common.offlineMessage')}
          </div>
        )}
        <div className={styles.lastUpdated} data-testid="last-updated">
          {t('privacyPolicy.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
        <div className={styles.policySections}>
          <section data-testid="introduction-section">
            <h2>{t('privacyPolicy.introduction.title')}</h2>
            <p>{t('privacyPolicy.introduction.content')}</p>
          </section>
          
          <section data-testid="information-collection-section">
            <h2>{t('privacyPolicy.informationCollection.title')}</h2>
            <p>{t('privacyPolicy.informationCollection.content')}</p>
          </section>
          
          <section data-testid="information-usage-section">
            <h2>{t('privacyPolicy.informationUsage.title')}</h2>
            <p>{t('privacyPolicy.informationUsage.content')}</p>
          </section>
          
          <section data-testid="data-security-section">
            <h2>{t('privacyPolicy.dataSecurity.title')}</h2>
            <p>{t('privacyPolicy.dataSecurity.content')}</p>
          </section>
          
          <section data-testid="data-rights-section">
            <h2>{t('privacyPolicy.dataRights.title')}</h2>
            <p>{t('privacyPolicy.dataRights.content')}</p>
          </section>
          
          <section data-testid="children-privacy-section">
            <h2>{t('privacyPolicy.childrenPrivacy.title')}</h2>
            <p>{t('privacyPolicy.childrenPrivacy.content')}</p>
          </section>
          
          <section data-testid="policy-changes-section">
            <h2>{t('privacyPolicy.policyChanges.title')}</h2>
            <p>{t('privacyPolicy.policyChanges.content')}</p>
          </section>
          
          <section data-testid="contact-us-section">
            <h2>{t('privacyPolicy.contactUs.title')}</h2>
            <p>{t('privacyPolicy.contactUs.content')}</p>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicySettingsPage; 