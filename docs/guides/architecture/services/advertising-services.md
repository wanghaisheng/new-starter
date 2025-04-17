# 广告服务设计文档

## 概述

广告服务是 HeyTCM 架构中的重要组成部分，负责管理和投放广告内容。本服务支持多种广告形式，包括横幅广告、插页广告、原生广告等，并提供精准的广告投放和效果分析功能。

## 核心优势

1. **多形式支持**
   - 横幅广告
   - 插页广告
   - 原生广告
   - 视频广告
   - 激励广告

2. **精准投放**
   - 用户画像
   - 场景匹配
   - 时间控制
   - 地域定向

3. **效果分析**
   - 展示统计
   - 点击分析
   - 转化追踪
   - ROI 计算

4. **收益优化**
   - 竞价策略
   - 填充率优化
   - 频次控制
   - 预算管理

## 架构设计

### 核心组件

1. **广告管理器 (AdManager)**
   - 广告请求处理
   - 广告位管理
   - 投放策略控制
   - 频次限制

2. **广告加载器 (AdLoader)**
   - 广告资源加载
   - 缓存管理
   - 预加载策略
   - 错误处理

3. **广告渲染器 (AdRenderer)**
   - 广告展示控制
   - 样式适配
   - 交互处理
   - 动画效果

4. **数据分析器 (Analytics)**
   - 数据收集
   - 效果分析
   - 报表生成
   - 优化建议

### 目录结构

```
src/core/services/advertising/
├── types/
│   ├── ad-types.ts
│   ├── config-types.ts
│   └── analytics-types.ts
├── managers/
│   ├── ad-manager.ts
│   └── placement-manager.ts
├── loaders/
│   ├── ad-loader.ts
│   └── cache-manager.ts
├── renderers/
│   ├── banner-renderer.ts
│   ├── interstitial-renderer.ts
│   └── native-renderer.ts
├── analytics/
│   ├── data-collector.ts
│   └── report-generator.ts
└── config/
    └── default-config.ts
```

## 配置示例

```typescript
// 广告服务配置
{
  "advertising": {
    "providers": {
      "admob": {
        "appId": "your-app-id",
        "unitIds": {
          "banner": "your-banner-id",
          "interstitial": "your-interstitial-id",
          "rewarded": "your-rewarded-id"
        }
      },
      "facebook": {
        "appId": "your-facebook-app-id",
        "unitIds": {
          "banner": "your-facebook-banner-id",
          "interstitial": "your-facebook-interstitial-id"
        }
      }
    },
    "placement": {
      "homeBanner": {
        "type": "banner",
        "size": "320x50",
        "refreshInterval": 30,
        "provider": "admob"
      },
      "gameInterstitial": {
        "type": "interstitial",
        "showInterval": 120,
        "provider": "facebook"
      }
    },
    "analytics": {
      "enabled": true,
      "trackingInterval": 60,
      "events": ["impression", "click", "conversion"]
    }
  }
}
```

## 接口定义

```typescript
interface IAdvertisingService {
  // 初始化服务
  initialize(config: AdConfig): Promise<void>;
  
  // 请求广告
  requestAd(placementId: string): Promise<AdResponse>;
  
  // 展示广告
  showAd(adId: string): Promise<void>;
  
  // 获取广告状态
  getAdStatus(adId: string): AdStatus;
  
  // 获取分析数据
  getAnalytics(options: AnalyticsOptions): Promise<AnalyticsReport>;
}

interface AdResponse {
  id: string;
  type: AdType;
  content: AdContent;
  provider: string;
  expiration: number;
}

interface AnalyticsReport {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  ecpm: number;
}
```

## 实现建议

1. **广告请求优化**
   ```typescript
   class AdManager {
     private cache: AdCache;
     private requestQueue: RequestQueue;
     
     async requestAd(placementId: string): Promise<AdResponse> {
       // 检查缓存
       const cachedAd = await this.cache.get(placementId);
       if (cachedAd && !this.isExpired(cachedAd)) {
         return cachedAd;
       }
       
       // 加入请求队列
       return this.requestQueue.add(async () => {
         const ad = await this.fetchAd(placementId);
         await this.cache.set(placementId, ad);
         return ad;
       });
     }
   }
   ```

2. **广告展示控制**
   ```typescript
   class AdRenderer {
     private container: HTMLElement;
     private currentAd: AdResponse | null;
     
     async showAd(ad: AdResponse): Promise<void> {
       if (this.currentAd) {
         await this.hideCurrentAd();
       }
       
       this.currentAd = ad;
       await this.renderAd(ad);
       await this.trackImpression(ad);
     }
     
     private async renderAd(ad: AdResponse): Promise<void> {
       switch (ad.type) {
         case 'banner':
           await this.renderBanner(ad);
           break;
         case 'interstitial':
           await this.renderInterstitial(ad);
           break;
         case 'native':
           await this.renderNative(ad);
           break;
       }
     }
   }
   ```

## 最佳实践

1. **性能优化**
   - 实现广告预加载
   - 使用缓存机制
   - 控制请求频率
   - 优化资源加载

2. **用户体验**
   - 合理控制广告频次
   - 提供关闭选项
   - 适配不同设备
   - 优化加载时间

3. **数据分析**
   - 实时数据收集
   - 多维数据分析
   - 自动优化建议
   - 定期报表生成

4. **错误处理**
   - 优雅降级
   - 自动重试
   - 错误上报
   - 监控告警

## 注意事项

1. **合规性**
   - 遵守广告政策
   - 用户隐私保护
   - 内容审核
   - 地域限制

2. **性能**
   - 控制资源占用
   - 优化加载时间
   - 减少网络请求
   - 内存管理

3. **稳定性**
   - 服务降级
   - 错误恢复
   - 监控告警
   - 定期维护

4. **扩展性**
   - 支持新广告形式
   - 接入新广告平台
   - 自定义分析指标
   - 灵活配置 