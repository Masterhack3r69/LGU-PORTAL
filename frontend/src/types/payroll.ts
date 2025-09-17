// types/payroll.ts - TypeScript definitions for payroll management
export interface PayrollPeriod {
  id: number;
  year: number;
  month: number;
  period_number: 1 | 2;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: 'Draft' | 'Processing' | 'Completed' | 'Cancelled';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  employee_count?: number;
  total_net_pay?: number;
}

export interface PayrollItem {
  id: number;
  employee_id: number;
  payroll_period_id: number;
  basic_salary: number;
  days_worked: number;
  leave_days_taken?: number;
  unpaid_leave_days?: number;
  
  // Allowances
  rata: number;
  clothing_allowance: number;
  medical_allowance: number;
  hazard_allowance: number;
  subsistence_laundry: number;
  
  // Deductions
  gsis_contribution: number;
  pagibig_contribution: number;
  philhealth_contribution: number;
  tax_withheld: number;
  other_deductions: number;
  
  // Totals
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  
  created_at: string;
  
  // Employee details (when joined)
  first_name?: string;
  last_name?: string;
  employee_number?: string;
  current_daily_rate?: number;
  current_monthly_salary?: number;
  
  // Period details (when joined with payroll_periods)
  year?: number;
  month?: number;
  period_number?: number;
  start_date?: string;
  end_date?: string;
  pay_date?: string;
  period_status?: string;
  processed_date?: string;
  processed_by_name?: string;
}

export interface PayrollPeriodDetails {
  period: PayrollPeriod;
  items: PayrollItem[];
  summary: {
    employee_count: number;
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
  };
}

export interface CompensationType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface EmployeeCompensation {
  id: number;
  employee_id: number;
  compensation_type_id: number;
  amount: number;
  year: number;
  month?: number;
  date_paid?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  
  // Joined data
  compensation_type?: CompensationType;
  employee_name?: string;
  employee_number?: string;
  first_name?: string;  // From backend join
  last_name?: string;   // From backend join
  compensation_type_name?: string;  // From backend join
  compensation_type_code?: string;  // From backend join
}

export interface GovernmentRates {
  sample_salary: number;
  rates: {
    gsis: {
      total: number;
      employee_pc?: number;
      employee_mpli?: number;
    };
    pagibig: number;
    philhealth: number;
    bir_tax: number;
  };
  total_deductions: number;
  effective_date: string;
  rate_source: string;
}

export interface ProratedSalaryCalculation {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  calculation: {
    baseDays: number;
    proratedDays: number;
    dailyRate: number;
    proratedSalary: number;
    adjustmentReason?: string;
  };
  recommendation: string;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface StepIncrementResult {
  year: number;
  month: number;
  processed_employees: number;
  total_eligible: number;
  errors: number;
  summaries: Array<{
    employee_id: number;
    old_step: number;
    new_step: number;
    salary_change: number;
  }>;
}

export interface LeaveSummary {
  period: PayrollPeriod;
  leaves: Array<{
    id: number;
    employee_id: number;
    leave_type_id: number;
    leave_type_name: string;
    leave_type_code: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    status: string;
    employee_number: string;
    first_name: string;
    last_name: string;
  }>;
  summary: {
    total_leave_days: number;
    unpaid_leave_days: number;
    actual_working_days: number;
  };
}

export interface PayrollGenerationRequest {
  period_id: number;
}

export interface PayrollGenerationResponse {
  success: boolean;
  data: {
    period_id: number;
    employees_processed: number;
    payroll_items_created: number;
    processing_summary?: {
      successful_items: number;
      failed_items: number;
      employee_errors: number;
      processing_time_ms: number;
    };
  };
  message: string;
  warnings?: string;
}

export interface PayrollFilters {
  year?: number;
  month?: number;
  status?: PayrollPeriod['status'];
  page?: number;
  limit?: number;
}

export interface PayrollHistoryFilters {
  year?: number;
  limit?: number;
}

// Form interfaces
export interface CreatePayrollPeriodForm {
  year: number;
  month: number;
  period_number: 1 | 2;
  start_date: string;
  end_date: string;
  pay_date: string;
}

export interface CreateCompensationForm {
  employee_id: number;
  compensation_type_id: number;
  amount: number;
  year: number;
  month?: number;
  date_paid?: string;
  reference_number?: string;
  notes?: string;
}

export interface CalculateProratedForm {
  employee_id: number;
  period_start_date: string;
  period_end_date: string;
}

// API Response types
export interface PayrollApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters?: PayrollFilters;
}

export interface PayrollError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
  statusCode: number;
  timestamp: string;
  requestId: string;
}

// Utility types
export type PayrollStatus = PayrollPeriod['status'];
export type PeriodNumber = PayrollPeriod['period_number'];

// Constants
export const PAYROLL_STATUS_OPTIONS: Array<{ value: PayrollStatus; label: string; color: string }> = [
  { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'Processing', label: 'Processing', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const PERIOD_NUMBER_OPTIONS = [
  { value: 1, label: 'Period 1 (1st-15th)' },
  { value: 2, label: 'Period 2 (16th-31st)' },
];

// Benefits Management Types
export interface BenefitType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  is_taxable?: boolean;
  created_at: string;
}

export interface EmployeeBenefit {
  id: number;
  employee_id: number;
  compensation_type_id: number;
  amount: number;
  year: number;
  month?: number;
  date_paid?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  
  // Joined data
  benefit_name?: string;
  benefit_code?: string;
  description?: string;
  is_taxable?: boolean;
}

export interface EmployeeBenefitsResponse {
  employee: {
    id: number;
    name: string;
    employee_number: string;
    appointment_date: string;
    service_years: number;
  };
  benefits: {
    bonuses: EmployeeBenefit[];
    allowances: EmployeeBenefit[];
    awards: EmployeeBenefit[];
    monetization: EmployeeBenefit[];
  };
  eligibility: {
    thirteenth_month: boolean;
    pbb: boolean;
    loyalty_award: boolean;
    next_loyalty_award_years?: number;
  };
  summary: {
    year: number;
    total_benefits: number;
    total_taxable: number;
    benefit_count: number;
  };
}

export interface BenefitCalculationRequest {
  employee_id: number;
  benefit_type: 'thirteenth_month' | 'fourteenth_month' | 'pbb' | 'loyalty_award' | 'leave_monetization';
  year: number;
}

export interface BenefitCalculationResponse {
  employee_id: number;
  benefit_type: string;
  year: number;
  calculated_amount: number;
  eligibility: {
    eligible: boolean;
    reason?: string;
  };
  calculation_date: string;
}

export interface LoyaltyAwardRequest {
  employee_id: number;
  year: number;
}

export interface LeaveMonetizationRequest {
  employee_id: number;
  leave_type_id: number;
  year: number;
  days_to_monetize: number;
}

export interface LeaveMonetizationResponse {
  success: boolean;
  data: {
    employee_id: number;
    leave_type_id: number;
    year: number;
    monetized_days: number;
    monetization_amount: number;
    daily_rate: number;
    remaining_balance: number;
  };
  message: string;
}

export interface BenefitsSummaryResponse {
  year: number;
  summary: Array<{
    benefit_code: string;
    benefit_name: string;
    total_amount: number;
    recipient_count: number;
  }>;
  details: Array<{
    employee_id: number;
    employee_number: string;
    employee_name: string;
    benefit_code: string;
    benefit_name: string;
    amount: number;
    date_paid?: string;
  }>;
  totals: {
    total_benefits_amount: number;
    total_recipients: number;
    benefit_types: number;
  };
}

export interface CreateBenefitForm {
  employee_id: number;
  compensation_type_id: number;
  amount: number;
  year: number;
  month?: number;
  date_paid?: string;
  reference_number?: string;
  notes?: string;
}

export interface BenefitsFilters {
  year?: number;
  employee_id?: number;
  benefit_type?: string;
  page?: number;
  limit?: number;
}

// ===================================================================
// MANUAL PAYROLL PROCESSING TYPES
// ===================================================================

export interface EmployeePayrollAllowance {
  id: number;
  allowance_type_id: number;
  amount: number;
  effective_date: string;
  end_date?: string;
  is_active: boolean;
  allowance_code: string;
  allowance_name: string;
  description?: string;
  is_monthly: boolean;
  is_prorated: boolean;
}

export interface PayrollAllowanceType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_monthly: boolean;
  is_prorated: boolean;
  is_active: boolean;
}

export interface StandardDeductions {
  gsis: number;
  pagibig: number;
  philhealth: number;
  tax: number;
  other: number;
  total: number;
}

export interface ManualPayrollEmployee {
  id: number;
  employee_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  current_monthly_salary: number;
  current_daily_rate: number;
  appointment_date: string;
  salary_grade?: number;
  step_increment?: number;
  plantilla_position?: string;
  employment_status: string;
}

export interface ManualPayrollDetails {
  employee: ManualPayrollEmployee;
  current_allowances: EmployeePayrollAllowance[];
  standard_deductions: StandardDeductions;
  payroll_history: PayrollItem[];
  available_allowance_types: PayrollAllowanceType[];
  calculation_defaults: {
    working_days_per_month: number;
    overtime_rate_multiplier: number;
    holiday_rate_multiplier: number;
  };
}

export interface AdditionalAllowance {
  name: string;
  amount: number;
  description?: string;
}

export interface AdditionalDeduction {
  name: string;
  amount: number;
  description?: string;
}

export interface ManualPayrollCalculationRequest {
  employee_id: number;
  period_id?: number;
  days_worked?: number;
  overtime_hours?: number;
  holiday_hours?: number;
  additional_allowances?: AdditionalAllowance[];
  additional_deductions?: AdditionalDeduction[];
  notes?: string;
}

export interface AllowanceBreakdown {
  name: string;
  base_amount: number;
  prorated_amount: number;
  is_prorated: boolean;
}

export interface ManualPayrollCalculation {
  employee_id: number;
  calculation_date: string;
  calculation: {
    basic_salary: number;
    overtime_pay: number;
    holiday_pay: number;
    total_allowances: number;
    gross_pay: number;
    total_deductions: number;
    net_pay: number;
    days_worked: number;
    overtime_hours: number;
    holiday_hours: number;
  };
  breakdown: {
    allowances: AllowanceBreakdown[];
    additional_allowances: AdditionalAllowance[];
    standard_deductions: StandardDeductions;
    additional_deductions: AdditionalDeduction[];
  };
  notes?: string;
}

export interface ProcessManualPayrollRequest {
  employee_id: number;
  period_id: number;
  calculation_data: ManualPayrollCalculation['calculation'] & {
    standard_deductions?: StandardDeductions;
    additional_deductions_total?: number;
  };
  notes?: string;
  override_existing?: boolean;
}

export interface ProcessManualPayrollResponse {
  item_id: number;
  action: 'created' | 'updated';
  employee_id: number;
  period_id: number;
  calculation_data: Record<string, unknown>;
}