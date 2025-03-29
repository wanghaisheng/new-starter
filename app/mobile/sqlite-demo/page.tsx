'use client';

import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonItemDivider,
  IonSpinner,
  IonToast,
  IonIcon,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSkeletonText,
} from '@ionic/react';
import { add, sync, trash, create } from 'ionicons/icons';
import { CapacitorSQLiteClient } from '@/core/lib/db/clients/capacitor-sqlite/capacitor-sqlite-client';
import { DatabaseConfig } from '@/core/lib/db/interfaces';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const SQLiteDemo: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dbClient, setDbClient] = useState<CapacitorSQLiteClient | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInfiniteScrollDisabled, setIsInfiniteScrollDisabled] = useState(false);
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    initializeDatabase();
    return () => {
      if (dbClient) {
        dbClient.close();
      }
    };
  }, []);

  const initializeDatabase = async () => {
    try {
      // 创建数据库配置
      const config: DatabaseConfig = {
        engine: 'sqlite',
        name: 'user_db',
        version: 1,
      };

      // 初始化数据库客户端
      const client = new CapacitorSQLiteClient(config);
      await client.initialize();
      setDbClient(client);

      // 加载用户数据
      await loadUsers(client);
    } catch (error) {
      console.error('数据库初始化失败:', error);
      showMessage(`数据库初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (client: CapacitorSQLiteClient, pageNum: number = 1) => {
    try {
      const limit = 10;
      const offset = (pageNum - 1) * limit;
      
      const result = await client.query<User>('users', {
        orderBy: ['-createdAt'],
        limit,
        offset,
      });

      if (pageNum === 1) {
        setUsers(result);
      } else {
        setUsers(prev => [...prev, ...result]);
      }

      setIsInfiniteScrollDisabled(result.length < limit);
      setPage(pageNum);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      showMessage(`加载用户数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleAddUser = async () => {
    if (!dbClient || !newUser.name || !newUser.email) return;

    try {
      const user: User = {
        id: crypto.randomUUID(),
        name: newUser.name,
        email: newUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbClient.saveEntity('users', user);
      setNewUser({ name: '', email: '' });
      await loadUsers(dbClient);
      showMessage('用户添加成功');
    } catch (error) {
      console.error('添加用户失败:', error);
      showMessage(`添加用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!dbClient || !editingUser) return;

    try {
      await dbClient.updateEntity('users', editingUser);
      setEditingUser(null);
      await loadUsers(dbClient);
      showMessage('用户更新成功');
    } catch (error) {
      console.error('更新用户失败:', error);
      showMessage(`更新用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!dbClient) return;

    try {
      await dbClient.deleteEntity('users', id);
      await loadUsers(dbClient);
      showMessage('用户删除成功');
    } catch (error) {
      console.error('删除用户失败:', error);
      showMessage(`删除用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    setIsRefreshing(true);
    try {
      await loadUsers(dbClient!);
    } finally {
      setIsRefreshing(false);
      event.detail.complete();
    }
  };

  const handleInfiniteScroll = async (event: CustomEvent) => {
    try {
      await loadUsers(dbClient!, page + 1);
    } finally {
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }
  };

  const showMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>离线用户管理</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonItemDivider>
          <IonLabel>{editingUser ? '编辑用户' : '添加新用户'}</IonLabel>
        </IonItemDivider>
        
        <IonItem>
          <IonLabel position="floating">姓名</IonLabel>
          <IonInput
            value={editingUser ? editingUser.name : newUser.name}
            onIonChange={e => {
              if (editingUser) {
                setEditingUser({ ...editingUser, name: e.detail.value || '' });
              } else {
                setNewUser({ ...newUser, name: e.detail.value || '' });
              }
            }}
          />
        </IonItem>
        
        <IonItem>
          <IonLabel position="floating">邮箱</IonLabel>
          <IonInput
            value={editingUser ? editingUser.email : newUser.email}
            onIonChange={e => {
              if (editingUser) {
                setEditingUser({ ...editingUser, email: e.detail.value || '' });
              } else {
                setNewUser({ ...newUser, email: e.detail.value || '' });
              }
            }}
          />
        </IonItem>

        <IonButton 
          expand="block" 
          onClick={editingUser ? handleUpdateUser : handleAddUser} 
          className="ion-margin-top"
        >
          {editingUser ? '更新用户' : '添加用户'}
        </IonButton>

        {editingUser && (
          <IonButton 
            expand="block" 
            color="medium" 
            onClick={() => setEditingUser(null)} 
            className="ion-margin-top"
          >
            取消编辑
          </IonButton>
        )}

        <IonItemDivider>
          <IonLabel>用户列表</IonLabel>
        </IonItemDivider>

        <IonList>
          {users.map(user => (
            <IonItem key={user.id}>
              <IonLabel>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <p>创建时间: {new Date(user.createdAt).toLocaleString()}</p>
                <p>更新时间: {new Date(user.updatedAt).toLocaleString()}</p>
              </IonLabel>
              <IonButton
                slot="end"
                color="primary"
                onClick={() => setEditingUser(user)}
              >
                <IonIcon slot="icon-only" icon={create} />
              </IonButton>
              <IonButton
                slot="end"
                color="danger"
                onClick={() => handleDeleteUser(user.id)}
              >
                <IonIcon slot="icon-only" icon={trash} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={isInfiniteScrollDisabled}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="加载更多用户..."
          />
        </IonInfiniteScroll>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default SQLiteDemo;