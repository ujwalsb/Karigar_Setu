import apiClient from './axios'
import type { ApiResponse, User, LoginCredentials } from '@/types'

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<ApiResponse<{ user: User }>>('/auth/login', credentials),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),

  getMe: () => apiClient.get<ApiResponse<User>>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<ApiResponse<null>>('/auth/change-password', data),

  setupAdmin: (data: { name: string; email: string; password: string }) =>
    apiClient.post<ApiResponse<User>>('/auth/setup-admin', data),
}

