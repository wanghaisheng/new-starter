// MessageItem: 单条消息项，迁移自 mobile/components/messages/MessageItem.tsx
import React from 'react';

interface MessageItemProps {
  avatar: string;
  name: string;
  content: string;
  time: string;
  fromMe?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ avatar, name, content, time, fromMe = false }) => (
  <div className={`flex gap-3 items-end mb-3 ${fromMe ? 'flex-row-reverse' : ''}`}>
    <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
    <div className="flex flex-col max-w-[70%]">
      <div className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-line ${fromMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'}`}>{content}</div>
      <span className="text-xs text-slate-400 mt-1">{time}</span>
    </div>
  </div>
);

export default MessageItem;
