import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonSelect, IonSelectOption, IonSpinner } from '@ionic/react';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('DemoDataLoader');

interface DemoDataStats {
  users: number;
  matches: number;
  messages: number;
}

/**
 * 演示数据加载器组件
 * 
 * 用于从前端加载演示数据到Mock数据库
 */
const DemoDataLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'example' | 'dating'>('example');
  const [stats, setStats] = useState<DemoDataStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const loadDemoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info(`开始加载${source}演示数据...`);
      
      const response = await fetch(`/api/mobile/v1/demo/load?source=${source}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '加载演示数据失败');
      }
      
      setStats(data.stats);
      logger.info(`✅ ${source}演示数据加载完成`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      logger.error('加载演示数据失败', { error: err });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>演示数据加载器</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem>
          <IonLabel>数据源</IonLabel>
          <IonSelect 
            value={source} 
            onIonChange={e => setSource(e.detail.value)}
            disabled={loading}
          >
            <IonSelectOption value="example">示例数据</IonSelectOption>
            <IonSelectOption value="dating">约会应用数据</IonSelectOption>
          </IonSelect>
        </IonItem>
        
        <div className="mt-4 flex justify-center">
          <IonButton 
            onClick={loadDemoData} 
            disabled={loading}
            color="primary"
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" className="mr-2" />
                加载中...
              </>
            ) : (
              '加载演示数据'
            )}
          </IonButton>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <p className="font-bold">错误</p>
            <p>{error}</p>
          </div>
        )}
        
        {stats && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
            <p className="font-bold">加载成功</p>
            <p>用户: {stats.users}个</p>
            <p>匹配: {stats.matches}个</p>
            <p>消息: {stats.messages}个</p>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default DemoDataLoader; 