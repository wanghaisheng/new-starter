'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTestResult, useTestNavigation } from '@/core/hooks/useTest';
import { LoadingScreen } from '@/mobile/components/ui/LoadingScreen';
import { ErrorScreen } from '@/mobile/components/ui/ErrorScreen';
import { GlassCard } from '@/mobile/components/ui/GlassCard';

export default function TestResultPage() {
  const params = useParams();
  const testId = params.id as string;
  const { result, loading, error } = useTestResult(testId);
  const { navigateToMatch } = useTestNavigation();

  if (loading) {
    return <LoadingScreen message="加载测试结果..." />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!result) {
    return <ErrorScreen error={new Error('未找到测试结果')} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">测试结果</h1>

      <GlassCard className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">特质分析</h2>
          <div className="space-y-6">
            {result.details.traits.map((trait, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{trait.name}</span>
                  <span className="text-blue-400">{trait.score}分</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2"
                    style={{ width: `${(trait.score / 100) * 100}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2">{trait.description}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">建议</h2>
          <ul className="space-y-2">
            {result.details.suggestions.map((suggestion, index) => (
              <li key={index} className="text-gray-300">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      <div className="flex gap-4">
        <button
          onClick={() => navigateToMatch(testId)}
          className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          开始匹配
        </button>
      </div>
    </div>
  );
} 