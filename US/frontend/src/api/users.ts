import apiClient from './axios'
import type { ApiResponse, PaginatedResponse, User, ActivityLog } from '@/types'

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; isActive?: boolean; search?: string }) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),

  getById: (id: number) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: Partial<User> & { password?: string }) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  toggleActive: (id: number) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/toggle`),

  delete: (id: number) => apiClient.delete<ApiResponse<null>>(`/users/${id}`),

  getActivityLogs: (params?: {
    page?: number
    limit?: number
    userId?: number
    action?: string
    startDate?: string
    endDate?: string
  }) => apiClient.get<PaginatedResponse<ActivityLog>>('/activity-logs', { params }),

  getPerformance: (id: number, params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<{
      totalCalls: number
      completedCalls: number
      cancelledCalls: number
      avgResponseTime: number
    }>>(`/users/${id}/performance`, { params }),
}

