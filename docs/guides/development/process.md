# 开发流程指南

> 版本兼容性：本文档必须与[guideline.md](../guideline.md) v1.1+ 保持同步  
> 最后同步时间：2025-03-28


本文档整合了项目开发过程中的各种流程和规范，为团队成员提供统一的开发指导。

## 0. 项目初始化检查

在首次克隆项目或未确认项目初始化状态时，请运行环境检查脚本：

```bash
bash docs/tasks/tools/check-environment.sh
```

如果检查发现问题，请按照脚本输出的建议进行修复。详细的初始化指南请参考 [项目初始化指南](./project-initialization-guide.md)。

脚本会在环境检查通过后创建初始化完成标记（`.env.local` 文件中的 `NEXT_PUBLIC_ENV_INITIALIZED=true`），后续开发无需再次运行环境检查。

如果需要强制重新检查环境，可以使用 `--force` 参数：

```bash
bash docs/tasks/tools/check-environment.sh --force
```

## 1. 项目初始化检查

### 1.1 环境检查
```bash
# 检查Node.js版本
node -v  # 需要v16+

# 检查包管理器
npm -v   # 或
yarn -v

# 检查Git
git --version
```

### 1.2 项目设置
```bash
# 克隆项目
git clone https://github.com/your-org/heytcm.git
cd heytcm/new-starter

# 安装依赖
npm install
# 或
yarn install

# 运行开发服务器
npm run dev
# 或
yarn dev
```

## 2. 功能开发流程

### 2.1 需求分析
1. 理解需求文档
2. 确定功能范围
3. 识别技术依赖
4. 评估开发周期

### 2.2 任务拆分
1. 将功能拆分为小任务
2. 设定任务优先级
3. 估算任务时间
4. 创建任务计划

### 2.3 API开发流程

#### 2.3.1 API设计
1. **定义接口规范**
   ```typescript
   // src/core/api/interfaces/test-api.ts
   export interface ITestAPI {
     getTestTypes(): Promise<TestType[]>;
     getTestById(id: string): Promise<Test | null>;
     createTest(data: CreateTestDTO): Promise<Test>;
     updateTest(id: string, data: UpdateTestDTO): Promise<Test>;
     deleteTest(id: string): Promise<void>;
   }
   ```

2. **创建环境实现**
   ```typescript
   // src/core/api/implementations/mock/mock-test-api.ts
   export class MockTestAPI implements ITestAPI {
     private mockData: Map<string, any>;

     constructor() {
       this.mockData = new Map();
     }

     async getTestTypes(): Promise<TestType[]> {
       return [
         { id: '1', name: '性格测试', type: 'personality' },
         { id: '2', name: '技能测试', type: 'skill' }
       ];
     }
     // ... 其他方法实现
   }

   // src/core/api/implementations/local/local-test-api.ts
   export class LocalTestAPI implements ITestAPI {
     private databaseClient: IDatabaseClient;

     constructor(client: IDatabaseClient) {
       this.databaseClient = client;
     }

     async getTestTypes(): Promise<TestType[]> {
       return this.databaseClient.query<TestType>({
         collection: 'test_types',
         where: { status: 'active' }
       });
     }
     // ... 其他方法实现
   }
   ```

3. **API工厂**
   ```typescript
   // src/core/api/factories/api-factory.ts
   export class APIFactory {
     private static instance: APIFactory;
     private apis: Map<string, any>;

     private constructor() {
       this.apis = new Map();
     }

     static getInstance(): APIFactory {
       if (!APIFactory.instance) {
         APIFactory.instance = new APIFactory();
       }
       return APIFactory.instance;
     }

     getTestAPI(): ITestAPI {
       const key = 'test';
       if (!this.apis.has(key)) {
         const env = process.env.NEXT_PUBLIC_API_ENV || 'mock';
         switch (env) {
           case 'mock':
             this.apis.set(key, new MockTestAPI());
             break;
           case 'local':
             this.apis.set(key, new LocalTestAPI(
               DatabaseFactory.getInstance().getClient()
             ));
             break;
           default:
             throw new Error(`不支持的API环境: ${env}`);
         }
       }
       return this.apis.get(key);
     }
   }
   ```

4. **路由实现**
   ```typescript
   // app/api/v1/tests/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { withAuth } from '@/app/api/_lib/middleware/auth';
   import { validateRequest } from '@/app/api/_lib/utils/validation';
   import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
   import { TestService } from '@/core/services/test-service';
   import { testSchema } from '@/core/schemas/test';

   export async function GET(req: NextRequest) {
     return withAuth(req, async () => {
       try {
         const testService = TestService.getInstance();
         const types = await testService.getTestTypes();
         return NextResponse.json(APIResponseBuilder.success(types));
       } catch (error) {
         return APIResponseBuilder.error(error);
       }
     });
   }

   export async function POST(req: NextRequest) {
     return withAuth(req, async () => {
       const validation = await validateRequest(req, testSchema);
       if (!validation.success) {
         return validation.response;
       }

       try {
         const testService = TestService.getInstance();
         const result = await testService.createTest(validation.data);
         return NextResponse.json(
           APIResponseBuilder.success(result),
           { status: 201 }
         );
       } catch (error) {
         return APIResponseBuilder.error(error);
       }
     });
   }
   ```

5. **服务层集成**
   ```typescript
   // src/core/services/test-service.ts
   export class TestService {
     private static instance: TestService;
     private api: ITestAPI;

     private constructor() {
       this.api = APIFactory.getInstance().getTestAPI();
     }

     static getInstance(): TestService {
       if (!TestService.instance) {
         TestService.instance = new TestService();
       }
       return TestService.instance;
     }

     async getTestTypes(): Promise<TestType[]> {
       try {
         return await this.api.getTestTypes();
       } catch (error) {
         logger.error('获取测试类型失败', { error });
         throw new ServiceError('获取测试类型失败', error);
       }
     }
   }
   ```

6. **组件使用**
   ```typescript
   // app/components/TestTypeSelector.tsx
   'use client';

   import { useEffect, useState } from 'react';
   import { TestService } from '@/core/services/test-service';

   export function TestTypeSelector() {
     const [types, setTypes] = useState<TestType[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string>();

     useEffect(() => {
       async function loadTypes() {
         try {
           const testService = TestService.getInstance();
           const types = await testService.getTestTypes();
           setTypes(types);
         } catch (error) {
           setError(error.message);
         } finally {
           setLoading(false);
         }
       }
       loadTypes();
     }, []);

     if (loading) return <div>加载中...</div>;
     if (error) return <div>错误: {error}</div>;

     return (
       <select>
         {types.map(type => (
           <option key={type.id} value={type.id}>
             {type.name}
           </option>
         ))}
       </select>
     );
   }
   ```

### 2.4 数据库开发流程

#### 2.4.1 Mock数据阶段
1. 创建模拟数据服务
2. 实现基本CRUD操作
3. 添加延迟模拟网络请求
4. 实现错误处理

#### 2.4.2 本地数据库阶段
1. 设计数据库模式
2. 创建迁移文件
3. 实现数据访问层
4. 添加数据验证

#### 2.4.3 生产环境阶段
1. 配置生产数据库
2. 实现数据同步
3. 添加性能优化
4. 实现备份策略

## 3. 版本控制

### 3.1 分支管理
   ```bash
# 创建功能分支
git checkout -b feature/test-api

# 提交代码
git add .
git commit -m "feat: 添加测试API实现"

# 推送分支
git push origin feature/test-api
```

### 3.2 代码审查
1. 创建Pull Request
2. 进行代码审查
3. 处理反馈意见
4. 合并代码

## 4. 自动化脚本

### 4.1 开发脚本
```bash
# 生成API模板
./scripts/generate-api.sh test

# 运行测试
npm run test
npm run test:e2e

# 构建项目
npm run build
```

### 4.2 部署脚本
```bash
# 准备发布
./scripts/prepare-release.sh v1.0.0

# 执行发布
./scripts/release.sh v1.0.0
```

## 5. 文档维护

### 5.1 API文档
1. 更新API接口文档
2. 添加示例代码
3. 更新错误码说明
4. 更新变更日志

### 5.2 开发文档
1. 更新开发指南
2. 添加故障排除说明
3. 更新部署文档
4. 更新贡献指南

## 6. 质量保证

### 6.1 代码质量
1. 遵循编码规范
2. 进行代码审查
3. 运行自动化测试
4. 执行性能测试

### 6.2 测试覆盖
1. 单元测试
2. 集成测试
3. 端到端测试
4. 性能测试

## 7. 发布流程

### 7.1 准备工作
1. 更新版本号
2. 生成变更日志
3. 打包构建
4. 执行测试

### 7.2 发布步骤
1. 合并到主分支
2. 创建发布标签
3. 部署到生产
4. 监控系统状态

## 8. 维护支持

### 8.1 问题跟踪
1. 收集问题报告
2. 分析问题原因
3. 制定解决方案
4. 验证修复效果

### 8.2 性能优化
1. 监控系统性能
2. 识别瓶颈
3. 实施优化
4. 验证效果

## 9. 代码规范

所有开发工作必须遵循[编码规范与最佳实践](./templates/coding-standards.md)文档中的规则，确保代码质量和一致性。主要包括：

- 文件和目录命名规范
- TypeScript类型定义规范
- React/Next.js组件开发规范
- 移动端开发规范
- 国际化规范
- 测试规范
- 性能优化规范
- 安全规范

## 10. 目录结构

项目遵循以下目录结构，开发新功能时应按照此结构组织代码：

```
nextjs15-tailwind-ionic-capacitor-starter/
├── app/                      # Next.js App Router
│   ├── mobile/             # 移动端专属路由
│   ├── (web)/                # Web专属路由
│   └── api/                  # API路由
├── src/
│   ├── assets/               # 静态资源
│   │   ├── locales/          # 国际化资源文件
│   │   └── images/           # 图片资源
│   ├── core/                 # 跨平台核心
│   │   ├── components/       # 共享UI组件
│   │   ├── hooks/            # 共享Hooks
│   │   ├── lib/              # 核心库
│   │   │   ├── db/           # 数据库访问层
│   │   │   ├── i18n/         # 国际化核心
│   │   │   └── api/          # API客户端
│   │   ├── models/           # 数据模型
│   │   ├── services/         # 核心服务
│   │   ├── config/           # 核心配置
│   │   └── test/             # 核心测试
│   ├── mobile/               # 移动端特定
│   │   ├── components/       # 原生增强组件
│   │   ├── plugins/          # Capacitor插件封装
│   │   └── utils/            # 移动端工具
│   ├── web/                  # Web特定
│   ├── providers/            # 全局Providers
│   ├── styles/               # 全局样式
│   └── utils/                # 通用工具
├── tools/                    # 开发工具脚本
│   ├── screenshot_utils.py   # 截图工具
│   ├── get_browser.py        # 浏览器自动化
│   ├── web_scraper.py        # 网页抓取
│   ├── search_engine.py      # 搜索引擎
│   └── llm_api.py           # LLM API集成
├── capacitor/                # 原生项目
│   ├── android/              # Android平台
│   └── ios/                  # iOS平台
├── scripts/                  # 构建/部署脚本
├── docs/                     # 项目文档
│   ├── tasks/                # 任务计划和自动化脚本
│   │   ├── *.md              # 任务计划文档
│   │   └── *.sh              # 自动化脚本
│   └── templates/            # 文档模板
├── public/                   # 公共资源
└── test/                     # 测试代码
```

## 11. 开发工作流程检查清单

### 11.1 功能开发前

- [ ] 创建功能任务计划文档
- [ ] 完成任务拆解
- [ ] 确定技术方案
- [ ] 评估开发周期

### 11.2 开发过程中

- [ ] 遵循编码规范
- [ ] 定期更新任务进度
- [ ] 记录遇到的问题
- [ ] 编写单元测试

### 11.3 数据库开发

- [ ] 创建Mock数据
- [ ] 设计本地数据库结构
- [ ] 设计生产环境数据库结构
- [ ] 实现数据同步策略（如需要）

### 11.4 开发完成后

- [ ] 完成所有单元测试
- [ ] 更新相关文档
- [ ] 进行代码审查
- [ ] 准备发布计划

## 12. 文档更新规范

项目文档应保持最新，确保反映当前项目状态：

1. 功能开发完成后，更新相关文档
2. 修改API或数据结构时，更新对应文档
3. 发现文档错误时，及时修正
4. 定期审查文档，确保内容准确性

temp_mobile_standards.md
## 13. 移动端开发规范

### 13.1 路由结构
- 所有移动端路由必须放在`app/mobile`目录下
- 共享组件放在`src/core/components/`
- 移动端专属组件放在`src/mobile/components/`

### 13.2 插件封装
- 每个Capacitor插件应有对应的服务封装类
- 必须实现Web环境降级方案
## 13. UI素材管理流程

在开发过程中，当UI设计稿中包含图标、图片等素材，但这些素材尚未最终确定或提供时，应遵循以下流程：

### 13.1 素材需求记录

1. 在`docs/assets/assets-inventory.csv`文件中记录所有素材需求：
   - 为每个素材分配唯一文件名
   - 指定素材类型、尺寸、格式等信息
   - 添加用于生成素材的Midjourney提示词

2. 素材分类与优先级：
   - 按功能重要性划分优先级（P0/P1/P2）
   - 按类型分类：图标、插图、照片、动画

### 13.2 临时SVG替代方案

当设计素材尚未提供时：

1. 创建临时SVG文件：
   - 使用简单几何形状表示图标/图片功能
   - 存放在`src/assets/images/temp/`目录
   - 文件名添加`-temp`后缀

2. 在代码中使用临时SVG：
   - 通过React组件封装使用
   - 添加注释标明这是临时素材

### 13.3 素材更新流程

1. 使用CSV文件中的提示词通过Midjourney生成真实素材
2. 处理生成的素材（调整尺寸、格式转换等）
3. 替换临时SVG，更新代码引用
4. 更新CSV文件中的素材状态为"final"

详细指南请参考[UI素材管理指南](./templates/ui-assets-management.md)文档。

## 14. 常见问题与解决方案

本节将收集开发过程中遇到的常见问题及其解决方案，作为团队知识库：

| 问题类别 | 问题描述 | 解决方案 |
|---------|---------|----------|
| 环境配置 | 待添加 | 待添加 |
| 数据库 | Firebase初始化错误 | 1. 检查环境变量配置<br>2. 确保服务实现了优雅降级策略<br>3. 参考[数据库初始化与降级策略](./lessons/database/firebase-initialization-fallback.md) |
| 数据库 | 环境切换后数据丢失 | 1. 使用`--env-file`参数指定正确的环境文件<br>2. 确保数据同步服务正常工作<br>3. 检查数据库连接配置 |
| 移动端 | 待添加 | 待添加 |
| 国际化 | 待添加 | 待添加 |
| UI素材 | SVG在不同平台显示不一致 | 使用基本SVG元素，避免高级特性，确保viewBox设置正确 |

## 15. 常用插件集成与使用指南

本节提供了项目中常用的Capacitor插件集成和使用指南，帮助开发者快速实现移动端原生功能。

### 15.1 蓝牙LE插件

#### 15.1.1 安装与配置

1. **安装插件**：
   ```bash
   bun install @capacitor-community/bluetooth-le
   npx cap sync
   ```

2. **平台配置**：

   **Android (AndroidManifest.xml)**：
   ```xml
   <!-- 添加权限 -->
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" android:maxSdkVersion="30" />
   ```

   **iOS (Info.plist)**：
   ```xml
   <!-- 添加权限描述 -->
   <key>NSBluetoothAlwaysUsageDescription</key>
   <string>需要使用蓝牙来连接设备</string>
   <key>NSBluetoothPeripheralUsageDescription</key>
   <string>需要使用蓝牙来连接设备</string>
   ```

#### 15.1.2 使用示例

1. **创建蓝牙服务封装**：
   ```typescript
   // src/mobile/plugins/bluetooth/bluetooth-service.ts
   import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
   import { isPlatform } from '@ionic/react';

   export class BluetoothService {
     private static instance: BluetoothService;
     private initialized = false;

     private constructor() {}

     public static getInstance(): BluetoothService {
       if (!BluetoothService.instance) {
         BluetoothService.instance = new BluetoothService();
       }
       return BluetoothService.instance;
     }

     async initialize(): Promise<void> {
       if (this.initialized || !isPlatform('capacitor')) return;
       
       try {
         await BleClient.initialize();
         this.initialized = true;
       } catch (error) {
         console.error('蓝牙初始化失败:', error);
         throw error;
       }
     }

     async scanForDevices(serviceUUIDs?: string[]): Promise<BleDevice[]> {
       await this.initialize();
       const devices: BleDevice[] = [];
       
       await BleClient.requestLEScan(
         { services: serviceUUIDs },
         (result) => {
           const deviceIndex = devices.findIndex(d => d.deviceId === result.device.deviceId);
           if (deviceIndex < 0) {
             devices.push(result.device);
           }
         }
       );
       
       // 扫描5秒后停止
       setTimeout(async () => {
         await BleClient.stopLEScan();
       }, 5000);
       
       return devices;
     }

     async connect(deviceId: string): Promise<void> {
       await this.initialize();
       await BleClient.connect(deviceId);
     }

     async disconnect(deviceId: string): Promise<void> {
       await BleClient.disconnect(deviceId);
     }

     async read(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<DataView> {
       return await BleClient.read(deviceId, serviceUUID, characteristicUUID);
     }

     async write(deviceId: string, serviceUUID: string, characteristicUUID: string, data: DataView): Promise<void> {
       await BleClient.write(deviceId, serviceUUID, characteristicUUID, data);
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import React, { useState, useEffect } from 'react';
   import { BluetoothService } from '@/mobile/plugins/bluetooth/bluetooth-service';
   import { BleDevice } from '@capacitor-community/bluetooth-le';
   import { isPlatform, IonButton, IonList, IonItem, IonLabel } from '@ionic/react';

   const BluetoothDemo: React.FC = () => {
     const [devices, setDevices] = useState<BleDevice[]>([]);
     const [scanning, setScanning] = useState(false);
     const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
     
     const bluetoothService = BluetoothService.getInstance();
     
     const startScan = async () => {
       if (!isPlatform('capacitor')) {
         console.log('蓝牙功能仅在原生应用中可用');
         return;
       }
       
       try {
         setScanning(true);
         setDevices([]);
         const foundDevices = await bluetoothService.scanForDevices();
         setDevices(foundDevices);
       } catch (error) {
         console.error('扫描设备失败:', error);
       } finally {
         setScanning(false);
       }
     };
     
     const connectToDevice = async (deviceId: string) => {
       try {
         await bluetoothService.connect(deviceId);
         setConnectedDevice(deviceId);
       } catch (error) {
         console.error('连接设备失败:', error);
       }
     };
     
     const disconnectDevice = async () => {
       if (connectedDevice) {
         try {
           await bluetoothService.disconnect(connectedDevice);
           setConnectedDevice(null);
         } catch (error) {
           console.error('断开连接失败:', error);
         }
       }
     };
     
     return (
       <div>
         <IonButton onClick={startScan} disabled={scanning}>
           {scanning ? '扫描中...' : '扫描设备'}
         </IonButton>
         
         <IonList>
           {devices.map((device) => (
             <IonItem key={device.deviceId} onClick={() => connectToDevice(device.deviceId)}>
               <IonLabel>
                 <h2>{device.name || '未命名设备'}</h2>
                 <p>{device.deviceId}</p>
               </IonLabel>
             </IonItem>
           ))}
         </IonList>
         
         {connectedDevice && (
           <IonButton onClick={disconnectDevice}>断开连接</IonButton>
         )}
       </div>
     );
   };

   export default BluetoothDemo;
   ```

### 15.2 SQLite插件

#### 15.2.1 安装与配置

1. **安装插件**：
   ```bash
   bun install @capacitor-community/sqlite
   npx cap sync
   ```

2. **Web平台支持**：
   ```bash
   bun install jeep-sqlite sql.js
   ```
   
   并在`public`目录下创建`sql-wasm.wasm`文件。

#### 15.2.2 使用示例

1. **创建SQLite服务封装**：
   ```typescript
   // src/mobile/plugins/sqlite/sqlite-service.ts
   import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
   import { isPlatform } from '@ionic/react';

   export class SQLiteService {
     private static instance: SQLiteService;
     private sqlite: SQLiteConnection;
     private db: SQLiteDBConnection | null = null;
     private dbName = 'app_database';
     private initialized = false;

     private constructor() {
       this.sqlite = new SQLiteConnection(CapacitorSQLite);
     }

     public static getInstance(): SQLiteService {
       if (!SQLiteService.instance) {
         SQLiteService.instance = new SQLiteService();
       }
       return SQLiteService.instance;
     }

     async initialize(): Promise<void> {
       if (this.initialized) return;
       
       if (isPlatform('web')) {
         // Web平台初始化
         await this.sqlite.initWebStore();
       }
       
       const ret = await this.sqlite.checkConnectionsConsistency();
       const isConn = await this.sqlite.isConnection(this.dbName);
       
       if (ret.result && isConn.result) {
         this.db = await this.sqlite.retrieveConnection(this.dbName);
       } else {
         this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1);
       }
       
       await this.db.open();
       this.initialized = true;
     }

     async executeQuery(query: string, params: any[] = []): Promise<any> {
       if (!this.initialized) await this.initialize();
       if (!this.db) throw new Error('数据库未初始化');
       
       return await this.db.query(query, params);
     }

     async executeSet(set: { statement: string; values: any[] }[]): Promise<any> {
       if (!this.initialized) await this.initialize();
       if (!this.db) throw new Error('数据库未初始化');
       
       return await this.db.executeSet(set);
     }

     async createTable(tableName: string, columns: string[]): Promise<void> {
       const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`;
       await this.executeQuery(query);
     }

     async close(): Promise<void> {
       if (this.db) {
         await this.sqlite.closeConnection(this.dbName);
         this.db = null;
         this.initialized = false;
       }
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import React, { useEffect, useState } from 'react';
   import { SQLiteService } from '@/mobile/plugins/sqlite/sqlite-service';
   import { IonButton, IonInput, IonItem, IonLabel, IonList } from '@ionic/react';

   interface Todo {
     id: number;
     task: string;
     completed: boolean;
   }

   const SQLiteDemo: React.FC = () => {
     const [todos, setTodos] = useState<Todo[]>([]);
     const [newTask, setNewTask] = useState('');
     const sqliteService = SQLiteService.getInstance();
     
     useEffect(() => {
       const initDatabase = async () => {
         try {
           await sqliteService.initialize();
           await sqliteService.createTable('todos', [
             'id INTEGER PRIMARY KEY AUTOINCREMENT',
             'task TEXT NOT NULL',
             'completed INTEGER DEFAULT 0'
           ]);
           await loadTodos();
         } catch (error) {
           console.error('初始化数据库失败:', error);
         }
       };
       
       initDatabase();
       
       return () => {
         sqliteService.close();
       };
     }, []);
     
     const loadTodos = async () => {
       const result = await sqliteService.executeQuery('SELECT * FROM todos');
       setTodos(result.values || []);
     };
     
     const addTodo = async () => {
       if (!newTask.trim()) return;
       
       await sqliteService.executeQuery('INSERT INTO todos (task) VALUES (?)', [newTask]);
       setNewTask('');
       await loadTodos();
     };
     
     const toggleTodo = async (id: number, completed: boolean) => {
       await sqliteService.executeQuery(
         'UPDATE todos SET completed = ? WHERE id = ?',
         [completed ? 0 : 1, id]
       );
       await loadTodos();
     };
     
     const deleteTodo = async (id: number) => {
       await sqliteService.executeQuery('DELETE FROM todos WHERE id = ?', [id]);
       await loadTodos();
     };
     
     return (
       <div>
         <h2>SQLite 待办事项</h2>
         
         <IonItem>
           <IonLabel position="floating">新任务</IonLabel>
           <IonInput
             value={newTask}
             onIonChange={(e) => setNewTask(e.detail.value || '')}
           />
         </IonItem>
         
         <IonButton expand="block" onClick={addTodo}>添加任务</IonButton>
         
         <IonList>
           {todos.map((todo) => (
             <IonItem key={todo.id}>
               <IonLabel
                 onClick={() => toggleTodo(todo.id, !!todo.completed)}
                 style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
               >
                 {todo.task}
               </IonLabel>
               <IonButton slot="end" color="danger" onClick={() => deleteTodo(todo.id)}>删除</IonButton>
             </IonItem>
           ))}
         </IonList>
       </div>
     );
   };

   export default SQLiteDemo;
   ```

### 15.3 社交登录插件

#### 15.3.1 安装与配置

1. **安装插件**：
   ```bash
   bun install @capacitor-community/oauth2
   npx cap sync
   ```

2. **平台配置**：

   **Android (AndroidManifest.xml)**：
   ```xml
   <intent-filter>
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="@string/custom_url_scheme" />
   </intent-filter>
   ```

   **iOS (Info.plist)**：
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>your-custom-scheme</string>
       </array>
     </dict>
   </array>
   ```

#### 15.3.2 使用示例

1. **创建OAuth服务封装**：
   ```typescript
   // src/mobile/plugins/oauth/oauth-service.ts
   import { OAuth2Client, OAuth2AuthorizationResponse } from '@capacitor-community/oauth2';

   export interface OAuthConfig {
     authorizationBaseUrl: string;
     accessTokenEndpoint: string;
     clientId: string;
     redirectUrl: string;
     scope: string;
     responseType: string;
     pkceEnabled?: boolean;
     additionalParameters?: Record<string, string>;
   }

   export class OAuthService {
     private static instance: OAuthService;
     private configs: Record<string, OAuthConfig> = {};

     private constructor() {
       // 预设常用OAuth配置
       this.configs = {
         google: {
           authorizationBaseUrl: 'https://accounts.google.com/o/oauth2/auth',
           accessTokenEndpoint: 'https://oauth2.googleapis.com/token',
           clientId: 'YOUR_GOOGLE_CLIENT_ID',
           redirectUrl: 'com.example.app:/oauth2redirect',
           scope: 'email profile',
           responseType: 'code',
           pkceEnabled: true
         },
         github: {
           authorizationBaseUrl: 'https://github.com/login/oauth/authorize',
           accessTokenEndpoint: 'https://github.com/login/oauth/access_token',
           clientId: 'YOUR_GITHUB_CLIENT_ID',
           redirectUrl: 'com.example.app:/oauth2redirect',
           scope: 'user',
           responseType: 'code'
         },
         wechat: {
           authorizationBaseUrl: 'https://open.weixin.qq.com/connect/oauth2/authorize',
           accessTokenEndpoint: 'https://api.weixin.qq.com/sns/oauth2/access_token',
           clientId: 'YOUR_WECHAT_APP_ID',
           redirectUrl: 'com.example.app:/oauth2redirect',
           scope: 'snsapi_userinfo',
           responseType: 'code',
           additionalParameters: {
             appid: 'YOUR_WECHAT_APP_ID'
           }
         }
       };
     }

     public static getInstance(): OAuthService {
       if (!OAuthService.instance) {
         OAuthService.instance = new OAuthService();
       }
       return OAuthService.instance;
     }

     setConfig(provider: string, config: OAuthConfig): void {
       this.configs[provider] = config;
     }

     async login(provider: string): Promise<OAuth2AuthorizationResponse> {
       const config = this.configs[provider];
       if (!config) {
         throw new Error(`未找到 ${provider} 的OAuth配置`);
       }

       return await OAuth2Client.authenticate(config);
     }

     async logout(provider: string): Promise<void> {
       // 对于大多数OAuth提供商，客户端注销只需清除本地令牌
       // 某些提供商可能需要调用特定的注销端点
       console.log(`从 ${provider} 注销`);
     }
   }
   ```

2. **在组件中使用**：
   ```tsx
   import React, { useState } from 'react';
   import { OAuthService } from '@/mobile/plugins/oauth/oauth-service';
   import { IonButton, IonContent, IonPage, IonText } from '@ionic/react';

   const OAuthDemo: React.FC = () => {
     const [authResponse, setAuthResponse] = useState<any>(null);
     const [error, setError] = useState<string>('');
     const oauthService = OAuthService.getInstance();
     
     const loginWithGoogle = async () => {
       try {
         setError('');
         const response = await oauthService.login('google');
         setAuthResponse(response);
         console.log('Google登录成功:', response);
       } catch (err) {
         console.error('Google登录失败:', err);
         setError('登录失败: ' + (err instanceof Error ? err.message : String(err)));
       }
     };
     
     const loginWithGitHub = async () => {
       try {
         setError('');
         const response = await oauthService.login('github');
         setAuthResponse(response);
         console.log('GitHub登录成功:', response);
       } catch (err) {
         console.error('GitHub登录失败:', err);
         setError('登录失败: ' + (err instanceof Error ? err.message : String(err)));
       }
     };
     
     const loginWithWeChat = async () => {
       try {
         setError('');
         const response = await oauthService.login('wechat');
         setAuthResponse(response);
         console.log('微信登录成功:', response);
       } catch (err) {
         console.error('微信登录失败:', err);
         setError('登录失败: ' + (err instanceof Error ? err.message : String(err)));
       }
     };
     
     const logout = async () => {
       if (authResponse) {
         // 假设我们知道当前登录的提供商
         await oauthService.logout('google'); // 或其他提供商
         setAuthResponse(null);
       }
     };
     
     return (
       <IonPage>
         <IonContent>
           <div style={{ padding: '20px' }}>
             <h2>社交登录演示</h2>
             
             {!authResponse ? (
               <div>
                 <IonButton expand="block" onClick={loginWithGoogle}>使用Google登录</IonButton>
                 <IonButton expand="block" onClick={loginWithGitHub}>使用GitHub登录</IonButton>
                 <IonButton expand="block" onClick={loginWithWeChat}>使用微信登录</IonButton>
               </div>
             ) : (
               <div>
                 <h3>登录成功</h3>
                 <pre>{JSON.stringify(authResponse, null, 2)}</pre>
                 <IonButton expand="block" onClick={logout}>退出登录</IonButton>
               </div>
             )}
             
             {error && (
               <IonText color="danger">
                 <p>{error}</p>
               </IonText>
             )}
           </div>
         </IonContent>
       </IonPage>
     );
   };

   export default OAuthDemo;
   ```

### 15.4 插件集成最佳实践

1. **插件封装原则**：
   - 始终使用单例模式封装插件服务
   - 提供统一的错误处理机制
   - 添加平台检测，确保在Web环境中优雅降级
   - 延迟初始化，仅在需要时初始化插件

2. **权限处理**：
   - 在使用需要权限的插件前，先检查并请求权限
   - 提供用户友好的权限请求说明
   - 处理权限被拒绝的情况

3. **错误处理**：
   - 捕获并记录所有插件操作中的错误
   - 为用户提供有意义的错误消息
   - 实现重试机制处理临时性错误

4. **性能优化**：
   - 避免频繁初始化和释放插件资源
   - 实现资源池管理长期连接（如蓝牙、数据库连接）
   - 使用防抖和节流技术限制高频操作

5. **测试策略**：
   - 为每个插件封装编写单元测试
   - 创建模拟实现用于Web环境测试
   - 使用设备模拟器进行集成测试

## 16. 资源与参考

- [Next.js 官方文档](https://nextjs.org/docs)
- [Ionic Framework 文档](https://ionicframework.com/docs)
- [Capacitor 文档](https://capacitorjs.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
