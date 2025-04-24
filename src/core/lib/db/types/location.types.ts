// 定位相关主类型定义，供全局 service/hook/页面层复用

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
  [key: string]: any;
}
