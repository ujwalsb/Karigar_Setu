import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { analyticsApi } from '@/api/analytics'
import { categoriesApi } from '@/api/categories'
import { useAuth } from '@/store/authStore'
import { getServiceMeta } from '@/utils/serviceIcons'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PhoneCall,
  Clock,
  Wrench,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi
      .getDashboardStats()
      .then((res: any) => {
        setStats(res.data.data)
      })
      .catch((err) => {
        console.error('Failed to load stats:', err)
      })
      .finally(() => {
        setLoading(false)
      })

    categoriesApi
      .getAll()
      .then((res: any) => {
        const data = res.data?.data || []
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error('Failed to load categories', err)
      })
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1">
            Role: <span className="uppercase tracking-wider font-semibold">{user?.role}</span> | Centralized appliance service & repair hub
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
          <Link to="/services" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border-white/20 justify-center">
              <Layers className="h-4 w-4 mr-2" />
              Services Catalog ({categories.length})
            </Button>
          </Link>
          <Link to="/technicians/find" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border-white/20 justify-center">
              <Search className="h-4 w-4 mr-2" />
              Find Technician
            </Button>
          </Link>
          <Link to="/calls/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm bg-white text-indigo-900 hover:bg-slate-100 font-semibold shadow-md justify-center">
              <PhoneCall className="h-4 w-4 mr-2" />
              Register Call
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Today&apos;s Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats?.calls?.today_calls ?? (loading ? '...' : 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total registered calls: {stats?.calls?.total_calls ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats?.service_requests?.active_requests ?? (loading ? '...' : 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Completed: {stats?.service_requests?.completed_requests ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Available Technicians</CardTitle>
            <Wrench className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats?.technicians?.available_technicians ?? (loading ? '...' : 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total active: {stats?.technicians?.total_technicians ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Registered Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {stats?.customers?.total_customers ?? (loading ? '...' : 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all service areas</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Services & Appliance Coverage Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Appliance & Home Repair Services Coverage
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant dispatch & technician matching across AC, Fridge, Washing Machine, Normal Repair & Handyman, and more.
            </p>
          </div>
          <Link to="/services">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold">
              View All ({categories.length}) <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat) => {
            const meta = getServiceMeta(cat.icon, cat.name)
            const Icon = meta.icon

            return (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${meta.bgColor} ${meta.color} border ${meta.borderColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] text-slate-500 font-normal">
                      Verified
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {cat.description || 'Quick diagnostics, repairs, and original parts.'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-600 hover:text-slate-900 h-8 px-2 flex-1"
                    onClick={() => navigate(`/technicians/find?category=${cat.id}`)}
                  >
                    Find Tech
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-2.5 flex-1 shadow-xs"
                    onClick={() =>
                      navigate(
                        `/calls/new?categoryId=${cat.id}&requirement=${encodeURIComponent(
                          meta.sampleProblem
                        )}`
                      )
                    }
                  >
                    Book Call
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-indigo-600" />
              Customer Call Pipeline
            </CardTitle>
            <CardDescription>
              Log incoming calls, record appliance issues, and assign nearby technicians.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-700">Recent Customer Calls</span>
                <p className="text-xs text-slate-500">Monitor and update call logs</p>
              </div>
              <Link to="/calls">
                <Button variant="ghost" size="sm">
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-700">Register New Service Call</span>
                <p className="text-xs text-slate-500">Auto-detect customer or create record</p>
              </div>
              <Link to="/calls/new">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  + New Call
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-600" />
              Smart Technician Matcher
            </CardTitle>
            <CardDescription>
              Locate technicians in seconds using category, PIN code, area, or GPS coordinates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-700">Find Closest Technician</span>
                <p className="text-xs text-slate-500">Distance formula with ranked matching</p>
              </div>
              <Link to="/technicians/find">
                <Button size="sm" variant="outline">
                  Match Now <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-700">Technician Directory</span>
                <p className="text-xs text-slate-500">Manage verification and skill areas</p>
              </div>
              <Link to="/technicians">
                <Button variant="ghost" size="sm">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
