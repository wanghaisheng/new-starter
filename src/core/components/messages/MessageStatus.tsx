// MessageStatus: 消息状态指示组件，迁移自 mobile/components/messages/MessageStatus.tsx
import React from 'react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

const statusMap = {
  sending: { text: '发送中', color: 'text-yellow-400' },
  sent: { text: '已发送', color: 'text-slate-400' },
  delivered: { text: '已送达', color: 'text-blue-400' },
  read: { text: '已读', color: 'text-green-400' },
  failed: { text: '失败', color: 'text-rose-500' }
};

const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => (
  <span className={`text-xs ${statusMap[status].color}`}>{statusMap[status].text}</span>
);

export default MessageStatus;
