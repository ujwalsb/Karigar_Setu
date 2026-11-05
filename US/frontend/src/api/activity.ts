import apiClient from './axios'
import type { ApiResponse } from '@/types'

export interface ActivityLog {
  id: number
  user_id: number | null
  action: string
  entity_type: string
  entity_id: number | null
  details: any
  ip_address: string
  created_at: string
  user_name?: string
  user_email?: string
  user_role?: string
}

export interface ActivityStats {
  totalLogs: number
  todayActions: number
  todayLogins: number
  todayLogouts: number
  activeUsersToday: number
}

export interface ActivityLogsResponse {
  rows: ActivityLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const activityApi = {
  getLogs: (params?: {
    page?: number
    limit?: number
    userId?: number | string
    action?: string
    entityType?: string
    search?: string
    dateFrom?: string
    dateTo?: string
  }) => apiClient.get<ApiResponse<ActivityLogsResponse>>('/activity', { params }),

  getStats: () => apiClient.get<ApiResponse<ActivityStats>>('/activity/stats'),

  getUserActivities: (userId: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<ActivityLogsResponse>>(`/activity/user/${userId}`, { params }),

  clearLogs: (days: number | 'all') =>
    apiClient.post<ApiResponse<{ affectedRows: number }>>('/activity/clear', { days }),
}

