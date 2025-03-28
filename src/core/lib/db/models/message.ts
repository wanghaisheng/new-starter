import { BaseModel } from './base'; 
 
export interface Message extends BaseModel { 
  matchId: string; 
  senderId: string; 
  content: string; 
  sentAt: Date; 
  readAt?: Date; 
  // 其他消息属�?
} 
