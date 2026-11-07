import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { callsApi } from '@/api/calls'
import { customersApi } from '@/api/customers'
import { categoriesApi } from '@/api/categories'
import { getServiceMeta } from '@/utils/serviceIcons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  PhoneCall,
  UserCheck,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Phone,
  Search,
  RotateCcw,
  Clock,
  History,
  MapPin,
  Check
} from 'lucide-react'

export function NewCallPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialCatId = searchParams.get('categoryId') || searchParams.get('category') || ''
  const initialReq = searchParams.get('requirement') || ''
  const initialPhone = searchParams.get('mobile') || searchParams.get('phone') || ''

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [mobile, setMobile] = useState(initialPhone)
  const [fullName, setFullName] = useState('')
  const [alternateMobile, setAlternateMobile] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Pune')
  const [pinCode, setPinCode] = useState('')
  const [address, setAddress] = useState('')

  // Customer detection state
  const [existingCustomer, setExistingCustomer] = useState<any | null>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [customerSearched, setCustomerSearched] = useState(false)
  const debounceTimerRef = useRef<any>(null)

  const [categoryId, setCategoryId] = useState(initialCatId)
  const [requirement, setRequirement] = useState(initialReq)
  const [problemDescription, setProblemDescription] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')

  // Load and deduplicate service categories
  useEffect(() => {
    categoriesApi
      .getAll()
      .then((res: any) => {
        const data = res.data?.data || []
        const rawCats = Array.isArray(data) ? data : []

        // Deduplicate categories by normalized service key
        const deduplicated: any[] = []
        const seen = new Set<string>()
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

          if (!seen.has(key)) {
            seen.add(key)
            deduplicated.push(cat)
          }
        }

        setCategories(deduplicated)
        if (!categoryId && deduplicated.length > 0) {
          setCategoryId(String(deduplicated[0].id))
        }
      })
      .catch((err) => {
        console.error('Failed to load categories', err)
      })
  }, [])

  // Auto-search customer when initialPhone is provided in URL
  useEffect(() => {
    if (initialPhone && initialPhone.replace(/[\s\-\(\)]/g, '').length >= 10) {
      lookupCustomer(initialPhone)
    }
  }, [initialPhone])

  const lookupCustomer = async (cleanNum: string) => {
    const digits = cleanNum.replace(/[\s\-\(\)]/g, '').trim()
    if (digits.length < 10) {
      setExistingCustomer(null)
      setCustomerSearched(false)
      return
    }

    setSearchingCustomer(true)
    setError('')

    try {
      const res = await customersApi.lookupByMobile(digits)
      const cust = res.data?.data
      if (cust) {
        setExistingCustomer(cust)
        setCustomerSearched(true)

        // Autofill existing customer details
        setFullName(cust.full_name || cust.name || '')
        setAlternateMobile(cust.alternate_mobile || cust.alt_mobile || '')
        setArea(cust.area || '')
        setCity(cust.city || 'Pune')
        setPinCode(cust.pin_code || '')
        setAddress(cust.address || '')
      } else {
        setExistingCustomer(null)
        setCustomerSearched(true)
      }
    } catch (err) {
      console.error('Customer lookup error:', err)
      setExistingCustomer(null)
      setCustomerSearched(true)
    } finally {
      setSearchingCustomer(false)
    }
  }

  // Handle phone number change with instant lookup
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setMobile(val)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const clean = val.replace(/[\s\-\(\)]/g, '').trim()

    // If cleared or shorter than 10 digits
    if (clean.length < 10) {
      setExistingCustomer(null)
      setCustomerSearched(false)
      return
    }

    // Trigger lookup as soon as 10 digits are entered
    debounceTimerRef.current = setTimeout(() => {
      lookupCustomer(clean)
    }, 250)
  }

  const handleResetCustomer = () => {
    setMobile('')
    setFullName('')
    setAlternateMobile('')
    setArea('')
    setCity('Pune')
    setPinCode('')
    setAddress('')
    setExistingCustomer(null)
    setCustomerSearched(false)
  }

  const handleQuickSelect = (cat: any) => {
    setCategoryId(String(cat.id))
    const meta = getServiceMeta(cat.icon, cat.name)
    if (!requirement || requirement === '') {
      setRequirement(meta.sampleProblem)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '').trim()
      let customerId: number

      if (existingCustomer) {
        // RETURNING CUSTOMER: Update existing record if details changed & reuse ID
        customerId = existingCustomer.id

        try {
          await customersApi.update(customerId, {
            full_name: fullName.trim(),
            name: fullName.trim(),
            mobile: cleanMobile,
            alternate_mobile: alternateMobile.trim() || undefined,
            alternateMobile: alternateMobile.trim() || undefined,
            area: area.trim(),
            city: city.trim(),
            pin_code: pinCode.trim() || undefined,
            pinCode: pinCode.trim() || undefined,
            address: address.trim() || undefined
          } as any)
        } catch (updateErr) {
          console.warn('Could not update customer details, proceeding with call creation', updateErr)
        }
      } else {
        // NEW CUSTOMER: Create record in database
        try {
          const custRes = await customersApi.create({
            name: fullName.trim(),
            full_name: fullName.trim(),
            mobile: cleanMobile,
            alternate_mobile: alternateMobile.trim() || undefined,
            alternateMobile: alternateMobile.trim() || undefined,
            area: area.trim(),
            city: city.trim(),
            pin_code: pinCode.trim() || undefined,
            pinCode: pinCode.trim() || undefined,
            address: address.trim() || undefined,
          } as any)
          customerId = (custRes.data?.data as any)?.id || (custRes.data as any)?.id || custRes.data?.data
        } catch (custErr: any) {
          if (custErr.response?.data?.data?.existing_id) {
            customerId = custErr.response.data.data.existing_id
          } else {
            throw custErr
          }
        }
      }

      // 2. Register customer call
      const callRes = await callsApi.create({
        customer_id: customerId,
        customerId,
        service_category_id: categoryId ? parseInt(categoryId) : undefined,
        serviceCategoryId: categoryId ? parseInt(categoryId) : undefined,
        requirement,
        specificRequirement: requirement,
        problem_description: problemDescription || undefined,
        problemDescription: problemDescription || undefined,
        urgency: urgency as any,
        call_source: 'phone',
        callSource: 'phone',
        preferred_date: preferredDate || undefined,
        preferredDate: preferredDate || undefined,
        preferred_time: preferredTime || undefined,
        preferredTime: preferredTime || undefined,
      } as any)

      const callData = callRes.data?.data as any
      const callCode = callData?.call_id || callData?.callNumber || 'Recorded'
      const statusText = existingCustomer
        ? `Returning customer ${fullName} verified! Call logged: ${callCode}`
        : `New customer ${fullName} registered and call logged: ${callCode}`

      setSuccess(statusText)

      setTimeout(() => {
        navigate(`/technicians/find?callId=${callData?.call_db_id || ''}&category=${categoryId}&area=${encodeURIComponent(area)}&pincode=${pinCode}`)
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to register call.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/calls')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Calls
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Customer Call</h1>
        <p className="text-sm text-slate-500">
          Enter mobile number to auto-detect returning customers, record problem requirement, and dispatch nearest technician.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500 text-emerald-800 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CUSTOMER INFORMATION CARD WITH AUTO-DETECTION */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  Customer Information & Identification
                </CardTitle>
                <CardDescription>
                  Enter the phone number first: previous customers are automatically detected and pre-filled, while new customers are seamlessly registered.
                </CardDescription>
              </div>
              {existingCustomer && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium">
                  Returning Customer Found
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* Primary Phone Number with Instant Lookup */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label htmlFor="mobile" className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-600" />
                  Customer Mobile Phone Number *
                </Label>
                <span className="text-xs text-slate-500">
                  Type 10 digits to search existing customer records
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="mobile"
                    required
                    placeholder="e.g. 9822011111"
                    value={mobile}
                    onChange={handleMobileChange}
                    className="h-10 text-base font-mono bg-white border-indigo-200 focus:border-indigo-500"
                  />
                  {searchingCustomer && (
                    <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-xs text-indigo-600">
                      <Clock className="h-4 w-4 animate-spin" />
                      Checking...
                    </div>
                  )}
                </div>

                {mobile.length >= 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => lookupCustomer(mobile)}
                    className="h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Lookup
                  </Button>
                )}

                {existingCustomer && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetCustomer}
                    className="h-10 text-slate-500 hover:text-red-600 shrink-0"
                    title="Clear and enter different customer"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* RETURNING CUSTOMER FOUND BANNER */}
              {existingCustomer && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 animate-in fade-in-50">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <span>Previous Customer: {existingCustomer.full_name || existingCustomer.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-300">
                          ID #{existingCustomer.id}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                        Auto-loaded
                      </span>
                    </div>

                    <div className="text-xs text-emerald-800 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        {existingCustomer.area || 'Pune'} {existingCustomer.pin_code ? `(${existingCustomer.pin_code})` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <History className="h-3 w-3 text-emerald-600" />
                        <strong>{existingCustomer.call_count || 0}</strong> previous calls logged
                      </span>
                      {existingCustomer.last_call_date && (
                        <span>
                          Last service: {new Date(existingCustomer.last_call_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-emerald-700 pt-0.5">
                      ✓ Profile details loaded. You can proceed directly or edit any address/locality details below if they have changed.
                    </p>
                  </div>
                </div>
              )}

              {/* NEW CUSTOMER DETECTED BANNER */}
              {customerSearched && !existingCustomer && mobile.replace(/[\s\-\(\)]/g, '').length >= 10 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2.5 text-xs text-blue-900 animate-in fade-in-50">
                  <UserPlus className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold">New Customer: </span>
                    No existing account found for <span className="font-mono font-bold">{mobile}</span>. Enter full name and locality below to auto-register.
                  </div>
                </div>
              )}
            </div>

            {/* Customer Details Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="flex items-center justify-between">
                  <span>Customer Full Name *</span>
                  {existingCustomer && <span className="text-[11px] text-emerald-700 font-medium">Pre-filled</span>}
                </Label>
                <Input
                  id="fullName"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={existingCustomer ? 'border-emerald-300 bg-emerald-50/20' : ''}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alternateMobile">Alternate Mobile (Optional)</Label>
                <Input
                  id="alternateMobile"
                  placeholder="Secondary mobile"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area" className="flex items-center justify-between">
                  <span>Primary Locality / Area *</span>
                  {existingCustomer && <span className="text-[11px] text-emerald-700 font-medium">Pre-filled</span>}
                </Label>
                <Input
                  id="area"
                  required
                  placeholder="e.g. Kothrud, Baner, Wakad, Aundh"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={existingCustomer ? 'border-emerald-300 bg-emerald-50/20' : ''}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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

              <div className="space-y-1.5">
                <Label htmlFor="address">Full Street Address / Landmark</Label>
                <Input
                  id="address"
                  placeholder="Building, Flat No, Landmark..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call & Problem Details Card */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <PhoneCall className="h-5 w-5 text-indigo-600" />
              Service & Appliance Requirement
            </CardTitle>
            <CardDescription>
              Select appliance service category or click a quick-pick shortcut below.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Quick Pick Chips */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Select Appliance:
              </span>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const meta = getServiceMeta(c.icon, c.name)
                  const Icon = meta.icon
                  const isSelected = String(c.id) === String(categoryId)

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleQuickSelect(c)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label htmlFor="category">Appliance / Service Category *</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700 font-medium"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="urgency">Urgency Level</Label>
                <select
                  id="urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700 font-medium"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (Within 4 hours)</option>
                  <option value="emergency">Emergency (Immediate)</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="requirement">Specific Requirement / Appliance Brand *</Label>
                <Input
                  id="requirement"
                  required
                  placeholder="e.g. LG Split AC cooling coil leaking water, not cooling"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="problemDescription">Problem Symptoms / Technical Notes</Label>
                <Textarea
                  id="problemDescription"
                  rows={3}
                  placeholder="Describe error code on display, strange sound, gas pressure symptoms, customer schedule preference..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredDate">Preferred Service Date</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredTime">Preferred Time Slot</Label>
                <Input
                  id="preferredTime"
                  placeholder="e.g. 10:00 AM - 12:00 PM"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            {existingCustomer ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Linking call to returning customer #{existingCustomer.id}
              </span>
            ) : (
              <span className="text-slate-500">
                New customer will be automatically saved upon logging this call
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={() => navigate('/calls')} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium w-full sm:w-auto text-xs sm:text-sm"
            >
              {loading
                ? 'Submitting Call...'
                : existingCustomer
                  ? `Continue with ${existingCustomer.full_name?.split(' ')[0]} → Match Technician`
                  : 'Register Call & Match Technician →'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
