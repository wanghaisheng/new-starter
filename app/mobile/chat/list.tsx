import { useRouter } from 'next/navigation';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonButton
} from '@ionic/react';

const mockChats = [
  { id: '1', name: 'Alice', lastMsg: 'Hi there!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', unread: 2 },
  { id: '2', name: 'Bob', lastMsg: 'See you soon!', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', unread: 0 },
];

export default function ChatList() {
  const router = useRouter();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>消息</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
        <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
          <IonList>
            {mockChats.map(chat => (
              <IonItem key={chat.id} button onClick={() => router.push(`/mobile/chat/conversation?id=${chat.id}`)} className="hover:bg-slate-800/50 transition-all rounded-xl mb-2">
                <IonAvatar slot="start" className="shadow-lg">
                  <img src={chat.avatar} alt={chat.name} />
                </IonAvatar>
                <IonLabel>
                  <h2 className="font-bold text-white">{chat.name}</h2>
                  <p className="text-slate-400">{chat.lastMsg}</p>
                </IonLabel>
                {chat.unread > 0 && <span className="ml-2 text-xs bg-pink-500 text-white px-2 py-1 rounded-full">{chat.unread}</span>}
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
}
