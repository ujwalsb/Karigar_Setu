import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/authStore'
import { useSettings } from '@/store/settingsStore'
import { authApi } from '@/api/auth'
import { resolveAssetUrl, getResolvedCompanyName, getBrandInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wrench, Shield, CheckCircle2 } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSetupAdmin, setIsSetupAdmin] = useState(false)
  const [adminName, setAdminName] = useState('System Admin')
  const [successMsg, setSuccessMsg] = useState('')

  const { login } = useAuth()
  const { settings } = useSettings()
  const [logoError, setLogoError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLogoError(false)
  }, [settings.company_logo_url])

  const companyName = getResolvedCompanyName(settings)
  const brandLogoUrl = !logoError ? resolveAssetUrl(settings.company_logo_url) : ''
  const brandInitials = getBrandInitials(companyName)
  const tagline = (settings.tagline || '').trim() || 'Technician Dispatch & Service Platform'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await authApi.login({ email, password })
      const resData = res.data?.data as any
      const token = (res.data as any)?.token || resData?.token
      if (token) {
        localStorage.setItem('us_token', token)
      }
      const user = resData?.user || (resData?.id ? resData : null)
      if (user) {
        login(user)
        navigate('/')
      } else {
        setError('Login failed: Unexpected server response.')
      }
    } catch (err: any) {
      if (err.message === 'Network Error' || err.message?.includes('Network')) {
        setError('Cannot connect to the backend server. Please verify your internet connection or server status.')
      } else {
        setError(err.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      await authApi.setupAdmin({
        name: adminName,
        email,
        password,
      })
      setSuccessMsg('Admin account created successfully! You can now log in.')
      setIsSetupAdmin(false)
    } catch (err: any) {
      if (err.message === 'Network Error' || err.message?.includes('Network')) {
        setError('Cannot connect to the backend server. Please verify your internet connection or server status.')
      } else {
        setError(err.message || 'Failed to setup admin account. It may already exist.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          {brandLogoUrl ? (
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-lg p-1 shrink-0">
              <img
                src={brandLogoUrl}
                alt={companyName}
                onError={() => setLogoError(true)}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg shrink-0">
              {brandInitials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{companyName}</h1>
            <p className="text-xs text-slate-500">{tagline}</p>
          </div>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">
              {isSetupAdmin ? 'Initialize Admin Account' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isSetupAdmin
                ? 'Create the primary administrator account for this system.'
                : 'Enter your credentials to access the platform.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMsg && (
              <Alert className="mb-4 border-emerald-500 text-emerald-800 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={isSetupAdmin ? handleSetupAdmin : handleLogin} className="space-y-4">
              {isSetupAdmin && (
                <div className="space-y-1.5">
                  <Label htmlFor="adminName">Admin Full Name</Label>
                  <Input
                    id="adminName"
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading
                  ? 'Processing...'
                  : isSetupAdmin
                    ? 'Create First Admin'
                    : 'Sign In to Platform'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSetupAdmin(!isSetupAdmin)
                setError('')
                setSuccessMsg('')
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              {isSetupAdmin
                ? '← Back to standard login'
                : 'First time setup? Create admin account'}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

