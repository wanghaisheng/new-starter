export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  images: string[];
  location: string;
  interests: string[];
  gender: 'male' | 'female' | 'other';
  lookingFor: ('male' | 'female' | 'other')[];
  lastActive: Date;
}

export interface Match {
  id: string;
  users: [string, string]; // 两个用户ID
  timestamp: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
} 