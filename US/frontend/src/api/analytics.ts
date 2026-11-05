import apiClient from './axios'
import type { ApiResponse, DashboardStats, AnalyticsData } from '@/types'

export const analyticsApi = {
  getDashboardStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard'),

  getSupportDashboardStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/analytics/support-dashboard'),

  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<AnalyticsData>>('/analytics', { params }),

  getCallsOverTime: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) =>
    apiClient.get<ApiResponse<{ date: string; count: number }[]>>('/analytics/calls-over-time', { params }),

  getCategoryBreakdown: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<{ name: string; value: number; color: string }[]>>(
      '/analytics/category-breakdown',
      { params }
    ),

  getEmployeePerformance: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<{ name: string; calls: number; completed: number }[]>>(
      '/analytics/employee-performance',
      { params }
    ),

  getAreaWiseDemand: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiResponse<{ area: string; count: number }[]>>(
      '/analytics/area-wise-demand',
      { params }
    ),

  exportReport: (params?: { startDate?: string; endDate?: string; format?: 'csv' | 'excel' }) =>
    apiClient.get('/analytics/export', { params, responseType: 'blob' }),
}

