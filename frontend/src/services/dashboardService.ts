import apiService from './api';

export interface EmployeeDashboardStats {
  totalLeaveBalance: number;
  pendingApplications: number;
  completedTrainings: number;
  totalTrainings: number;
  profileCompletion: number;
  recentActivities: Array<{
    id: string;
    type: 'leave' | 'training' | 'payroll' | 'profile';
    title: string;
    description: string;
    timestamp: string;
    status?: 'approved' | 'pending' | 'completed';
  }>;
}

export interface AdminDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveApplications: number;
  pendingDocuments: number;
  monthlyPayrollStatus: 'pending' | 'processing' | 'completed';
  systemHealth: 'good' | 'warning' | 'critical';
  recentActivities: Array<{
    id: string;
    type: 'employee' | 'leave' | 'payroll' | 'system';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  employmentStatusBreakdown: {
    active: number;
    retired: number;
    resigned: number;
    terminated: number;
    awol: number;
  };
  monthlyStats: {
    newEmployees: number;
    leaveApplications: number;
    completedTrainings: number;
    payrollProcessed: boolean;
  };
}

class DashboardService {
  async getEmployeeDashboardStats(employeeId?: number): Promise<EmployeeDashboardStats> {
    const params = employeeId ? { employee_id: employeeId } : {};
    const response = await apiService.get<{ 
      success: boolean; 
      data: EmployeeDashboardStats 
    }>('/dashboard/employee', params);
    return response.data;
  }

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const response = await apiService.get<{ 
      success: boolean; 
      data: AdminDashboardStats 
    }>('/dashboard/admin');
    return response.data;
  }

  async getSystemHealth(): Promise<{
    status: 'good' | 'warning' | 'critical';
    services: Array<{
      name: string;
      status: 'online' | 'offline' | 'degraded';
      lastCheck: string;
    }>;
  }> {
    const response = await apiService.get<{ 
      success: boolean; 
      data: {
        status: 'good' | 'warning' | 'critical';
        services: Array<{
          name: string;
          status: 'online' | 'offline' | 'degraded';
          lastCheck: string;
        }>;
      }
    }>('/dashboard/system-health');
    return response.data;
  }

  async getQuickStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    todayLogins: number;
    systemUptime: string;
  }> {
    const response = await apiService.get<{ 
      success: boolean; 
      data: {
        totalUsers: number;
        activeUsers: number;
        todayLogins: number;
        systemUptime: string;
      }
    }>('/dashboard/quick-stats');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;