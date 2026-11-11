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

export async function openTechnicianDocument(docId: number, fallbackMime?: string): Promise<void> {
  const newTab = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null
  if (newTab) {
    newTab.document.write(
      '<p style="font-family:system-ui,sans-serif;padding:24px;color:#475569;font-size:14px;">Loading document...</p>'
    )
  }

  try {
    const response = await apiClient.get(`/documents/${docId}/download`, {
      params: { inline: true },
      responseType: 'blob',
    })
    const rawContentType = response.headers?.['content-type']
    const contentType =
      typeof rawContentType === 'string' && rawContentType.trim()
        ? rawContentType
        : fallbackMime || 'application/octet-stream'
    const blob = new Blob([response.data], { type: contentType })
    const blobUrl = URL.createObjectURL(blob)

    if (newTab && !newTab.closed) {
      newTab.location.href = blobUrl
    } else if (typeof window !== 'undefined') {
      const link = document.createElement('a')
      link.href = blobUrl
      link.target = '_blank'
      link.rel = 'noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
    }

    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch (err: any) {
    if (newTab && !newTab.closed) {
      newTab.close()
    }
    let message = err?.message || 'Unable to load document.'
    const errBlob = err?.response?.data
    if (errBlob instanceof Blob) {
      try {
        const parsed = JSON.parse(await errBlob.text())
        if (parsed?.message) message = parsed.message
      } catch {
        // ignore non-JSON blob error payload
      }
    }
    throw new Error(message)
  }
}

