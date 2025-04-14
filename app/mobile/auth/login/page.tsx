'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/services/auth/auth-store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/core/components/ui/card';
import { CustomLink } from '@/core/components/ui/link';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 使用统一的API端点登录
      const response = await fetch('/api/mobile/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '登录失败');
      }

      // 设置用户信息和认证令牌
      const { user, token } = data.data;
      setUser(user);
      setToken(token);
      
      router.push('/mobile/discover');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查您的邮箱和密码');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>
            输入您的账号信息以登录
          </CardDescription>
          <div className="mt-2 text-sm text-gray-500">
            演示账号:
            <br />
            邮箱: demo@example.com
            <br />
            密码: password
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">邮箱</label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">密码</label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
            <div className="text-sm text-center">
              <span className="text-gray-500">还没有账号？</span>
              <CustomLink href="/mobile/auth/register">注册</CustomLink>
            </div>
            <div className="text-sm text-center">
              <CustomLink href="/mobile/auth/forgot-password">忘记密码？</CustomLink>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 