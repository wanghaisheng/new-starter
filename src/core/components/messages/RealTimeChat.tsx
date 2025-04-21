// RealTimeChat: 实时聊天主组件，迁移自 mobile/components/messages/RealTimeChat.tsx
import React from 'react';
import ChatList from './ChatList';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  messages: { id: string; content: string; fromMe?: boolean; time: string }[];
}

interface RealTimeChatProps {
  chats: Chat[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onSend: (chatId: string, msg: string) => void;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({ chats, activeChatId, onSelectChat, onSend }) => {
  const activeChat = chats.find(c => c.id === activeChatId);
  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-slate-800 bg-slate-900">
        <ChatList chats={chats.map(({ id, name, avatar, messages }) => ({ id, name, avatar, lastMessage: messages[messages.length-1]?.content || '', unread: 0 }))} onSelect={onSelectChat} />
      </div>
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          {activeChat && activeChat.messages.map(msg => (
            <MessageItem key={msg.id} avatar={activeChat.avatar} name={activeChat.name} content={msg.content} time={msg.time} fromMe={msg.fromMe} />
          ))}
        </div>
        {activeChat && <MessageInput onSend={msg => onSend(activeChat.id, msg)} />}
      </div>
    </div>
  );
};

export default RealTimeChat;
