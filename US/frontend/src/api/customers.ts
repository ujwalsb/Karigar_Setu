import apiClient from './axios'
import type { ApiResponse, PaginatedResponse, Customer, CustomerFormData } from '@/types'

export const customersApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    city?: string
    area?: string
  }) => apiClient.get<PaginatedResponse<Customer>>('/customers', { params }),

  getById: (id: number) => apiClient.get<ApiResponse<Customer>>(`/customers/${id}`),

  lookupByMobile: (mobile: string) =>
    apiClient.get<ApiResponse<any>>(`/customers/lookup?mobile=${encodeURIComponent(mobile)}`),

  searchByMobile: (mobile: string) =>
    apiClient.get<ApiResponse<Customer>>(`/customers/search?mobile=${mobile}`),

  create: (data: CustomerFormData) =>
    apiClient.post<ApiResponse<Customer>>('/customers', data),

  update: (id: number, data: Partial<CustomerFormData>) =>
    apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data),

  delete: (id: number) => apiClient.delete<ApiResponse<null>>(`/customers/${id}`),

  getCallHistory: (id: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<import('@/types').CustomerCall>>(`/customers/${id}/calls`, { params }),

  getServiceDetails: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/customers/${id}/service-details`),
}

