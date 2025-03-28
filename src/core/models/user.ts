export interface Location {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  // 将 images 改为 photos 以匹配 mock 数据
  photos: string[];
  interests: string[];
  // 修改 location 类型，允许使用字符串或坐标对象
  location: string | Location;
  // 添加可选的 email 字段
  email?: string;
  // 添加可选的 gender 字段
  gender?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Match {
  id: string;
  users: string[];
  // 将 Date 类型改为 string，与 JSON 存储兼容
  createdAt: string;
  // 添加可选的 lastMessageAt 字段
  lastMessageAt?: string;
  // 将 updatedAt 改为可选字段
  updatedAt?: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  // 将 text 改为 content 以匹配 mock 数据
  content: string;
  // 将 timestamp 改为 createdAt 并使用 string 类型
  createdAt: string;
  read: boolean;
}