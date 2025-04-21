// MessageInput: 聊天输入框组件，迁移自 mobile/components/messages/MessageInput.tsx
import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (msg: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  return (
    <form
      className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl"
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) {
          onSend(value);
          setValue('');
        }
      }}
    >
      <input
        className="flex-1 bg-slate-800 rounded-full px-4 py-2 text-sm outline-none border border-slate-700 focus:border-pink-500 transition-all"
        placeholder="输入消息..."
        value={value}
        disabled={disabled}
        onChange={e => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full font-medium transition-all"
        disabled={disabled || !value.trim()}
      >发送</button>
    </form>
  );
};

export default MessageInput;
