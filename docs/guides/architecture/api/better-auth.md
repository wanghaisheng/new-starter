# Better Auth 集成指南

## 安装

```bash
bun add better-auth
```

## 基础配置

Better Auth 提供了灵活的配置选项,可以根据项目需求进行定制:

```typescript
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  // 数据库配置
  database: {
    type: 'custom', // 使用自定义数据库适配器
    adapter: {
      // 实现必要的数据库操作方法
      getUser: async (id: string) => { /* ... */ },
      getUserByEmail: async (email: string) => { /* ... */ },
      getUserByPhone: async (phoneNumber: string) => { /* ... */ },
      createUser: async (userData: any) => { /* ... */ },
      updateUser: async (id: string, updates: any) => { /* ... */ },
      deleteUser: async (id: string) => { /* ... */ }
    }
  },
  
  // 认证配置
  auth: {
    email: {
      enabled: true,
      requireVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 100,
      resetPasswordTokenExpiresIn: 24 * 60 * 60 * 1000, // 24小时
      password: {
        hash: async (password: string) => { /* ... */ },
        verify: async (password: string, hash: string) => { /* ... */ }
      },
      sendResetPassword: async (email: string, token: string) => { /* ... */ },
      sendVerificationEmail: async (email: string, token: string) => { /* ... */ }
    },
    phone: {
      enabled: true,
      verificationCodeLength: 6,
      verificationCodeExpiresIn: 10 * 60 * 1000 // 10分钟
    }
  },
  
  // 会话配置
  session: {
    modelName: 'Session',
    fields: {
      userId: 'userId',
      token: 'token',
      expiresAt: 'expiresAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      ipAddress: 'ipAddress',
      userAgent: 'userAgent'
    },
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    freshAge: 12 * 60 * 60 * 1000 // 12小时
  }
});
```

## 认证方法

Better Auth 提供了以下认证方法:

```typescript
// 邮箱密码登录
const result = await auth.signInWithEmail(email, password);

// 手机号验证码登录
const result = await auth.signInWithPhone(phoneNumber, verificationCode);

// 社交账号登录
const result = await auth.signInWithProvider('google');

// 退出登录
await auth.signOut();

// 更新用户资料
const result = await auth.updateProfile(userId, updates);

// 发送手机验证码
await auth.sendPhoneVerificationCode(phoneNumber);
```

## 会话管理

Better Auth 自动处理会话管理:

```typescript
// 获取当前会话
const session = await auth.getSession();

// 刷新会话
const newSession = await auth.refreshSession();

// 验证会话
const isValid = await auth.validateSession();
```

## 错误处理

Better Auth 使用标准的错误类型:

```typescript
try {
  await auth.signInWithEmail(email, password);
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.code) {
      case 'auth/user-not-found':
        // 用户不存在
        break;
      case 'auth/wrong-password':
        // 密码错误
        break;
      case 'auth/email-not-verified':
        // 邮箱未验证
        break;
      // ... 其他错误类型
    }
  }
}
```

## 类型定义

Better Auth 提供了完整的类型定义:

```typescript
import type { 
  AuthUser,
  AuthSession,
  AuthError,
  AuthProvider,
  PhoneAuthCredentials,
  SocialAuthCredentials
} from 'better-auth';
```

## 最佳实践

1. **数据库适配器**
   - 实现所有必需的数据库方法
   - 确保正确处理错误情况
   - 使用事务确保数据一致性

2. **密码处理**
   - 使用安全的密码哈希算法
   - 实现密码强度验证
   - 定期要求用户更改密码

3. **会话管理**
   - 设置合适的会话过期时间
   - 实现会话刷新机制
   - 记录会话活动日志

4. **错误处理**
   - 统一处理认证错误
   - 提供友好的错误消息
   - 记录错误日志

5. **安全考虑**
   - 使用 HTTPS
   - 实现速率限制
   - 防止暴力破解
   - 实现双因素认证 