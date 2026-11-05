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
import { useSettings } from '@/store/settingsStore'
import {
  DispatchDetails,
  generateWhatsAppMessage,
  generateSMSMessage,
  openWhatsApp,
  openDirectWhatsAppApp,
  openDeviceSMS,
  copyTextToClipboard,
  generateGoogleMapsLink,
} from '@/lib/dispatch'
import {
  Phone,
  MapPin,
  Wrench,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  User,
  AlertTriangle,
} from 'lucide-react'

interface DispatchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  details: Partial<DispatchDetails> | null
  title?: string
  subtitle?: string
}

export function DispatchModal({
  open,
  onOpenChange,
  details,
  title = 'Technician Assigned! Dispatch Job Details',
  subtitle = 'Send the customer address and service requirement to the technician via WhatsApp and device SMS messaging applications.',
}: DispatchModalProps) {
  const { settings } = useSettings()
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms'>('whatsapp')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [isCustomEdited, setIsCustomEdited] = useState(false)

  const buildCurrentMessage = (tab: 'whatsapp' | 'sms') => {
    if (!details) return ''
    if (tab === 'whatsapp') {
      return generateWhatsAppMessage(
        details,
        settings.dispatch_whatsapp_template,
        settings.platform_name || 'Karigar Setu'
      )
    }
    return generateSMSMessage(details, settings.platform_name || 'Karigar Setu')
  }

  // Re-sync message when details or tab change (unless user custom-edited)
  useEffect(() => {
    if (!details) {
      setMessage('')
      setIsCustomEdited(false)
      return
    }

    if (!isCustomEdited) {
      setMessage(buildCurrentMessage(activeTab))
    }
  }, [details, activeTab, isCustomEdited, settings.dispatch_whatsapp_template, settings.platform_name])

  // Reset custom edit flag when modal opens fresh
  useEffect(() => {
    if (open && details) {
      setIsCustomEdited(false)
      setMessage(buildCurrentMessage(activeTab))
    }
  }, [open, settings.dispatch_whatsapp_template, settings.platform_name])

  if (!details) return null

  const mapsUrl = generateGoogleMapsLink(details)
  const techPhone = details.technicianPhone || ''
  const urgency = (details.urgency || 'Normal').toLowerCase()

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(message)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSendWhatsApp = () => {
    if (!techPhone) {
      alert('Technician phone number is missing.')
      return
    }
    openWhatsApp(techPhone, message)
  }

  const handleSendDirectWhatsApp = () => {
    if (!techPhone) {
      alert('Technician phone number is missing.')
      return
    }
    openDirectWhatsAppApp(techPhone, message)
  }

  const handleSendSMS = () => {
    if (!techPhone) {
      alert('Technician phone number is missing.')
      return
    }
    openDeviceSMS(techPhone, message)
  }

  const handleResetTemplate = () => {
    setIsCustomEdited(false)
    if (activeTab === 'whatsapp') {
      setMessage(generateWhatsAppMessage(details))
    } else {
      setMessage(generateSMSMessage(details))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[94vh] overflow-y-auto p-4 sm:p-6 bg-white w-[95vw] sm:w-full">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Technician & Customer Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Technician Card */}
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">
                  Assigned Technician
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
                  Active Dispatch
                </Badge>
              </div>
              <div className="font-bold text-sm text-slate-900">
                {details.technicianName || 'Technician'}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3 w-3 text-emerald-600" />
                <a
                  href={`tel:${techPhone}`}
                  className="font-mono text-emerald-700 font-medium hover:underline"
                >
                  {techPhone || 'No phone'}
                </a>
              </div>
            </div>

            {/* Customer & Location Card */}
            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-800 uppercase tracking-wider text-[10px]">
                  Customer & Location
                </span>
                <span className="text-[11px] font-mono text-indigo-700">
                  {details.jobId ? `Job #${details.jobId}` : ''}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                {details.customerName || 'Customer'}
              </div>
              <div className="text-slate-700 font-mono text-[11px]">
                {details.customerPhone}
                {details.customerAltPhone && ` • Alt: ${details.customerAltPhone}`}
              </div>
              <div className="flex items-start gap-1.5 text-slate-600 text-[11px] leading-tight">
                <MapPin className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>{details.customerArea || 'Pune'}</strong>
                  {details.customerAddress ? `, ${details.customerAddress}` : ''}
                  {details.customerPinCode ? ` (${details.customerPinCode})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Service Details Bar */}
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-medium text-slate-800">
                {details.serviceCategory || 'Service'}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-semibold h-4 px-1.5 ${urgency === 'emergency'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : urgency === 'urgent'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
              >
                {urgency}
              </Badge>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline ml-auto"
            >
              <MapPin className="h-3 w-3 text-rose-500" />
              View Location on Google Maps
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          {/* Primary Action Buttons: WhatsApp & SMS Applications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* WhatsApp Device App Button */}
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {/* WhatsApp Icon SVG */}
              <svg
                className="h-5 w-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Send via WhatsApp</span>
            </Button>

            {/* Device SMS Application Button */}
            <Button
              type="button"
              onClick={handleSendSMS}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Send via SMS (Messaging App)</span>
            </Button>
          </div>

          {/* Quick Copy & Maps Utility Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs h-8 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">
                      Copied to Clipboard!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Job Details</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSendDirectWhatsApp}
                className="text-xs h-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                title="Launch direct whatsapp:// protocol handler"
              >
                Direct WhatsApp App
              </Button>
            </div>

            {isCustomEdited && (
              <button
                type="button"
                onClick={handleResetTemplate}
                className="text-[11px] text-amber-700 hover:underline"
              >
                Reset to Default Template
              </button>
            )}
          </div>

          {/* Message Preview & Customization Editor */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('whatsapp')
                    if (!isCustomEdited) {
                      setMessage(generateWhatsAppMessage(details))
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'whatsapp'
                      ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  WhatsApp Format (Formatted)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('sms')
                    if (!isCustomEdited) {
                      setMessage(generateSMSMessage(details))
                    }
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'sms'
                      ? 'bg-blue-100 text-blue-800 font-semibold border border-blue-300'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  SMS Format (Plain Text)
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                {message.length} characters
              </span>
            </div>

            <textarea
              rows={8}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setIsCustomEdited(true)
              }}
              placeholder="Dispatch message text..."
              className="w-full text-xs font-mono p-3 rounded-md border border-slate-200 bg-slate-50/70 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Device App Notice */}
          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <span className="text-slate-400 text-sm leading-none mt-0.5">💡</span>
            <span>
              <strong>Device Integration:</strong> Clicking <em>Send via WhatsApp</em>{' '}
              opens WhatsApp on this device or WhatsApp Web with the message pre-filled.
              Clicking <em>Send via SMS</em> invokes your device&apos;s native SMS app
              (Android Messages, iOS Messages, or Windows Phone Link).
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 text-slate-600"
          >
            Done / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

