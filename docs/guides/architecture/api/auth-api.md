# 认证服务 API 文档

## 概述

认证服务提供了用户认证和管理的功能，支持多种认证方式（邮箱密码、手机验证码）和多种认证服务提供商（Better Auth、Firebase Auth、Mock Auth）。

## 基本认证

### 邮箱密码登录

```typescript
login(email: string, password: string): Promise<User>
```

使用邮箱和密码进行登录。

**参数：**
- `email`: 用户邮箱
- `password`: 用户密码

**返回：**
- `Promise<User>`: 登录成功的用户信息

**示例：**
```typescript
const user = await authService.login('user@example.com', 'password123');
```

### 手机验证码登录

```typescript
loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User>
```

使用手机号和验证码进行登录。

**参数：**
- `phoneNumber`: 手机号码
- `verificationCode`: 验证码

**返回：**
- `Promise<User>`: 登录成功的用户信息

**示例：**
```typescript
const user = await authService.loginWithPhone('+8613800138000', '123456');
```

### 发送验证码

```typescript
sendVerificationCode(phoneNumber: string): Promise<void>
```

发送验证码到指定手机号。

**参数：**
- `phoneNumber`: 手机号码

**示例：**
```typescript
await authService.sendVerificationCode('+8613800138000');
```

### 登出

```typescript
logout(): Promise<void>
```

登出当前用户。

**示例：**
```typescript
await authService.logout();
```

## 用户信息管理

### 获取当前用户

```typescript
getCurrentUser(): User | null
```

获取当前登录用户。

**返回：**
- `User | null`: 当前登录用户，如果未登录则返回 null

**示例：**
```typescript
const currentUser = authService.getCurrentUser();
if (currentUser) {
  console.log(`当前用户: ${currentUser.name}`);
}
```

### 检查认证状态

```typescript
isAuthenticated(): boolean
```

检查用户是否已认证。

**返回：**
- `boolean`: 是否已认证

**示例：**
```typescript
if (authService.isAuthenticated()) {
  console.log('用户已登录');
}
```

### 更新用户资料

```typescript
updateProfile(userData: Partial<User>): Promise<User>
```

更新用户资料。

**参数：**
- `userData`: 要更新的用户数据

**返回：**
- `Promise<User>`: 更新后的用户信息

**示例：**
```typescript
const updatedUser = await authService.updateProfile({
  name: '新用户名',
  bio: '新的个人简介'
});
```

## 密码管理

### 发送密码重置邮件

```typescript
sendPasswordResetEmail(email: string): Promise<void>
```

发送密码重置邮件到指定邮箱。

**参数：**
- `email`: 用户邮箱

**示例：**
```typescript
await authService.sendPasswordResetEmail('user@example.com');
```

### 验证密码重置代码

```typescript
verifyPasswordResetCode(code: string): Promise<string>
```

验证密码重置代码。

**参数：**
- `code`: 重置代码

**返回：**
- `Promise<string>`: 重置代码对应的邮箱地址

**示例：**
```typescript
const email = await authService.verifyPasswordResetCode('123456');
console.log(`重置密码的邮箱: ${email}`);
```

### 确认密码重置

```typescript
confirmPasswordReset(code: string, newPassword: string): Promise<void>
```

确认密码重置。

**参数：**
- `code`: 重置代码
- `newPassword`: 新密码

**示例：**
```typescript
await authService.confirmPasswordReset('123456', 'newPassword123');
```

## 邮箱验证

### 发送邮箱验证邮件

```typescript
sendEmailVerification(): Promise<void>
```

发送邮箱验证邮件。

**示例：**
```typescript
await authService.sendEmailVerification();
```

### 应用验证代码

```typescript
applyActionCode(code: string): Promise<void>
```

应用邮箱验证代码。

**参数：**
- `code`: 验证代码

**示例：**
```typescript
await authService.applyActionCode('123456');
```

## 账户信息更新

### 更新邮箱

```typescript
updateEmail(newEmail: string): Promise<void>
```

更新用户邮箱。

**参数：**
- `newEmail`: 新邮箱地址

**示例：**
```typescript
await authService.updateEmail('new@example.com');
```

### 更新密码

```typescript
updatePassword(newPassword: string): Promise<void>
```

更新用户密码。

**参数：**
- `newPassword`: 新密码

**示例：**
```typescript
await authService.updatePassword('newPassword123');
```

## 错误处理

所有方法都可能抛出以下错误：

- `Error('No user is signed in')`: 当操作需要用户登录但当前没有登录用户时
- `Error('Invalid credentials')`: 当提供的凭据无效时
- `Error('Network error')`: 当发生网络错误时
- `Error('Service unavailable')`: 当认证服务不可用时

**错误处理示例：**
```typescript
try {
  await authService.updateEmail('new@example.com');
} catch (error) {
  if (error.message === 'No user is signed in') {
    console.log('请先登录');
  } else {
    console.error('更新邮箱失败:', error);
  }
}
```

## 认证服务提供商

项目支持三种认证服务提供商：

1. **Better Auth**: 自定义认证服务
2. **Firebase Auth**: Google Firebase 认证服务
3. **Mock Auth**: 用于开发和测试的模拟认证服务

可以通过 `AuthServiceFactory` 切换认证服务提供商：

```typescript
const authFactory = AuthServiceFactory.getInstance();
authFactory.setServiceType('better'); // 或 'firebase' 或 'mock'
const authService = authFactory.getAuthService();
```

## 最佳实践

1. **错误处理**:
   - 始终使用 try-catch 处理认证操作
   - 根据错误类型提供适当的用户反馈
   - 记录关键错误以便调试

2. **状态管理**:
   - 使用 `isAuthenticated()` 检查认证状态
   - 在需要认证的操作前验证用户状态
   - 及时更新 UI 以反映认证状态变化

3. **安全性**:
   - 不要在客户端存储敏感信息
   - 使用 HTTPS 进行所有认证通信
   - 定期更新用户密码

4. **用户体验**:
   - 提供清晰的错误消息
   - 实现适当的加载状态
   - 保持认证流程简单直观 