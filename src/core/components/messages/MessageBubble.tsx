// MessageBubble: 聊天气泡组件，迁移自 mobile/components/messages/MessageBubble.tsx
import React from 'react';

interface MessageBubbleProps {
  content: string;
  fromMe?: boolean;
  time?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ content, fromMe = false, time }) => (
  <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'}`}>
    <div className={`max-w-[70%] px-4 py-2 rounded-2xl mb-1 text-sm whitespace-pre-line ${fromMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-100 rounded-bl-sm'}`}>
      {content}
    </div>
    {time && <span className="text-xs text-slate-400 mb-2">{time}</span>}
  </div>
);

export default MessageBubble;
