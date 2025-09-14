// services/compensationService.ts - Compensation API service layer
import { apiService } from './api';
import type {
  EmployeeCompensation,
  CompensationType,
  CreateCompensationForm,
  PayrollApiResponse
} from '../types/payroll';

export interface CompensationFilters {
  employee_id?: number;
  compensation_type_id?: number;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

export interface BulkCompensationResult {
  processed: number;
  failed: number;
  errors?: string[];
}

export interface BulkCompensationOperation {
  operation: 'create' | 'update' | 'delete';
  data: CreateCompensationForm[];
}

class CompensationService {
  private readonly baseUrl = '/compensation';

  // Compensation Types
  async getCompensationTypes(): Promise<PayrollApiResponse<CompensationType[]>> {
    return apiService.get<PayrollApiResponse<CompensationType[]>>(`${this.baseUrl}/types`);
  }

  // Compensation Records
  async getCompensationRecords(filters?: CompensationFilters): Promise<PayrollApiResponse<EmployeeCompensation[]>> {
    const params = new URLSearchParams();
    
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.compensation_type_id) params.append('compensation_type_id', filters.compensation_type_id.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get<PayrollApiResponse<EmployeeCompensation[]>>(url);
  }

  async getEmployeeCompensation(employeeId: number): Promise<PayrollApiResponse<EmployeeCompensation[]>> {
    return apiService.get<PayrollApiResponse<EmployeeCompensation[]>>(`${this.baseUrl}/employee/${employeeId}`);
  }

  async createCompensation(data: CreateCompensationForm): Promise<PayrollApiResponse<EmployeeCompensation>> {
    return apiService.post<PayrollApiResponse<EmployeeCompensation>>(this.baseUrl, data);
  }

  async updateCompensation(id: number, data: Partial<CreateCompensationForm>): Promise<PayrollApiResponse<EmployeeCompensation>> {
    return apiService.put<PayrollApiResponse<EmployeeCompensation>>(`${this.baseUrl}/${id}`, data);
  }

  async deleteCompensation(id: number): Promise<PayrollApiResponse<void>> {
    return apiService.delete<PayrollApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // Bulk Operations
  async bulkCompensationOperation(operation: BulkCompensationOperation): Promise<PayrollApiResponse<BulkCompensationResult>> {
    return apiService.post<PayrollApiResponse<BulkCompensationResult>>(`${this.baseUrl}/bulk`, operation);
  }

  // Utility Methods
  formatCompensationAmount(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getCompensationTypeLabel(types: CompensationType[], typeId: number): string {
    const type = types.find(t => t.id === typeId);
    return type ? type.name : 'Unknown';
  }

  isRecurring(types: CompensationType[], typeId: number): boolean {
    const type = types.find(t => t.id === typeId);
    return type ? type.is_recurring : false;
  }
}

export const compensationService = new CompensationService();
export default compensationService;