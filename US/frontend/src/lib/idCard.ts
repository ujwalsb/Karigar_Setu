import { resolveAssetUrl, getInitials, formatDate, getResolvedCompanyName } from './utils'

export type IdCardThemeKey = 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'slate'

export interface IdCardThemeConfig {
  id: IdCardThemeKey
  label: string
  headerGradient: string
  swatchBg: string
  accentHex: string
  accentDarkHex: string
  accentLightHex: string
  accentTextClass: string
  accentBorderClass: string
  accentSoftBgClass: string
}

export const ID_CARD_THEMES: Record<IdCardThemeKey, IdCardThemeConfig> = {
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    headerGradient: 'from-indigo-700 via-indigo-600 to-blue-700',
    swatchBg: 'bg-indigo-600',
    accentHex: '#4f46e5',
    accentDarkHex: '#3730a3',
    accentLightHex: '#eef2ff',
    accentTextClass: 'text-indigo-700',
    accentBorderClass: 'border-indigo-200',
    accentSoftBgClass: 'bg-indigo-50',
  },
  blue: {
    id: 'blue',
    label: 'Ocean Blue',
    headerGradient: 'from-blue-700 via-blue-600 to-cyan-600',
    swatchBg: 'bg-blue-600',
    accentHex: '#2563eb',
    accentDarkHex: '#1d4ed8',
    accentLightHex: '#eff6ff',
    accentTextClass: 'text-blue-700',
    accentBorderClass: 'border-blue-200',
    accentSoftBgClass: 'bg-blue-50',
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    headerGradient: 'from-emerald-700 via-emerald-600 to-teal-600',
    swatchBg: 'bg-emerald-600',
    accentHex: '#059669',
    accentDarkHex: '#047857',
    accentLightHex: '#ecfdf5',
    accentTextClass: 'text-emerald-700',
    accentBorderClass: 'border-emerald-200',
    accentSoftBgClass: 'bg-emerald-50',
  },
  violet: {
    id: 'violet',
    label: 'Royal Violet',
    headerGradient: 'from-violet-700 via-purple-600 to-indigo-700',
    swatchBg: 'bg-violet-600',
    accentHex: '#7c3aed',
    accentDarkHex: '#5b21b6',
    accentLightHex: '#f5f3ff',
    accentTextClass: 'text-violet-700',
    accentBorderClass: 'border-violet-200',
    accentSoftBgClass: 'bg-violet-50',
  },
  rose: {
    id: 'rose',
    label: 'Crimson',
    headerGradient: 'from-rose-700 via-rose-600 to-pink-600',
    swatchBg: 'bg-rose-600',
    accentHex: '#e11d48',
    accentDarkHex: '#be123c',
    accentLightHex: '#fff1f2',
    accentTextClass: 'text-rose-700',
    accentBorderClass: 'border-rose-200',
    accentSoftBgClass: 'bg-rose-50',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    headerGradient: 'from-amber-600 via-orange-600 to-amber-700',
    swatchBg: 'bg-amber-600',
    accentHex: '#d97706',
    accentDarkHex: '#b45309',
    accentLightHex: '#fffbeb',
    accentTextClass: 'text-amber-700',
    accentBorderClass: 'border-amber-200',
    accentSoftBgClass: 'bg-amber-50',
  },
  slate: {
    id: 'slate',
    label: 'Executive Dark',
    headerGradient: 'from-slate-900 via-slate-800 to-slate-700',
    swatchBg: 'bg-slate-800',
    accentHex: '#1e293b',
    accentDarkHex: '#0f172a',
    accentLightHex: '#f1f5f9',
    accentTextClass: 'text-slate-800',
    accentBorderClass: 'border-slate-300',
    accentSoftBgClass: 'bg-slate-100',
  },
}

export interface IdCardCompanyInfo {
  platform_name?: string
  company_name?: string
  tagline?: string
  company_logo_url?: string
  support_phone?: string
  support_email?: string
  business_address?: string
  primary_color?: string
}

export function resolveIdCardTheme(themeKey?: string | null, fallbackKey?: string | null): IdCardThemeConfig {
  const key = (themeKey || fallbackKey || 'indigo') as IdCardThemeKey
  return ID_CARD_THEMES[key] || ID_CARD_THEMES.indigo
}

export function getTechnicianDisplayName(tech: any): string {
  return (tech?.full_name || tech?.name || 'Technician').trim()
}

export function getTechnicianBadgeCode(tech: any): string {
  if (tech?.badge_code && String(tech.badge_code).trim()) {
    return String(tech.badge_code).trim()
  }
  const numId = tech?.id ? String(tech.id).padStart(4, '0') : '0000'
  return `TECH-${numId}`
}

export function getTechnicianDesignation(tech: any): string {
  if (tech?.designation && String(tech.designation).trim()) {
    return String(tech.designation).trim()
  }
  const firstSkill = tech?.skills?.[0]
  const rawCat = firstSkill?.category_name || firstSkill?.name
  if (rawCat) {
    const clean = String(rawCat).split('(')[0].replace(/& Service/i, '').trim()
    return `${clean} Specialist`
  }
  return 'Certified Service Technician'
}

export function formatTechnicianLocation(tech: any): {
  primaryLine: string
  secondaryAddress: string
} {
  const area = tech?.area?.trim()
  const city = tech?.city?.trim()
  const state = tech?.state?.trim()
  const pin = tech?.pin_code || tech?.pinCode

  const locParts = [area, city, state].filter(Boolean)
  let primaryLine = locParts.join(', ')
  if (pin) {
    primaryLine = primaryLine ? `${primaryLine} - ${pin}` : `PIN ${pin}`
  }
  if (!primaryLine) {
    primaryLine = 'Service Location Not Set'
  }

  return {
    primaryLine,
    secondaryAddress: tech?.address?.trim() || '',
  }
}

export function formatIdCardValidity(validUntil?: string | null): string {
  if (!validUntil) return 'Active • Ongoing'
  const raw = String(validUntil).trim()
  if (!raw) return 'Active • Ongoing'
  const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw
  const formatted = formatDate(dateOnly)
  return formatted === 'Invalid date' ? dateOnly : formatted
}

export function getCompanyDisplayName(company: IdCardCompanyInfo): string {
  return getResolvedCompanyName(company)
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function printTechnicianIdCard(tech: any, company: IdCardCompanyInfo) {
  const theme = resolveIdCardTheme(tech?.id_card_theme, company?.primary_color)
  const techName = getTechnicianDisplayName(tech)
  const badgeCode = getTechnicianBadgeCode(tech)
  const designation = getTechnicianDesignation(tech)
  const { primaryLine, secondaryAddress } = formatTechnicianLocation(tech)
  const companyName = getCompanyDisplayName(company)
  const tagline = company?.tagline || 'Verified Field Service Partner'
  const companyPhone = company?.support_phone || ''
  const companyEmail = company?.support_email || ''
  const companyAddress = company?.business_address || ''
  const photoUrl = resolveAssetUrl(tech?.photo_url)
  const logoUrl = resolveAssetUrl(company?.company_logo_url)
  const initials = getInitials(techName)
  const companyInitials = getInitials(companyName) || 'KS'
  const isVerified = tech?.verification_status === 'verified'
  const validText = formatIdCardValidity(tech?.id_card_valid_until)

  const skills = Array.isArray(tech?.skills)
    ? tech.skills
      .slice(0, 3)
      .map((s: any) => (s.category_name || s.specialization || '').split('(')[0].trim())
      .filter(Boolean)
    : []

  const win = window.open('', '_blank', 'width=860,height=920')
  if (!win) {
    alert('Please allow popups for this site to print the ID card, or use Download PNG.')
    return
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Technician ID Card - ${escapeHtml(techName)} (${escapeHtml(badgeCode)})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-controls {
      margin-bottom: 18px;
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-primary {
      background: ${theme.accentHex};
      border-color: ${theme.accentHex};
      color: #fff;
    }
    .id-card {
      width: 360px;
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.25);
    }
    .header {
      background: linear-gradient(135deg, ${theme.accentDarkHex}, ${theme.accentHex});
      color: #ffffff;
      padding: 14px 18px 46px 18px;
      position: relative;
    }
    .lanyard-slot {
      width: 48px;
      height: 8px;
      background: rgba(255, 255, 255, 0.35);
      border-radius: 999px;
      margin: 0 auto 12px auto;
      border: 1px solid rgba(255, 255, 255, 0.45);
    }
    .company-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      padding: 3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }
    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .logo-fallback {
      font-weight: 800;
      font-size: 15px;
      color: ${theme.accentHex};
    }
    .company-title {
      font-size: 15px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: 0.2px;
    }
    .company-tagline {
      font-size: 10px;
      opacity: 0.88;
      margin-top: 2px;
      line-height: 1.25;
    }
    .role-ribbon {
      display: inline-block;
      margin-top: 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      padding: 3px 8px;
      border-radius: 999px;
    }
    .photo-wrap {
      margin-top: -36px;
      display: flex;
      justify-content: center;
      position: relative;
      z-index: 2;
    }
    .photo-frame {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 4px solid #ffffff;
      background: ${theme.accentLightHex};
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: ${theme.accentHex};
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .identity {
      text-align: center;
      padding: 10px 18px 12px 18px;
    }
    .tech-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .tech-designation {
      font-size: 12px;
      font-weight: 600;
      color: ${theme.accentHex};
      margin-top: 2px;
    }
    .badge-row {
      margin-top: 8px;
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pill {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .pill-verified {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #047857;
      font-family: inherit;
    }
    .info-box {
      margin: 0 16px 12px 16px;
      padding: 10px 12px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
      color: #64748b;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      flex-shrink: 0;
    }
    .info-val {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }
    .skills-row {
      padding: 0 16px 12px 16px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 5px;
    }
    .skill-chip {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: ${theme.accentLightHex};
      color: ${theme.accentDarkHex};
    }
    .footer {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px 16px;
      font-size: 10px;
      line-height: 1.45;
    }
    .footer-title {
      font-weight: 700;
      color: #ffffff;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .footer-meta { color: #cbd5e1; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-controls { display: none !important; }
      .id-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
    <button class="btn" onclick="window.close()">Close</button>
  </div>
  <div class="id-card">
    <div class="header">
      <div class="lanyard-slot"></div>
      <div class="company-row">
        <div class="logo-box">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" />` : `<span class="logo-fallback">${escapeHtml(companyInitials)}</span>`}
        </div>
        <div>
          <div class="company-title">${escapeHtml(companyName)}</div>
          <div class="company-tagline">${escapeHtml(tagline)}</div>
        </div>
      </div>
      <div class="role-ribbon">Authorized Technician ID Card</div>
    </div>

    <div class="photo-wrap">
      <div class="photo-frame">
        ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(techName)}" />` : escapeHtml(initials)}
      </div>
    </div>

    <div class="identity">
      <div class="tech-name">${escapeHtml(techName)}</div>
      <div class="tech-designation">${escapeHtml(designation)}</div>
      <div class="badge-row">
        <span class="pill">${escapeHtml(badgeCode)}</span>
        <span class="pill ${isVerified ? 'pill-verified' : ''}">${isVerified ? 'KYC Verified' : 'Pending KYC'}</span>
      </div>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-val">${escapeHtml(tech?.mobile || 'N/A')}${tech?.alternate_mobile ? ` / ${escapeHtml(tech.alternate_mobile)}` : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-val">${escapeHtml(primaryLine)}</span>
      </div>
      ${secondaryAddress ? `<div class="info-row"><span class="info-label">Address</span><span class="info-val">${escapeHtml(secondaryAddress)}</span></div>` : ''}
      ${tech?.email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(tech.email)}</span></div>` : ''}
      <div class="info-row">
        <span class="info-label">Valid Until</span>
        <span class="info-val">${escapeHtml(validText)}${tech?.blood_group ? ` • Blood: ${escapeHtml(tech.blood_group)}` : ''}</span>
      </div>
    </div>

    ${skills.length > 0 ? `<div class="skills-row">${skills.map((s: string) => `<span class="skill-chip">${escapeHtml(s)}</span>`).join('')}</div>` : ''}

    <div class="footer">
      <div class="footer-title">${escapeHtml(companyName)}</div>
      ${companyPhone ? `<div class="footer-meta">Helpline: ${escapeHtml(companyPhone)}${companyEmail ? ` • ${escapeHtml(companyEmail)}` : ''}</div>` : (companyEmail ? `<div class="footer-meta">${escapeHtml(companyEmail)}</div>` : '')}
      ${companyAddress ? `<div class="footer-meta">${escapeHtml(companyAddress)}</div>` : ''}
    </div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
}

function loadImageForCanvas(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null)
      return
    }
    const img = new Image()
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    const timer = window.setTimeout(() => resolve(null), 4000)
    img.onload = () => {
      window.clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

export async function downloadTechnicianIdCardPng(tech: any, company: IdCardCompanyInfo) {
  const theme = resolveIdCardTheme(tech?.id_card_theme, company?.primary_color)
  const techName = getTechnicianDisplayName(tech)
  const badgeCode = getTechnicianBadgeCode(tech)
  const designation = getTechnicianDesignation(tech)
  const { primaryLine, secondaryAddress } = formatTechnicianLocation(tech)
  const companyName = getCompanyDisplayName(company)
  const tagline = company?.tagline || 'Verified Field Service Partner'
  const companyPhone = company?.support_phone || ''
  const companyEmail = company?.support_email || ''
  const companyAddress = company?.business_address || ''
  const photoUrl = resolveAssetUrl(tech?.photo_url)
  const logoUrl = resolveAssetUrl(company?.company_logo_url)
  const initials = getInitials(techName)
  const companyInitials = getInitials(companyName) || 'KS'
  const isVerified = tech?.verification_status === 'verified'
  const validText = formatIdCardValidity(tech?.id_card_valid_until)

  const [photoImg, logoImg] = await Promise.all([
    loadImageForCanvas(photoUrl),
    loadImageForCanvas(logoUrl),
  ])

  const W = 720
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Card background
  ctx.fillStyle = '#ffffff'
  drawRoundedRect(ctx, 0, 0, W, H, 36)
  ctx.fill()
  ctx.clip()

  // Header gradient
  const grad = ctx.createLinearGradient(0, 0, W, 280)
  grad.addColorStop(0, theme.accentDarkHex)
  grad.addColorStop(1, theme.accentHex)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 290)

  // Lanyard slot
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  drawRoundedRect(ctx, W / 2 - 48, 22, 96, 14, 7)
  ctx.fill()

  // Logo container
  ctx.fillStyle = '#ffffff'
  drawRoundedRect(ctx, 40, 56, 88, 88, 18)
  ctx.fill()

  if (logoImg) {
    ctx.save()
    drawRoundedRect(ctx, 46, 62, 76, 76, 14)
    ctx.clip()
    const scale = Math.min(76 / logoImg.width, 76 / logoImg.height)
    const lw = logoImg.width * scale
    const lh = logoImg.height * scale
    ctx.drawImage(logoImg, 46 + (76 - lw) / 2, 62 + (76 - lh) / 2, lw, lh)
    ctx.restore()
  } else {
    ctx.fillStyle = theme.accentHex
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(companyInitials, 84, 100)
  }

  // Company title & tagline
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px sans-serif'
  const compLines = wrapCanvasText(ctx, companyName, W - 180, 1)
  ctx.fillText(compLines[0] || companyName, 148, 60)

  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = '500 18px sans-serif'
  const tagLines = wrapCanvasText(ctx, tagline, W - 180, 2)
  tagLines.forEach((line, idx) => {
    ctx.fillText(line, 148, 100 + idx * 22)
  })

  // Role ribbon
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  drawRoundedRect(ctx, 40, 168, 340, 34, 17)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText('AUTHORIZED TECHNICIAN ID CARD', 58, 177)

  // Technician Photo Circle
  const cx = W / 2
  const cy = 290
  const radius = 96

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = theme.accentLightHex
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  if (photoImg) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()
    const scale = Math.max((radius * 2) / photoImg.width, (radius * 2) / photoImg.height)
    const pw = photoImg.width * scale
    const ph = photoImg.height * scale
    ctx.drawImage(photoImg, cx - pw / 2, cy - ph / 2, pw, ph)
    ctx.restore()
  } else {
    ctx.fillStyle = theme.accentHex
    ctx.font = 'bold 54px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, cx, cy)
  }

  // Name & Designation
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 34px sans-serif'
  ctx.fillText(techName, W / 2, 412)

  ctx.fillStyle = theme.accentHex
  ctx.font = '600 22px sans-serif'
  ctx.fillText(designation, W / 2, 456)

  // Badge & Verification Pills
  ctx.fillStyle = '#f1f5f9'
  drawRoundedRect(ctx, W / 2 - 210, 496, 200, 38, 19)
  ctx.fill()
  ctx.fillStyle = '#334155'
  ctx.font = 'bold 18px monospace'
  ctx.fillText(badgeCode, W / 2 - 110, 506)

  ctx.fillStyle = isVerified ? '#ecfdf5' : '#fffbeb'
  drawRoundedRect(ctx, W / 2 + 10, 496, 200, 38, 19)
  ctx.fill()
  ctx.fillStyle = isVerified ? '#047857' : '#b45309'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(isVerified ? 'KYC VERIFIED' : 'KYC PENDING', W / 2 + 110, 506)

  // Info Card Box
  ctx.fillStyle = '#f8fafc'
  drawRoundedRect(ctx, 40, 560, W - 80, 310, 22)
  ctx.fill()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.stroke()

  const rows: [string, string][] = [
    ['PHONE NUMBER', `${tech?.mobile || 'N/A'}${tech?.alternate_mobile ? ` / ${tech.alternate_mobile}` : ''}`],
    ['LOCATION', primaryLine],
    ...(secondaryAddress ? [['ADDRESS', secondaryAddress] as [string, string]] : []),
    ...(tech?.email ? [['EMAIL', tech.email] as [string, string]] : []),
    ['VALIDITY', `${validText}${tech?.blood_group ? `   •   Blood Group: ${tech.blood_group}` : ''}`],
  ]

  let rowY = 584
  for (const [label, val] of rows) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(label, 64, rowY)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f172a'
    ctx.font = '600 19px sans-serif'
    const valLines = wrapCanvasText(ctx, val, 390, 2)
    valLines.forEach((line, i) => {
      ctx.fillText(line, W - 64, rowY - 2 + i * 22)
    })
    rowY += valLines.length > 1 ? 66 : 48
    if (rowY > 845) break
  }

  // Footer
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 904, W, H - 904)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText(companyName, 40, 928)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 17px sans-serif'
  const contactLine = [companyPhone ? `Helpline: ${companyPhone}` : '', companyEmail].filter(Boolean).join(' • ')
  if (contactLine) {
    const cLines = wrapCanvasText(ctx, contactLine, W - 180, 1)
    ctx.fillText(cLines[0] || contactLine, 40, 964)
  }
  if (companyAddress) {
    const aLines = wrapCanvasText(ctx, companyAddress, W - 180, 2)
    aLines.forEach((line, i) => {
      ctx.fillText(line, 40, 994 + i * 22)
    })
  }

  // Deterministic QR-style verification motif on bottom right
  const qrX = W - 124
  const qrY = 934
  ctx.fillStyle = '#ffffff'
  drawRoundedRect(ctx, qrX - 6, qrY - 6, 92, 92, 10)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  const seed = Number(tech?.id || 17)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isCorner = (r < 2 && c < 2) || (r < 2 && c > 2) || (r > 2 && c < 2)
      const bit = ((seed * (r + 3) + c * 7) % 3) !== 0
      if (isCorner || bit) {
        ctx.fillRect(qrX + c * 16, qrY + r * 16, 13, 13)
      }
    }
  }

  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  const safeSlug = techName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  link.download = `${badgeCode}-${safeSlug}-id-card.png`
  link.href = dataUrl
  link.click()
}

