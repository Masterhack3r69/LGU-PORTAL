import type { 
  CompensationBenefit,
  BenefitCalculation,
  EligibleEmployee,
  BulkProcessRequest,
  MonetizationRequest,
  CompensationFilters,
  CompensationResponse,
  BenefitStatistics,
  BenefitType
} from '../types/compensation';
import apiService from './api';

class CompensationService {
  // Get all compensation benefit records with filters
  async getRecords(filters: Partial<CompensationFilters> = {}): Promise<CompensationResponse> {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.employee_id && { employee_id: filters.employee_id }),
      ...(filters.benefit_type && { benefit_type: filters.benefit_type }),
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
      ...(filters.processed_by && { processed_by: filters.processed_by }),
    };

    const response = await apiService.get<{
      success: boolean;
      data: CompensationBenefit[];
      pagination: {
        currentPage: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    }>('/compensation-benefits', params);

    return {
      records: response.data || [],
      total: response.pagination?.totalRecords || 0,
      page: response.pagination?.currentPage || 1,
      limit: response.pagination?.pageSize || 10,
      totalPages: response.pagination?.totalPages || 0,
    };
  }

  // Get compensation benefit record by ID
  async getRecord(id: number): Promise<CompensationBenefit> {
    const response = await apiService.get<{
      success: boolean;
      data: CompensationBenefit;
    }>(`/compensation-benefits/${id}`);
    return response.data;
  }

  // Get benefit statistics
  async getStatistics(filters: Partial<CompensationFilters> = {}): Promise<BenefitStatistics> {
    const params = {
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
      ...(filters.benefit_type && { benefit_type: filters.benefit_type }),
    };

    const response = await apiService.get<{
      success: boolean;
      data: BenefitStatistics;
    }>('/compensation-benefits/statistics', params);
    return response.data;
  }

  // Calculate specific benefit for employee
  async calculateBenefit(benefitType: BenefitType, employeeId: number): Promise<BenefitCalculation> {
    const response = await apiService.get<{
      success: boolean;
      data: BenefitCalculation;
    }>(`/compensation-benefits/calculate/${benefitType}/${employeeId}`);
    return response.data;
  }

  // Get eligible employees for specific benefit type
  async getEligibleEmployees(benefitType: BenefitType): Promise<EligibleEmployee[]> {
    const response = await apiService.get<{
      success: boolean;
      data: EligibleEmployee[];
    }>(`/compensation-benefits/eligible/${benefitType}`);
    return response.data || [];
  }

  // Bulk calculate benefits for multiple employees
  async bulkCalculate(benefitType: BenefitType, employeeIds: number[]): Promise<BenefitCalculation[]> {
    const response = await apiService.post<{
      success: boolean;
      data: BenefitCalculation[];
    }>('/compensation-benefits/bulk-calculate', {
      benefitType,
      employeeIds
    });
    return response.data || [];
  }

  // Create single compensation benefit record
  async createRecord(record: Omit<CompensationBenefit, 'id' | 'processed_at' | 'processed_by'>): Promise<CompensationBenefit> {
    const response = await apiService.post<{
      success: boolean;
      data: CompensationBenefit;
    }>('/compensation-benefits', record);
    return response.data;
  }

  // Bulk process benefits
  async bulkProcess(request: BulkProcessRequest): Promise<CompensationBenefit[]> {
    const response = await apiService.post<{
      success: boolean;
      data: CompensationBenefit[];
    }>('/compensation-benefits/bulk-process', request);
    return response.data || [];
  }

  // Process monetization with leave balance update
  async processMonetization(request: MonetizationRequest): Promise<CompensationBenefit> {
    const response = await apiService.post<{
      success: boolean;
      data: CompensationBenefit;
    }>('/compensation-benefits/process-monetization', request);
    return response.data;
  }

  // Delete compensation benefit record (admin only)
  async deleteRecord(id: number): Promise<void> {
    await apiService.delete(`/compensation-benefits/${id}`);
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Helper method to format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export const compensationService = new CompensationService();
export default compensationService;