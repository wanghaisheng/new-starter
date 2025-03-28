import { BaseModel } from './base'; 
 
export interface User extends BaseModel { 
  name: string; 
  age?: number; 
  bio?: string; 
  images?: string[]; 
  interests?: string[]; 
  // 其他用户属�?
} 
