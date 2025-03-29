import { v4 as uuidv4 } from 'uuid';

// 生成指定范围内的随机日期
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// 生成随机兴趣列表
const randomInterests = () => {
  const interests = [
    'coding', 'reading', 'music', 'travel', 'photography',
    'cooking', 'gaming', 'sports', 'art', 'movies'
  ];
  const count = Math.floor(Math.random() * 3) + 1; // 1-3个兴趣
  const shuffled = [...interests].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// 生成随机用户数据
export const generateUsers = (count: number = 10) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 30, 0, 1); // 30年前的1月1日

  return Array.from({ length: count }, (_, i) => ({
    id: uuidv4(),
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    photoUrl: `https://example.com/photos/user${i + 1}.jpg`,
    bio: `This is a sample bio for User ${i + 1}. They enjoy various activities and have interesting experiences to share.`,
    interests: randomInterests(),
    birthDate: randomDate(startDate, now),
    createdAt: randomDate(startDate, now),
    updatedAt: now
  }));
};

// 生成匹配数据
export const generateMatches = (users: any[], count: number = 5) => {
  const matches = [];
  const usedPairs = new Set();

  for (let i = 0; i < count; i++) {
    let user1Index, user2Index;
    do {
      user1Index = Math.floor(Math.random() * users.length);
      user2Index = Math.floor(Math.random() * users.length);
    } while (user1Index === user2Index || 
             usedPairs.has(`${user1Index}-${user2Index}`) || 
             usedPairs.has(`${user2Index}-${user1Index}`));

    usedPairs.add(`${user1Index}-${user2Index}`);

    const now = new Date();
    const createdAt = randomDate(new Date(now.getFullYear() - 1, 0, 1), now);

    matches.push({
      id: uuidv4(),
      user1Id: users[user1Index].id,
      user2Id: users[user2Index].id,
      isMatched: Math.random() > 0.5, // 50%的概率匹配成功
      createdAt,
      updatedAt: now
    });
  }

  return matches;
};

// 生成消息数据
export const generateMessages = (users: any[], matches: any[], count: number = 20) => {
  const messages = [];
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 1, 0, 1);

  for (let i = 0; i < count; i++) {
    const match = matches[Math.floor(Math.random() * matches.length)];
    const senderId = Math.random() > 0.5 ? match.user1Id : match.user2Id;
    const receiverId = senderId === match.user1Id ? match.user2Id : match.user1Id;
    const createdAt = randomDate(startDate, now);

    messages.push({
      id: uuidv4(),
      senderId,
      receiverId,
      content: `Message ${i + 1}: This is a sample message between users.`,
      isRead: Math.random() > 0.3, // 70%的概率已读
      createdAt,
      updatedAt: now
    });
  }

  return messages;
};

// 生成完整的测试数据集
export const generatePresetData = () => {
  const users = generateUsers(10);
  const matches = generateMatches(users, 5);
  const messages = generateMessages(users, matches, 20);

  return {
    users,
    matches,
    messages
  };
};

// 预设数据
export const presetData = generatePresetData(); 