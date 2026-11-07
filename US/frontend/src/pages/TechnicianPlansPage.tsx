import React, { useState, useEffect, useMemo } from 'react';
import {
  technicianPlansApi,
  type PlanOverviewResponse,
  type UpdatePlanPayload,
  type RecordPaymentPayload,
  type TechnicianLedgerResponse
} from '@/api/technicianPlans';
import type { TechnicianPlanItem, TechnicianPlanTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Receipt,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  User,
  Pencil,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  Layers,
  History,
  Check,
  ChevronRight,
  Sparkles,
  Percent,
  CalendarDays,
  FileText
} from 'lucide-react';

export function TechnicianPlansPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlanOverviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'commission' | 'monthly' | 'dues'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit Plan Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<TechnicianPlanItem | null>(null);
  const [planType, setPlanType] = useState<'commission' | 'monthly'>('commission');
  const [commissionRateType, setCommissionRateType] = useState<'percentage' | 'fixed'>('percentage');
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [monthlyFee, setMonthlyFee] = useState<number>(999);
  const [subStatus, setSubStatus] = useState<'active' | 'expired' | 'trial' | 'pending'>('active');
  const [subStartDate, setSubStartDate] = useState('');
  const [subEndDate, setSubEndDate] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Payment / Collection Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTech, setPaymentTech] = useState<TechnicianPlanItem | null>(null);
  const [paymentType, setPaymentType] = useState<'commission_collection' | 'monthly_renewal'>('commission_collection');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other'>('cash');
  const [referenceNote, setReferenceNote] = useState('');
  const [renewalDays, setRenewalDays] = useState<number>(30);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Ledger / Transaction History Modal State
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<TechnicianLedgerResponse | null>(null);

  // Load plans & overview data
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await technicianPlansApi.getAll();
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load technician plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Count technicians with pending dues or expired subscriptions
  const duesCount = useMemo(() => {
    if (!data?.technicians) return 0;
    return data.technicians.filter((t) => {
      const hasCommissionDue = t.plan_type === 'commission' && t.commission_balance > 0;
      const hasExpiredSub = t.plan_type === 'monthly' && t.is_subscription_expired;
      return hasCommissionDue || hasExpiredSub;
    }).length;
  }, [data]);

  // Filter technicians based on tab and search
  const filteredTechnicians = useMemo(() => {
    if (!data?.technicians) return [];
    return data.technicians.filter((tech) => {
      // Tab filter
      if (activeTab === 'commission' && tech.plan_type !== 'commission') return false;
      if (activeTab === 'monthly' && tech.plan_type !== 'monthly') return false;
      if (activeTab === 'dues') {
        const hasCommissionDue = tech.plan_type === 'commission' && tech.commission_balance > 0;
        const hasExpiredSub = tech.plan_type === 'monthly' && tech.is_subscription_expired;
        if (!hasCommissionDue && !hasExpiredSub) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tech.full_name?.toLowerCase().includes(q);
        const matchesMobile = tech.mobile?.includes(q);
        const matchesArea = tech.area?.toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesArea) return false;
      }

      return true;
    });
  }, [data, activeTab, searchQuery]);

  // Open Edit Plan Modal
  const handleOpenEdit = (tech: TechnicianPlanItem) => {
    setSelectedTech(tech);
    setPlanType(tech.plan_type || 'commission');
    setCommissionRateType(tech.commission_rate_type || 'percentage');
    setCommissionRate(tech.commission_rate || 10);
    setMonthlyFee(tech.monthly_fee || 999);
    setSubStatus(tech.subscription_status || 'active');
    setSubStartDate(tech.subscription_start_date || new Date().toISOString().split('T')[0]);
    // default end date 30 days ahead if missing
    if (tech.subscription_end_date) {
      setSubEndDate(tech.subscription_end_date);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setSubEndDate(d.toISOString().split('T')[0]);
    }
    setEditModalOpen(true);
  };

  // Submit Plan Updates
  const handleSavePlan = async () => {
    if (!selectedTech) return;
    try {
      setSavingPlan(true);
      setErrorMessage('');
      const payload: UpdatePlanPayload = {
        plan_type: planType,
        commission_rate_type: commissionRateType,
        commission_rate: Number(commissionRate),
        monthly_fee: Number(monthlyFee),
        subscription_status: subStatus,
        subscription_start_date: planType === 'monthly' ? subStartDate : null,
        subscription_end_date: planType === 'monthly' ? subEndDate : null
      };

      const res = await technicianPlansApi.updatePlan(selectedTech.id, payload);
      if (res.data.success) {
        setSuccessMessage(`Plan updated successfully for ${selectedTech.full_name}!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setEditModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  // Open Payment / Renewal Modal
  const handleOpenPayment = (tech: TechnicianPlanItem, type?: 'commission_collection' | 'monthly_renewal') => {
    setPaymentTech(tech);
    const resolvedType = type || (tech.plan_type === 'monthly' ? 'monthly_renewal' : 'commission_collection');
    setPaymentType(resolvedType);

    if (resolvedType === 'monthly_renewal') {
      setPaymentAmount(tech.monthly_fee || 999);
      setRenewalDays(30);
      setReferenceNote('Monthly subscription fee renewal');
    } else {
      setPaymentAmount(tech.commission_balance > 0 ? tech.commission_balance : (tech.total_commission_due || 0));
      setReferenceNote('Commission payment collected');
    }

    setPaymentMode('cash');
    setPaymentModalOpen(true);
  };

  // Submit Payment / Renewal
  const handleRecordPayment = async () => {
    if (!paymentTech) return;
    try {
      setRecordingPayment(true);
      setErrorMessage('');

      const payload: RecordPaymentPayload = {
        payment_type: paymentType,
        amount: Number(paymentAmount),
        payment_mode: paymentMode,
        reference_note: referenceNote,
        renewal_days: paymentType === 'monthly_renewal' ? renewalDays : undefined
      };

      const res = await technicianPlansApi.recordPayment(paymentTech.id, payload);
      if (res.data.success) {
        setSuccessMessage(
          paymentType === 'monthly_renewal'
            ? `Successfully renewed monthly subscription for ${paymentTech.full_name} (${renewalDays} days)!`
            : `Successfully recorded commission collection of ₹${paymentAmount} for ${paymentTech.full_name}!`
        );
        setTimeout(() => setSuccessMessage(''), 4000);
        setPaymentModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Open Ledger Modal
  const handleOpenLedger = async (tech: TechnicianPlanItem) => {
    try {
      setLedgerModalOpen(true);
      setLedgerLoading(true);
      setLedgerData(null);
      const res = await technicianPlansApi.getLedger(tech.id);
      if (res.data.success && res.data.data) {
        setLedgerData(res.data.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load technician ledger.');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Quick End Date helper for Monthly Plan modal
  const handleAddDaysToEndDate = (days: number) => {
    const base = subEndDate ? new Date(subEndDate) : new Date();
    base.setDate(base.getDate() + days);
    setSubEndDate(base.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Technician Plans & Monetization
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure two billing models: <strong className="text-slate-700">Commission per service</strong> (auto-accrued upon job completion) and <strong className="text-slate-700">Monthly Subscriptions</strong> (fixed recurring fee).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 text-xs flex items-center gap-1.5 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <Alert variant="destructive" className="py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-xs font-medium text-emerald-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Platform Overview */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
              Total Technicians
              <User className="h-4 w-4 text-slate-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {data?.summary.totalTechnicians || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Commission Plan:</span>
              <strong className="text-emerald-700 font-semibold">{data?.summary.commissionTechnicians || 0} Techs</strong>
            </div>
            <div className="flex justify-between">
              <span>Monthly Subscription:</span>
              <strong className="text-blue-700 font-semibold">{data?.summary.monthlyTechnicians || 0} Techs</strong>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Commission Accrued */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-700 uppercase flex items-center justify-between">
              Commission Accrued
              <Percent className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700 flex items-center">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {(data?.summary.totalCommissionAccrued || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Collected by Admin:</span>
              <span className="font-semibold text-slate-800">₹{(data?.summary.totalCommissionCollected || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Collection:</span>
              <span className="font-bold text-rose-600">₹{(data?.summary.totalCommissionPending || 0).toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Monthly Subscriptions */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-blue-700 uppercase flex items-center justify-between">
              Monthly Plan Revenue
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-700 flex items-center">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {(data?.summary.totalMonthlyRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Active Subscriptions:</span>
              <span className="font-semibold text-emerald-700">{data?.summary.activeMonthlySubscriptions || 0} active</span>
            </div>
            <div className="flex justify-between">
              <span>Expired / Due:</span>
              <span className="font-bold text-amber-600">{data?.summary.expiredMonthlySubscriptions || 0} expired</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Action Alert */}
        <Card className="border-slate-200 shadow-xs bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-indigo-700 uppercase flex items-center justify-between">
              Platform Collections
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-900 flex items-center">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {((data?.summary.totalCommissionCollected || 0) + (data?.summary.totalMonthlyRevenue || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600">
            <p className="text-[11px] leading-relaxed text-slate-600">
              Total platform earnings collected from technician commissions and monthly subscription renewals.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              All Technicians ({data?.technicians.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('commission')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'commission'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
            >
              <Percent className="h-3 w-3" />
              Commission Based ({data?.summary.commissionTechnicians || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
            >
              <CalendarDays className="h-3 w-3" />
              Monthly Subscriptions ({data?.summary.monthlyTechnicians || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dues')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'dues'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
                }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Pending Dues / Expired ({duesCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search technician name, mobile, area..."
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
              Loading technician plan records...
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No technicians found matching criteria.
            </div>
          ) : (
            filteredTechnicians.map((tech) => {
              const isCommission = tech.plan_type === 'commission';
              const isMonthly = tech.plan_type === 'monthly';

              return (
                <div key={tech.id} className="p-4 space-y-3 bg-white">
                  {/* Top Bar: Avatar, Name, Plan Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {tech.photo_url ? (
                        <img
                          src={tech.photo_url}
                          alt={tech.full_name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200 shrink-0">
                          {(tech.full_name || 'T').charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                          {tech.full_name}
                          <span className="text-[10px] text-slate-400 font-mono">#{tech.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <a href={`tel:${tech.mobile}`} className="text-emerald-700 font-mono font-medium hover:underline">
                            {tech.mobile}
                          </a>
                          <span>•</span>
                          <span>{tech.area || 'Pune'}</span>
                        </div>
                      </div>
                    </div>

                    {isCommission ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold shrink-0">
                        {tech.commission_rate_type === 'percentage'
                          ? `${tech.commission_rate}%`
                          : `₹${tech.commission_rate}/job`}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-semibold shrink-0">
                        ₹{tech.monthly_fee}/mo
                      </Badge>
                    )}
                  </div>

                  {/* Financial Status Summary */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Completed Jobs: <strong>{tech.completed_jobs}</strong></span>
                      <span>Billed: <strong className="text-emerald-700 font-semibold">₹{tech.total_revenue_billed.toLocaleString('en-IN')}</strong></span>
                    </div>

                    {isCommission ? (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                        <div className="text-[11px] text-slate-500">
                          Accrued: ₹{tech.total_commission_due.toLocaleString('en-IN')}
                        </div>
                        {tech.commission_balance > 0 ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold">
                            Balance Due: ₹{tech.commission_balance.toLocaleString('en-IN')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold">
                            ✓ Settled
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${tech.is_subscription_expired ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {tech.is_subscription_expired ? 'Subscription Expired' : 'Active Subscription'}
                        </span>
                        {typeof tech.days_remaining === 'number' && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {tech.days_remaining > 0 ? `${tech.days_remaining}d left` : 'Expired'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 pt-1">
                    {isCommission ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPayment(tech, 'commission_collection')}
                        className={`flex-1 text-xs h-8 ${
                          tech.commission_balance > 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <IndianRupee className="h-3 w-3 mr-1" />
                        {tech.commission_balance > 0
                          ? `Collect ₹${tech.commission_balance.toLocaleString('en-IN')}`
                          : 'Record Pay'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPayment(tech, 'monthly_renewal')}
                        className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      >
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Renew Plan
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(tech)}
                      className="text-xs h-8 px-2.5 text-slate-700 border-slate-200 flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Plan
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenLedger(tech)}
                      className="text-xs h-8 px-2.5 text-indigo-700 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 flex items-center gap-1"
                      title="View Ledger"
                    >
                      <History className="h-3 w-3" />
                      Ledger
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Technicians Table (>= md screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Assigned Plan & Rate</th>
                <th className="py-3 px-4">Jobs & Billed</th>
                <th className="py-3 px-4">Financial Status / Validity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading technician plan records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTechnicians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Layers className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-600">No technicians found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your tab or search filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTechnicians.map((tech) => {
                  const isCommission = tech.plan_type === 'commission';
                  const isMonthly = tech.plan_type === 'monthly';

                  return (
                    <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Column 1: Technician Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {tech.photo_url ? (
                            <img
                              src={tech.photo_url}
                              alt={tech.full_name}
                              className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200 shrink-0">
                              {(tech.full_name || 'T').charAt(0)}
                            </div>
                          )}

                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {tech.full_name}
                              <span className="text-[10px] text-slate-400 font-mono">#{tech.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{tech.mobile}</span>
                              <span>•</span>
                              <span>{tech.area || 'Pune'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Assigned Plan & Rate */}
                      <td className="py-3 px-4">
                        {isCommission ? (
                          <div className="space-y-1">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <Percent className="h-3 w-3 text-emerald-600" />
                              Commission Plan
                            </Badge>
                            <div className="text-[11px] text-slate-600 font-medium">
                              Rate:{' '}
                              <strong className="text-slate-900">
                                {tech.commission_rate_type === 'percentage'
                                  ? `${tech.commission_rate}% per job`
                                  : `₹${tech.commission_rate} flat per job`}
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <CalendarDays className="h-3 w-3 text-blue-600" />
                              Monthly Subscription
                            </Badge>
                            <div className="text-[11px] text-slate-600 font-medium">
                              Fee: <strong className="text-slate-900">₹{tech.monthly_fee}/month</strong>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Jobs & Billed */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-slate-700">
                            Completed: <strong className="text-slate-900">{tech.completed_jobs} jobs</strong>
                          </div>
                          <div className="text-slate-500">
                            Total Billed: <strong className="text-emerald-700 font-semibold">₹{tech.total_revenue_billed.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Financial Status / Validity */}
                      <td className="py-3 px-4">
                        {isCommission ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[11px] text-slate-500">Accrued:</span>
                              <strong className="text-slate-800 font-semibold">₹{tech.total_commission_due.toLocaleString('en-IN')}</strong>
                              <span className="text-slate-300">|</span>
                              <span className="text-[11px] text-slate-500">Collected:</span>
                              <strong className="text-emerald-700 font-semibold">₹{tech.total_commission_collected.toLocaleString('en-IN')}</strong>
                            </div>

                            {tech.completed_jobs === 0 ? (
                              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">
                                No Jobs Yet
                              </Badge>
                            ) : tech.commission_balance > 0 ? (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold">
                                Balance Due: ₹{tech.commission_balance.toLocaleString('en-IN')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold">
                                ✓ Fully Settled
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {tech.is_subscription_expired ? (
                                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
                                  Expired
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                  Active
                                </Badge>
                              )}

                              {typeof tech.days_remaining === 'number' && (
                                <span className={`text-[11px] font-medium ${tech.days_remaining <= 5 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                  {tech.days_remaining > 0
                                    ? `${tech.days_remaining} days left`
                                    : tech.days_remaining === 0
                                      ? 'Expires today'
                                      : `Expired ${Math.abs(tech.days_remaining)} days ago`}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-500">
                              {tech.subscription_end_date ? `Valid till: ${tech.subscription_end_date}` : 'No end date set'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Collect / Renew Payment Button */}
                          {isCommission ? (
                            tech.commission_balance > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenPayment(tech, 'commission_collection')}
                                className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs"
                                title="Collect outstanding commission from technician"
                              >
                                <IndianRupee className="h-3 w-3 mr-0.5" />
                                Collect Due (₹{tech.commission_balance.toLocaleString('en-IN')})
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPayment(tech, 'commission_collection')}
                                className="h-7 text-[11px] px-2 text-slate-600 border-slate-200 hover:bg-slate-100 shadow-2xs"
                                title="Record advance or manual commission payment"
                              >
                                <IndianRupee className="h-3 w-3 mr-0.5 text-slate-400" />
                                Record Pay
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPayment(tech, 'monthly_renewal')}
                              className="h-7 text-[11px] px-2.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 shadow-2xs font-semibold"
                              title="Renew monthly subscription"
                            >
                              <CalendarDays className="h-3 w-3 mr-1" />
                              Renew Plan
                            </Button>
                          )}

                          {/* Edit Plan Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(tech)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit Plan & Rates"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Ledger Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenLedger(tech)}
                            className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            title="View Transaction Ledger"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 1. EDIT PLAN MODAL                                                        */}
      {/* ========================================================================= */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Pencil className="h-4 w-4 text-indigo-600" />
              Configure Plan for {selectedTech?.full_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select between commission-based deduction per job or a fixed monthly subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Plan Choice Radios */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Choose Monetization Model</Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Commission Choice */}
                <div
                  onClick={() => setPlanType('commission')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${planType === 'commission'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-emerald-600" />
                      Commission
                    </span>
                    {planType === 'commission' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Technician pays a % or fixed commission on each completed job.
                  </p>
                </div>

                {/* Monthly Choice */}
                <div
                  onClick={() => setPlanType('monthly')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${planType === 'monthly'
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                      Monthly Plan
                    </span>
                    {planType === 'monthly' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    One-time fixed recurring payment per month (e.g. ₹999/mo).
                  </p>
                </div>
              </div>
            </div>

            {/* COMMISSION FIELDS */}
            {planType === 'commission' && (
              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Rate Calculation</Label>
                    <select
                      value={commissionRateType}
                      onChange={(e) => {
                        const newType = e.target.value as 'percentage' | 'fixed';
                        setCommissionRateType(newType);
                        if (newType === 'fixed' && commissionRate <= 25) {
                          setCommissionRate(150);
                        } else if (newType === 'percentage' && commissionRate > 50) {
                          setCommissionRate(10);
                        }
                      }}
                      className="w-full mt-1 h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
                    >
                      <option value="percentage">Percentage (%) of Total Job Bill</option>
                      <option value="fixed">Fixed Flat Fee (₹) per Completed Job</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-700">
                      {commissionRateType === 'percentage' ? 'Commission Rate (%)' : 'Flat Fee (₹)'}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        min="0"
                        step={commissionRateType === 'percentage' ? '0.5' : '10'}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                        className="h-9 text-xs bg-white pr-7"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-semibold">
                        {commissionRateType === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-900 bg-emerald-100/70 p-2.5 rounded-md border border-emerald-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-emerald-950">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Commission deduction preview:
                  </div>
                  <div>
                    • ₹1,000 service job → Platform commission: <strong>₹{commissionRateType === 'percentage' ? ((1000 * commissionRate) / 100).toFixed(0) : commissionRate}</strong>
                  </div>
                  <div>
                    • ₹2,500 service job → Platform commission: <strong>₹{commissionRateType === 'percentage' ? ((2500 * commissionRate) / 100).toFixed(0) : commissionRate}</strong>
                  </div>
                  <div className="text-[10px] text-emerald-800 pt-1 border-t border-emerald-200/70">
                    💡 Note: Saving will automatically recalculate pending uncollected commissions for completed jobs.
                  </div>
                </div>
              </div>
            )}

            {/* MONTHLY FIELDS */}
            {planType === 'monthly' && (
              <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Monthly Fee (₹)</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        min="0"
                        step="50"
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(parseFloat(e.target.value) || 0)}
                        className="h-9 text-xs bg-white pl-6"
                      />
                      <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-semibold">₹</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-700">Subscription Status</Label>
                    <select
                      value={subStatus}
                      onChange={(e) => setSubStatus(e.target.value as any)}
                      className="w-full mt-1 h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="trial">Free Trial</option>
                      <option value="pending">Pending Payment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Start Date</Label>
                    <Input
                      type="date"
                      value={subStartDate}
                      onChange={(e) => setSubStartDate(e.target.value)}
                      className="h-9 text-xs bg-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-700">End Date / Renewal Due</Label>
                    <Input
                      type="date"
                      value={subEndDate}
                      onChange={(e) => setSubEndDate(e.target.value)}
                      className="h-9 text-xs bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Quick Extend:</span>
                  <button
                    type="button"
                    onClick={() => handleAddDaysToEndDate(30)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDaysToEndDate(60)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    +60 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDaysToEndDate(90)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    +90 Days
                  </button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={savingPlan}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {savingPlan ? 'Saving...' : 'Save Plan Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. RECORD PAYMENT / RENEWAL MODAL                                         */}
      {/* ========================================================================= */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              {paymentType === 'monthly_renewal' ? 'Record Monthly Subscription Renewal' : 'Collect Commission Payment'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Technician: <strong className="text-slate-800">{paymentTech?.full_name}</strong> (#{paymentTech?.id})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Payment Type switch */}
            <div>
              <Label className="text-xs font-medium text-slate-700">Transaction Category</Label>
              <select
                value={paymentType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPaymentType(val);
                  if (val === 'monthly_renewal') {
                    setPaymentAmount(paymentTech?.monthly_fee || 999);
                  } else {
                    setPaymentAmount(paymentTech?.commission_balance || 0);
                  }
                }}
                className="w-full mt-1 h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
              >
                <option value="commission_collection">Commission Collection (Dues Settlement)</option>
                <option value="monthly_renewal">Monthly Subscription Renewal</option>
              </select>
            </div>

            {/* If Monthly Renewal: Duration selector */}
            {paymentType === 'monthly_renewal' && (
              <div>
                <Label className="text-xs font-medium text-slate-700">Renewal Validity Duration</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setRenewalDays(days);
                        const mult = days / 30;
                        setPaymentAmount((paymentTech?.monthly_fee || 999) * mult);
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-md border transition-all ${renewalDays === days
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Field */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700">Amount Received (₹)</Label>
                {paymentType === 'commission_collection' && paymentTech && paymentTech.commission_balance > 0 && (
                  <span className="text-xs text-rose-600 font-semibold">
                    Outstanding: ₹{paymentTech.commission_balance.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="relative mt-1">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs pl-7 bg-white font-semibold text-slate-900"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
              </div>
              {paymentType === 'commission_collection' && paymentTech && paymentTech.commission_balance > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(paymentTech.commission_balance)}
                    className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold transition-colors"
                  >
                    Full Balance (₹{paymentTech.commission_balance})
                  </button>
                  {paymentTech.commission_balance > 200 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Math.round(paymentTech.commission_balance / 2))}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-medium transition-colors"
                    >
                      50% (₹{Math.round(paymentTech.commission_balance / 2)})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <Label className="text-xs font-medium text-slate-700">Payment Mode</Label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full mt-1 h-9 text-xs rounded-md border border-slate-200 bg-white px-2.5 text-slate-800"
              >
                <option value="cash">Cash in Hand</option>
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other / Manual Adjustment</option>
              </select>
            </div>

            {/* Reference Note */}
            <div>
              <Label className="text-xs font-medium text-slate-700">Transaction Reference / Note</Label>
              <Input
                type="text"
                placeholder="e.g. UPI Ref #4029191049, GPay from tech, or settlement note"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="h-9 text-xs bg-white mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalOpen(false)}
              disabled={recordingPayment}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRecordPayment}
              disabled={recordingPayment || paymentAmount <= 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {recordingPayment ? 'Recording...' : `Confirm & Record ₹${paymentAmount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. TRANSACTION LEDGER MODAL                                               */}
      {/* ========================================================================= */}
      <Dialog open={ledgerModalOpen} onOpenChange={setLedgerModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-5 bg-white w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Billing Ledger: {ledgerData?.technician.full_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Full statement of job commission deductions, payments received, and monthly subscriptions.
            </DialogDescription>
          </DialogHeader>

          {ledgerLoading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Fetching ledger transactions...</span>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Totals Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Commission Due</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    ₹{(ledgerData?.totals.totalCommissionDue || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Commission Paid</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    ₹{(ledgerData?.totals.totalCommissionCollected || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Outstanding Due</div>
                  <div className="text-sm font-bold text-rose-600 mt-0.5">
                    ₹{(ledgerData?.totals.outstandingBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Monthly Sub Paid</div>
                  <div className="text-sm font-bold text-blue-700 mt-0.5">
                    ₹{(ledgerData?.totals.totalMonthlyPaid || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Reference / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerData?.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No transactions recorded yet for this technician.
                        </td>
                      </tr>
                    ) : (
                      ledgerData?.transactions.map((tx) => {
                        const isAccrual = tx.transaction_type === 'commission_due';
                        const isCollection = tx.transaction_type === 'payment_collected';
                        const isMonthly = tx.transaction_type === 'monthly_subscription';

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>

                            <td className="py-2.5 px-3">
                              {isAccrual && (
                                <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200 text-[10px]">
                                  Commission Due
                                </Badge>
                              )}
                              {isCollection && (
                                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
                                  Payment Received
                                </Badge>
                              )}
                              {isMonthly && (
                                <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px]">
                                  Monthly Subscription
                                </Badge>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-semibold">
                              <span className={isAccrual ? 'text-rose-600' : 'text-emerald-700'}>
                                {isAccrual ? '-' : '+'}₹{parseFloat(tx.amount.toString()).toLocaleString('en-IN')}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 uppercase text-[10px] text-slate-600">
                              {tx.payment_mode || 'Cash'}
                            </td>

                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              <div>{tx.reference_note || '—'}</div>
                              {tx.service_request_code && (
                                <span className="text-[10px] text-indigo-600 font-mono">
                                  Ref Job: {tx.service_request_code}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLedgerModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
