// Payroll-related type definitions

export interface PayrollPeriod {
  id: number;
  year: number;
  month: number;
  period_number: number;
  start_date: string;
  end_date: string;
  status: 'open' | 'calculating' | 'finalized' | 'locked';
  created_at: string;
  updated_at: string;
  finalized_at?: string;
  finalized_by?: number;
  total_basic_pay?: number;
  total_allowances?: number;
  total_deductions?: number;
  total_net_pay?: number;
}

export interface AllowanceType {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_amount?: number;
  calculation_type: 'Fixed' | 'Percentage' | 'Formula';
  percentage_base?: 'BasicPay' | 'MonthlySalary' | 'GrossPay';
  is_taxable: boolean;
  frequency: 'Monthly' | 'Annual' | 'Conditional';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeductionType {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_amount?: number;
  calculation_type: 'Fixed' | 'Percentage' | 'Formula';
  percentage_base?: 'BasicPay' | 'MonthlySalary' | 'GrossPay';
  is_mandatory: boolean;
  frequency: 'Monthly' | 'Annual' | 'Conditional';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollItem {
  id: number;
  period_id: number;
  employee_id: number;
  basic_pay: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  total_allowances: number;
  total_deductions: number;
  gross_pay: number;
  total_taxes: number;
  net_pay: number;
  created_at: string;
  updated_at: string;
  calculated_at?: string;
  approved_at?: string;
  approved_by?: number;
  paid_at?: string;
  // Related data
  employee?: {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    position: string;
  };
  allowances?: PayrollAllowance[];
  deductions?: PayrollDeduction[];
}

export interface PayrollAllowance {
  id: number;
  payroll_item_id: number;
  allowance_type_id: number;
  amount: number;
  is_override: boolean;
  basis?: string;
  created_at: string;
  allowance_type?: AllowanceType;
}

export interface PayrollDeduction {
  id: number;
  payroll_item_id: number;
  deduction_type_id: number;
  amount: number;
  is_override: boolean;
  basis?: string;
  created_at: string;
  deduction_type?: DeductionType;
}

export interface EmployeeOverride {
  id: number;
  employee_id: number;
  type: 'allowance' | 'deduction';
  type_id: number;
  amount: number;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  // Related data
  employee?: {
    id: number;
    employee_id: string;
    full_name: string;
  };
  allowance_type?: AllowanceType;
  deduction_type?: DeductionType;
}

export interface PayrollCalculationRequest {
  period_id: number;
  employee_ids?: number[];
  recalculate?: boolean;
}

export interface PayrollCalculationResult {
  success: boolean;
  message: string;
  processed_count: number;
  errors?: Array<{
    employee_id: number;
    error: string;
  }>;
}

export interface PayslipData extends PayrollItem {
  period: PayrollPeriod;
  employee: {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    position: string;
    hire_date: string;
  };
  allowances: PayrollAllowance[];
  deductions: PayrollDeduction[];
}

export interface PayrollSummary {
  period_id: number;
  total_employees: number;
  total_basic_pay: number;
  total_allowances: number;
  total_deductions: number;
  total_gross_pay: number;
  total_taxes: number;
  total_net_pay: number;
  status_breakdown: {
    draft: number;
    calculated: number;
    approved: number;
    paid: number;
  };
}

export interface PayrollFilter {
  period_id?: number;
  status?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PayrollResponse<T> {
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