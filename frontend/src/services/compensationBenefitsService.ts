// services/compensationBenefitsService.ts - Manual Compensation & Benefits Service

import { apiService } from './api';
import type {
  CBApiResponse,

  AvailableBenefitsResponse,
  BenefitSelectionsResponse,
  SelectBenefitsForm,
  SelectBenefitsResponse,
  ProcessBenefitsForm,
  ProcessBenefitsResponse,
  UpdateBenefitSelectionForm,
  CreateBenefitTypeForm,
  BenefitTypesResponse,
  BenefitSummaryReportResponse,
  EmployeeBenefitHistoryResponse,
  CBFilters,
  CBBenefitType,
  EmployeeBenefitSelection
} from '@/types/compensationBenefits';

export class CompensationBenefitsService {
  // ===================================================================
  // BENEFIT AVAILABILITY AND ELIGIBILITY
  // ===================================================================

  /**
   * Get available benefits for employee for a specific year
   */
  async getAvailableBenefits(
    employeeId: number, 
    year: number
  ): Promise<CBApiResponse<AvailableBenefitsResponse>> {
    const response = await apiService.get<CBApiResponse<AvailableBenefitsResponse>>(`/compensation-benefits/available/${employeeId}/${year}`);
    return response;
  }

  /**
   * Get employee's benefit selections for a year
   */
  async getBenefitSelections(
    employeeId: number, 
    year: number
  ): Promise<CBApiResponse<BenefitSelectionsResponse>> {
    const response = await apiService.get<CBApiResponse<BenefitSelectionsResponse>>(`/compensation-benefits/selections/${employeeId}/${year}`);
    return response;
  }

  // ===================================================================
  // BENEFIT SELECTION PROCESS
  // ===================================================================

  /**
   * Select benefits for employee
   */
  async selectBenefits(form: SelectBenefitsForm): Promise<CBApiResponse<SelectBenefitsResponse>> {
    const response = await apiService.post<CBApiResponse<SelectBenefitsResponse>>('/compensation-benefits/select', form);
    return response;
  }

  /**
   * Update specific benefit selection
   */
  async updateBenefitSelection(
    selectionId: number, 
    form: UpdateBenefitSelectionForm
  ): Promise<CBApiResponse<void>> {
    const response = await apiService.put<CBApiResponse<void>>(`/compensation-benefits/selections/${selectionId}`, form);
    return response;
  }

  // ===================================================================
  // BENEFIT PROCESSING AND APPROVAL
  // ===================================================================

  /**
   * Process and approve benefit selections for payment
   */
  async processBenefits(form: ProcessBenefitsForm): Promise<CBApiResponse<ProcessBenefitsResponse>> {
    const response = await apiService.post<CBApiResponse<ProcessBenefitsResponse>>('/compensation-benefits/process', form);
    return response;
  }

  // ===================================================================
  // BENEFIT TYPES MANAGEMENT
  // ===================================================================

  /**
   * Get all compensation & benefit types
   */
  async getBenefitTypes(): Promise<CBApiResponse<BenefitTypesResponse>> {
    const response = await apiService.get<CBApiResponse<BenefitTypesResponse>>('/compensation-benefits/benefit-types');
    return response;
  }

  /**
   * Create new benefit type
   */
  async createBenefitType(form: CreateBenefitTypeForm): Promise<CBApiResponse<{ id: number }>> {
    const response = await apiService.post<CBApiResponse<{ id: number }>>('/compensation-benefits/benefit-types', form);
    return response;
  }

  // ===================================================================
  // REPORTS AND ANALYTICS
  // ===================================================================

  /**
   * Get benefit selections summary report for a year
   */
  async getSummaryReport(
    year: number, 
    filters?: CBFilters
  ): Promise<CBApiResponse<BenefitSummaryReportResponse>> {
    const params = new URLSearchParams();
    
    if (filters?.department) params.append('department', filters.department);
    if (filters?.benefit_category) params.append('benefit_category', filters.benefit_category);

    const queryString = params.toString();
    const url = `/compensation-benefits/report/summary/${year}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<CBApiResponse<BenefitSummaryReportResponse>>(url);
    return response;
  }

  /**
   * Get comprehensive benefit history for an employee
   */
  async getEmployeeHistory(
    employeeId: number, 
    years: number = 5
  ): Promise<CBApiResponse<EmployeeBenefitHistoryResponse>> {
    const response = await apiService.get<CBApiResponse<EmployeeBenefitHistoryResponse>>(
      `/compensation-benefits/report/employee/${employeeId}?years=${years}`
    );
    return response;
  }

  // ===================================================================
  // BULK OPERATIONS
  // ===================================================================

  /**
   * Process multiple benefit selections in batch
   */
  async batchProcessBenefits(
    processRequests: Array<{
      selection_ids: number[];
      processed_by: number;
    }>
  ): Promise<CBApiResponse<{
    successful: ProcessBenefitsResponse[];
    failed: Array<{ selection_ids: number[]; error: string }>;
  }>> {
    const successful: ProcessBenefitsResponse[] = [];
    const failed: Array<{ selection_ids: number[]; error: string }> = [];

    for (const request of processRequests) {
      try {
        const result = await this.processBenefits(request);
        successful.push(result.data);
      } catch (error) {
        failed.push({
          selection_ids: request.selection_ids,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      data: { successful, failed },
      message: `Batch processing completed: ${successful.length} successful, ${failed.length} failed`
    };
  }

  /**
   * Select benefits for multiple employees
   */
  async batchSelectBenefits(
    selections: SelectBenefitsForm[]
  ): Promise<CBApiResponse<{
    successful: SelectBenefitsResponse[];
    failed: Array<{ employee_id: number; error: string }>;
  }>> {
    const successful: SelectBenefitsResponse[] = [];
    const failed: Array<{ employee_id: number; error: string }> = [];

    for (const selection of selections) {
      try {
        const result = await this.selectBenefits(selection);
        successful.push(result.data);
      } catch (error) {
        failed.push({
          employee_id: selection.employee_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      data: { successful, failed },
      message: `Batch selection completed: ${successful.length} successful, ${failed.length} failed`
    };
  }

  // ===================================================================
  // UTILITY FUNCTIONS
  // ===================================================================

  /**
   * Check benefit eligibility for an employee
   */
  async checkBenefitEligibility(
    employeeId: number,
    benefitTypeId: number,
    year: number
  ): Promise<{
    eligible: boolean;
    reason?: string;
    estimated_amount: number;
  }> {
    try {
      const availableBenefits = await this.getAvailableBenefits(employeeId, year);
      
      const allBenefits = Object.values(availableBenefits.data.benefits_by_category).flat();
      const benefit = allBenefits.find(b => b.id === benefitTypeId);
      
      if (!benefit) {
        return {
          eligible: false,
          reason: 'Benefit type not found',
          estimated_amount: 0
        };
      }

      return {
        eligible: benefit.can_select,
        reason: benefit.ineligibility_reason,
        estimated_amount: benefit.estimated_amount
      };
    } catch {
      return {
        eligible: false,
        reason: 'Error checking eligibility',
        estimated_amount: 0
      };
    }
  }

  /**
   * Calculate total estimated benefits for selected items
   */
  calculateTotalEstimatedAmount(
    selectedBenefitIds: number[],
    availableBenefits: AvailableBenefitsResponse
  ): number {
    const allBenefits = Object.values(availableBenefits.benefits_by_category).flat();
    
    return selectedBenefitIds.reduce((total, benefitId) => {
      const benefit = allBenefits.find(b => b.id === benefitId);
      return total + (benefit?.estimated_amount || 0);
    }, 0);
  }

  /**
   * Get benefits by category from available benefits
   */
  getBenefitsByCategory(
    availableBenefits: AvailableBenefitsResponse,
    category: string
  ): CBBenefitType[] {
    return availableBenefits.benefits_by_category[category] || [];
  }

  /**
   * Filter selections by status
   */
  filterSelectionsByStatus(
    selections: EmployeeBenefitSelection[],
    status: EmployeeBenefitSelection['status']
  ): EmployeeBenefitSelection[] {
    return selections.filter(s => s.status === status);
  }

  // ===================================================================
  // FORMATTING AND DISPLAY UTILITIES
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
   * Get category icon component
   */
  getCategoryIcon(category: string): string {
    const icons = {
      'BONUS': '🎁',
      'ALLOWANCE': '💰',
      'AWARD': '🏆',
      'MONETIZATION': '💸',
      'INSURANCE': '❤️',
      'CLAIM': '📄'
    };
    return icons[category as keyof typeof icons] || '🎁';
  }

  /**
   * Get category color class for badges
   */
  getCategoryColor(category: string): string {
    const colors = {
      'BONUS': 'bg-green-100 text-green-800',
      'ALLOWANCE': 'bg-blue-100 text-blue-800',
      'AWARD': 'bg-purple-100 text-purple-800',
      'MONETIZATION': 'bg-orange-100 text-orange-800',
      'INSURANCE': 'bg-red-100 text-red-800',
      'CLAIM': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status color class for badges
   */
  getStatusColor(status: string): string {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CALCULATED': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'PAID': 'bg-green-600 text-white',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get frequency description
   */
  getFrequencyDescription(frequency: string): string {
    const descriptions = {
      'YEARLY': 'Given annually',
      'CONDITIONAL': 'Based on specific conditions',
      'ONE_TIME': 'Single occurrence'
    };
    return descriptions[frequency as keyof typeof descriptions] || 'Unknown frequency';
  }

  /**
   * Format benefit selection summary
   */
  formatSelectionSummary(selections: EmployeeBenefitSelection[]): {
    total_count: number;
    total_amount: number;
    by_status: Record<string, { count: number; amount: number }>;
    by_category: Record<string, { count: number; amount: number }>;
  } {
    const summary = {
      total_count: selections.length,
      total_amount: selections.reduce((sum, s) => sum + s.actual_amount, 0),
      by_status: {} as Record<string, { count: number; amount: number }>,
      by_category: {} as Record<string, { count: number; amount: number }>
    };

    // Group by status
    selections.forEach(s => {
      if (!summary.by_status[s.status]) {
        summary.by_status[s.status] = { count: 0, amount: 0 };
      }
      summary.by_status[s.status].count++;
      summary.by_status[s.status].amount += s.actual_amount;
    });

    // Group by category
    selections.forEach(s => {
      if (!summary.by_category[s.category]) {
        summary.by_category[s.category] = { count: 0, amount: 0 };
      }
      summary.by_category[s.category].count++;
      summary.by_category[s.category].amount += s.actual_amount;
    });

    return summary;
  }

  // ===================================================================
  // VALIDATION HELPERS
  // ===================================================================

  /**
   * Validate benefit selection form
   */
  validateBenefitSelection(form: SelectBenefitsForm): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!form.employee_id || form.employee_id <= 0) {
      errors.push('Valid employee ID is required');
    }

    if (!form.year || form.year < 2020 || form.year > 2030) {
      errors.push('Valid year is required (2020-2030)');
    }

    if (!Array.isArray(form.selected_benefits)) {
      errors.push('Selected benefits must be an array');
    } else if (form.selected_benefits.length === 0) {
      errors.push('At least one benefit must be selected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate benefit type creation form
   */
  validateBenefitType(form: CreateBenefitTypeForm): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!form.code || form.code.trim().length === 0) {
      errors.push('Benefit code is required');
    }

    if (!form.name || form.name.trim().length === 0) {
      errors.push('Benefit name is required');
    }

    if (!form.category) {
      errors.push('Benefit category is required');
    }

    if (!form.frequency) {
      errors.push('Benefit frequency is required');
    }

    if (!form.calculation_method) {
      errors.push('Calculation method is required');
    }

    if (form.calculation_method === 'FIXED' && (!form.base_amount || form.base_amount <= 0)) {
      errors.push('Base amount is required for fixed calculation method');
    }

    if (form.calculation_method === 'PERCENTAGE' && (!form.percentage_rate || form.percentage_rate <= 0)) {
      errors.push('Percentage rate is required for percentage calculation method');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export a singleton instance
export const compensationBenefitsService = new CompensationBenefitsService();