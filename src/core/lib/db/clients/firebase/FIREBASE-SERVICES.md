# Firebase 服务综合指南

本文档提供了可用的 Firebase 服务及其使用方法的全面概述。我们的实现包括以下 Firebase 服务：

1. **Cloud Firestore** - 主数据库客户端
2. **Realtime Database** - 实时数据库客户端
3. **Cloud Storage** - 文件存储服务
4. **Authentication** - 用户认证服务

## 1. Cloud Firestore

Firebase Firestore 是一个 NoSQL 文档数据库，提供实时同步和离线支持。

### 基本用法

```typescript
import { FirebaseClient, FirebaseConfig } from '@/core/lib/db/clients/firebase';

// 创建配置
const config: FirebaseConfig = {
  name: 'my-app-db',
  version: 1,
  engine: 'firebase',
  
  // Firebase 配置
  firebaseOptions: {
    apiKey: "your-api-key",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  },
  
  // 其他选项...
};

// 初始化客户端
const client = new FirebaseClient(config);
await client.initialize();

// 基本 CRUD 操作
const user = await client.create('users', { name: '张三', email: 'zhang@example.com' });
const foundUser = await client.findById('users', user.id);
await client.update('users', user.id, { name: '张三更新' });
await client.delete('users', user.id);

// 查询
const result = await client.query('users', {
  where: {
    field: 'age',
    operator: '>',
    value: 18
  },
  orderBy: {
    field: 'createdAt',
    direction: 'desc'
  },
  limit: 10
});

// 事务
const result = await client.transaction(async (tx) => {
  const user = await tx.findById('users', 'user-id');
  await tx.update('users', 'user-id', { points: user.points + 10 });
  return user;
});

// 批处理
await client.batch('users', [
  { type: 'add', data: { name: '批量1', email: 'batch1@example.com' } },
  { type: 'put', data: { id: 'existing-id', name: '批量更新' } },
  { type: 'delete', data: { id: 'to-delete-id' } }
]);
```

### 实时数据监听

```typescript
import { RealtimeListener } from '@/core/lib/db/clients/firebase';

// 创建监听器
const listener = new RealtimeListener(client.getFirestore());

// 监听单个文档
const unsubscribe = listener.addEntityListener('users', 'user-id', 
  (user) => {
    console.log('用户数据更新:', user);
  }
);

// 监听集合
const unsubscribeCollection = listener.addCollectionListener('users',
  (users) => {
    console.log('用户列表更新:', users);
  }
);

// 取消监听
unsubscribe();
unsubscribeCollection();
```

## 2. Realtime Database

Firebase Realtime Database 是一个托管在云中的 NoSQL 数据库，使用 JSON 格式存储数据，并在客户端之间实时同步。

### 基本用法

```typescript
import { FirebaseRealtimeDBService } from '@/core/lib/db/clients/firebase';

// 创建实例
const realtimeDB = new FirebaseRealtimeDBService(config);

// 设置数据
const taskId = await realtimeDB.set('tasks', {
  title: '完成报告',
  complete: false,
  priority: 'high'
});

// 获取数据
const task = await realtimeDB.get('tasks', taskId);

// 更新数据
await realtimeDB.update('tasks', taskId, {
  complete: true
});

// 删除数据
await realtimeDB.remove('tasks', taskId);

// 查询数据
const highPriorityTasks = await realtimeDB.query('tasks', {
  where: {
    field: 'priority',
    operator: '==',
    value: 'high'
  },
  orderBy: {
    field: 'createdAt',
    direction: 'desc'
  },
  limit: 10
});
```

### 实时数据监听

```typescript
// 添加监听器
const unsubscribe = realtimeDB.addListener('tasks', {
  onData: (data) => {
    console.log('任务数据更新:', data);
  },
  onError: (error) => {
    console.error('监听错误:', error);
  }
});

// 取消监听
unsubscribe();
```

## 3. Cloud Storage

Firebase Cloud Storage 用于存储用户生成的内容，如图片、音频、视频等文件。

### 基本用法

```typescript
import { FirebaseStorageService } from '@/core/lib/db/clients/firebase';

// 创建实例
const storage = new FirebaseStorageService(config);

// 上传文件
const file = new File(['文件内容'], 'document.txt', { type: 'text/plain' });
const metadata = await storage.uploadFile('documents/document.txt', file, {
  contentType: 'text/plain',
  customMetadata: {
    owner: 'user123',
    category: 'documents'
  }
});

// 获取下载 URL
const downloadURL = await storage.getFileURL('documents/document.txt');

// 获取文件元数据
const fileInfo = await storage.getFileMetadata('documents/document.txt');

// 更新元数据
await storage.updateFileMetadata('documents/document.txt', {
  contentType: 'application/json',
  customMetadata: {
    status: 'reviewed'
  }
});

// 列出目录中的文件
const files = await storage.listFiles('documents');

// 删除文件
await storage.deleteFile('documents/document.txt');
```

## 4. Authentication

Firebase Authentication 提供了用户注册、登录和管理功能。

### 基本用法

```typescript
import { FirebaseAuthService } from '@/core/lib/db/clients/firebase';

// 创建实例
const auth = new FirebaseAuthService(config);
await auth.initialize();

// 注册新用户
const user = await auth.signUp('user@example.com', 'password123', '张三');

// 邮箱密码登录
const loggedInUser = await auth.signInWithEmail('user@example.com', 'password123');

// Google 登录
const googleUser = await auth.signInWithGoogle();

// 获取当前用户
const currentUser = auth.getCurrentUser();

// 更新用户资料
await auth.updateUserProfile('新用户名', 'https://example.com/profile.jpg');

// 重置密码
await auth.resetPassword('user@example.com');

// 监听认证状态变化
const unsubscribe = auth.onAuthStateChange((user) => {
  if (user) {
    console.log('用户已登录:', user);
  } else {
    console.log('用户已登出');
  }
});

// 注销
await auth.signOut();
```

## 权限管理

Firebase 项目还提供了权限管理服务，用于管理用户角色和权限：

```typescript
import { FirebasePermissionsService } from '@/core/lib/db/clients/firebase';

// 创建实例
const permissions = new FirebasePermissionsService(config);

// 设置用户角色
await permissions.setUserRole('user-id', 'admin');

// 添加权限
await permissions.addUserPermission('user-id', 'delete:users');

// 移除权限
await permissions.removeUserPermission('user-id', 'delete:users');

// 检查权限
const canDeleteUsers = await permissions.hasPermission('user-id', 'delete:users');

// 检查角色
const isAdmin = await permissions.isAdmin('user-id');
const isModerator = await permissions.isModerator('user-id');
```

## 配置选项

完整的 Firebase 配置选项包括：

```typescript
interface FirebaseConfig {
  // 基本配置
  name: string;
  version: number;
  engine: 'firebase';
  
  // Firebase 应用配置
  firebaseOptions: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  
  // Firestore 配置
  firestore?: {
    useEmulator: boolean;
    emulatorHost?: string;
    emulatorPort?: number;
    // 其他 Firestore 选项...
  };
  
  // Realtime Database 配置
  realtime?: {
    enabled: boolean;
    databaseURL?: string;
    useEmulator: boolean;
    emulatorHost?: string;
    emulatorPort?: number;
  };
  
  // Storage 配置
  storage?: {
    enabled: boolean;
    bucketName?: string;
    maxUploadSize?: number;
    useEmulator: boolean;
    emulatorHost?: string;
    emulatorPort?: number;
  };
  
  // Auth 配置
  auth?: {
    enabled: boolean;
    useEmulator: boolean;
    emulatorHost?: string;
    emulatorPort?: number;
    persistence?: 'local' | 'session' | 'none';
  };
  
  // 其他配置选项...
}
``` 