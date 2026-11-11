import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TechnicianIdCard } from '@/components/TechnicianIdCard'
import { useSettings } from '@/store/settingsStore'
import { techniciansApi } from '@/api/technicians'
import { resolveAssetUrl } from '@/lib/utils'
import {
  ID_CARD_THEMES,
  IdCardThemeKey,
  printTechnicianIdCard,
  downloadTechnicianIdCardPng,
} from '@/lib/idCard'
import {
  Contact2,
  Printer,
  Download,
  Pencil,
  Save,
  Camera,
  Upload,
  Trash2,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Palette,
  Eye,
} from 'lucide-react'

interface TechnicianIdCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  technician: any | null
  initialEditMode?: boolean
  initialEditTab?: 'technician' | 'company'
  isAdmin?: boolean
  onSaved?: () => void
}

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export function TechnicianIdCardModal({
  open,
  onOpenChange,
  technician,
  initialEditMode = false,
  initialEditTab = 'technician',
  isAdmin = false,
  onSaved,
}: TechnicianIdCardModalProps) {
  const { settings, updateSettings, uploadLogo, deleteLogo } = useSettings()

  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [editTab, setEditTab] = useState<'technician' | 'company'>(initialEditTab)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Technician draft fields
  const [fullName, setFullName] = useState('')
  const [designation, setDesignation] = useState('')
  const [badgeCode, setBadgeCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [alternateMobile, setAlternateMobile] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Pune')
  const [stateName, setStateName] = useState('Maharashtra')
  const [pinCode, setPinCode] = useState('')
  const [address, setAddress] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [cardTheme, setCardTheme] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('verified')
  const [availability, setAvailability] = useState('available')

  // Photo draft state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const lastOpenedKeyRef = useRef<string | null>(null)

  // Company draft fields
  const [companyName, setCompanyName] = useState('')
  const [platformName, setPlatformName] = useState('')
  const [tagline, setTagline] = useState('')
  const [supportPhone, setSupportPhone] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')

  // Logo draft state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoObjectUrl, setLogoObjectUrl] = useState<string | null>(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl)
    }
  }, [photoObjectUrl])

  useEffect(() => {
    return () => {
      if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl)
    }
  }, [logoObjectUrl])

  // Sync draft state only when modal opens or switches to a different technician
  useEffect(() => {
    if (!open || !technician) {
      lastOpenedKeyRef.current = null
      return
    }

    const openKey = `${technician.id}:${initialEditMode ? '1' : '0'}:${initialEditTab}`
    if (lastOpenedKeyRef.current === openKey) {
      return
    }
    lastOpenedKeyRef.current = openKey

    setIsEditing(isAdmin && initialEditMode)
    setEditTab(initialEditTab)
    setSuccessMsg('')
    setErrorMsg('')

    setFullName(technician.full_name || technician.name || '')
    setDesignation(technician.designation || '')
    setBadgeCode(technician.badge_code || '')
    setMobile(technician.mobile || '')
    setAlternateMobile(technician.alternate_mobile || technician.alt_mobile || '')
    setEmail(technician.email || '')
    setArea(technician.area || '')
    setCity(technician.city || settings.default_city || 'Pune')
    setStateName(technician.state || settings.default_state || 'Maharashtra')
    setPinCode(technician.pin_code || '')
    setAddress(technician.address || '')
    setBloodGroup(technician.blood_group || '')
    setValidUntil(
      technician.id_card_valid_until
        ? String(technician.id_card_valid_until).slice(0, 10)
        : ''
    )
    setCardTheme(technician.id_card_theme || '')
    setVerificationStatus(technician.verification_status || 'verified')
    setAvailability(technician.availability || 'available')

    setSavedPhotoUrl(technician.photo_url || null)
    setPhotoFile(null)
    setPhotoRemoved(false)
    if (photoObjectUrl) {
      URL.revokeObjectURL(photoObjectUrl)
      setPhotoObjectUrl(null)
    }

    setCompanyName(settings.company_name || '')
    setPlatformName(settings.platform_name || '')
    setTagline(settings.tagline || '')
    setSupportPhone(settings.support_phone || '')
    setSupportEmail(settings.support_email || '')
    setBusinessAddress(settings.business_address || '')

    setLogoFile(null)
    setLogoRemoved(false)
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl)
      setLogoObjectUrl(null)
    }
  }, [open, technician, settings, initialEditMode, initialEditTab, isAdmin])

  const previewTechnician = useMemo(() => {
    if (!technician) return null
    const nextPhoto = photoRemoved
      ? null
      : photoObjectUrl || savedPhotoUrl || null
    return {
      ...technician,
      full_name: fullName,
      name: fullName,
      designation: designation || null,
      badge_code: badgeCode || null,
      mobile,
      alternate_mobile: alternateMobile || null,
      email: email || null,
      area,
      city,
      state: stateName,
      pin_code: pinCode,
      address: address || null,
      blood_group: bloodGroup || null,
      id_card_valid_until: validUntil || null,
      id_card_theme: cardTheme || null,
      verification_status: verificationStatus,
      availability,
      photo_url: nextPhoto,
    }
  }, [
    technician,
    fullName,
    designation,
    badgeCode,
    mobile,
    alternateMobile,
    email,
    area,
    city,
    stateName,
    pinCode,
    address,
    bloodGroup,
    validUntil,
    cardTheme,
    verificationStatus,
    availability,
    photoRemoved,
    photoObjectUrl,
    savedPhotoUrl,
  ])

  const previewCompany = useMemo(() => {
    const nextLogo = logoRemoved
      ? ''
      : logoObjectUrl || settings.company_logo_url || ''
    return {
      ...settings,
      company_name: companyName,
      platform_name: platformName,
      tagline,
      support_phone: supportPhone,
      support_email: supportEmail,
      business_address: businessAddress,
      company_logo_url: nextLogo,
    }
  }, [
    settings,
    companyName,
    platformName,
    tagline,
    supportPhone,
    supportEmail,
    businessAddress,
    logoRemoved,
    logoObjectUrl,
  ])

  if (!technician || !previewTechnician) return null

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl)
    setPhotoFile(file)
    setPhotoObjectUrl(URL.createObjectURL(file))
    setPhotoRemoved(false)
    e.target.value = ''
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl)
    setLogoFile(file)
    setLogoObjectUrl(URL.createObjectURL(file))
    setLogoRemoved(false)
    e.target.value = ''
  }

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    setErrorMsg('')
    setSuccessMsg('')

    const trimmedName = fullName.trim()
    const cleanPhone = mobile.replace(/[\s\-\(\)]/g, '').trim()
    const trimmedArea = area.trim()

    if (!trimmedName) {
      setErrorMsg('Technician full name is required.')
      setEditTab('technician')
      return
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid phone number (at least 10 digits).')
      setEditTab('technician')
      return
    }
    if (!trimmedArea) {
      setErrorMsg('Primary location / area is required.')
      setEditTab('technician')
      return
    }

    setSaving(true)
    try {
      // 1. Update technician data
      const techPayload: Record<string, any> = {
        full_name: trimmedName,
        mobile: cleanPhone,
        alternate_mobile: alternateMobile.trim(),
        email: email.trim(),
        area: trimmedArea,
        city: city.trim() || 'Pune',
        state: stateName.trim() || 'Maharashtra',
        pin_code: pinCode.trim(),
        address: address.trim(),
        designation: designation.trim(),
        badge_code: badgeCode.trim(),
        id_card_valid_until: validUntil.trim(),
        blood_group: bloodGroup.trim(),
        id_card_theme: cardTheme.trim(),
        verification_status: verificationStatus,
        availability,
      }

      if (photoRemoved && !photoFile) {
        techPayload.photo_url = ''
      }

      await techniciansApi.update(technician.id, techPayload as any)

      // 2. Upload new technician photo if chosen
      if (photoFile) {
        const photoRes = await techniciansApi.uploadPhoto(technician.id, photoFile)
        const uploadedUrl = photoRes.data?.data?.photo_url
        if (uploadedUrl) {
          setSavedPhotoUrl(uploadedUrl)
        }
        setPhotoFile(null)
        if (photoObjectUrl) {
          URL.revokeObjectURL(photoObjectUrl)
          setPhotoObjectUrl(null)
        }
      } else if (photoRemoved) {
        setSavedPhotoUrl(null)
      }

      // 3. Update company info if any company fields changed
      const companyChanged =
        companyName !== (settings.company_name || '') ||
        platformName !== (settings.platform_name || '') ||
        tagline !== (settings.tagline || '') ||
        supportPhone !== (settings.support_phone || '') ||
        supportEmail !== (settings.support_email || '') ||
        businessAddress !== (settings.business_address || '')

      if (companyChanged) {
        const nextCompany = companyName.trim() || 'Karigar Setu'
        const prevCompany = (settings.company_name || '').trim()
        const prevPlatform = (settings.platform_name || '').trim()
        let nextPlatform = platformName.trim()
        if (
          !nextPlatform ||
          nextPlatform === 'Karigar Setu' ||
          (nextPlatform === prevPlatform && (prevPlatform === prevCompany || prevPlatform === 'Karigar Setu'))
        ) {
          nextPlatform = nextCompany
        }
        await updateSettings({
          company_name: nextCompany,
          platform_name: nextPlatform,
          tagline: tagline.trim(),
          support_phone: supportPhone.trim(),
          support_email: supportEmail.trim(),
          business_address: businessAddress.trim(),
        })
      }

      // 4. Upload or remove company logo if changed
      if (logoFile) {
        await uploadLogo(logoFile)
        setLogoFile(null)
        if (logoObjectUrl) {
          URL.revokeObjectURL(logoObjectUrl)
          setLogoObjectUrl(null)
        }
      } else if (logoRemoved && settings.company_logo_url) {
        await deleteLogo()
      }

      setPhotoRemoved(false)
      setLogoRemoved(false)
      setSuccessMsg('Technician ID card, company details, and branding saved successfully!')
      if (onSaved) onSaved()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to save ID card changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPng = async () => {
    setDownloading(true)
    try {
      await downloadTechnicianIdCardPng(previewTechnician, previewCompany)
    } finally {
      setDownloading(false)
    }
  }

  const activePhotoSrc = photoRemoved
    ? ''
    : photoObjectUrl || resolveAssetUrl(savedPhotoUrl)

  const activeLogoSrc = logoRemoved
    ? ''
    : logoObjectUrl || resolveAssetUrl(settings.company_logo_url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isEditing ? 'max-w-5xl' : 'max-w-lg'
          } max-h-[94vh] overflow-y-auto p-0 gap-0 bg-slate-50 border-slate-200 w-[95vw] sm:w-full transition-all`}
      >
        <DialogHeader className="p-4 sm:px-6 bg-white border-b border-slate-200 sticky top-0 z-20 pr-12">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <Contact2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Technician ID Card {isEditing ? 'Editor' : 'Preview'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {isEditing
                    ? 'Live edit technician photo, phone, location, and company logo & details.'
                    : 'Official technician badge generated from profile & company branding.'}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => printTechnicianIdCard(previewTechnician, previewCompany)}
                className="h-8 text-xs border-slate-300 text-slate-700"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print / PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={downloading}
                onClick={handleDownloadPng}
                className="h-8 text-xs border-slate-300 text-slate-700"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {downloading ? 'Exporting...' : 'Download PNG'}
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  variant={isEditing ? 'secondary' : 'default'}
                  onClick={() => setIsEditing((prev) => !prev)}
                  className={`h-8 text-xs ${isEditing
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Preview Only
                    </>
                  ) : (
                    <>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit ID Card
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6">
          {successMsg && (
            <Alert className="mb-4 border-emerald-500 text-emerald-800 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
              <AlertDescription className="text-xs font-medium">{successMsg}</AlertDescription>
            </Alert>
          )}

          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div
            className={`grid gap-6 items-start ${isEditing ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
              }`}
          >
            {/* Left / Center: Live ID Card Preview */}
            <div className={`${isEditing ? 'lg:col-span-5 lg:sticky lg:top-24' : ''} flex flex-col items-center`}>
              <TechnicianIdCard technician={previewTechnician} company={previewCompany} />
              {!isAdmin && (
                <p className="text-[11px] text-slate-400 mt-3 text-center">
                  Read-only ID card view. Only Administrators can edit technician or company card details.
                </p>
              )}
            </div>

            {/* Right: Live Editor Form (Admin Only) */}
            {isEditing && isAdmin && (
              <form
                onSubmit={handleSaveAll}
                className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Editor Section Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditTab('technician')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${editTab === 'technician'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    Technician Data & Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTab('company')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${editTab === 'company'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Company Info & Logo
                  </button>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {editTab === 'technician' ? (
                    <>
                      {/* Technician Photo Editor */}
                      <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-300 bg-white flex items-center justify-center shrink-0 shadow-xs">
                          {activePhotoSrc ? (
                            <img
                              src={activePhotoSrc}
                              alt="Technician"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Camera className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Label className="text-xs font-bold text-slate-800 block">
                            Technician Profile Photo
                          </Label>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={handlePhotoSelect}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => photoInputRef.current?.click()}
                              className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {activePhotoSrc ? 'Change Photo' : 'Upload Photo'}
                            </Button>
                            {activePhotoSrc && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPhotoFile(null)
                                  if (photoObjectUrl) {
                                    URL.revokeObjectURL(photoObjectUrl)
                                    setPhotoObjectUrl(null)
                                  }
                                  setPhotoRemoved(true)
                                }}
                                className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {photoFile ? `Selected: ${photoFile.name}` : 'JPG or PNG up to 10MB'}
                          </p>
                        </div>
                      </div>

                      {/* Identity */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Full Name *</Label>
                          <Input
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">ID / Badge Code</Label>
                          <Input
                            value={badgeCode}
                            onChange={(e) => setBadgeCode(e.target.value)}
                            placeholder={`TECH-${String(technician.id || 0).padStart(4, '0')}`}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Role / Designation</Label>
                          <Input
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Senior AC & Fridge Technician"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Email</Label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="technician@example.com"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Phone Numbers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Phone Number *</Label>
                          <Input
                            required
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Alternate Phone</Label>
                          <Input
                            value={alternateMobile}
                            onChange={(e) => setAlternateMobile(e.target.value)}
                            placeholder="Optional secondary number"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs font-medium text-slate-700">Area / Locality *</Label>
                          <Input
                            required
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">City</Label>
                          <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">State</Label>
                          <Input
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">PIN Code</Label>
                          <Input
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-700">Street / Full Address</Label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Optional street address shown on ID card"
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Status, Validity, Blood Group */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Verification</Label>
                          <select
                            value={verificationStatus}
                            onChange={(e) => setVerificationStatus(e.target.value)}
                            className="w-full h-8 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-800"
                          >
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Availability</Label>
                          <select
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                            className="w-full h-8 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-800"
                          >
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="offline">Offline</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Blood Group</Label>
                          <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="w-full h-8 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-800"
                          >
                            {BLOOD_GROUPS.map((bg) => (
                              <option key={bg || 'none'} value={bg}>
                                {bg || 'Not Set'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Valid Until</Label>
                          <Input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* Card Color Accent */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5 text-indigo-600" />
                          ID Card Header Color
                        </Label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCardTheme('')}
                            className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${!cardTheme
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            Company Default
                          </button>
                          {(Object.keys(ID_CARD_THEMES) as IdCardThemeKey[]).map((key) => {
                            const t = ID_CARD_THEMES[key]
                            const selected = cardTheme === key
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setCardTheme(key)}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium transition-all ${selected
                                    ? 'border-slate-900 bg-slate-100 font-bold text-slate-900'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                  }`}
                              >
                                <span className={`h-3 w-3 rounded-full ${t.swatchBg}`} />
                                {t.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Company Logo Editor */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                          {activeLogoSrc ? (
                            <img
                              src={activeLogoSrc}
                              alt="Company Logo"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Building2 className="h-7 w-7 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Label className="text-xs font-bold text-slate-800 block">
                            Company Logo
                          </Label>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            className="hidden"
                            onChange={handleLogoSelect}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              {activeLogoSrc ? 'Change Logo' : 'Upload Company Logo'}
                            </Button>
                            {activeLogoSrc && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setLogoFile(null)
                                  if (logoObjectUrl) {
                                    URL.revokeObjectURL(logoObjectUrl)
                                    setLogoObjectUrl(null)
                                  }
                                  setLogoRemoved(true)
                                }}
                                className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove Logo
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {logoFile ? `Selected: ${logoFile.name}` : 'PNG, JPG or WEBP up to 5MB'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Company Name</Label>
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Karigar Setu Pvt Ltd"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Platform Brand Name</Label>
                          <Input
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            placeholder="e.g. Karigar Setu"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-700">Company Tagline</Label>
                        <Input
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          placeholder="e.g. Verified Appliance Repair & Dispatch Hub"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Company Helpline Phone</Label>
                          <Input
                            value={supportPhone}
                            onChange={(e) => setSupportPhone(e.target.value)}
                            placeholder="+91 98220 11111"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-700">Support Email</Label>
                          <Input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            placeholder="support@company.com"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-700">Company Office Address</Label>
                        <Input
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="Full office address shown on ID card footer"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                        Note: Changes to company information and logo apply across all technician ID cards and platform branding.
                      </div>
                    </>
                  )}

                  {/* Save Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] text-slate-500">
                      Live Preview Active
                    </Badge>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="h-8 text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Done
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        size="sm"
                        className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {saving ? 'Saving ID Card...' : 'Save ID Card Changes'}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
