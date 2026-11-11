import apiClient from './axios'
import type { ApiResponse } from '@/types'

export interface PlatformSettings {
  // Appearance & Themes
  theme: 'light' | 'dark' | 'system'
  primary_color: 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber'
  compact_mode: string | boolean
  sidebar_style: 'dark' | 'light'

  // Platform & Branding
  platform_name: string
  tagline: string
  company_name: string
  company_logo_url?: string
  support_phone: string
  support_email: string
  business_address: string
  default_city: string
  default_state: string
  currency_symbol: string

  // Service & Dispatch Defaults
  default_warranty_days: string | number
  standard_inspection_fee: string | number
  auto_dispatch_radius_km: string | number
  require_kyc_for_dispatch: string | boolean

  // Notifications & Templates
  whatsapp_notifications_enabled: string | boolean
  sms_notifications_enabled: string | boolean
  email_notifications_enabled: string | boolean
  dispatch_whatsapp_template?: string
  report_link_whatsapp_template?: string
  default_whatsapp_tech_template: string
  default_whatsapp_customer_template: string

  // Security
  session_timeout_hours: string | number
  allow_staff_delete_records: string | boolean

  [key: string]: any
}

export const settingsApi = {
  getPublicSettings: () => apiClient.get<ApiResponse<Partial<PlatformSettings>>>('/settings/public'),

  getSettings: () => apiClient.get<ApiResponse<PlatformSettings>>('/settings'),

  updateSettings: (data: Partial<PlatformSettings>) =>
    apiClient.put<ApiResponse<PlatformSettings>>('/settings', data),

  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return apiClient.post<ApiResponse<{ company_logo_url: string; settings: PlatformSettings }>>(
      '/settings/logo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  deleteLogo: () =>
    apiClient.delete<ApiResponse<{ company_logo_url: string; settings: PlatformSettings }>>(
      '/settings/logo'
    ),

  resetSettings: () => apiClient.post<ApiResponse<PlatformSettings>>('/settings/reset'),
}

