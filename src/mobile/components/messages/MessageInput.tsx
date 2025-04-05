import React, { useState, useRef } from 'react';

import { IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { sendOutline } from 'ionicons/icons';

import MessageStatus from './MessageStatus';

interface MessageInputProps {
  matchId: string;
  senderId: string;
  receiverId: string;
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 消息输入组件
 * 用于在聊天界面中输入和发送消息
 */
const MessageInput: React.FC<MessageInputProps> = ({
  matchId,
  senderId,
  receiverId,
  onSendMessage,
  disabled = false,
  placeholder = '输入消息...'
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'sent' | 'delivered' | 'read'>('sent');
  const [showStatus, setShowStatus] = useState(false);
  const inputRef = useRef<HTMLIonInputElement>(null);

  // 处理消息发送
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || sending) return;

    try {
      setSending(true);
      setSendStatus('sent');
      setShowStatus(true);
      
      await onSendMessage(trimmedMessage);
      
      // 清空输入框
      setMessage('');
      // 重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.setFocus();
      }, 100);
      
      // 更新状态为已送达（实际应用中可能由服务端通知）
      setTimeout(() => {
        setSendStatus('delivered');
        // 3秒后隐藏状态
        setTimeout(() => setShowStatus(false), 3000);
      }, 1000);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };

  // 处理按键事件，支持回车发送
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center p-2 border-t border-gray-200 bg-white">
      <div className="flex-1 mr-2">
        <IonInput
          ref={inputRef}
          value={message}
          placeholder={placeholder}
          onIonInput={(e) => setMessage(e.detail.value || '')}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="bg-gray-100 rounded-full px-4 py-2"
          style={{ '--padding-start': '16px', '--padding-end': '16px' }}
        />
      </div>
      
      <div className="relative">
        <IonButton
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled || sending}
          className={`rounded-full ${!message.trim() ? 'opacity-50' : ''}`}
          style={{ '--border-radius': '50%' }}
        >
          {sending ? (
            <IonSpinner name="dots" />
          ) : (
            <IonIcon icon={sendOutline} />
          )}
        </IonButton>
        
        {showStatus && (
          <div className="absolute -top-6 right-0 bg-white rounded-md shadow-sm px-2 py-1">
            <MessageStatus status={sendStatus} showText={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;