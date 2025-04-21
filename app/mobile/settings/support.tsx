import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton
} from '@ionic/react';

export default function SettingsSupport() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle{t('auto.support.')}/IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-[#0f172a]">
        <IonList>
          <IonItem button href="mailto:support@example.com">
            <IonLabel{t('auto.support.')}/IonLabel>
          </IonItem>
          <IonItem button href="/mobile/settings/faq">
            <IonLabel{t('auto.support.')}/IonLabel>
          </IonItem>
          <IonItem button href="/mobile/settings/feedback">
            <IonLabel{t('auto.support.')}/IonLabel>
          </IonItem>
        </IonList>
        <div className="text-xs text-slate-400 mt-8 text-center">
          我们会尽快回复您的问题，感谢您的支持与理解！
        </div>
      </IonContent>
    </IonPage>
  );
}
