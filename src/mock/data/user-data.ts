import { User, Match, Message } from '../../core/models/user';

// 模拟当前用户
export const mockCurrentUser: User = {
  id: 'current-user-1',
  name: '张三',
  email: 'zhangsan@example.com',
  bio: '喜欢旅行和摄影的程序员',
  age: 28,
  gender: 'male',
  location: '北京',
  interests: ['编程', '摄影', '旅行'],
  photos: ['https://randomuser.me/api/portraits/men/1.jpg'],
  createdAt: new Date().toISOString()
};

// 模拟用户列表
// 确保 mockUsers 中的每个用户都有 photos 属性，且至少有一个元素
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: '李四',
    email: 'lisi@example.com',
    bio: '热爱音乐和电影',
    age: 25,
    gender: 'female',
    location: '上海',
    interests: ['音乐', '电影', '阅读'],
    photos: ['https://randomuser.me/api/portraits/women/2.jpg'], // 确保这个数组不为空
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-2',
    name: '王五',
    email: 'wangwu@example.com',
    bio: '喜欢运动和户外活动',
    age: 30,
    gender: 'male',
    location: '广州',
    interests: ['运动', '户外', '烹饪'],
    photos: ['https://randomuser.me/api/portraits/men/3.jpg'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-3',
    name: '赵六',
    email: 'zhaoliu@example.com',
    bio: '艺术爱好者，喜欢绘画和设计',
    age: 27,
    gender: 'female',
    location: '深圳',
    interests: ['绘画', '设计', '咖啡'],
    photos: ['https://randomuser.me/api/portraits/women/4.jpg'],
    createdAt: new Date().toISOString()
  }
];

// 模拟匹配数据
export const mockMatches: Match[] = [
  {
    id: 'match-1',
    users: ['current-user-1', 'user-1'],
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString()
  }
];

// 模拟消息数据
export const mockMessages: Message[] = [
  {
    id: 'message-1',
    matchId: 'match-1',
    senderId: 'current-user-1',
    content: '你好，很高兴认识你！',
    createdAt: new Date().toISOString(),
    read: true
  },
  {
    id: 'message-2',
    matchId: 'match-1',
    senderId: 'user-1',
    content: '你好！我也很高兴认识你 :)',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5分钟前
    read: true
  }
];