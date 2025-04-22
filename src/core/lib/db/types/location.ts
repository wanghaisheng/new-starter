/**
 * 位置信息接口
 * 表示用户的地理位置信�?
 * 
 * @description
 * 存储用户的地理位置数据，包括经纬度和地点描述
 * 用于位置匹配和距离计�?
 */
export interface Location {
  /** 纬度坐标 */
  latitude: number;
  
  /** 经度坐标 */
  longitude: number;
  
  /** 城市名称 */
  city: string;
  
  /** 国家名称 */
  country: string;
}
