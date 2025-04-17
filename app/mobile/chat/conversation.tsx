import { useRouter, useSearchParams } from 'next/navigation';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton, IonInput, IonList, IonItem, IonAvatar, IonLabel
} from '@ionic/react';
import { useState } from 'react';

const mockMessages = [
  { id: 1, from: 'Alice', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', text: 'Hi there!', time: '09:00' },
  { id: 2, from: 'Me', avatar: '', text: 'Hello!', time: '09:01' },
];

export default function ChatConversation() {
  const router = useRouter();
  const params = useSearchParams();
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), from: 'Me', avatar: '', text: input, time: '现在' }]);
    setInput('');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>与 {params.get('id') || '对方'} 聊天</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto glass-card rounded-2xl p-4 w-full max-w-md mx-auto mt-10">
          <IonList lines="none">
            {messages.map(msg => (
              <IonItem key={msg.id} className={msg.from === 'Me' ? 'justify-end flex-row-reverse bg-pink-100/10 rounded-xl mb-2' : 'bg-slate-800/50 rounded-xl mb-2'}>
                {msg.avatar && <IonAvatar slot="start" className="shadow-lg"><img src={msg.avatar} alt={msg.from} /></IonAvatar>}
                <IonLabel className="text-white">
                  <div className={msg.from === 'Me' ? 'text-right' : ''}>
                    <span className="block font-bold">{msg.from}</span>
                    <span className="block text-base">{msg.text}</span>
                    <span className="text-xs text-slate-400">{msg.time}</span>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
        <IonFooter className="ion-padding flex gap-2 bg-slate-900/80 rounded-t-2xl shadow-xl">
          <IonInput value={input} onIonChange={e => setInput(e.detail.value!)} placeholder="输入消息..." className="rounded-full bg-slate-800 text-white px-4" />
          <IonButton color="warning" onClick={send} className="rounded-full">发送</IonButton>
        </IonFooter>
      </IonContent>
    </IonPage>
  );
}
