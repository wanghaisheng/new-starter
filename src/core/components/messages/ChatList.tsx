// ChatList: 聊天列表组件，迁移自 mobile/components/messages/ChatList.tsx
import React from 'react';

interface ChatListProps {
  chats: { id: string; name: string; avatar: string; lastMessage: string; unread: number }[];
  onSelect: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, onSelect }) => (
  <div className="divide-y divide-slate-800 bg-slate-900 rounded-2xl overflow-hidden">
    {chats.map(chat => (
      <div
        key={chat.id}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800 transition-all"
        onClick={() => onSelect(chat.id)}
      >
        <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{chat.name}</div>
          <div className="text-xs text-slate-400 truncate">{chat.lastMessage}</div>
        </div>
        {chat.unread > 0 && <span className="bg-pink-600 text-white rounded-full px-2 py-0.5 text-xs">{chat.unread}</span>}
      </div>
    ))}
  </div>
);

export default ChatList;
