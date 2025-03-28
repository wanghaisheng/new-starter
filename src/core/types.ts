export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  age: number;
  bio: string;
  images: string[];
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
} 