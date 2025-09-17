// services/payrollItemsService.ts - Payroll Items API service layer
import { apiService } from './api';

export interface PayrollItemType {
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

export interface CreatePayrollItemForm {
  code: string;
  name: string;
  description: string;
  amount: number;
  is_monthly: boolean;
  is_prorated: boolean;
}

export interface PayrollItemsApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PayrollItemsFilters {
  is_active?: boolean;
  search?: string;
}

class PayrollItemsService {
  private readonly baseUrl = '/payroll-system/allowance-types';

  // Get all payroll item types
  async getPayrollItems(filters?: PayrollItemsFilters): Promise<PayrollItemsApiResponse<PayrollItemType[]>> {
    const params = new URLSearchParams();
    
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get<PayrollItemsApiResponse<PayrollItemType[]>>(url);
  }

  // Get a specific payroll item type
  async getPayrollItem(id: number): Promise<PayrollItemsApiResponse<PayrollItemType>> {
    return apiService.get<PayrollItemsApiResponse<PayrollItemType>>(`${this.baseUrl}/${id}`);
  }

  // Create new payroll item type
  async createPayrollItem(data: CreatePayrollItemForm): Promise<PayrollItemsApiResponse<PayrollItemType>> {
    return apiService.post<PayrollItemsApiResponse<PayrollItemType>>(this.baseUrl, data);
  }

  // Update payroll item type
  async updatePayrollItem(id: number, data: Partial<CreatePayrollItemForm>): Promise<PayrollItemsApiResponse<PayrollItemType>> {
    return apiService.put<PayrollItemsApiResponse<PayrollItemType>>(`${this.baseUrl}/${id}`, data);
  }

  // Toggle active status
  async togglePayrollItemStatus(id: number): Promise<PayrollItemsApiResponse<PayrollItemType>> {
    return apiService.put<PayrollItemsApiResponse<PayrollItemType>>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  // Delete payroll item type
  async deletePayrollItem(id: number): Promise<PayrollItemsApiResponse<void>> {
    return apiService.delete<PayrollItemsApiResponse<void>>(`${this.baseUrl}/${id}`);
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

  getCategoryColor(isMonthly: boolean): string {
    return isMonthly 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-orange-100 text-orange-800';
  }

  validatePayrollItemForm(data: CreatePayrollItemForm): string[] {
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

export const payrollItemsService = new PayrollItemsService();
export default payrollItemsService;