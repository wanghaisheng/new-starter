import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { User } from '@/core/lib/db/types/user';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

class APIClient {
  private static instance: APIClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/mobile/v1';
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data: APIResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data as T;
  }

  // Auth API
  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: User; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  // User API
  async getCurrentUser() {
    return this.request<User>('/users/me');
  }

  async getUsers() {
    return this.request<User[]>('/users/all');
  }

  async updateUser(userId: string, data: Partial<User>) {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserPreferences() {
    return this.request<User['preferences']>('/users/preferences');
  }

  async updateUserPreferences(data: Partial<User['preferences']>) {
    return this.request<User['preferences']>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserPrivacySettings() {
    return this.request<User['privacySettings']>('/users/privacy');
  }

  async updateUserPrivacySettings(data: Partial<User['privacySettings']>) {
    return this.request<User['privacySettings']>('/users/privacy', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserNotificationSettings() {
    return this.request<User['notificationSettings']>('/users/notifications');
  }

  async updateUserNotificationSettings(data: Partial<User['notificationSettings']>) {
    return this.request<User['notificationSettings']>('/users/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Matches API
  async getUserMatches() {
    return this.request<Array<{ id: string; users: string[] }>>('/matches');
  }

  async createMatch(users: string[]) {
    return this.request<{ id: string; users: string[] }>('/matches', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  }

  async getMatchDetails(matchId: string) {
    return this.request<{ id: string; users: string[] }>(`/matches/${matchId}`);
  }

  // Messages API
  async getMessages(matchId: string) {
    return this.request<Array<{ id: string; content: string; senderId: string; createdAt: string }>>(`/messages?matchId=${matchId}`);
  }

  async sendMessage(data: { matchId: string; content: string; type?: string }) {
    return this.request<{ id: string; content: string; senderId: string; createdAt: string }>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUnreadMessageCount(matchId?: string) {
    const endpoint = matchId 
      ? `/matches/messages/unread?matchId=${matchId}`
      : '/matches/messages/unread';
    return this.request<number>(endpoint);
  }

  // Tests API
  async getTestTypes() {
    return this.request<Array<{ id: string; name: string; description: string }>>('/tests');
  }

  async getTestDetails(testId: string) {
    return this.request<{ id: string; name: string; description: string; questions: any[] }>(`/tests/${testId}`);
  }

  async getTestProgress(testId: string) {
    return this.request<{ currentQuestionIndex: number; answers: Record<string, any> }>(`/tests/progress?testId=${testId}`);
  }

  async getTestResults(testId: string) {
    return this.request<{ score: number; details: any }>(`/tests/results?testId=${testId}`);
  }
}

export const apiClient = APIClient.getInstance(); 