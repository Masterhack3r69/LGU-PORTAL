import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import dtrService, {
  DTRPreviewData,
  DTRRecordDetail,
  DTRRecordUpdate,
  DTRRecordFilters,
  DTRImportBatch,
  DTRStats,
} from '@/services/dtrService';

// Query Keys
export const dtrKeys = {
  all: ['dtr'] as const,
  records: (periodId: number, filters?: DTRRecordFilters) => 
    [...dtrKeys.all, 'records', periodId, filters] as const,
  importHistory: (periodId: number) => 
    [...dtrKeys.all, 'import-history', periodId] as const,
  batchDetails: (batchId: number) => 
    [...dtrKeys.all, 'batch-details', batchId] as const,
  stats: (periodId: number) => 
    [...dtrKeys.all, 'stats', periodId] as const,
};

/**
 * Hook to export DTR template
 * Downloads an Excel template for a specific payroll period
 */
export function useExportTemplate() {
  return useMutation({
    mutationFn: async (periodId: number) => {
      const blob = await dtrService.exportTemplate(periodId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DTR_Template_Period_${periodId}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Template exported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to export template');
    },
  });
}

/**
 * Hook to upload DTR file for validation
 * Uploads an Excel file and returns validation preview
 */
export function useUploadDTR(
  options?: UseMutationOptions<DTRPreviewData, Error, { periodId: number; file: File }>
) {
  return useMutation({
    mutationFn: ({ periodId, file }: { periodId: number; file: File }) => 
      dtrService.uploadDTRFile(periodId, file),
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to upload DTR file');
    },
    ...options,
  });
}

/**
 * Hook to confirm DTR import
 * Processes the validated DTR data and saves to database
 */
export function useConfirmImport(
  options?: UseMutationOptions<
    { batchId: number; recordsImported: number; message: string },
    Error,
    number
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (periodId: number) => dtrService.confirmImport(periodId),
    onSuccess: (data, periodId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: dtrKeys.records(periodId) });
      queryClient.invalidateQueries({ queryKey: dtrKeys.importHistory(periodId) });
      queryClient.invalidateQueries({ queryKey: dtrKeys.stats(periodId) });
      
      toast.success(data.message || 'DTR imported successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to confirm import');
    },
    ...options,
  });
}

/**
 * Hook to fetch DTR records for a payroll period
 * Supports filtering and caching
 */
export function useDTRRecords(
  periodId: number,
  filters?: DTRRecordFilters,
  options?: Omit<UseQueryOptions<DTRRecordDetail[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dtrKeys.records(periodId, filters),
    queryFn: () => dtrService.getDTRRecords(periodId, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!periodId,
    ...options,
  });
}

/**
 * Hook to update a DTR record
 * Updates working days or notes for a specific record
 */
export function useUpdateDTRRecord(
  options?: UseMutationOptions<
    DTRRecordDetail,
    Error,
    { recordId: number; updates: DTRRecordUpdate; periodId: number }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, updates }: { recordId: number; updates: DTRRecordUpdate }) =>
      dtrService.updateDTRRecord(recordId, updates),
    onSuccess: (data, variables) => {
      // Invalidate and refetch DTR records for the period
      queryClient.invalidateQueries({ queryKey: dtrKeys.records(variables.periodId) });
      queryClient.invalidateQueries({ queryKey: dtrKeys.stats(variables.periodId) });
      
      toast.success('DTR record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update DTR record');
    },
    ...options,
  });
}

/**
 * Hook to delete a DTR record
 * Performs soft delete (sets status to 'Deleted')
 */
export function useDeleteDTRRecord(
  options?: UseMutationOptions<
    { message: string },
    Error,
    { recordId: number; periodId: number }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId }: { recordId: number }) =>
      dtrService.deleteDTRRecord(recordId),
    onSuccess: (data, variables) => {
      // Invalidate and refetch DTR records for the period
      queryClient.invalidateQueries({ queryKey: dtrKeys.records(variables.periodId) });
      queryClient.invalidateQueries({ queryKey: dtrKeys.stats(variables.periodId) });
      
      toast.success(data.message || 'DTR record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete DTR record');
    },
    ...options,
  });
}

/**
 * Hook to fetch import history for a payroll period
 * Returns all import batches with their status and metadata
 */
export function useImportHistory(
  periodId: number,
  options?: Omit<UseQueryOptions<DTRImportBatch[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dtrKeys.importHistory(periodId),
    queryFn: () => dtrService.getImportHistory(periodId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!periodId,
    ...options,
  });
}

/**
 * Hook to fetch detailed information about an import batch
 * Includes error logs and validation details
 */
export function useImportBatchDetails(
  batchId: number,
  options?: Omit<UseQueryOptions<DTRImportBatch, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dtrKeys.batchDetails(batchId),
    queryFn: () => dtrService.getImportBatchDetails(batchId),
    staleTime: 1000 * 60 * 10, // 10 minutes (batch details don't change)
    enabled: !!batchId,
    ...options,
  });
}

/**
 * Hook to fetch DTR statistics for a payroll period
 * Returns summary statistics like total employees, working days, etc.
 */
export function useDTRStats(
  periodId: number,
  options?: Omit<UseQueryOptions<DTRStats, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: dtrKeys.stats(periodId),
    queryFn: () => dtrService.getDTRStats(periodId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!periodId,
    ...options,
  });
}
