// services/payrollDeductionTypesService.ts - Payroll Deduction Types API service layer
import { apiService } from './api';

export interface PayrollDeductionType {
  id: number;
  code: string;
  name: string;
  description: string;
  deduction_type: 'fixed' | 'percentage';
  amount: number;
  percentage: number;
  max_amount?: number;
  is_government: boolean;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePayrollDeductionForm {
  code: string;
  name: string;
  description: string;
  deduction_type: 'fixed' | 'percentage';
  amount: number;
  percentage: number;
  max_amount?: number;
  is_government: boolean;
  is_mandatory: boolean;
}

export interface PayrollDeductionApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PayrollDeductionFilters {
  is_active?: boolean;
  is_government?: boolean;
  is_mandatory?: boolean;
  deduction_type?: 'fixed' | 'percentage';
  search?: string;
}

class PayrollDeductionTypesService {
  private readonly baseUrl = '/payroll-system/deduction-types';

  // Get all payroll deduction types
  async getPayrollDeductions(filters?: PayrollDeductionFilters): Promise<PayrollDeductionApiResponse<PayrollDeductionType[]>> {
    const params = new URLSearchParams();
    
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_government !== undefined) params.append('is_government', filters.is_government.toString());
    if (filters?.is_mandatory !== undefined) params.append('is_mandatory', filters.is_mandatory.toString());
    if (filters?.deduction_type) params.append('deduction_type', filters.deduction_type);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get<PayrollDeductionApiResponse<PayrollDeductionType[]>>(url);
  }

  // Get a specific payroll deduction type
  async getPayrollDeduction(id: number): Promise<PayrollDeductionApiResponse<PayrollDeductionType>> {
    return apiService.get<PayrollDeductionApiResponse<PayrollDeductionType>>(`${this.baseUrl}/${id}`);
  }

  // Create new payroll deduction type
  async createPayrollDeduction(data: CreatePayrollDeductionForm): Promise<PayrollDeductionApiResponse<PayrollDeductionType>> {
    return apiService.post<PayrollDeductionApiResponse<PayrollDeductionType>>(this.baseUrl, data);
  }

  // Update payroll deduction type
  async updatePayrollDeduction(id: number, data: Partial<CreatePayrollDeductionForm>): Promise<PayrollDeductionApiResponse<PayrollDeductionType>> {
    return apiService.put<PayrollDeductionApiResponse<PayrollDeductionType>>(`${this.baseUrl}/${id}`, data);
  }

  // Toggle active status
  async togglePayrollDeductionStatus(id: number): Promise<PayrollDeductionApiResponse<PayrollDeductionType>> {
    return apiService.put<PayrollDeductionApiResponse<PayrollDeductionType>>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  // Delete payroll deduction type
  async deletePayrollDeduction(id: number): Promise<PayrollDeductionApiResponse<void>> {
    return apiService.delete<PayrollDeductionApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // Calculate deduction amount
  calculateDeductionAmount(deduction: PayrollDeductionType, grossPay: number): number {
    if (deduction.deduction_type === 'percentage') {
      let amount = grossPay * (deduction.percentage / 100);
      if (deduction.max_amount && amount > deduction.max_amount) {
        amount = deduction.max_amount;
      }
      return parseFloat(amount.toFixed(2));
    } else {
      return deduction.amount;
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`;
  }

  getDeductionTypeLabel(type: 'fixed' | 'percentage'): string {
    return type === 'fixed' ? 'Fixed Amount' : 'Percentage';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  validatePayrollDeductionForm(data: CreatePayrollDeductionForm): string[] {
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
    
    if (data.deduction_type === 'fixed') {
      if (data.amount < 0) {
        errors.push('Amount must be a positive number');
      }
    } else if (data.deduction_type === 'percentage') {
      if (data.percentage < 0 || data.percentage > 100) {
        errors.push('Percentage must be between 0 and 100');
      }
      if (data.max_amount && data.max_amount < 0) {
        errors.push('Maximum amount must be a positive number');
      }
    }
    
    return errors;
  }
}

export const payrollDeductionTypesService = new PayrollDeductionTypesService();
export default payrollDeductionTypesService;