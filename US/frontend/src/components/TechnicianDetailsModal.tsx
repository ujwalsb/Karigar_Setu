import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { techniciansApi, openTechnicianDocument } from '@/api/technicians'
import { formatDate, getStatusColor, resolveAssetUrl, getResolvedCompanyName } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'
import { TechnicianIdCard } from '@/components/TechnicianIdCard'
import { TechnicianIdCardModal } from '@/components/TechnicianIdCardModal'
import { printTechnicianIdCard, downloadTechnicianIdCardPng } from '@/lib/idCard'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  IndianRupee,
  CheckCircle2,
  Clock,
  Pencil,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Camera,
  Star,
  Briefcase,
  FileText,
  FileCheck,
  Eye,
  Trash2,
  AlertTriangle,
  ZoomIn,
  MessageSquare,
  AlertCircle,
  Receipt,
  Percent,
  CreditCard,
  Contact2,
  Printer,
  Download,
  Building2,
} from 'lucide-react'

interface TechnicianDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  technicianId: number | null
  onEdit?: (technician: any) => void
  onTechnicianUpdated?: () => void
  isAdmin?: boolean
}

export function TechnicianDetailsModal({
  open,
  onOpenChange,
  technicianId,
  onEdit,
  onTechnicianUpdated,
  isAdmin = true,
}: TechnicianDetailsModalProps) {
  const { settings } = useSettings()
  const companyName = getResolvedCompanyName(settings)
  const [loading, setLoading] = useState(false)
  const [tech, setTech] = useState<any | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'skills' | 'documents' | 'billing' | 'id_card'>('history')
  const [errorMsg, setErrorMsg] = useState('')
  const [docErrorMsg, setDocErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isIdCardEditorOpen, setIsIdCardEditorOpen] = useState(false)
  const [idCardEditTab, setIdCardEditTab] = useState<'technician' | 'company'>('technician')
  const [downloadingPng, setDownloadingPng] = useState(false)

  // Lightbox preview for machine photo or documents
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('')

  // Document action state
  const [verifyingDocId, setVerifyingDocId] = useState<number | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  const loadData = async () => {
    if (!technicianId) return
    setLoading(true)
    setErrorMsg('')
    try {
      // 1. Fetch technician profile with skills, areas, and docs
      const techRes = await techniciansApi.getById(technicianId)
      const technicianData = (techRes.data as any)?.data || techRes.data
      setTech(technicianData)
      setDocuments(technicianData?.documents || [])

      // 2. Fetch service requests / job history
      try {
        const histRes = await techniciansApi.getHistory(technicianId)
        const historyData = (histRes.data as any)?.data || histRes.data || []
        setHistory(Array.isArray(historyData) ? historyData : [])
      } catch (hErr) {
        console.warn('Could not load technician history:', hErr)
        setHistory([])
      }
    } catch (err: any) {
      console.error('Failed to load technician details:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to load technician details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && technicianId) {
      loadData()
      setActiveTab('history')
    } else {
      setTech(null)
      setHistory([])
      setDocuments([])
      setErrorMsg('')
      setDocErrorMsg('')
      setSuccessMsg('')
      setPreviewImage(null)
      setIsIdCardEditorOpen(false)
    }
  }, [open, technicianId])

  const handleVerifyDoc = async (docId: number) => {
    if (!confirm('Mark this government document as verified?')) return
    try {
      setVerifyingDocId(docId)
      await techniciansApi.verifyDocument(docId)
      setSuccessMsg('Document successfully verified.')
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, is_verified: true, verified_at: new Date().toISOString() } : d))
      )
      if (onTechnicianUpdated) onTechnicianUpdated()
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify document.')
    } finally {
      setVerifyingDocId(null)
    }
  }

  const handleDeleteDoc = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return
    try {
      setDeletingDocId(docId)
      await techniciansApi.deleteDocument(docId)
      setSuccessMsg('Document deleted successfully.')
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      if (onTechnicianUpdated) onTechnicianUpdated()
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete document.')
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleViewDoc = async (doc: any) => {
    setDocErrorMsg('')
    try {
      await openTechnicianDocument(doc.id, doc.mime_type)
    } catch (err: any) {
      setDocErrorMsg(err?.message || 'File not found on disk.')
    }
  }

  const formatDocType = (type: string) => {
    switch (type) {
      case 'aadhaar_card':
      case 'aadhaar':
        return 'Aadhaar Card'
      case 'pan_card':
      case 'pan':
        return 'PAN Card'
      case 'driving_license':
      case 'driving_licence':
        return 'Driving License'
      case 'police_verification':
        return 'Police Clearance'
      case 'profile_photo':
        return 'Profile Photo'
      default:
        return type.replace(/_/g, ' ').toUpperCase()
    }
  }

  // Calculated stats from history
  const completedJobs = history.filter((h) => h.status === 'completed')
  const totalEarningsHandled = completedJobs.reduce((acc, curr) => acc + (parseFloat(curr.final_amount) || 0), 0)

  const cleanMobile = tech?.mobile ? tech.mobile.replace(/[^0-9]/g, '').slice(-10) : ''

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto p-0 gap-0 border-slate-200 shadow-2xl bg-slate-50/50 w-[95vw] sm:w-full">
          <DialogHeader className="p-3.5 sm:p-6 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              {/* Profile Left: Photo + Name + Badges */}
              <div className="flex items-center gap-3 sm:gap-4">
                {tech?.photo_url ? (
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => {
                      setPreviewImage(resolveAssetUrl(tech.photo_url))
                      setPreviewTitle(`${tech.full_name || tech.name} - Profile Photo`)
                    }}
                    title="Click to view full photo"
                  >
                    <img
                      src={resolveAssetUrl(tech.photo_url)}
                      alt={tech.full_name || tech.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-xl shadow-sm border border-indigo-200 shrink-0">
                    {(tech?.full_name || tech?.name || 'T')
                      .split(' ')
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                      {tech?.full_name || tech?.name || 'Technician Details'}
                    </DialogTitle>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      ID #{tech?.id}
                    </span>

                    {/* Verification Status */}
                    {tech?.verification_status === 'verified' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 text-[11px]">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Tech
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 text-[11px]">
                        KYC Pending
                      </Badge>
                    )}

                    {/* Availability */}
                    <Badge
                      variant="outline"
                      className={`text-[11px] capitalize flex items-center gap-1 ${tech?.availability === 'available'
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : tech?.availability === 'busy'
                          ? 'border-amber-300 text-amber-700 bg-amber-50'
                          : 'border-slate-300 text-slate-600 bg-slate-50'
                        }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${tech?.availability === 'available'
                          ? 'bg-emerald-500'
                          : tech?.availability === 'busy'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                          }`}
                      />
                      {tech?.availability || 'Available'}
                    </Badge>

                    {/* Assigned Plan Badge */}
                    {tech?.plan_type === 'monthly' ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[11px] font-semibold flex items-center gap-1 hover:bg-blue-100">
                        Monthly Plan (₹{tech?.monthly_fee || 999}/mo)
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] font-semibold flex items-center gap-1 hover:bg-emerald-100">
                        Commission ({tech?.commission_rate_type === 'fixed' ? `₹${tech?.commission_rate || 100} flat` : `${tech?.commission_rate || 10}%`})
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                    <a
                      href={`tel:${tech?.mobile}`}
                      className="flex items-center gap-1 font-semibold text-slate-800 hover:text-indigo-600"
                    >
                      <Phone className="h-3.5 w-3.5 text-indigo-500" />
                      {tech?.mobile || 'No mobile'}
                    </a>
                    {tech?.alternate_mobile && (
                      <span className="text-slate-400">/ {tech.alternate_mobile}</span>
                    )}
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {tech?.area || 'Pune'} {tech?.pin_code ? `(${tech.pin_code})` : ''}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {parseFloat(tech?.rating || '4.8').toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Right */}
              <div className="flex items-center gap-2 shrink-0">
                {tech?.mobile && (
                  <>
                    <a
                      href={`tel:${tech.mobile}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs border border-indigo-200 transition-colors shadow-2xs"
                      title="Direct Call Technician"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call Tech
                    </a>
                    <a
                      href={`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(
                        `Hello ${tech.full_name || tech.name}, message from ${companyName} Support Admin.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs border border-emerald-200 transition-colors shadow-2xs"
                      title="Send WhatsApp Message"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      WhatsApp
                    </a>
                  </>
                )}

                {isAdmin && onEdit && tech && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      onEdit(tech)
                    }}
                    className="h-8 text-xs flex items-center gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Total Completed Jobs</div>
                <div className="text-base font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                  {tech?.total_jobs || completedJobs.length || 0}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Total Revenue Handled</div>
                <div className="text-base font-bold text-emerald-700 flex items-center justify-center gap-0.5 mt-0.5">
                  <IndianRupee className="h-4 w-4" />
                  {totalEarningsHandled.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Experience</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {tech?.experience_years || 5} Years
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Verified ID Docs</div>
                <div className="text-base font-bold text-indigo-700 flex items-center justify-center gap-1 mt-0.5">
                  <FileCheck className="h-4 w-4" />
                  {documents.filter((d) => d.is_verified).length} / {documents.length}
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Smooth Scroll on Mobile) */}
            <div className="flex items-center gap-1.5 mt-3 sm:mt-4 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Job & Service History ({history.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <User className="h-3.5 w-3.5" />
                Personal Profile
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${activeTab === 'skills'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                Skills & Areas ({(tech?.skills || []).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${activeTab === 'documents'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Govt KYC Docs ({documents.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${activeTab === 'billing'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                Plan & Billing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('id_card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${activeTab === 'id_card'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Contact2 className="h-3.5 w-3.5" />
                ID Card
              </button>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="p-3.5 sm:p-6">
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading technician profile & service history...
              </div>
            ) : errorMsg ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {errorMsg}
              </div>
            ) : !tech ? (
              <div className="py-12 text-center text-slate-400">No technician data found.</div>
            ) : (
              <>
                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {successMsg}
                  </div>
                )}

                {/* TAB 1: SERVICE REQUESTS & HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-indigo-600" />
                        Technician Assigned & Completed Jobs ({history.length})
                      </h3>
                      <span className="text-xs text-slate-500">
                        {completedJobs.length} completed • {history.length - completedJobs.length} in progress/assigned
                      </span>
                    </div>

                    {history.length === 0 ? (
                      <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-300 p-6">
                        <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No Service Requests Assigned Yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          This technician has not been assigned any customer calls or service jobs yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {history.map((req) => {
                          const isCompleted = req.status === 'completed'
                          const parts = req.parts_replaced
                            ? typeof req.parts_replaced === 'string'
                              ? req.parts_replaced
                              : JSON.stringify(req.parts_replaced)
                            : ''

                          return (
                            <div
                              key={req.id || req.request_id}
                              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-4 space-y-3"
                            >
                              {/* Request Header */}
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm text-indigo-600">
                                      {req.request_id || `REQ-#${req.id}`}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] uppercase font-semibold ${isCompleted
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : req.status === 'in_progress'
                                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                                          : 'bg-amber-50 text-amber-700 border-amber-300'
                                        }`}
                                    >
                                      {req.status?.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                      {req.service_category_name || 'Appliance Service'}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>Assigned: {formatDate(req.created_at)}</span>
                                    {req.completed_at && (
                                      <span className="text-emerald-700 font-medium">
                                        • Completed: {formatDate(req.completed_at)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Financials Badge */}
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">Total Amount Taken</div>
                                  <div className="text-base font-bold text-slate-900 flex items-center justify-end">
                                    <IndianRupee className="h-4 w-4 text-slate-700" />
                                    {parseFloat(req.final_amount || req.labor_charge || 0).toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[10px] text-slate-500 capitalize">
                                    Mode: {req.payment_mode || 'Cash'} • {req.payment_status || 'Paid'}
                                  </div>
                                </div>
                              </div>

                              {/* Customer Information Row */}
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-semibold text-slate-800">
                                    Customer: {req.customer_name || 'Walk-in Customer'}
                                  </span>
                                  {req.customer_mobile && (
                                    <a
                                      href={`tel:${req.customer_mobile}`}
                                      className="text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                                    >
                                      <Phone className="h-3 w-3" />
                                      {req.customer_mobile}
                                    </a>
                                  )}
                                </div>
                                <div className="text-slate-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-rose-500" />
                                  {req.customer_area || 'Pune'}, {req.customer_city || 'Pune'}
                                </div>
                              </div>

                              {/* Problem & Work Done Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {req.problem_description && (
                                  <div className="p-2.5 bg-amber-50/60 rounded-md border border-amber-100">
                                    <div className="font-semibold text-amber-900 mb-0.5">Problem Reported:</div>
                                    <div className="text-slate-700">{req.problem_description}</div>
                                  </div>
                                )}

                                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-100">
                                  <div className="font-semibold text-slate-800 mb-0.5">Work Done:</div>
                                  <div className="text-slate-700">
                                    {req.work_description || 'Standard inspection, cleaning, & servicing.'}
                                  </div>
                                </div>
                              </div>

                              {/* Parts Replaced & Machine Photo Section */}
                              <div className="flex items-start justify-between gap-4 flex-wrap pt-1">
                                <div className="space-y-1 text-xs">
                                  {parts && (
                                    <div>
                                      <span className="font-semibold text-slate-700">Spare Parts Replaced: </span>
                                      <span className="text-slate-600">{parts}</span>
                                    </div>
                                  )}
                                  {req.technician_remarks && (
                                    <div>
                                      <span className="font-semibold text-slate-700">Technician Remarks: </span>
                                      <span className="text-slate-600">{req.technician_remarks}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Machine Photo Thumbnail */}
                                {req.machine_photo_url && (
                                  <div className="flex items-center gap-2">
                                    <div
                                      onClick={() => {
                                        setPreviewImage(req.machine_photo_url)
                                        setPreviewTitle(`Repaired Appliance Photo - ${req.request_id || req.id}`)
                                      }}
                                      className="relative group cursor-pointer border-2 border-emerald-300 rounded-lg overflow-hidden h-14 w-20 shadow-xs shrink-0"
                                      title="Click to zoom repaired appliance photo"
                                    >
                                      <img
                                        src={req.machine_photo_url}
                                        alt="Repaired Machine"
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ZoomIn className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                    <div className="text-[11px]">
                                      <div className="font-semibold text-emerald-800 flex items-center gap-1">
                                        <Camera className="h-3 w-3 text-emerald-600" /> Repaired Photo
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPreviewImage(req.machine_photo_url)
                                          setPreviewTitle(`Repaired Appliance Photo - ${req.request_id || req.id}`)
                                        }}
                                        className="text-indigo-600 hover:underline text-[10px]"
                                      >
                                        Click to Zoom
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PERSONAL & CONTACT PROFILE */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-600" />
                        Technician Personal & Residential Profile
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-slate-400 font-medium">Full Legal Name</div>
                          <div className="font-semibold text-slate-900 text-sm mt-0.5">
                            {tech.full_name || tech.name}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">Primary Mobile Number</div>
                          <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <a href={`tel:${tech.mobile}`} className="hover:text-indigo-600 hover:underline">
                              {tech.mobile}
                            </a>
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">Alternate Mobile</div>
                          <div className="font-semibold text-slate-900 mt-0.5">
                            {tech.alternate_mobile || tech.alt_mobile || 'None provided'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">Email Address</div>
                          <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {tech.email || 'None registered'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">Primary Locality / Area</div>
                          <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-rose-500" />
                            {tech.area || 'Pune'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">PIN Code</div>
                          <div className="font-semibold text-slate-900 font-mono mt-0.5">
                            {tech.pin_code || '411001'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">City & State</div>
                          <div className="font-semibold text-slate-900 mt-0.5">
                            {tech.city || 'Pune'}, {tech.state || 'Maharashtra'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">Total Experience</div>
                          <div className="font-semibold text-slate-900 mt-0.5">
                            {tech.experience_years || 5} Years in Appliance Repair
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-medium">Account Status</div>
                          <div className="mt-0.5">
                            <Badge
                              className={`text-[10px] capitalize ${tech.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                                }`}
                            >
                              {tech.status || 'Active'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {tech.address && (
                        <div className="pt-3 border-t border-slate-100 text-xs">
                          <div className="text-slate-400 font-medium">Full Residential Address:</div>
                          <div className="text-slate-800 font-medium mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {tech.address}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                        <div>
                          Registered On: <span className="font-medium text-slate-700">{formatDate(tech.created_at)}</span>
                        </div>
                        {tech.created_by_name && (
                          <div>
                            Registered By: <span className="font-medium text-slate-700">{tech.created_by_name}</span>
                          </div>
                        )}
                        <div>
                          KYC Consent:{' '}
                          <span className="font-medium text-emerald-700">
                            {tech.consent_given ? '✓ Agreed & Signed' : 'Agreed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SKILLS & COVERAGE AREAS */}
                {activeTab === 'skills' && (
                  <div className="space-y-4">
                    {/* Certified Appliance Skills */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-indigo-600" />
                          Certified Appliance Skills & Specializations
                        </h3>
                        <span className="text-xs font-mono text-slate-500">
                          {(tech.skills || []).length} Categories Certified
                        </span>
                      </div>

                      {!(tech.skills && tech.skills.length > 0) ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No specific category skills mapped. Qualified for General Home Appliance Services.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {tech.skills.map((skill: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5"
                            >
                              <div className="h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                <Wrench className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">
                                  {skill.category_name || skill.name || 'Appliance Service'}
                                </div>
                                <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                                  {skill.specialization || 'Certified Service Engineer'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Service Coverage Areas */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-500" />
                          Assigned Service Coverage Areas & Pincodes
                        </h3>
                        <span className="text-xs font-mono text-slate-500">
                          {(tech.service_areas || []).length + 1} Coverage Localities
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Primary Area */}
                        <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-indigo-600" />
                            <div>
                              <span className="text-xs font-bold text-slate-900">{tech.area || 'Pune Central'}</span>
                              <Badge className="ml-2 bg-indigo-600 text-white text-[10px]">Primary Base Area</Badge>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-indigo-700">
                            PIN: {tech.pin_code || '411001'}
                          </span>
                        </div>

                        {/* Additional Areas */}
                        {tech.service_areas && tech.service_areas.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                            {tech.service_areas.map((area: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                              >
                                <span className="font-semibold text-slate-800 truncate">
                                  {area.area || area.area_name || area}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  {area.pin_code || area.pinCode || tech.pin_code || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: GOVERNMENT ID & KYC DOCUMENTS */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          Government Identity & Compliance Documents ({documents.length})
                        </h3>
                        <span className="text-xs text-slate-500">
                          {documents.filter((d) => d.is_verified).length} verified
                        </span>
                      </div>

                      {docErrorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{docErrorMsg}</span>
                        </div>
                      )}

                      {documents.length === 0 ? (
                        <div className="py-10 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 p-6">
                          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700">No Government Documents Uploaded</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Technician has not uploaded government ID proofs (Aadhaar, PAN, Driving License).
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {documents.map((doc: any) => (
                            <div
                              key={doc.id}
                              className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
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
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                                      >
                                        Pending Verification
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                    {doc.document_number && (
                                      <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-700 font-semibold">
                                        Doc ID: {doc.document_number}
                                      </span>
                                    )}
                                    <span>{doc.file_name}</span>
                                    {doc.uploaded_at && (
                                      <span className="text-slate-400">
                                        • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleViewDoc(doc)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 flex items-center gap-1 bg-white font-medium cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View Doc
                                </button>

                                {isAdmin && !doc.is_verified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={verifyingDocId === doc.id}
                                    onClick={() => handleVerifyDoc(doc.id)}
                                    className="text-xs h-7 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    {verifyingDocId === doc.id ? 'Verifying...' : 'Verify'}
                                  </Button>
                                )}

                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={deletingDocId === doc.id}
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="text-xs h-7 px-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    title="Delete document"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: PLAN & BILLING */}
                {activeTab === 'billing' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-indigo-600" />
                        Technician Monetization Plan & Billing Details
                      </h3>
                      <a
                        href="/technician-plans"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                      >
                        Manage in Plans Hub →
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Active Plan Card */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase">Monetization Model</span>
                          {tech?.plan_type === 'monthly' ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-bold">
                              Monthly Subscription
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                              Commission Per Service
                            </Badge>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                          {tech?.plan_type === 'monthly' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Monthly Fixed Fee:</span>
                                <strong className="text-slate-800 text-sm">₹{tech?.monthly_fee || 999}/month</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Subscription Status:</span>
                                <span className="capitalize font-semibold text-emerald-700">{tech?.subscription_status || 'Active'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Start Date:</span>
                                <span className="font-mono text-slate-700">{tech?.subscription_start_date ? formatDate(tech.subscription_start_date) : '—'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Valid Until:</span>
                                <span className="font-mono text-slate-700">{tech?.subscription_end_date ? formatDate(tech.subscription_end_date) : '—'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Commission Rate:</span>
                                <strong className="text-slate-800 text-sm">
                                  {tech?.commission_rate_type === 'fixed'
                                    ? `₹${tech?.commission_rate || 100} flat per job`
                                    : `${tech?.commission_rate || 10}% of total bill`}
                                </strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Rate Calculation:</span>
                                <span className="capitalize font-semibold text-slate-700">{tech?.commission_rate_type || 'Percentage'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Auto Deducted:</span>
                                <span className="text-emerald-700 font-medium">After every job report submission</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Performance & Revenue Summary */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 shadow-2xs space-y-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Financial Metrics</div>

                        <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Completed Jobs:</span>
                            <strong className="text-slate-800">{completedJobs.length} jobs</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total Revenue Handled:</span>
                            <strong className="text-emerald-700">₹{totalEarningsHandled.toLocaleString('en-IN')}</strong>
                          </div>
                          {tech?.plan_type !== 'monthly' && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Est. Commission Accrued:</span>
                              <strong className="text-indigo-700">
                                ₹{tech?.commission_rate_type === 'fixed'
                                  ? (completedJobs.length * (parseFloat(tech?.commission_rate) || 150)).toLocaleString('en-IN')
                                  : Math.round(totalEarningsHandled * ((parseFloat(tech?.commission_rate) || 10) / 100)).toLocaleString('en-IN')}
                              </strong>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <a
                            href="/technician-plans"
                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors shadow-2xs"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Open Plans & Dues Hub
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: ID CARD */}
                {activeTab === 'id_card' && (
                  <div className="space-y-5">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Official Technician ID Card</h4>
                        <p className="text-xs text-slate-500">
                          Generated from photo, mobile, service location, and company branding settings.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => printTechnicianIdCard(tech, settings)}
                          className="h-8 text-xs flex items-center gap-1.5"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print / PDF
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={downloadingPng}
                          onClick={async () => {
                            try {
                              setDownloadingPng(true)
                              await downloadTechnicianIdCardPng(tech, settings)
                            } finally {
                              setDownloadingPng(false)
                            }
                          }}
                          className="h-8 text-xs flex items-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {downloadingPng ? 'Exporting...' : 'Download PNG'}
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setIdCardEditTab('technician')
                                setIsIdCardEditorOpen(true)
                              }}
                              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Card Data
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIdCardEditTab('company')
                                setIsIdCardEditorOpen(true)
                              }}
                              className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 flex items-center gap-1.5"
                            >
                              <Building2 className="h-3.5 w-3.5" />
                              Company &amp; Logo
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center py-2">
                      <TechnicianIdCard
                        technician={tech}
                        company={settings}
                        showEditButton={isAdmin}
                        onEdit={() => {
                          setIdCardEditTab('technician')
                          setIsIdCardEditorOpen(true)
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ID CARD LIVE EDITOR MODAL */}
      <TechnicianIdCardModal
        open={isIdCardEditorOpen}
        onOpenChange={setIsIdCardEditorOpen}
        technician={tech}
        initialEditMode={isAdmin}
        initialEditTab={idCardEditTab}
        isAdmin={isAdmin}
        onSaved={() => {
          loadData()
          onTechnicianUpdated?.()
        }}
      />

      {/* LIGHTBOX PREVIEW DIALOG */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-4 bg-slate-900/95 border-slate-800 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="font-semibold text-sm text-slate-200">{previewTitle || 'Photo Preview'}</div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-hidden">
              <img
                src={previewImage}
                alt="High Resolution Preview"
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>High-resolution original document / photograph</span>
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline"
              >
                Open in Full Window <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

