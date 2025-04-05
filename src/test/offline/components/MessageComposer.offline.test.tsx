/**
 * MessageComposer 离线功能测试
 * 
 * 测试消息输入组件在离线状态下的行为
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MessageService } from '@/core/services/message-service';
import { NetworkService } from '@/core/services/network-service';
import { DatabaseService } from '@/core/lib/db/service';
import { NetworkStatus } from '@capacitor/network';

// 首先创建一个简单的MessageComposer组件
const MessageComposer: React.FC<{
  matchId: string;
  currentUserId: string;
  receiverId: string;
  onMessageSent?: () => void;
}> = ({ matchId, currentUserId, receiverId, onMessageSent }) => {
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  
  React.useEffect(() => {
    const networkService = NetworkService.getInstance();
    setOffline(!networkService.isOnline());
    
    const handleNetworkChange = (status: NetworkStatus) => {
      setOffline(!status.connected);
    };
    
    const listenerId = networkService.addNetworkStatusListener(handleNetworkChange);
    
    return () => {
      networkService.removeNetworkStatusListener(listenerId);
    };
  }, []);
  
  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const messageService = MessageService.getInstance();
      await messageService.sendMessage(matchId, currentUserId, receiverId, message);
      setMessage('');
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="flex items-center p-2 border-t" data-testid="message-composer">
      {offline && (
        <div className="text-xs text-yellow-500 mb-1" data-testid="offline-badge">
          离线模式（消息将在网络恢复后发送）
        </div>
      )}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入消息..."
        className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2"
        data-testid="message-input"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className={`rounded-full p-2 bg-blue-500 text-white ${
          !message.trim() || sending ? 'opacity-50' : ''
        }`}
        data-testid="send-button"
      >
        {sending ? '发送中...' : '发送'}
      </button>
    </div>
  );
};

// 模拟服务
jest.mock('@/core/services/message-service', () => ({
  MessageService: {
    getInstance: jest.fn()
  }
}));

jest.mock('@/core/services/network-service', () => ({
  NetworkService: {
    getInstance: jest.fn()
  }
}));

jest.mock('@/core/lib/db/service', () => ({
  DatabaseService: {
    getInstance: jest.fn()
  }
}));

describe('MessageComposer Offline Tests', () => {
  let messageServiceMock: any;
  let networkServiceMock: any;
  let networkStatusListeners: Function[] = [];
  let sendMessageMock: jest.Mock;
  
  beforeEach(() => {
    // 重置监听器数组
    networkStatusListeners = [];
    
    // 模拟NetworkService
    networkServiceMock = {
      isOnline: jest.fn().mockReturnValue(true),
      addNetworkStatusListener: jest.fn((callback) => {
        networkStatusListeners.push(callback);
        return 'mock-listener-id'; // 返回一个监听器ID
      }),
      removeNetworkStatusListener: jest.fn(),
      simulateNetworkChange: (online: boolean) => {
        networkStatusListeners.forEach(callback => callback({
          connected: online,
          connectionType: online ? 'wifi' : 'none'
        }));
      }
    };
    
    // 模拟MessageService
    sendMessageMock = jest.fn().mockResolvedValue({ id: 'msg-1' });
    messageServiceMock = {
      sendMessage: sendMessageMock
    };
    
    // 设置模拟服务的返回值
    (NetworkService.getInstance as jest.Mock).mockReturnValue(networkServiceMock);
    (MessageService.getInstance as jest.Mock).mockReturnValue(messageServiceMock);
    
    // 清除所有模拟
    jest.clearAllMocks();
  });
  
  it('应该正确显示离线指示器', async () => {
    // 初始设置为在线
    networkServiceMock.isOnline.mockReturnValue(true);
    
    const { rerender } = render(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
      />
    );
    
    // 不应显示离线指示器
    expect(screen.queryByTestId('offline-badge')).not.toBeInTheDocument();
    
    // 模拟网络切换到离线状态
    act(() => {
      networkServiceMock.isOnline.mockReturnValue(false);
      networkServiceMock.simulateNetworkChange(false);
    });
    
    // 需要重新渲染以显示状态更新
    rerender(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
      />
    );
    
    // 应显示离线指示器
    await waitFor(() => {
      expect(screen.getByTestId('offline-badge')).toBeInTheDocument();
      expect(screen.getByTestId('offline-badge').textContent).toContain('离线模式');
    });
  });
  
  it('应该在离线状态下能够发送消息', async () => {
    // 设置为离线状态
    networkServiceMock.isOnline.mockReturnValue(false);
    
    render(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
      />
    );
    
    // 应显示离线指示器
    expect(screen.getByTestId('offline-badge')).toBeInTheDocument();
    
    // 输入消息
    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: 'Hello from offline' } });
    
    // 点击发送按钮
    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);
    
    // 验证消息服务调用
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith(
        'match-1', 
        'user-1', 
        'user-2', 
        'Hello from offline'
      );
    });
    
    // 验证输入框被清空
    expect(messageInput).toHaveValue('');
  });
  
  it('应该在连接恢复后继续正常工作', async () => {
    // 初始设置为离线
    networkServiceMock.isOnline.mockReturnValue(false);
    
    const { rerender } = render(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
      />
    );
    
    // 应显示离线指示器
    expect(screen.getByTestId('offline-badge')).toBeInTheDocument();
    
    // 输入并发送离线消息
    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: 'First offline message' } });
    fireEvent.click(screen.getByTestId('send-button'));
    
    // 等待发送完成
    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
    
    // 模拟网络连接恢复
    act(() => {
      networkServiceMock.isOnline.mockReturnValue(true);
      networkServiceMock.simulateNetworkChange(true);
    });
    
    // 重新渲染以反映状态变化
    rerender(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
      />
    );
    
    // 离线指示器应消失
    await waitFor(() => {
      expect(screen.queryByTestId('offline-badge')).not.toBeInTheDocument();
    });
    
    // 输入并发送在线消息
    fireEvent.change(messageInput, { target: { value: 'Now back online' } });
    fireEvent.click(screen.getByTestId('send-button'));
    
    // 验证两条消息都已发送
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledTimes(2);
      expect(sendMessageMock).toHaveBeenNthCalledWith(1, 
        'match-1', 'user-1', 'user-2', 'First offline message');
      expect(sendMessageMock).toHaveBeenNthCalledWith(2, 
        'match-1', 'user-1', 'user-2', 'Now back online');
    });
  });
  
  it('应该在组件卸载时移除网络状态监听器', () => {
    const { unmount } = render(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
      />
    );
    
    // 卸载组件
    unmount();
    
    // 应调用removeNetworkStatusListener
    expect(networkServiceMock.removeNetworkStatusListener).toHaveBeenCalledWith('mock-listener-id');
  });
  
  it('应该触发onMessageSent回调', async () => {
    const onMessageSentMock = jest.fn();
    
    render(
      <MessageComposer 
        matchId="match-1" 
        currentUserId="user-1" 
        receiverId="user-2"
        onMessageSent={onMessageSentMock}
      />
    );
    
    // 输入并发送消息
    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByTestId('send-button'));
    
    // 验证回调被触发
    await waitFor(() => {
      expect(onMessageSentMock).toHaveBeenCalledTimes(1);
    });
  });
}); 