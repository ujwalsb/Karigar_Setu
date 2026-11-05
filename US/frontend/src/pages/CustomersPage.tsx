import React, { useEffect, useState } from 'react'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  ExternalLink
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CustomerServiceDetailsModal } from '@/components/CustomerServiceDetailsModal'

export function CustomersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Customer Service Details Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false)

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    mobile: '',
    alternate_mobile: '',
    area: '',
    city: 'Pune',
    pin_code: '',
    address: ''
  })
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete Confirmation State
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomers = () => {
    setLoading(true)
    customersApi
      .getAll({ search })
      .then((res: any) => {
        const data = res.data?.data?.rows || res.data?.data || []
        setCustomers(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error(err)
        setErrorMsg('Failed to load customers.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const openEditModal = (c: any) => {
    setEditingCustomer(c)
    setEditFormData({
      full_name: c.full_name || c.name || '',
      mobile: c.mobile || '',
      alternate_mobile: c.alternate_mobile || c.alt_mobile || '',
      area: c.area || '',
      city: c.city || 'Pune',
      pin_code: c.pin_code || c.pinCode || '',
      address: c.address || ''
    })
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return

    setSavingEdit(true)
    setErrorMsg('')
    try {
      await customersApi.update(editingCustomer.id, editFormData as any)
      setSuccessMsg(`Customer ${editFormData.full_name} updated successfully!`)
      setEditingCustomer(null)
      fetchCustomers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update customer details.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return
    if (!isAdmin) {
      alert('Only administrators can delete customers.')
      return
    }

    setDeleting(true)
    setErrorMsg('')
    try {
      await customersApi.delete(deletingCustomer.id)
      setSuccessMsg(`Customer ${deletingCustomer.full_name || deletingCustomer.name} deleted successfully.`)
      setDeletingCustomer(null)
      fetchCustomers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete customer.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
          <p className="text-sm text-slate-500">
            View, search, edit customer records, or remove customers (Admin only).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
            Current Role: <strong className="ml-1 uppercase text-indigo-600">{user?.role || 'Staff'}</strong>
          </Badge>
        </div>
      </div>

      {successMsg && (
        <Alert className="border-emerald-500 text-emerald-800 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer name, mobile, area, or PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
              className="pl-9"
            />
          </div>
          <Button onClick={fetchCustomers} variant="secondary" className="shrink-0">
            Search
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Alternate Mobile</th>
                  <th className="py-3 px-4">Area / Locality</th>
                  <th className="py-3 px-4">PIN Code</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading customer database...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No customers found. Customers are registered automatically when logging a call.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id)
                            setIsServiceDetailsOpen(true)
                          }}
                          className="font-semibold text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 text-left group"
                          title="Click to view full service details, work done &amp; amount taken"
                        >
                          <span className="group-hover:translate-x-0.5 transition-transform">{c.full_name || c.name}</span>
                          <span className="text-[10px] text-indigo-400 font-normal">
                            (View History →)
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{c.mobile}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                        {c.alternate_mobile || c.alt_mobile || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.area || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {c.pin_code || c.pinCode || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatDate(c.created_at || c.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomerId(c.id)
                              setIsServiceDetailsOpen(true)
                            }}
                            className="h-7 px-2 text-xs flex items-center gap-1 text-indigo-700 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 font-medium"
                            title="View full service history, work done &amp; amount taken"
                          >
                            <Wrench className="h-3 w-3" />
                            Services
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(c)}
                            className="h-7 px-2 text-xs flex items-center gap-1 text-slate-700 hover:text-indigo-600"
                            title="Edit customer details (Admin & Support)"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          {isAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingCustomer(c)}
                              className="h-7 px-2 text-xs flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              title="Delete customer (Admin Only)"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          ) : (
                            <span
                              className="text-[10px] text-slate-400 italic px-1 cursor-not-allowed"
                              title="Deleting customers requires Administrator privileges"
                            >
                              Admin only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  Edit Customer: {editingCustomer.full_name || editingCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Full Name *</Label>
                <Input
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Mobile Number *</Label>
                  <Input
                    required
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    placeholder="10-digit mobile"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Alternate Mobile</Label>
                  <Input
                    value={editFormData.alternate_mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, alternate_mobile: e.target.value })}
                    placeholder="Optional alt mobile"
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Area / Locality *</Label>
                  <Input
                    required
                    value={editFormData.area}
                    onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                    placeholder="e.g. Kothrud, Baner"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">PIN Code *</Label>
                  <Input
                    required
                    value={editFormData.pin_code}
                    onChange={(e) => setEditFormData({ ...editFormData, pin_code: e.target.value })}
                    placeholder="6-digit PIN"
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Address / Landmark</Label>
                <Input
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="Flat No, Building, Street"
                  className="h-9 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCustomer(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Customer Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-sm">Confirm Customer Deletion</h3>
              </div>
              <button
                onClick={() => setDeletingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete customer{' '}
                <strong>{deletingCustomer.full_name || deletingCustomer.name}</strong> (Mobile:{' '}
                <span className="font-mono">{deletingCustomer.mobile}</span>)?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800 flex items-start gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This operation requires <strong>Administrator</strong> privileges. The customer profile will be deactivated.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingCustomer(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Customer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER SERVICE DETAILS & HISTORY MODAL */}
      <CustomerServiceDetailsModal
        open={isServiceDetailsOpen}
        onOpenChange={setIsServiceDetailsOpen}
        customerId={selectedCustomerId}
        onCustomerUpdated={fetchCustomers}
      />
    </div>
  )
}
