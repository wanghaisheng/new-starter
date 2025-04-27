// 全局 mock 数据定义，供所有测试/仓储/服务/页面复用
import type { User } from '../user.types';
import type { Location } from '../location.types';
import type { Photo } from '../photo.types';
import type { Match } from '../match.types';
import type { Message } from '../message.types';
import type { UserPreferences, NotificationSettings, PrivacySettings, SecuritySettings } from '../user.types';
import type { QuizType, Quiz, QuizQuestion, QuizAnswer, QuizResult, QuizProgress, QuizMatchRule } from '../quiz.types';
import type { Notification } from '../notification.types';
import type { Settings, UserSettings } from '../settings.types';

export const MOCK_LOCATIONS: Location[] = [
  { latitude: 0, longitude: 0, city: 'Beijing', country: 'CN' },
  { latitude: 1, longitude: 1, city: 'Shanghai', country: 'CN' },
];

export const MOCK_PHOTOS: Photo[] = [
  {
    id: 'p1',
    userId: '1',
    url: 'https://example.com/photo1.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'p2',
    userId: '2',
    url: 'https://example.com/photo2.jpg',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

export const MOCK_USER_PREFERENCES: UserPreferences[] = [
  {
    ageRange: { min: 18, max: 30 },
    distance: 50,
    gender: ['male'],
    interests: ['reading'],
    language: 'zh',
    theme: { darkMode: false, accentColor: '#ff6600' },
  },
  {
    ageRange: { min: 20, max: 35 },
    distance: 100,
    gender: ['female'],
    interests: ['sports'],
    language: 'en',
    theme: { darkMode: true, accentColor: '#0066ff' },
  },
];

export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings[] = [
  {
    newMatches: true,
    matchMessages: true,
    profileViews: true,
    profileLikes: true,
    appUpdates: false,
    promotions: false,
  },
  {
    newMatches: false,
    matchMessages: true,
    profileViews: false,
    profileLikes: true,
    appUpdates: true,
    promotions: true,
  },
];

export const MOCK_PRIVACY_SETTINGS: PrivacySettings[] = [
  {
    showProfileToEveryone: true,
    showOnlineStatus: true,
    showLastActive: true,
    showInDiscovery: true,
    showDistance: true,
    allowDataCollection: false,
    allowPersonalizedAds: false,
    showEmailToMatches: false,
    showPhoneToMatches: false,
    allowProfileSharing: true,
  },
  {
    showProfileToEveryone: false,
    showOnlineStatus: false,
    showLastActive: false,
    showInDiscovery: false,
    showDistance: false,
    allowDataCollection: true,
    allowPersonalizedAds: true,
    showEmailToMatches: true,
    showPhoneToMatches: true,
    allowProfileSharing: false,
  },
];

export const MOCK_SECURITY_SETTINGS: SecuritySettings[] = [
  {
    twoFactorEnabled: true,
    emailNotifications: true,
    loginAlerts: false,
  },
  {
    twoFactorEnabled: false,
    emailNotifications: false,
    loginAlerts: true,
  },
];

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Alice',
    birthDate: '1990-01-01',
    gender: 'female',
    photos: [MOCK_PHOTOS[0]],
    interests: ['reading'],
    location: MOCK_LOCATIONS[0],
    privacySettings: MOCK_PRIVACY_SETTINGS[0],
    preferences: MOCK_USER_PREFERENCES[0],
    notificationSettings: MOCK_NOTIFICATION_SETTINGS[0],
    securitySettings: MOCK_SECURITY_SETTINGS[0],
    email: 'alice@example.com',
    phone: '1234567890',
    isVerified: true,
    lastActive: new Date('2025-04-01T12:00:00Z'),
    isOnline: true,
    status: 'active',
    unreadNotifications: 2,
    tags: ['premium'],
    mbti: 'INTJ',
    ext: {},
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-04-01T12:00:00Z',
  },
  {
    id: '2',
    name: 'Bob',
    birthDate: '1985-05-20',
    gender: 'male',
    photos: [MOCK_PHOTOS[1]],
    interests: ['sports'],
    location: MOCK_LOCATIONS[1],
    privacySettings: MOCK_PRIVACY_SETTINGS[1],
    preferences: MOCK_USER_PREFERENCES[1],
    notificationSettings: MOCK_NOTIFICATION_SETTINGS[1],
    securitySettings: MOCK_SECURITY_SETTINGS[1],
    email: 'bob@example.com',
    phone: '0987654321',
    isVerified: false,
    lastActive: new Date('2025-04-02T08:00:00Z'),
    isOnline: false,
    status: 'inactive',
    unreadNotifications: 0,
    tags: ['newbie'],
    mbti: 'ENFP',
    ext: {},
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-04-02T08:00:00Z',
  },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    userAId: '1',
    userBId: '2',
    status: 'active',
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-04-02T00:00:00Z',
    ext: {},
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg1',
    senderId: '1',
    receiverId: '2',
    content: 'Hello Bob!',
    type: 'text',
    status: 'sent',
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-01T10:00:00Z',
    conversationId: 'm1',
    ext: {},
  },
];

export const MOCK_QUIZ_TYPES: QuizType[] = [
  {
    id: 'qt1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    name: 'Personality Test',
    description: 'Test your personality',
    scoringRule: 'standard',
    categoryRule: 'default',
    type: 'personality',
  },
  {
    id: 'qt2',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    name: 'Love Test',
    description: 'Test your love style',
    scoringRule: 'standard',
    categoryRule: 'default',
    type: 'love',
  },
];

export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'qq1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    quizId: 'qz1',
    type: 'single',
    content: 'What is your favorite color?',
    options: [
      { value: 'red', label: 'Red', score: 1 },
      { value: 'blue', label: 'Blue', score: 2 },
    ],
    order: 1,
  },
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'qz1',
    title: 'Personality Quiz',
    description: 'A quiz to test your personality.',
    type: MOCK_QUIZ_TYPES[0],
    questions: MOCK_QUIZ_QUESTIONS,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ext: {},
  },
];

export const MOCK_QUIZ_ANSWERS: QuizAnswer[] = [
  { questionId: 'qq1', answer: 'red', score: 1 },
];

export const MOCK_QUIZ_RESULTS: QuizResult[] = [
  {
    id: 'qr1',
    userId: '1',
    quizId: 'qz1',
    answers: MOCK_QUIZ_ANSWERS,
    tags: ['creative'],
    report: { summary: 'You are creative!' },
    score: 95,
    createdAt: '2025-01-01T01:00:00Z',
    updatedAt: '2025-01-01T01:00:00Z',
    ext: {},
  },
];

export const MOCK_QUIZ_PROGRESS: QuizProgress[] = [
  {
    id: 'qp1',
    userId: '1',
    quizId: 'qz1',
    currentQuestionIndex: 0,
    answers: { qq1: 1 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ext: {},
  },
];

export const MOCK_QUIZ_MATCH_RULES: QuizMatchRule[] = [
  {
    id: 'qmr1',
    quizType: 'personality',
    rule: 'match-similar',
    description: 'Match similar personalities',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ext: {},
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: '1',
    type: 'system',
    title: 'Welcome!',
    content: 'Thanks for joining.',
    status: 'unread',
    createdAt: '2025-04-01T12:00:00Z',
    updatedAt: '2025-04-01T12:00:00Z',
    ext: {},
  },
];

export const MOCK_SETTINGS: Settings[] = [
  {
    id: 's1',
    userId: '1',
    key: 'theme',
    value: 'dark',
    createdAt: '2025-04-01T12:00:00Z',
    updatedAt: '2025-04-01T12:00:00Z',
    ext: {},
  },
];

export const MOCK_USER_SETTINGS: UserSettings[] = [
  {
    theme: 'dark',
    language: 'zh',
    notificationsEnabled: true,
  },
  {
    theme: 'light',
    language: 'en',
    notificationsEnabled: false,
  },
];

// 可扩展更多实体的 mock 数据，如 Quiz、Notification、Settings 等
