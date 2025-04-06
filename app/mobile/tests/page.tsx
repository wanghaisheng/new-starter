'use client';

import { useEffect, useState } from 'react';
import { TestService } from '@/core/services/test-service';
import { TestType } from '@/core/lib/db/types';
import { TestTypeCard } from '@/mobile/components/tests/TestTypeCard';
import { useTestNavigation } from '@/core/hooks/useTest';
import { LoadingScreen } from '@/mobile/components/ui/LoadingScreen';
import { ErrorScreen } from '@/mobile/components/ui/ErrorScreen';

export default function TestsPage() {
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { navigateToTest } = useTestNavigation();

  useEffect(() => {
    async function loadTestTypes() {
      try {
        const service = TestService.getInstance();
        const types = await service.getTestTypes();
        setTestTypes(types);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load test types'));
      } finally {
        setLoading(false);
      }
    }

    loadTestTypes();
  }, []);

  if (loading) {
    return <LoadingScreen message="加载测试类型..." />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">选择测试类型</h1>
      <p className="text-gray-600 mb-8">
        完成任意一项测试即可开始匹配。您也可以完成更多测试来开启不同的匹配模式。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testTypes.map((test) => (
          <TestTypeCard
            key={test.id}
            test={test}
            isSelected={false}
            onSelect={() => navigateToTest(test.id)}
          />
        ))}
      </div>
    </div>
  );
} 