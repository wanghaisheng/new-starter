'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/services/auth/auth-service';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/core/components/ui/card';
import { CustomLink } from '@/core/components/ui/link';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // TODO: 实现实际的登录逻辑
      setUser({
        id: '1',
        email: email,
        emailVerified: false,
        phoneVerified: false,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        provider: 'email',
        displayName: 'Test User',
        photoURL: undefined,
        phoneNumber: undefined
      });
      router.push('/');
    } catch (err) {
      setError('登录失败，请检查您的邮箱和密码');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>输入您的账号信息以登录</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              登录
            </Button>
            <p className="text-center text-sm text-gray-600">
              还没有账号？{' '}
              <CustomLink href="/mobile/auth/register">立即注册</CustomLink>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 