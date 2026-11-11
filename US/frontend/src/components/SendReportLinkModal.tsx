import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/store/settingsStore'
import { getResolvedCompanyName } from '@/lib/utils'
import { serviceRequestsApi } from '@/api/serviceRequests'
import {
  formatIndianPhone,
  openWhatsApp,
  openDeviceSMS,
  copyTextToClipboard
} from '@/lib/dispatch'
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Phone,
  User,
  Wrench,
  Camera,
  IndianRupee,
  Share2,
  Sparkles,
  RotateCcw
} from 'lucide-react'

interface SendReportLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceRequestId: number | null
}

export function SendReportLinkModal({
  open,
  onOpenChange,
  serviceRequestId
}: SendReportLinkModalProps) {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<any | null>(null)
  const [message, setMessage] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [isCustomEdited, setIsCustomEdited] = useState(false)

  // Customization Options
  const [requirePhoto, setRequirePhoto] = useState(true)
  const [requireParts, setRequireParts] = useState(true)
  const [requireCharges, setRequireCharges] = useState(true)
  const [requireRemarks, setRequireRemarks] = useState(false)

  const buildTemplate = (data: any, photo = requirePhoto, parts = requireParts, charges = requireCharges, remarks = requireRemarks) => {
    if (!data) return ''
    const origin = window.location.origin
    const url = `${origin}/job-report/${data.token}`
    const techName = data.technicianName || 'Technician'
    const jobId = data.jobId ? `${data.jobId}` : 'Job'
    const custName = data.customerName || 'Customer'
    const area = data.customerArea ? ` (${data.customerArea})` : ''
    const cat = data.categoryName || 'Appliance Service'
    const pName = getResolvedCompanyName(settings)

    const reqs: string[] = []
    if (charges) reqs.push('• Enter total amount collected from customer')
    if (parts) reqs.push('• Mention parts replaced (if any)')
    if (photo) reqs.push('• Upload 1 clear photo of the repaired machine')
    if (remarks) reqs.push('• Record customer confirmation / warranty notes')

    if (settings.report_link_whatsapp_template && settings.report_link_whatsapp_template.trim()) {
      let msg = settings.report_link_whatsapp_template
      msg = msg.replace(/\{\{\s*(platform_name|company_name)\s*\}\}/gi, pName)
      msg = msg.replace(/\{\{\s*technician_name\s*\}\}/gi, techName)
      msg = msg.replace(/\{\{\s*job_id\s*\}\}/gi, jobId)
      msg = msg.replace(/\{\{\s*customer_name\s*\}\}/gi, `${custName}${area}`)
      msg = msg.replace(/\{\{\s*service_category\s*\}\}/gi, cat)
      msg = msg.replace(/\{\{\s*report_link\s*\}\}/gi, url)
      msg = msg.replace(/\{\{\s*required_items\s*\}\}/gi, reqs.join('\n'))
      return msg.trim()
    }

    return `🛠️ *${pName.toUpperCase()} - WORK COMPLETION REPORT* 🛠️
━━━━━━━━━━━━━━━━━━━━
Hi *${techName}*,
Please submit your job completion report for *#${jobId}*:

👤 *Customer:* ${custName}${area}
🔧 *Category:* ${cat}

👉 *Click here to submit charges, parts & machine photo:*
${url}

📌 *Required Information:*
${reqs.join('\n')}

Please submit this immediately after completing the service. Thank you!`.trim()
  }

  useEffect(() => {
    if (open && serviceRequestId) {
      setLoading(true)
      setIsCustomEdited(false)
      serviceRequestsApi
        .getSubmissionLink(serviceRequestId)
        .then((res: any) => {
          const data = res.data?.data
          setInfo(data)
          setMessage(buildTemplate(data))
        })
        .catch((err) => {
          console.error(err)
        })
        .finally(() => setLoading(false))
    } else {
      setInfo(null)
      setMessage('')
    }
  }, [open, serviceRequestId])

  useEffect(() => {
    if (open && info && !isCustomEdited) {
      setMessage(buildTemplate(info))
    }
  }, [open, info, isCustomEdited, settings.company_name, settings.platform_name, settings.report_link_whatsapp_template])

  const handleOptionToggle = (
    newPhoto: boolean,
    newParts: boolean,
    newCharges: boolean,
    newRemarks: boolean
  ) => {
    setRequirePhoto(newPhoto)
    setRequireParts(newParts)
    setRequireCharges(newCharges)
    setRequireRemarks(newRemarks)
    if (info && !isCustomEdited) {
      setMessage(buildTemplate(info, newPhoto, newParts, newCharges, newRemarks))
    }
  }

  const handleResetTemplate = () => {
    setIsCustomEdited(false)
    if (info) {
      setMessage(buildTemplate(info))
    }
  }

  const handleCopyLink = async () => {
    if (!info?.token) return
    const url = `${window.location.origin}/job-report/${info.token}`
    const ok = await copyTextToClipboard(url)
    if (ok) {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleCopyMessage = async () => {
    const ok = await copyTextToClipboard(message)
    if (ok) {
      setCopiedMsg(true)
      setTimeout(() => setCopiedMsg(false), 2000)
    }
  }

  const handleSendWhatsApp = () => {
    if (!info?.technicianMobile) {
      alert('Technician phone number is not available.')
      return
    }
    openWhatsApp(info.technicianMobile, message)
  }

  const handleSendSMS = () => {
    if (!info?.technicianMobile) {
      alert('Technician phone number is not available.')
      return
    }
    openDeviceSMS(info.technicianMobile, message)
  }

  if (!serviceRequestId) return null

  const origin = window.location.origin
  const submissionUrl = info?.token ? `${origin}/job-report/${info.token}` : ''
  const techPhone = info?.technicianMobile || ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[94vh] overflow-y-auto p-4 sm:p-6 bg-white w-[95vw] sm:w-full">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
              <Share2 className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              Send Work Report &amp; Submission Link via WhatsApp
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Send a feedback &amp; submission link to the technician to submit charges collected, parts replaced, and machine photo.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs">Generating secure technician submission link...</p>
          </div>
        ) : !info ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Failed to generate submission link. Please check if technician is assigned.
          </div>
        ) : (
          <div className="space-y-4 my-2 text-xs">
            {/* Quick Summary Strip */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Technician</span>
                <strong className="text-slate-900 block truncate">{info.technicianName || 'Technician'}</strong>
                <span className="font-mono text-emerald-700 text-[11px]">{techPhone || 'No phone'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer &amp; Area</span>
                <strong className="text-slate-900 block truncate">{info.customerName || 'Customer'}</strong>
                <span className="text-slate-500 text-[11px]">{info.customerArea || 'Pune'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Job ID &amp; Service</span>
                <strong className="text-indigo-700 block font-mono">#{info.jobId}</strong>
                <span className="text-slate-500 text-[11px] truncate block">{info.categoryName}</span>
              </div>
            </div>

            {/* Admin Customization: What to Request */}
            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Customize Information Requested from Technician
                </span>
                {isCustomEdited && (
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="text-[10px] text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Reset to default
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded border border-indigo-100 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={requireCharges}
                    onChange={(e) =>
                      handleOptionToggle(requirePhoto, requireParts, e.target.checked, requireRemarks)
                    }
                    className="rounded text-emerald-600"
                  />
                  <span>💰 Charges Taken</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded border border-indigo-100 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={requireParts}
                    onChange={(e) =>
                      handleOptionToggle(requirePhoto, e.target.checked, requireCharges, requireRemarks)
                    }
                    className="rounded text-emerald-600"
                  />
                  <span>🛠️ Parts Replaced</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded border border-indigo-100 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={requirePhoto}
                    onChange={(e) =>
                      handleOptionToggle(e.target.checked, requireParts, requireCharges, requireRemarks)
                    }
                    className="rounded text-emerald-600"
                  />
                  <span>📷 Machine Photo</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded border border-indigo-100 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={requireRemarks}
                    onChange={(e) =>
                      handleOptionToggle(requirePhoto, requireParts, requireCharges, e.target.checked)
                    }
                    className="rounded text-emerald-600"
                  />
                  <span>📝 Customer Sign/Remarks</span>
                </label>
              </div>
            </div>

            {/* Dynamic Link URL Box */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2">
              <div className="overflow-hidden space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Technician Submission URL:
                </span>
                <span className="font-mono text-emerald-700 font-medium block truncate text-[11px]">
                  {submissionUrl}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-7 px-2 text-[11px]"
                >
                  {copiedLink ? <Check className="h-3 w-3 text-emerald-600 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedLink ? 'Copied Link' : 'Copy Link'}
                </Button>
                <a
                  href={submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-7 px-2 text-[11px] border border-slate-200 rounded flex items-center gap-1 text-slate-700 hover:bg-slate-50"
                  title="Open submission page directly in new tab"
                >
                  <span>Open</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Editable WhatsApp Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  WhatsApp Message Preview (Editable before sending)
                </Label>
                <span className="text-[10px] text-slate-400">{message.length} characters</span>
              </div>
              <textarea
                rows={7}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  setIsCustomEdited(true)
                }}
                className="w-full text-xs font-mono p-3 rounded-md border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Primary Action Buttons: WhatsApp & Device Messaging */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Send WhatsApp Button */}
              <Button
                type="button"
                onClick={handleSendWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Send via WhatsApp</span>
              </Button>

              {/* Device SMS Button */}
              <Button
                type="button"
                onClick={handleSendSMS}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Send via SMS App</span>
              </Button>
            </div>

            {/* Utility actions */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyMessage}
                className="text-xs h-8 text-slate-700"
              >
                {copiedMsg ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1.5" /> : <Copy className="h-3.5 w-3.5 text-slate-500 mr-1.5" />}
                {copiedMsg ? 'Message Copied!' : 'Copy Full WhatsApp Message'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs h-8 text-slate-500"
              >
                Done / Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

