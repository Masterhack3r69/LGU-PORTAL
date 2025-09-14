import type { LoginCredentials, LoginResponse, User } from '../types';
import apiService from './api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return await apiService.post<LoginResponse>('/auth/login', credentials);
  }

  async logout(): Promise<void> {
    await apiService.post('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    return await apiService.get<User>('/auth/me');
  }

  async checkSession(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await apiService.get<{ valid: boolean; user?: User }>('/auth/check-session');
      return response;
    } catch {
      return { valid: false };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    return await apiService.put<User>('/auth/profile', profileData);
  }
}

export const authService = new AuthService();
export default authService;