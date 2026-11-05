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
  getSettings: () => apiClient.get<ApiResponse<PlatformSettings>>('/settings'),

  updateSettings: (data: Partial<PlatformSettings>) =>
    apiClient.put<ApiResponse<PlatformSettings>>('/settings', data),

  resetSettings: () => apiClient.post<ApiResponse<PlatformSettings>>('/settings/reset'),
}

