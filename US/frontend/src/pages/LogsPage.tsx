import React, { useEffect, useState } from 'react'
import { activityApi, ActivityLog, ActivityStats } from '@/api/activity'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Activity,
  LogIn,
  LogOut,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Eye,
  X,
  FileText,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters & Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Details Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)

  // Clear Logs Modal
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const [clearDays, setClearDays] = useState<'7' | '30' | '90' | 'all'>('30')
  const [clearing, setClearing] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const fetchLogs = (targetPage = page) => {
    setLoading(true)
    activityApi
      .getLogs({
        page: targetPage,
        limit,
        search,
        action: actionFilter,
        dateFrom,
        dateTo,
      })
      .then((res: any) => {
        const d = res.data?.data || res.data
        setLogs(d?.rows || [])
        setTotalCount(d?.total || 0)
        setTotalPages(d?.totalPages || 1)
        setPage(d?.page || 1)
      })
      .catch((err) => console.error('Failed to load logs:', err))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  const fetchStats = () => {
    activityApi
      .getStats()
      .then((res: any) => {
        setStats(res.data?.data || null)
      })
      .catch((err) => console.error('Failed to load activity stats:', err))
  }

  useEffect(() => {
    fetchLogs(1)
    fetchStats()
  }, [actionFilter, dateFrom, dateTo])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLogs(page)
    fetchStats()
  }

  const handleClearLogsConfirm = async () => {
    setClearing(true)
    try {
      const daysArg = clearDays === 'all' ? 'all' : parseInt(clearDays)
      const res = await activityApi.clearLogs(daysArg)
      setFeedbackMsg(res.data?.message || 'Activity logs cleaned up successfully.')
      setClearModalOpen(false)
      fetchLogs(1)
      fetchStats()
      setTimeout(() => setFeedbackMsg(''), 4000)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clear logs.')
    } finally {
      setClearing(false)
    }
  }

  const handleExportCSV = () => {
    window.open('/api/v1/analytics/export?type=activity&format=csv', '_blank')
  }

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase()
    if (act === 'LOGIN') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1 hover:bg-emerald-100 font-medium">
          <LogIn className="h-3 w-3 text-emerald-600" />
          LOGIN
        </Badge>
      )
    }
    if (act === 'LOGOUT') {
      return (
        <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-100 flex items-center gap-1 font-medium">
          <LogOut className="h-3 w-3 text-slate-500" />
          LOGOUT
        </Badge>
      )
    }
    if (act === 'LOGIN_FAILED') {
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-300 flex items-center gap-1 hover:bg-rose-100 font-medium">
          <AlertTriangle className="h-3 w-3 text-rose-600" />
          LOGIN FAILED
        </Badge>
      )
    }
    if (act.includes('CREATE')) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 font-medium">
          {action}
        </Badge>
      )
    }
    if (act.includes('UPDATE') || act.includes('VERIFY')) {
      return (
        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-100 font-medium">
          {action}
        </Badge>
      )
    }
    if (act.includes('DELETE') || act.includes('CLEAR')) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100 font-medium">
          {action}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-slate-700 border-slate-300 font-medium">
        {action}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-indigo-600" />
              System Activity &amp; Authentication Logs
            </h1>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
              Admin Audit
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time audit trail of user logins, logouts, administrative operations, and security events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none h-8 sm:h-9 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Refresh log stream"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none h-8 sm:h-9 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Export logs to CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearModalOpen(true)}
            className="flex-1 sm:flex-none h-8 sm:h-9 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
            title="Clean old audit logs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
            Clear Logs
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total System Logs</div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Activity className="h-4 w-4 text-indigo-600" />
              {stats?.totalLogs ?? totalCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Recorded audit events</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <div className="text-[10px] uppercase font-semibold text-emerald-700">Today&apos;s Logins</div>
            <div className="text-xl font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <LogIn className="h-4 w-4 text-emerald-600" />
              {stats?.todayLogins ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Successful staff sign-ins</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Today&apos;s Logouts</div>
            <div className="text-xl font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
              <LogOut className="h-4 w-4 text-slate-500" />
              {stats?.todayLogouts ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Completed sessions</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <div className="text-[10px] uppercase font-semibold text-indigo-700">Active Staff Today</div>
            <div className="text-xl font-bold text-indigo-700 flex items-center gap-1.5 mt-0.5">
              <Users className="h-4 w-4 text-indigo-600" />
              {stats?.activeUsersToday ?? 0}
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">Unique active users</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-3.5">
            <div className="text-[10px] uppercase font-semibold text-amber-700">Today&apos;s Operations</div>
            <div className="text-xl font-bold text-amber-700 flex items-center gap-1.5 mt-0.5">
              <Zap className="h-4 w-4 text-amber-600" />
              {stats?.todayActions ?? 0}
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">Calls, techs, updates</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user name, email, action (e.g. LOGIN), IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Button type="submit" variant="secondary" className="text-xs shrink-0 h-9">
              Search Logs
            </Button>
          </form>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">Action Type:</span>
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs bg-white text-slate-700"
            >
              <option value="">All Action Types</option>
              <option value="auth">🔑 Login &amp; Logout Only</option>
              <option value="LOGIN">✓ User Login Only</option>
              <option value="LOGOUT">✕ User Logout Only</option>
              <option value="LOGIN_FAILED">⚠ Login Failed</option>
              <option value="CALL">📞 Customer Call Actions</option>
              <option value="CUSTOMER">👥 Customer Operations</option>
              <option value="TECHNICIAN">🔧 Technician Operations</option>
              <option value="DOCUMENT">📄 Document &amp; KYC Actions</option>
              <option value="SETTINGS">⚙ Settings &amp; Configuration</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Date From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Date To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
              />
            </div>

            {(actionFilter || search || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setActionFilter('')
                  setSearch('')
                  setDateFrom('')
                  setDateTo('')
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-0">
          {/* Mobile Card List (< md screens) */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading activity audit logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No activity records found.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 space-y-2.5 bg-white">
                  {/* Top Bar: User & Timestamp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                        {(log.user_name || 'System')
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                          {log.user_name || 'System / Automated'}
                          {log.user_role && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase px-1 py-0 ${
                                log.user_role === 'admin'
                                  ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                  : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              {log.user_role}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(log.created_at)} • {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 text-xs text-indigo-700 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-2 flex items-center gap-1 shrink-0"
                    >
                      <Eye className="h-3 w-3" />
                      Payload
                    </Button>
                  </div>

                  {/* Action Event & Entity */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-800">
                        {log.action}
                      </span>
                      {log.entity_type && (
                        <span className="text-[10px] text-slate-500">
                          ({log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      IP: {log.ip_address || 'Localhost'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (>= md screens) */}
          <div className="hidden md:block overflow-x-auto touch-scroll">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">User / Staff</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading activity audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">No activity records found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try adjusting your search criteria or resetting filters above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* User Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                              {(log.user_name || 'System')
                                .split(' ')
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                {log.user_name || 'System / Automated'}
                                {log.user_role && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] uppercase px-1 py-0 ${
                                      log.user_role === 'admin'
                                        ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                        : 'border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {log.user_role}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {log.user_email || `User #${log.user_id || 'N/A'}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action Event Column */}
                        <td className="py-3 px-4">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Entity Type Column */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-mono text-slate-800 capitalize">
                            {log.entity_type || 'system'}
                          </div>
                          {log.entity_id && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID #{log.entity_id}
                            </div>
                          )}
                        </td>

                        {/* IP Address Column */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {log.ip_address || '::1 (Localhost)'}
                        </td>

                        {/* Timestamp Column */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatDate(log.created_at)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Action Inspect Button */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 flex items-center gap-1 ml-auto"
                            title="Inspect detailed event payload"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} entries)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchLogs(page - 1)}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchLogs(page + 1)}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EVENT DETAILS INSPECTOR DIALOG */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-indigo-600" />
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Activity Event Inspector #{selectedLog.id}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-400 font-semibold">Staff User:</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedLog.user_name || 'System / Guest'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedLog.user_email}</div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold">Action Triggered:</div>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold">IP Address:</div>
                  <div className="font-mono text-slate-800 mt-0.5">
                    {selectedLog.ip_address || 'Localhost'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold">Timestamp:</div>
                  <div className="text-slate-800 mt-0.5">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Event Payload &amp; Parameter Details:</span>
                  <span className="text-[10px] text-slate-400 font-mono">JSON</span>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                  {selectedLog.details
                    ? typeof selectedLog.details === 'object'
                      ? JSON.stringify(selectedLog.details, null, 2)
                      : selectedLog.details
                    : 'No additional metadata attached to this event.'}
                </pre>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="h-8 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CLEAR LOGS CONFIRMATION MODAL */}
      {clearModalOpen && (
        <Dialog open={clearModalOpen} onOpenChange={setClearModalOpen}>
          <DialogContent className="max-w-md p-5 bg-white">
            <DialogHeader className="pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <DialogTitle className="text-base font-bold">Clear System Activity Logs</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Select the retention period for clearing log entries. Only <strong>System Administrators</strong> can perform this action.
              </p>

              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="font-semibold text-slate-800 block">Retention Range:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clearRange"
                      value="7"
                      checked={clearDays === '7'}
                      onChange={() => setClearDays('7')}
                    />
                    <span>Delete logs older than <strong>7 days</strong></span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clearRange"
                      value="30"
                      checked={clearDays === '30'}
                      onChange={() => setClearDays('30')}
                    />
                    <span>Delete logs older than <strong>30 days</strong> (Recommended)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clearRange"
                      value="90"
                      checked={clearDays === '90'}
                      onChange={() => setClearDays('90')}
                    />
                    <span>Delete logs older than <strong>90 days</strong></span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-red-700">
                    <input
                      type="radio"
                      name="clearRange"
                      value="all"
                      checked={clearDays === 'all'}
                      onChange={() => setClearDays('all')}
                    />
                    <span>Delete <strong>ALL</strong> history logs</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClearModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={clearing}
                  onClick={handleClearLogsConfirm}
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {clearing ? 'Clearing...' : 'Confirm Cleanup'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

