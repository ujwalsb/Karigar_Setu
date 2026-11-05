import React, { createContext, useContext, useState, useEffect } from 'react'
import { settingsApi, PlatformSettings } from '@/api/settings'

const DEFAULT_SETTINGS: PlatformSettings = {
  theme: 'light',
  primary_color: 'indigo',
  compact_mode: 'false',
  sidebar_style: 'dark',
  platform_name: 'Karigar Setu',
  tagline: 'Connecting Skills & Needs - Appliance & Technician Hub',
  company_name: 'Karigar Setu',
  support_phone: '+91 8805224580',
  support_email: 'support@karigarsetu.local',
  business_address: 'Pune, Maharashtra 411001',
  default_city: 'Pune',
  default_state: 'Maharashtra',
  currency_symbol: '₹',
  default_warranty_days: '30',
  standard_inspection_fee: '199',
  auto_dispatch_radius_km: '15',
  require_kyc_for_dispatch: 'true',
  whatsapp_notifications_enabled: 'true',
  sms_notifications_enabled: 'true',
  email_notifications_enabled: 'false',
  dispatch_whatsapp_template: `🔧 *{{platform_name}} - NEW JOB DISPATCH* 🔧
━━━━━━━━━━━━━━━━━━━━
{{urgency_emoji}} *Job ID:* #{{job_id}}
🛠️ *Category:* {{service_category}}
⚡ *Urgency:* {{urgency}}
{{preferred_slot}}
👤 *CUSTOMER DETAILS:*
• *Name:* {{customer_name}}
• *Mobile:* {{customer_phone}}

📍 *CUSTOMER LOCATION / ADDRESS:*
{{customer_address}}
🗺️ *Google Maps:* {{maps_url}}

📝 *CUSTOMER REQUIREMENT / ISSUE:*
{{requirement}}

━━━━━━━━━━━━━━━━━━━━
⚠️ *Technician Instructions:*
1. Call the customer immediately to confirm your visit & ETA.
2. Carry your {{platform_name}} ID card and safety gear.
3. Update service status once inspection is complete.`,
  report_link_whatsapp_template: `🛠️ *{{platform_name}} - WORK COMPLETION REPORT* 🛠️
━━━━━━━━━━━━━━━━━━━━
Hi *{{technician_name}}*,
Please submit your job completion report for *#{{job_id}}*:

👤 *Customer:* {{customer_name}}
🔧 *Category:* {{service_category}}

👉 *Click here to submit charges, parts & machine photo:*
{{report_link}}

📌 *Required Information:*
{{required_items}}

Please submit this immediately after completing the service. Thank you!`,
  default_whatsapp_tech_template:
    'Hello {{technician_name}}, you have been assigned to Call #{{request_id}} for {{customer_name}} at {{area}}. Customer Mobile: {{customer_mobile}}.',
  default_whatsapp_customer_template:
    'Dear {{customer_name}}, technician {{technician_name}} (Phone: {{technician_mobile}}) has been assigned for your {{service_name}} service.',
  session_timeout_hours: '8',
  allow_staff_delete_records: 'false',
}

interface SettingsContextValue {
  settings: PlatformSettings
  loading: boolean
  updateSettings: (data: Partial<PlatformSettings>) => Promise<void>
  resetSettings: () => Promise<void>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    // Read cached local settings if present
    const cached = localStorage.getItem('us_platform_settings')
    if (cached) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) }
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_SETTINGS
  })
  const [loading, setLoading] = useState(false)

  // Apply theme classes to DOM
  const applyThemeToDOM = (theme: string, primaryColor: string) => {
    const root = document.documentElement

    // 1. Dark / Light mode
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) root.classList.add('dark')
      else root.classList.remove('dark')
    } else {
      root.classList.remove('dark')
    }

    // 2. Primary Color theme attribute
    root.setAttribute('data-theme-color', primaryColor || 'indigo')
  }

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await settingsApi.getSettings()
      const data = res.data?.data || res.data
      if (data) {
        const merged = { ...DEFAULT_SETTINGS, ...data }
        setSettings(merged)
        localStorage.setItem('us_platform_settings', JSON.stringify(merged))
        applyThemeToDOM(merged.theme, merged.primary_color)
      }
    } catch (err) {
      console.warn('Could not fetch server settings, using defaults/cached:', err)
      applyThemeToDOM(settings.theme, settings.primary_color)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleUpdateSettings = async (data: Partial<PlatformSettings>) => {
    const updated = { ...settings, ...data }
    setSettings(updated)
    localStorage.setItem('us_platform_settings', JSON.stringify(updated))
    applyThemeToDOM(updated.theme, updated.primary_color)

    // Save to backend
    await settingsApi.updateSettings(data)
  }

  const handleResetSettings = async () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('us_platform_settings')
    applyThemeToDOM(DEFAULT_SETTINGS.theme, DEFAULT_SETTINGS.primary_color)
    await settingsApi.resetSettings()
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings: handleUpdateSettings,
        resetSettings: handleResetSettings,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

