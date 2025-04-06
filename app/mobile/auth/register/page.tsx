'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/core/services/auth-service';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card } from '@/core/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      // TODO: 实现实际的注册逻辑
      setUser({
        id: '1',
        name: name,
        email: email,
        birthDate: new Date('1990-01-01'),
        gender: 'other',
        photos: [],
        interests: [],
        location: {
          latitude: 0,
          longitude: 0,
          city: '',
          country: ''
        },
        preferences: {
          ageRange: { min: 18, max: 100 },
          distance: 50,
          gender: ['male', 'female', 'other'],
          interests: []
        },
        privacySettings: {
          showProfileToEveryone: true,
          showOnlineStatus: true,
          showLastActive: true,
          showInDiscovery: true,
          showDistance: true,
          allowDataCollection: true,
          allowPersonalizedAds: true,
          showEmailToMatches: true,
          showPhoneToMatches: true,
          allowProfileSharing: true
        },
        notificationSettings: {
          newMatches: true,
          matchMessages: true,
          profileViews: true,
          profileLikes: true,
          appUpdates: true,
          promotions: false
        },
        isVerified: false,
        lastActive: new Date(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      router.push('/');
    } catch (err) {
      setError('注册失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">注册</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
          <Button type="submit" className="w-full">
            注册
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/mobile/auth/login" className="text-sm text-blue-600 hover:text-blue-500">
            已有账号？立即登录
          </Link>
        </div>
      </Card>
    </div>
  );
} 