import { apiService } from './api';
import type { AuditLogFilters, AuditLogResponse } from '@/types/audit';

export const auditService = {
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.user_id) params.append('user_id', filters.user_id.toString());
    if (filters.table_name) params.append('table_name', filters.table_name);
    if (filters.action) params.append('action', filters.action);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const response = await apiService.get<AuditLogResponse>(`/reports/audit-logs?${params.toString()}`);
    return response;
  },
};