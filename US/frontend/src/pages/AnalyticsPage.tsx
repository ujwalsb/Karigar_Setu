import React, { useEffect, useState } from 'react'
import { analyticsApi } from '@/api/analytics'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, TrendingUp, Users, Calendar } from 'lucide-react'

export function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [areaDemand, setAreaDemand] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboardStats().catch(() => ({ data: { data: null } })),
      analyticsApi.getAreaWiseDemand().catch(() => ({ data: { data: [] } })),
      analyticsApi.getCategoryBreakdown().catch(() => ({ data: { data: [] } })),
    ])
      .then(([statsRes, areaRes, catRes]: any) => {
        setStats(statsRes.data?.data)
        setAreaDemand(Array.isArray(areaRes.data?.data) ? areaRes.data.data : [])
        setCategoryData(Array.isArray(catRes.data?.data) ? catRes.data.data : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExport = (format: 'excel' | 'csv') => {
    window.open(`/api/v1/analytics/export?type=calls&format=${format}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-slate-500">Service volumes, category distribution, and area demand</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="flex-1 sm:flex-none justify-center">
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="flex-1 sm:flex-none justify-center">
            <Download className="h-4 w-4 mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Card */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Service Category Distribution
            </CardTitle>
            <CardDescription>Most requested repair appliances</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading categories...</p>
            ) : categoryData.length === 0 ? (
              <p className="text-slate-400 text-sm">No service category data recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">{item.name || item.category_name}</span>
                    <span className="text-sm font-bold text-indigo-600">{item.count || item.value || 0} calls</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Area Wise Demand Card */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Area-Wise Repair Demand
            </CardTitle>
            <CardDescription>Customer concentration across localities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading area stats...</p>
            ) : areaDemand.length === 0 ? (
              <p className="text-slate-400 text-sm">No area demand statistics recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {areaDemand.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">{item.area || 'Unknown'}</span>
                    <span className="text-sm font-bold text-emerald-600">{item.call_count || item.count || 0} requests</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

