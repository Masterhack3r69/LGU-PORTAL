// Benefits-related type definitions

export interface BenefitType {
  id: number;
  code: string;
  name: string;
  category: 'ANNUAL' | 'PERFORMANCE' | 'LOYALTY' | 'TERMINAL' | 'SPECIAL';
  calculation_type: 'Formula' | 'Fixed' | 'Manual' | 'Percentage';
  calculation_formula?: string;
  percentage_rate?: number;
  fixed_amount?: number;
  default_amount?: number; // For frontend compatibility
  is_taxable?: boolean;
  is_prorated: boolean;
  minimum_service_months?: number;
  frequency?: 'Annual' | 'Biannual' | 'Event-Based';
  is_recurring?: boolean; // For frontend compatibility, not in DB
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BenefitCycle {
  id: number;
  benefit_type_id: number;
  cycle_year: number;
  cycle_name: string;
  applicable_date: string;
  payment_date?: string;
  cutoff_date?: string;
  status: 'Draft' | 'Processing' | 'Completed' | 'Released' | 'Cancelled';
  total_items?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  finalized_at?: string;
  released_at?: string;
  // Related data
  benefit_type?: BenefitType;
  // Joined fields from backend
  benefit_type_name?: string;
  benefit_type_code?: string;
  category?: string;
  created_by_username?: string;
  processed_by_username?: string;
  finalized_by_username?: string;
}

export interface BenefitItem {
  id: number;
  benefit_cycle_id: number;
  employee_id: number;
  base_salary: number;
  service_months: number;
  calculated_amount: number;
  final_amount: number;
  tax_amount: number;
  net_amount: number;
  calculation_basis?: string;
  status: 'Draft' | 'Calculated' | 'Approved' | 'Paid' | 'Cancelled';
  is_eligible: boolean;
  eligibility_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: number;
  processed_at?: string;
  paid_by?: number;
  paid_at?: string;
  payment_reference?: string;
  // Related data
  employee?: {
    id: number;
    employee_id: string;
    employee_number: string;
    full_name: string;
    employee_name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    department: string;
    position: string;
    hire_date: string;
    appointment_date: string;
    current_monthly_salary: number;
    current_daily_rate: number;
    service_years?: number;
    service_months?: number;
  };
  benefit_type?: BenefitType;
  adjustments?: BenefitAdjustment[];
}

export interface BenefitAdjustment {
  id: number;
  benefit_item_id: number;
  adjustment_type: 'Increase' | 'Decrease' | 'Override';
  amount: number;
  reason: string;
  description?: string;
  created_at: string;
  created_by: number;
  // Related data
  created_by_user?: {
    id: number;
    full_name: string;
    username: string;
  };
}

export interface BenefitCalculationRequest {
  cycle_id: number;
  employee_ids?: number[];
  recalculate?: boolean;
}

export interface BenefitCalculationResult {
  success: boolean;
  message: string;
  processed_count: number;
  errors?: Array<{
    employee_id: number;
    error: string;
  }>;
}

export interface BenefitSlipData extends BenefitItem {
  cycle: BenefitCycle;
  employee: {
    id: number;
    employee_id: string;
    employee_number: string;
    full_name: string;
    employee_name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    department: string;
    position: string;
    hire_date: string;
    appointment_date: string;
    current_monthly_salary: number;
    current_daily_rate: number;
    service_years: number;
    service_months: number;
  };
  benefit_type: BenefitType;
  adjustments: BenefitAdjustment[];
}

export interface BenefitSummary {
  cycle_id: number;
  total_employees: number;
  total_amount: number;
  average_benefit_amount: number;
  status_breakdown: {
    draft: number;
    calculated: number;
    approved: number;
    paid: number;
    cancelled: number;
  };
  category_breakdown: {
    [key: string]: {
      count: number;
      total_amount: number;
    };
  };
}

export interface BenefitFilter {
  cycle_id?: number;
  benefit_type_id?: number;
  status?: string;
  employee_id?: number;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
}

export interface BenefitStatistics {
  total_items: number;
  eligible_count: number;
  ineligible_count: number;
  total_amount: number;
  average_benefit_amount: number;
  draft_count: number;
  calculated_count: number;
  approved_count: number;
  paid_count: number;
  cancelled_count: number;
  by_category: {
    [key: string]: {
      count: number;
      total_amount: number;
    };
  };
}

export interface EligibleEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  department: string;
  position: string;
  hire_date: string;
  service_years: number;
  service_months: number;
  is_eligible: boolean;
  eligibility_reason?: string;
}

export interface BenefitPreviewRequest {
  benefit_type_id: number;
  employee_ids: number[];
  cycle_year?: number;
  applicable_date?: string;
}

export interface BenefitPreviewResult {
  employee_id: number;
  employee_name: string;
  calculated_amount: number;
  calculation_breakdown: string;
  is_eligible: boolean;
  eligibility_notes?: string;
}

export interface BulkOperationRequest {
  item_ids: number[];
  employee_ids?: number[];
  cycle_id?: number;
}

export interface BulkOperationResult {
  success: boolean;
  message: string;
  processed_count: number;
  failed_count: number;
  errors?: Array<{
    id: number;
    error: string;
  }>;
}

export interface BenefitReportFilter {
  cycle_year?: number;
  benefit_type_id?: number;
  department?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  include_adjustments?: boolean;
}

export interface BenefitResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Predefined benefit type codes for easy reference
export const BENEFIT_TYPE_CODES = {
  MID_YEAR: 'MID_YEAR',
  YEAR_END: 'YEAR_END',
  PBB: 'PBB',
  LOYALTY_10: 'LOYALTY_10',
  LOYALTY_15: 'LOYALTY_15',
  LOYALTY_20: 'LOYALTY_20',
  LOYALTY_25: 'LOYALTY_25',
  TERMINAL: 'TERMINAL',
  LEAVE_MONETIZE: 'LEAVE_MONETIZE',
  EC: 'EC',
  GSIS_CLAIM: 'GSIS_CLAIM'
} as const;

export type BenefitTypeCode = typeof BENEFIT_TYPE_CODES[keyof typeof BENEFIT_TYPE_CODES];

// Benefit categories for grouping
export const BENEFIT_CATEGORIES = {
  ANNUAL: 'Annual',
  PERFORMANCE: 'Performance',
  LOYALTY: 'Loyalty',
  TERMINAL: 'Terminal',
  SPECIAL: 'Special'
} as const;

export type BenefitCategory = typeof BENEFIT_CATEGORIES[keyof typeof BENEFIT_CATEGORIES];