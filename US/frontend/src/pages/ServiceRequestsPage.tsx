import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Filter, Send, Share2, Camera, CheckCircle2 } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import { DispatchModal } from '@/components/DispatchModal'
import { SendReportLinkModal } from '@/components/SendReportLinkModal'
import { DispatchDetails } from '@/lib/dispatch'
import { getMediaUrl } from '@/utils/media'

export function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dispatchData, setDispatchData] = useState<Partial<DispatchDetails> | null>(null)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [selectedReportRequestId, setSelectedReportRequestId] = useState<number | null>(null)
  const [isSendReportModalOpen, setIsSendReportModalOpen] = useState(false)

  const openDispatchForRow = (r: any) => {
    const payload: Partial<DispatchDetails> = {
      technicianName: r.technician_name || 'Assigned Technician',
      technicianPhone: r.technician_mobile || '',
      customerName: r.customer_name || 'Customer',
      customerPhone: r.customer_mobile || '',
      customerAltPhone: r.customer_alternate_mobile,
      customerAddress: r.customer_address || '',
      customerLandmark: r.customer_landmark,
      customerArea: r.customer_area || 'Pune',
      customerCity: r.customer_city || 'Pune',
      customerPinCode: r.customer_pin_code || '',
      jobId: r.request_id || r.call_id || r.id,
      serviceCategory: r.service_category_name || 'Appliance Service',
      requirement: r.requirement || r.problem_description || r.internal_notes || '',
      urgency: r.urgency || 'Normal',
      preferredDate: r.scheduled_date,
      preferredTime: r.scheduled_time
    }
    setDispatchData(payload)
    setIsDispatchOpen(true)
  }

  const fetchRequests = () => {
    setLoading(true)
    serviceRequestsApi
      .getAll({ status: statusFilter })
      .then((res: any) => {
        const data = res.data?.data?.rows || res.data?.data || []
        // Strictly exclude completed and cancelled requests (they only show in Customer Calls page)
        const activeOnly = (Array.isArray(data) ? data : []).filter(
          (r: any) => r.status !== 'completed' && r.status !== 'cancelled'
        )
        setRequests(activeOnly)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await serviceRequestsApi.updateStatus(id, newStatus)
      fetchRequests()
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Active Service Requests</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track active appliance repairs and assignments. Completed and cancelled requests are exclusively viewed in Customer Calls.
          </p>
        </div>
        <Link to="/calls" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto text-xs text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center gap-1.5 font-medium shadow-2xs h-8 sm:h-9">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            View Completed &amp; Cancelled Calls →
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4 flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700"
          >
            <option value="">All In-Progress Requests</option>
            <option value="technician_assigned">Technician Assigned</option>
            <option value="visit_scheduled">Visit Scheduled</option>
            <option value="work_in_progress">Work In Progress</option>
            <option value="new_call">New Call</option>
            <option value="requirement_recorded">Requirement Recorded</option>
          </select>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading service requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No active in-progress service requests. Completed and cancelled customer services can be viewed on the{' '}
                      <Link to="/calls" className="text-indigo-600 font-semibold hover:underline">
                        Customer Calls
                      </Link>{' '}
                      page.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-xs text-indigo-600">
                        <div>{r.request_id || `#${r.id}`}</div>
                        {r.machine_photo_url && (
                          <a
                            href={getMediaUrl(r.machine_photo_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-1 hover:underline"
                            title="View machine photo uploaded by technician"
                          >
                            <Camera className="h-2.5 w-2.5" />
                            Machine Photo
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {r.customer_name || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-400">{r.customer_mobile}</div>
                      </td>
                      <td className="py-3 px-4">
                        {r.technician_name ? (
                          <div>
                            <span className="font-medium text-slate-800 block">{r.technician_name}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDispatchForRow(r)}
                                className="text-[10px] h-6 px-1.5 text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 font-medium"
                                title="Send customer address &amp; details to technician via WhatsApp or SMS"
                              >
                                <Send className="h-2.5 w-2.5" />
                                Dispatch
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReportRequestId(r.id)
                                  setIsSendReportModalOpen(true)
                                }}
                                className="text-[10px] h-6 px-1.5 text-indigo-700 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1 font-medium"
                                title="Send job completion report link to technician via WhatsApp"
                              >
                                <Share2 className="h-2.5 w-2.5" />
                                Report Link
                              </Button>
                              <Link
                                to={`/technicians/find?serviceRequestId=${r.id}&category=${r.service_category_id || ''}&area=${encodeURIComponent(r.customer_area || '')}&pincode=${encodeURIComponent(r.customer_pin_code || '')}&customerName=${encodeURIComponent(r.customer_name || '')}`}
                                className="text-[10px] text-amber-600 hover:text-amber-800 font-medium hover:underline inline-block ml-0.5"
                              >
                                Reassign
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 italic text-xs block">Unassigned</span>
                            <Link
                              to={`/technicians/find?serviceRequestId=${r.id}&category=${r.service_category_id || ''}&area=${encodeURIComponent(r.customer_area || '')}&pincode=${encodeURIComponent(r.customer_pin_code || '')}&customerName=${encodeURIComponent(r.customer_name || '')}`}
                              className="text-xs text-indigo-600 font-medium hover:underline inline-block mt-0.5"
                            >
                              Match & Assign →
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(
                            r.status
                          )}`}
                        >
                          {r.status ? r.status.replace(/_/g, ' ') : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatDate(r.created_at || r.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className="border border-slate-200 rounded px-2 py-1 text-xs bg-white text-slate-700"
                        >
                          <option value="new_call">New Call</option>
                          <option value="technician_assigned">Technician Assigned</option>
                          <option value="visit_scheduled">Visit Scheduled</option>
                          <option value="work_in_progress">Work In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DispatchModal
        open={isDispatchOpen}
        onOpenChange={setIsDispatchOpen}
        details={dispatchData}
        title="Technician Dispatch &amp; Notification"
      />

      <SendReportLinkModal
        open={isSendReportModalOpen}
        onOpenChange={setIsSendReportModalOpen}
        serviceRequestId={selectedReportRequestId}
      />
    </div>
  )
}

