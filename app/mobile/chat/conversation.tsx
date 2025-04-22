import { useRouter, useSearchParams } from 'next/navigation';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton, IonInput, IonList, IonItem, IonAvatar, IonLabel, IonSpinner
} from '@ionic/react';
import { useEffect, useState, useMemo } from 'react';
import { useMessages } from '@/core/hooks/useMessages';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import { useAuth } from '@/core/hooks/useAuth';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function ChatConversation() {
  useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const chatId = params.get('id');
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const {
    messages,
    loading,
    fetchError,
    sendError,
    sendMessage,
    reloadMessages,
    empty
  } = useMessages(chatId || '');
  const [sending, setSending] = useState(false);

  // 自动推断 receiverId：取当前会话中除自己外的用户
  const receiverId = useMemo(() => {
    if (!user || !messages.length) return '';
    // 优先从历史消息找出不是自己的 senderId
    const otherMsg = messages.find(m => m.senderId !== user.id);
    if (otherMsg) return otherMsg.senderId;
    // 若无历史消息，则无法推断
    return '';
  }, [user, messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatId || !user) return;
    // receiverId 必须存在，否则不发送
    if (!receiverId) {
      alert('无法确定聊天对象，请稍后重试');
      return;
    }
    setSending(true);
    try {
      await sendMessage({
        matchId: chatId,
        senderId: user.id,
        receiverId,
        content: input,
        type: 'text',
      });
      setInput('');
      await reloadMessages();
    } catch (err) {
      // 错误已由 hook 内部 toast 处理
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="flex items-center justify-center min-h-screen">
          <IonSpinner name="crescent" color="primary" />
        </IonContent>
      </IonPage>
    );
  }

  if (fetchError || sendError) {
    return (
      <IonPage>
        <IonContent className="flex flex-col items-center justify-center min-h-screen">
          <ErrorDisplay error={fetchError?.message || sendError?.message || '消息加载失败'} onRetry={reloadMessages} />
          <IonButton color="medium" onClick={() => router.back()}{t('auto.conversation.')}/IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>与 {receiverId ? receiverId : chatId || '对方'} 聊天</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto glass-card rounded-2xl p-4 w-full max-w-md mx-auto mt-10">
          <IonList lines="none">
            {empty ? (
              <div className="text-center text-gray-400">
  {t('auto.conversation.')}
</div>
            ) : (
              messages.map((msg) => (
                <IonItem key={msg.id} className={msg.senderId === user?.id ? 'justify-end flex-row-reverse bg-pink-100/10 rounded-xl mb-2' : 'bg-slate-800/50 rounded-xl mb-2'}>
                  <IonAvatar slot="start" className="shadow-lg">
                    <img src={'/default-avatar.png'} alt={msg.senderId} />
                  </IonAvatar>
                  <IonLabel className="text-white">
                    <h3 className="font-bold text-white">{msg.senderId === user?.id ? '我' : msg.senderId}</h3>
                    <p className="text-slate-300">{msg.content}</p>
                    <span className="text-xs text-slate-500 ml-2">{msg.type === 'image' ? '[图片]' : ''}</span>
                    <span className="text-xs text-slate-500 ml-2">{msg.status}</span>
                  </IonLabel>
                </IonItem>
              ))
            )}
          </IonList>
        </div>
        <IonFooter className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 p-2">
            <IonInput
              value={input}
              onIonChange={e => setInput(e.detail.value!)}
              placeholder={t('auto.conversation.')}
              className="flex-1 bg-slate-700 text-white rounded-full px-4"
              disabled={sending}
            />
            <IonButton onClick={handleSend} disabled={sending || !input.trim()}>
              发送
            </IonButton>
          </div>
        </IonFooter>
      </IonContent>
    </IonPage>
  );
}
