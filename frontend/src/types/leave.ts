export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  max_days_per_year?: number;
  is_monetizable: boolean;
  requires_medical_certificate: boolean;
  max_consecutive_days?: number;
  min_days_notice?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  earned_days: number;
  used_days: number;
  monetized_days: number;
  carried_forward: number;
  pending_days: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  leave_type_name?: string;
  leave_type_code?: string;
  employee_name?: string;
}

export interface LeaveApplication {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  applied_at: string;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  employee_name?: string;
  employee_number?: string;
  leave_type_name?: string;
  leave_type_code?: string;
  reviewer_name?: string;
}

export interface CreateLeaveApplicationDTO {
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  days_requested?: number; // Auto-calculated if not provided
}

export interface UpdateLeaveApplicationDTO {
  start_date?: string;
  end_date?: string;
  reason?: string;
  days_requested?: number;
}

export interface ApproveLeaveDTO {
  review_notes?: string;
}

export interface RejectLeaveDTO {
  review_notes: string;
}

export interface InitializeBalancesDTO {
  employee_id: number;
  year: number;
}

export interface CreateLeaveBalanceDTO {
  employee_id: number;
  leave_type_id: number;
  year: number;
  earned_days: number;
  carried_forward?: number;
  reason?: string;
}

export interface UpdateLeaveBalanceDTO {
  earned_days?: number;
  carried_forward?: number;
  reason?: string;
}

export interface MonetizeLeaveDTO {
  employee_id: number;
  leave_type_id: number;
  year: number;
  days_to_monetize: number;
}

export interface LeaveFilters {
  employee_id?: number;
  leave_type_id?: number;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | '';
  start_date?: string;
  end_date?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface LeaveStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  byType: Array<{
    leave_type_name: string;
    leave_type_code: string;
    count: number;
    total_days: number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
    total_days: number;
  }>;
}

export interface UsageAnalytics {
  totalApplications: number;
  totalDaysUsed: number;
  averageDaysPerApplication: number;
  mostUsedLeaveType: string;
  peakMonth: string;
  departmentUsage: Array<{
    department: string;
    applications: number;
    days_used: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    days_used: number;
  }>;
}

export interface BalanceUtilization {
  employee_id: number;
  employee_name: string;
  employee_number: string;
  department?: string;
  balances: Array<{
    leave_type_name: string;
    leave_type_code: string;
    earned_days: number;
    used_days: number;
    current_balance: number;
    utilization_percentage: number;
    status: 'high' | 'medium' | 'low';
  }>;
}

export interface LeaveApplicationsResponse {
  applications: LeaveApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationWarning {
  type: 'warning' | 'error';
  message: string;
  field?: string;
}

export interface LeaveValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: ValidationWarning[];
  calculatedDays?: number;
}

export interface DashboardStats {
  pendingApplications: number;
  approvedThisMonth: number;
  totalDaysUsed: number;
  lowBalanceEmployees: number;
  urgentApprovals: number; // Pending > 3 days
}

export interface AccrualStatus {
  is_running: boolean;
  last_run_date?: string;
  next_run_date: string;
  current_month_processed: boolean;
  processing_history: Array<{
    month: string;
    year: number;
    processed_at: string;
    employees_processed: number;
    errors: number;
  }>;
}

export interface AccrualDryRunResult {
  eligible_employees: Array<{
    employee_id: number;
    employee_name: string;
    current_vl_balance: number;
    current_sl_balance: number;
    projected_vl_balance: number;
    projected_sl_balance: number;
  }>;
  summary: {
    total_eligible: number;
    total_projected_vl: number;
    total_projected_sl: number;
  };
}

export interface CarryForwardDTO {
  employee_id: number;
  from_year: number;
  to_year: number;
}

export interface HolidayCalendar {
  id: number;
  date: string;
  name: string;
  type: 'Regular' | 'Special' | 'Local';
  is_recurring: boolean;
}

export interface WorkingDaysCalculation {
  start_date: string;
  end_date: string;
  total_calendar_days: number;
  working_days: number;
  weekends_excluded: number;
  holidays_excluded: number;
  holidays: HolidayCalendar[];
}