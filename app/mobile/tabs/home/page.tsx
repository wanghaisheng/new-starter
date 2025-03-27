'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel, IonThumbnail } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import Link from 'next/link';

export default function HomePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>首页</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>欢迎使用</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>这是一个集成了Next.js 15、Ionic、Tailwind CSS和Capacitor的全栈移动应用启动项目。</p>
            <div className="flex justify-end mt-4">
              <Link href="/">
                <IonButton fill="clear">
                  返回主页
                  <IonIcon slot="end" icon={arrowForward}></IonIcon>
                </IonButton>
              </Link>
            </div>
          </IonCardContent>
        </IonCard>
        
        <IonList>
          <IonItem>
            <IonThumbnail slot="start">
              <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white">1</div>
            </IonThumbnail>
            <IonLabel>
              <h2>Next.js 15</h2>
              <p>最新的React框架</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonThumbnail slot="start">
              <div className="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white">2</div>
            </IonThumbnail>
            <IonLabel>
              <h2>Ionic</h2>
              <p>跨平台UI组件库</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonThumbnail slot="start">
              <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center text-white">3</div>
            </IonThumbnail>
            <IonLabel>
              <h2>Tailwind CSS</h2>
              <p>实用优先的CSS框架</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonThumbnail slot="start">
              <div className="w-full h-full bg-yellow-500 rounded-full flex items-center justify-center text-white">4</div>
            </IonThumbnail>
            <IonLabel>
              <h2>Capacitor</h2>
              <p>原生应用运行时</p>
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
