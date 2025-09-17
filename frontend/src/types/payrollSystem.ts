// types/payrollSystem.ts - Types for Automated Payroll System

export interface PayrollAllowanceType {
  id: number;
  code: string;
  name: string;
  description: string;
  is_monthly: boolean;
  is_prorated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAllowance {
  id: number;
  employee_id: number;
  allowance_type_id: number;
  amount: number;
  effective_date: string;
  end_date?: string;
  is_active: boolean;
  allowance_code: string;
  allowance_name: string;
  description: string;
  is_monthly: boolean;
  is_prorated: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollAllowanceItem {
  id: number;
  payroll_item_id: number;
  allowance_type_id: number;
  amount: number;
  prorated_amount: number;
  days_applicable: number;
  allowance_code: string;
  allowance_name: string;
  employee_id: number;
  created_at: string;
}

export interface PayrollSystemItem {
  id: number;
  employee_id: number;
  payroll_period_id: number;
  basic_salary: number;
  days_worked: number;
  leave_days_deducted: number;
  working_days_in_month: number;
  salary_adjustment: number;
  total_allowances: number;
  gsis_contribution: number;
  pagibig_contribution: number;
  philhealth_contribution: number;
  tax_withheld: number;
  other_deductions: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  first_name: string;
  last_name: string;
  employee_number: string;
  current_daily_rate: number;
  current_monthly_salary: number;
  allowances?: PayrollAllowanceItem[];
  created_at: string;
}

export interface PayrollSystemDetails {
  period: PayrollPeriod;
  items: PayrollSystemItem[];
  summary: {
    employee_count: number;
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    total_allowances: number;
  };
}

export interface PayrollSystemSummary {
  period_id: number;
  employees_processed: number;
  payroll_items_created: number;
  allowance_items_created: number;
  processing_summary: {
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    processing_time_ms: number;
  };
}

export interface PayrollValidation {
  period_id: number;
  validation_results: {
    missing_allowances: Array<{
      payroll_item_id: number;
      employee_number: string;
      first_name: string;
      last_name: string;
      allowance_items_count: number;
    }>;
    calculation_errors: Array<{
      id: number;
      employee_number: string;
      basic_salary: number;
      total_allowances: number;
      gross_pay: number;
      total_deductions: number;
      net_pay: number;
      calculated_gross: number;
      calculated_net: number;
    }>;
    is_valid: boolean;
  };
}

export interface CreatePayrollPeriodForm {
  year: number;
  month: number;
  period_number: 1 | 2;
  start_date: string;
  end_date: string;
  pay_date: string;
}

export interface PayrollFilters {
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
  status?: PayrollPeriod['status'];
}

export interface UpdateEmployeeAllowancesForm {
  allowances: Array<{
    allowance_type_id: number;
    amount: number;
    effective_date: string;
  }>;
}

export interface GovernmentRates {
  sample_salary: number;
  rates: {
    gsis: {
      employee_pc: number;
      employee_mpli: number;
      total: number;
    };
    pagibig: number;
    philhealth: number;
    bir_tax: number;
  };
  total_deductions: number;
  effective_date: string;
  rate_source: string;
}

// Re-export common types from payroll
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
  employee_count?: number;
  total_net_pay?: number;
  created_at: string;
}

// API Response Types
export interface PayrollSystemApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  warnings?: string;
}

export interface PayrollSystemPaginatedResponse<T = unknown> {
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

// Service method return types
export interface PayrollSystemService {
  // Payroll Generation
  generateAutomatedPayroll: (periodId: number, employeeIds?: number[]) => Promise<PayrollSystemApiResponse<PayrollSystemSummary>>;
  generateEmployeePayroll: (periodId: number, employeeId: number) => Promise<PayrollSystemApiResponse<PayrollSystemSummary>>;
  getPayrollComputation: (periodId: number) => Promise<PayrollSystemApiResponse<PayrollSystemDetails>>;
  validatePayroll: (periodId: number) => Promise<PayrollSystemApiResponse<PayrollValidation>>;
  
  // Allowance Management
  getAllowanceTypes: () => Promise<PayrollSystemApiResponse<PayrollAllowanceType[]>>;
  getEmployeeAllowances: (employeeId: number) => Promise<PayrollSystemApiResponse<EmployeeAllowance[]>>;
  updateEmployeeAllowances: (employeeId: number, form: UpdateEmployeeAllowancesForm) => Promise<PayrollSystemApiResponse<void>>;
  
  // Period Management
  getPayrollPeriods: (filters: PayrollFilters) => Promise<PayrollSystemPaginatedResponse<PayrollPeriod>>;
  createPayrollPeriod: (form: CreatePayrollPeriodForm) => Promise<PayrollSystemApiResponse<PayrollPeriod>>;
  
  // Utilities
  getGovernmentRates: () => Promise<PayrollSystemApiResponse<GovernmentRates>>;
  formatCurrency: (amount: number) => string;
  formatPeriodName: (period: PayrollPeriod) => string;
  getStatusColor: (status: string) => string;
}

// Constants
export const PAYROLL_SYSTEM_STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
] as const;

export const ALLOWANCE_CALCULATION_METHODS = [
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'PERCENTAGE', label: 'Percentage of Salary' },
  { value: 'FORMULA', label: 'Formula-based' }
] as const;