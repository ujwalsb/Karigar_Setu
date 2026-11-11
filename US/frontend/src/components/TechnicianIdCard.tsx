import React, { useEffect, useState } from 'react'
import {
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  Star,
  Pencil,
  Calendar,
  Droplet,
  Building2,
} from 'lucide-react'
import { resolveAssetUrl, getInitials, cn } from '@/lib/utils'
import {
  IdCardCompanyInfo,
  resolveIdCardTheme,
  getTechnicianDisplayName,
  getTechnicianBadgeCode,
  getTechnicianDesignation,
  formatTechnicianLocation,
  formatIdCardValidity,
  getCompanyDisplayName,
} from '@/lib/idCard'

interface TechnicianIdCardProps {
  technician: any
  company: IdCardCompanyInfo
  className?: string
  showEditButton?: boolean
  onEdit?: () => void
}

export function TechnicianIdCard({
  technician,
  company,
  className,
  showEditButton = false,
  onEdit,
}: TechnicianIdCardProps) {
  const theme = resolveIdCardTheme(technician?.id_card_theme, company?.primary_color)
  const techName = getTechnicianDisplayName(technician)
  const badgeCode = getTechnicianBadgeCode(technician)
  const designation = getTechnicianDesignation(technician)
  const { primaryLine, secondaryAddress } = formatTechnicianLocation(technician)
  const companyName = getCompanyDisplayName(company)
  const tagline = company?.tagline || 'Verified Service & Dispatch Partner'
  const photoUrl = resolveAssetUrl(technician?.photo_url)
  const logoUrl = resolveAssetUrl(company?.company_logo_url)
  const techInitials = getInitials(techName)
  const companyInitials = getInitials(companyName) || 'KS'
  const isVerified = technician?.verification_status === 'verified'
  const validText = formatIdCardValidity(technician?.id_card_valid_until)

  const [photoBroken, setPhotoBroken] = useState(false)
  const [logoBroken, setLogoBroken] = useState(false)

  useEffect(() => {
    setPhotoBroken(false)
  }, [photoUrl])

  useEffect(() => {
    setLogoBroken(false)
  }, [logoUrl])

  const skills: string[] = Array.isArray(technician?.skills)
    ? technician.skills
      .map((s: any) => (s.category_name || s.specialization || '').split('(')[0].replace('Repair', '').trim())
      .filter(Boolean)
    : []

  const displayedSkills = skills.slice(0, 3)
  const extraSkillsCount = Math.max(0, skills.length - 3)
  const seed = Number(technician?.id || 17)

  return (
    <div
      className={cn(
        'w-full max-w-[360px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col select-none transition-shadow hover:shadow-xl',
        className
      )}
    >
      {/* Card Header with Company Logo & Info */}
      <div className={cn('relative bg-gradient-to-br text-white px-4 pt-3 pb-12', theme.headerGradient)}>
        {/* Lanyard punch hole */}
        <div className="w-12 h-2 rounded-full bg-white/35 border border-white/40 mx-auto mb-3" />

        {/* Quick Edit Button */}
        {showEditButton && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="absolute top-3 right-3 h-7 px-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[11px] font-semibold inline-flex items-center gap-1 backdrop-blur-xs transition-colors"
            title="Edit Technician ID Card"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}

        <div className="flex items-center gap-3 pr-10">
          <div className="h-11 w-11 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden shrink-0 p-1 border border-white/70">
            {logoUrl && !logoBroken ? (
              <img
                src={logoUrl}
                alt={companyName}
                onError={() => setLogoBroken(true)}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className={cn('font-extrabold text-sm tracking-tight', theme.accentTextClass)}>
                {companyInitials}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm leading-tight tracking-wide truncate">
              {companyName}
            </div>
            <div className="text-[10px] text-white/85 leading-snug line-clamp-2 mt-0.5">
              {tagline}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">
            Official Technician ID
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-black/20 px-2 py-0.5 rounded-full capitalize">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                technician?.availability === 'available'
                  ? 'bg-emerald-400'
                  : technician?.availability === 'busy'
                    ? 'bg-amber-400'
                    : 'bg-slate-300'
              )}
            />
            {technician?.availability || 'available'}
          </span>
        </div>
      </div>

      {/* Overlapping Technician Portrait Photo */}
      <div className="-mt-10 flex justify-center relative z-10">
        <div className="relative">
          <div
            className={cn(
              'h-24 w-24 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center font-extrabold text-2xl',
              theme.accentSoftBgClass,
              theme.accentTextClass
            )}
          >
            {photoUrl && !photoBroken ? (
              <img
                src={photoUrl}
                alt={techName}
                onError={() => setPhotoBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{techInitials}</span>
            )}
          </div>
          {isVerified && (
            <div
              className="absolute bottom-0.5 right-0.5 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white text-white flex items-center justify-center shadow"
              title="KYC Verified Technician"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Name, Designation & Badge */}
      <div className="px-4 pt-2.5 pb-3 text-center">
        <h3 className="text-base font-extrabold text-slate-900 leading-snug truncate">
          {techName}
        </h3>
        <p className={cn('text-xs font-semibold mt-0.5 truncate', theme.accentTextClass)}>
          {designation}
        </p>

        <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {badgeCode}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1',
              isVerified
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            {isVerified ? 'Verified' : 'KYC Pending'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {parseFloat(technician?.rating || '4.8').toFixed(1)}
          </span>
        </div>
      </div>

      {/* Technician Contact & Location Details */}
      <div className="mx-4 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1 shrink-0 pt-0.5">
            <Phone className="h-3 w-3 text-emerald-600" />
            Phone
          </span>
          <div className="text-right font-mono font-semibold text-slate-900 leading-tight">
            <div>{technician?.mobile || 'N/A'}</div>
            {technician?.alternate_mobile && (
              <div className="text-[10px] text-slate-500 font-normal">
                Alt: {technician.alternate_mobile}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-1.5 flex items-start justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1 shrink-0 pt-0.5">
            <MapPin className="h-3 w-3 text-rose-500" />
            Location
          </span>
          <div className="text-right font-medium text-slate-800 leading-snug">
            <div>{primaryLine}</div>
            {secondaryAddress && (
              <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                {secondaryAddress}
              </div>
            )}
          </div>
        </div>

        {technician?.email && (
          <div className="border-t border-dashed border-slate-200 pt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Mail className="h-3 w-3 text-indigo-500" />
              Email
            </span>
            <span className="text-[11px] font-medium text-slate-700 truncate">
              {technician.email}
            </span>
          </div>
        )}

        <div className="border-t border-dashed border-slate-200 pt-1.5 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-500" />
            Valid
          </span>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
            <span>{validText}</span>
            {technician?.blood_group && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px]">
                <Droplet className="h-2.5 w-2.5" />
                {technician.blood_group}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Certified Skills Strip */}
      {displayedSkills.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap justify-center gap-1">
          {displayedSkills.map((skill, idx) => (
            <span
              key={idx}
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-md border',
                theme.accentSoftBgClass,
                theme.accentTextClass,
                theme.accentBorderClass
              )}
            >
              {skill}
            </span>
          ))}
          {extraSkillsCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              +{extraSkillsCount} more
            </span>
          )}
        </div>
      )}

      {/* Company Information Footer */}
      <div className="mt-auto bg-slate-900 text-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-0.5 text-[10px] leading-snug">
          <div className="font-bold text-white text-[11px] flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{companyName}</span>
          </div>
          {company?.support_phone && (
            <div className="text-slate-300 font-mono truncate">
              Helpline: {company.support_phone}
            </div>
          )}
          {company?.support_email && (
            <div className="text-slate-400 truncate">{company.support_email}</div>
          )}
          {company?.business_address && (
            <div className="text-slate-400 line-clamp-1">{company.business_address}</div>
          )}
        </div>

        {/* Verification QR Motif */}
        <div
          className="h-12 w-12 rounded-md bg-white p-1 shrink-0 grid grid-cols-5 gap-[2px] shadow-xs"
          title={`ID Verification: ${badgeCode}`}
        >
          {Array.from({ length: 25 }).map((_, idx) => {
            const r = Math.floor(idx / 5)
            const c = idx % 5
            const isCorner = (r < 2 && c < 2) || (r < 2 && c > 2) || (r > 2 && c < 2)
            const filled = isCorner || (seed * (r + 3) + c * 7) % 3 !== 0
            return (
              <span
                key={idx}
                className={filled ? 'bg-slate-900 rounded-[1px]' : 'bg-transparent'}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

