// Core Entity Types

export type UserRole = 'admin' | 'support';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  totalCalls?: number;
  lastCallDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type CallStatus =
  | 'new_call'
  | 'requirement_recorded'
  | 'finding_technician'
  | 'technician_assigned'
  | 'technician_contacted'
  | 'visit_scheduled'
  | 'work_in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_technician_available';

export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';
export type CallSource = 'phone' | 'walk_in' | 'online' | 'referral' | 'other';

export interface CustomerCall {
  id: number;
  callNumber: string;
  customerId: number;
  customer?: Customer;
  serviceCategoryId: number;
  serviceCategory?: ServiceCategory;
  specificRequirement: string;
  problemDescription?: string;
  urgency: UrgencyLevel;
  callSource: CallSource;
  preferredDate?: string;
  preferredTime?: string;
  internalNotes?: string;
  status: CallStatus;
  assignedToId?: number;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
  serviceRequests?: ServiceRequest[];
  callNotes?: CallNote[];
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type AvailabilityStatus = 'available' | 'busy' | 'offline';

export interface TechnicianSkill {
  id: number;
  technicianId: number;
  serviceCategoryId: number;
  serviceCategory?: ServiceCategory;
  yearsExperience: number;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
}

export interface TechnicianArea {
  id: number;
  technicianId: number;
  area: string;
  city: string;
  pinCode?: string;
}

export interface TechnicianDocument {
  id: number;
  technicianId?: number;
  technician_id?: number;
  documentType?: string;
  doc_type?: string;
  document_type?: string;
  fileName?: string;
  file_name?: string;
  documentNumber?: string;
  document_number?: string;
  filePath?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  is_verified?: boolean;
  isVerified?: boolean;
  consent_given?: boolean;
  uploadedAt?: string;
  uploaded_at?: string;
  verifiedAt?: string;
  verified_at?: string;
  verifiedById?: number;
  verified_by_name?: string;
}

export interface Technician {
  id: number;
  name: string;
  full_name?: string;
  mobile: string;
  alternateMobile?: string;
  alternate_mobile?: string;
  alt_mobile?: string;
  email?: string;
  photo_url?: string | null;
  profilePhoto?: string;
  designation?: string | null;
  badge_code?: string | null;
  id_card_valid_until?: string | null;
  blood_group?: string | null;
  id_card_theme?: string | null;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  pin_code?: string;
  latitude?: number;
  longitude?: number;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  yearsExperience: number;
  experience_years?: number;
  rating: number;
  totalJobs: number;
  total_jobs?: number;
  verificationStatus: VerificationStatus;
  verification_status?: VerificationStatus;
  availabilityStatus: AvailabilityStatus;
  availability?: AvailabilityStatus;
  isActive: boolean;
  status?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string[];
  consentGiven: boolean;
  consent_given?: boolean;
  consentDate?: string;
  // Plan & Monetization
  plan_type?: 'commission' | 'monthly';
  commission_rate_type?: 'percentage' | 'fixed';
  commission_rate?: number;
  monthly_fee?: number;
  subscription_status?: 'active' | 'expired' | 'trial' | 'pending';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  skills?: TechnicianSkill[];
  serviceAreas?: TechnicianArea[];
  service_areas?: TechnicianArea[];
  documents?: TechnicianDocument[];
  distance?: number;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export type RequestStatus =
  | 'pending'
  | 'technician_assigned'
  | 'technician_contacted'
  | 'visit_scheduled'
  | 'work_in_progress'
  | 'completed'
  | 'cancelled';

export interface TechnicianAssignment {
  id: number;
  serviceRequestId: number;
  technicianId: number;
  technician?: Technician;
  assignedById: number;
  assignedBy?: User;
  assignedAt: string;
  contactedAt?: string;
  acceptedAt?: string;
  scheduledVisitDate?: string;
  scheduledVisitTime?: string;
  completedAt?: string;
  cancellationReason?: string;
  notes?: string;
}

export interface ServiceRequest {
  id: number;
  requestNumber: string;
  callId: number;
  call?: CustomerCall;
  customerId: number;
  customer?: Customer;
  serviceCategoryId: number;
  serviceCategory?: ServiceCategory;
  status: RequestStatus;
  technicianId?: number;
  technician?: Technician;
  assignment?: TechnicianAssignment;
  estimatedCost?: number;
  actualCost?: number;
  workDescription?: string;
  customerFeedback?: string;
  customerRating?: number;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: ServiceStatusHistory[];
}

export interface ServiceStatusHistory {
  id: number;
  serviceRequestId: number;
  status: RequestStatus;
  changedById: number;
  changedBy?: User;
  notes?: string;
  changedAt: string;
}

export interface CallNote {
  id: number;
  callId: number;
  note: string;
  addedById: number;
  addedBy?: User;
  createdAt: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  entityType: string;
  entityId?: number;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  | 'new_assignment'
  | 'status_update'
  | 'urgent_call'
  | 'system'
  | 'reminder';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  entityType?: string;
  entityId?: number;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Dashboard & Analytics Types
export interface DashboardStats {
  totalCallsToday: number;
  totalCustomers: number;
  totalTechnicians: number;
  activeTechnicians: number;
  verifiedTechnicians: number;
  pendingVerification: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  cancelledRequests: number;
  myCallsToday?: number;
  myTotalCalls?: number;
  myAssignments?: number;
}

export interface AnalyticsData {
  callsOverTime: { date: string; count: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  employeePerformance: { name: string; calls: number; completed: number }[];
  areaWiseDemand: { area: string; count: number }[];
  monthlyTrends: { month: string; calls: number; completed: number; revenue: number }[];
}

// Form Types
export interface CustomerFormData {
  name: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  landmark?: string;
}

export interface TechnicianFormData {
  name: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  yearsExperience: number;
  aadhaarNumber?: string;
  panNumber?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string[];
  skills: { serviceCategoryId: number; yearsExperience: number; proficiencyLevel: string }[];
  serviceAreas: { area: string; city: string; pinCode?: string }[];
  consentGiven: boolean;
}

export interface NewCallFormData {
  // Step 1
  customerId?: number;
  customerData?: CustomerFormData;
  // Step 2
  serviceCategoryId: number;
  specificRequirement: string;
  problemDescription?: string;
  urgency: UrgencyLevel;
  callSource: CallSource;
  preferredDate?: string;
  preferredTime?: string;
  internalNotes?: string;
  // Step 3
  technicianId?: number;
}

export interface FindTechnicianParams {
  serviceCategoryId?: number;
  area?: string;
  city?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  availabilityStatus?: string;
  verifiedOnly?: boolean;
  sortBy?: 'distance' | 'experience' | 'rating';
}

export type TechnicianPlanType = 'commission' | 'monthly';
export type CommissionRateType = 'percentage' | 'fixed';
export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'pending';
export type PlanTransactionType = 'commission_due' | 'monthly_subscription' | 'payment_collected' | 'settlement';
export type PlanPaymentStatus = 'paid' | 'pending' | 'waived';

export interface TechnicianPlanItem {
  id: number;
  full_name: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  area: string;
  city?: string;
  photo_url?: string;
  rating: number;
  total_jobs: number;
  status: string;
  availability: string;
  plan_type: TechnicianPlanType;
  commission_rate_type: CommissionRateType;
  commission_rate: number;
  monthly_fee: number;
  subscription_status: SubscriptionStatus;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  days_remaining?: number | null;
  completed_jobs: number;
  total_revenue_billed: number;
  total_commission_due: number;
  total_commission_collected: number;
  commission_balance: number;
  total_monthly_paid: number;
  last_transaction_date?: string | null;
  pending_tx_count?: number;
  is_subscription_expired?: boolean;
}

export interface TechnicianPlanSummary {
  totalTechnicians: number;
  commissionTechnicians: number;
  monthlyTechnicians: number;
  activeMonthlySubscriptions: number;
  expiredMonthlySubscriptions: number;
  totalCommissionAccrued: number;
  totalCommissionCollected: number;
  totalCommissionPending: number;
  totalMonthlyRevenue: number;
}

export interface TechnicianPlanTransaction {
  id: number;
  technician_id: number;
  plan_type: TechnicianPlanType;
  service_request_id?: number | null;
  transaction_type: PlanTransactionType;
  amount: number;
  payment_status: PlanPaymentStatus;
  payment_mode?: string;
  reference_note?: string;
  created_at: string;
  service_request_code?: string;
  service_final_amount?: number;
  customer_id?: number;
  customer_name?: string;
  recorded_by_name?: string;
}


