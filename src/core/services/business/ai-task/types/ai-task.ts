export interface AiImageTask {
  taskId: string;
  userId: string;
  imageUrl: string;
  status: 'uploaded' | 'processing' | 'done' | 'failed';
  result?: any;
  error?: any;
  createdAt: string;
}
