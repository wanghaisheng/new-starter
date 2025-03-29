import { BaseEntity } from './base.types';

export interface User extends BaseEntity {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  photos: Photo[];
  bio?: string;
  interests: string[];
  location: Location;
  preferences: UserPreferences;
  isVerified: boolean;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
  activeDevices?: string[];
  lastActiveDevice?: string;
  sessionState?: {
    lastAction?: string;
    timestamp?: number;
    lastSync?: Date;
    [key: string]: any;
  };
}