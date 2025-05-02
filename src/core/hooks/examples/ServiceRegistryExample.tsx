// core/hooks/examples/ServiceRegistryExample.tsx
// 服务注册表使用示例组件
import React, { useEffect, useState } from 'react';
import { useServiceRegistry } from '../useServiceRegistry';
import { ServiceStatus, ServiceType } from '@/core/services/registry/service-registry';

/**
 * 服务注册表使用示例组件
 * 展示如何使用服务注册表获取服务实例，以及监听服务状态变化
 */
export const ServiceRegistryExample: React.FC = () => {
  const { 
    serviceRegistry, 
    servicesReady, 
    serviceStatuses,
    getAuthService,
    getDataService,
    getClientService
  } = useServiceRegistry();
  
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 当服务就绪时，尝试获取当前用户信息
  useEffect(() => {
    const fetchUserData = async () => {
      if (!servicesReady) return;
      
      try {
        const authService = getAuthService();
        if (!authService) {
          setError('认证服务未初始化');
          return;
        }
        
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError((err as Error).message || '获取用户信息失败');
      }
    };
    
    fetchUserData();
  }, [servicesReady, getAuthService]);
  
  // 渲染服务状态列表
  const renderServiceStatuses = () => {
    const statusItems = [];
    const coreServices = [
      ServiceType.AUTH,
      ServiceType.CLIENT,
      ServiceType.DATA,
      ServiceType.CONFIG,
      ServiceType.LOGGER
    ];
    
    for (const type of coreServices) {
      const status = serviceStatuses.get(type) || ServiceStatus.NOT_INITIALIZED;
      let statusColor = '';
      
      switch (status) {
        case ServiceStatus.INITIALIZED:
          statusColor = 'green';
          break;
        case ServiceStatus.INITIALIZING:
          statusColor = 'orange';
          break;
        case ServiceStatus.FAILED:
          statusColor = 'red';
          break;
        default:
          statusColor = 'gray';
      }
      
      statusItems.push(
        <div key={type} style={{ marginBottom: '8px' }}>
          <span>{type}: </span>
          <span style={{ color: statusColor }}>{status}</span>
        </div>
      );
    }
    
    return statusItems;
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>服务注册表示例</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>核心服务状态</h3>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #eee', 
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }}>
          {renderServiceStatuses()}
        </div>
        <div style={{ marginTop: '10px' }}>
          <strong>服务就绪状态: </strong>
          <span style={{ color: servicesReady ? 'green' : 'orange' }}>
            {servicesReady ? '已就绪' : '初始化中'}
          </span>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>用户信息</h3>
        {error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : user ? (
          <div>
            <p><strong>用户ID:</strong> {user.id}</p>
            <p><strong>用户名:</strong> {user.username}</p>
            <p><strong>邮箱:</strong> {user.email}</p>
          </div>
        ) : (
          <div>加载用户信息中...</div>
        )}
      </div>
      
      <div>
        <h3>使用说明</h3>
        <p>
          本示例展示了如何使用服务注册表获取服务实例，以及监听服务状态变化。
          在实际应用中，您可以使用 <code>useServiceRegistry</code> 钩子获取任何已注册的服务。
        </p>
        <p>
          也可以使用 <code>useService</code> 上下文钩子直接获取服务实例，无需关心服务初始化状态。
        </p>
      </div>
    </div>
  );
};

export default ServiceRegistryExample;