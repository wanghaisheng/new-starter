import { useRouter } from 'next/navigation';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonButton, IonSpinner
} from '@ionic/react';
import { useAuth } from '@/core/hooks/useAuth';
import { useConversations } from '@/core/hooks/useConversations';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';

export default function ChatListPage() {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const {
    conversations,
    loading,
    fetchError
  } = useConversations(user?.id || '');

  if (loading) {
    return (
      <IonPage>
        <IonContent className="flex items-center justify-center min-h-screen">
          <IonSpinner name="crescent" color="primary" />
        </IonContent>
      </IonPage>
    );
  }

  if (fetchError) {
    return (
      <IonPage>
        <IonContent className="flex flex-col items-center justify-center min-h-screen">
          <ErrorDisplay error={fetchError.message || '消息列表加载失败'} onRetry={() => {}} />
        </IonContent>
      </IonPage>
    );
  }

  if (!conversations.length) {
    return (
      <IonPage>
        <IonContent className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-400 mb-4">
  {t('auto.list.')}
</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
  {t('auto.list.')}
</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
        <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
          <IonList>
            {conversations.map((conv) => (
              <IonItem key={conv.id} button onClick={() => router.push(`/mobile/chat/conversation?id=${conv.id}`)} className="hover:bg-slate-800/50 transition-all rounded-xl mb-2">
                <IonAvatar slot="start" className="shadow-lg">
                  <img src={'/default-avatar.png'} alt={conv.participants?.join(',') || '会话'} />
                </IonAvatar>
                <IonLabel>
                  <h2 className="font-bold text-white">{conv.participants?.join(', ')}</h2>
                  <p className="text-slate-400">{conv.lastMessage?.content || '无消息'}</p>
                </IonLabel>
                {conv.unreadCount && conv.unreadCount > 0 && <span className="ml-2 text-xs bg-pink-500 text-white px-2 py-1 rounded-full">{conv.unreadCount}</span>}
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
}
