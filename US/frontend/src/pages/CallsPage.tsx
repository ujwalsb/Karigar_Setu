import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { callsApi } from '@/api/calls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PhoneCall,
  Search,
  Plus,
  Filter,
  Calendar,
  Send,
  CheckCircle2,
  Camera,
  Wrench,
  IndianRupee,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  Clock,
  AlertCircle,
  ClipboardList
} from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import { CustomerServiceDetailsModal } from '@/components/CustomerServiceDetailsModal'
import { getMediaUrl } from '@/utils/media'

export function CallsPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Tab view: defaults to 'completed' as requested by user
  const [activeTab, setActiveTab] = useState<'completed' | 'cancelled' | 'active' | 'all'>('completed')
  const [statusFilter, setStatusFilter] = useState('completed')

  // Customer Service Details History Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false)

  // Lightbox Preview Photo
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const handleTabChange = (tab: 'completed' | 'cancelled' | 'active' | 'all') => {
    setActiveTab(tab)
    if (tab === 'completed') {
      setStatusFilter('completed')
    } else if (tab === 'cancelled') {
      setStatusFilter('cancelled')
    } else if (tab === 'active') {
      setStatusFilter('technician_assigned')
    } else {
      setStatusFilter('')
    }
  }

  const fetchCalls = () => {
    setLoading(true)
    callsApi
      .getAll({ search, status: statusFilter })
      .then((res: any) => {
        const data = res.data?.data?.rows || res.data?.data || []
        setCalls(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error('Failed to load calls:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchCalls()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCalls()
  }

  // Count metrics in memory
  const completedCount = calls.filter((c) => c.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>Customer Calls</span>
            {activeTab === 'completed' && (
              <Badge className="bg-emerald-600 text-white font-medium text-xs">
                Completed Services
              </Badge>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {activeTab === 'completed'
              ? 'Showing only customers who have completed their service with work done, charges taken & machine photo'
              : 'Review, track and assign customer appliance service calls'}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Link to="/service-requests" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm border-slate-300 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-xs">
              <ClipboardList className="h-4 w-4 mr-1.5 text-indigo-600" />
              Service Requests
            </Button>
          </Link>
          <Link to="/calls/new" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              Register New Call
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange('completed')}
          className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Completed Customers (Finished)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('cancelled')}
          className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'cancelled'
              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <X className="h-4 w-4 shrink-0" />
          <span>Cancelled Calls</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('active')}
          className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'active'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>In Progress / Active</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <PhoneCall className="h-4 w-4 shrink-0" />
          <span>All Customer Calls</span>
        </button>
      </div>

      {/* Search & Secondary Filter Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by customer name, mobile, Call ID or technician..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <Button type="submit" variant="secondary" className="text-xs">
              Search
            </Button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              if (e.target.value === 'completed') setActiveTab('completed')
              else if (e.target.value === '') setActiveTab('all')
              else setActiveTab('active')
            }}
            className="border border-slate-200 rounded-md px-3 py-2 text-xs bg-white text-slate-700"
          >
            <option value="completed">Status: Completed Services Only</option>
            <option value="">All Statuses</option>
            <option value="new_call">New Call</option>
            <option value="requirement_recorded">Requirement Recorded</option>
            <option value="technician_assigned">Technician Assigned</option>
            <option value="visit_scheduled">Visit Scheduled</option>
            <option value="work_in_progress">Work In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      {/* Customer Calls Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {/* Mobile Card List (< md screens) */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-10 text-center text-slate-400">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading customer calls...
              </div>
            ) : calls.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <p className="font-medium text-slate-600">
                  {activeTab === 'completed'
                    ? 'No completed customer services found.'
                    : 'No customer calls match your filter.'}
                </p>
                <p className="text-xs">
                  When technicians submit their job completion report, completed customers will appear here.
                </p>
              </div>
            ) : (
              calls.map((call) => {
                const isCompleted = call.status === 'completed'
                const photoUrl = call.machine_photo_url

                return (
                  <div key={call.id} className="p-4 space-y-3 bg-white">
                    {/* Top Row: Call ID + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          {call.call_id || `#${call.id}`}
                        </span>
                        {call.service_request_number && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SR: {call.service_request_number}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : getStatusColor(call.status)
                        }`}
                      >
                        {call.status ? call.status.replace(/_/g, ' ') : 'Pending'}
                      </span>
                    </div>

                    {/* Customer & Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(call.customer_id)
                            setIsCustomerHistoryOpen(true)
                          }}
                          className="font-semibold text-slate-900 hover:text-indigo-600 text-left text-sm flex items-center gap-1 group"
                        >
                          <span>{call.customer_name || 'Customer'}</span>
                          <Eye className="h-3.5 w-3.5 text-indigo-500" />
                        </button>
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          {call.customer_mobile && (
                            <a
                              href={`tel:${call.customer_mobile}`}
                              className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <PhoneCall className="h-3 w-3" />
                              {call.customer_mobile}
                            </a>
                          )}
                          <span>•</span>
                          <span>{call.customer_area || call.customer_city || 'Pune'}</span>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] text-slate-700 bg-slate-50 shrink-0">
                        {call.service_category_name || 'General Appliance'}
                      </Badge>
                    </div>

                    {/* Problem / Requirement */}
                    {(call.requirement || call.problem_description) && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-semibold text-slate-700">Issue: </span>
                        {call.requirement || call.problem_description}
                      </p>
                    )}

                    {/* Technician */}
                    <div className="text-xs text-slate-600 flex items-center justify-between bg-slate-50/70 p-2 rounded">
                      <span className="text-slate-500">Technician:</span>
                      {call.technician_name ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <span>{call.technician_name}</span>
                          {call.technician_mobile && (
                            <a
                              href={`tel:${call.technician_mobile}`}
                              className="text-emerald-700 font-mono text-[11px] underline"
                            >
                              ({call.technician_mobile})
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </div>

                    {/* Work & Charges (if completed) */}
                    {isCompleted && (
                      <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-900 font-medium">Charges Taken:</span>
                          <div className="flex items-center gap-1 font-bold text-emerald-800 text-sm">
                            <IndianRupee className="h-3.5 w-3.5" />
                            <span>₹{parseFloat(call.final_amount || 0).toLocaleString('en-IN')}</span>
                            {call.payment_mode && (
                              <Badge variant="outline" className="text-[9px] uppercase px-1 h-4 border-emerald-300 text-emerald-700 bg-white ml-1">
                                {call.payment_mode}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {call.work_description && (
                          <p className="text-[11px] text-slate-700">
                            <strong>Work Done:</strong> {call.work_description}
                          </p>
                        )}
                        {call.parts_replaced && (
                          <p className="text-[11px] text-indigo-700">
                            <strong>Parts:</strong> {call.parts_replaced}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Photo Thumbnail (if present) */}
                    {photoUrl && (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-slate-200">
                        <img
                          src={getMediaUrl(photoUrl)}
                          alt="Repaired Appliance"
                          onClick={() => setPreviewPhoto(photoUrl)}
                          className="h-12 w-12 object-cover rounded border border-slate-300 shrink-0 cursor-pointer"
                        />
                        <div className="text-xs">
                          <div className="font-semibold text-emerald-800 flex items-center gap-1">
                            <Camera className="h-3 w-3" /> Repaired Machine Photo
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(photoUrl)}
                            className="text-indigo-600 hover:underline text-[11px] font-medium"
                          >
                            Tap to View Enlarge →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomerId(call.customer_id)
                          setIsCustomerHistoryOpen(true)
                        }}
                        className="flex-1 text-xs h-8 text-indigo-700 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 flex items-center justify-center gap-1.5 font-medium"
                      >
                        <Wrench className="h-3 w-3" />
                        Customer History
                      </Button>

                      {!call.technician_name && (
                        <Link
                          to={`/technicians/find?callId=${call.id}&category=${call.service_category_id || ''}&area=${encodeURIComponent(call.customer_area || '')}&pincode=${encodeURIComponent(call.customer_pin_code || '')}&customerName=${encodeURIComponent(call.customer_name || '')}&requirement=${encodeURIComponent(call.requirement || '')}`}
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            className="w-full text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Assign Tech
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Call &amp; Job ID</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Work Done &amp; Charges</th>
                  <th className="py-3 px-4">Repaired Machine Photo</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading customer calls...
                    </td>
                  </tr>
                ) : calls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                      <p className="font-medium text-slate-600">
                        {activeTab === 'completed'
                          ? 'No completed customer services found.'
                          : 'No customer calls match your filter.'}
                      </p>
                      <p className="text-xs">
                        When technicians submit their job completion report, completed customers will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => {
                    const isCompleted = call.status === 'completed'
                    const photoUrl = call.machine_photo_url

                    return (
                      <tr key={call.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Call ID & Status */}
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="font-semibold text-indigo-700">
                            {call.call_id || `#${call.id}`}
                          </div>
                          {call.service_request_number && (
                            <div className="text-[10px] text-slate-400">
                              SR: {call.service_request_number}
                            </div>
                          )}
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : getStatusColor(call.status)
                              }`}
                          >
                            {call.status ? call.status.replace(/_/g, ' ') : 'Pending'}
                          </span>
                        </td>

                        {/* 2. Customer Details */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(call.customer_id)
                              setIsCustomerHistoryOpen(true)
                            }}
                            className="font-semibold text-slate-900 hover:text-indigo-600 text-left hover:underline flex items-center gap-1 group text-xs"
                            title="Click to view full customer lifetime service history"
                          >
                            <span>{call.customer_name || 'Customer'}</span>
                            <Eye className="h-3 w-3 text-slate-400 group-hover:text-indigo-600" />
                          </button>
                          <div className="text-xs font-mono text-slate-500">
                            {call.customer_mobile}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {call.customer_area || call.customer_city || 'Pune'}
                          </div>
                        </td>

                        {/* 3. Service Category */}
                        <td className="py-3 px-4 text-xs">
                          <span className="font-medium text-slate-800 block">
                            {call.service_category_name || 'General Appliance'}
                          </span>
                          {(call.requirement || call.problem_description) && (
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {call.requirement || call.problem_description}
                            </span>
                          )}
                        </td>

                        {/* 4. Assigned Technician */}
                        <td className="py-3 px-4 text-xs">
                          {call.technician_name ? (
                            <div>
                              <span className="font-medium text-slate-900 block">
                                {call.technician_name}
                              </span>
                              {call.technician_mobile && (
                                <a
                                  href={`tel:${call.technician_mobile}`}
                                  className="text-xs font-mono text-emerald-700 hover:underline"
                                >
                                  {call.technician_mobile}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Unassigned</span>
                          )}
                        </td>

                        {/* 5. Work Done & Amount Taken */}
                        <td className="py-3 px-4 text-xs">
                          {isCompleted ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-sm">
                                <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                                <span>₹{parseFloat(call.final_amount || 0).toLocaleString('en-IN')}</span>
                                {call.payment_mode && (
                                  <Badge variant="outline" className="text-[9px] uppercase font-semibold h-4 px-1 border-emerald-300 text-emerald-700 bg-emerald-50">
                                    {call.payment_mode}
                                  </Badge>
                                )}
                              </div>
                              {call.work_description && (
                                <p className="text-[11px] text-slate-600 line-clamp-1" title={call.work_description}>
                                  <strong>Work:</strong> {call.work_description}
                                </p>
                              )}
                              {call.parts_replaced && (
                                <p className="text-[10px] text-indigo-700 line-clamp-1" title={call.parts_replaced}>
                                  <strong>Parts:</strong> {call.parts_replaced}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">In progress</span>
                          )}
                        </td>

                        {/* 6. One Photo of Repaired Machine */}
                        <td className="py-3 px-4">
                          {photoUrl ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="relative group cursor-pointer shrink-0"
                                onClick={() => setPreviewPhoto(photoUrl)}
                                title="Click to enlarge machine photo"
                              >
                                <img
                                  src={getMediaUrl(photoUrl)}
                                  alt="Repaired Appliance"
                                  className="h-12 w-12 object-cover rounded-md border border-slate-300 shadow-2xs group-hover:opacity-90 group-hover:scale-105 transition-all"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-[9px] font-bold">
                                  Zoom
                                </div>
                              </div>
                              <div className="text-[10px] space-y-0.5">
                                <span className="font-semibold text-emerald-800 block">Photo Verified</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhoto(photoUrl)}
                                  className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                                >
                                  <Camera className="h-2.5 w-2.5" /> View Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No photo attached</span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* View Full Service History Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCustomerId(call.customer_id)
                                setIsCustomerHistoryOpen(true)
                              }}
                              className="text-xs h-7 px-2.5 text-indigo-700 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 font-medium shadow-2xs"
                              title="View full customer history, diagnosis notes, charges & machine photo"
                            >
                              <Wrench className="h-3 w-3" />
                              View History
                            </Button>

                            {/* If unassigned or active without tech, show Assign link */}
                            {!call.technician_name && (
                              <Link
                                to={`/technicians/find?callId=${call.id}&category=${call.service_category_id || ''}&area=${encodeURIComponent(call.customer_area || '')}&pincode=${encodeURIComponent(call.customer_pin_code || '')}&customerName=${encodeURIComponent(call.customer_name || '')}&requirement=${encodeURIComponent(call.requirement || '')}`}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2 text-slate-700 border-slate-300 hover:bg-slate-50"
                                >
                                  Assign Tech
                                </Button>
                              </Link>
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

      {/* Customer Full Service History Modal */}
      <CustomerServiceDetailsModal
        open={isCustomerHistoryOpen}
        onOpenChange={setIsCustomerHistoryOpen}
        customerId={selectedCustomerId}
      />

      {/* Machine Photo Lightbox Modal */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-600" />
                One Photo of Repaired Machine / Appliance
              </DialogTitle>
            </DialogHeader>
            <div className="pt-2 text-center space-y-3">
              <div className="bg-slate-900/5 p-2 rounded-lg border border-slate-200">
                <img
                  src={getMediaUrl(previewPhoto)}
                  alt="Repaired Appliance"
                  className="max-h-[55vh] sm:max-h-[65vh] w-auto mx-auto rounded shadow-sm object-contain"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                <span>Verified technician on-site capture</span>
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={getMediaUrl(previewPhoto)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-medium text-xs mr-2"
                  >
                    Open Full Image <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button size="sm" variant="outline" onClick={() => setPreviewPhoto(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
