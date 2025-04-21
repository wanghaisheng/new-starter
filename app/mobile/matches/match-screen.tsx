import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonImg
} from '@ionic/react';

export default function MatchScreen() {
  useRequireAuth();
  const router = useRouter();
  // TODO: 可通过 props/context 传递配对对象信息
  const matchUser = {
    name: 'Alice',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    desc: '你们互相喜欢了对方！快去打个招呼吧~',
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle{t('auto.match_screen.')}/IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-pink-700 to-yellow-300 min-h-screen flex flex-col items-center justify-center">
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center w-full max-w-sm">
          <IonImg src={matchUser.avatar} className="w-32 h-32 rounded-full border-4 border-pink-300 mb-6 shadow-lg" />
          <h2 className="text-2xl font-bold text-pink-100 mb-2">与 {matchUser.name} 配对成功！</h2>
          <p className="text-pink-50 mb-8">{matchUser.desc}</p>
          <IonButton expand="block" color="warning" className="rounded-full mb-2" onClick={() => router.push('/mobile/chat/list')}>
            立即聊天
          </IonButton>
          <IonButton fill="clear" color="light" className="rounded-full" onClick={() => router.push('/mobile/home')}>
            继续浏览
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
