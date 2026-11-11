import React, { useEffect, useState, useMemo } from 'react'
import { usersApi } from '@/api/users'
import { useAuth } from '@/store/authStore'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Headphones,
  Lock,
  Phone,
  Mail,
  User as UserIcon,
  Power
} from 'lucide-react'
import { formatDate, getResolvedCompanyName } from '@/lib/utils'
import { useSettings } from '@/store/settingsStore'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const { settings } = useSettings()
  const companyName = getResolvedCompanyName(settings)
  const emailDomain = (settings.support_email || '').includes('@')
    ? settings.support_email.split('@')[1].trim()
    : 'company.com'
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'support' | 'inactive'>('all')

  // Notification banners
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState<'admin' | 'support'>('support')
  const [addPhone, setAddPhone] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  // Edit / Update User Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'support'>('support')
  const [editIsActive, setEditIsActive] = useState<boolean>(true)
  const [editPassword, setEditPassword] = useState('')
  const [updatingUser, setUpdatingUser] = useState(false)

  // Delete User Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await usersApi.getAll()
      const rawData = res.data?.data as any
      const data = rawData?.rows || rawData || []
      setUsers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to load staff accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((u) => u.role === 'admin').length
    const support = users.filter((u) => u.role === 'support').length
    const active = users.filter((u) => u.isActive !== false && u.is_active !== false).length
    const inactive = total - active
    return { total, admins, support, active, inactive }
  }, [users])

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role / Status filter
      if (roleFilter === 'admin' && u.role !== 'admin') return false
      if (roleFilter === 'support' && u.role !== 'support') return false
      if (roleFilter === 'inactive') {
        const isInactive = u.isActive === false || u.is_active === false
        if (!isInactive) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = u.name?.toLowerCase().includes(q)
        const matchEmail = u.email?.toLowerCase().includes(q)
        const matchPhone = u.phone?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone) return false
      }

      return true
    })
  }, [users, roleFilter, searchQuery])

  // Open Create Modal
  const handleOpenAddModal = () => {
    setAddName('')
    setAddEmail('')
    setAddPassword('')
    setAddRole('support')
    setAddPhone('')
    setError('')
    setShowAddModal(true)
  }

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setCreatingUser(true)
      await usersApi.create({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        role: addRole,
        phone: addPhone.trim() || undefined
      })
      setSuccess(`Employee account for "${addName}" created successfully.`)
      setTimeout(() => setSuccess(''), 5000)
      setShowAddModal(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user account.')
    } finally {
      setCreatingUser(false)
    }
  }

  // Open Edit Modal
  const handleOpenEditModal = (u: User) => {
    setEditingUser(u)
    setEditName(u.name || '')
    setEditEmail(u.email || '')
    setEditPhone(u.phone || '')
    setEditRole((u.role as 'admin' | 'support') || 'support')
    setEditIsActive(u.isActive !== false && u.is_active !== false)
    setEditPassword('')
    setError('')
    setShowEditModal(true)
  }

  // Submit Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setError('')
    setSuccess('')

    try {
      setUpdatingUser(true)
      const payload: Partial<User> & { password?: string } = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole,
        is_active: editIsActive
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim()
      }

      await usersApi.update(editingUser.id, payload)
      setSuccess(`User account "${editName}" updated successfully.`)
      setTimeout(() => setSuccess(''), 5000)
      setShowEditModal(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update user account.')
    } finally {
      setUpdatingUser(false)
    }
  }

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (u: User) => {
    setDeletingUser(u)
    setError('')
    setShowDeleteModal(true)
  }

  // Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    setError('')
    setSuccess('')

    try {
      setDeleting(true)
      await usersApi.delete(deletingUser.id)
      setSuccess(`User account "${deletingUser.name}" has been deleted.`)
      setTimeout(() => setSuccess(''), 5000)
      setShowDeleteModal(false)
      setDeletingUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user account.')
    } finally {
      setDeleting(false)
    }
  }

  // Quick Toggle Active/Inactive Status
  const handleToggleActive = async (u: User) => {
    if (u.id === currentUser?.id) {
      setError('You cannot deactivate your own logged-in account.')
      setTimeout(() => setError(''), 4000)
      return
    }

    try {
      setError('')
      await usersApi.toggleActive(u.id)
      const currentActive = u.isActive !== false && u.is_active !== false
      setSuccess(`User "${u.name}" has been ${currentActive ? 'deactivated' : 'activated'}.`)
      setTimeout(() => setSuccess(''), 4000)
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update account status.')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Staff & User Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage system administrators and support team members. Control login access, update profiles, and assign roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="h-9 text-xs flex items-center gap-1.5 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAddModal}
            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Alert Notifications */}
      {error && (
        <Alert variant="destructive" className="py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-xs font-medium text-emerald-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-1 pt-3.5 px-4">
            <CardDescription className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
              Total Staff
              <Users className="h-4 w-4 text-slate-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
              {stats.total}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-[11px] text-slate-500">
            Registered accounts
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-1 pt-3.5 px-4">
            <CardDescription className="text-[11px] font-semibold text-indigo-600 uppercase flex items-center justify-between">
              Administrators
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-700 mt-1">
              {stats.admins}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-[11px] text-indigo-600/80 font-medium">
            Full system control
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-1 pt-3.5 px-4">
            <CardDescription className="text-[11px] font-semibold text-emerald-600 uppercase flex items-center justify-between">
              Support Team
              <Headphones className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700 mt-1">
              {stats.support}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-[11px] text-emerald-600/80 font-medium">
            Call logging & dispatch
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardHeader className="pb-1 pt-3.5 px-4">
            <CardDescription className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
              Active Logins
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-800 mt-1">
              {stats.active}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-[11px] text-slate-500">
            {stats.inactive > 0 ? (
              <span className="text-rose-600 font-semibold">{stats.inactive} inactive account(s)</span>
            ) : (
              <span className="text-emerald-700 font-medium">All accounts active</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${roleFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              All Users ({stats.total})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${roleFilter === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                }`}
            >
              <Shield className="h-3 w-3" />
              Admins ({stats.admins})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('support')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${roleFilter === 'support'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
            >
              <Headphones className="h-3 w-3" />
              Support Team ({stats.support})
            </button>

            {stats.inactive > 0 && (
              <button
                type="button"
                onClick={() => setRoleFilter('inactive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${roleFilter === 'inactive'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
                  }`}
              >
                <UserX className="h-3 w-3" />
                Inactive ({stats.inactive})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs pl-8 bg-white border-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Mobile Card List (< md screens) */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading staff accounts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No staff members found.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isActive = u.isActive !== false && u.is_active !== false
              const isSelf = u.id === currentUser?.id

              return (
                <div key={u.id} className="p-4 space-y-3 bg-white">
                  {/* Top Bar: Avatar, Name, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${u.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              You
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">#{u.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {u.role === 'admin' ? 'Administrator' : 'Support Agent'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {u.role === 'admin' ? (
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5 text-indigo-600" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                          <Headphones className="h-2.5 w-2.5 text-emerald-600" />
                          Support
                        </Badge>
                      )}

                      {isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-semibold">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-semibold">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                    <a href={`mailto:${u.email}`} className="font-mono text-slate-700 hover:text-indigo-600 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      {u.email}
                    </a>
                    {u.phone && (
                      <a href={`tel:${u.phone}`} className="font-mono text-emerald-700 hover:underline flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                        {u.phone}
                      </a>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(u)}
                      disabled={isSelf}
                      className={`text-xs h-8 px-2.5 flex items-center gap-1 ${isActive
                        ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                        : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                    >
                      <Power className="h-3 w-3" />
                      {isActive ? 'Deactivate' : 'Activate'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditModal(u)}
                      className="flex-1 text-xs h-8 text-indigo-700 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 flex items-center justify-center gap-1 font-medium"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit Profile
                    </Button>

                    {!isSelf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDeleteModal(u)}
                        className="text-xs h-8 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop Table (>= md screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Work Email & Phone</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading staff accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-600">No staff members found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search or tab filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.isActive !== false && u.is_active !== false
                  const isSelf = u.id === currentUser?.id

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Column 1: Staff Member Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  You
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">#{u.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {u.role === 'admin' ? 'Administrator' : 'Support Agent'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Email & Phone */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs text-slate-700 flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {u.email}
                          </div>
                          {u.phone ? (
                            <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {u.phone}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">No phone added</div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: System Role */}
                      <td className="py-3 px-4">
                        {u.role === 'admin' ? (
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100 text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <Shield className="h-3 w-3 text-indigo-600" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 w-fit">
                            <Headphones className="h-3 w-3 text-emerald-600" />
                            Support Team
                          </Badge>
                        )}
                      </td>

                      {/* Column 4: Account Status */}
                      <td className="py-3 px-4">
                        {isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <UserX className="h-3 w-3 text-rose-600" />
                            Inactive
                          </Badge>
                        )}
                      </td>

                      {/* Column 5: Created Date */}
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {u.created_at || u.createdAt ? formatDate(u.created_at || u.createdAt || '') : '—'}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Status */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf}
                            className={`h-7 w-7 p-0 ${isActive
                              ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                            title={
                              isSelf
                                ? 'Cannot deactivate your own account'
                                : isActive
                                  ? 'Deactivate user login'
                                  : 'Activate user login'
                            }
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit / Update Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(u)}
                            className="h-7 text-xs px-2.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1 shadow-2xs font-medium"
                            title="Edit user details and role"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={isSelf}
                            className={`h-7 text-xs px-2.5 border-rose-200 shadow-2xs font-medium flex items-center gap-1 ${isSelf
                              ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                            title={isSelf ? 'Cannot delete your own account' : 'Delete user account'}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 1. ADD / CREATE USER MODAL                                                */}
      {/* ========================================================================= */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              Add New Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create credentials for an employee to access the {companyName} dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Full Name *</Label>
              <Input
                required
                placeholder="e.g. Rahul Patil"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Work Email Address *</Label>
              <Input
                type="email"
                required
                placeholder={`e.g. rahul@${emailDomain || 'company.com'}`}
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Phone Number</Label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">System Role *</Label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as any)}
                  className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
                >
                  <option value="support">Support Team (Calls & Jobs)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Initial Password * (Min 8 chars)</Label>
              <Input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-slate-400">The employee can use this password to log in.</p>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                disabled={creatingUser}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={creatingUser}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {creatingUser ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. EDIT / UPDATE USER MODAL                                               */}
      {/* ========================================================================= */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-indigo-600" />
              Edit Staff Account: {editingUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update user contact details, role permissions, or reset their password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Full Name *</Label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Work Email *</Label>
              <Input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Phone Number</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">System Role *</Label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
                >
                  <option value="support">Support Team (Calls & Jobs)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Account Status</Label>
              <select
                value={editIsActive ? 'active' : 'inactive'}
                onChange={(e) => setEditIsActive(e.target.value === 'active')}
                disabled={editingUser?.id === currentUser?.id}
                className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
              >
                <option value="active">Active (Permitted to log in)</option>
                <option value="inactive">Inactive (Login blocked)</option>
              </select>
              {editingUser?.id === currentUser?.id && (
                <p className="text-[10px] text-amber-600">You cannot deactivate your own logged-in account.</p>
              )}
            </div>

            {/* Optional Password Reset */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-slate-500" />
                Change Password (Optional)
              </Label>
              <Input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="h-9 text-xs bg-white"
              />
              <p className="text-[10px] text-slate-400">
                Only fill this in if you want to reset the user's password (min 6 characters).
              </p>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(false)}
                disabled={updatingUser}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updatingUser}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {updatingUser ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION DIALOG                                             */}
      {/* ========================================================================= */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg text-slate-900">
              Delete Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-slate-800">{deletingUser?.name}</strong> ({deletingUser?.email})?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                Warning: Access Revocation
              </p>
              <p className="text-[11px] leading-relaxed text-rose-700">
                This user will immediately lose all access to the system. Existing service calls, requests, and activity history recorded by this user will be preserved for auditing.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDeleteModal(false)
                setDeletingUser(null)
              }}
              disabled={deleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
