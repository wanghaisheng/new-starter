export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  contentType?: 'text' | 'image';
  status?: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}