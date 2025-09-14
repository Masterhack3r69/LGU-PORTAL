// types/tlb.ts - TypeScript definitions for Terminal Leave Benefits system

export interface TLBRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_number?: string;
  plantilla_position?: string;
  appointment_date?: string;
  total_leave_credits: number;
  highest_monthly_salary: number;
  constant_factor: number;
  computed_amount: number;
  claim_date: string;
  separation_date: string;
  status: TLBStatus;
  check_number?: string;
  payment_date?: string;
  notes?: string;
  processed_by_name?: string;
  processed_at?: string;
  created_at: string;
}

export type TLBStatus = 'Computed' | 'Approved' | 'Paid' | 'Cancelled';

export interface TLBCalculation {
  employee: {
    id: number;
    name: string;
    employee_number: string;
    appointment_date: string;
    plantilla_position: string;
    years_of_service: number;
  };
  calculation: {
    total_leave_credits: number;
    highest_monthly_salary: number;
    constant_factor: number;
    computed_amount: number;
    formatted_amount: string;
  };
  dates: {
    claim_date: string;
    separation_date: string;
  };
}

export interface TLBStatistics {
  summary: {
    total_records: number;
    total_computed_amount: number;
    total_paid_amount: number;
    average_amount: number;
    highest_amount: number;
    lowest_amount: number;
  };
  status_breakdown: {
    computed: number;
    approved: number;
    paid: number;
    cancelled: number;
  };
}

export interface TLBSummaryReport {
  summary: Array<{
    status: TLBStatus;
    record_count: number;
    total_amount: number;
    average_amount: number;
    min_amount: number;
    max_amount: number;
  }>;
  details: Array<{
    id: number;
    employee_name: string;
    employee_number: string;
    computed_amount: number;
    status: TLBStatus;
    claim_date: string;
  }>;
  totals: {
    total_records: number;
    total_amount: number;
    formatted_total_amount: string;
  };
  filters: {
    year?: number;
    status?: TLBStatus;
  };
}

export interface TLBFilters {
  page?: number;
  limit?: number;
  status?: TLBStatus;
  employee_id?: number;
  year?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface CreateTLBRecordForm {
  employee_id: number;
  total_leave_credits: number;
  highest_monthly_salary: number;
  constant_factor?: number;
  claim_date: string;
  separation_date: string;
  notes?: string;
}

export interface UpdateTLBRecordForm {
  status?: TLBStatus;
  check_number?: string;
  payment_date?: string;
  notes?: string;
}

export interface TLBCalculationRequest {
  employeeId: number;
  separationDate: string;
  claimDate: string;
}

export interface TLBApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface TLBError {
  success: false;
  error: string;
  timestamp: string;
}

// Constants
export const TLB_STATUS_OPTIONS: Array<{ value: TLBStatus; label: string; color: string }> = [
  { value: 'Computed', label: 'Computed', color: 'bg-blue-100 text-blue-800' },
  { value: 'Approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'Paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export const TLB_SORT_OPTIONS = [
  { value: 'claim_date', label: 'Claim Date' },
  { value: 'employee_name', label: 'Employee Name' },
  { value: 'computed_amount', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'created_at', label: 'Created Date' },
];