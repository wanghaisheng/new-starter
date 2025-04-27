# 客户端核心服务目录（client）

本目录用于沉淀所有“只与客户端本地环境相关”的核心服务，便于前后端解耦、统一能力抽象和团队协作。

---

## 已有与潜在服务列表（tb = To Be/待建设）

| 服务名                    | 说明                                             | 状态 |
|---------------------------|--------------------------------------------------|------|
| data-initializer/         | 客户端本地数据库初始化与导入（IndexedDB/SQLite） |      |
| local-storage/            | localStorage/sessionStorage 封装                  | tb   |
| indexeddb/                | IndexedDB 高级封装与版本迁移                     | tb   |
| sqlite/                   | Capacitor/原生 SQLite 操作服务                   | tb   |
| cache-manager/            | 本地缓存统一管理（内存/本地/失效策略）            | tb   |
| sensor/                   | 设备传感器能力封装（陀螺仪、定位等）              | tb   |
| notification/             | 本地通知、推送等                                  | tb   |
| clipboard/                | 剪贴板读写、粘贴等                                | tb   |
| media/                    | 本地音视频采集、拍照、录音                        | tb   |
| file-system/              | 本地文件读写、导入导出                            | tb   |
| pwa/                      | PWA 安装检测、离线资源管理                        | tb   |
| service-worker/           | Service Worker 注册与离线缓存                     | tb   |
| app-lifecycle/            | 前后台切换、生命周期事件监听                      | tb   |
| auth-storage/             | 本地 token/敏感信息加密存储                       | tb   |
| permission/               | 权限检测与请求                                    | tb   |
| platform-adapter/         | 平台能力适配与检测                                | tb   |
| feature-flag/             | 客户端特性开关、本地实验配置                      | tb   |
| theme/                    | 主题切换、暗黑模式                                | tb   |
| toast/                    | 全局消息提示、本地化                               | tb   |
| logger/                   | 本地日志收集、异常上报                             | tb   |

---

> ⚠️ 本目录所有服务设计、接口、错误处理、性能与安全等规范请统一参考 [../service-design-guidelines.md](../service-design-guidelines.md)。
> 
> ⚠️ 本目录环境模式与环境变量配置请统一参考 [../../../docs/guides/environment-modes.md](../../../docs/guides/environment-modes.md)。
> - 多环境适配、环境变量说明、配置示例详见 environment-modes.md。
> 
> **服务运行模式（Service Modes）与 provider/adapter 类型适配规范请统一参考 [../../docs/guides/service-modes.md](../../docs/guides/service-modes.md)。**
> 
> - 客户端服务需支持 online-only、offline-only、hybrid 三种模式，适配 mock、local、remote、hybrid-adapter 等多类型 provider。
> - 详细适配原则、环境变量建议、各开发阶段推荐模式详见 service-modes.md。
> - 如有补充细节请在此注明，其余请勿重复维护。

---
