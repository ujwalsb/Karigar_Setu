import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { techniciansApi } from '@/api/technicians'
import { categoriesApi } from '@/api/categories'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { callsApi } from '@/api/calls'
import { getServiceMeta } from '@/utils/serviceIcons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  MapPin,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Star,
  Phone,
  Sparkles,
  User,
  AlertTriangle,
  RotateCcw,
  Clock,
  Send
} from 'lucide-react'
import { DispatchModal } from '@/components/DispatchModal'
import { DispatchDetails } from '@/lib/dispatch'

export function FindTechnicianPage() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const initialArea = searchParams.get('area') || ''
  const initialPin = searchParams.get('pincode') || searchParams.get('pin_code') || ''
  const callId = searchParams.get('callId') || ''
  const serviceRequestId = searchParams.get('serviceRequestId') || searchParams.get('requestId') || ''
  const targetId = serviceRequestId || callId

  const [categories, setCategories] = useState<any[]>([])
  const [serviceCategoryId, setServiceCategoryId] = useState(initialCategory)
  const [area, setArea] = useState(initialArea)
  const [pinCode, setPinCode] = useState(initialPin)
  const [city] = useState('Pune')
  const [customerContext, setCustomerContext] = useState<{
    name?: string
    mobile?: string
    alternateMobile?: string
    address?: string
    landmark?: string
    area?: string
    pinCode?: string
    requirement?: string
    urgency?: string
    categoryName?: string
    currentTechName?: string
    isReassign?: boolean
  } | null>(null)

  const [dispatchData, setDispatchData] = useState<Partial<DispatchDetails> | null>(null)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const triggerSearch = (catId: string, searchArea: string, searchPin: string) => {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const params: any = {
      area: searchArea.trim(),
      city: 'Pune',
      pinCode: searchPin.trim(),
      pin_code: searchPin.trim(),
    }
    if (catId) {
      params.serviceCategoryId = parseInt(catId) || catId
      params.service_category_id = parseInt(catId) || catId
    }

    techniciansApi
      .find(params)
      .then((res: any) => {
        const data = res.data?.data || []
        setResults(Array.isArray(data) ? data : [])
      })
      .catch((err: any) => {
        setErrorMsg(err.message || 'Error searching technicians.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    categoriesApi
      .getAll()
      .then((res: any) => {
        const data = res.data?.data || []
        const rawCats = Array.isArray(data) ? data : []

        // Deduplicate categories by base keyword so user never sees duplicate categories
        const deduplicated: any[] = []
        const seenWords = new Set<string>()

        // Order preference: categories with full description first
        const sortedCats = [...rawCats].sort((a, b) => (b.id >= 6 ? 1 : -1))

        for (const cat of sortedCats) {
          const key = cat.name.toLowerCase().includes('air condition') || cat.name.toLowerCase().includes('ac ')
            ? 'air_conditioner'
            : cat.name.toLowerCase().includes('refrigerator') || cat.name.toLowerCase().includes('fridge')
              ? 'refrigerator'
              : cat.name.toLowerCase().includes('washing')
                ? 'washing_machine'
                : cat.name.toLowerCase().includes('microwave')
                  ? 'microwave'
                  : cat.name.toLowerCase().includes('purifier') || cat.name.toLowerCase().includes('ro')
                    ? 'water_purifier'
                    : cat.name.toLowerCase().trim()

          if (!seenWords.has(key)) {
            seenWords.add(key)
            deduplicated.push(cat)
          }
        }

        setCategories(deduplicated)

        // If no category specified from query, select first category (AC Service) and search
        const activeCatId = initialCategory || (deduplicated.length > 0 ? String(deduplicated[0].id) : '')
        if (activeCatId && !callId && !serviceRequestId) {
          setServiceCategoryId(activeCatId)
          triggerSearch(activeCatId, initialArea, initialPin)
        }
      })
      .catch((err) => console.error('Error fetching categories:', err))

    if (callId) {
      callsApi
        .getById(parseInt(callId))
        .then((res: any) => {
          const c = res.data?.data
          if (c) {
            const catId = c.service_category_id ? String(c.service_category_id) : initialCategory
            const custArea = c.customer_area || initialArea || ''
            const custPin = c.customer_pin_code || initialPin || ''
            const isReassign = Boolean(c.status === 'technician_assigned' || c.technician_name)
            setCustomerContext({
              name: c.customer_name,
              mobile: c.customer_mobile,
              alternateMobile: c.customer_alternate_mobile,
              address: c.customer_address,
              landmark: c.customer_landmark,
              area: custArea,
              pinCode: custPin,
              requirement: c.requirement || c.problem_description,
              urgency: c.urgency,
              categoryName: c.service_category_name,
              currentTechName: c.technician_name,
              isReassign
            })
            if (catId) setServiceCategoryId(catId)
            if (custArea) setArea(custArea)
            if (custPin) setPinCode(custPin)
            triggerSearch(catId, custArea, custPin)
          }
        })
        .catch((err) => {
          console.error(err)
          if (initialCategory) triggerSearch(initialCategory, initialArea, initialPin)
        })
    } else if (serviceRequestId) {
      serviceRequestsApi
        .getById(parseInt(serviceRequestId))
        .then((res: any) => {
          const sr = res.data?.data
          if (sr) {
            const catId = sr.service_category_id ? String(sr.service_category_id) : initialCategory
            const custArea = sr.customer_area || initialArea || ''
            const custPin = sr.customer_pin_code || initialPin || ''
            const isReassign = Boolean(sr.assigned_technician_id || sr.technician_name)
            setCustomerContext({
              name: sr.customer_name,
              mobile: sr.customer_mobile,
              alternateMobile: sr.customer_alternate_mobile,
              address: sr.customer_address,
              landmark: sr.customer_landmark,
              area: custArea,
              pinCode: custPin,
              requirement: sr.requirement || sr.internal_notes || sr.problem_description,
              urgency: sr.urgency,
              categoryName: sr.service_category_name,
              currentTechName: sr.technician_name,
              isReassign
            })
            if (catId) setServiceCategoryId(catId)
            if (custArea) setArea(custArea)
            if (custPin) setPinCode(custPin)
            triggerSearch(catId, custArea, custPin)
          }
        })
        .catch((err) => {
          console.error(err)
          if (initialCategory) triggerSearch(initialCategory, initialArea, initialPin)
        })
    }
  }, [callId, serviceRequestId])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    triggerSearch(serviceCategoryId, area, pinCode)
  }

  const handleQuickCategorySelect = (catId: number) => {
    const idStr = String(catId)
    setServiceCategoryId(idStr)
    triggerSearch(idStr, area, pinCode)
  }

  const handleResetFilters = () => {
    setArea('')
    setPinCode('')
    triggerSearch(serviceCategoryId, '', '')
  }

  const handleAssign = async (techId: number) => {
    if (!targetId) {
      alert('To assign directly, navigate here from a specific Customer Call or create an assignment in Service Requests.')
      return
    }

    setAssigningId(techId)
    setErrorMsg('')
    try {
      let assignRes: any
      if (customerContext?.isReassign) {
        assignRes = await serviceRequestsApi.reassign(parseInt(targetId), {
          technicianId: techId,
          technician_id: techId,
          reason: 'Reassigned via Nearest Technician Finder'
        })
      } else {
        assignRes = await serviceRequestsApi.assign(parseInt(targetId), {
          technicianId: techId,
          technician_id: techId
        })
      }

      const selectedTech = results.find((t) => t.id === techId)
      const dispatchDataFromApi = assignRes?.data?.data?.dispatchDetails || {}

      const dispatchPayload: Partial<DispatchDetails> = {
        technicianName: dispatchDataFromApi.technician_name || selectedTech?.full_name || selectedTech?.name || 'Assigned Technician',
        technicianPhone: dispatchDataFromApi.technician_mobile || selectedTech?.mobile || '',
        customerName: dispatchDataFromApi.customer_name || customerContext?.name || 'Customer',
        customerPhone: dispatchDataFromApi.customer_mobile || customerContext?.mobile || '',
        customerAltPhone: dispatchDataFromApi.customer_alternate_mobile || customerContext?.alternateMobile,
        customerAddress: dispatchDataFromApi.customer_address || customerContext?.address || '',
        customerLandmark: dispatchDataFromApi.customer_landmark || customerContext?.landmark || '',
        customerArea: dispatchDataFromApi.customer_area || customerContext?.area || area || 'Pune',
        customerCity: dispatchDataFromApi.customer_city || 'Pune',
        customerPinCode: dispatchDataFromApi.customer_pin_code || customerContext?.pinCode || pinCode || '',
        customerLatitude: dispatchDataFromApi.customer_latitude,
        customerLongitude: dispatchDataFromApi.customer_longitude,
        jobId: dispatchDataFromApi.call_id || dispatchDataFromApi.request_id || targetId,
        serviceCategory: dispatchDataFromApi.service_category_name || customerContext?.categoryName || selectedCategory?.name || 'Appliance Service',
        requirement: dispatchDataFromApi.requirement || dispatchDataFromApi.problem_description || customerContext?.requirement || '',
        urgency: dispatchDataFromApi.urgency || customerContext?.urgency || 'Normal',
        preferredDate: dispatchDataFromApi.preferred_date,
        preferredTime: dispatchDataFromApi.preferred_time
      }

      setDispatchData(dispatchPayload)
      setIsDispatchOpen(true)
      setSuccessMsg(`Technician ${dispatchPayload.technicianName} successfully assigned to Call / Request #${targetId}!`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign technician.')
    } finally {
      setAssigningId(null)
    }
  }

  const selectedCategory = categories.find((c) => String(c.id) === String(serviceCategoryId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Nearest Technician Finder</h1>
        <p className="text-sm text-slate-500">
          Ranked matches based on PIN code proximity, service category, area coverage, and GPS distance.
        </p>
      </div>

      {customerContext && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white text-xs">
                    {customerContext.isReassign ? 'Reassigning Technician' : 'Dispatch Assignment'}
                  </Badge>
                  <span className="text-xs font-mono text-slate-500">ID #{targetId}</span>
                  {customerContext.urgency && (
                    <Badge variant="outline" className="text-xs uppercase font-medium border-amber-300 text-amber-700 bg-amber-50">
                      {customerContext.urgency}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" />
                  {customerContext.name} • {customerContext.mobile}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <strong>{customerContext.area || 'Pune'}</strong> {customerContext.pinCode ? `(${customerContext.pinCode})` : ''}
                  </span>
                  {customerContext.categoryName && (
                    <span className="flex items-center gap-1 font-medium text-indigo-700">
                      <Wrench className="h-3 w-3 text-indigo-500" />
                      {customerContext.categoryName}
                    </span>
                  )}
                </div>
                {customerContext.currentTechName && (
                  <div className="text-xs text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">
                    Currently Assigned: <strong>{customerContext.currentTechName}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (customerContext.area) setArea(customerContext.area)
                    if (customerContext.pinCode) setPinCode(customerContext.pinCode)
                    triggerSearch(serviceCategoryId, customerContext.area || '', customerContext.pinCode || '')
                  }}
                  className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100/50"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Use Customer Locality
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {targetId && !customerContext && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-900">
              Active Assignment Target: <strong>Call / Request #{targetId}</strong>. Clicking &quot;Assign to Call&quot; will assign the technician and set the call status to Technician Assigned.
            </span>
          </div>
          <Link to="/calls" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline">
            View Calls →
          </Link>
        </div>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="border-emerald-500 text-emerald-800 bg-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
            <AlertDescription className="font-medium">{successMsg}</AlertDescription>
          </div>
          {dispatchData && (
            <Button
              size="sm"
              onClick={() => setIsDispatchOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Send Details (WhatsApp &amp; SMS)
            </Button>
          )}
        </Alert>
      )}

      {/* Search Criteria Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900">
            <Search className="h-5 w-5 text-indigo-600" />
            Search Criteria & Appliance Selection
          </CardTitle>
          <CardDescription>
            Filter by certified appliance repair service, customer locality, or PIN code to find the highest-ranked available technicians.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Filter Chips */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Select Appliance / Service Category:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setServiceCategoryId('')
                  triggerSearch('', area, pinCode)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!serviceCategoryId
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>All Appliances & Services</span>
              </button>
              {categories.map((c) => {
                const meta = getServiceMeta(c.icon, c.name)
                const Icon = meta.icon
                const isSelected = String(c.id) === String(serviceCategoryId)

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickCategorySelect(c.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{c.name.split('(')[0].replace('& Handyman', '').trim()}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={serviceCategoryId}
                onChange={(e) => {
                  setServiceCategoryId(e.target.value)
                  triggerSearch(e.target.value, area, pinCode)
                }}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700 font-medium"
              >
                <option value="">All Services (Any Appliance)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="area">Customer Area / Locality</Label>
              <Input
                id="area"
                placeholder="e.g. Kothrud, Baner, Wakad, Aundh"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pinCode">PIN Code</Label>
              <Input
                id="pinCode"
                placeholder="e.g. 411038"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                {loading ? 'Finding...' : 'Search Ranked Technicians'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ranked Technicians {results.length > 0 && `(${results.length} found)`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {area || pinCode
                ? `Technicians prioritized for locality "${[area, pinCode].filter(Boolean).join(' • ')}" ${selectedCategory ? `with certification in ${selectedCategory.name.split('(')[0].trim()}` : ''
                }`
                : `Showing all technicians certified for "${selectedCategory?.name?.split('(')[0]?.trim() || 'All Services'
                }" across Pune`}
            </p>
          </div>
          {(area || pinCode) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-slate-600 hover:text-indigo-600 h-7 px-2.5 flex items-center gap-1 border-slate-200"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Area / PIN (Show All City)
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <Clock className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-2" />
            Scanning technician network, matching service certifications, and computing locality scores...
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 space-y-2">
            <AlertTriangle className="h-7 w-7 text-amber-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-800">No technicians found matching this specific filter.</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try clicking &quot;Reset Area / PIN&quot; or selecting another service category to see all technicians registered in Pune.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs mt-2">
              Show All Available City Technicians
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {results.map((tech) => (
              <Card key={tech.id} className="border-slate-200 hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {tech.photo_url ? (
                          <img
                            src={tech.photo_url}
                            alt={tech.full_name || tech.name}
                            className="h-11 w-11 rounded-full object-cover border-2 border-indigo-200 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200">
                            {(tech.full_name || tech.name || 'T')
                              .split(' ')
                              .map((w: string) => w[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base text-slate-900 font-bold">
                            {tech.full_name || tech.name}
                          </CardTitle>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {tech.area ? `${tech.area}, ` : ''}{tech.city || 'Pune'} ({tech.pin_code || 'N/A'})
                          </p>
                        </div>
                      </div>

                      {tech.matchType === 'pincode' ? (
                        <Badge className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-300 font-medium shrink-0">
                          PIN Match ({tech.pin_code})
                        </Badge>
                      ) : tech.matchType === 'area' ? (
                        <Badge className="text-[11px] bg-blue-50 text-blue-800 border-blue-300 font-medium shrink-0">
                          Area Match
                        </Badge>
                      ) : tech.matchType === 'city' ? (
                        <Badge className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200 font-medium shrink-0">
                          Pune Base
                        </Badge>
                      ) : tech.matchType === 'all' ? (
                        <Badge className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200 font-medium shrink-0">
                          Certified Expert
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    {/* Score & Rating Bar */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <strong>{parseFloat(tech.rating || '4.8').toFixed(1)}</strong> ({tech.total_jobs || tech.totalJobs || 0} jobs)
                      </span>
                      <span className="flex items-center gap-1 font-mono text-indigo-700 font-semibold">
                        Score: {tech.score ?? 50} pts
                      </span>
                    </div>

                    {/* Coverage Localities */}
                    <div className="text-xs bg-slate-50/70 p-2 rounded border border-slate-100">
                      <div className="font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-indigo-600" />
                        Coverage Localities:
                      </div>
                      <div className="text-slate-600 text-[11px] leading-relaxed">
                        {tech.service_areas && tech.service_areas.length > 0
                          ? tech.service_areas.map((a: any) => a.area).slice(0, 5).join(', ')
                          : tech.area || 'Pune Citywide'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Availability:</span>
                      <Badge
                        variant="outline"
                        className={`capitalize font-medium text-[10px] ${tech.availability === 'available'
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : tech.availability === 'busy'
                            ? 'border-amber-300 text-amber-700 bg-amber-50'
                            : 'border-slate-300 text-slate-600 bg-slate-50'
                          }`}
                      >
                        {tech.availability || tech.availabilityStatus || 'Available'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Verification:</span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {tech.verification_status === 'verified' ? 'Background & KYC Verified' : 'Pending Verification'}
                      </div>
                    </div>

                    {tech.distance !== null && tech.distance !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">GPS Distance:</span>
                        <strong className="text-slate-800">{tech.distance} km</strong>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={`tel:${tech.mobile}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                    >
                      <Phone className="h-3 w-3" /> {tech.mobile}
                    </a>
                    {targetId && (
                      <Button
                        size="sm"
                        disabled={assigningId === tech.id}
                        onClick={() => handleAssign(tech.id)}
                        className={`text-white text-xs h-8 ${customerContext?.isReassign
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                      >
                        {assigningId === tech.id
                          ? customerContext?.isReassign
                            ? 'Reassigning...'
                            : 'Assigning...'
                          : customerContext?.isReassign
                            ? 'Reassign Technician'
                            : 'Assign to Call'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DispatchModal
        open={isDispatchOpen}
        onOpenChange={setIsDispatchOpen}
        details={dispatchData}
        title="Technician Assigned! Dispatch Job Details"
      />
    </div>
  )
}
