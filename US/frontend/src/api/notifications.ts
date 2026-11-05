import apiClient from './axios'
import type { ApiResponse, PaginatedResponse, Notification } from '@/types'

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<null>>('/notifications/read-all'),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/notifications/${id}`),
}

