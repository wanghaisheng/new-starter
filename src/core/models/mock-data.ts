import { User, Match, Message } from './user';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    age: 28,
    bio: '热爱旅行和摄影的软件工程师，喜欢探索新事物。',
    images: [
      'https://picsum.photos/400/600?random=1',
      'https://picsum.photos/400/600?random=2',
      'https://picsum.photos/400/600?random=3'
    ],
    location: '北京',
    interests: ['旅行', '摄影', '编程', '美食'],
    gender: 'female',
    lookingFor: ['male'],
    lastActive: new Date()
  },
  {
    id: '2',
    name: 'Mike Johnson',
    age: 31,
    bio: '产品经理，喜欢户外运动和阅读。',
    images: [
      'https://picsum.photos/400/600?random=4',
      'https://picsum.photos/400/600?random=5',
      'https://picsum.photos/400/600?random=6'
    ],
    location: '上海',
    interests: ['户外运动', '阅读', '产品设计', '音乐'],
    gender: 'male',
    lookingFor: ['female'],
    lastActive: new Date()
  },
  {
    id: '3',
    name: 'Emma Wang',
    age: 26,
    bio: 'UI设计师，热爱艺术和创意。',
    images: [
      'https://picsum.photos/400/600?random=7',
      'https://picsum.photos/400/600?random=8',
      'https://picsum.photos/400/600?random=9'
    ],
    location: '深圳',
    interests: ['设计', '艺术', '旅行', '美食'],
    gender: 'female',
    lookingFor: ['male', 'female'],
    lastActive: new Date()
  }
];

export const mockMatches: Match[] = [
  {
    id: 'm1',
    users: ['1', '2'],
    timestamp: new Date(),
    lastMessage: {
      text: '你好，很高兴认识你！',
      senderId: '1',
      timestamp: new Date()
    }
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    matchId: 'm1',
    senderId: '1',
    text: '你好，很高兴认识你！',
    timestamp: new Date(),
    read: true
  },
  {
    id: 'msg2',
    matchId: 'm1',
    senderId: '2',
    text: '你好！我也很高兴认识你。',
    timestamp: new Date(),
    read: false
  }
];

// 获取推荐用户列表（排除已匹配的用户）
export const getRecommendedUsers = (currentUserId: string): User[] => {
  const matchedUserIds = mockMatches
    .filter(match => match.users.includes(currentUserId))
    .flatMap(match => match.users)
    .filter(id => id !== currentUserId);
  
  return mockUsers.filter(user => 
    user.id !== currentUserId && 
    !matchedUserIds.includes(user.id)
  );
};

// 获取用户的匹配列表
export const getUserMatches = (userId: string): Match[] => {
  return mockMatches.filter(match => match.users.includes(userId));
};

// 获取匹配的消息列表
export const getMatchMessages = (matchId: string): Message[] => {
  return mockMessages.filter(message => message.matchId === matchId);
}; 