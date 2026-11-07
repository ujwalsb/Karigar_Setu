import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoriesApi } from '@/api/categories'
import { useAuth } from '@/store/authStore'
import { getServiceMeta } from '@/utils/serviceIcons'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Plus,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  Wrench,
  Sparkles,
  Layers
} from 'lucide-react'

export function ServicesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState('home-repair')
  const [submitting, setSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const loadCategories = () => {
    setLoading(true)
    categoriesApi
      .getAll()
      .then((res: any) => {
        const data = res.data?.data || []
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error('Failed to load categories', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)
    setErrorMsg('')
    setFeedbackMsg('')

    try {
      await categoriesApi.create({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        icon: newIcon.trim() || undefined,
      })
      setFeedbackMsg(`Service category "${newName}" added successfully!`)
      setNewName('')
      setNewDesc('')
      setShowAddModal(false)
      loadCategories()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create category.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const meta = getServiceMeta(cat.icon, cat.name)
    const matchesName = cat.name.toLowerCase().includes(q)
    const matchesDesc = (cat.description || '').toLowerCase().includes(q)
    const matchesIssues = meta.commonIssues.some((issue) => issue.toLowerCase().includes(q))
    return matchesName || matchesDesc || matchesIssues
  })

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Appliance Catalog</h1>
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
              {categories.length} Available
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse all supported home appliances, maintenance categories, and technician specializations.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <Button
              onClick={() => setShowAddModal(!showAddModal)}
              variant="outline"
              className="flex-1 sm:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Custom Service
            </Button>
          )}
          <Link to="/calls/new" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm h-8 sm:h-9">
              <PhoneCall className="h-4 w-4 mr-1.5" />
              Register New Call
            </Button>
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <Alert className="border-emerald-500 text-emerald-800 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
          <AlertDescription>{feedbackMsg}</AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Add New Service Category Panel (Admin) */}
      {showAddModal && (
        <Card className="border-indigo-200 bg-indigo-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-indigo-950 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Add New Service Category
            </CardTitle>
            <CardDescription>
              Create a new appliance or maintenance category. It will instantly appear across the call registration and technician matching system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Service Category Name *</label>
                  <Input
                    required
                    placeholder="e.g. Solar Water Heater Repair"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Icon Key</label>
                  <select
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-700"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                  >
                    <option value="air-conditioner">Air Conditioner</option>
                    <option value="refrigerator">Refrigerator / Fridge</option>
                    <option value="washing-machine">Washing Machine</option>
                    <option value="home-repair">Normal Home Repair</option>
                    <option value="tv">Television / LED</option>
                    <option value="water-heater">Water Heater / Geyser</option>
                    <option value="chimney">Kitchen Chimney & Hob</option>
                    <option value="water-purifier">Water Purifier (RO)</option>
                    <option value="microwave">Microwave & OTG</option>
                    <option value="electrical">Electrical & Wiring</option>
                    <option value="plumbing">Plumbing Services</option>
                    <option value="inverter">Inverter & Battery</option>
                    <option value="dishwasher">Dishwasher</option>
                    <option value="air-cooler">Air Cooler</option>
                    <option value="mixer-grinder">Mixer Grinder, Juicer & Blender</option>
                    <option value="gas-stove">Gas Stove & Cooktop</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Description / Scope of Work</label>
                  <Input
                    placeholder="Details about appliance repair, parts covered, and common symptoms..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 text-white">
                  {submitting ? 'Saving...' : 'Save & Publish Category'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and filters bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by appliance (e.g. AC, Fridge, Normal Repair, Washing Machine, RO, Plumbing, Geyser, TV...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid of categories */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading service catalog...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-700">No matching services found</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for &quot;AC&quot;, &quot;Fridge&quot;, &quot;Repair&quot;, or &quot;Plumbing&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((category) => {
            const meta = getServiceMeta(category.icon, category.name)
            const Icon = meta.icon

            return (
              <Card
                key={category.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-white rounded-xl overflow-hidden group"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bgColor} ${meta.color} border ${meta.borderColor} shadow-xs`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[11px] font-normal text-emerald-700 border-emerald-200 bg-emerald-50">
                        Technicians Ready
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-slate-800 mt-3 group-hover:text-indigo-600 transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {category.description || 'Comprehensive inspection, routine servicing, and certified spare parts replacement.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Common Problems Solved:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.commonIssues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs border-slate-200 hover:bg-white text-slate-700"
                    onClick={() => navigate(`/technicians/find?category=${category.id}`)}
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Match Tech
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                    onClick={() =>
                      navigate(
                        `/calls/new?categoryId=${category.id}&requirement=${encodeURIComponent(
                          meta.sampleProblem
                        )}`
                      )
                    }
                  >
                    <PhoneCall className="h-3.5 w-3.5 mr-1" />
                    Book Call
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

