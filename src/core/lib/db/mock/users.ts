import { User } from '@/core/models/user';

export const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    age: 28,
    bio: '喜欢旅行和摄影，寻找志同道合的伙伴一起探索世界。',
    images: ['/images/profiles/user1-1.jpg', '/images/profiles/user1-2.jpg'],
    location: '上海',
    interests: ['摄影', '旅行', '美食'],
    gender: 'male',
    lookingFor: ['female'],
    lastActive: new Date()
  },
  {
    id: '2',
    name: '李四',
    age: 25,
    bio: '音乐老师，钢琴和吉他都会一点。喜欢安静的咖啡馆。',
    images: ['/images/profiles/user2-1.jpg'],
    location: '北京',
    interests: ['音乐', '咖啡', '阅读'],
    gender: 'female',
    lookingFor: ['male'],
    lastActive: new Date()
  },
  // 添加更多模拟用户...
]; 