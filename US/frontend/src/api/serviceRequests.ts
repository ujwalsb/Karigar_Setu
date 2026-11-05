import apiClient from './axios'
import type { ApiResponse, PaginatedResponse, ServiceRequest, TechnicianAssignment } from '@/types'

export const serviceRequestsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    status?: string
    technicianId?: number
    customerId?: number
    callId?: number
    assignedById?: number
    startDate?: string
    endDate?: string
  }) => apiClient.get<PaginatedResponse<ServiceRequest>>('/service-requests', { params }),

  getById: (id: number) => apiClient.get<ApiResponse<ServiceRequest>>(`/service-requests/${id}`),

  create: (data: { callId: number; technicianId?: number }) =>
    apiClient.post<ApiResponse<ServiceRequest>>('/service-requests', data),

  updateStatus: (id: number, status: string, notes?: string) =>
    apiClient.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}/status`, {
      status,
      notes,
    }),

  assign: (id: number, data: {
    technicianId?: number
    technician_id?: number
    notes?: string
    scheduledVisitDate?: string
    scheduledVisitTime?: string
  }) => {
    const techId = data.technician_id || data.technicianId
    return apiClient.post<ApiResponse<TechnicianAssignment>>(`/service-requests/${id}/assign`, {
      ...data,
      technician_id: techId,
      technicianId: techId
    })
  },

  reassign: (id: number, data: { technicianId?: number; technician_id?: number; reason?: string }) => {
    const techId = data.technician_id || data.technicianId
    return apiClient.post<ApiResponse<TechnicianAssignment>>(`/service-requests/${id}/reassign`, {
      ...data,
      technician_id: techId,
      technicianId: techId
    })
  },

  updateAssignment: (id: number, assignmentId: number, data: Partial<TechnicianAssignment>) =>
    apiClient.put<ApiResponse<TechnicianAssignment>>(
      `/service-requests/${id}/assignments/${assignmentId}`,
      data
    ),

  complete: (id: number, data: {
    workDescription?: string
    partsReplaced?: string
    laborCharge?: number
    partsCharge?: number
    actualCost?: number
    amountTaken?: number
    paymentStatus?: string
    paymentMode?: string
    status?: string
    notes?: string
  }) => apiClient.post<ApiResponse<ServiceRequest>>(`/service-requests/${id}/complete`, data),

  getDispatch: (id: number) => apiClient.get<ApiResponse<any>>(`/service-requests/${id}/dispatch`),

  getSubmissionLink: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/service-requests/${id}/submission-link`),
}

