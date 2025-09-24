export interface CompensationBenefit {
  id: number;
  employee_id: number;
  benefit_type: BenefitType;
  days_used?: number;
  amount: number;
  notes?: string;
  processed_at: string;
  processed_by: number;
  
  // Joined fields from API
  employee_name?: string;
  employee_number?: string;
  processed_by_name?: string;
}

export type BenefitType = 
  | 'TERMINAL_LEAVE'
  | 'MONETIZATION'
  | 'PBB'
  | 'MID_YEAR_BONUS'
  | 'YEAR_END_BONUS'
  | 'EC'
  | 'GSIS'
  | 'LOYALTY';

export interface BenefitCalculation {
  employee_id: number;
  benefit_type: BenefitType;
  days_used?: number;
  amount: number;
  calculation_details?: {
    unused_leave?: number;
    highest_salary?: number;
    daily_rate?: number;
    tlb_factor?: number;
    monthly_salary?: number;
    years_of_service?: number;
    [key: string]: unknown;
  };
}

export interface EligibleEmployee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  current_monthly_salary: number;
  appointment_date: string;
  years_of_service?: number;
  unused_leave?: number;
}

export interface BulkProcessRequest {
  benefitType: BenefitType;
  employeeIds: number[];
  notes?: string;
}

export interface MonetizationRequest {
  employee_id: number;
  days_to_monetize: number;
  notes?: string;
}

export interface CompensationFilters {
  page?: number;
  limit?: number;
  employee_id?: number;
  benefit_type?: BenefitType;
  start_date?: string;
  end_date?: string;
  processed_by?: number;
}

export interface CompensationResponse {
  records: CompensationBenefit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BenefitStatistics {
  total_records: number;
  total_amount: number;
  by_benefit_type: Array<{
    benefit_type: BenefitType;
    count: number;
    total_amount: number;
  }>;
  monthly_summary: Array<{
    month: number;
    count: number;
    total_amount: number;
  }>;
  top_employees: Array<{
    employee_id: number;
    employee_name: string;
    employee_number: string;
    benefit_count: number;
    total_amount: number;
  }>;
}

export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  TERMINAL_LEAVE: 'Terminal Leave Benefit',
  MONETIZATION: 'Leave Monetization',
  PBB: 'Performance-Based Bonus',
  MID_YEAR_BONUS: '13th Month Bonus',
  YEAR_END_BONUS: '14th Month Bonus',
  EC: 'Employee Compensation',
  GSIS: 'GSIS Contribution',
  LOYALTY: 'Loyalty Award'
};

export const BENEFIT_TYPE_DESCRIPTIONS: Record<BenefitType, string> = {
  TERMINAL_LEAVE: 'Unused leave × highest salary × TLB factor',
  MONETIZATION: 'Days × (monthly salary ÷ 22 working days)',
  PBB: 'Monthly salary × 12 × PBB percentage',
  MID_YEAR_BONUS: 'One month salary (mid-year)',
  YEAR_END_BONUS: 'One month salary (year-end)',
  EC: 'Manual employee compensation input',
  GSIS: 'Monthly salary × GSIS percentage (9%)',
  LOYALTY: '₱10,000 at 10 years + ₱5,000 per 5-year increment'
};