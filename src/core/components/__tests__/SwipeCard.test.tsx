import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { SwipeCard } from '@/mobile/components/cards/SwipeCard';
import { User } from '@/core/lib/db/types/user';
import { Photo } from '@/core/lib/db/types/photo';

const mockUser: User = {
  id: '1',
  name: '测试用户',
  birthDate: new Date('1998-01-01'),
  gender: 'male',
  photos: [
    {
      id: '1',
      url: 'https://picsum.photos/400/600?random=1',
      order: 0,
      isMain: true,
      userId: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  bio: '测试简介',
  interests: ['测试', '阅读'],
  location: { 
    latitude: 39.9042, 
    longitude: 116.4074,
    city: '北京',
    country: '中国'
  },
  preferences: {
    ageRange: { min: 18, max: 35 },
    distance: 50,
    gender: ['female'],
    interests: ['测试', '阅读']
  },
  isVerified: true,
  lastActive: new Date(),
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('SwipeCard', () => {
  it('renders user information correctly', () => {
    const { getByText } = render(<SwipeCard user={mockUser} onSwipe={() => {}} />);
    
    const age = new Date().getFullYear() - mockUser.birthDate.getFullYear();
    expect(getByText(`${mockUser.name}, ${age}`)).toBeDefined();
    expect(getByText(mockUser.bio!)).toBeDefined();
    mockUser.interests.forEach(interest => {
      expect(getByText(interest)).toBeDefined();
    });
  });

  it('calls onSwipe with "right" when swiped right', () => {
    let swipeDirection = '';
    const onSwipe = (direction: string) => {
      swipeDirection = direction;
    };
    const { container } = render(<SwipeCard user={mockUser} onSwipe={onSwipe} />);
    
    // Simulate right swipe
    fireEvent.mouseDown(container.firstChild!, { clientX: 0 });
    fireEvent.mouseMove(container.firstChild!, { clientX: 300 });
    fireEvent.mouseUp(container.firstChild!);
    
    expect(swipeDirection).toBe('right');
  });

  it('calls onSwipe with "left" when swiped left', () => {
    let swipeDirection = '';
    const onSwipe = (direction: string) => {
      swipeDirection = direction;
    };
    const { container } = render(<SwipeCard user={mockUser} onSwipe={onSwipe} />);
    
    // Simulate left swipe
    fireEvent.mouseDown(container.firstChild!, { clientX: 300 });
    fireEvent.mouseMove(container.firstChild!, { clientX: 0 });
    fireEvent.mouseUp(container.firstChild!);
    
    expect(swipeDirection).toBe('left');
  });
}); 