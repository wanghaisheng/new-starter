import { IService, ServiceConfig } from '../types';

/**
 * 业务服务类型
 */
export enum BusinessServiceType {
  AUTH = 'auth',
  USER = 'user',
  MESSAGE = 'message',
  PAYMENT = 'payment',
  SYNC = 'sync',
  TEST = 'test'
}

/**
 * 业务服务配置
 */
export interface BusinessServiceConfig extends ServiceConfig {
  services: {
    [key in BusinessServiceType]?: {
      adapter: string;
      options?: Record<string, any>;
    };
  };
}

/**
 * 认证服务接口
 */
export interface IAuthService extends IService {
  login(credentials: { email: string; password: string }): Promise<{ user: any; token: string }>;
  logout(): Promise<void>;
  register(userData: any): Promise<{ user: any; token: string }>;
  resetPassword(email: string): Promise<void>;
  getCurrentUser(): Promise<any>;
}

/**
 * 用户服务接口
 */
export interface IUserService extends IService {
  getUser(id: string): Promise<any>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
  searchUsers(query: string): Promise<any[]>;
}

/**
 * 消息服务接口
 */
export interface IMessageService extends IService {
  getMessages(conversationId: string): Promise<any[]>;
  sendMessage(conversationId: string, content: string): Promise<any>;
  markMessageAsRead(messageId: string): Promise<void>;
  markAllMessagesAsRead(conversationId: string): Promise<void>;
  getUnreadMessageCount(): Promise<number>;
}

/**
 * 支付服务接口
 */
export interface IPaymentService extends IService {
  createPaymentIntent(amount: number, currency: string): Promise<{ clientSecret: string }>;
  confirmPayment(paymentIntentId: string): Promise<any>;
  refundPayment(paymentIntentId: string): Promise<any>;
  getPaymentHistory(): Promise<any[]>;
}

/**
 * 同步服务接口
 */
export interface ISyncService extends IService {
  sync(): Promise<void>;
  getSyncStatus(): Promise<{ lastSync: Date; status: 'success' | 'error' | 'in_progress' }>;
  resolveConflicts(conflicts: any[]): Promise<void>;
}

/**
 * 测试服务接口
 */
export interface ITestService extends IService {
  runTests(): Promise<{ passed: number; failed: number; results: any[] }>;
  generateTestReport(): Promise<string>;
  mockService(serviceType: string, mockImplementation: any): void;
} 