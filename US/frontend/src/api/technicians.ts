import apiClient from './axios'
import type {
  ApiResponse,
  PaginatedResponse,
  Technician,
  TechnicianFormData,
  FindTechnicianParams,
} from '@/types'

export const techniciansApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    verificationStatus?: string
    availabilityStatus?: string
    serviceCategoryId?: number
    city?: string
    area?: string
    isActive?: boolean
  }) => apiClient.get<PaginatedResponse<Technician>>('/technicians', { params }),

  getById: (id: number) => apiClient.get<ApiResponse<Technician>>(`/technicians/${id}`),

  create: (data: TechnicianFormData) =>
    apiClient.post<ApiResponse<Technician>>('/technicians', data),

  update: (id: number, data: Partial<TechnicianFormData>) =>
    apiClient.put<ApiResponse<Technician>>(`/technicians/${id}`, data),

  delete: (id: number) => apiClient.delete<ApiResponse<null>>(`/technicians/${id}`),

  find: (params: FindTechnicianParams) =>
    apiClient.get<ApiResponse<Technician[]>>('/technicians/find', { params }),

  verify: (id: number, data: { status: string; reason?: string }) =>
    apiClient.post<ApiResponse<Technician>>(`/technicians/${id}/verify`, data),

  updateAvailability: (id: number, status: string) =>
    apiClient.patch<ApiResponse<Technician>>(`/technicians/${id}/availability`, { status }),

  uploadDocument: (id: number, formData: FormData) =>
    apiClient.post<ApiResponse<any>>(
      `/documents/upload/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  uploadPhoto: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('doc_type', 'profile_photo')
    return apiClient.post<ApiResponse<any>>(`/documents/upload/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getDocuments: (id: number) =>
    apiClient.get<ApiResponse<import('@/types').TechnicianDocument[]>>(`/documents/technician/${id}`),

  verifyDocument: (docId: number) =>
    apiClient.patch<ApiResponse<any>>(`/documents/${docId}/verify`),

  deleteDocument: (docId: number) =>
    apiClient.delete<ApiResponse<any>>(`/documents/${docId}`),

  getServiceHistory: (id: number, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<import('@/types').ServiceRequest>>(
      `/technicians/${id}/service-history`,
      { params }
    ),

  getHistory: (id: number) =>
    apiClient.get<ApiResponse<any[]>>(`/technicians/${id}/history`),
}

