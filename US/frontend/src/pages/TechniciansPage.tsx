import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { techniciansApi } from '@/api/technicians'
import { categoriesApi } from '@/api/categories'
import { useAuth } from '@/store/authStore'
import { TechnicianDetailsModal } from '@/components/TechnicianDetailsModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Wrench,
  Search,
  Star,
  MapPin,
  UserCheck,
  Plus,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ShieldAlert,
  Camera,
  FileCheck,
  Upload,
  Eye,
  FileText,
  ExternalLink,
  Check,
  Receipt
} from 'lucide-react'

export function TechniciansPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const [technicians, setTechnicians] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Add technician form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [alternateMobile, setAlternateMobile] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Pune')
  const [pinCode, setPinCode] = useState('')
  const [experienceYears, setExperienceYears] = useState('5')
  const [rating, setRating] = useState('4.8')
  const [verificationStatus, setVerificationStatus] = useState('verified')
  const [availability, setAvailability] = useState('available')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [additionalAreas, setAdditionalAreas] = useState('')

  // Photo & Government Document upload state for Add Form
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [govDocType, setGovDocType] = useState('aadhaar_card')
  const [govDocNumber, setGovDocNumber] = useState('')
  const [govDocFile, setGovDocFile] = useState<File | null>(null)
  const [govDocFileName, setGovDocFileName] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Edit technician modal state (Admin only)
  const [editingTech, setEditingTech] = useState<any | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [editAlternateMobile, setEditAlternateMobile] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editCity, setEditCity] = useState('Pune')
  const [editPinCode, setEditPinCode] = useState('')
  const [editExperienceYears, setEditExperienceYears] = useState('5')
  const [editRating, setEditRating] = useState('4.8')
  const [editVerificationStatus, setEditVerificationStatus] = useState('verified')
  const [editAvailability, setEditAvailability] = useState('available')
  const [editSelectedCategoryIds, setEditSelectedCategoryIds] = useState<number[]>([])
  const [editAdditionalAreas, setEditAdditionalAreas] = useState('')
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete technician modal state (Admin only)
  const [deletingTech, setDeletingTech] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Document management modal state
  const [viewingDocsTech, setViewingDocsTech] = useState<any | null>(null)
  const [techDocuments, setTechDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [modalGovDocType, setModalGovDocType] = useState('aadhaar_card')
  const [modalGovDocNumber, setModalGovDocNumber] = useState('')
  const [modalGovDocFile, setModalGovDocFile] = useState<File | null>(null)
  const [modalGovDocFileName, setModalGovDocFileName] = useState('')
  const [uploadingModalDoc, setUploadingModalDoc] = useState(false)
  const [docsModalMsg, setDocsModalMsg] = useState('')
  const [docsModalError, setDocsModalError] = useState('')

  // Technician Full Details Modal state
  const [selectedDetailsTechId, setSelectedDetailsTechId] = useState<number | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const openDetailsModal = (id: number) => {
    setSelectedDetailsTechId(id)
    setIsDetailsModalOpen(true)
  }

  const fetchTechs = () => {
    setLoading(true)
    techniciansApi
      .getAll({ search })
      .then((res: any) => {
        const data = res.data?.data?.rows || res.data?.data || []
        setTechnicians(Array.isArray(data) ? data : [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTechs()

    categoriesApi
      .getAll()
      .then((res: any) => {
        const data = res.data?.data || []
        const cats = Array.isArray(data) ? data : []
        setCategories(cats)
        if (cats.length > 0) {
          // Pre-select first 3 categories as default
          setSelectedCategoryIds(cats.slice(0, 3).map((c: any) => c.id))
        }
      })
      .catch((err) => console.error('Failed to load categories', err))
  }, [])

  const toggleCategorySelection = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setSubmitting(true)

    try {
      const areasList = additionalAreas
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

      const payload = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        alternate_mobile: alternateMobile.trim() || undefined,
        alternateMobile: alternateMobile.trim() || undefined,
        email: email.trim() || undefined,
        area: area.trim(),
        city: city.trim(),
        pin_code: pinCode.trim() || undefined,
        pinCode: pinCode.trim() || undefined,
        experience_years: parseInt(experienceYears) || 0,
        experienceYears: parseInt(experienceYears) || 0,
        rating: parseFloat(rating) || 4.8,
        verification_status: verificationStatus as any,
        verificationStatus: verificationStatus as any,
        availability: availability as any,
        status: 'active',
        skills: selectedCategoryIds.map((id) => ({
          service_category_id: id,
          specialization: 'Certified Expert',
        })),
        service_areas: [
          area.trim(),
          ...areasList,
        ].filter(Boolean),
      }

      const res = await techniciansApi.create(payload as any)
      const newTechId = res.data?.data?.id

      let uploadsSummary = []

      if (newTechId) {
        // Upload photo if provided
        if (photoFile) {
          try {
            await techniciansApi.uploadPhoto(newTechId, photoFile)
            uploadsSummary.push('Profile Photo')
          } catch (err: any) {
            console.error('Failed to upload photo:', err)
          }
        }

        // Upload government document if provided
        if (govDocFile) {
          try {
            const formData = new FormData()
            formData.append('document', govDocFile)
            formData.append('doc_type', govDocType)
            if (govDocNumber.trim()) {
              formData.append('document_number', govDocNumber.trim())
            }
            await techniciansApi.uploadDocument(newTechId, formData)
            const docLabel = govDocType.replace(/_/g, ' ').toUpperCase()
            uploadsSummary.push(`Govt ID (${docLabel})`)
          } catch (err: any) {
            console.error('Failed to upload government document:', err)
          }
        }
      }

      const uploadText = uploadsSummary.length > 0 ? ` with ${uploadsSummary.join(' and ')}` : ''
      setSuccessMsg(`Technician "${fullName}" successfully registered${uploadText} and assigned ${selectedCategoryIds.length} service certifications!`)
      setShowAddForm(false)

      // Reset form
      setFullName('')
      setMobile('')
      setAlternateMobile('')
      setEmail('')
      setArea('')
      setPinCode('')
      setAdditionalAreas('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setGovDocFile(null)
      setGovDocFileName('')
      setGovDocNumber('')

      fetchTechs()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add technician.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (t: any) => {
    if (!isAdmin) {
      alert('Only administrators can edit technicians.')
      return
    }
    setEditingTech(t)
    setEditFullName(t.full_name || t.name || '')
    setEditMobile(t.mobile || '')
    setEditAlternateMobile(t.alternate_mobile || t.alt_mobile || '')
    setEditEmail(t.email || '')
    setEditArea(t.area || '')
    setEditCity(t.city || 'Pune')
    setEditPinCode(t.pin_code || '')
    setEditExperienceYears(String(t.experience_years ?? 5))
    setEditRating(String(t.rating ?? 4.8))
    setEditVerificationStatus(t.verification_status || 'verified')
    setEditAvailability(t.availability || 'available')
    setEditPhotoFile(null)
    setEditPhotoPreview(t.photo_url || null)
    const existingSkillIds = (t.skills || [])
      .map((s: any) => s.category_id || s.service_category_id || s.id)
      .filter(Boolean)
    setEditSelectedCategoryIds(existingSkillIds.length > 0 ? existingSkillIds : categories.map((c) => c.id))
    const existingSecondaryAreas = (t.service_areas || [])
      .filter((a: any) => a.area !== t.area)
      .map((a: any) => a.area)
      .join(', ')
    setEditAdditionalAreas(existingSecondaryAreas)
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTech) return
    if (!isAdmin) {
      alert('Only administrators can update technicians.')
      return
    }

    setSavingEdit(true)
    setErrorMsg('')
    try {
      const secAreas = editAdditionalAreas
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
        .map((a) => ({ area: a, city: editCity, pin_code: editPinCode }))

      const serviceAreasPayload = [
        { area: editArea, city: editCity, pin_code: editPinCode },
        ...secAreas
      ]

      await techniciansApi.update(editingTech.id, {
        full_name: editFullName.trim(),
        mobile: editMobile.trim(),
        alternate_mobile: editAlternateMobile.trim() || undefined,
        email: editEmail.trim() || undefined,
        area: editArea.trim(),
        city: editCity.trim(),
        pin_code: editPinCode.trim() || undefined,
        experience_years: parseInt(editExperienceYears) || 0,
        rating: parseFloat(editRating) || 4.5,
        verification_status: editVerificationStatus,
        availability: editAvailability,
        skills: editSelectedCategoryIds,
        service_areas: serviceAreasPayload
      } as any)

      if (editPhotoFile) {
        try {
          await techniciansApi.uploadPhoto(editingTech.id, editPhotoFile)
        } catch (photoErr) {
          console.error('Failed to update photo:', photoErr)
        }
      }

      setSuccessMsg(`Technician "${editFullName}" updated successfully!`)
      setEditingTech(null)
      fetchTechs()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update technician.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTech) return
    if (!isAdmin) {
      alert('Only administrators can delete technicians.')
      return
    }

    setDeleting(true)
    setErrorMsg('')
    try {
      await techniciansApi.delete(deletingTech.id)
      setSuccessMsg(`Technician "${deletingTech.full_name}" deleted successfully.`)
      setDeletingTech(null)
      fetchTechs()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete technician.')
    } finally {
      setDeleting(false)
    }
  }

  // Document modal functions
  const openDocsModal = (t: any) => {
    setViewingDocsTech(t)
    setDocsModalMsg('')
    setDocsModalError('')
    setModalGovDocFile(null)
    setModalGovDocFileName('')
    setModalGovDocNumber('')
    fetchTechDocs(t.id)
  }

  const fetchTechDocs = (techId: number) => {
    setLoadingDocs(true)
    techniciansApi
      .getDocuments(techId)
      .then((res: any) => {
        const docs = res.data?.data || []
        setTechDocuments(Array.isArray(docs) ? docs : [])
      })
      .catch((err) => {
        console.error('Failed to load documents:', err)
        setTechDocuments([])
      })
      .finally(() => setLoadingDocs(false))
  }

  const handleUploadModalDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingDocsTech || !modalGovDocFile) return
    setUploadingModalDoc(true)
    setDocsModalMsg('')
    setDocsModalError('')

    try {
      const formData = new FormData()
      formData.append('document', modalGovDocFile)
      formData.append('doc_type', modalGovDocType)
      if (modalGovDocNumber.trim()) {
        formData.append('document_number', modalGovDocNumber.trim())
      }
      await techniciansApi.uploadDocument(viewingDocsTech.id, formData)
      setDocsModalMsg('Document uploaded successfully.')
      setModalGovDocFile(null)
      setModalGovDocFileName('')
      setModalGovDocNumber('')
      fetchTechDocs(viewingDocsTech.id)
      fetchTechs()
    } catch (err: any) {
      setDocsModalError(err.message || 'Failed to upload document.')
    } finally {
      setUploadingModalDoc(false)
    }
  }

  const handleVerifyDoc = async (docId: number) => {
    if (!isAdmin) return
    try {
      await techniciansApi.verifyDocument(docId)
      setDocsModalMsg('Document verified successfully.')
      if (viewingDocsTech) fetchTechDocs(viewingDocsTech.id)
      fetchTechs()
    } catch (err: any) {
      setDocsModalError(err.message || 'Failed to verify document.')
    }
  }

  const handleDeleteDoc = async (docId: number) => {
    if (!isAdmin) return
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await techniciansApi.deleteDocument(docId)
      setDocsModalMsg('Document deleted.')
      if (viewingDocsTech) fetchTechDocs(viewingDocsTech.id)
      fetchTechs()
    } catch (err: any) {
      setDocsModalError(err.message || 'Failed to delete document.')
    }
  }

  const availableCount = technicians.filter((t) => t.availability === 'available').length
  const verifiedCount = technicians.filter((t) => t.verification_status === 'verified').length

  const formatDocType = (type: string) => {
    switch (type) {
      case 'aadhaar_card': return 'Aadhaar Card'
      case 'pan_card': return 'PAN Card'
      case 'driving_license': return 'Driving License'
      case 'voter_id': return 'Voter ID'
      case 'passport': return 'Passport'
      case 'profile_photo': return 'Profile Photo'
      default: return type.replace(/_/g, ' ')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Technicians Directory</h1>
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs">
              {technicians.length} Registered
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Profiles, verified government IDs, multi-service certifications, coverage localities, and real-time availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {isAdmin && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs sm:text-sm h-8 sm:h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {showAddForm ? 'Close Form' : 'Add Technician'}
            </Button>
          )}
          <Link to="/technicians/find" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs sm:text-sm h-8 sm:h-9">
              <UserCheck className="h-4 w-4 mr-1.5" />
              Smart Matcher
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/technician-plans" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs sm:text-sm h-8 sm:h-9">
                <Receipt className="h-4 w-4 mr-1.5 text-emerald-600" />
                Technician Plans & Dues
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{technicians.length}</div>
            <div className="text-xs text-slate-500">Total Technicians in Pune</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{availableCount}</div>
            <div className="text-xs text-slate-500">Available For Immediate Dispatch</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-700">{verifiedCount}</div>
            <div className="text-xs text-slate-500">KYC Verified & Documented</div>
          </div>
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
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Add New Technician Form Card */}
      {showAddForm && (
        <Card className="border-indigo-200 bg-white shadow-md">
          <CardHeader className="bg-indigo-50/40 border-b border-indigo-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-indigo-950 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  Register New Service Technician
                </CardTitle>
                <CardDescription>
                  Enter personal details, upload photo and government ID (Aadhaar / PAN / DL), select certified skills, and define service zones.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleCreateTechnician} className="space-y-5">
              {/* Personal & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="techName">Full Name *</Label>
                  <Input
                    id="techName"
                    required
                    placeholder="e.g. Ramesh Shinde"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techMobile">Primary Mobile *</Label>
                  <Input
                    id="techMobile"
                    required
                    placeholder="10-digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techAltMobile">Alternate Mobile</Label>
                  <Input
                    id="techAltMobile"
                    placeholder="Secondary contact"
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value)}
                  />
                </div>
              </div>

              {/* Location & Coverage */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="techArea">Primary Base Locality *</Label>
                  <Input
                    id="techArea"
                    required
                    placeholder="e.g. Kothrud, Baner, Wakad"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techCity">City</Label>
                  <Input
                    id="techCity"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techPin">PIN Code *</Label>
                  <Input
                    id="techPin"
                    required
                    placeholder="e.g. 411038"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techExp">Experience (Years)</Label>
                  <Input
                    id="techExp"
                    type="number"
                    min="0"
                    max="50"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="additionalAreas">Additional Coverage Localities (Comma Separated)</Label>
                <Input
                  id="additionalAreas"
                  placeholder="e.g. Aundh, Shivaji Nagar, Deccan, Model Colony, Pashan"
                  value={additionalAreas}
                  onChange={(e) => setAdditionalAreas(e.target.value)}
                />
              </div>

              {/* MANDATORY PHOTO & GOVERNMENT DOCUMENT SECTION */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Technician Verification & KYC Documentation (Photo & Government Document)
                  </div>
                  <Badge variant="outline" className="text-[11px] bg-white text-indigo-700 border-indigo-200 font-medium">
                    KYC Upload Required
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Upload Box */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-indigo-600" />
                        Technician Profile Photo
                      </Label>
                      {photoFile && (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" /> Photo Attached
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-indigo-400 shadow-sm shrink-0 bg-slate-50">
                          <img src={photoPreview} alt="Technician Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null)
                              setPhotoPreview(null)
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow"
                            title="Remove photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <Camera className="h-7 w-7 text-slate-400" />
                        </div>
                      )}

                      <div className="space-y-2 flex-1">
                        <input
                          type="file"
                          id="techPhotoInput"
                          accept="image/jpeg,image/png,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setPhotoFile(file)
                              setPhotoPreview(URL.createObjectURL(file))
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full justify-center"
                          onClick={() => document.getElementById('techPhotoInput')?.click()}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          {photoFile ? 'Change Profile Photo' : 'Upload Profile Photo'}
                        </Button>
                        <p className="text-[11px] text-slate-500">
                          {photoFile ? `${photoFile.name} (${(photoFile.size / 1024).toFixed(0)} KB)` : 'Portrait image (JPG, PNG) up to 10MB'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Government ID Document Box */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Government Identification Document
                      </Label>
                      {govDocFile && (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" /> Doc Attached
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="govDocTypeSelect" className="text-[11px] text-slate-500">Doc Type</Label>
                        <select
                          id="govDocTypeSelect"
                          value={govDocType}
                          onChange={(e) => setGovDocType(e.target.value)}
                          className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs bg-white text-slate-800 font-medium"
                        >
                          <option value="aadhaar_card">Aadhaar Card</option>
                          <option value="pan_card">PAN Card</option>
                          <option value="driving_license">Driving License</option>
                          <option value="voter_id">Voter ID</option>
                          <option value="passport">Passport</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="govDocNumInput" className="text-[11px] text-slate-500">Document / ID Number</Label>
                        <Input
                          id="govDocNumInput"
                          placeholder="e.g. 5432-8765-1234"
                          value={govDocNumber}
                          onChange={(e) => setGovDocNumber(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="file"
                        id="govDocInput"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setGovDocFile(file)
                            setGovDocFileName(file.name)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"
                        onClick={() => document.getElementById('govDocInput')?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {govDocFile ? 'Change Doc' : 'Upload Document File'}
                      </Button>
                      <span className="text-[11px] text-slate-600 truncate flex-1 font-mono">
                        {govDocFileName || 'PDF or JPG/PNG'}
                      </span>
                      {govDocFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setGovDocFile(null)
                            setGovDocFileName('')
                          }}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Availability */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="techVerification">Initial Verification Status</Label>
                  <select
                    id="techVerification"
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700 font-medium"
                  >
                    <option value="verified">Verified (Approved)</option>
                    <option value="pending">Pending Document Verification</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techAvailability">Current Availability</Label>
                  <select
                    id="techAvailability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700 font-medium"
                  >
                    <option value="available">Available for Dispatch</option>
                    <option value="busy">Busy (On Active Job)</option>
                    <option value="offline">Offline / Off Duty</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techRating">Initial Rating (1.0 to 5.0)</Label>
                  <Input
                    id="techRating"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
              </div>

              {/* Certified Skills Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Select Certified Appliance & Repair Skills:
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {categories.map((c) => {
                    const isChecked = selectedCategoryIds.includes(c.id)
                    return (
                      <label
                        key={c.id}
                        onClick={() => toggleCategorySelection(c.id)}
                        className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer select-none transition-colors ${isChecked
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{c.name.split('(')[0].trim()}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  Selected skills: {selectedCategoryIds.length} categories. Technicians will match customer calls in these categories.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                  {submitting ? 'Registering Technician & Uploading Docs...' : 'Register Technician & KYC →'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Filter Card */}
      <Card className="border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search technician by name, phone, locality (e.g. Kothrud, Baner, Wakad)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button onClick={fetchTechs} variant="secondary" className="shrink-0">
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Technicians List Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <CardContent className="p-0">
          {/* Mobile Card List (< md screens) */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading technicians directory...
              </div>
            ) : technicians.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No technicians found matching criteria.
              </div>
            ) : (
              technicians.map((t) => {
                const skillsList = t.skills || []
                const displayedSkills = skillsList.slice(0, 3)
                const extraSkillsCount = skillsList.length - 3
                const docsList = t.documents || []

                return (
                  <div key={t.id} className="p-4 space-y-3 bg-white">
                    {/* Header: Avatar, Name, Rating */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {t.photo_url ? (
                          <img
                            src={t.photo_url}
                            alt={t.full_name || t.name}
                            onClick={() => openDetailsModal(t.id)}
                            className="h-11 w-11 rounded-full object-cover border-2 border-indigo-200 shrink-0 cursor-pointer"
                          />
                        ) : (
                          <div
                            onClick={() => openDetailsModal(t.id)}
                            className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200 cursor-pointer"
                          >
                            {(t.full_name || t.name || 'T')
                              .split(' ')
                              .map((w: string) => w[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(t.id)}
                            className="font-bold text-sm text-slate-900 hover:text-indigo-600 text-left flex items-center gap-1 group"
                          >
                            <span>{t.full_name || t.name}</span>
                            <Eye className="h-3.5 w-3.5 text-indigo-500" />
                          </button>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>ID #{t.id}</span>
                            <span>•</span>
                            <span>{t.total_jobs || 0} jobs done</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating pill */}
                      <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold text-xs shrink-0">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {parseFloat(t.rating || '4.8').toFixed(1)}
                      </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex-wrap gap-2">
                      <a
                        href={`tel:${t.mobile}`}
                        className="inline-flex items-center gap-1 text-emerald-800 font-mono font-semibold hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        {t.mobile}
                      </a>
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{t.area || 'Pune'}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({t.pin_code || '411001'})</span>
                      </div>
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1">
                      {displayedSkills.length > 0 ? (
                        displayedSkills.map((s: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                          >
                            {(s.category_name || s.specialization || '').split('(')[0].replace('Repair', '').trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">All Appliances</span>
                      )}
                      {extraSkillsCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          +{extraSkillsCount} more
                        </span>
                      )}
                    </div>

                    {/* Plan, Availability & Documents */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.plan_type === 'monthly' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                            Monthly (₹{t.monthly_fee || 999}/mo)
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            Commission ({t.commission_rate_type === 'fixed' ? `₹${t.commission_rate || 100}` : `${t.commission_rate || 10}%`})
                          </span>
                        )}

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium capitalize ${
                            t.availability === 'available'
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              : t.availability === 'busy'
                                ? 'border-amber-300 text-amber-700 bg-amber-50'
                                : 'border-slate-300 text-slate-600 bg-slate-50'
                          }`}
                        >
                          {t.availability || 'available'}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={() => openDocsModal(t)}
                        className={`inline-flex items-center gap-1 text-[10px] rounded px-2 py-0.5 font-medium border ${
                          docsList.length > 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>{docsList.length > 0 ? `${docsList.length} ID Docs` : 'Upload ID'}</span>
                      </button>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsModal(t.id)}
                        className="flex-1 text-xs h-8 text-indigo-700 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 flex items-center justify-center gap-1 font-medium"
                      >
                        <Wrench className="h-3 w-3" />
                        Details
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8 text-slate-700 hover:text-indigo-600 border-slate-200"
                        onClick={() =>
                          navigate(
                            `/technicians/find?area=${encodeURIComponent(t.area || '')}&pincode=${t.pin_code || ''}`
                          )
                        }
                      >
                        Match Jobs →
                      </Button>

                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(t)}
                            className="text-xs h-8 px-2 text-slate-700 border-slate-200"
                            title="Edit technician"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingTech(t)}
                            className="text-xs h-8 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                            title="Delete technician"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Technician Profile</th>
                  <th className="py-3.5 px-4">Contact & Mobile</th>
                  <th className="py-3.5 px-4">Coverage Locality</th>
                  <th className="py-3.5 px-4">Certified Skills</th>
                  <th className="py-3.5 px-4">Experience & Rating</th>
                  <th className="py-3.5 px-4">Status & Documents</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading technicians directory...
                    </td>
                  </tr>
                ) : technicians.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No technicians found matching criteria.
                    </td>
                  </tr>
                ) : (
                  technicians.map((t) => {
                    const skillsList = t.skills || []
                    const displayedSkills = skillsList.slice(0, 3)
                    const extraSkillsCount = skillsList.length - 3
                    const docsList = t.documents || []

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Technician Profile with Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {t.photo_url ? (
                              <img
                                src={t.photo_url}
                                alt={t.full_name || t.name}
                                onClick={() => openDetailsModal(t.id)}
                                className="h-10 w-10 rounded-full object-cover border-2 border-indigo-200 shadow-2xs shrink-0 cursor-pointer hover:opacity-85 hover:scale-105 transition-all"
                                title="Click to view full technician details & history"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <div
                                onClick={() => openDetailsModal(t.id)}
                                className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200 cursor-pointer hover:bg-indigo-200 hover:scale-105 transition-all"
                                title="Click to view full technician details & history"
                              >
                                {(t.full_name || t.name || 'T')
                                  .split(' ')
                                  .map((w: string) => w[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                            )}
                            <div>
                              <button
                                type="button"
                                onClick={() => openDetailsModal(t.id)}
                                className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline text-left flex items-center gap-1.5 group cursor-pointer"
                                title="Click to view full technician profile, documents & job history"
                              >
                                <span className="group-hover:translate-x-0.5 transition-transform">{t.full_name || t.name}</span>
                                {t.photo_url && (
                                  <span title="Profile Photo Verified">
                                    <Camera className="h-3 w-3 text-indigo-600" />
                                  </span>
                                )}
                                <span className="text-[10px] text-indigo-600 font-normal ml-0.5 underline decoration-indigo-300">(View Details →)</span>
                              </button>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                <span>ID #{t.id} • {t.total_jobs || 0} jobs done</span>
                                {t.plan_type === 'monthly' ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                    Monthly (₹{t.monthly_fee || 999}/mo)
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                    Commission ({t.commission_rate_type === 'fixed' ? `₹${t.commission_rate || 100}` : `${t.commission_rate || 10}%`})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <a
                            href={`tel:${t.mobile}`}
                            className="inline-flex items-center gap-1 text-slate-800 font-medium hover:text-indigo-600"
                          >
                            <Phone className="h-3 w-3 text-slate-400" />
                            {t.mobile}
                          </a>
                          {t.alternate_mobile && (
                            <div className="text-xs text-slate-400">{t.alternate_mobile}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-medium text-slate-800">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {t.area || 'Pune'}
                          </div>
                          <span className="text-xs text-slate-400">{t.pin_code || '411001'}</span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {displayedSkills.length > 0 ? (
                              displayedSkills.map((s: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                                >
                                  {(s.category_name || s.specialization || '').split('(')[0].replace('Repair', '').trim()}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">All Appliances</span>
                            )}
                            {extraSkillsCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                                +{extraSkillsCount} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-amber-600 font-semibold text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {parseFloat(t.rating || '4.8').toFixed(1)}
                          </div>
                          <span className="text-xs text-slate-500">{t.experience_years || 5} yrs exp</span>
                        </td>

                        {/* Status & Verification Documents */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium capitalize ${t.availability === 'available'
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                : t.availability === 'busy'
                                  ? 'border-amber-300 text-amber-700 bg-amber-50'
                                  : 'border-slate-300 text-slate-600 bg-slate-50'
                                }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full mr-1 ${t.availability === 'available'
                                  ? 'bg-emerald-500'
                                  : t.availability === 'busy'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                  }`}
                              />
                              {t.availability || 'available'}
                            </Badge>

                            {/* Verification & KYC Documents Pill */}
                            <div>
                              <button
                                type="button"
                                onClick={() => openDocsModal(t)}
                                className={`inline-flex items-center gap-1 text-[11px] rounded px-2 py-0.5 font-medium transition-colors border ${docsList.length > 0
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  }`}
                                title="View & Manage Government Verification Documents"
                              >
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                <span>
                                  {docsList.length > 0
                                    ? `${docsList.length} ID Doc${docsList.length > 1 ? 's' : ''}`
                                    : 'Upload Govt ID'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-7 px-2"
                              onClick={() =>
                                navigate(
                                  `/technicians/find?area=${encodeURIComponent(t.area || '')}&pincode=${t.pin_code || ''}`
                                )
                              }
                            >
                              Match Jobs →
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(t)}
                                  className="text-xs text-slate-700 hover:text-indigo-600 h-7 px-2 flex items-center gap-1"
                                  title="Edit technician details (Admin Only)"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletingTech(t)}
                                  className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-7 px-2 flex items-center gap-1"
                                  title="Delete technician (Admin Only)"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENT VIEWER & KYC MANAGEMENT MODAL */}
      {viewingDocsTech && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">
                    KYC & Government Documents: {viewingDocsTech.full_name || viewingDocsTech.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mobile: {viewingDocsTech.mobile} • Locality: {viewingDocsTech.area || 'Pune'}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingDocsTech(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {docsModalMsg && (
                <Alert className="border-emerald-500 text-emerald-800 bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
                  <AlertDescription>{docsModalMsg}</AlertDescription>
                </Alert>
              )}

              {docsModalError && (
                <Alert variant="destructive">
                  <AlertDescription>{docsModalError}</AlertDescription>
                </Alert>
              )}

              {/* Profile Photo Display Card */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-4">
                {viewingDocsTech.photo_url ? (
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-indigo-400 shadow shrink-0">
                    <img src={viewingDocsTech.photo_url} alt="Profile" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-200">
                    {(viewingDocsTech.full_name || 'T').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">Technician Profile Photo</div>
                  <div className="text-xs text-slate-500">
                    {viewingDocsTech.photo_url ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <Check className="h-3.5 w-3.5" /> Photo uploaded & verified on profile
                      </span>
                    ) : (
                      <span className="text-amber-700">No profile photo uploaded yet</span>
                    )}
                  </div>
                </div>
                {viewingDocsTech.photo_url && (
                  <a
                    href={viewingDocsTech.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2.5 py-1.5 rounded border border-indigo-200 bg-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Photo
                  </a>
                )}
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Government ID Documents ({techDocuments.length})
                  </h4>
                </div>

                {loadingDocs ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading documents...</div>
                ) : techDocuments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    No government identity documents uploaded yet for this technician.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {techDocuments.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              {formatDocType(doc.doc_type || doc.document_type || 'aadhaar_card')}
                              {doc.is_verified ? (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                                  Pending Verification
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {doc.document_number && (
                                <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">
                                  ID: {doc.document_number}
                                </span>
                              )}
                              <span>{doc.file_name}</span>
                              {doc.uploaded_at && (
                                <span className="text-slate-400">
                                  • {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`/api/v1/documents/${doc.id}/download?inline=true`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </a>
                          {isAdmin && !doc.is_verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyDoc(doc.id)}
                              className="text-xs h-7 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Verify
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-xs h-7 px-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                              title="Delete document"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload New Government Document Section */}
              {isAdmin && (
                <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
                  <h4 className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-indigo-600" />
                    Attach New Government Verification Document
                  </h4>

                  <form onSubmit={handleUploadModalDoc} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="mDocType" className="text-xs text-slate-600">Document Type *</Label>
                        <select
                          id="mDocType"
                          value={modalGovDocType}
                          onChange={(e) => setModalGovDocType(e.target.value)}
                          className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800 mt-1"
                        >
                          <option value="aadhaar_card">Aadhaar Card</option>
                          <option value="pan_card">PAN Card</option>
                          <option value="driving_license">Driving License</option>
                          <option value="voter_id">Voter ID</option>
                          <option value="passport">Passport</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="mDocNum" className="text-xs text-slate-600">Document ID Number</Label>
                        <Input
                          id="mDocNum"
                          placeholder="e.g. 5432-8765-1234 / ABCDE1234F"
                          value={modalGovDocNumber}
                          onChange={(e) => setModalGovDocNumber(e.target.value)}
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="modalDocFileInput"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setModalGovDocFile(file)
                            setModalGovDocFileName(file.name)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => document.getElementById('modalDocFileInput')?.click()}
                      >
                        <Upload className="h-3 w-3 mr-1.5" />
                        {modalGovDocFile ? 'Change File' : 'Choose Document File'}
                      </Button>
                      <span className="text-xs text-slate-600 truncate flex-1 font-mono">
                        {modalGovDocFileName || 'No file chosen (PDF, JPG, PNG)'}
                      </span>
                      <Button
                        type="submit"
                        disabled={uploadingModalDoc || !modalGovDocFile}
                        size="sm"
                        className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {uploadingModalDoc ? 'Uploading...' : 'Upload & Attach'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewingDocsTech(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TECHNICIAN MODAL (ADMIN ONLY) */}
      {editingTech && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  Edit Technician Profile: {editingTech.full_name}
                </h3>
                <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50">
                  Admin Only
                </Badge>
              </div>
              <button onClick={() => setEditingTech(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {/* Photo update section in Edit Modal */}
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-4">
                {editPhotoPreview ? (
                  <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-indigo-300 shadow shrink-0">
                    <img src={editPhotoPreview} alt="Tech" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-1 flex-1">
                  <Label className="text-xs font-semibold text-slate-800">Technician Photo</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="editPhotoInput"
                      accept="image/jpeg,image/png,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditPhotoFile(file)
                          setEditPhotoPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => document.getElementById('editPhotoInput')?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {editPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    <span className="text-[11px] text-slate-500">
                      {editPhotoFile ? editPhotoFile.name : 'PNG/JPG'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Full Name *</Label>
                  <Input
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Mobile Number *</Label>
                  <Input
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Alternate Mobile</Label>
                  <Input
                    value={editAlternateMobile}
                    onChange={(e) => setEditAlternateMobile(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Primary Base Area *</Label>
                  <Input
                    required
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Base PIN Code *</Label>
                  <Input
                    required
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Experience (Yrs)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={editExperienceYears}
                    onChange={(e) => setEditExperienceYears(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Rating (★)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editRating}
                    onChange={(e) => setEditRating(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Availability</Label>
                  <select
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value)}
                    className="w-full h-9 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-800"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy / On Job</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Verification</Label>
                  <select
                    value={editVerificationStatus}
                    onChange={(e) => setEditVerificationStatus(e.target.value)}
                    className="w-full h-9 border border-slate-200 rounded-md px-2 text-xs bg-white text-slate-800"
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Skills Checklist */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                    Certified Appliance & Repair Skills:
                  </Label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {editSelectedCategoryIds.length} skills selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  {categories.map((cat) => {
                    const checked = editSelectedCategoryIds.includes(cat.id)
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${checked ? 'bg-indigo-100/60 font-medium text-indigo-900' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditSelectedCategoryIds([...editSelectedCategoryIds, cat.id])
                            } else {
                              setEditSelectedCategoryIds(editSelectedCategoryIds.filter((id) => id !== cat.id))
                            }
                          }}
                          className="h-3.5 w-3.5 text-indigo-600 rounded"
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Additional Coverage Areas */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Additional Service Coverage Areas (Comma-separated)
                </Label>
                <Input
                  value={editAdditionalAreas}
                  onChange={(e) => setEditAdditionalAreas(e.target.value)}
                  placeholder="e.g. Karve Nagar, Deccan, Paud Road"
                  className="h-9 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingTech(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {savingEdit ? 'Updating Technician...' : 'Save Technician Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
      {deletingTech && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-sm">Confirm Technician Deletion</h3>
              </div>
              <button onClick={() => setDeletingTech(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete technician <strong>{deletingTech.full_name}</strong> (Mobile:{' '}
                <span className="font-mono">{deletingTech.mobile}</span>)?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800 flex items-start gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This operation requires <strong>Administrator</strong> privileges. The technician will be marked inactive and removed from nearest matchmaking.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDeletingTech(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Technician'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TECHNICIAN FULL DETAILS MODAL */}
      <TechnicianDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        technicianId={selectedDetailsTechId}
        onEdit={(t) => openEditModal(t)}
        onTechnicianUpdated={fetchTechs}
        isAdmin={isAdmin}
      />
    </div>
  )
}
