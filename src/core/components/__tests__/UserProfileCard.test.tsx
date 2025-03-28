import '../test/env';
import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { UserProfileCard } from '../UserProfileCard';

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

describe('UserProfileCard', () => {
  it('renders user information correctly', () => {
    const { getByText } = render(<UserProfileCard user={mockUser} />);
    
    expect(getByText(`${mockUser.name}, ${mockUser.age}`)).toBeDefined();
    expect(getByText(mockUser.bio)).toBeDefined();
    expect(getByText('关于我')).toBeDefined();
    expect(getByText('兴趣爱好')).toBeDefined();
    mockUser.interests.forEach(interest => {
      expect(getByText(interest)).toBeDefined();
    });
  });

  it('shows edit button when editable is true', () => {
    let editClicked = false;
    const onEdit = () => {
      editClicked = true;
    };
    const { getByRole } = render(
      <UserProfileCard user={mockUser} editable={true} onEdit={onEdit} />
    );
    
    const editButton = getByRole('button');
    expect(editButton).toBeDefined();
    
    fireEvent.click(editButton);
    expect(editClicked).toBe(true);
  });

  it('does not show edit button when editable is false', () => {
    const { queryByRole } = render(
      <UserProfileCard user={mockUser} editable={false} />
    );
    
    const editButton = queryByRole('button');
    expect(editButton).toBeNull();
  });

  it('displays location coordinates correctly', () => {
    const { getByText } = render(<UserProfileCard user={mockUser} />);
    
    const locationText = `${mockUser.location.latitude.toFixed(4)}, ${mockUser.location.longitude.toFixed(4)}`;
    expect(getByText(locationText)).toBeDefined();
  });

  it('displays join date correctly', () => {
    const { getByText } = render(<UserProfileCard user={mockUser} />);
    
    const joinDate = new Date(mockUser.createdAt).toLocaleDateString();
    expect(getByText(`加入时间：${joinDate}`)).toBeDefined();
  });
}); 