export interface Notification {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  read: boolean;
  // 可扩展更多通知属性
}
