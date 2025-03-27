'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonAvatar, IonItem, IonLabel, IonList, IonListHeader, IonButton, IonIcon, IonCard, IonCardContent } from '@ionic/react';
import { mailOutline, callOutline, locationOutline, cameraOutline } from 'ionicons/icons';

export default function ProfilePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>个人资料</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center mb-6">
          <IonAvatar className="w-24 h-24 mb-4">
            <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
              <IonIcon icon={cameraOutline} size="large" />
            </div>
          </IonAvatar>
          <h2 className="text-xl font-bold">用户名</h2>
          <p className="text-gray-500">用户ID: 12345</p>
          <IonButton className="mt-2" size="small">编辑资料</IonButton>
        </div>
        
        <IonCard>
          <IonCardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">125</p>
                <p className="text-sm text-gray-500">关注</p>
              </div>
              <div>
                <p className="text-2xl font-bold">534</p>
                <p className="text-sm text-gray-500">粉丝</p>
              </div>
              <div>
                <p className="text-2xl font-bold">26</p>
                <p className="text-sm text-gray-500">帖子</p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
        
        <IonList>
          <IonListHeader>联系信息</IonListHeader>
          <IonItem>
            <IonIcon icon={mailOutline} slot="start" />
            <IonLabel>
              <h2>邮箱</h2>
              <p>user@example.com</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon icon={callOutline} slot="start" />
            <IonLabel>
              <h2>电话</h2>
              <p>+86 123 4567 8901</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon icon={locationOutline} slot="start" />
            <IonLabel>
              <h2>地址</h2>
              <p>北京市朝阳区</p>
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
