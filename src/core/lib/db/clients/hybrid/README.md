# 混合数据库客户端 (Hybrid Database Client)

混合数据库客户端是一个高级数据存储解决方案，支持同时使用本地和远程数据存储，提供无缝的在线/离线数据访问和自动同步功能。


## 功能特点

- **离线优先**: 即使没有网络连接，应用也能正常工作
- **透明同步**: 在网络可用时自动将本地更改同步到远程存储
- **冲突解决**: 内置多种冲突解决策略
- **灵活配置**: 可自定义同步频率、重试策略等
- **类型安全**: 使用TypeScript编写，提供完整的类型支持

## 配置选项

`HybridDatabaseClient` 接受 `HybridDatabaseConfig` 配置对象：

```typescript
interface HybridDatabaseConfig {
  engine: DatabaseEngine;
  sync?: SyncConfig;
  offline?: {
    maxStorageSize?: number;
    maxEntitiesPerTable?: number;
    compressionEnabled?: boolean;
    encryptionEnabled?: boolean;
  };
}

interface SyncConfig {
  enabled: boolean;
  strategy: 'immediate' | 'periodic' | 'manual';
  localClient: IDatabaseClient;
  remoteClient: IDatabaseClient;
  syncIntervalMs?: number;
  maxSyncRetries?: number;
  syncRetryDelayMs?: number;
  conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins';
}
```

## 不同开发阶段的混合客户端使用演示

我们的项目支持在不同开发阶段使用不同的混合数据库配置，根据环境自动选择合适的本地和远程客户端组合。

### 1. 开发阶段 (Mock)

在开发初期，我们使用模拟数据进行开发和测试，此时混合客户端会由一个 MockIndexedDBClient 和一个 MockDatabaseClient 组成：

```typescript
// 环境配置方式
// .env.development
NEXT_PUBLIC_DATABASE_ENV=mock
NEXT_PUBLIC_USE_HYBRID_CLIENT=true

// 代码配置方式
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { DatabaseClientType, DatabaseFactory } from '@/core/lib/db/factory';

// 通过工厂方法创建混合客户端
const hybridClient = DatabaseFactory.createHybridClient(
  DatabaseClientType.MOCK_INDEXEDDB, // 本地客户端类型
  DatabaseClientType.MOCK, // 远程客户端类型
  {
    name: 'mock_hybrid_db',
    version: 1
  }
);

// 或者通过服务工厂类启用
DataServiceFactory.setUseHybridClient(true);
const dataService = DataServiceFactory.getDataService();
await dataService.initialize();
```

这种配置模拟了真实环境中的分层存储架构：
- **本地层**: MockIndexedDBClient 模拟浏览器的 IndexedDB 存储
- **远程层**: MockDatabaseClient 模拟远程服务器存储

适用场景：
- 单元测试和组件开发
- UI功能验证
- 离线功能开发初期

### 2. 本地开发阶段 (Local)

在功能稳定后，可切换到使用真实的本地存储，但仍使用模拟的远程存储：

```typescript
// 环境配置方式
// .env.local
NEXT_PUBLIC_DATABASE_ENV=local
NEXT_PUBLIC_USE_HYBRID_CLIENT=true

// 代码配置方式
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { DatabaseClientType, DatabaseFactory } from '@/core/lib/db/factory';

// 通过工厂方法创建混合客户端
const hybridClient = DatabaseFactory.createHybridClient(
  DatabaseClientType.INDEXEDDB, // 本地使用真实IndexedDB
  DatabaseClientType.MOCK, // 远程仍使用Mock数据
  {
    name: 'local_hybrid_db',
    version: 1
  }
);

// 或者使用服务工厂类
DataServiceFactory.setUseHybridClient(true);
const dataService = DataServiceFactory.getDataService();
await dataService.initialize();
```

这种配置结合了真实的本地存储和模拟的远程存储：
- **本地层**: 真实的 IndexedDB 或 SQLite (移动端)
- **远程层**: 仍使用 MockDatabaseClient 模拟远程服务

适用场景：
- 离线功能完整测试
- 网络同步行为测试
- 本地存储性能评估

### 3. 生产环境 (Production)

在生产环境中，混合客户端将连接真实的云服务作为远程存储：

```typescript
// 环境配置方式
// .env.production
NEXT_PUBLIC_DATABASE_ENV=production
NEXT_PUBLIC_USE_HYBRID_CLIENT=true

// 代码配置方式
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { DatabaseClientType, DatabaseFactory } from '@/core/lib/db/factory';

// Web环境下的混合客户端
const webHybridClient = DatabaseFactory.createHybridClient(
  DatabaseClientType.INDEXEDDB, // 本地使用IndexedDB
  DatabaseClientType.FIREBASE, // 远程使用Firebase
  {
    name: 'production_hybrid_db',
    version: 1
  }
);

// 移动环境下的混合客户端
const mobileHybridClient = DatabaseFactory.createHybridClient(
  DatabaseClientType.CAPACITOR_SQLITE, // 本地使用SQLite
  DatabaseClientType.FIREBASE, // 远程使用Firebase
  {
    name: 'production_hybrid_db',
    version: 1
  }
);

// 使用服务工厂类(会自动根据平台选择合适的客户端)
DataServiceFactory.setUseHybridClient(true);
const dataService = DataServiceFactory.getDataService();
await dataService.initialize();
```

生产配置使用真实的本地和远程存储：
- **本地层**: Web端使用IndexedDB，移动端使用SQLite
- **远程层**: 使用Firebase、Supabase或其他云服务

适用场景：
- 生产应用部署
- 真实用户数据同步
- 全面的在线/离线功能支持

## 使用混合客户端支持前端功能示例

以下展示如何在前端组件中使用混合客户端提供的数据服务实现具体功能：

### 1. 用户资料管理

```tsx
// app/mobile/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { User } from '@/core/lib/db/types';
import { NetworkService } from '@/core/services/network-service';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const dataService = DataServiceFactory.getDataService();
  const networkService = NetworkService.getInstance();
  
  useEffect(() => {
    // 加载用户资料
    const loadUserProfile = async () => {
      try {
        const currentUser = await dataService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };
    
    // 监听网络状态
    const handleNetworkChange = (online: boolean) => {
      setIsOffline(!online);
    };
    
    loadUserProfile();
    
    // 添加网络状态监听
    const unsubscribe = networkService.addNetworkStatusListener(handleNetworkChange);
    setIsOffline(!networkService.isOnline());
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const handleSave = async (updatedData: Partial<User>) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // 无论在线或离线都能保存，混合客户端会处理同步
      const updatedUser = await dataService.updateUser(user.id, updatedData);
      setUser(updatedUser);
      
      // 如果在线，尝试立即同步
      if (networkService.isOnline()) {
        await dataService.forceSync();
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="profile-container">
      {isOffline && (
        <div className="offline-indicator">
          您当前处于离线模式，更改将在网络连接恢复后同步
        </div>
      )}
      
      {user && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSave({
            name: formData.get('name') as string,
            bio: formData.get('bio') as string,
          });
        }}>
          <div className="form-group">
            <label htmlFor="name">姓名</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              defaultValue={user.name} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">个人简介</label>
            <textarea 
              id="bio" 
              name="bio" 
              defaultValue={user.bio || ''} 
              rows={4}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSaving}
            className="save-button"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </form>
      )}
    </div>
  );
}
```

### 2. 消息列表与对话功能

```tsx
// src/mobile/components/messages/ChatList.tsx
import React, { useState, useEffect } from 'react';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { Match, Message, User } from '@/core/lib/db/types';
import MessageItem from './MessageItem';
import NetworkStatusIndicator from '../ui/NetworkStatusIndicator';

interface ChatListProps {
  currentUserId: string;
  onError?: (error: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ currentUserId, onError }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [lastMessages, setLastMessages] = useState<Map<string, Message>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const dataService = DataServiceFactory.getDataService();
  
  useEffect(() => {
    const loadChatList = async () => {
      try {
        setLoading(true);
        
        // 使用混合客户端获取匹配列表
        const userMatches = await dataService.getMatches(currentUserId);
        setMatches(userMatches);
        
        // 为每个匹配加载用户和最后消息
        const usersMap = new Map<string, User>();
        const messagesMap = new Map<string, Message>();
        
        // 并行加载数据
        await Promise.all(userMatches.map(async (match) => {
          try {
            // 获取匹配的另一方用户
            const otherUserId = match.userIds.find(id => id !== currentUserId);
            if (otherUserId) {
              const user = await dataService.getUser(otherUserId);
              usersMap.set(otherUserId, user);
            }
            
            // 获取最后一条消息
            const messages = await dataService.getMessages(match.id);
            if (messages.length > 0) {
              // 按时间排序获取最新消息
              const lastMessage = messages.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              messagesMap.set(match.id, lastMessage);
            }
          } catch (error) {
            console.error(`Error loading chat data for match ${match.id}:`, error);
          }
        }));
        
        setUsers(usersMap);
        setLastMessages(messagesMap);
      } catch (error) {
        console.error('Failed to load chat list:', error);
        onError?.('聊天列表加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    loadChatList();
    
    // 定期更新会话列表
    const interval = setInterval(loadChatList, 30000);
    
    return () => clearInterval(interval);
  }, [currentUserId]);
  
  const handleChatItemClick = (matchId: string) => {
    // 导航到聊天页面
    window.location.href = `/mobile/matches/${matchId}`;
  };
  
  return (
    <div className="chat-list-container">
      <div className="header">
        <h1>消息</h1>
        <NetworkStatusIndicator />
      </div>
      
      {loading ? (
        <div className="loading-indicator">加载中...</div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          暂无消息记录
        </div>
      ) : (
        <div className="chat-items">
          {matches.map(match => {
            const otherUserId = match.userIds.find(id => id !== currentUserId);
            const user = otherUserId ? users.get(otherUserId) : null;
            const lastMessage = lastMessages.get(match.id);
            
            if (!user) return null;
            
            return (
              <MessageItem
                key={match.id}
                matchId={match.id}
                user={user}
                lastMessage={lastMessage}
                currentUserId={currentUserId}
                onClick={() => handleChatItemClick(match.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;
```

### 3. 实时聊天功能

```tsx
// app/mobile/matches/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { Message, User, Match } from '@/core/lib/db/types';
import RealTimeChat from '@/src/mobile/components/messages/RealTimeChat';
import NetworkStatusIndicator from '@/src/mobile/components/ui/NetworkStatusIndicator';

export default function ChatPage() {
  const params = useParams();
  const matchId = params.id as string;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const dataService = DataServiceFactory.getDataService();
  
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setLoading(true);
        
        // 1. 获取当前用户
        const user = await dataService.getCurrentUser();
        setCurrentUser(user);
        
        // 2. 获取匹配信息
        const match = await dataService.getMatch(matchId);
        
        // 3. 获取匹配的另一方用户
        const otherUserId = match.userIds.find(id => id !== user.id);
        if (!otherUserId) {
          throw new Error('匹配信息不完整');
        }
        
        const otherUser = await dataService.getUser(otherUserId);
        setMatchedUser(otherUser);
        
        // 4. 加载初始消息列表
        const messages = await dataService.getMessages(matchId);
        setInitialMessages(messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ));
        
        // 5. 可选：标记所有收到的消息为已读
        const receivedMessages = messages.filter(
          msg => msg.receiverId === user.id && msg.status !== 'read'
        );
        
        if (receivedMessages.length > 0) {
          // 批量更新消息状态
          await Promise.all(receivedMessages.map(async (msg) => {
            await dataService.updateMessage(msg.id, { status: 'read' });
          }));
        }
        
      } catch (error) {
        console.error('Failed to load chat data:', error);
        setError('聊天数据加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    loadChatData();
  }, [matchId]);
  
  const handleSendMessage = async (content: string): Promise<void> => {
    if (!currentUser || !matchedUser) return;
    
    try {
      // 创建新消息
      const newMessage: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
        matchId,
        senderId: currentUser.id,
        receiverId: matchedUser.id,
        content,
        status: 'sent'
      };
      
      // 使用混合客户端发送消息 - 即使离线也能工作
      const message = await dataService.createMessage(newMessage as Message);
      
      return;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('消息发送失败，请稍后重试');
    }
  };
  
  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }
  
  if (error || !currentUser || !matchedUser) {
    return <div className="error-container">{error || '加载聊天数据时出错'}</div>;
  }
  
  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>{matchedUser.name}</h2>
        <NetworkStatusIndicator />
      </div>
      
      <RealTimeChat
        matchId={matchId}
        currentUserId={currentUser.id}
        matchedUser={matchedUser}
        initialMessages={initialMessages}
      />
    </div>
  );
}
```

## 基本用法

### 1. 初始化混合客户端

```typescript
import { DatabaseConfigBuilder } from '@/core/lib/db/config';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb';
import { FirebaseClient } from '@/core/lib/db/clients/firebase';
import { HybridDatabaseClient } from '@/core/lib/db/clients/hybrid';

// 创建本地客户端 (IndexedDB)
const localConfig = new DatabaseConfigBuilder()
  .withName('local-db')
  .withEngine('indexeddb')
  .build();
const localClient = new IndexedDBClient(localConfig);

// 创建远程客户端 (Firebase)
const remoteConfig = new DatabaseConfigBuilder()
  .withName('remote-db')
  .withEngine('firebase')
  .build();
const remoteClient = new FirebaseClient(remoteConfig);

// 创建混合客户端配置
const hybridConfig = {
  engine: 'hybrid',
  sync: {
    enabled: true,
    strategy: 'periodic',
    localClient,
    remoteClient,
    syncIntervalMs: 60000, // 每分钟同步一次
    maxSyncRetries: 3,
    conflictResolution: 'last-write-wins'
  },
  offline: {
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    compressionEnabled: true
  }
};

// 初始化混合客户端
const hybridClient = new HybridDatabaseClient(hybridConfig);
await hybridClient.initialize();
```

### 2. 使用客户端进行数据操作

```typescript
// 创建实体
const user = await hybridClient.createUser({
  name: '张三',
  email: 'zhangsan@example.com',
  // ...其他属性
});

// 读取实体
const foundUser = await hybridClient.findById('users', user.id);

// 更新实体
await hybridClient.update('users', user.id, { 
  name: '张三 (已更新)'
});

// 查询实体
const results = await hybridClient.query('users', {
  where: { field: 'email', operator: '==', value: 'zhangsan@example.com' },
  limit: 10
});

// 删除实体
await hybridClient.delete('users', user.id);
```

## 网络状态处理

混合客户端会自动监听网络状态变化并相应调整：

- 当网络连接时，会尝试同步待处理的操作
- 当网络断开时，会将操作存储在本地，等待后续同步

可以手动控制同步行为：

```typescript
// 手动触发同步
await dataService.forceSync();

// 检查是否有待同步数据
const hasPendingChanges = await dataService.hasPendingChanges();
```

## 同步策略

混合客户端支持三种同步策略：

1. **即时同步 (immediate)**: 每次数据变更后立即尝试同步
2. **定期同步 (periodic)**: 按配置的时间间隔定期同步
3. **手动同步 (manual)**: 仅在手动调用同步方法时同步

## 冲突解决

当本地和远程数据发生冲突时，会根据配置的策略解决：

- **client-wins**: 本地数据覆盖远程数据
- **server-wins**: 远程数据覆盖本地数据
- **last-write-wins**: 以最后修改时间为准

## 最佳实践

1. **使用离线优先策略**: 将关键操作优先保存到本地，提升用户体验
2. **合理配置同步间隔**: 根据应用需求设置合适的同步频率
3. **批量处理同步操作**: 对于大量数据更新，考虑使用批处理减少同步开销
4. **使用适当的错误处理**: 确保捕获并处理同步过程中的错误
5. **考虑数据大小**: 监控本地存储使用情况，避免超出浏览器限制

## 调试技巧

可以通过以下方式调试混合客户端的行为：

```typescript
// 监听同步事件
hybridClient.on('syncStarted', () => console.log('同步开始'));
hybridClient.on('syncCompleted', () => console.log('同步完成'));
hybridClient.on('syncFailed', (error) => console.error('同步失败', error));

// 查看当前待同步操作
console.log(await dataService.getSyncQueue());
```

## 注意事项

- 混合客户端需要配置正确的本地和远程客户端实例
- 对于大型应用，建议在 Web Worker 中执行同步操作，避免阻塞主线程
- 不同的远程客户端可能有各自的限制和特性，请参考相应文档 