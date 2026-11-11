import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { customersApi } from '@/api/customers'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { formatDate, getStatusColor, getResolvedCompanyName } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'
import { DispatchModal } from '@/components/DispatchModal'
import { DispatchDetails, openWhatsApp } from '@/lib/dispatch'
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Wrench,
  IndianRupee,
  CheckCircle2,
  Clock,
  Send,
  Pencil,
  Save,
  X,
  ExternalLink,
  ClipboardList,
  AlertCircle,
  ShieldCheck,
  Check,
  Share2,
  Camera
} from 'lucide-react'
import { SendReportLinkModal } from '@/components/SendReportLinkModal'
import { getMediaUrl } from '@/utils/media'

interface CustomerServiceDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number | null
  onCustomerUpdated?: () => void
}

export function CustomerServiceDetailsModal({
  open,
  onOpenChange,
  customerId,
  onCustomerUpdated,
}: CustomerServiceDetailsModalProps) {
  const { settings } = useSettings()
  const companyName = getResolvedCompanyName(settings)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'calls'>('requests')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Report Link Modal State
  const [selectedSubmissionReqId, setSelectedSubmissionReqId] = useState<number | null>(null)
  const [isSendLinkModalOpen, setIsSendLinkModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Inline Editing of Work Done & Amount Taken for a specific request
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null)
  const [editWorkForm, setEditWorkForm] = useState({
    work_description: '',
    parts_replaced: '',
    labor_charge: '',
    parts_charge: '',
    final_amount: '',
    payment_status: 'paid',
    payment_mode: 'cash',
    status: 'completed',
    notes: '',
  })
  const [savingWork, setSavingWork] = useState(false)

  // Dispatch modal sub-trigger
  const [dispatchDetails, setDispatchDetails] = useState<Partial<DispatchDetails> | null>(null)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)

  const loadData = () => {
    if (!customerId) return
    setLoading(true)
    setErrorMsg('')
    customersApi
      .getServiceDetails(customerId)
      .then((res: any) => {
        setData(res.data?.data || null)
      })
      .catch((err) => {
        console.error(err)
        setErrorMsg('Failed to load customer service history.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (open && customerId) {
      loadData()
      setEditingRequestId(null)
      setErrorMsg('')
      setSuccessMsg('')
    } else {
      setData(null)
    }
  }, [open, customerId])

  const startEditWork = (r: any) => {
    setEditingRequestId(r.id)
    setEditWorkForm({
      work_description: r.work_description || '',
      parts_replaced: r.parts_replaced || '',
      labor_charge: String(r.labor_charge ?? '0'),
      parts_charge: String(r.parts_charge ?? '0'),
      final_amount: String(r.final_amount ?? '0'),
      payment_status: r.payment_status || 'paid',
      payment_mode: r.payment_mode || 'cash',
      status: r.status || 'completed',
      notes: r.internal_notes || '',
    })
  }

  const handleSaveWorkDone = async (requestId: number) => {
    setSavingWork(true)
    setErrorMsg('')
    try {
      const labor = parseFloat(editWorkForm.labor_charge) || 0
      const parts = parseFloat(editWorkForm.parts_charge) || 0
      let total = parseFloat(editWorkForm.final_amount) || 0
      if (!total && (labor > 0 || parts > 0)) {
        total = labor + parts
      }

      await serviceRequestsApi.complete(requestId, {
        workDescription: editWorkForm.work_description,
        partsReplaced: editWorkForm.parts_replaced,
        laborCharge: labor,
        partsCharge: parts,
        actualCost: total,
        amountTaken: total,
        paymentStatus: editWorkForm.payment_status,
        paymentMode: editWorkForm.payment_mode,
        status: editWorkForm.status,
        notes: editWorkForm.notes,
      })

      setSuccessMsg('Service work details and amount taken recorded successfully!')
      setEditingRequestId(null)
      loadData()
      if (onCustomerUpdated) onCustomerUpdated()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update service work details.')
    } finally {
      setSavingWork(false)
    }
  }

  const openDispatchForRequest = (r: any, cust: any) => {
    setDispatchDetails({
      technicianName: r.technician_name || 'Assigned Technician',
      technicianPhone: r.technician_mobile || '',
      customerName: cust.full_name || 'Customer',
      customerPhone: cust.mobile || '',
      customerAltPhone: cust.alternate_mobile,
      customerAddress: cust.address || '',
      customerLandmark: cust.landmark,
      customerArea: cust.area || 'Pune',
      customerCity: cust.city || 'Pune',
      customerPinCode: cust.pin_code || '',
      jobId: r.request_id || r.id,
      serviceCategory: r.service_category_name || 'Appliance Service',
      requirement: r.work_description || r.requirement || r.problem_description || '',
      urgency: r.urgency || 'Normal',
      preferredDate: r.scheduled_date,
      preferredTime: r.scheduled_time,
    })
    setIsDispatchOpen(true)
  }

  if (!customerId) return null

  const customer = data?.customer
  const metrics = data?.metrics || {
    total_requests: 0,
    completed_requests: 0,
    total_calls: 0,
    total_amount_taken: 0,
  }
  const requests = data?.requests || []
  const calls = data?.calls || []

  const fullAddress = customer
    ? [customer.address, customer.landmark, customer.area, customer.city, customer.pin_code]
      .filter(Boolean)
      .join(', ')
    : ''

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress || 'Pune')}`

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto p-3.5 sm:p-6 bg-white w-[95vw] sm:w-full">
          <DialogHeader className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <User className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    {customer?.full_name || 'Customer Profile & History'}
                    <Badge variant="outline" className="text-xs text-indigo-700 border-indigo-300 font-mono">
                      ID #{customerId}
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-slate-500">
                    Full service repair records, technician assignments, work done, and billing history.
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm">Loading customer service records...</p>
            </div>
          ) : !customer ? (
            <div className="py-12 text-center text-slate-500">Customer details not found.</div>
          ) : (
            <div className="space-y-4 my-2">
              {/* Alert Feedback */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Customer Contact & Address Banner */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Phone className="h-3.5 w-3.5 text-indigo-600" />
                      <a href={`tel:${customer.mobile}`} className="font-mono hover:underline">
                        {customer.mobile}
                      </a>
                    </span>
                    {customer.alternate_mobile && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="text-slate-400">Alt:</span>
                        <a href={`tel:${customer.alternate_mobile}`} className="font-mono hover:underline">
                          {customer.alternate_mobile}
                        </a>
                      </span>
                    )}
                    {customer.email && (
                      <span className="text-slate-600">{customer.email}</span>
                    )}
                  </div>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium hover:underline text-[11px]"
                  >
                    <MapPin className="h-3 w-3 text-rose-500" />
                    Open Location on Maps
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                <div className="flex items-start gap-1.5 text-slate-700 leading-relaxed pt-1 border-t border-slate-200/60">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Address:</strong> {fullAddress || 'No full address specified'}
                  </span>
                </div>
              </div>

              {/* Lifetime Statistics KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/70">
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    Total Amount Taken
                  </div>
                  <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
                    ₹{Number(metrics.total_amount_taken || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Lifetime revenue from customer</div>
                </div>

                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/70">
                  <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed Jobs
                  </div>
                  <div className="text-xl font-bold text-blue-700 font-mono mt-1">
                    {metrics.completed_requests}
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Successful repairs finished</div>
                </div>

                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/70">
                  <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Service Requests
                  </div>
                  <div className="text-xl font-bold text-indigo-700 font-mono mt-1">
                    {metrics.total_requests}
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">Total job orders created</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    Calls Logged
                  </div>
                  <div className="text-xl font-bold text-slate-800 font-mono mt-1">
                    {metrics.total_calls}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Incoming inquiries / calls</div>
                </div>
              </div>

              {/* Navigation Tabs (Smooth Scroll on Mobile) */}
              <div className="flex border-b border-slate-200 pt-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className={`py-2 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'requests'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Service Jobs, Work Done &amp; Billing ({requests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('calls')}
                  className={`py-2 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${activeTab === 'calls'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Logged Inbound Calls ({calls.length})
                </button>
              </div>

              {/* TAB 1: SERVICE REQUESTS (WORK DONE & BILLING) */}
              {activeTab === 'requests' && (
                <div className="space-y-3 pt-1">
                  {requests.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No service requests logged for this customer yet.
                    </div>
                  ) : (
                    requests.map((r: any) => {
                      const isEditing = editingRequestId === r.id
                      const hasWorkDone = Boolean(r.work_description || r.parts_replaced)
                      const hasAmount = parseFloat(r.final_amount) > 0

                      return (
                        <div
                          key={r.id}
                          className="border border-slate-200 rounded-lg p-4 bg-white shadow-2xs space-y-3"
                        >
                          {/* Request Top Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs text-indigo-600">
                                {r.request_id || `#SR-${r.id}`}
                              </span>
                              {r.call_id && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ({r.call_id})
                                </span>
                              )}
                              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
                                {r.service_category_name || 'Appliance Service'}
                              </Badge>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${getStatusColor(
                                  r.status
                                )}`}
                              >
                                {r.status ? r.status.replace(/_/g, ' ') : 'Pending'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {formatDate(r.completed_at || r.created_at)}
                              </span>
                              {!isEditing && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditWork(r)}
                                  className="h-7 px-2.5 text-xs text-slate-700 border-slate-300 hover:text-indigo-600 flex items-center gap-1 font-medium"
                                  title="Record or modify work done and amount taken"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit Work &amp; Amount
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Technician Attribution Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 px-3 py-2 rounded-md text-xs">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                                {r.technician_name ? r.technician_name.charAt(0) : 'T'}
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] block">Assigned Technician:</span>
                                <span className="font-semibold text-slate-800">
                                  {r.technician_name || 'Unassigned'}
                                </span>
                              </div>
                              {r.technician_mobile && (
                                <a
                                  href={`tel:${r.technician_mobile}`}
                                  className="font-mono text-emerald-700 font-medium ml-2 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  {r.technician_mobile}
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {r.technician_mobile && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDispatchForRequest(r, customer)}
                                  className="h-6 px-2 text-[11px] text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1"
                                  title="Send details to technician via WhatsApp / SMS"
                                >
                                  <Send className="h-2.5 w-2.5" />
                                  WhatsApp / SMS Tech
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSubmissionReqId(r.id)
                                  setIsSendLinkModalOpen(true)
                                }}
                                className="h-6 px-2 text-[11px] text-indigo-700 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 font-medium"
                                title="Send Job Report Submission Link to technician via WhatsApp"
                              >
                                <Share2 className="h-2.5 w-2.5" />
                                Send Report Link
                              </Button>
                            </div>
                          </div>

                          {/* DISPLAY MODE: Work Done & Billing Summary */}
                          {!isEditing ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                                {/* Left Box: What Work Done */}
                                <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/40 space-y-2">
                                  <div className="font-semibold text-indigo-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                    <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                                    What Work Done &amp; Diagnosis
                                  </div>
                                  <div className="text-slate-800 leading-relaxed font-normal bg-white p-2.5 rounded border border-indigo-100/60 text-xs min-h-[46px]">
                                    {r.work_description || (
                                      <span className="text-slate-400 italic">
                                        No detailed work notes entered yet. Click &quot;Edit Work &amp; Amount&quot; to record diagnosis and repairs.
                                      </span>
                                    )}
                                  </div>

                                  {r.parts_replaced && (
                                    <div className="text-[11px] text-slate-700 bg-white px-2.5 py-1.5 rounded border border-indigo-100/60">
                                      <strong className="text-indigo-800">Parts Replaced: </strong>
                                      {r.parts_replaced}
                                    </div>
                                  )}

                                  {r.technician_remarks && (
                                    <div className="text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded border border-indigo-100/60">
                                      <strong className="text-slate-800">Technician Remarks: </strong>
                                      {r.technician_remarks}
                                    </div>
                                  )}

                                  {(r.requirement || r.problem_description) && (
                                    <div className="text-[11px] text-slate-500 pt-1">
                                      <strong>Original Complaint:</strong>{' '}
                                      {r.requirement || r.problem_description}
                                    </div>
                                  )}
                                </div>

                                {/* Right Box: How Much Amount Taken & Payment */}
                                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-2">
                                  <div className="font-semibold text-emerald-900 text-xs flex items-center justify-between uppercase tracking-wide">
                                    <span className="flex items-center gap-1.5">
                                      <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                                      Amount Taken &amp; Billing
                                    </span>
                                    <Badge
                                      className={`text-[10px] uppercase font-semibold h-4 px-1.5 ${r.payment_status === 'paid'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                        }`}
                                    >
                                      {r.payment_status || 'Pending'}
                                    </Badge>
                                  </div>

                                  <div className="bg-white p-2.5 rounded border border-emerald-200/80 space-y-1.5">
                                    <div className="flex items-center justify-between text-base font-bold text-slate-900">
                                      <span>Total Amount Taken:</span>
                                      <span className="font-mono text-emerald-700 text-lg">
                                        ₹{Number(r.final_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                                      <div>
                                        Labor Charge: <strong>₹{Number(r.labor_charge || 0).toFixed(2)}</strong>
                                      </div>
                                      <div>
                                        Parts Charge: <strong>₹{Number(r.parts_charge || 0).toFixed(2)}</strong>
                                      </div>
                                      <div>
                                        Payment Mode:{' '}
                                        <strong className="uppercase">{r.payment_mode || 'Cash'}</strong>
                                      </div>
                                      <div>
                                        Date:{' '}
                                        <strong>{formatDate(r.completed_at || r.updated_at)}</strong>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* DEDICATED SECTION: One Photo of Repaired Machine / Appliance */}
                              <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-white space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                    <Camera className="h-4 w-4 text-indigo-600" />
                                    <span>One Photo of Repaired Machine / Appliance</span>
                                  </div>
                                  {r.machine_photo_url ? (
                                    <Badge className="bg-emerald-600 text-white text-[10px] font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Photo Attached
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-slate-400 border-slate-300 text-[10px]">
                                      No Photo Yet
                                    </Badge>
                                  )}
                                </div>

                                {r.machine_photo_url ? (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                                    <div
                                      className="relative group cursor-pointer shrink-0"
                                      onClick={() => setPreviewImage(r.machine_photo_url)}
                                      title="Click to zoom machine photo"
                                    >
                                      <img
                                        src={getMediaUrl(r.machine_photo_url)}
                                        alt="Repaired Machine / Appliance"
                                        className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-lg border-2 border-indigo-200 shadow-sm transition-transform group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[11px] font-medium">
                                        Click to Zoom
                                      </div>
                                    </div>

                                    <div className="space-y-1.5 flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                        <span>Repaired Appliance Photo Submitted by Technician</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">
                                        This on-site photo was submitted by {r.technician_name || 'the technician'} upon completing diagnosis, repairs, and parts replacement.
                                      </p>
                                      {r.technician_remarks && (
                                        <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                                          <strong>Technician Remarks:</strong> {r.technician_remarks}
                                        </div>
                                      )}
                                      <div className="pt-1 flex items-center gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setPreviewImage(r.machine_photo_url)}
                                          className="h-7 text-xs text-indigo-700 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 font-medium"
                                        >
                                          <Camera className="h-3.5 w-3.5" />
                                          Enlarge / Zoom Photo
                                        </Button>
                                        <a
                                          href={getMediaUrl(r.machine_photo_url)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium ml-1"
                                        >
                                          Open Full Image <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-md border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                        <Camera className="h-3.5 w-3.5" />
                                      </div>
                                      <span>No machine photo uploaded yet for this service request.</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedSubmissionReqId(r.id)
                                        setIsSendLinkModalOpen(true)
                                      }}
                                      className="h-6 text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 font-medium shrink-0"
                                    >
                                      <Share2 className="h-2.5 w-2.5" />
                                      Send Photo Submission Link
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            /* INLINE EDIT FORM: Update Work Done & Amount Taken */
                            <div className="p-3.5 rounded-lg border border-indigo-300 bg-indigo-50/50 space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
                                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                                  <Pencil className="h-3.5 w-3.5 text-indigo-600" />
                                  Record What Work Done &amp; Amount Taken (#{r.request_id || r.id})
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRequestId(null)}
                                  className="h-6 w-6 p-0 text-slate-500"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[11px] font-semibold text-slate-700">
                                    What Work Done / Repair Description *
                                  </Label>
                                  <textarea
                                    rows={3}
                                    value={editWorkForm.work_description}
                                    onChange={(e) =>
                                      setEditWorkForm({ ...editWorkForm, work_description: e.target.value })
                                    }
                                    placeholder="e.g. Replaced faulty compressor start capacitor and cleaned outdoor condenser coil..."
                                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-semibold text-slate-700">
                                    Parts Replaced / Spare Parts
                                  </Label>
                                  <textarea
                                    rows={3}
                                    value={editWorkForm.parts_replaced}
                                    onChange={(e) =>
                                      setEditWorkForm({ ...editWorkForm, parts_replaced: e.target.value })
                                    }
                                    placeholder="e.g. 45 MFD Dual Run Capacitor, 10A Relay..."
                                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                  />
                                </div>
                              </div>

                              {/* Billing & Charges Row */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                                <div className="space-y-1">
                                  <Label className="text-[11px] font-semibold text-slate-700">
                                    Labor Charge (₹)
                                  </Label>
                                  <Input
                                    type="number"
                                    value={editWorkForm.labor_charge}
                                    onChange={(e) => {
                                      const l = e.target.value
                                      const p = editWorkForm.parts_charge
                                      const tot = (parseFloat(l) || 0) + (parseFloat(p) || 0)
                                      setEditWorkForm({
                                        ...editWorkForm,
                                        labor_charge: l,
                                        final_amount: tot > 0 ? String(tot) : editWorkForm.final_amount,
                                      })
                                    }}
                                    placeholder="500"
                                    className="h-8 text-xs"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-semibold text-slate-700">
                                    Parts Charge (₹)
                                  </Label>
                                  <Input
                                    type="number"
                                    value={editWorkForm.parts_charge}
                                    onChange={(e) => {
                                      const p = e.target.value
                                      const l = editWorkForm.labor_charge
                                      const tot = (parseFloat(l) || 0) + (parseFloat(p) || 0)
                                      setEditWorkForm({
                                        ...editWorkForm,
                                        parts_charge: p,
                                        final_amount: tot > 0 ? String(tot) : editWorkForm.final_amount,
                                      })
                                    }}
                                    placeholder="850"
                                    className="h-8 text-xs"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-bold text-emerald-800">
                                    Total Amount Taken (₹) *
                                  </Label>
                                  <Input
                                    type="number"
                                    value={editWorkForm.final_amount}
                                    onChange={(e) =>
                                      setEditWorkForm({ ...editWorkForm, final_amount: e.target.value })
                                    }
                                    placeholder="1350"
                                    className="h-8 text-xs font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-semibold text-slate-700">
                                    Payment Status
                                  </Label>
                                  <select
                                    value={editWorkForm.payment_status}
                                    onChange={(e) =>
                                      setEditWorkForm({ ...editWorkForm, payment_status: e.target.value })
                                    }
                                    className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white"
                                  >
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="partially_paid">Partially Paid</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[11px] font-semibold text-slate-700">
                                    Payment Mode
                                  </Label>
                                  <select
                                    value={editWorkForm.payment_mode}
                                    onChange={(e) =>
                                      setEditWorkForm({ ...editWorkForm, payment_mode: e.target.value })
                                    }
                                    className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white uppercase font-mono text-[11px]"
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI (GPay/PhonePe)</option>
                                    <option value="card">Card / POS</option>
                                    <option value="online">Online / Netbanking</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRequestId(null)}
                                  className="h-8 text-xs text-slate-600"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={savingWork}
                                  onClick={() => handleSaveWorkDone(r.id)}
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  {savingWork ? 'Saving...' : 'Save Work Done & Amount'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* TAB 2: CUSTOMER CALLS */}
              {activeTab === 'calls' && (
                <div className="space-y-2 pt-1 text-xs">
                  {calls.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      No inbound calls logged for this customer.
                    </div>
                  ) : (
                    calls.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-indigo-700">
                              {c.call_id || `#CC-${c.id}`}
                            </span>
                            <Badge variant="outline" className="text-[11px] text-slate-700">
                              {c.service_category_name || 'General Inbound'}
                            </Badge>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${getStatusColor(
                                c.status
                              )}`}
                            >
                              {c.status ? c.status.replace(/_/g, ' ') : 'New'}
                            </span>
                          </div>
                          <div className="text-slate-700">
                            <strong>Problem: </strong>
                            {c.requirement || c.problem_description || 'General inquiry'}
                          </div>
                        </div>

                        <div className="text-right text-slate-400 text-[11px] shrink-0 font-mono">
                          {formatDate(c.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>{companyName} • Customer Lifetime Details</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 text-slate-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded WhatsApp/SMS Dispatch Modal if needed */}
      <DispatchModal
        open={isDispatchOpen}
        onOpenChange={setIsDispatchOpen}
        details={dispatchDetails}
        title="Dispatch Details to Assigned Technician"
      />

      {/* Embedded Send Report / Submission Link Modal */}
      <SendReportLinkModal
        open={isSendLinkModalOpen}
        onOpenChange={setIsSendLinkModalOpen}
        serviceRequestId={selectedSubmissionReqId}
      />

      {/* Lightbox: One Photo of Repaired Machine / Appliance */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl p-5 bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-indigo-600" />
                  One Photo of Repaired Machine / Appliance
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="pt-2 text-center space-y-3">
              <div className="bg-slate-900/5 p-2 rounded-lg border border-slate-200">
                <img
                  src={getMediaUrl(previewImage)}
                  alt="Repaired Machine Full Resolution"
                  className="max-h-[65vh] w-auto mx-auto rounded shadow-sm object-contain"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Verified technician site capture</span>
                <div className="flex items-center gap-2">
                  <a
                    href={getMediaUrl(previewImage)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-medium text-xs mr-2"
                  >
                    Open in New Tab <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button size="sm" variant="outline" onClick={() => setPreviewImage(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

