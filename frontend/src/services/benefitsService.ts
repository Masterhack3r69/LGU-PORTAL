import api from './api';
import type {
  BenefitType,
  BenefitCycle,
  BenefitItem,
  BenefitAdjustment,
  BenefitCalculationRequest,
  BenefitCalculationResult,
  BenefitSummary,
  BenefitFilter,
  BenefitStatistics,
  EligibleEmployee,
  BenefitPreviewRequest,
  BenefitPreviewResult,
  BulkOperationRequest,
  BulkOperationResult,
  BenefitReportFilter,
  BenefitResponse
} from '@/types/benefits';

class BenefitsService {
  // Benefit Types Management
  async getBenefitTypes(): Promise<BenefitResponse<BenefitType[]>> {
    return api.get<BenefitResponse<BenefitType[]>>('/benefits/types');
  }

  async getBenefitType(id: number): Promise<BenefitResponse<BenefitType>> {
    return api.get<BenefitResponse<BenefitType>>(`/benefits/types/${id}`);
  }

  async createBenefitType(data: Partial<BenefitType>): Promise<BenefitResponse<BenefitType>> {
    return api.post<BenefitResponse<BenefitType>>('/benefits/types', data);
  }

  async updateBenefitType(id: number, data: Partial<BenefitType>): Promise<BenefitResponse<BenefitType>> {
    return api.put<BenefitResponse<BenefitType>>(`/benefits/types/${id}`, data);
  }

  async toggleBenefitType(id: number): Promise<BenefitResponse<BenefitType>> {
    return api.post<BenefitResponse<BenefitType>>(`/benefits/types/${id}/toggle`);
  }

  async deleteBenefitType(id: number): Promise<BenefitResponse<void>> {
    return api.delete<BenefitResponse<void>>(`/benefits/types/${id}`);
  }

  // Benefit Cycles Management
  async getBenefitCycles(): Promise<BenefitResponse<BenefitCycle[]>> {
    return api.get<BenefitResponse<BenefitCycle[]>>('/benefits/cycles');
  }

  async getBenefitCycle(id: number): Promise<BenefitResponse<BenefitCycle>> {
    return api.get<BenefitResponse<BenefitCycle>>(`/benefits/cycles/${id}`);
  }

  async createBenefitCycle(data: Partial<BenefitCycle>): Promise<BenefitResponse<BenefitCycle>> {
    return api.post<BenefitResponse<BenefitCycle>>('/benefits/cycles', data);
  }

  async updateBenefitCycle(id: number, data: Partial<BenefitCycle>): Promise<BenefitResponse<BenefitCycle>> {
    return api.put<BenefitResponse<BenefitCycle>>(`/benefits/cycles/${id}`, data);
  }

  async processBenefitCycle(id: number): Promise<BenefitResponse<BenefitCycle>> {
    return api.post<BenefitResponse<BenefitCycle>>(`/benefits/cycles/${id}/process`);
  }

  async finalizeBenefitCycle(id: number): Promise<BenefitResponse<BenefitCycle>> {
    return api.post<BenefitResponse<BenefitCycle>>(`/benefits/cycles/${id}/finalize`);
  }

  async releaseBenefitCycle(id: number): Promise<BenefitResponse<BenefitCycle>> {
    return api.post<BenefitResponse<BenefitCycle>>(`/benefits/cycles/${id}/release`);
  }

  async cancelBenefitCycle(id: number): Promise<BenefitResponse<BenefitCycle>> {
    return api.post<BenefitResponse<BenefitCycle>>(`/benefits/cycles/${id}/cancel`);
  }

  async deleteBenefitCycle(id: number): Promise<BenefitResponse<void>> {
    return api.delete<BenefitResponse<void>>(`/benefits/cycles/${id}`);
  }

  // Benefit Cycle Processing
  async getBenefitItems(cycleId: number, filter: BenefitFilter = {}): Promise<BenefitResponse<BenefitItem[]>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return api.get<BenefitResponse<BenefitItem[]>>(`/benefits/cycles/${cycleId}/items?${params.toString()}`);
  }

  async calculateBenefits(data: BenefitCalculationRequest & { manual_amounts?: {[key: number]: string} }): Promise<BenefitResponse<BenefitCalculationResult>> {
    const { cycle_id, employee_ids, manual_amounts } = data;

    const requestData: {
      employee_ids?: number[];
      manual_amounts?: {[key: number]: string};
    } = {};
    
    if (employee_ids && employee_ids.length > 0) {
      requestData.employee_ids = employee_ids;
    }
    if (manual_amounts) {
      requestData.manual_amounts = manual_amounts;
    }

    return api.post<BenefitResponse<BenefitCalculationResult>>(`/benefits/cycles/${cycle_id}/calculate`, requestData);
  }

  // Benefit Items Management
  async getAllBenefitItems(filter: BenefitFilter = {}): Promise<BenefitResponse<BenefitItem[]>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return api.get<BenefitResponse<BenefitItem[]>>(`/benefits/items?${params.toString()}`);
  }

  async getBenefitItem(id: number): Promise<BenefitResponse<BenefitItem>> {
    return api.get<BenefitResponse<BenefitItem>>(`/benefits/items/${id}`);
  }

  async updateBenefitItem(id: number, data: Partial<BenefitItem>): Promise<BenefitResponse<BenefitItem>> {
    return api.put<BenefitResponse<BenefitItem>>(`/benefits/items/${id}`, data);
  }

  async approveBenefitItem(id: number): Promise<BenefitResponse<BenefitItem>> {
    return api.post<BenefitResponse<BenefitItem>>(`/benefits/items/${id}/approve`);
  }

  async markBenefitAsPaid(id: number, paymentReference?: string): Promise<BenefitResponse<BenefitItem>> {
    return api.post<BenefitResponse<BenefitItem>>(`/benefits/items/${id}/mark-paid`, {
      payment_reference: paymentReference
    });
  }

  async addBenefitAdjustment(id: number, data: Partial<BenefitAdjustment>): Promise<BenefitResponse<BenefitItem>> {
    return api.post<BenefitResponse<BenefitItem>>(`/benefits/items/${id}/adjustment`, data);
  }

  async generateBenefitSlip(id: number): Promise<Blob> {
    return api.post<Blob>(`/benefits/items/${id}/generate-slip`, {}, {
      responseType: 'blob'
    });
  }

  // Employee-Specific Routes
  async getEmployeeBenefitItems(employeeId: number): Promise<BenefitResponse<BenefitItem[]>> {
    return api.get<BenefitResponse<BenefitItem[]>>(`/benefits/employees/${employeeId}/items`);
  }

  // Utility Routes
  async getEligibleEmployees(benefitTypeId: number, cycleYear?: number): Promise<BenefitResponse<EligibleEmployee[]>> {
    const params = cycleYear ? `?cycle_year=${cycleYear}` : '';
    return api.get<BenefitResponse<EligibleEmployee[]>>(`/benefits/types/${benefitTypeId}/eligible-employees${params}`);
  }

  async previewBenefitCalculation(data: BenefitPreviewRequest): Promise<BenefitResponse<BenefitPreviewResult[]>> {
    return api.post<BenefitResponse<BenefitPreviewResult[]>>(`/benefits/types/${data.benefit_type_id}/preview`, data);
  }

  async getBenefitStatistics(): Promise<BenefitResponse<BenefitStatistics>> {
    return api.get<BenefitResponse<BenefitStatistics>>('/benefits/statistics');
  }

  // Bulk Operations
  async bulkApproveBenefits(data: BulkOperationRequest): Promise<BenefitResponse<BulkOperationResult>> {
    return api.post<BenefitResponse<BulkOperationResult>>('/benefits/items/bulk-approve', data);
  }

  async bulkMarkBenefitsAsPaid(data: BulkOperationRequest & { payment_reference?: string }): Promise<BenefitResponse<BulkOperationResult>> {
    return api.post<BenefitResponse<BulkOperationResult>>('/benefits/items/bulk-mark-paid', data);
  }

  async bulkGenerateBenefitSlips(data: BulkOperationRequest): Promise<Blob> {
    return api.post<Blob>('/benefits/items/bulk-generate-slips', data, {
      responseType: 'blob'
    });
  }

  // Benefit Slips
  async downloadBenefitSlip(benefitItemId: number): Promise<Blob> {
    return api.get<Blob>(`/benefits/items/${benefitItemId}/download-slip`, {
      responseType: 'blob'
    });
  }

  async downloadBenefitSlipAsBase64(benefitItemId: number): Promise<BenefitResponse<{
    slip_id: string;
    generated_at: string;
    generated_by: string;
    pdf_data: string;
    file_name: string;
    mime_type: string;
  }>> {
    return api.post<BenefitResponse<{
      slip_id: string;
      generated_at: string;
      generated_by: string;
      pdf_data: string;
      file_name: string;
      mime_type: string;
    }>>(`/benefits/items/${benefitItemId}/download-slip-base64`);
  }

  // Reports and Analytics
  async getBenefitSummary(cycleId: number): Promise<BenefitResponse<BenefitSummary>> {
    return api.get<BenefitResponse<BenefitSummary>>(`/benefits/cycles/${cycleId}/summary`);
  }

  async generateBenefitReport(filter: BenefitReportFilter, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    params.append('format', format);

    return api.get<Blob>(`/benefits/reports/summary?${params.toString()}`, {
      responseType: 'blob'
    });
  }

  async generateCycleReport(cycleId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    return api.get<Blob>(`/benefits/reports/cycle/${cycleId}?format=${format}`, {
      responseType: 'blob'
    });
  }

  async generateEmployeeBenefitHistory(employeeId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    return api.get<Blob>(`/benefits/reports/employee/${employeeId}?format=${format}`, {
      responseType: 'blob'
    });
  }

  // Helper Methods
  async getBenefitTypesByCategory(category: string): Promise<BenefitResponse<BenefitType[]>> {
    const response = await this.getBenefitTypes();
    if (response.success && response.data) {
      const filtered = response.data.filter(type => type.category === category);
      return { ...response, data: filtered };
    }
    return response;
  }

  async getActiveBenefitCycles(): Promise<BenefitResponse<BenefitCycle[]>> {
    const response = await this.getBenefitCycles();
    if (response.success && response.data) {
      const filtered = response.data.filter(cycle => cycle.status !== 'Cancelled');
      return { ...response, data: filtered };
    }
    return response;
  }

  async getPendingBenefitItems(): Promise<BenefitResponse<BenefitItem[]>> {
    return this.getAllBenefitItems({ status: 'Draft' });
  }

  async getApprovedBenefitItems(): Promise<BenefitResponse<BenefitItem[]>> {
    return this.getAllBenefitItems({ status: 'Approved' });
  }
}

export const benefitsService = new BenefitsService();
export default benefitsService;