export interface Location {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  images: string[];
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  users: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
} 