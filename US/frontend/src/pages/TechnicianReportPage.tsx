import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSettings } from '@/store/settingsStore'
import { resolveAssetUrl, getResolvedCompanyName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Wrench,
  Camera,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  ShieldCheck,
  X,
  Image as ImageIcon
} from 'lucide-react'

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return '/api/v1'
    }
  }
  return envUrl || '/api/v1'
}
const API_BASE = getApiBase()

export function TechnicianReportPage() {
  const { token } = useParams<{ token: string }>()
  const { settings } = useSettings()

  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const brandName = (job?.branding?.companyName || getResolvedCompanyName(settings)).trim()
  const brandLogoUrl = resolveAssetUrl(job?.branding?.companyLogoUrl || settings.company_logo_url)

  // Form State
  const [workDescription, setWorkDescription] = useState('')
  const [partsReplaced, setPartsReplaced] = useState('')
  const [laborCharge, setLaborCharge] = useState('')
  const [partsCharge, setPartsCharge] = useState('')
  const [finalAmount, setFinalAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [remarks, setRemarks] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid submission link.')
      setLoading(false)
      return
    }

    fetch(`${API_BASE}/public/job-report/${token}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load job details.')
        }
        setJob(json.data)
        if (json.data.workDescription) setWorkDescription(json.data.workDescription)
        if (json.data.partsReplaced) setPartsReplaced(json.data.partsReplaced)
        if (json.data.laborCharge) setLaborCharge(String(json.data.laborCharge))
        if (json.data.partsCharge) setPartsCharge(String(json.data.partsCharge))
        if (json.data.finalAmount) setFinalAmount(String(json.data.finalAmount))
        if (json.data.paymentMode) setPaymentMode(json.data.paymentMode)
        if (json.data.technicianRemarks) setRemarks(json.data.technicianRemarks)
        if (json.data.machinePhotoUrl) {
          const fullPhotoUrl = json.data.machinePhotoUrl.startsWith('http')
            ? json.data.machinePhotoUrl
            : `${API_BASE.replace('/api/v1', '')}${json.data.machinePhotoUrl}`
          setPhotoPreview(fullPhotoUrl)
        }
        if (json.data.status === 'completed' && json.data.finalAmount > 0) {
          // Already completed, but technician can review or re-edit
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Invalid or expired job submission link.')
      })
      .finally(() => setLoading(false))
  }, [token])

  // Handle live photo selection and camera capture
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('Photo size exceeds 15MB. Please choose a smaller photo.')
        return
      }
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setSelectedPhoto(null)
    setPhotoPreview(null)
  }

  const handleLaborOrPartsChange = (laborVal: string, partsVal: string) => {
    const l = parseFloat(laborVal) || 0
    const p = parseFloat(partsVal) || 0
    const total = l + p
    if (total > 0) {
      setFinalAmount(String(total))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!workDescription.trim()) {
      alert('Please describe what work was done on the machine.')
      return
    }

    const total = parseFloat(finalAmount)
    if (isNaN(total) || total < 0) {
      alert('Please enter a valid total amount collected from the customer.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('work_description', workDescription.trim())
      formData.append('parts_replaced', partsReplaced.trim())
      formData.append('labor_charge', String(parseFloat(laborCharge) || 0))
      formData.append('parts_charge', String(parseFloat(partsCharge) || 0))
      formData.append('final_amount', String(total))
      formData.append('payment_status', paymentStatus)
      formData.append('payment_mode', paymentMode)
      formData.append('technician_remarks', remarks.trim())

      if (selectedPhoto) {
        formData.append('machine_photo', selectedPhoto)
      }

      const res = await fetch(`${API_BASE}/public/job-report/${token}`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit job report.')
      }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting report.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading job submission form...</p>
        </div>
      </div>
    )
  }

  if (errorMsg && !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 shadow-sm text-center p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Link Not Found or Expired</h2>
            <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
          </div>
          <p className="text-xs text-slate-400">
            Please ask {brandName} support or administrator to re-send the WhatsApp submission link.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-6 px-3 sm:px-6">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandName} className="h-4 w-4 rounded-sm bg-white object-contain p-0.5" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {brandName}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Technician Work &amp; Completion Report
          </h1>
          <p className="text-xs text-slate-500">
            Submit repair details, parts replaced, charges collected, and machine photo.
          </p>
        </div>

        {/* SUCCESS CONFIRMATION SCREEN */}
        {success ? (
          <Card className="border-emerald-300 bg-white shadow-md p-6 text-center space-y-4 animate-in fade-in-50 zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Service Request Status: COMPLETED
              </div>
              <h2 className="text-xl font-bold text-slate-900 pt-1">Work Report Submitted Successfully!</h2>
              <p className="text-xs text-slate-600">
                Thank you, <strong>{job?.technicianName || 'Technician'}</strong>. Your report for Job{' '}
                <strong>#{job?.requestId}</strong> has been recorded and the service request status has been updated to{' '}
                <span className="text-emerald-700 font-bold uppercase">Completed</span>.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-left space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600">Customer:</span>
                <span className="text-slate-900">{job?.customerName}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-600">Appliance Service:</span>
                <span className="text-slate-900">{job?.serviceCategory}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-emerald-800 pt-1 border-t border-emerald-200">
                <span>Amount Collected:</span>
                <span className="font-mono">₹{parseFloat(finalAmount).toFixed(2)} ({paymentMode.toUpperCase()})</span>
              </div>
              {photoPreview && (
                <div className="pt-2 border-t border-emerald-200 text-center">
                  <span className="text-[11px] text-slate-500 block mb-1">Machine Photo Uploaded:</span>
                  <img
                    src={photoPreview}
                    alt="Machine Photo"
                    className="max-h-48 mx-auto rounded-md border border-slate-200 object-cover shadow-2xs"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              You may close this window now. {brandName} admin and the customer have been updated.
            </p>
          </Card>
        ) : (
          /* SUBMISSION FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Summary Banner */}
            <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-blue-50/70 shadow-2xs">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white font-mono text-[11px]">
                      {job?.requestId || '#Job'}
                    </Badge>
                    <Badge
                      className={`text-[10px] uppercase font-semibold h-5 px-2 ${job?.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                    >
                      Status: {job?.status ? job.status.replace(/_/g, ' ') : 'Pending'}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-800">
                    {job?.serviceCategory}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Customer Name:</span>
                    <strong className="text-slate-900">{job?.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Locality:</span>
                    <strong className="text-slate-900">{job?.customerArea || 'Pune'}</strong>
                  </div>
                </div>

                {job?.requirement && (
                  <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-indigo-100">
                    <span className="font-semibold text-indigo-900">Original Complaint: </span>
                    {job?.requirement}
                  </div>
                )}
              </CardContent>
            </Card>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Form Fields */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                {/* 1. What Work Done */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                    What Work Done / Repair Description *
                  </Label>
                  <textarea
                    rows={3}
                    required
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Describe what was repaired (e.g. Replaced damaged capacitor, repaired wiring, cleaned cooling coils, tested cooling)..."
                    className="w-full text-xs p-3 rounded-md border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* 2. Parts Replaced */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    Parts Replaced / Spare Parts Used
                  </Label>
                  <Input
                    type="text"
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    placeholder="e.g. Dual Run Capacitor 45 MFD, Blower Fan Belt (or 'None' if service only)"
                    className="h-10 text-xs"
                  />
                  <p className="text-[10px] text-slate-400">
                    Leave blank or enter &apos;None&apos; if no new spare parts were installed.
                  </p>
                </div>

                {/* 3. Machine / Appliance Photo Upload (Camera Capture) */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-indigo-600" />
                      One Photo of Repaired Machine / Appliance *
                    </span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      Camera capture supported
                    </span>
                  </Label>

                  {!photoPreview ? (
                    <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50/70 hover:bg-emerald-50/30 transition-colors">
                      <Camera className="h-8 w-8 text-emerald-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-800">
                        Take Photo or Select Machine Photo
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        JPEG, PNG, WEBP (Supports phone camera snapshot)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-lg border border-slate-200 p-2 bg-slate-50 flex items-center gap-3">
                      <img
                        src={photoPreview}
                        alt="Machine Preview"
                        className="h-20 w-20 object-cover rounded-md border border-slate-300 shrink-0"
                      />
                      <div className="space-y-1 overflow-hidden flex-1">
                        <span className="text-xs font-medium text-slate-800 block truncate">
                          {selectedPhoto?.name || 'Machine Photo Uploaded'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          Ready for submission
                        </span>
                        <div className="flex items-center gap-2 pt-1">
                          <label className="text-[11px] text-indigo-600 hover:underline cursor-pointer font-medium">
                            Replace Photo
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-[11px] text-red-600 hover:underline font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Charges & Amount Taken Breakdown */}
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-3 pt-2">
                  <div className="font-bold text-emerald-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 uppercase tracking-wide">
                      <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                      Charges &amp; Total Amount Collected
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono font-normal">
                      INR (₹)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-slate-700">
                        Labor / Inspection (₹)
                      </Label>
                      <Input
                        type="number"
                        value={laborCharge}
                        onChange={(e) => {
                          setLaborCharge(e.target.value)
                          handleLaborOrPartsChange(e.target.value, partsCharge)
                        }}
                        placeholder="e.g. 500"
                        className="h-9 text-xs bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-slate-700">
                        Parts / Material (₹)
                      </Label>
                      <Input
                        type="number"
                        value={partsCharge}
                        onChange={(e) => {
                          setPartsCharge(e.target.value)
                          handleLaborOrPartsChange(laborCharge, e.target.value)
                        }}
                        placeholder="e.g. 850"
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Big Total Amount Taken */}
                  <div className="space-y-1 pt-1 border-t border-emerald-200/80">
                    <Label className="text-xs font-black text-emerald-900 flex items-center justify-between">
                      <span>Total Amount Taken from Customer (₹) *</span>
                      <span className="text-[10px] text-emerald-700 font-normal">
                        (Auto-sums labor + parts)
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-emerald-700 text-base">
                        ₹
                      </span>
                      <Input
                        type="number"
                        required
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        placeholder="1350"
                        className="h-11 pl-7 text-base font-bold text-emerald-800 bg-white border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-[11px] font-semibold text-slate-700">
                      Payment Mode Received:
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'cash', label: 'Cash 💵' },
                        { id: 'upi', label: 'UPI / GPay 📱' },
                        { id: 'card', label: 'Card / POS 💳' },
                        { id: 'online', label: 'Online 🌐' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id)}
                          className={`py-2 px-2.5 rounded-md border text-center font-medium transition-all ${paymentMode === mode.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Additional Remarks / Feedback */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-900">
                    Technician Remarks / Customer Confirmation (Optional)
                  </Label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Customer checked cooling and signed off. 3 months warranty provided on capacitor..."
                    className="w-full text-xs p-2.5 rounded-md border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading Report &amp; Machine Photo...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Submit Work Report &amp; Complete Service Request</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}

