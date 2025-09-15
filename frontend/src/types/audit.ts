export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  table_name: string;
  record_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
  username?: string;
  user_full_name?: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  user_id?: number;
  table_name?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  message?: string;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Formatted audit actions for display
export interface AuditAction {
  value: string;
  label: string;
  color: string;
}

// Table names for filtering
export interface AuditTable {
  value: string;
  label: string;
}

export const AUDIT_ACTIONS: AuditAction[] = [
  { value: 'CREATE', label: 'Create', color: 'bg-green-100 text-green-800' },
  { value: 'UPDATE', label: 'Update', color: 'bg-blue-100 text-blue-800' },
  { value: 'DELETE', label: 'Delete', color: 'bg-red-100 text-red-800' },
  { value: 'LEAVE_APPROVE', label: 'Leave Approve', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'LEAVE_REJECT', label: 'Leave Reject', color: 'bg-orange-100 text-orange-800' },
  { value: 'LEAVE_CANCEL', label: 'Leave Cancel', color: 'bg-gray-100 text-gray-800' },
];

export const AUDIT_TABLES: AuditTable[] = [
  { value: 'employees', label: 'Employees' },
  { value: 'leave_applications', label: 'Leave Applications' },
  { value: 'payroll_items', label: 'Payroll Items' },
  { value: 'employee_documents', label: 'Employee Documents' },
  { value: 'employee_trainings', label: 'Employee Trainings' },
  { value: 'employee_compensation', label: 'Employee Compensation' },
  { value: 'users', label: 'Users' },
];