// types/compensationBenefits.ts - Types for Manual Compensation & Benefits System

export interface CBBenefitType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'BONUS' | 'ALLOWANCE' | 'AWARD' | 'MONETIZATION' | 'INSURANCE' | 'CLAIM';
  frequency: 'YEARLY' | 'CONDITIONAL' | 'ONE_TIME';
  calculation_method: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  base_amount: number;
  percentage_rate: number;
  formula_code?: string;
  is_taxable: boolean;
  is_active: boolean;
  eligibility_rules?: EligibilityRules;
  created_at: string;
  updated_at: string;
}

export interface EligibilityRules {
  min_service_months?: number;
  min_service_years?: number;
  min_balance?: number;
  max_monetizable?: number;
  requires_clearance?: boolean;
  requires_documentation?: boolean;
  approval_required?: boolean;
  performance_rating_required?: boolean;
  based_on_salary_received?: boolean;
  union_member_required?: boolean;
  increment_years?: number;
  base_amount?: number;
  increment_amount?: number;
  [key: string]: unknown;
}

export interface EmployeeBenefitSelection {
  id: number;
  employee_id: number;
  benefit_type_id: number;
  year: number;
  is_selected: boolean;
  calculated_amount: number;
  actual_amount: number;
  status: 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  selection_date: string;
  processed_by?: number;
  processed_date?: string;
  payment_date?: string;
  reference_number?: string;
  notes?: string;
  benefit_name: string;
  benefit_code: string;
  category: string;
  description?: string;
  processed_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailableBenefitData extends CBBenefitType {
  estimated_amount: number;
  can_select: boolean;
  ineligibility_reason?: string;
  eligibility_details: {
    service_years: number;
    service_months_in_year: number;
    [key: string]: unknown;
  };
}

export interface EmployeeBenefitInfo {
  id: number;
  name: string;
  employee_number: string;
  appointment_date: string;
  employment_status: string;
}

export interface AvailableBenefitsResponse {
  employee: EmployeeBenefitInfo;
  year: number;
  benefits_by_category: Record<string, AvailableBenefitData[]>;
  current_selections: EmployeeBenefitSelection[];
  summary: {
    total_available: number;
    total_selected: number;
    estimated_total_amount: number;
  };
}

export interface BenefitSelectionsResponse {
  employee_id: number;
  year: number;
  selections: EmployeeBenefitSelection[];
  selections_by_category: Record<string, EmployeeBenefitSelection[]>;
  summary: {
    total_selections: number;
    selected_count: number;
    total_amount: number;
    pending_count: number;
    approved_count: number;
    paid_count: number;
  };
}

export interface SelectBenefitsForm {
  employee_id: number;
  selected_benefits: number[];
  year: number;
}

export interface SelectBenefitsResponse {
  employee_id: number;
  year: number;
  selections_processed: number;
  calculations: Array<{
    benefit_type_id: number;
    calculated_amount: number;
    benefit_name: string;
  }>;
  total_estimated_amount: number;
}

export interface ProcessBenefitsForm {
  selection_ids: number[];
  processed_by: number;
}

export interface ProcessBenefitsResponse {
  processed_count: number;
  processed_selections: Array<{
    selection_id: number;
    employee_name: string;
    benefit_name: string;
    amount: number;
    reference_number: string;
  }>;
  total_amount: number;
}

export interface UpdateBenefitSelectionForm {
  actual_amount?: number;
  status?: EmployeeBenefitSelection['status'];
  notes?: string;
  payment_date?: string;
}

export interface CreateBenefitTypeForm {
  code: string;
  name: string;
  description: string;
  category: CBBenefitType['category'];
  frequency: CBBenefitType['frequency'];
  calculation_method: CBBenefitType['calculation_method'];
  base_amount?: number;
  percentage_rate?: number;
  is_taxable?: boolean;
  eligibility_rules?: EligibilityRules;
}

export interface BenefitTypesResponse {
  all_benefits: CBBenefitType[];
  benefits_by_category: Record<string, CBBenefitType[]>;
}

export interface BenefitSummaryReport {
  category: string;
  benefit_name: string;
  benefit_code: string;
  selection_count: number;
  paid_count: number;
  total_calculated: number;
  total_paid: number;
  average_amount: number;
}

export interface BenefitSummaryReportResponse {
  year: number;
  filters: {
    department?: string;
    benefit_category?: string;
  };
  summary: BenefitSummaryReport[];
  by_category: Record<string, {
    category: string;
    benefits: BenefitSummaryReport[];
    totals: {
      total_calculated: number;
      total_paid: number;
      selection_count: number;
      paid_count: number;
    };
  }>;
  grand_totals: {
    total_calculated: number;
    total_paid: number;
    total_selections: number;
    total_payments: number;
  };
}

export interface EmployeeBenefitHistoryResponse {
  employee_id: number;
  years_covered: string;
  history: Record<string, {
    year: number;
    selections: EmployeeBenefitSelection[];
    totals: {
      selected_count: number;
      total_calculated: number;
      total_paid: number;
    };
  }>;
  summary: {
    total_years: number;
    lifetime_benefits: number;
  };
}

export interface CBFilters {
  employee_id?: number;
  year?: number;
  benefit_category?: string;
  status?: EmployeeBenefitSelection['status'];
  department?: string;
  page?: number;
  limit?: number;
}

// API Response Types
export interface CBApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  warnings?: string;
}

export interface CBPaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Service interface
export interface CompensationBenefitsService {
  // Benefit Availability
  getAvailableBenefits: (employeeId: number, year: number) => Promise<CBApiResponse<AvailableBenefitsResponse>>;
  selectBenefits: (form: SelectBenefitsForm) => Promise<CBApiResponse<SelectBenefitsResponse>>;
  getBenefitSelections: (employeeId: number, year: number) => Promise<CBApiResponse<BenefitSelectionsResponse>>;
  
  // Benefit Processing
  processBenefits: (form: ProcessBenefitsForm) => Promise<CBApiResponse<ProcessBenefitsResponse>>;
  updateBenefitSelection: (selectionId: number, form: UpdateBenefitSelectionForm) => Promise<CBApiResponse<void>>;
  
  // Benefit Types Management
  getBenefitTypes: () => Promise<CBApiResponse<BenefitTypesResponse>>;
  createBenefitType: (form: CreateBenefitTypeForm) => Promise<CBApiResponse<{ id: number }>>;
  
  // Reports and Analytics
  getSummaryReport: (year: number, filters?: CBFilters) => Promise<CBApiResponse<BenefitSummaryReportResponse>>;
  getEmployeeHistory: (employeeId: number, years?: number) => Promise<CBApiResponse<EmployeeBenefitHistoryResponse>>;
  
  // Utilities
  formatCurrency: (amount: number) => string;
  getCategoryIcon: (category: string) => React.ReactNode;
  getCategoryColor: (category: string) => string;
  getStatusColor: (status: string) => string;
}

// Constants
export const CB_BENEFIT_CATEGORIES = [
  { value: 'BONUS', label: 'Bonuses', description: 'Performance bonuses, 13th month, etc.' },
  { value: 'ALLOWANCE', label: 'Allowances', description: 'CNA benefits, additional allowances' },
  { value: 'AWARD', label: 'Awards', description: 'Loyalty awards, service recognition' },
  { value: 'MONETIZATION', label: 'Monetization', description: 'Leave credit monetization' },
  { value: 'INSURANCE', label: 'Insurance', description: 'GSIS, employee compensation claims' },
  { value: 'CLAIM', label: 'Claims', description: 'Various work-related claims' }
] as const;

export const CB_BENEFIT_FREQUENCIES = [
  { value: 'YEARLY', label: 'Yearly', description: 'Given annually (e.g., 13th month pay)' },
  { value: 'CONDITIONAL', label: 'Conditional', description: 'Based on specific conditions (e.g., loyalty award)' },
  { value: 'ONE_TIME', label: 'One Time', description: 'Single occurrence (e.g., special awards)' }
] as const;

export const CB_CALCULATION_METHODS = [
  { value: 'FIXED', label: 'Fixed Amount', description: 'Predetermined fixed amount' },
  { value: 'PERCENTAGE', label: 'Percentage', description: 'Percentage of salary or other base' },
  { value: 'FORMULA', label: 'Formula', description: 'Complex calculation based on rules' }
] as const;

export const CB_SELECTION_STATUSES = [
  { value: 'PENDING', label: 'Pending', description: 'Selection submitted, awaiting calculation' },
  { value: 'CALCULATED', label: 'Calculated', description: 'Amount calculated, awaiting approval' },
  { value: 'APPROVED', label: 'Approved', description: 'Approved for payment' },
  { value: 'PAID', label: 'Paid', description: 'Payment completed' },
  { value: 'CANCELLED', label: 'Cancelled', description: 'Selection cancelled' }
] as const;

// Predefined Benefit Codes
export const PREDEFINED_BENEFITS = {
  // Bonuses
  PBB: { name: 'Performance-Based Bonus', category: 'BONUS' },
  MYB: { name: '13th Month Pay', category: 'BONUS' },
  YEB: { name: '14th Month Pay', category: 'BONUS' },
  
  // Monetization
  VLM: { name: 'Vacation Leave Monetization', category: 'MONETIZATION' },
  SLM: { name: 'Sick Leave Monetization', category: 'MONETIZATION' },
  
  // Awards
  LA: { name: 'Loyalty Award', category: 'AWARD' },
  
  // Insurance
  EC: { name: 'Employee Compensation', category: 'INSURANCE' },
  GSIS: { name: 'GSIS Benefits', category: 'INSURANCE' },
  
  // Allowances
  CNA: { name: 'CNA Benefits', category: 'ALLOWANCE' },
  RATA_ADJUST: { name: 'RATA Adjustment', category: 'ALLOWANCE' }
} as const;