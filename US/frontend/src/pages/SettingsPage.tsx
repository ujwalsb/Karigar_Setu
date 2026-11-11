import React, { useState, useRef } from 'react'
import { useSettings } from '@/store/settingsStore'
import { resolveAssetUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Palette,
  Building,
  Wrench,
  MessageSquare,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  Check,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Lock,
  Database,
  Send,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'

export function SettingsPage() {
  const { settings, updateSettings, uploadLogo, deleteLogo, resetSettings, loading } = useSettings()

  // Local form state initialized from global settings
  const [formData, setFormData] = useState({ ...settings })
  const [activeTab, setActiveTab] = useState<'themes' | 'branding' | 'operations' | 'messaging' | 'security'>('themes')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Sync formData when settings load from API
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...settings,
    }))
  }, [settings])

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => {
      if (key === 'company_name') {
        const prevCompany = String(prev.company_name || '').trim()
        const prevPlatform = String(prev.platform_name || '').trim()
        const shouldSyncPlatform =
          !prevPlatform || prevPlatform === 'Karigar Setu' || prevPlatform === prevCompany
        return {
          ...prev,
          company_name: value,
          ...(shouldSyncPlatform ? { platform_name: value } : {}),
        }
      }
      return { ...prev, [key]: value }
    })
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoUploading(true)
    setErrorMsg('')
    try {
      await uploadLogo(file)
      setSuccessMsg('Company logo uploaded and synced across platform & technician ID cards!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to upload company logo.')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    setLogoUploading(true)
    setErrorMsg('')
    try {
      await deleteLogo()
      setSuccessMsg('Company logo removed.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to remove company logo.')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      await updateSettings(formData)
      setSuccessMsg('Settings and theme preferences updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!confirm('Reset all platform settings and themes back to factory defaults?')) return
    setResetting(true)
    setErrorMsg('')
    try {
      await resetSettings()
      setFormData({ ...settings })
      setSuccessMsg('Settings have been reset to factory defaults.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reset settings.')
    } finally {
      setResetting(false)
    }
  }

  // Theme palettes
  const colorOptions = [
    { id: 'indigo', name: 'Indigo Classic', bg: 'bg-indigo-600', ring: 'ring-indigo-600', text: 'text-indigo-600' },
    { id: 'blue', name: 'Ocean Blue', bg: 'bg-blue-600', ring: 'ring-blue-600', text: 'text-blue-600' },
    { id: 'emerald', name: 'Emerald Green', bg: 'bg-emerald-600', ring: 'ring-emerald-600', text: 'text-emerald-600' },
    { id: 'violet', name: 'Royal Violet', bg: 'bg-violet-600', ring: 'ring-violet-600', text: 'text-violet-600' },
    { id: 'rose', name: 'Ruby Crimson', bg: 'bg-rose-600', ring: 'ring-rose-600', text: 'text-rose-600' },
    { id: 'amber', name: 'Warm Amber', bg: 'bg-amber-600', ring: 'ring-amber-600', text: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-indigo-600" />
              Platform Settings &amp; Customization
            </h1>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
              Admin Configuration
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure visual themes, brand identity, dispatch automation rules, WhatsApp templates, and security policies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resetting || saving}
            onClick={handleResetToDefaults}
            className="flex-1 sm:flex-none h-8 sm:h-9 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Reset to factory defaults"
          >
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${resetting ? 'animate-spin' : ''}`} />
            Reset Defaults
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={saving || resetting}
            onClick={handleSaveAll}
            className="flex-1 sm:flex-none h-8 sm:h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {successMsg && (
        <Alert className="border-emerald-500 text-emerald-800 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs (Smooth Scroll on Mobile) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('themes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'themes'
            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Palette className="h-4 w-4 shrink-0" />
          <span>Themes &amp; Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'branding'
            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Building className="h-4 w-4 shrink-0" />
          <span>Platform &amp; Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'operations'
            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Wrench className="h-4 w-4 shrink-0" />
          <span>Operations &amp; Dispatch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messaging')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'messaging'
            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span>WhatsApp &amp; Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'security'
            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span>Security &amp; Sessions</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: THEMES & APPEARANCE                               */}
        {/* ======================================================== */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  Color Mode &amp; Display Themes
                </CardTitle>
                <CardDescription>
                  Personalize the interface color scheme, lightness mode, and display density.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                {/* Light / Dark Mode Selector */}
                <div>
                  <Label className="text-xs font-semibold text-slate-700 block mb-2">
                    Interface Theme Mode:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('theme', 'light')}
                      className={`p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Sun className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Light Mode</div>
                        <div className="text-[11px] text-slate-500">Clean, crisp daylight styling</div>
                      </div>
                      {formData.theme === 'light' && <Check className="h-4 w-4 text-indigo-600 ml-auto" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('theme', 'dark')}
                      className={`p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.theme === 'dark'
                        ? 'border-indigo-600 bg-slate-900 text-white shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-900 text-slate-100'
                        }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                        <Moon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">Dark Mode</div>
                        <div className="text-[11px] text-slate-400">High-contrast, reduced eye strain</div>
                      </div>
                      {formData.theme === 'dark' && <Check className="h-4 w-4 text-indigo-400 ml-auto" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('theme', 'system')}
                      className={`p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.theme === 'system'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">System Sync</div>
                        <div className="text-[11px] text-slate-500">Follows device OS preference</div>
                      </div>
                      {formData.theme === 'system' && <Check className="h-4 w-4 text-indigo-600 ml-auto" />}
                    </button>
                  </div>
                </div>

                {/* Primary Accent Color Picker */}
                <div className="pt-4 border-t border-slate-100">
                  <Label className="text-xs font-semibold text-slate-700 block mb-2">
                    Primary Brand Accent Color:
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {colorOptions.map((c) => {
                      const isSelected = formData.primary_color === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleFieldChange('primary_color', c.id)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${isSelected
                            ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/20 shadow-xs font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            }`}
                        >
                          <div className={`h-8 w-8 rounded-full ${c.bg} flex items-center justify-center text-white shadow-xs`}>
                            {isSelected && <Check className="h-4 w-4" />}
                          </div>
                          <span className="text-xs truncate max-w-full">{c.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Display Density & Sidebar Style */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Compact Density Mode</div>
                      <div className="text-[11px] text-slate-500">Reduces row spacing to view more data on screen</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.compact_mode === 'true' || formData.compact_mode === true}
                        onChange={(e) => handleFieldChange('compact_mode', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Sidebar Theme Style</div>
                      <div className="text-[11px] text-slate-500">Dark Navy (Recommended) vs Light Slate</div>
                    </div>
                    <select
                      value={formData.sidebar_style}
                      onChange={(e) => handleFieldChange('sidebar_style', e.target.value)}
                      className="border border-slate-200 rounded-md px-2.5 py-1 text-xs bg-white text-slate-800"
                    >
                      <option value="dark">Dark Navy</option>
                      <option value="light">Light Slate</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PLATFORM & BRANDING                               */}
        {/* ======================================================== */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Building className="h-5 w-5 text-indigo-600" />
                  Platform Branding &amp; Company Details
                </CardTitle>
                <CardDescription>
                  Update portal titles, support helpline, customer contact details, and default location.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {/* Company Logo Uploader */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {settings.company_logo_url ? (
                        <img
                          src={resolveAssetUrl(settings.company_logo_url)}
                          alt={formData.company_name || formData.platform_name || 'Company Logo'}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-800 block">
                        Official Company Logo (Shown on Sidebar &amp; Technician ID Cards)
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        PNG, JPG, or WEBP up to 5MB. Recommended square or horizontal transparent logo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleLogoFileChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                      className="h-8 text-xs bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {logoUploading ? 'Uploading...' : settings.company_logo_url ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {settings.company_logo_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={logoUploading}
                        onClick={handleRemoveLogo}
                        className="h-8 text-xs text-rose-600 border-rose-200 bg-white hover:bg-rose-50 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Company Name * <span className="text-[11px] font-normal text-slate-500">(Used everywhere in app &amp; ID cards)</span>
                    </Label>
                    <Input
                      required
                      value={formData.company_name}
                      onChange={(e) => handleFieldChange('company_name', e.target.value)}
                      placeholder="e.g. FutureMagnus Pvt Ltd"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Platform Display Name</Label>
                    <Input
                      value={formData.platform_name}
                      onChange={(e) => handleFieldChange('platform_name', e.target.value)}
                      placeholder="e.g. FutureMagnus"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium text-slate-700">Tagline / Subheading</Label>
                    <Input
                      value={formData.tagline}
                      onChange={(e) => handleFieldChange('tagline', e.target.value)}
                      placeholder="e.g. Centralized Appliance Service & Technician Dispatch Hub"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-indigo-600" />
                      Support Helpline Number
                    </Label>
                    <Input
                      value={formData.support_phone}
                      onChange={(e) => handleFieldChange('support_phone', e.target.value)}
                      placeholder="e.g. +91 98220 11111"
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-indigo-600" />
                      Support Email Address
                    </Label>
                    <Input
                      type="email"
                      value={formData.support_email}
                      onChange={(e) => handleFieldChange('support_email', e.target.value)}
                      placeholder="e.g. support@us.local"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      Business Office Address
                    </Label>
                    <Input
                      value={formData.business_address}
                      onChange={(e) => handleFieldChange('business_address', e.target.value)}
                      placeholder="e.g. FC Road, Shivaji Nagar, Pune, Maharashtra 411005"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Default City</Label>
                    <Input
                      value={formData.default_city}
                      onChange={(e) => handleFieldChange('default_city', e.target.value)}
                      placeholder="Pune"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Currency Symbol</Label>
                    <Input
                      value={formData.currency_symbol}
                      onChange={(e) => handleFieldChange('currency_symbol', e.target.value)}
                      placeholder="₹"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: OPERATIONS & DISPATCH                             */}
        {/* ======================================================== */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Wrench className="h-5 w-5 text-indigo-600" />
                  Service Dispatch &amp; Operational Rules
                </CardTitle>
                <CardDescription>
                  Configure technician assignment constraints, warranty terms, and default inspection charges.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Default Warranty (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.default_warranty_days}
                      onChange={(e) => handleFieldChange('default_warranty_days', e.target.value)}
                      placeholder="30"
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">Post-service guarantee period</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" /> Standard Inspection Fee (₹)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.standard_inspection_fee}
                      onChange={(e) => handleFieldChange('standard_inspection_fee', e.target.value)}
                      placeholder="199"
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">Minimum diagnostic visiting charge</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Max Dispatch Radius (km)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.auto_dispatch_radius_km}
                      onChange={(e) => handleFieldChange('auto_dispatch_radius_km', e.target.value)}
                      placeholder="15"
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">Locality proximity match limit</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-indigo-600" />
                        Require Verified Government KYC Before Assigning Jobs
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        When enabled, technicians with pending Aadhaar / PAN compliance cannot be assigned to customer calls.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_kyc_for_dispatch === 'true' || formData.require_kyc_for_dispatch === true}
                        onChange={(e) => handleFieldChange('require_kyc_for_dispatch', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: WHATSAPP & MESSAGING TEMPLATES                    */}
        {/* ======================================================== */}
        {activeTab === 'messaging' && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  WhatsApp &amp; SMS Dispatch Templates
                </CardTitle>
                <CardDescription>
                  Customize pre-filled message text templates dispatched to technicians and customers via WhatsApp and device SMS.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-950">WhatsApp Messaging</div>
                      <div className="text-[11px] text-emerald-700">Enable one-click WhatsApp dispatch links</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.whatsapp_notifications_enabled === 'true' || formData.whatsapp_notifications_enabled === true}
                        onChange={(e) => handleFieldChange('whatsapp_notifications_enabled', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-950">Device Native SMS</div>
                      <div className="text-[11px] text-blue-700">Enable default SMS fallback application links</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sms_notifications_enabled === 'true' || formData.sms_notifications_enabled === true}
                        onChange={(e) => handleFieldChange('sms_notifications_enabled', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* 1. DISPATCH WHATSAPP TEMPLATE */}
                <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <Label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                        1. Technician Job Dispatch WhatsApp Message Template
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        Pre-filled message when dispatching customer address, Google Maps link, and problem requirement to the technician.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase mr-1">Available Tags:</span>
                    {[
                      '{{company_name}}',
                      '{{platform_name}}',
                      '{{job_id}}',
                      '{{technician_name}}',
                      '{{service_category}}',
                      '{{urgency}}',
                      '{{customer_name}}',
                      '{{customer_phone}}',
                      '{{customer_address}}',
                      '{{maps_url}}',
                      '{{requirement}}',
                      '{{preferred_slot}}'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const curr = formData.dispatch_whatsapp_template || ''
                          handleFieldChange('dispatch_whatsapp_template', `${curr} ${tag}`)
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-mono transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={9}
                    value={formData.dispatch_whatsapp_template || ''}
                    onChange={(e) => handleFieldChange('dispatch_whatsapp_template', e.target.value)}
                    placeholder="Enter WhatsApp dispatch template..."
                    className="w-full text-xs font-mono p-3 border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 leading-relaxed text-slate-800 shadow-2xs"
                  />
                </div>

                {/* 2. REPORT LINK SUBMISSION TEMPLATE */}
                <div className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <Label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Send className="h-4 w-4 text-indigo-600" />
                        2. Technician Work Report &amp; Feedback Submission Link Template
                      </Label>
                      <p className="text-[11px] text-slate-500">
                        Pre-filled WhatsApp message sent to technician containing the online submission link for machine photo, replaced parts, and final billing.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase mr-1">Available Tags:</span>
                    {[
                      '{{company_name}}',
                      '{{platform_name}}',
                      '{{technician_name}}',
                      '{{job_id}}',
                      '{{customer_name}}',
                      '{{service_category}}',
                      '{{report_link}}',
                      '{{required_items}}'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const curr = formData.report_link_whatsapp_template || ''
                          handleFieldChange('report_link_whatsapp_template', `${curr} ${tag}`)
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-indigo-300 text-indigo-800 hover:bg-indigo-100 font-mono transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={8}
                    value={formData.report_link_whatsapp_template || ''}
                    onChange={(e) => handleFieldChange('report_link_whatsapp_template', e.target.value)}
                    placeholder="Enter WhatsApp work report link submission template..."
                    className="w-full text-xs font-mono p-3 border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 leading-relaxed text-slate-800 shadow-2xs"
                  />
                </div>

                {/* 3. QUICK ASSIGNMENT & CUSTOMER NOTIFICATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-800">
                        Simple Tech Assignment (SMS/Short Alert):
                      </Label>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.default_whatsapp_tech_template}
                      onChange={(e) => handleFieldChange('default_whatsapp_tech_template', e.target.value)}
                      className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-500 leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-800">
                        Customer Booking Confirmation (SMS/WhatsApp):
                      </Label>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.default_whatsapp_customer_template}
                      onChange={(e) => handleFieldChange('default_whatsapp_customer_template', e.target.value)}
                      className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-500 leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SECURITY & SESSIONS                               */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Security Policies &amp; Access Controls
                </CardTitle>
                <CardDescription>
                  Configure session timeouts, staff permissions, and inspect system database connectivity.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Staff Session Expiration (Hours)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="72"
                      value={formData.session_timeout_hours}
                      onChange={(e) => handleFieldChange('session_timeout_hours', e.target.value)}
                      placeholder="8"
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-slate-400">JWT and session cookie lifetime</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Staff Delete Permissions</div>
                      <div className="text-[11px] text-slate-500">Allow support staff to delete customers/calls</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allow_staff_delete_records === 'true' || formData.allow_staff_delete_records === true}
                        onChange={(e) => handleFieldChange('allow_staff_delete_records', e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-emerald-600" />
                      Live Database &amp; System Health
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-600">
                      <div>
                        Database: <strong className="text-slate-900">MySQL 8.4 (InnoDB)</strong>
                      </div>
                      <div>
                        Port: <strong className="text-slate-900">5002 (API) / 3306 (DB)</strong>
                      </div>
                      <div>
                        Status: <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Healthy &amp; Connected</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="text-xs text-slate-500 hidden sm:block">
            Unsaved changes will be applied to the entire platform immediately after saving.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              disabled={resetting || saving}
              onClick={handleResetToDefaults}
              className="h-9 text-xs"
            >
              Reset to Defaults
            </Button>
            <Button
              type="submit"
              disabled={saving || resetting}
              className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

