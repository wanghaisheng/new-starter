'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/hooks/useAuth';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card } from '@/core/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return;
    }

    try {
      // 实际注册逻辑应调用后端 API，这里仅演示
      // 注册成功后自动登录
      await login('email', { email, password, name });
      window.location.replace('/mobile/discover');
    } catch (err) {
      setLocalError('注册失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6"{t('auto.page.')}/h1>
        {(localError || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {localError || error?.message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              姓名
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>
        <div className="text-sm text-center mt-4">
          <span className="text-gray-500"{t('auto.page.')}/span>
          <Link href="/mobile/auth/login" className="ml-2 text-blue-500"{t('auto.page.')}/Link>
        </div>
      </Card>
    </div>
  );
}