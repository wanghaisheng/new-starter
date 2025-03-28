import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { SwipeCard } from '../SwipeCard';

const mockUser = {
  id: '1',
  name: '测试用户',
  age: 25,
  bio: '测试简介',
  images: ['https://picsum.photos/400/600?random=1'],
  interests: ['测试', '阅读'],
  location: { latitude: 39.9042, longitude: 116.4074 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('SwipeCard', () => {
  it('renders user information correctly', () => {
    const { getByText } = render(<SwipeCard user={mockUser} onSwipe={() => {}} />);
    
    expect(getByText(`${mockUser.name}, ${mockUser.age}`)).toBeDefined();
    expect(getByText(mockUser.bio)).toBeDefined();
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