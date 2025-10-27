import type {
  LeaveType,
  LeaveBalance,
  LeaveApplication,
  CreateLeaveApplicationDTO,
  UpdateLeaveApplicationDTO,
  ApproveLeaveDTO,
  RejectLeaveDTO,
  InitializeBalancesDTO,
  CreateLeaveBalanceDTO,
  UpdateLeaveBalanceDTO,
  MonetizeLeaveDTO,
  LeaveFilters,
  LeaveStatistics,
  UsageAnalytics,
  BalanceUtilization,
  LeaveApplicationsResponse,
  LeaveValidationResult,
  DashboardStats,
  AccrualStatus,
  AccrualDryRunResult,
  CarryForwardDTO,
  WorkingDaysCalculation
} from '../types/leave';
import apiService from './api';

class LeaveService {
  // Leave Types
  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await apiService.get<{ success: boolean; data: LeaveType[] }>('/leaves/types');
    return response.data;
  }

  async createLeaveType(leaveType: Omit<LeaveType, 'id' | 'created_at' | 'updated_at'>): Promise<LeaveType> {
    const response = await apiService.post<{ success: boolean; data: LeaveType }>('/leaves/types', leaveType);
    return response.data;
  }

  async updateLeaveType(id: number, leaveType: Partial<LeaveType>): Promise<LeaveType> {
    const response = await apiService.put<{ success: boolean; data: LeaveType }>(`/leaves/types/${id}`, leaveType);
    return response.data;
  }

  // Leave Applications
  async getLeaveApplications(filters: Partial<LeaveFilters> = {}): Promise<LeaveApplicationsResponse> {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.employee_id && { employee_id: filters.employee_id }),
      ...(filters.leave_type_id && { leave_type_id: filters.leave_type_id }),
      ...(filters.status && { status: filters.status }),
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
      ...(filters.search && { search: filters.search }),
    };

    const response = await apiService.get<{
      success: boolean;
      data: LeaveApplication[];
      pagination: {
        currentPage: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    }>('/leaves', params);

    return {
      applications: response.data,
      total: response.pagination.totalRecords,
      page: response.pagination.currentPage,
      limit: response.pagination.pageSize,
      totalPages: response.pagination.totalPages,
    };
  }

  async getLeaveApplication(id: number): Promise<LeaveApplication> {
    const response = await apiService.get<{ success: boolean; data: LeaveApplication }>(`/leaves/${id}`);
    return response.data;
  }

  async createLeaveApplication(application: CreateLeaveApplicationDTO): Promise<LeaveApplication> {
    const response = await apiService.post<{ success: boolean; data: LeaveApplication }>('/leaves', application);
    return response.data;
  }

  async updateLeaveApplication(id: number, application: UpdateLeaveApplicationDTO): Promise<LeaveApplication> {
    const response = await apiService.put<{ success: boolean; data: LeaveApplication }>(`/leaves/${id}`, application);
    return response.data;
  }

  async approveLeaveApplication(id: number, data: ApproveLeaveDTO): Promise<LeaveApplication> {
    const response = await apiService.put<{ success: boolean; data: LeaveApplication }>(`/leaves/${id}/approve`, data);
    return response.data;
  }

  async rejectLeaveApplication(id: number, data: RejectLeaveDTO): Promise<LeaveApplication> {
    const response = await apiService.put<{ success: boolean; data: LeaveApplication }>(`/leaves/${id}/reject`, data);
    return response.data;
  }

  async cancelLeaveApplication(id: number): Promise<LeaveApplication> {
    const response = await apiService.put<{ success: boolean; data: LeaveApplication }>(`/leaves/${id}/cancel`);
    return response.data;
  }

  async deleteLeaveApplication(id: number): Promise<void> {
    await apiService.delete(`/leaves/${id}`);
  }

  // Leave Balances
  async getLeaveBalances(employeeId: number, year?: number): Promise<LeaveBalance[]> {
    const params = year ? { year } : {};
    const response = await apiService.get<{ success: boolean; data: LeaveBalance[] }>(
      `/leaves/balances/${employeeId}`,
      params
    );
    return response.data;
  }

  async getAllEmployeeBalances(year?: number): Promise<BalanceUtilization[]> {
    const params = year ? { year } : {};
    const response = await apiService.get<{ success: boolean; data: BalanceUtilization[] }>(
      '/leaves/reports/balance-utilization',
      params
    );
    return response.data;
  }

  async initializeBalances(data: InitializeBalancesDTO): Promise<void> {
    await apiService.post('/leaves/initialize-balances', data);
  }

  async createLeaveBalance(data: CreateLeaveBalanceDTO): Promise<LeaveBalance> {
    const response = await apiService.post<{ success: boolean; data: LeaveBalance }>('/leaves/balances/create', data);
    return response.data;
  }

  async updateLeaveBalance(id: number, data: UpdateLeaveBalanceDTO): Promise<LeaveBalance> {
    const response = await apiService.put<{ success: boolean; data: LeaveBalance }>(`/leaves/balances/${id}`, data);
    return response.data;
  }

  async deleteLeaveBalance(id: number): Promise<void> {
    await apiService.delete(`/leaves/balances/${id}`);
  }

  async monetizeLeave(data: MonetizeLeaveDTO): Promise<void> {
    await apiService.post('/leaves/monetize', data);
  }

  async carryForwardLeave(data: CarryForwardDTO): Promise<void> {
    await apiService.post('/leaves/carry-forward', data);
  }

  // Validation
  async validateLeaveApplication(application: CreateLeaveApplicationDTO): Promise<LeaveValidationResult> {
    const response = await apiService.post<{ success: boolean; data: LeaveValidationResult }>(
      '/leaves/validate',
      application
    );
    return response.data;
  }

  async calculateWorkingDays(startDate: string, endDate: string): Promise<WorkingDaysCalculation> {
    const response = await apiService.post<{ success: boolean; data: WorkingDaysCalculation }>(
      '/leaves/calculate-working-days',
      { start_date: startDate, end_date: endDate }
    );
    return response.data;
  }

  // Reports and Analytics
  async getLeaveStatistics(year?: number, employeeId?: number): Promise<LeaveStatistics> {
    const params = {
      ...(year && { year }),
      ...(employeeId && { employee_id: employeeId }),
    };
    const response = await apiService.get<{ success: boolean; data: LeaveStatistics }>(
      '/leaves/statistics',
      params
    );
    return response.data;
  }

  async getUsageAnalytics(year?: number): Promise<UsageAnalytics> {
    const params = year ? { year } : {};
    const response = await apiService.get<{ success: boolean; data: UsageAnalytics }>(
      '/leaves/reports/usage-analytics',
      params
    );
    return response.data;
  }

  async getBalanceUtilization(year?: number): Promise<BalanceUtilization[]> {
    const params = year ? { year } : {};
    const response = await apiService.get<{ success: boolean; data: BalanceUtilization[] }>(
      '/leaves/reports/balance-utilization',
      params
    );
    return response.data;
  }

  async getLeaveSummaryReport(filters: {
    year?: number;
    department?: string;
    employee_id?: number;
  } = {}): Promise<unknown[]> {
    const response = await apiService.get<{ success: boolean; data: unknown[] }>(
      '/leaves/reports/summary',
      filters
    );
    return response.data;
  }

  async getDashboardStats(employeeId?: number): Promise<DashboardStats> {
    const params = employeeId ? { employee_id: employeeId } : {};
    const response = await apiService.get<{ success: boolean; data: DashboardStats }>(
      '/leaves/dashboard-stats',
      params
    );
    return response.data;
  }

  // Monthly Accrual
  async getAccrualStatus(year?: number, month?: number): Promise<AccrualStatus> {
    const params = {
      ...(year && { year }),
      ...(month && { month }),
    };
    const response = await apiService.get<{ success: boolean; data: AccrualStatus }>(
      '/jobs/monthly-accrual/status',
      params
    );
    return response.data;
  }

  async runAccrualDryRun(data: {
    year: number;
    month: number;
    employee_ids?: number[];
  }): Promise<AccrualDryRunResult> {
    const response = await apiService.post<{ success: boolean; data: AccrualDryRunResult }>(
      '/jobs/monthly-accrual/dry-run',
      data
    );
    return response.data;
  }

  async processMonthlyAccrual(data: {
    year: number;
    month: number;
    employee_ids?: number[];
  }): Promise<void> {
    await apiService.post('/jobs/monthly-accrual/process', data);
  }

  // Admin Create (Auto-approved)
  async adminCreateLeave(application: CreateLeaveApplicationDTO & { auto_approve?: boolean }): Promise<LeaveApplication> {
    const response = await apiService.post<{ success: boolean; data: LeaveApplication }>(
      '/leaves/admin-create',
      application
    );
    return response.data;
  }
}

export const leaveService = new LeaveService();
export default leaveService;