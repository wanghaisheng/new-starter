/**
 * 位置信息接口
 * 表示用户的地理位置信息
 */
export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}