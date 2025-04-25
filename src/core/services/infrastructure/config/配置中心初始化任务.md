# Dating App 全局配置与业务配置规划（分层细化版）

> ⚡️ **初创团队运营建议：本方案已根据初创公司实际运营需求做了简化与优化，突出核心业务优先、流程简化、工具轻量、风险兜底与团队共建。**

本文件系统性梳理适合全局配置（ConfigService/useConfig）的各类业务场景，
每一项均包含【概述】【引入时间点】【优势】【典型场景】【字段结构】【配置示例】【最佳实践】等分层细化内容，便于团队理解、落地与扩展。

---

## 0. 快速上手与FAQ

### 常见操作指引
- 配置文件采用 JSON/TS 结构，直接在 `config` 目录下通过 Git 管理。
- 变更配置时，优先修改核心业务相关项（如活动开关、首页皮肤、A/B实验等）。
- 配置变更可由运营/产品自助提交，技术定期 review 兜底。
- 配置生效流程：修改→PR→自动校验→合并→前端自动拉取。

### 常见问题FAQ
- **Q: 如何快速新增活动开关？**
  A: 复制已有开关配置，填写唯一 id、名称、时间区间，提交 PR 即可。
- **Q: 配置出错怎么办？**
  A: 支持一键回滚到历史版本，或联系技术协助。
- **Q: 配置字段如何确定？**
  A: 仅保留当前业务必要字段，后续可随业务扩展。

### 风险提示与应急方案
- 高风险配置（如付费开关、活动大促）变更需双人复核。
- 所有配置变更自动归档，支持一键回滚。
- 配置异常时前端有兜底逻辑，避免影响主流程。

---

## 1. API/环境参数
### 概述
统一管理后端 API、静态资源、环境变量，实现多环境自动切换和资源隔离。
### 引入时间点
- 项目初期，需支持开发、测试、生产等多环境时。
### 优势
- 集中管理，环境切换自动化，防止硬编码。
- 支持灰度、A/B、资源隔离。
### 典型场景
- 多端部署、灰度发布、资源 CDN 隔离。
### 字段结构
- `apiBaseUrl`: 当前环境 API 根地址
- `cdnUrl`: 静态资源 CDN 域名
- `env`: 当前环境（dev/test/prod）
### 配置示例
```json
{
  "apiBaseUrl": "https://api.example.com/v1",
  "cdnUrl": "https://cdn.example.com/",
  "env": "production"
}
```
### 最佳实践
- 环境变量命名规范，建议统一在 config service 维护。
- 重要参数建议支持远程热更新（如接口切换、CDN 故障应急）。
- **初创建议：仅保留必要环境参数，后续随业务扩展。**

---

## 2. Feature Flag/运营开关
### 概述
灵活控制功能上线、A/B 实验、节日活动、广告策略等，无需发版即可动态调整产品体验。
### 引入时间点
- 新功能上线、节日活动、广告策略调整等需动态变更时。
### 优势
- 支持灰度、A/B、活动、广告等精细化运营。
- 运营/产品可自主控制，无需发版。
### 典型场景
- 新功能灰度、节日活动、广告策略、实验参数。
### 字段结构
- `featureFlags`: 功能开关（如新功能灰度、beta 功能）
- `eventFlags`: 活动开关（如节日活动、限时特惠）
- `adPolicy`: 广告策略（如 banner、激励视频）
### 配置示例
```json
{
  "featureFlags": { "newMatchAlgo": true, "voiceChatBeta": false },
  "eventFlags": { "valentineEvent": true },
  "adPolicy": { "showBanner": true, "showRewarded": false }
}
```
### 最佳实践
- 配置项命名需清晰，建议后台管理界面。
- 支持分用户/渠道/地区灰度、定向、定时。
- 建议与埋点、监控、自动化联动。

---

## 3. 全局主题与品牌
### 概述
统一品牌色、主题风格、节日皮肤，提升品牌一致性和用户体验。
### 引入时间点
- 产品需支持多主题、品牌升级、节日换肤时。
### 优势
- 品牌统一、节日氛围、支持一键多主题。
### 典型场景
- 品牌升级、节日换肤、暗黑/夜间模式。
### 字段结构
- `theme`: 当前主题（如 light/dark/valentine）
- `brandColor`: 品牌主色
- `availableThemes`: 可选主题列表（含配色、背景等）
### 配置示例
```json
{
  "theme": "valentine",
  "brandColor": "#FF3366",
  "availableThemes": [
    { "id": "light", "name": "明亮", "colors": { "primary": "#fff" }, "background": "url(light-bg.png)" },
    { "id": "valentine", "name": "情人节", "colors": { "primary": "#FF3366" }, "background": "url(valentine-bg.png)" }
  ]
}
```
### 最佳实践
- 主题配置建议结构化，便于扩展和联动皮肤/活动。
- 主题切换建议全局响应，支持动态热更新。

---

## 4. 国际化与区域化
### 概述
支持多语言切换、地区定制，提升全球用户体验。
### 引入时间点
- 产品有国际化需求或计划出海时。
### 优势
- 支持全球化、地区定制。
### 典型场景
- 多语言切换、地区特定功能、货币/日期格式本地化。
### 字段结构
- `language`: 当前语言（如 zh-CN/en-US）
- `region`: 当前区域（如 CN/US）
- `i18nResources`: 远程多语言资源包
### 配置示例
```json
{
  "language": "zh-CN",
  "region": "CN",
  "i18nResources": {
    "zh-CN": { "welcome": "欢迎" },
    "en-US": { "welcome": "Welcome" }
  }
}
```
### 最佳实践
- 建议多语言内容与业务解耦，支持远程热更新和版本管理。
- 地区/语言切换建议全局响应，联动 UI/内容。

---

## 5. 全局限制与参数
### 概述
统一约束上传、输入、刷新等参数，便于后端/运营统一调整。
### 引入时间点
- 产品上线前，需统一约束各类输入/上传/刷新频率时。
### 优势
- 全局一致、便于统一调整和风控。
### 典型场景
- 上传/输入/刷新等有全局约束的业务。
### 字段结构
- `maxUploadSize`: 最大上传文件（MB）
- `maxBioLength`: 简介最大长度
- `locationUpdateInterval`: 位置刷新频率（秒）
- `maxGiftMessageLength`: 礼物赠言最大长度
### 配置示例
```json
{
  "maxUploadSize": 10,
  "maxBioLength": 200,
  "locationUpdateInterval": 60,
  "maxGiftMessageLength": 40
}
```
### 最佳实践
- 建议所有全局约束参数统一在 config service 管理，防止魔法数。
- 变更需有文档和发布流程。

---

## 6. 会员成长体系（VIP/Membership）
### 概述
支持多等级会员、权益、成长任务、价格、成长规则等灵活扩展。
### 引入时间点
- 产品有会员体系、成长体系、权益常变/需灰度时。
### 优势
- 会员权益/价格/成长体系可热更新，灵活运营。
### 典型场景
- 会员等级、成长任务、权益动态调整、运营活动。
### 字段结构
- `membershipTiers`: 等级列表（id、name、icon、color、desc）
- `membershipBenefits`: 各等级权益
- `membershipPricing`: 各等级价格/币种/折扣
- `membershipGrowth`: 成长体系开关、成长规则、升级条件
- `membershipFeatureFlags`: 新会员功能灰度
### 配置示例
```json
{
  "membershipTiers": [
    { "id": "basic", "name": "普通", "icon": "basic.svg", "color": "#ccc", "description": "基础功能" },
    { "id": "gold", "name": "黄金", "icon": "gold.svg", "color": "#FFD700", "description": "更多特权" }
  ],
  "membershipBenefits": {
    "basic": ["无限喜欢"],
    "gold": ["无限喜欢", "超级曝光"]
  },
  "membershipPricing": {
    "basic": { "price": 0, "currency": "CNY" },
    "gold": { "price": 99, "currency": "CNY", "discount": 88 }
  },
  "membershipGrowth": {
    "enabled": true,
    "growthRules": "每日登录+1分，送礼+2分",
    "upgradeConditions": "满100分升级黄金"
  },
  "membershipFeatureFlags": {
    "newVipFeature": false
  }
}
```
### 最佳实践
- 会员配置结构建议与后端/运营约定，支持热更新和灰度。
- 成长体系建议可扩展积分、任务、权益等多维度。

---

## 7. 虚拟礼物商城（Gifts）
### 概述
支持礼物上下架、分类、价格、限时折扣、节日礼物、活动礼物等。
### 引入时间点
- 产品有虚拟礼物、节日活动、礼物商城等需求时。
### 优势
- 礼物商城/活动可热更新，灵活响应市场。
### 典型场景
- 礼物商城、节日礼物、限时折扣。
### 字段结构
- `giftCatalog`: 礼物列表（id、name、image、price、category、isNew、isLimited、startAt、endAt）
- `giftCategories`: 礼物分类（id、name、icon）
- `giftFeatureFlags`: 礼物商城、节日礼物开关
- `giftDiscounts`: 礼物限时折扣
### 配置示例
```json
{
  "giftCatalog": [
    { "id": "rose", "name": "玫瑰", "image": "rose.png", "price": 10, "category": "flower", "isNew": true },
    { "id": "chocolate", "name": "巧克力", "image": "choco.png", "price": 20, "category": "food", "isLimited": true, "startAt": "2025-02-10", "endAt": "2025-02-15" }
  ],
  "giftCategories": [
    { "id": "flower", "name": "鲜花", "icon": "flower.svg" },
    { "id": "food", "name": "美食", "icon": "food.svg" }
  ],
  "giftFeatureFlags": {
    "enableGiftMall": true,
    "enableFestivalGifts": true
  },
  "giftDiscounts": {
    "rose": { "price": 8, "startAt": "2025-02-14", "endAt": "2025-02-14" }
  }
}
```
### 最佳实践
- 礼物配置建议结构化，支持远程热更新和活动联动。
- 分类、限时、节日等建议与 eventFlags 联动。

---

## 8. 活动皮肤/定向推送（Event Skins & Targeted Skins）
### 概述
支持节日/活动皮肤、主题色、定向推送、灰度上线。
### 引入时间点
- 产品需节日/活动皮肤、定向换肤、品牌升级时。
### 优势
- 节日皮肤/主题可灰度、定向推送，提升氛围。
### 典型场景
- 节日活动、品牌升级、定向换肤。
### 字段结构
- `eventSkins`: 皮肤列表（id、name、theme、background、startAt、endAt、desc）
- `activeSkinId`: 当前激活皮肤 ID
- `skinTargetingRules`: 定向推送规则（skinId、region、userSegment、enabled）
### 配置示例
```json
{
  "eventSkins": [
    { "id": "valentine", "name": "情人节皮肤", "theme": "valentine", "background": "valentine-bg.png", "startAt": "2025-02-14", "endAt": "2025-02-15", "description": "情人节专属浪漫皮肤" }
  ],
  "activeSkinId": "valentine",
  "skinTargetingRules": [
    { "skinId": "valentine", "region": "CN", "userSegment": "all", "enabled": true }
  ]
}
```
### 最佳实践
- 皮肤配置建议结构化，支持定时/定向/灰度。
- 皮肤与活动、主题、入口联动，提升运营效率。

---

## 9. 配置规则的管理、应用与更新

### 概述
当全局配置规则确定后，需有一套规范的管理、存储、应用与更新机制，保证配置的安全性、实时性和可追溯性。

### 1. 管理方式
- **集中管理**：所有全局配置建议统一由 ConfigService 及相关 Registry/类型文件维护，严禁分散在各业务模块或硬编码。
- **权限控制**：涉及运营/活动/商业化等敏感配置，建议接入后台配置管理平台，支持权限分级和操作日志。
- **变更流程**：配置变更应有审批、回滚、通知机制，重要参数变更需同步前后端和测试。

### 2. 存储与分发
- **本地存储**：开发/测试环境可直接维护于本地 JSON/TS 文件，便于版本管理和协作。
- **远程存储**：生产环境建议接入远程配置中心（如 Firebase Remote Config、阿里云 ACM、自建配置服务等），支持热更新和多端同步。
- **版本控制**：所有配置文件应纳入 Git 版本管理，重要变更需有 Commit 说明。
- **缓存策略**：前端可本地缓存配置（如 localStorage/IndexedDB），但需定期拉取最新配置，防止陈旧。

### 3. 应用到系统的方式
- **统一入口加载**：全局配置由 ConfigService/Registry 在应用初始化时统一加载，确保所有业务模块均可通过 useConfig 等 hooks 访问。
- **响应式消费**：组件/业务逻辑通过 hooks/useConfig 获取配置，支持响应式更新（如配置变更后自动刷新 UI）。
- **分环境注入**：不同环境（dev/test/prod）自动注入对应配置，防止环境串用。
- **灰度/分群/定向**：支持按用户、渠道、地区等维度动态下发差异化配置。

### 4. 更新机制与安全性
- **热更新**：远程配置平台支持无感知热更新，前端监听配置变更自动刷新。
- **回滚机制**：支持快速回滚到历史配置，防止配置失误影响线上。
- **变更通知**：配置更新后自动通知相关研发、运营、测试，确保各方知情。
- **安全校验**：配置更新需校验字段格式、必填项、取值范围，防止脏数据。

### 5. 典型工作流示例
1. 运营/产品在后台配置平台调整活动开关、皮肤、礼物等参数，提交变更。
2. 配置平台推送最新配置到远程配置中心，或由运维合并配置文件到主仓库。
3. 前端应用启动或定时拉取最新配置，ConfigService 自动解析并注入全局。
4. 业务组件通过 useConfig/useXXXHooks 实时消费最新配置，UI 自动响应。
5. 配置变更日志自动归档，异常变更可一键回滚。

### 最佳实践
- 配置管理平台建议支持分环境、分权限、定时发布、变更预览等能力。
- 重要配置建议双人复核，所有变更需有审批和回滚方案。
- 配置字段结构建议与后端/运营/测试达成一致，避免歧义。
- 配置消费建议只通过 ConfigService/useConfig，严禁直接引用原始文件。

---
