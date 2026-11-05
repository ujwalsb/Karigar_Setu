import apiClient from './axios'
import type {
  ApiResponse,
  PaginatedResponse,
  CustomerCall,
  CallNote,
  NewCallFormData,
} from '@/types'

export const callsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    urgency?: string
    assignedToId?: number
    startDate?: string
    endDate?: string
  }) => apiClient.get<PaginatedResponse<CustomerCall>>('/calls', { params }),

  getById: (id: number) => apiClient.get<ApiResponse<CustomerCall>>(`/calls/${id}`),

  create: (data: Partial<NewCallFormData>) =>
    apiClient.post<ApiResponse<CustomerCall>>('/calls', data),

  update: (id: number, data: Partial<CustomerCall>) =>
    apiClient.put<ApiResponse<CustomerCall>>(`/calls/${id}`, data),

  updateStatus: (id: number, status: string, notes?: string) =>
    apiClient.patch<ApiResponse<CustomerCall>>(`/calls/${id}/status`, { status, notes }),

  addNote: (id: number, note: string) =>
    apiClient.post<ApiResponse<CallNote>>(`/calls/${id}/notes`, { note }),

  getNotes: (id: number) =>
    apiClient.get<ApiResponse<CallNote[]>>(`/calls/${id}/notes`),

  getMyCalls: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<CustomerCall>>('/calls/my', { params }),

  getRecent: (limit?: number) =>
    apiClient.get<ApiResponse<CustomerCall[]>>('/calls/recent', { params: { limit } }),
}

