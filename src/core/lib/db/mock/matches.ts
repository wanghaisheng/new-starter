import { Match } from '@/core/models/user';

export const mockMatches: Match[] = [
  {
    id: 'match1',
    users: ['1', '2'],
    timestamp: new Date(Date.now() - 86400000), // 1天前
    lastMessage: {
      text: '你好，很高兴认识你！',
      senderId: '2',
      timestamp: new Date(Date.now() - 3600000) // 1小时前
    }
  },
  // 添加更多模拟匹配...
]; 