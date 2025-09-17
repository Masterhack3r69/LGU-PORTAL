// services/payrollSystemService.ts - Automated Payroll System Service

import { apiService } from './api';
import type {
  PayrollSystemApiResponse,
  PayrollSystemPaginatedResponse,
  PayrollSystemSummary,
  PayrollSystemDetails,
  PayrollValidation,
  PayrollAllowanceType,
  EmployeeAllowance,
  PayrollPeriod,
  CreatePayrollPeriodForm,
  UpdateEmployeeAllowancesForm,
  PayrollFilters,
  GovernmentRates
} from '@/types/payrollSystem';

export class PayrollSystemService {
  // ===================================================================
  // AUTOMATED PAYROLL GENERATION
  // ===================================================================

  /**
   * Generate automated payroll for a specific period
   * @param periodId - The payroll period ID
   * @param employeeIds - Optional array of employee IDs to process (if not provided, processes all employees)
   */
  async generateAutomatedPayroll(
    periodId: number, 
    employeeIds?: number[]
  ): Promise<PayrollSystemApiResponse<PayrollSystemSummary>> {
    const requestData: { period_id: number; employee_ids?: number[] } = {
      period_id: periodId
    };
    
    if (employeeIds && employeeIds.length > 0) {
      requestData.employee_ids = employeeIds;
    }
    
    const response = await apiService.post<PayrollSystemApiResponse<PayrollSystemSummary>>('/payroll-system/generate', requestData);
    return response;
  }

  /**
   * Generate payroll for a single employee in a specific period
   * @param periodId - The payroll period ID
   * @param employeeId - The specific employee ID to process
   */
  async generateEmployeePayroll(
    periodId: number, 
    employeeId: number
  ): Promise<PayrollSystemApiResponse<PayrollSystemSummary>> {
    return this.generateAutomatedPayroll(periodId, [employeeId]);
  }
  async getPayrollComputation(periodId: number): Promise<PayrollSystemApiResponse<PayrollSystemDetails>> {
    const response = await apiService.get<PayrollSystemApiResponse<PayrollSystemDetails>>(`/payroll-system/computation/${periodId}`);
    return response;
  }

  /**
   * Validate payroll calculations and data integrity
   */
  async validatePayroll(periodId: number): Promise<PayrollSystemApiResponse<PayrollValidation>> {
    const response = await apiService.get<PayrollSystemApiResponse<PayrollValidation>>(`/payroll-system/validation/${periodId}`);
    return response;
  }

  // ===================================================================
  // ALLOWANCE MANAGEMENT
  // ===================================================================

  /**
   * Get all available payroll allowance types
   */
  async getAllowanceTypes(): Promise<PayrollSystemApiResponse<PayrollAllowanceType[]>> {
    const response = await apiService.get<PayrollSystemApiResponse<PayrollAllowanceType[]>>('/payroll-system/allowance-types');
    return response;
  }

  /**
   * Get employee's current payroll allowances
   */
  async getEmployeeAllowances(employeeId: number): Promise<PayrollSystemApiResponse<EmployeeAllowance[]>> {
    const response = await apiService.get<PayrollSystemApiResponse<EmployeeAllowance[]>>(`/payroll-system/allowances/${employeeId}`);
    return response;
  }

  /**
   * Update employee's payroll allowances
   */
  async updateEmployeeAllowances(
    employeeId: number, 
    form: UpdateEmployeeAllowancesForm
  ): Promise<PayrollSystemApiResponse<void>> {
    const response = await apiService.put<PayrollSystemApiResponse<void>>(`/payroll-system/allowances/${employeeId}`, form);
    return response;
  }

  // ===================================================================
  // PERIOD MANAGEMENT
  // ===================================================================

  /**
   * Get payroll periods with filtering and pagination
   */
  async getPayrollPeriods(filters: PayrollFilters): Promise<PayrollSystemPaginatedResponse<PayrollPeriod>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.status) params.append('status', filters.status);

    const response = await apiService.get<PayrollSystemPaginatedResponse<PayrollPeriod>>(`/payroll-system/periods?${params.toString()}`);
    return response;
  }

  /**
   * Create a new payroll period
   */
  async createPayrollPeriod(form: CreatePayrollPeriodForm): Promise<PayrollSystemApiResponse<PayrollPeriod>> {
    const response = await apiService.post<PayrollSystemApiResponse<PayrollPeriod>>('/payroll/period', form);
    return response;
  }

  // ===================================================================
  // UTILITIES AND HELPERS
  // ===================================================================

  /**
   * Get current government contribution rates
   */
  async getGovernmentRates(): Promise<PayrollSystemApiResponse<GovernmentRates>> {
    const response = await apiService.get<PayrollSystemApiResponse<GovernmentRates>>('/payroll-system/government-rates');
    return response;
  }

  /**
   * Validate payroll period before creation
   */
  async validatePayrollPeriod(year: number, month: number, periodNumber: number): Promise<{
    isValid: boolean;
    message: string;
  }> {
    try {
      // Check for duplicate periods
      const existingPeriods = await this.getPayrollPeriods({ year, month });
      const duplicate = existingPeriods.data.find(p => p.period_number === periodNumber);
      
      if (duplicate) {
        return {
          isValid: false,
          message: `Period ${periodNumber} for ${year}-${month} already exists`
        };
      }

      // Basic date validation
      const startDate = periodNumber === 1 
        ? new Date(year, month - 1, 1)
        : new Date(year, month - 1, 16);
      const endDate = periodNumber === 1
        ? new Date(year, month - 1, 15)
        : new Date(year, month, 0);

      if (startDate >= endDate) {
        return {
          isValid: false,
          message: 'Invalid date range for the specified period'
        };
      }

      return { isValid: true, message: 'Valid' };
    } catch {
      return {
        isValid: false,
        message: 'Error validating payroll period'
      };
    }
  }

  // ===================================================================
  // FORMATTING UTILITIES
  // ===================================================================

  /**
   * Format currency amount in Philippine Peso
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  /**
   * Format payroll period name
   */
  formatPeriodName(period: PayrollPeriod): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[period.month - 1]} ${period.year} - Period ${period.period_number}`;
  }

  /**
   * Get status color class for badges
   */
  getStatusColor(status: string): string {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Calculate working days for a period considering weekends
   */
  calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Generate period dates automatically
   */
  generatePeriodDates(year: number, month: number, periodNumber: 1 | 2): {
    start_date: string;
    end_date: string;
    pay_date: string;
  } {
    const startDate = periodNumber === 1 
      ? new Date(year, month - 1, 1)
      : new Date(year, month - 1, 16);
      
    const endDate = periodNumber === 1
      ? new Date(year, month - 1, 15)
      : new Date(year, month, 0);
      
    const payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + 5); // 5 days after period end

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      pay_date: payDate.toISOString().split('T')[0]
    };
  }

  // ===================================================================
  // BATCH OPERATIONS
  // ===================================================================

  /**
   * Update multiple employee allowances in batch
   */
  async batchUpdateAllowances(updates: Array<{
    employee_id: number;
    allowances: UpdateEmployeeAllowancesForm['allowances'];
  }>): Promise<PayrollSystemApiResponse<{
    successful: number;
    failed: number;
    errors: string[];
  }>> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const update of updates) {
      try {
        await this.updateEmployeeAllowances(update.employee_id, {
          allowances: update.allowances
        });
        results.successful++;
      } catch {
        results.failed++;
        results.errors.push(`Employee ${update.employee_id}: Unknown error`);
      }
    }

    return {
      success: true,
      data: results,
      message: `Batch update completed: ${results.successful} successful, ${results.failed} failed`
    };
  }

  /**
   * Generate payroll for multiple periods
   */
  async batchGeneratePayroll(periodIds: number[]): Promise<PayrollSystemApiResponse<{
    successful: PayrollSystemSummary[];
    failed: Array<{ period_id: number; error: string }>;
  }>> {
    const successful: PayrollSystemSummary[] = [];
    const failed: Array<{ period_id: number; error: string }> = [];

    for (const periodId of periodIds) {
      try {
        const result = await this.generateAutomatedPayroll(periodId);
        successful.push(result.data);
      } catch {
        failed.push({
          period_id: periodId,
          error: 'Unknown error'
        });
      }
    }

    return {
      success: true,
      data: { successful, failed },
      message: `Batch generation completed: ${successful.length} successful, ${failed.length} failed`
    };
  }
}

// Create and export a singleton instance
export const payrollSystemService = new PayrollSystemService();