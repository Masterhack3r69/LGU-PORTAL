// services/payrollService.ts - Payroll API service layer
import { apiService } from './api';
import type {
  PayrollPeriod,
  PayrollPeriodDetails,
  PayrollItem,
  PayrollGenerationRequest,
  PayrollGenerationResponse,
  CreatePayrollPeriodForm,
  PayrollFilters,
  PayrollHistoryFilters,
  PayrollApiResponse,
  GovernmentRates,
  ProratedSalaryCalculation,
  CalculateProratedForm,
  StepIncrementResult,
  LeaveSummary,
  ManualPayrollDetails,
  ManualPayrollCalculationRequest,
  ManualPayrollCalculation,
  ProcessManualPayrollRequest,
  ProcessManualPayrollResponse
} from '../types/payroll';

class PayrollService {
  private readonly baseUrl = '/payroll';

  // Payroll Period Management
  async getPayrollPeriods(filters?: PayrollFilters): Promise<PayrollApiResponse<PayrollPeriod[]>> {
    const params = new URLSearchParams();
    
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get<PayrollApiResponse<PayrollPeriod[]>>(url);
  }

  async getPayrollPeriod(id: number): Promise<PayrollApiResponse<PayrollPeriodDetails>> {
    return apiService.get<PayrollApiResponse<PayrollPeriodDetails>>(`${this.baseUrl}/period/${id}`);
  }

  async createPayrollPeriod(data: CreatePayrollPeriodForm): Promise<PayrollApiResponse<PayrollPeriod>> {
    return apiService.post<PayrollApiResponse<PayrollPeriod>>(`${this.baseUrl}/period`, data);
  }

  async deletePayrollPeriod(id: number): Promise<PayrollApiResponse<void>> {
    return apiService.delete<PayrollApiResponse<void>>(`${this.baseUrl}/period/${id}`);
  }

  // Payroll Generation
  async generatePayroll(data: PayrollGenerationRequest): Promise<PayrollGenerationResponse> {
    return apiService.post<PayrollGenerationResponse>(`${this.baseUrl}/generate`, data);
  }

  async finalizePayrollPeriod(periodId: number): Promise<PayrollApiResponse<{ status: string; payroll_items_processed: number }>> {
    return apiService.post<PayrollApiResponse<{ status: string; payroll_items_processed: number }>>(
      `${this.baseUrl}/process`, 
      { period_id: periodId }
    );
  }

  // Employee Payroll History
  async getEmployeePayrollHistory(
    employeeId: number, 
    filters?: PayrollHistoryFilters
  ): Promise<PayrollApiResponse<PayrollItem[]>> {
    const params = new URLSearchParams();
    
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString 
      ? `${this.baseUrl}/employee/${employeeId}?${queryString}` 
      : `${this.baseUrl}/employee/${employeeId}`;
    
    return apiService.get<PayrollApiResponse<PayrollItem[]>>(url);
  }

  // Leave Summary Integration
  async getPayrollLeaveSummary(employeeId: number, periodId: number): Promise<PayrollApiResponse<LeaveSummary>> {
    return apiService.get<PayrollApiResponse<LeaveSummary>>(`${this.baseUrl}/leave-summary/${employeeId}/${periodId}`);
  }

  // Government Calculations
  async getGovernmentRates(): Promise<PayrollApiResponse<GovernmentRates>> {
    return apiService.get<PayrollApiResponse<GovernmentRates>>(`${this.baseUrl}/government-rates`);
  }

  // Prorated Salary Calculation
  async calculateProratedSalary(data: CalculateProratedForm): Promise<PayrollApiResponse<ProratedSalaryCalculation>> {
    return apiService.post<PayrollApiResponse<ProratedSalaryCalculation>>(`${this.baseUrl}/calculate-prorated`, data);
  }

  // Step Increment Processing
  async processStepIncrements(year: number, month: number): Promise<PayrollApiResponse<StepIncrementResult>> {
    return apiService.post<PayrollApiResponse<StepIncrementResult>>(`${this.baseUrl}/process-step-increments`, {
      year,
      month
    });
  }

  // Utility Methods
  async validatePayrollPeriod(year: number, month: number, periodNumber: 1 | 2): Promise<{ isValid: boolean; message?: string }> {
    try {
      const periods = await this.getPayrollPeriods({ year, month });
      const existingPeriod = periods.data.find(p => p.period_number === periodNumber);
      
      if (existingPeriod) {
        return {
          isValid: false,
          message: `Payroll period ${periodNumber} for ${month}/${year} already exists`
        };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating payroll period:', error);
      return {
        isValid: false,
        message: 'Error validating payroll period'
      };
    }
  }

  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format period display name
  formatPeriodName(period: PayrollPeriod): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[period.month - 1];
    const periodLabel = period.period_number === 1 ? '1st-15th' : '16th-31st';
    
    return `${monthName} ${period.year} - Period ${period.period_number} (${periodLabel})`;
  }

  // Get status badge color
  getStatusColor(status: PayrollPeriod['status']): string {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Calculate net pay percentage
  calculateNetPayPercentage(grossPay: number, netPay: number): number {
    if (grossPay === 0) return 0;
    return Math.round((netPay / grossPay) * 100);
  }

  // Get period date range
  getPeriodDateRange(period: PayrollPeriod): { start: Date; end: Date; payDate: Date } {
    return {
      start: new Date(period.start_date),
      end: new Date(period.end_date),
      payDate: new Date(period.pay_date)
    };
  }

  // ===================================================================
  // MANUAL PAYROLL PROCESSING
  // ===================================================================

  // Get employee manual payroll details
  async getEmployeeManualPayrollDetails(employeeId: number, periodId?: number): Promise<PayrollApiResponse<ManualPayrollDetails>> {
    const params = periodId ? { period_id: periodId } : {};
    return apiService.get<PayrollApiResponse<ManualPayrollDetails>>(
      `${this.baseUrl}/manual/${employeeId}`, 
      params
    );
  }

  // Calculate manual payroll for employee
  async calculateManualPayroll(data: ManualPayrollCalculationRequest): Promise<PayrollApiResponse<ManualPayrollCalculation>> {
    return apiService.post<PayrollApiResponse<ManualPayrollCalculation>>(`${this.baseUrl}/manual/calculate`, data);
  }

  // Process manual payroll entry
  async processManualPayroll(data: ProcessManualPayrollRequest): Promise<PayrollApiResponse<ProcessManualPayrollResponse>> {
    return apiService.post<PayrollApiResponse<ProcessManualPayrollResponse>>(`${this.baseUrl}/manual/process`, data);
  }

  // Delete manual payroll item
  async deleteManualPayrollItem(itemId: number): Promise<PayrollApiResponse<void>> {
    return apiService.delete<PayrollApiResponse<void>>(`${this.baseUrl}/manual/${itemId}`);
  }

  // Get manual payroll history for employee
  async getManualPayrollHistory(
    employeeId: number, 
    filters?: { year?: number; limit?: number }
  ): Promise<PayrollApiResponse<PayrollItem[]>> {
    const params = new URLSearchParams();
    
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString 
      ? `${this.baseUrl}/manual/history/${employeeId}?${queryString}` 
      : `${this.baseUrl}/manual/history/${employeeId}`;
    
    return apiService.get<PayrollApiResponse<PayrollItem[]>>(url);
  }
}

export const payrollService = new PayrollService();
export default payrollService;