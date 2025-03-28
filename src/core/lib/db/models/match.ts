import { BaseModel } from './base'; 
 
export interface Match extends BaseModel { 
  userId1: string; 
  userId2: string; 
  status: 'pending' | 'accepted' | 'rejected'; 
  matchedAt?: Date; 
  // 其他匹配属�?
} 
