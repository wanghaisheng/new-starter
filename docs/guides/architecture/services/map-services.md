# 地图服务设计文档

## 概述

地图服务是 HeyTCM 架构中的重要组件，负责提供地图展示、位置服务、路径规划等功能。本服务支持多种地图提供商，并提供统一的地图接口和丰富的地图功能。

## 核心优势

1. **多地图支持**
   - Google Maps
   - Mapbox
   - OpenStreetMap
   - 高德地图
   - 百度地图

2. **丰富功能**
   - 地图展示
   - 位置搜索
   - 路径规划
   - 地理编码
   - 地点标记

3. **高性能**
   - 地图缓存
   - 瓦片优化
   - 异步加载
   - 懒加载

4. **可扩展性**
   - 自定义图层
   - 插件机制
   - 主题定制
   - 服务扩展

## 架构设计

### 核心组件

1. **地图管理器 (MapManager)**
   - 地图初始化
   - 地图控制
   - 图层管理
   - 事件处理

2. **位置服务 (LocationService)**
   - 位置获取
   - 地理编码
   - 逆地理编码
   - 位置追踪

3. **路径规划 (RoutingService)**
   - 路径计算
   - 导航规划
   - 交通信息
   - 路线优化

4. **地图渲染器 (MapRenderer)**
   - 地图绘制
   - 标记渲染
   - 动画效果
   - 交互处理

### 目录结构

```
src/core/services/map/
├── types/
│   ├── map-types.ts
│   ├── location-types.ts
│   └── routing-types.ts
├── managers/
│   ├── map-manager.ts
│   └── layer-manager.ts
├── services/
│   ├── location-service.ts
│   └── routing-service.ts
├── renderers/
│   ├── map-renderer.ts
│   └── marker-renderer.ts
└── config/
    └── default-config.ts
```

## 配置示例

```typescript
// 地图服务配置
{
  "map": {
    "provider": {
      "type": "mapbox",
      "config": {
        "accessToken": "your-access-token",
        "style": "mapbox://styles/mapbox/streets-v11"
      }
    },
    "location": {
      "enabled": true,
      "accuracy": "high",
      "timeout": 5000,
      "maximumAge": 300000
    },
    "routing": {
      "enabled": true,
      "provider": "mapbox",
      "profile": "driving",
      "alternatives": 3
    },
    "rendering": {
      "cache": true,
      "maxZoom": 18,
      "minZoom": 3,
      "defaultCenter": [116.404, 39.915],
      "defaultZoom": 11
    }
  }
}
```

## 接口定义

```typescript
interface IMapService {
  // 初始化服务
  initialize(config: MapConfig): Promise<void>;
  
  // 创建地图
  createMap(container: HTMLElement, options: MapOptions): Promise<MapInstance>;
  
  // 获取位置
  getLocation(options: LocationOptions): Promise<Location>;
  
  // 地理编码
  geocode(address: string): Promise<Coordinates>;
  
  // 路径规划
  route(origin: Coordinates, destination: Coordinates, options: RouteOptions): Promise<Route>;
}

interface MapInstance {
  // 地图控制
  setCenter(coordinates: Coordinates): void;
  setZoom(level: number): void;
  setStyle(style: string): void;
  
  // 标记管理
  addMarker(marker: MarkerOptions): Marker;
  removeMarker(marker: Marker): void;
  
  // 图层管理
  addLayer(layer: LayerOptions): Layer;
  removeLayer(layer: Layer): void;
  
  // 事件处理
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}

interface Route {
  distance: number;
  duration: number;
  steps: RouteStep[];
  geometry: LineString;
}
```

## 实现建议

1. **地图管理**
   ```typescript
   class MapManager {
     private maps: Map<string, MapInstance>;
     private provider: MapProvider;
     
     constructor(config: MapConfig) {
       this.maps = new Map();
       this.provider = this.createProvider(config.provider);
     }
     
     async createMap(container: HTMLElement, options: MapOptions): Promise<MapInstance> {
       const map = await this.provider.createMap(container, options);
       this.maps.set(container.id, map);
       return map;
     }
     
     private createProvider(config: ProviderConfig): MapProvider {
       switch (config.type) {
         case 'mapbox':
           return new MapboxProvider(config);
         case 'google':
           return new GoogleMapsProvider(config);
         case 'amap':
           return new AMapProvider(config);
         default:
           throw new Error(`Unsupported map provider: ${config.type}`);
       }
     }
   }
   ```

2. **位置服务**
   ```typescript
   class LocationService {
     private geocoder: Geocoder;
     private tracker: LocationTracker;
     
     constructor(config: LocationConfig) {
       this.geocoder = new Geocoder(config.geocoder);
       this.tracker = new LocationTracker(config.tracker);
     }
     
     async getLocation(options: LocationOptions): Promise<Location> {
       try {
         const position = await this.tracker.getCurrentPosition(options);
         return {
           latitude: position.coords.latitude,
           longitude: position.coords.longitude,
           accuracy: position.coords.accuracy,
           timestamp: position.timestamp
         };
       } catch (error) {
         throw new LocationError('Failed to get location', error);
       }
     }
     
     async geocode(address: string): Promise<Coordinates> {
       const result = await this.geocoder.geocode(address);
       if (result.length === 0) {
         throw new GeocodingError('No results found');
       }
       return result[0].coordinates;
     }
   }
   ```

## 最佳实践

1. **地图优化**
   - 瓦片缓存
   - 懒加载
   - 图层控制
   - 性能监控

2. **位置服务**
   - 位置缓存
   - 错误处理
   - 超时控制
   - 精度控制

3. **路径规划**
   - 路线缓存
   - 交通考虑
   - 备选路线
   - 实时更新

4. **渲染优化**
   - 标记聚合
   - 动画优化
   - 内存管理
   - 事件处理

## 注意事项

1. **性能考虑**
   - 地图加载
   - 内存使用
   - 网络请求
   - 渲染性能

2. **用户体验**
   - 加载提示
   - 错误处理
   - 交互反馈
   - 动画效果

3. **安全性**
   - API密钥保护
   - 数据加密
   - 访问控制
   - 隐私保护

4. **可维护性**
   - 代码组织
   - 错误处理
   - 日志记录
   - 监控告警 