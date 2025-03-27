'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonToggle, IonIcon, IonListHeader, IonSelect, IonSelectOption, IonButton } from '@ionic/react';
import { moonOutline, notificationsOutline, languageOutline, lockClosedOutline, helpCircleOutline, logOutOutline } from 'ionicons/icons';

export default function SettingsPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>设置</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonListHeader>显示</IonListHeader>
          <IonItem>
            <IonIcon icon={moonOutline} slot="start" />
            <IonLabel>深色模式</IonLabel>
            <IonToggle slot="end" />
          </IonItem>
          
          <IonListHeader>通知</IonListHeader>
          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>推送通知</IonLabel>
            <IonToggle slot="end" defaultChecked />
          </IonItem>
          
          <IonListHeader>语言</IonListHeader>
          <IonItem>
            <IonIcon icon={languageOutline} slot="start" />
            <IonLabel>语言设置</IonLabel>
            <IonSelect interface="popover" value="zh">
              <IonSelectOption value="zh">中文</IonSelectOption>
              <IonSelectOption value="en">English</IonSelectOption>
              <IonSelectOption value="ja">日本語</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          <IonListHeader>安全</IonListHeader>
          <IonItem button detail>
            <IonIcon icon={lockClosedOutline} slot="start" />
            <IonLabel>修改密码</IonLabel>
          </IonItem>
          
          <IonListHeader>支持</IonListHeader>
          <IonItem button detail>
            <IonIcon icon={helpCircleOutline} slot="start" />
            <IonLabel>帮助与反馈</IonLabel>
          </IonItem>
          
          <div className="p-4">
            <IonButton expand="block" color="danger">
              <IonIcon icon={logOutOutline} slot="start" />
              退出登录
            </IonButton>
          </div>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
