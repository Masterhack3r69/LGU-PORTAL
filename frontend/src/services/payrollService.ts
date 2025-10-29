import api from './api';
import type {
  PayrollPeriod,
  AllowanceType,
  DeductionType,
  PayrollItem,
  EmployeeOverride,
  EmployeeOverridesResponse,
  PayrollCalculationRequest,
  PayrollCalculationResult,
  PayslipData,
  PayrollSummary,
  PayrollFilter,
  PayrollResponse
} from '@/types/payroll';

class PayrollService {
  // Payroll Periods
  async getPeriods(): Promise<PayrollResponse<PayrollPeriod[]>> {
    return api.get<PayrollResponse<PayrollPeriod[]>>('/payroll/periods');
  }

  // Employee-specific periods (for employees to view their own payroll periods)
  async getEmployeePayrollPeriods(): Promise<PayrollResponse<PayrollPeriod[]>> {
    return api.get<PayrollResponse<PayrollPeriod[]>>('/payroll/employee/periods');
  }

  async getPeriod(id: number): Promise<PayrollResponse<PayrollPeriod>> {
    return api.get<PayrollResponse<PayrollPeriod>>(`/payroll/periods/${id}`);
  }

  async createPeriod(data: Partial<PayrollPeriod>): Promise<PayrollResponse<PayrollPeriod>> {
    return api.post<PayrollResponse<PayrollPeriod>>('/payroll/periods', data);
  }

  async updatePeriod(id: number, data: Partial<PayrollPeriod>): Promise<PayrollResponse<PayrollPeriod>> {
    return api.put<PayrollResponse<PayrollPeriod>>(`/payroll/periods/${id}`, data);
  }

  async finalizePeriod(id: number): Promise<PayrollResponse<PayrollPeriod>> {
    return api.post<PayrollResponse<PayrollPeriod>>(`/payroll/periods/${id}/finalize`);
  }

  async reopenPeriod(id: number): Promise<PayrollResponse<PayrollPeriod>> {
    return api.post<PayrollResponse<PayrollPeriod>>(`/payroll/periods/${id}/reopen`);
  }

  async cancelPeriod(id: number): Promise<PayrollResponse<{ period_id: number; deleted_items: number; new_status: string }>> {
    return api.post<PayrollResponse<{ period_id: number; deleted_items: number; new_status: string }>>(`/payroll/periods/${id}/cancel`);
  }

  async softDeletePeriod(id: number): Promise<PayrollResponse<void>> {
    return api.delete<PayrollResponse<void>>(`/payroll/periods/${id}/soft-delete`);
  }

  async deletePeriod(id: number): Promise<PayrollResponse<void>> {
    return api.delete<PayrollResponse<void>>(`/payroll/periods/${id}`);
  }

  // Allowance Types
  async getAllowanceTypes(): Promise<PayrollResponse<AllowanceType[]>> {
    return api.get<PayrollResponse<AllowanceType[]>>('/payroll/allowance-types');
  }

  async createAllowanceType(data: Partial<AllowanceType>): Promise<PayrollResponse<AllowanceType>> {
    return api.post<PayrollResponse<AllowanceType>>('/payroll/allowance-types', data);
  }

  async updateAllowanceType(id: number, data: Partial<AllowanceType>): Promise<PayrollResponse<AllowanceType>> {
    return api.put<PayrollResponse<AllowanceType>>(`/payroll/allowance-types/${id}`, data);
  }

  async deleteAllowanceType(id: number): Promise<PayrollResponse<void>> {
    return api.delete<PayrollResponse<void>>(`/payroll/allowance-types/${id}`);
  }

  async toggleAllowanceType(id: number): Promise<PayrollResponse<AllowanceType>> {
    return api.post<PayrollResponse<AllowanceType>>(`/payroll/allowance-types/${id}/toggle`);
  }

  // Deduction Types
  async getDeductionTypes(): Promise<PayrollResponse<DeductionType[]>> {
    return api.get<PayrollResponse<DeductionType[]>>('/payroll/deduction-types');
  }

  async createDeductionType(data: Partial<DeductionType>): Promise<PayrollResponse<DeductionType>> {
    return api.post<PayrollResponse<DeductionType>>('/payroll/deduction-types', data);
  }

  async updateDeductionType(id: number, data: Partial<DeductionType>): Promise<PayrollResponse<DeductionType>> {
    return api.put<PayrollResponse<DeductionType>>(`/payroll/deduction-types/${id}`, data);
  }

  async deleteDeductionType(id: number): Promise<PayrollResponse<void>> {
    return api.delete<PayrollResponse<void>>(`/payroll/deduction-types/${id}`);
  }

  async toggleDeductionType(id: number): Promise<PayrollResponse<DeductionType>> {
    return api.post<PayrollResponse<DeductionType>>(`/payroll/deduction-types/${id}/toggle`);
  }

  // Employee Overrides
  async getEmployeeOverrides(employeeId?: number): Promise<PayrollResponse<EmployeeOverridesResponse>> {
    const url = employeeId ? `/payroll/overrides?employee_id=${employeeId}` : '/payroll/overrides';
    return api.get<PayrollResponse<EmployeeOverridesResponse>>(url);
  }

  async createAllowanceOverride(data: Partial<EmployeeOverride>): Promise<PayrollResponse<EmployeeOverride>> {
    // Map frontend field names to backend expected field names
    const payload = {
      employee_id: data.employee_id,
      allowance_type_id: data.type_id,
      override_amount: data.amount,
      effective_date: data.effective_from,
      end_date: data.effective_to,
      is_active: data.is_active ?? true,
      created_by: data.created_by
    };

    return api.post<PayrollResponse<EmployeeOverride>>('/payroll/overrides/allowances', payload);
  }

  async createDeductionOverride(data: Partial<EmployeeOverride>): Promise<PayrollResponse<EmployeeOverride>> {
    // Map frontend field names to backend expected field names
    const payload = {
      employee_id: data.employee_id,
      deduction_type_id: data.type_id,
      override_amount: data.amount,
      effective_date: data.effective_from,
      end_date: data.effective_to,
      is_active: data.is_active ?? true,
      created_by: data.created_by
    };

    return api.post<PayrollResponse<EmployeeOverride>>('/payroll/overrides/deductions', payload);
  }

  async updateAllowanceOverride(id: number, data: Partial<EmployeeOverride>): Promise<PayrollResponse<EmployeeOverride>> {
    // Map frontend field names to backend expected field names
    const payload = {
      employee_id: data.employee_id,
      allowance_type_id: data.type_id,
      override_amount: data.amount,
      effective_date: data.effective_from,
      end_date: data.effective_to,
      is_active: data.is_active,
      created_by: data.created_by
    };

    return api.put<PayrollResponse<EmployeeOverride>>(`/payroll/overrides/allowances/${id}`, payload);
  }

  async updateDeductionOverride(id: number, data: Partial<EmployeeOverride>): Promise<PayrollResponse<EmployeeOverride>> {
    // Map frontend field names to backend expected field names
    const payload = {
      employee_id: data.employee_id,
      deduction_type_id: data.type_id,
      override_amount: data.amount,
      effective_date: data.effective_from,
      end_date: data.effective_to,
      is_active: data.is_active,
      created_by: data.created_by
    };

    return api.put<PayrollResponse<EmployeeOverride>>(`/payroll/overrides/deductions/${id}`, payload);
  }

  async deleteAllowanceOverride(id: number): Promise<PayrollResponse<void>> {
    return api.delete<PayrollResponse<void>>(`/payroll/overrides/allowances/${id}`);
  }

  async deleteDeductionOverride(id: number): Promise<PayrollResponse<void>> {
    return api.delete<PayrollResponse<void>>(`/payroll/overrides/deductions/${id}`);
  }

  // Payroll Items
  async getPayrollItems(filter: PayrollFilter = {}): Promise<PayrollResponse<PayrollItem[]>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    return api.get<PayrollResponse<PayrollItem[]>>(`/payroll/items?${params.toString()}`);
  }

  // Employee-specific payroll items (for employees to view their own payroll items)
  async getEmployeePayrollItems(filter: PayrollFilter = {}): Promise<PayrollResponse<PayrollItem[]>> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    return api.get<PayrollResponse<PayrollItem[]>>(`/payroll/employee/items?${params.toString()}`);
  }

  async getPayrollItem(id: number): Promise<PayrollResponse<PayrollItem>> {
    return api.get<PayrollResponse<PayrollItem>>(`/payroll/items/${id}`);
  }

  async updatePayrollItem(id: number, data: Partial<PayrollItem>): Promise<PayrollResponse<PayrollItem>> {
    return api.put<PayrollResponse<PayrollItem>>(`/payroll/items/${id}`, data);
  }

  async approvePayrollItem(id: number): Promise<PayrollResponse<PayrollItem>> {
    return api.post<PayrollResponse<PayrollItem>>(`/payroll/items/${id}/finalize`);
  }

  async markAsPaid(id: number): Promise<PayrollResponse<PayrollItem>> {
    return api.post<PayrollResponse<PayrollItem>>(`/payroll/items/${id}/mark-paid`);
  }

  // Payroll Calculations
  async calculatePayroll(data: PayrollCalculationRequest): Promise<PayrollResponse<PayrollCalculationResult>> {
    const { period_id, employee_ids, employees_data } = data;

    // Use the new DTR-integrated endpoint that automatically uses imported DTR data
    // This endpoint will process payroll using the DTR records that were imported
    return api.post<PayrollResponse<PayrollCalculationResult>>(`/payroll/periods/${period_id}/process-with-dtr`, {
      employee_ids: employee_ids || [],
      employees_data: employees_data || []
    });
  }

  async recalculatePayroll(data: PayrollCalculationRequest): Promise<PayrollResponse<PayrollCalculationResult>> {
    return api.post<PayrollResponse<PayrollCalculationResult>>('/payroll/recalculate', data);
  }

  // Payslips
  async getEmployeePayslip(periodId: number, employeeId?: number): Promise<PayrollResponse<PayslipData>> {
    const url = employeeId 
      ? `/payroll/payslips/${periodId}/${employeeId}`
      : `/payroll/employee/payslip/${periodId}`; // Use employee-specific endpoint
    return api.get<PayrollResponse<PayslipData>>(url);
  }

  async downloadPayslip(periodId: number, employeeId?: number): Promise<Blob> {
    const url = employeeId
      ? `/payroll/payslips/${periodId}/${employeeId}/download`
      : `/payroll/employee/payslip/${periodId}/download`; // Use employee-specific endpoint
    return api.get<Blob>(url, { responseType: 'blob' });
  }

  // New PDF payslip generation methods
  async generatePayslipPDF(payrollItemId: number): Promise<Blob> {
    const response = await api.get<Blob>(`/payroll/items/${payrollItemId}/payslip`, {
      responseType: 'blob'
    });
    
    // Validate the blob response
    if (!(response instanceof Blob)) {
      throw new Error('Invalid response format: Expected blob');
    }
    
    if (response.size === 0) {
      throw new Error('Empty PDF file received');
    }
    
    return response;
  }



  async downloadPayslipAsBase64(payrollItemId: number): Promise<PayrollResponse<{
    payslip_id: string;
    generated_at: string;
    generated_by: string;
    pdf_data: string;
    file_name: string;
    mime_type: string;
  }>> {
    return api.post<PayrollResponse<{
      payslip_id: string;
      generated_at: string;
      generated_by: string;
      pdf_data: string;
      file_name: string;
      mime_type: string;
    }>>(`/payroll/items/${payrollItemId}/download-payslip`);
  }

  // Payroll Summary
  async getPayrollSummary(periodId: number): Promise<PayrollResponse<PayrollSummary>> {
    return api.get<PayrollResponse<PayrollSummary>>(`/payroll/periods/${periodId}/summary`);
  }

  // Bulk Operations
  async bulkApprovePayroll(periodId: number, employeeIds?: number[]): Promise<PayrollResponse<PayrollCalculationResult>> {
    return api.post<PayrollResponse<PayrollCalculationResult>>(`/payroll/periods/${periodId}/bulk-approve`, { employee_ids: employeeIds });
  }

  async bulkMarkAsPaid(periodId: number, employeeIds?: number[]): Promise<PayrollResponse<PayrollCalculationResult>> {
    return api.post<PayrollResponse<PayrollCalculationResult>>(`/payroll/periods/${periodId}/bulk-mark-paid`, { employee_ids: employeeIds });
  }

  // Reports
  async generatePayrollReport(periodId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    return api.get<Blob>(`/payroll/periods/${periodId}/report?format=${format}`, { 
      responseType: 'blob' 
    });
  }

  async generatePayslipBatch(periodId: number, employeeIds?: number[]): Promise<Blob> {
    return api.post<Blob>(`/payroll/periods/${periodId}/payslips/batch`,
      { employee_ids: employeeIds },
      { responseType: 'blob' }
    );
  }

  // Payroll Adjustments
  async adjustWorkingDays(payrollItemId: number, workingDays: number, reason?: string): Promise<PayrollResponse<PayrollItem>> {
    return api.post<PayrollResponse<PayrollItem>>(`/payroll/items/${payrollItemId}/adjust-working-days`, {
      working_days: workingDays,
      reason: reason
    });
  }

  async addManualAdjustment(
    payrollItemId: number,
    adjustmentType: 'Allowance' | 'Deduction' | 'Adjustment',
    description: string,
    amount: number,
    reason?: string
  ): Promise<PayrollResponse<PayrollItem>> {
    return api.post<PayrollResponse<PayrollItem>>(`/payroll/items/${payrollItemId}/manual-adjustment`, {
      adjustment_type: adjustmentType,
      description: description,
      amount: amount,
      reason: reason
    });
  }
}

export const payrollService = new PayrollService();
export default payrollService;