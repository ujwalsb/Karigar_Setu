/**
 * Technician Dispatch & Messaging Utilities
 * Formats job dispatch payloads and launches device WhatsApp & SMS applications.
 */

export interface DispatchDetails {
  technicianName: string
  technicianPhone: string
  technicianAltPhone?: string

  customerName: string
  customerPhone: string
  customerAltPhone?: string
  customerAddress?: string
  customerLandmark?: string
  customerArea?: string
  customerCity?: string
  customerPinCode?: string
  customerLatitude?: number
  customerLongitude?: number

  jobId?: string | number
  serviceCategory?: string
  urgency?: string
  requirement?: string
  problemDescription?: string
  preferredDate?: string
  preferredTime?: string
}

/**
 * Standardize phone number for WhatsApp and SMS delivery (default India +91)
 */
export function formatIndianPhone(phone: string): string {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  return digits
}

/**
 * Generate Google Maps navigation URL for the technician
 */
export function generateGoogleMapsLink(details: Partial<DispatchDetails>): string {
  if (details.customerLatitude && details.customerLongitude) {
    return `https://maps.google.com/?q=${details.customerLatitude},${details.customerLongitude}`
  }
  const parts = [
    details.customerAddress,
    details.customerLandmark,
    details.customerArea,
    details.customerCity || 'Pune',
    details.customerPinCode
  ].filter(Boolean)

  const query = parts.length > 0 ? parts.join(', ') : 'Pune, Maharashtra'
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
}

/**
 * Build rich-text WhatsApp message for the technician
 * Dynamically supports template from admin settings
 */
export function generateWhatsAppMessage(
  details: Partial<DispatchDetails>,
  customTemplate?: string,
  platformName = 'Karigar Setu'
): string {
  const mapsUrl = generateGoogleMapsLink(details)
  const urgencyLabel = (details.urgency || 'Normal').toUpperCase()
  const urgencyEmoji = urgencyLabel === 'EMERGENCY' ? '🚨' : urgencyLabel === 'URGENT' ? '⚡' : '📌'
  const displayJobId = details.jobId ? `${details.jobId}` : 'New Booking'
  const fullAddress = [
    details.customerAddress,
    details.customerArea,
    details.customerCity || 'Pune',
    details.customerPinCode
  ].filter(Boolean).join(', ')

  const preferredSlot = (details.preferredDate || details.preferredTime)
    ? `⏰ *Preferred Slot:* ${[details.preferredDate, details.preferredTime].filter(Boolean).join(' ')}\n`
    : ''

  if (customTemplate && customTemplate.trim()) {
    let msg = customTemplate
    msg = msg.replace(/\{\{\s*(platform_name|company_name)\s*\}\}/gi, platformName)
    msg = msg.replace(/\{\{\s*technician_name\s*\}\}/gi, details.technicianName || 'Technician')
    msg = msg.replace(/\{\{\s*job_id\s*\}\}/gi, displayJobId)
    msg = msg.replace(/\{\{\s*service_category\s*\}\}/gi, details.serviceCategory || 'Appliance Service')
    msg = msg.replace(/\{\{\s*urgency\s*\}\}/gi, urgencyLabel)
    msg = msg.replace(/\{\{\s*urgency_emoji\s*\}\}/gi, urgencyEmoji)
    msg = msg.replace(/\{\{\s*customer_name\s*\}\}/gi, details.customerName || 'Customer')
    msg = msg.replace(/\{\{\s*customer_phone\s*\}\}/gi, details.customerPhone || 'N/A')
    msg = msg.replace(/\{\{\s*customer_address\s*\}\}/gi, fullAddress || 'Address to be confirmed by customer call')
    msg = msg.replace(/\{\{\s*maps_url\s*\}\}/gi, mapsUrl)
    msg = msg.replace(/\{\{\s*requirement\s*\}\}/gi, details.requirement || details.problemDescription || 'General inspection and repair requested.')
    msg = msg.replace(/\{\{\s*preferred_slot\s*\}\}/gi, preferredSlot)
    return msg.trim()
  }

  return `🔧 *${platformName.toUpperCase()} - NEW JOB DISPATCH* 🔧
━━━━━━━━━━━━━━━━━━━━
${urgencyEmoji} *Job ID:* #${displayJobId}
🛠️ *Category:* ${details.serviceCategory || 'Appliance Service'}
⚡ *Urgency:* ${urgencyLabel}
${preferredSlot}👤 *CUSTOMER DETAILS:*
• *Name:* ${details.customerName || 'Customer'}
• *Mobile:* ${details.customerPhone || 'N/A'}${details.customerAltPhone ? `\n• *Alt Mobile:* ${details.customerAltPhone}` : ''}

📍 *CUSTOMER LOCATION / ADDRESS:*
${fullAddress || 'Address to be verified by customer call'}
${details.customerLandmark ? `🏛️ *Landmark:* ${details.customerLandmark}\n` : ''}🗺️ *Google Maps:* ${mapsUrl}

📝 *CUSTOMER REQUIREMENT / ISSUE:*
${details.requirement || details.problemDescription || 'General inspection and repair requested.'}

━━━━━━━━━━━━━━━━━━━━
⚠️ *Technician Instructions:*
1. Call the customer immediately to confirm your visit & ETA.
2. Carry your ${platformName} ID card and safety gear.
3. Update service status once inspection is complete.`.trim()
}

/**
 * Build clean plain-text SMS message for device SMS applications
 */
export function generateSMSMessage(details: Partial<DispatchDetails>, platformName = 'Karigar Setu'): string {
  const mapsUrl = generateGoogleMapsLink(details)
  const urgencyLabel = (details.urgency || 'Normal').toUpperCase()
  const displayJobId = details.jobId ? `#${details.jobId}` : 'New Booking'
  const fullAddress = [
    details.customerAddress,
    details.customerArea,
    details.customerCity || 'Pune',
    details.customerPinCode
  ].filter(Boolean).join(', ')

  return `${platformName.toUpperCase()} JOB DISPATCH
Job: ${displayJobId} | ${details.serviceCategory || 'Service'} (${urgencyLabel})

Customer: ${details.customerName || 'Customer'}
Phone: ${details.customerPhone || 'N/A'}${details.customerAltPhone ? ` / ${details.customerAltPhone}` : ''}
Address: ${fullAddress} ${details.customerLandmark ? `[Near ${details.customerLandmark}]` : ''}
Maps: ${mapsUrl}

Issue: ${details.requirement || details.problemDescription || 'Inspection/Repair'}

Please call the customer immediately to confirm ETA.`.trim()
}

/**
 * Launch WhatsApp application on this device (or WhatsApp Web)
 */
export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = formatIndianPhone(phone)
  const encodedText = encodeURIComponent(message)
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Launch direct WhatsApp native app protocol (whatsapp://)
 */
export function openDirectWhatsAppApp(phone: string, message: string) {
  const cleanPhone = formatIndianPhone(phone)
  const encodedText = encodeURIComponent(message)
  window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
}

/**
 * Launch device native SMS messaging application (Android, iPhone, Windows Phone Link)
 */
export function openDeviceSMS(phone: string, message: string) {
  const cleanPhone = formatIndianPhone(phone)
  const encodedText = encodeURIComponent(message)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const separator = isIOS ? '&' : '?'
  window.location.href = `sms:${cleanPhone}${separator}body=${encodedText}`
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (err) {
    console.warn('Clipboard API failed, trying fallback...', err)
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const success = document.execCommand('copy')
    textArea.remove()
    return success
  } catch (err) {
    console.error('Fallback clipboard failed', err)
    return false
  }
}

