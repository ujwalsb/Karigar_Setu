import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 'Invalid date'
    return format(d, 'dd MMM yyyy')
  } catch {
    return 'Invalid date'
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return 'Invalid date'
    return format(d, 'dd MMM yyyy, hh:mm a')
  } catch {
    return 'Invalid date'
  }
}

export function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new_call: 'bg-blue-100 text-blue-800',
    requirement_recorded: 'bg-indigo-100 text-indigo-800',
    finding_technician: 'bg-yellow-100 text-yellow-800',
    technician_assigned: 'bg-purple-100 text-purple-800',
    technician_contacted: 'bg-orange-100 text-orange-800',
    visit_scheduled: 'bg-cyan-100 text-cyan-800',
    work_in_progress: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_technician_available: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    busy: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new_call: 'New Call',
    requirement_recorded: 'Requirement Recorded',
    finding_technician: 'Finding Technician',
    technician_assigned: 'Technician Assigned',
    technician_contacted: 'Technician Contacted',
    visit_scheduled: 'Visit Scheduled',
    work_in_progress: 'Work In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_technician_available: 'No Technician Available',
    pending: 'Pending',
    active: 'Active',
    inactive: 'Inactive',
    verified: 'Verified',
    rejected: 'Rejected',
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline',
    normal: 'Normal',
    urgent: 'Urgent',
    emergency: 'Emergency',
    phone: 'Phone',
    walk_in: 'Walk-in',
    online: 'Online',
    referral: 'Referral',
    other: 'Other',
    admin: 'Admin',
    support: 'Support',
  }
  return labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    normal: 'bg-blue-100 text-blue-800',
    urgent: 'bg-orange-100 text-orange-800',
    emergency: 'bg-red-100 text-red-800',
  }
  return colors[urgency] || 'bg-gray-100 text-gray-800'
}

export function truncate(str: string, length: number): string {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

