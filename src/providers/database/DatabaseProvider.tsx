'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { initializeSchemas } from '@/core/lib/db/schema';
import { schemaRegistry } from '@/core/lib/db/schema';

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function initializeDatabase() {
      try {
        console.log('🔄 开始数据库初始化过程...');
        
        // 最早初始化模式，确保模式在任何数据库操作前完成初始化
        console.log('📝 初始化数据库模式...');
        initializeSchemas();
        
        // 验证模式是否已注册
        const registeredSchemas = schemaRegistry.getAllSchemas();
        console.log(`✅ 已注册模式 (${registeredSchemas.length}):`, 
                   registeredSchemas.map(s => s.name).join(', '));
        
        // 检查是否缺少核心模式
        const coreSchemas = ['users', 'matches', 'messages'];
        const missingCoreSchemas = coreSchemas.filter(
          name => !registeredSchemas.some(s => s.name === name)
        );
        
        if (missingCoreSchemas.length > 0) {
          throw new Error(`缺少核心模式: ${missingCoreSchemas.join(', ')}`);
        }
        
        // 检查环境变量
        console.log('📊 当前环境配置:', {
          dbEnv: process.env.NEXT_PUBLIC_DATABASE_ENV,
          dbName: process.env.NEXT_PUBLIC_DB_NAME,
          dbVersion: process.env.NEXT_PUBLIC_DB_VERSION,
          mockType: process.env.NEXT_PUBLIC_MOCK_DB_TYPE,
          useFakeIndexedDB: process.env.NEXT_PUBLIC_USE_FAKE_INDEXEDDB,
          syncEnabled: process.env.NEXT_PUBLIC_DB_SYNC_ENABLED
        });
        
        console.log('🚀 初始化数据服务...');
        // 初始化数据服务 - 这会触发数据库连接和仓储创建
        await DataServiceFactory.initializeAll();
        
        if (isMounted) {
          console.log('✅ 数据库初始化完成');
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('❌ 数据库初始化失败:', err);
        
        let error = err instanceof Error ? err : new Error('Failed to initialize database');
        let suggestedSolutions = [];
        
        // 检查是否为SyncManager错误，这通常在mock模式下发生
        if (error.message && error.message.includes('networkManager') && 
            error.message.includes('onConnect') && 
            process.env.NEXT_PUBLIC_DATABASE_ENV === 'mock') {
          error = new Error(
            'SyncManager初始化失败。请确保正确配置mock模式。' +
            '在mock模式下，请禁用同步功能。'
          );
          suggestedSolutions.push('在 .env.development 文件中设置 NEXT_PUBLIC_DB_SYNC_ENABLED=false');
        }
        
        // 检查 "One of the specified object stores was not found" 错误
        // 这表明模式注册与数据库中的表不匹配
        if (error.message && (
            error.message.includes('object store') || 
            error.message.includes('object stores was not found') || 
            error.message.includes('NotFoundError') ||
            error.message.includes('missing following tables')
        )) {
          error = new Error(
            '数据库模式错误：找不到所需的对象存储（表）。这可能是因为数据库模式未正确注册，' +
            '或者数据库已存在但缺少必要的表。'
          );
          suggestedSolutions = [
            '删除IndexedDB数据库并重新启动应用',
            '确保所有必要的模式已正确注册',
            '检查环境变量配置是否正确',
            '使用开发人员工具 > 应用程序 > 存储 > IndexedDB 中手动删除数据库',
            '运行 "npm run verify:schema" 命令验证模式注册',
            '重启开发服务器并使用 "npm run dev:mock" 命令'
          ];
        }
        
        // 检查缺少核心模式错误
        if (error.message && error.message.includes('缺少核心模式')) {
          suggestedSolutions = [
            '检查模式定义文件是否存在并正确导出',
            '确保模式注册函数正确执行',
            '尝试清除浏览器缓存并重新启动应用',
            '检查模块导入路径是否正确',
            '运行 "npm run verify:schema" 命令验证模式注册'
          ];
        }
        
        if (isMounted) {
          setError(new Error(`${error.message}\n\n建议解决方案:\n${suggestedSolutions.map(s => `- ${s}`).join('\n')}`));
        }
      }
    }

    // 只在组件首次挂载或明确重试时初始化
    if ((!isInitialized && error === null) || initializationAttempts > 0) {
      initializeDatabase();
    }

    return () => {
      isMounted = false;
    };
  }, [isInitialized, error, initializationAttempts]);

  // 处理重试逻辑
  const handleRetry = () => {
    // 在重试前尝试删除IndexedDB数据库
    if (typeof window !== 'undefined' && window.indexedDB) {
      const dbName = process.env.NEXT_PUBLIC_DB_NAME || 'app_database_mock';
      try {
        console.log(`🗑️ 尝试删除IndexedDB数据库: ${dbName}`);
        const deleteRequest = window.indexedDB.deleteDatabase(dbName);
        deleteRequest.onsuccess = () => {
          console.log(`✅ 成功删除数据库: ${dbName}`);
        };
        deleteRequest.onerror = (event) => {
          console.warn(`⚠️ 删除数据库失败: ${dbName}`, event);
        };
      } catch (e) {
        console.warn('⚠️ 尝试删除数据库时出错:', e);
      }
    }
    
    // 重置状态并尝试重新初始化
    console.log('🔄 准备重新初始化数据库...');
    setError(null);
    setInitializationAttempts(prev => prev + 1);
  };

  // 如果错误，显示错误消息和重试按钮
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-4">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">数据库初始化错误</h2>
          <p className="text-gray-700 mb-4">
            初始化过程中发生错误: {error.message}
          </p>
          
          <div className="mt-4">
            <h3 className="font-semibold">可能的解决方案:</h3>
            <ul className="list-disc ml-5 mt-2 text-sm">
              <li>检查环境变量配置是否正确</li>
              <li>确保在mock模式下已禁用同步功能</li>
              <li>确认数据库模式已正确初始化</li>
              <li>尝试删除浏览器中的IndexedDB数据</li>
              <li>检查浏览器控制台中的详细错误信息</li>
            </ul>
          </div>
          
          <button 
            onClick={handleRetry}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors mt-4"
          >
            清除数据库并重试
          </button>
        </div>
      </div>
    );
  }

  // 如果仍在初始化，显示加载状态
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">数据库初始化中...</p>
          <p className="text-gray-400 text-sm mt-2">请稍候，这可能需要几秒钟...</p>
        </div>
      </div>
    );
  }

  // 初始化完成，渲染子组件
  return <>{children}</>;
} 