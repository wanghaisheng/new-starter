// 基础模型接口 
// 所有数据库模型都应该继承这个接�?
export interface BaseModel { 
  id: string; 
  createdAt?: Date; 
  updatedAt?: Date; 
} 
