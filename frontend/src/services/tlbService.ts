// services/tlbService.ts - Terminal Leave Benefits API service
import { apiService } from './api';
import type {
  TLBRecord,
  TLBCalculation,
  TLBStatistics,
  TLBSummaryReport,
  TLBFilters,
  CreateTLBRecordForm,
  UpdateTLBRecordForm,
  TLBCalculationRequest,
  TLBApiResponse,
} from '@/types/tlb';

class TLBService {
  private readonly baseUrl = '/tlb';

  // Statistics and Calculation Routes
  async getStatistics(year?: number): Promise<TLBStatistics> {
    const params = year ? { year } : {};
    const response = await apiService.get<TLBApiResponse<TLBStatistics>>(
      `${this.baseUrl}/statistics`,
      params
    );
    return response.data;
  }

  async calculateTLB(request: TLBCalculationRequest): Promise<TLBCalculation> {
    const { employeeId, separationDate, claimDate } = request;
    const response = await apiService.get<TLBApiResponse<TLBCalculation>>(
      `${this.baseUrl}/employee/${employeeId}/calculation`,
      { separationDate, claimDate }
    );
    return response.data;
  }

  async getSummaryReport(year?: number, status?: string): Promise<TLBSummaryReport> {
    const params: Record<string, unknown> = {};
    if (year) params.year = year;
    if (status) params.status = status;
    
    const response = await apiService.get<TLBApiResponse<TLBSummaryReport>>(
      `${this.baseUrl}/reports/summary`,
      params
    );
    return response.data;
  }

  // CRUD Operations
  async getTLBRecords(filters: TLBFilters = {}): Promise<TLBApiResponse<TLBRecord[]>> {
    const response = await apiService.get<TLBApiResponse<TLBRecord[]>>(
      this.baseUrl,
      filters as Record<string, unknown>
    );
    return response;
  }

  async getTLBRecord(id: number): Promise<TLBRecord> {
    const response = await apiService.get<TLBApiResponse<TLBRecord>>(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  async createTLBRecord(data: CreateTLBRecordForm): Promise<TLBRecord> {
    const response = await apiService.post<TLBApiResponse<TLBRecord>>(
      this.baseUrl,
      data
    );
    return response.data;
  }

  async updateTLBRecord(id: number, data: UpdateTLBRecordForm): Promise<TLBRecord> {
    const response = await apiService.put<TLBApiResponse<TLBRecord>>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data;
  }

  async deleteTLBRecord(id: number): Promise<void> {
    await apiService.delete<TLBApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      'Computed': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Paid': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }
}

export const tlbService = new TLBService();
export default tlbService;