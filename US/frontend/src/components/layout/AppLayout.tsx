import React, { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/authStore'
import { useSettings } from '@/store/settingsStore'
import { resolveAssetUrl, getResolvedCompanyName, getBrandInitials } from '@/lib/utils'
import {
  LayoutDashboard,
  PhoneCall,
  UserCheck,
  Users,
  Wrench,
  ClipboardList,
  BarChart3,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Layers,
  Menu,
  X,
  Activity,
  Settings,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    setLogoError(false)
  }, [settings.company_logo_url])

  const brandLogoUrl = !logoError ? resolveAssetUrl(settings.company_logo_url) : ''
  const companyName = getResolvedCompanyName(settings)
  const brandInitials = getBrandInitials(companyName)

  const renderBrandMark = (sizeClass: string, textClass: string) =>
    brandLogoUrl ? (
      <div
        className={`${sizeClass} bg-white flex items-center justify-center overflow-hidden border border-slate-700/40 shrink-0 shadow`}
      >
        <img
          src={brandLogoUrl}
          alt={companyName}
          onError={() => setLogoError(true)}
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    ) : (
      <div
        className={`${sizeClass} bg-indigo-600 flex items-center justify-center font-bold text-white ${textClass} shrink-0 shadow`}
      >
        {brandInitials}
      </div>
    )

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Services Catalog', path: '/services', icon: Layers },
    { label: 'Customer Calls', path: '/calls', icon: PhoneCall },
    { label: 'Find Technician', path: '/technicians/find', icon: UserCheck },
    { label: 'Technicians', path: '/technicians', icon: Wrench },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Service Requests', path: '/service-requests', icon: ClipboardList },
    { label: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    ...(user?.role === 'admin'
      ? [
        { label: 'Technician Plans & Billing', path: '/technician-plans', icon: Receipt },
        { label: 'Staff Management', path: '/users', icon: ShieldAlert },
        { label: 'Activity & Auth Logs', path: '/logs', icon: Activity },
        { label: 'Platform Settings', path: '/settings', icon: Settings },
      ]
      : []),
  ]

  // Key navigation items for the mobile bottom quick bar
  const bottomBarItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Calls', path: '/calls', icon: PhoneCall },
    { label: 'Requests', path: '/service-requests', icon: ClipboardList },
    { label: 'Techs', path: '/technicians', icon: Wrench },
    { label: 'Customers', path: '/customers', icon: Users },
  ]

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ======================================================== */}
      {/* 1. DESKTOP SIDEBAR (Large screens >= 1024px)              */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-200 flex-col shrink-0 shadow-lg">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          {renderBrandMark('h-9 w-9 rounded-lg', 'text-lg shadow-md')}
          <div>
            <h1 className="font-semibold text-white tracking-wide text-sm truncate max-w-[170px]">
              {companyName}
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
              {settings.tagline || 'Technician & Service Hub'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <UserIcon className="h-4 w-4 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.name || 'User'}</p>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider px-1.5 py-0 border-slate-700 text-indigo-400"
              >
                {user?.role || 'Staff'}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 h-auto"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE DRAWER OVERLAY & SIDEBAR (Phone & Tablet)      */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-200 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Drawer Header with Close Button */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            {renderBrandMark('h-8 w-8 rounded-lg', 'text-base')}
            <div>
              <h2 className="font-semibold text-white text-sm truncate max-w-[170px]">
                {companyName}
              </h2>
              <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                {settings.tagline || 'Technician & Service Hub'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Drawer User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <UserIcon className="h-4 w-4 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-wider px-1 py-0 border-slate-700 text-indigo-400"
              >
                {user?.role || 'Staff'}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 h-8"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN APP VIEWPORT                                     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs z-10">
          {/* Left: Mobile Hamburger Toggle + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">
                <span className="hidden sm:inline">{companyName} • Service Operations</span>
                <span className="sm:hidden flex items-center gap-1.5">
                  {renderBrandMark('h-6 w-6 rounded', 'text-xs')}
                  {companyName}
                </span>
              </h2>
            </div>
          </div>

          {/* Right: Quick Action Buttons (Compact & Flex on Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link to="/service-requests">
              <Button
                size="sm"
                variant="outline"
                className={`h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium transition-colors shadow-2xs ${location.pathname.startsWith('/service-requests')
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400/20'
                  : 'border-slate-300 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
              >
                <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">Service Requests</span>
                <span className="sm:hidden">Requests</span>
              </Button>
            </Link>

            <Link to="/calls/new">
              <Button
                size="sm"
                className="h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
              >
                <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">+ Register New Call</span>
                <span className="sm:hidden">+ Call</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Route Content (With bottom clearance for mobile bar) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* ======================================================== */}
        {/* 4. MOBILE BOTTOM QUICK NAVIGATION BAR (Phone screens)    */}
        {/* ======================================================== */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around h-14 shadow-lg px-1">
          {bottomBarItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Icon className={`h-4 w-4 mb-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate max-w-[60px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
