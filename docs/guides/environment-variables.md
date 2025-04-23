# 环境变量与配置项一览

本项目所有环境变量已分组标准化，统一采用 `NEXT_PUBLIC_` 前缀（前端可见），便于前后端一致、自动补全和类型安全。下表分为数据库/ORM、认证服务、云存储、推送服务、通用配置五大类。

---

## 数据库/ORM 配置

| 变量名                        | 典型值                          | 说明                   |
|------------------------------|---------------------------------|------------------------|
| NEXT_PUBLIC_DB_URL           | 本地/远程数据库连接串            | 数据库连接地址或类型   |
| NEXT_PUBLIC_DATABASE_ENV     | sqlite/mock                     | 数据库环境             |
| NEXT_PUBLIC_MOCK_DB_MODE     | mock-indexeddb/memory/json      | mock 阶段数据库类型    |
| NEXT_PUBLIC_ONLINE_DB        | supabase/firebase/sqlite        | 远程数据库类型         |
| NEXT_PUBLIC_OFFLINE_DB       | indexeddb/sqlite                | 本地数据库类型         |
| NEXT_PUBLIC_MOCK_SQLITE_FILE | ./mock.db                       | mock sqlite 文件路径   |

---

## 认证服务配置

| 变量名                             | 典型值                 | 说明                       |
|-------------------------------------|------------------------|----------------------------|
| NEXT_PUBLIC_AUTH_TYPE               | firebase/mock          | 认证方式（前端可见）       |
| NEXT_PUBLIC_AUTH_SERVICE_TYPE       | firebase/betterauth    | 认证服务类型               |
| NEXT_PUBLIC_BETTER_AUTH_API_URL     | https://auth.xxx.com   | BetterAuth API 地址        |
| NEXT_PUBLIC_BETTER_AUTH_SECRET      | ...                    | BetterAuth 服务端密钥      |

---

## 云存储（Firebase等）配置

| 变量名                                  | 典型值        | 说明                   |
|------------------------------------------|---------------|------------------------|
| NEXT_PUBLIC_FIREBASE_API_KEY             | ...           | Firebase 公钥          |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         | ...           | Firebase Auth 域名     |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID          | ...           | Firebase 项目ID        |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      | ...           | Firebase 存储桶        |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | ...           | Firebase 推送ID        |
| NEXT_PUBLIC_FIREBASE_APP_ID              | ...           | Firebase APP_ID        |

---

## 推送服务配置（如有可补充）

| 变量名                | 典型值 | 说明                |
|-----------------------|--------|---------------------|
| NEXT_PUBLIC_PUSH_APP_KEY | ...  | 推送服务AppKey      |

---

## 通用/辅助配置

| 变量名                             | 典型值                          | 说明                       |
|-------------------------------------|---------------------------------|----------------------------|
| NEXT_PUBLIC_NODE_ENV                | development/production/test      | 运行环境                   |
| NEXT_PUBLIC_ENV_STAGE               | mock/local/dev/prod              | 当前环境模式               |
| NEXT_PUBLIC_DATA_MODE               | online-only/offline-only/hybrid  | 服务层运行模式             |
| NEXT_PUBLIC_API_BASE_URL            | http://localhost:3000            | 后端 API 基础地址          |
| NEXT_PUBLIC_LOG_LEVEL               | debug/info/warn/error            | 日志输出等级               |
| NEXT_PUBLIC_PROVIDER_TYPE           | mock/local/remote/hybrid         | 服务/适配器类型            |
| NEXT_PUBLIC_FEATURE_FLAG            | enableX=true,enableY=false       | 功能开关（逗号分隔）       |
| NEXT_PUBLIC_BRAND                   | brandA/brandB/default            | 多品牌适配                 |
| NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT    | true/false                       | 网络恢复时自动同步         |
| NEXT_PUBLIC_SYNC_INTERVAL           | 60000（单位 ms）                 | 同步间隔                   |
| NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION| server-wins/client-wins/merge    | 冲突解决策略               |
| NEXT_PUBLIC_ENABLE_OFFLINE          | true/false                       | 启用离线功能               |
| NEXT_PUBLIC_ENABLE_HYBRID           | true/false                       | 启用混合模式               |
| NEXT_PUBLIC_LOAD_TEST_DATA          | true/false                       | 加载测试数据               |
| NEXT_PUBLIC_TEST_DATA_SOURCE        | example/dating                   | 测试数据类型               |

---

> 所有变量已在 `src/core/services/infrastructure/config/config-keys.ts` 集中声明，建议所有业务代码通过 `configService.get(CONFIG_KEYS.变量名)` 访问，禁止硬编码。

如需新增服务或变量，请同步更新本表和 config-keys.ts！
