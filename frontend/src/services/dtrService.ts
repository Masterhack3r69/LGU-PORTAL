import api from './api';

export interface DTRPreviewData {
  isValid: boolean;
  totalRecords: number;
  validRecords: DTRRecord[];
  invalidRecords: DTRValidationError[];
  warningRecords: DTRWarning[];
  canProceed: boolean;
  summary: {
    totalEmployees: number;
    totalWorkingDays: number;
    estimatedBasicPay: number;
  };
  reimportInfo?: {
    isReimport: boolean;
    requiresWarning: boolean;
    warningMessage?: string;
    additionalWarning?: string;
    lastImport?: {
      id: number;
      file_name: string;
      imported_at: string;
      valid_records: number;
      imported_by_username: string;
    };
    payrollStatus?: string;
    canReimport?: boolean;
    preventionReason?: string;
    message?: string;
  };
}

export interface DTRRecord {
  employeeNumber: string;
  employeeName: string;
  position: string;
  workingDays: number;
  startDate: string;
  endDate: string;
}

export interface DTRValidationError {
  row: number;
  employeeNumber: string;
  field: string;
  message: string;
  value?: any;
}

export interface DTRWarning {
  row: number;
  employeeNumber: string;
  message: string;
  value?: any;
}

export interface DTRRecordDetail {
  id: number;
  payrollPeriodId: number;
  employeeId: number;
  employeeNumber: string;
  employeeName: string;
  position: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  importBatchId: number;
  status: 'Active' | 'Superseded' | 'Deleted';
  notes?: string;
  importedBy: number;
  importedByUsername: string;
  importedAt: string;
  importFileName: string;
  updatedBy?: number;
  updatedByUsername?: string;
  updatedAt?: string;
}

export interface DTRRecordUpdate {
  workingDays?: number;
  notes?: string;
}

export interface DTRImportBatch {
  id: number;
  payroll_period_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  warning_records: number;
  status: 'Processing' | 'Completed' | 'Partial' | 'Failed';
  error_log?: {
    errors: Array<{
      row: number;
      employeeNumber: string;
      field: string;
      message: string;
      value?: any;
    }>;
    warnings: Array<{
      row: number;
      employeeNumber: string;
      message: string;
      value?: any;
    }>;
  };
  imported_by: number;
  imported_by_username: string;
  imported_by_email?: string;
  imported_at: string;
  completed_at?: string;
  created_at: string;
}

export interface DTRRecordFilters {
  employeeNumber?: string;
  employeeName?: string;
  status?: 'Active' | 'Superseded' | 'Deleted';
  minWorkingDays?: number;
  maxWorkingDays?: number;
}

export interface DTRStats {
  totalEmployees: number;
  totalWorkingDays: number;
  averageWorkingDays: number;
  estimatedBasicPay: number;
  lastImportDate?: string;
  lastImportBy?: string;
  hasActiveRecords: boolean;
  hasImport: boolean;
}

class DTRService {
  /**
   * Export DTR template for a specific payroll period
   * @param periodId - The payroll period ID
   * @returns Blob containing the Excel file
   */
  async exportTemplate(periodId: number): Promise<Blob> {
    return api.get<Blob>(`/dtr/template/${periodId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Upload DTR file for validation and preview
   * @param periodId - The payroll period ID
   * @param file - The Excel file to upload
   * @returns Preview data with validation results
   */
  async uploadDTRFile(periodId: number, file: File): Promise<DTRPreviewData> {
    const formData = new FormData();
    formData.append('file', file);



    try {
      const response = await api.post<{ success: boolean; data: DTRPreviewData; message: string; timestamp: string }>(
        `/dtr/import/${periodId}`,
        formData
      );

      // api.post returns { success, data, message, timestamp }
      // The 'data' property contains the actual preview data we need
      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Confirm and process DTR import
   * @param periodId - The payroll period ID
   * @returns Import summary with batch information
   */
  async confirmImport(periodId: number): Promise<{
    batchId: number;
    recordsImported: number;
    message: string;
  }> {
    const response = await api.post<{
      success: boolean;
      data: {
        batchId: number;
        recordsImported: number;
      };
      message: string;
    }>(`/dtr/import/${periodId}/confirm`);

    return {
      batchId: response.data.batchId,
      recordsImported: response.data.recordsImported,
      message: response.message,
    };
  }

  /**
   * Get DTR records for a specific payroll period
   * @param periodId - The payroll period ID
   * @param filters - Optional filters for the records
   * @returns Array of DTR records
   */
  async getDTRRecords(periodId: number, filters?: DTRRecordFilters): Promise<DTRRecordDetail[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.employeeNumber) params.append('employeeNumber', filters.employeeNumber);
      if (filters.employeeName) params.append('employeeName', filters.employeeName);
      if (filters.status) params.append('status', filters.status);
      if (filters.minWorkingDays !== undefined) params.append('minWorkingDays', filters.minWorkingDays.toString());
      if (filters.maxWorkingDays !== undefined) params.append('maxWorkingDays', filters.maxWorkingDays.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/dtr/records/${periodId}?${queryString}` : `/dtr/records/${periodId}`;
    
    const response = await api.get<{ 
      success: boolean; 
      data: { 
        records: DTRRecordDetail[];
        pagination: {
          total: number;
          page: number;
          pageSize: number;
          hasMore: boolean;
        };
      } 
    }>(url);
    
    // Return the records array from the data object
    return response.data.records || [];
  }

  /**
   * Update a DTR record
   * @param recordId - The DTR record ID
   * @param updates - The fields to update
   * @returns Updated DTR record
   */
  async updateDTRRecord(recordId: number, updates: DTRRecordUpdate): Promise<DTRRecordDetail> {
    const response = await api.put<{ success: boolean; data: DTRRecordDetail }>(
      `/dtr/records/${recordId}`,
      updates
    );
    return response.data;
  }

  /**
   * Delete a DTR record (soft delete)
   * @param recordId - The DTR record ID
   * @returns Success message
   */
  async deleteDTRRecord(recordId: number): Promise<{ message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/dtr/records/${recordId}`
    );
    return { message: response.message };
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format datetime for display
   * @param dateString - ISO datetime string
   * @returns Formatted datetime string
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get import history for a payroll period
   * @param periodId - The payroll period ID
   * @returns Array of import batches
   */
  async getImportHistory(periodId: number): Promise<DTRImportBatch[]> {
    const response = await api.get<{ success: boolean; data: DTRImportBatch[] }>(
      `/dtr/imports/${periodId}`
    );
    return response.data;
  }

  /**
   * Get detailed information about an import batch
   * @param batchId - The import batch ID
   * @returns Batch details with error log
   */
  async getImportBatchDetails(batchId: number): Promise<DTRImportBatch> {
    const response = await api.get<{ success: boolean; data: DTRImportBatch }>(
      `/dtr/imports/batch/${batchId}`
    );
    return response.data;
  }

  /**
   * Get DTR statistics for a payroll period
   * @param periodId - The payroll period ID
   * @returns Statistics summary
   */
  async getDTRStats(periodId: number): Promise<DTRStats> {
    const response = await api.get<{ success: boolean; data: DTRStats }>(
      `/dtr/stats/${periodId}`
    );
    return response.data;
  }
}

export const dtrService = new DTRService();
export default dtrService;
