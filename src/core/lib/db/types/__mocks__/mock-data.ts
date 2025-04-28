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
import { DbProvider, SyncStrategy, DataMode, DbOrm, LogLevel, AppEnvironmentEnum } from '../common';

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

// 八字分析结构化样本（来自 bazi-example.json）
export const MOCK_BAZI_ANALYSIS = {
  user_info: {
    birthdate: {
      lunar: '1986年九月初三',
      solar: '1986年10月6日',
      time: '子时（23:00-01:00）'
    },
    gender: '未提供',
    location: '未提供'
  },
  bazi_analysis: {
    four_pillars: {
      year_pillar: '丙寅（火木）',
      month_pillar: '戊戌（土土）',
      day_pillar: '甲午（木火）',
      hour_pillar: '甲子（木水）'
    },
    five_elements: {
      distribution: {
        wood: 4,
        fire: 4,
        earth: 4,
        metal: 1,
        water: 2
      },
      imbalance: {
        strong_elements: ['木', '火', '土'],
        weak_elements: ['金', '水'],
        critical_weakness: '金（最弱）'
      }
    },
    health_tendency: {
      excess_symptoms: [
        '肝火旺（急躁、失眠）',
        '心火盛（口腔溃疡）',
      ],
      deficiency_symptoms: [
        '肺弱（易感冒、咳嗽）',
        '肾虚（怕冷、精力不足）'
      ]
    },
    remedial_actions: {
      priority: '补金、辅补水',
      metal_enhancement: {
        diet: ['银耳', '梨', '百合', '白萝卜'],
        accessories: ['银饰', '铂金', '白色水晶'],
        directions: ['西方']
      },
      water_support: {
        diet: ['黑豆', '黑芝麻', '海带'],
        lifestyle: ['多饮水', '养鱼', '靠近水域'],
        colors: ['黑色', '蓝色']
      },
      balance_advice: {
        avoid: ['熬夜', '辛辣食物', '红色/绿色过量使用'],
        recommend: ['山药健脾胃', '冥想降心火']
      }
    },
    fortune_timing: {
      auspicious_period: '2023-2032年金水运（如庚子、辛丑年）',
      caution_years: ['2025乙巳年（火旺）', '2026丙午年（火旺）']
    }
  },
  summary: '八字木火土过旺，需重点补金补水，调和能量失衡。建议结合出生地点与性别细化分析。',
  details: '详见 bazi-example.json，包含完整表格与建议说明。'
};

// ===== 通用数据库配置 Mock，用于测试 =====
export const MOCK_DB_CONFIG = {
  provider: DbProvider.MOCK,
  syncStrategy: SyncStrategy.MANUAL,
  dataMode: DataMode.OFFLINE,
  orm: DbOrm.FAKE,
  logLevel: LogLevel.DEBUG,
  environment: AppEnvironmentEnum.TEST,
};

// 可扩展更多实体的 mock 数据，如 Quiz、Notification、Settings 等
