import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton
} from '@ionic/react';
import { useTranslations } from 'next-intl';

export default function SettingsSupport() {
  const t = useTranslations();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            {t('auto.page.Support') || '帮助与支持'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-[#0f172a]">
        <IonList>
          <IonItem button href="mailto:support@example.com">
            <IonLabel>
              {t('auto.page.ContactUs') || '联系客服'}
            </IonLabel>
          </IonItem>
          <IonItem button href="/mobile/settings/faq">
            <IonLabel>
              {t('auto.page.FAQ') || '常见问题'}
            </IonLabel>
          </IonItem>
          <IonItem button href="/mobile/settings/feedback">
            <IonLabel>
              {t('auto.support.') || '反馈'}
            </IonLabel>
          </IonItem>
        </IonList>
        <div className="text-xs text-slate-400 mt-8 text-center">
          我们会尽快回复您的问题，感谢您的支持与理解！
        </div>
      </IonContent>
    </IonPage>
  );
}
