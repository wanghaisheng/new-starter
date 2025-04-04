# 性能优化指南

本文档提供了应用性能优化的全面指南，涵盖前端（Web和移动端）以及数据库和存储层优化。

## 性能目标

- 应用启动时间 < 2秒
- 页面切换流畅，无明显卡顿
- 图片加载和渲染优化
- 离线数据访问高效率
- 减少不必要的网络请求

## 1. 前端性能优化

### 1.1 组件渲染优化

#### React组件优化

- **使用React.memo**：对纯展示型组件使用`React.memo`避免不必要的重渲染
  ```tsx
  const ProfileCard = React.memo(({ user }: { user: User }) => {
    return (
      <div className="profile-card">
        <img src={user.photo} alt={user.name} />
        <h3>{user.name}</h3>
      </div>
    );
  });
  ```

- **优化useEffect依赖**：确保useEffect依赖数组正确设置，避免无限循环
  ```tsx
  // 不好的做法
  useEffect(() => {
    fetchUserData(userId);
  }); // 每次渲染都会运行

  // 好的做法
  useEffect(() => {
    fetchUserData(userId);
  }, [userId]); // 只在userId变化时运行
  ```

- **使用useMemo和useCallback**：缓存计算结果和函数引用
  ```tsx
  // 缓存计算结果
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // 缓存函数引用
  const handleLike = useCallback(() => {
    likeUser(currentUser.id, profileId);
  }, [currentUser.id, profileId]);
  ```

#### 避免重渲染的技巧

- **使用CSS代替JS动画**：尽可能使用CSS动画而非JS动效
- **虚拟列表**：对长列表使用窗口化或虚拟列表，如`react-window`或`react-virtualized`
  ```tsx
  import { FixedSizeList } from 'react-window';

  const MessageList = ({ messages }) => (
    <FixedSizeList
      height={500}
      width="100%"
      itemSize={50}
      itemCount={messages.length}
      itemData={messages}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <MessageItem message={data[index]} />
        </div>
      )}
    </FixedSizeList>
  );
  ```

### 1.2 资源加载优化

#### 图片优化

- **懒加载图片**：仅在接近视口时加载图片
  ```tsx
  import { useState, useEffect, useRef } from 'react';

  const LazyImage = ({ src, alt }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
      if (!isLoaded) {
        const observer = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
        observer.observe(imgRef.current);
        return () => observer.disconnect();
      }
    }, [isLoaded]);

    return (
      <div ref={imgRef} className="image-container">
        {isLoaded ? <img src={src} alt={alt} /> : <div className="placeholder" />}
      </div>
    );
  };
  ```

- **使用WebP格式**：提供WebP格式的图片，配合回退方案
  ```html
  <picture>
    <source srcset="/images/profile.webp" type="image/webp">
    <img src="/images/profile.jpg" alt="用户头像">
  </picture>
  ```

- **响应式图片**：根据设备尺寸提供不同分辨率图片
  ```html
  <img 
    srcset="/images/photo-small.jpg 500w, /images/photo-large.jpg 1000w" 
    sizes="(max-width: 600px) 500px, 1000px" 
    src="/images/photo-large.jpg" 
    alt="用户照片">
  ```

#### JavaScript优化

- **代码分割**：使用动态导入分割代码
  ```tsx
  // 使用React.lazy进行组件代码分割
  const ProfilePage = React.lazy(() => import('./ProfilePage'));

  function App() {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ProfilePage />
      </Suspense>
    );
  }
  ```

- **Tree Shaking**：确保构建配置支持Tree Shaking
- **依赖优化**：使用`import-cost`等工具评估依赖大小，避免庞大的依赖

### 1.3 网络请求优化

- **请求合并**：使用GraphQL或批处理API减少请求数
- **资源预加载**：在空闲时预加载可能需要的资源
  ```html
  <!-- 当浏览器空闲时预加载 -->
  <link rel="prefetch" href="/messages.js">
  <!-- 当前页面加载完成后立即加载 -->
  <link rel="preload" href="/critical-styles.css" as="style">
  ```

- **数据缓存**：使用SWR、React Query等库缓存API响应
  ```tsx
  import useSWR from 'swr';

  function ProfileComponent({ userId }) {
    const { data, error } = useSWR(`/api/users/${userId}`, fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 60000 // 一分钟内不重复请求
    });

    if (error) return <div>Failed to load</div>;
    if (!data) return <div>Loading...</div>;
    
    return <div>{data.name}</div>;
  }
  ```

### 1.4 移动端特定优化

- **减少动画和透明效果**：过多的动画和透明效果会消耗GPU
- **减少DOM深度**：扁平化DOM结构，减少嵌套层级
- **优化触摸响应**：消除触摸事件的延迟
  ```css
  .button {
    touch-action: manipulation;
  }
  ```

- **渐进式增强**：根据设备能力提供基础功能和高级功能
  ```tsx
  const AdvancedFeature = () => {
    const [isSupported, setIsSupported] = useState(false);
    
    useEffect(() => {
      // 检测设备是否支持高级特性
      const supported = 'IntersectionObserver' in window && 
                        'WebAssembly' in window;
      setIsSupported(supported);
    }, []);
    
    return isSupported ? <FullFeature /> : <BasicFeature />;
  };
  ```

## 2. 数据库和存储优化

### 2.1 IndexedDB优化

- **批量操作**：使用事务和批量操作减少数据库交互
  ```typescript
  const db = await openDatabase();
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  
  // 批量添加用户
  users.forEach(user => {
    store.add(user);
  });
  
  await tx.complete;
  ```

- **索引优化**：为常用查询创建索引
  ```typescript
  // 在数据库模式中添加索引
  userStore.createIndex('email', 'email', { unique: true });
  userStore.createIndex('age', 'age', { unique: false });
  userStore.createIndex('location', 'location', { unique: false });
  
  // 使用索引查询
  const users = await db.users.index('location').getAll('New York');
  ```

- **数据压缩**：对大型数据进行压缩
  ```typescript
  import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

  // 压缩数据后存储
  const compressedData = compressToUTF16(JSON.stringify(largeObject));
  await db.memos.put({ id: 'large-data', data: compressedData });

  // 读取并解压数据
  const compressed = await db.memos.get('large-data');
  const original = JSON.parse(decompressFromUTF16(compressed.data));
  ```

### 2.2 网络请求与同步优化

- **增量同步**：只同步更改过的数据
  ```typescript
  async function synchronizeData() {
    // 获取上次同步的时间戳
    const lastSync = await db.meta.get('lastSyncTimestamp') || 0;
    
    // 获取所有自上次同步后修改的本地数据
    const localChanges = await db.users
      .where('updatedAt')
      .above(lastSync)
      .toArray();
    
    // 获取所有自上次同步后修改的远程数据
    const serverChanges = await api.getChanges(lastSync);
    
    // 处理合并冲突
    const mergedChanges = mergeChanges(localChanges, serverChanges);
    
    // 批量更新本地数据库
    await db.users.bulkPut(mergedChanges);
    
    // 更新同步时间戳
    await db.meta.put(Date.now(), 'lastSyncTimestamp');
  }
  ```

- **离线数据优先策略**：使用离线数据优先显示，然后在后台更新
  ```typescript
  async function fetchUserData(userId) {
    // 先从IndexedDB获取数据
    const cachedUser = await db.users.get(userId);
    
    if (cachedUser) {
      // 立即返回缓存数据
      store.dispatch(setUserData(cachedUser));
    }
    
    try {
      // 在后台从服务器获取最新数据
      const freshUser = await api.getUser(userId);
      
      // 更新本地缓存
      await db.users.put(freshUser);
      
      // 只有当数据有变化时才更新UI
      if (JSON.stringify(freshUser) !== JSON.stringify(cachedUser)) {
        store.dispatch(setUserData(freshUser));
      }
    } catch (error) {
      console.log('Using cached data due to network error');
    }
  }
  ```

- **背景同步**：使用Background Sync API在连接稳定时同步数据
  ```typescript
  // 注册后台同步
  async function registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register('sync-users');
        console.log('Background sync registered');
      } catch (err) {
        console.error('Background sync registration failed:', err);
      }
    }
  }
  
  // 在Service Worker中处理同步
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-users') {
      event.waitUntil(synchronizeUserData());
    }
  });
  ```

### 2.3 缓存策略优化

- **TTL缓存**：为缓存数据设置生存时间
  ```typescript
  async function fetchWithTTL(url, ttlMinutes = 10) {
    const cacheKey = `cache:${url}`;
    const cachedData = await db.cache.get(cacheKey);
    
    const now = Date.now();
    if (cachedData && cachedData.expiry > now) {
      return cachedData.data;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    // 计算过期时间
    const expiry = now + (ttlMinutes * 60 * 1000);
    
    // 存储到缓存中
    await db.cache.put({
      id: cacheKey,
      data,
      expiry
    });
    
    return data;
  }
  ```

- **LRU缓存**：实现最近最少使用缓存策略
  ```typescript
  class LRUCache {
    constructor(capacity) {
      this.capacity = capacity;
      this.cache = new Map();
    }
    
    async get(key) {
      if (!this.cache.has(key)) return null;
      
      // 访问后移动到最新
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    
    async set(key, value) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.capacity) {
        // 删除最旧的项 (Map迭代顺序为插入顺序)
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
      
      this.cache.set(key, value);
    }
  }
  
  // 使用LRU缓存
  const photoCache = new LRUCache(100); // 缓存100张照片
  ```

- **预缓存关键资源**：在Service Worker安装时预缓存关键资源
  ```javascript
  // 在Service Worker中
  const CACHE_NAME = 'app-shell-v1';
  const CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/assets/icons/icon-192x192.png'
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(CACHE_URLS))
    );
  });
  ```

## 3. 性能监控与分析

### 3.1 前端性能监测

- **使用Performance API**：测量关键操作的性能
  ```typescript
  function measureOperation(operationName, operation) {
    performance.mark(`${operationName}-start`);
    
    const result = operation();
    
    performance.mark(`${operationName}-end`);
    performance.measure(
      operationName,
      `${operationName}-start`,
      `${operationName}-end`
    );
    
    const measurements = performance.getEntriesByName(operationName);
    console.log(`${operationName} took ${measurements[0].duration}ms`);
    
    return result;
  }
  
  // 使用
  const sortedData = measureOperation('data-sorting', () => {
    return heavySortOperation(data);
  });
  ```

- **监控首次内容绘制**：追踪页面加载性能
  ```typescript
  function reportLoadMetrics() {
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    
    if (fcp) {
      analytics.sendTiming('FCP', fcp.startTime);
    }
    
    // 计算TTI (Time to Interactive)
    // 这是一个简化实现，实际计算更复杂
    const tti = performance.timing.domInteractive - 
               performance.timing.navigationStart;
    
    analytics.sendTiming('TTI', tti);
  }
  
  // 页面加载完成后调用
  window.addEventListener('load', () => {
    // 使用requestIdleCallback在浏览器空闲时发送指标
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => reportLoadMetrics());
    } else {
      setTimeout(reportLoadMetrics, 1000);
    }
  });
  ```

### 3.2 数据库性能分析

- **操作计时**：测量数据库操作时间
  ```typescript
  async function measureDBOperation(name, operation) {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    console.log(`${name} took ${endTime - startTime}ms`);
    
    // 可选：记录到性能监控系统
    if (endTime - startTime > 200) {
      analytics.reportPerformanceIssue({
        operation: name,
        duration: endTime - startTime
      });
    }
    
    return result;
  }
  
  // 使用
  const users = await measureDBOperation('fetch-all-users', () => 
    db.users.toArray()
  );
  ```

- **定期数据库健康检查**：定期检查数据库大小和性能
  ```typescript
  async function checkDatabaseHealth() {
    const dbSize = await estimateDBSize();
    console.log(`Database size: ${formatBytes(dbSize)}`);
    
    if (dbSize > 50 * 1024 * 1024) { // 50MB
      console.warn('Database size is large, consider cleaning old data');
    }
    
    // 测试查询性能
    const queryTimes = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await db.users.where('age').above(30).count();
      queryTimes.push(performance.now() - start);
    }
    
    const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / 
                        queryTimes.length;
    console.log(`Average query time: ${avgQueryTime}ms`);
    
    if (avgQueryTime > 100) {
      console.warn('Queries are slow, consider optimizing indexes');
    }
  }
  
  // 估算数据库大小
  async function estimateDBSize() {
    // 这是一个简化实现，实际使用可能需要更精确的方法
    let totalSize = 0;
    
    for (const tableName of db.tables.map(t => t.name)) {
      const items = await db.table(tableName).toArray();
      const tableJson = JSON.stringify(items);
      totalSize += tableJson.length * 2; // 近似字符串占用的字节数
    }
    
    return totalSize;
  }
  
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
  ```

## 4. 最佳实践摘要

1. **避免不必要的渲染**：使用React.memo、useMemo和useCallback缓存组件、计算结果和函数引用
2. **优化资源加载**：使用懒加载、代码分割和适当的图片格式
3. **实现高效的数据同步**：使用增量同步和后台同步
4. **优化存储策略**：使用索引、批量操作和适当的缓存策略
5. **持续监控性能**：使用Performance API和自定义指标追踪性能

## 5. 性能基准

以下是应用应该达到的性能基准：

| 指标 | 目标值 | 测量方法 |
|------|-------|---------|
| 首次内容绘制 (FCP) | < 1.8秒 | Performance API |
| 完全交互时间 (TTI) | < 3.8秒 | Performance API |
| 页面加载时间 | < 2秒 | console.time/timeEnd |
| 数据库查询响应时间 | < 100ms | 自定义测量 |
| 动画帧率 | > 50 FPS | requestAnimationFrame计数 |
| 冷启动时间 | < 2.5秒 | Native性能工具 |
| 内存使用 | < 60MB | Chrome开发者工具 |

## 总结

性能优化是一个持续的过程，涉及前端渲染、资源加载、数据存储和网络请求等多个方面。通过本文档中的优化策略，可以显著提升应用响应速度和用户体验，特别是在移动设备和不稳定网络环境下。

记住，优化应该基于实际测量的性能瓶颈，而不是凭直觉进行。使用本文档中的性能监控工具来识别真正的问题点，然后有针对性地进行优化。 