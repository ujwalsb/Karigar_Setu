import apiClient from './axios'
import type { ApiResponse, ServiceCategory } from '@/types'

export const categoriesApi = {
  getAll: (includeInactive?: boolean) =>
    apiClient.get<ApiResponse<ServiceCategory[]>>('/categories', {
      params: { includeInactive },
    }),

  getById: (id: number) => apiClient.get<ApiResponse<ServiceCategory>>(`/categories/${id}`),

  create: (data: { name: string; description?: string; icon?: string }) =>
    apiClient.post<ApiResponse<ServiceCategory>>('/categories', data),

  update: (id: number, data: Partial<ServiceCategory>) =>
    apiClient.put<ApiResponse<ServiceCategory>>(`/categories/${id}`, data),

  toggleActive: (id: number) =>
    apiClient.patch<ApiResponse<ServiceCategory>>(`/categories/${id}/toggle`),

  delete: (id: number) => apiClient.delete<ApiResponse<null>>(`/categories/${id}`),
}

