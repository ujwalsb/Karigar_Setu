import apiClient from './axios';
import type {
  ApiResponse,
  TechnicianPlanItem,
  TechnicianPlanSummary,
  TechnicianPlanTransaction
} from '@/types';

export interface PlanOverviewResponse {
  summary: TechnicianPlanSummary;
  technicians: TechnicianPlanItem[];
}

export interface UpdatePlanPayload {
  plan_type: 'commission' | 'monthly';
  commission_rate_type?: 'percentage' | 'fixed';
  commission_rate?: number;
  monthly_fee?: number;
  subscription_status?: 'active' | 'expired' | 'trial' | 'pending';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  extend_days?: number;
}

export interface RecordPaymentPayload {
  payment_type: 'commission_collection' | 'monthly_renewal';
  amount: number;
  payment_mode?: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  reference_note?: string;
  service_request_id?: number | null;
  renewal_days?: number;
}

export interface TechnicianLedgerResponse {
  technician: {
    id: number;
    full_name: string;
    mobile: string;
    plan_type: 'commission' | 'monthly';
    commission_rate: number;
    monthly_fee: number;
    subscription_status: string;
    subscription_start_date?: string;
    subscription_end_date?: string;
  };
  totals: {
    totalCommissionDue: number;
    totalCommissionCollected: number;
    outstandingBalance: number;
    totalMonthlyPaid: number;
  };
  transactions: TechnicianPlanTransaction[];
}

export const technicianPlansApi = {
  getAll: (params?: { plan_type?: string; status?: string; search?: string }) =>
    apiClient.get<ApiResponse<PlanOverviewResponse>>('/technician-plans', { params }),

  updatePlan: (id: number, data: UpdatePlanPayload) =>
    apiClient.put<ApiResponse<any>>(`/technician-plans/${id}`, data),

  recordPayment: (id: number, data: RecordPaymentPayload) =>
    apiClient.post<ApiResponse<{
      technician: any;
      totalDue: number;
      totalCollected: number;
      balanceRemaining: number;
    }>>(`/technician-plans/${id}/payment`, data),

  getLedger: (id: number) =>
    apiClient.get<ApiResponse<TechnicianLedgerResponse>>(`/technician-plans/${id}/ledger`),
};
