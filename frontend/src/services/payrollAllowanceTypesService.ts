// services/payrollAllowanceTypesService.ts - Payroll Allowance Types API service layer
import { apiService } from './api';

export interface PayrollAllowanceType {
  id: number;
  code: string;
  name: string;
  description: string;
  amount: number;
  is_monthly: boolean;
  is_prorated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePayrollAllowanceForm {
  code: string;
  name: string;
  description: string;
  amount: number;
  is_monthly: boolean;
  is_prorated: boolean;
}

export interface PayrollAllowanceApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PayrollAllowanceFilters {
  is_active?: boolean;
  is_monthly?: boolean;
  is_prorated?: boolean;
  search?: string;
}

class PayrollAllowanceTypesService {
  private readonly baseUrl = '/payroll-system/allowance-types';

  // Get all payroll allowance types
  async getPayrollAllowances(filters?: PayrollAllowanceFilters): Promise<PayrollAllowanceApiResponse<PayrollAllowanceType[]>> {
    const params = new URLSearchParams();
    
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_monthly !== undefined) params.append('is_monthly', filters.is_monthly.toString());
    if (filters?.is_prorated !== undefined) params.append('is_prorated', filters.is_prorated.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get<PayrollAllowanceApiResponse<PayrollAllowanceType[]>>(url);
  }

  // Get a specific payroll allowance type
  async getPayrollAllowance(id: number): Promise<PayrollAllowanceApiResponse<PayrollAllowanceType>> {
    return apiService.get<PayrollAllowanceApiResponse<PayrollAllowanceType>>(`${this.baseUrl}/${id}`);
  }

  // Create new payroll allowance type
  async createPayrollAllowance(data: CreatePayrollAllowanceForm): Promise<PayrollAllowanceApiResponse<PayrollAllowanceType>> {
    return apiService.post<PayrollAllowanceApiResponse<PayrollAllowanceType>>(this.baseUrl, data);
  }

  // Update payroll allowance type
  async updatePayrollAllowance(id: number, data: Partial<CreatePayrollAllowanceForm>): Promise<PayrollAllowanceApiResponse<PayrollAllowanceType>> {
    return apiService.put<PayrollAllowanceApiResponse<PayrollAllowanceType>>(`${this.baseUrl}/${id}`, data);
  }

  // Toggle active status
  async togglePayrollAllowanceStatus(id: number): Promise<PayrollAllowanceApiResponse<PayrollAllowanceType>> {
    return apiService.put<PayrollAllowanceApiResponse<PayrollAllowanceType>>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  // Delete payroll allowance type
  async deletePayrollAllowance(id: number): Promise<PayrollAllowanceApiResponse<void>> {
    return apiService.delete<PayrollAllowanceApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // Calculate allowance amount
  calculateAllowanceAmount(allowance: PayrollAllowanceType, workingDays: number = 22): number {
    let amount = allowance.amount;
    
    // Apply proration if needed
    if (allowance.is_prorated && workingDays < 22) {
      amount = (amount * workingDays) / 22;
    }
    
    return parseFloat(amount.toFixed(2));
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  validatePayrollAllowanceForm(data: CreatePayrollAllowanceForm): string[] {
    const errors: string[] = [];
    
    if (!data.code?.trim()) {
      errors.push('Code is required');
    } else if (data.code.length > 20) {
      errors.push('Code must be 20 characters or less');
    }
    
    if (!data.name?.trim()) {
      errors.push('Name is required');
    } else if (data.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }
    
    if (data.amount < 0) {
      errors.push('Amount must be a positive number');
    }
    
    return errors;
  }
}

export const payrollAllowanceTypesService = new PayrollAllowanceTypesService();
export default payrollAllowanceTypesService;