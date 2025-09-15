import type {
  TrainingProgram,
  Training,
  TrainingFilters,
  CreateTrainingProgramDTO,
  UpdateTrainingProgramDTO,
  CreateTrainingDTO,
  UpdateTrainingDTO,
  TrainingResponse,
  TrainingStatistics,
  EmployeeTrainingHistory,
  StatisticsFilters,
  TrainingApiResponse,
  TrainingsApiResponse,
  TrainingStatisticsApiResponse,
  EmployeeTrainingHistoryApiResponse
} from '../types/training';
import apiService from './api';

class TrainingService {
  // Training Programs Management
  
  /**
   * Get all training programs
   */
  async getTrainingPrograms(): Promise<TrainingProgram[]> {
    const response = await apiService.get<TrainingApiResponse<TrainingProgram[]>>('/training-programs');
    return response.data || [];
  }

  /**
   * Get a specific training program by ID
   */
  async getTrainingProgram(id: number): Promise<TrainingProgram> {
    const response = await apiService.get<TrainingApiResponse<TrainingProgram>>(`/training-programs/${id}`);
    if (!response.data) throw new Error('Training program not found');
    return response.data;
  }

  /**
   * Create a new training program (Admin only)
   */
  async createTrainingProgram(data: CreateTrainingProgramDTO): Promise<TrainingProgram> {
    const response = await apiService.post<TrainingApiResponse<TrainingProgram>>('/training-programs', data);
    if (!response.data) throw new Error('Failed to create training program');
    return response.data;
  }

  /**
   * Update an existing training program (Admin only)
   */
  async updateTrainingProgram(id: number, data: UpdateTrainingProgramDTO): Promise<TrainingProgram> {
    const response = await apiService.put<TrainingApiResponse<TrainingProgram>>(`/training-programs/${id}`, data);
    if (!response.data) throw new Error('Failed to update training program');
    return response.data;
  }

  /**
   * Delete a training program (Admin only)
   */
  async deleteTrainingProgram(id: number): Promise<void> {
    await apiService.delete(`/training-programs/${id}`);
  }

  // Training Records Management

  /**
   * Get training records with filtering and pagination
   */
  async getTrainings(filters: Partial<TrainingFilters> = {}): Promise<TrainingResponse> {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.employee_id && { employee_id: filters.employee_id }),
      ...(filters.training_program_id && { training_program_id: filters.training_program_id }),
      ...(filters.training_type && { training_type: filters.training_type }),
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
      ...(filters.year && { year: filters.year }),
      ...(filters.search && { search: filters.search }),
      ...(filters.certificate_issued !== undefined && { certificate_issued: filters.certificate_issued }),
      ...(filters.status && { status: filters.status }),
      ...(filters.sort_by && { sort_by: filters.sort_by }),
      ...(filters.sort_order && { sort_order: filters.sort_order }),
    };

    const response = await apiService.get<TrainingsApiResponse>('/trainings', params);
    
    // Handle both paginated and simple array responses
    if (response.data && Array.isArray(response.data)) {
      return {
        trainings: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: response.data.length,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    
    if (!response.data) {
      throw new Error('Failed to fetch training records');
    }
    return response.data;
  }

  /**
   * Get a specific training record by ID
   */
  async getTraining(id: number): Promise<Training> {
    const response = await apiService.get<TrainingApiResponse<Training>>(`/trainings/${id}`);
    if (!response.data) throw new Error('Training record not found');
    return response.data;
  }

  /**
   * Create a new training record
   */
  async createTraining(data: CreateTrainingDTO): Promise<Training> {
    const response = await apiService.post<TrainingApiResponse<Training>>('/trainings', data);
    if (!response.data) throw new Error('Failed to create training record');
    return response.data;
  }

  /**
   * Update an existing training record
   */
  async updateTraining(id: number, data: UpdateTrainingDTO): Promise<Training> {
    const response = await apiService.put<TrainingApiResponse<Training>>(`/trainings/${id}`, data);
    if (!response.data) throw new Error('Failed to update training record');
    return response.data;
  }

  /**
   * Delete a training record
   */
  async deleteTraining(id: number): Promise<void> {
    await apiService.delete(`/trainings/${id}`);
  }

  // Employee Training History

  /**
   * Get training history for a specific employee
   */
  async getEmployeeTrainingHistory(employeeId: number, filters: Partial<TrainingFilters> = {}): Promise<EmployeeTrainingHistory> {
    const params = {
      ...(filters.year && { year: filters.year }),
      ...(filters.training_type && { training_type: filters.training_type }),
      ...(filters.certificate_issued !== undefined && { certificate_issued: filters.certificate_issued }),
      ...(filters.sort_by && { sort_by: filters.sort_by }),
      ...(filters.sort_order && { sort_order: filters.sort_order }),
    };

    const response = await apiService.get<EmployeeTrainingHistoryApiResponse>(`/trainings/employee/${employeeId}`, params);
    if (!response.data) throw new Error('Employee training history not found');
    return response.data;
  }

  // Training Statistics and Analytics

  /**
   * Get training statistics with optional filtering
   */
  async getTrainingStatistics(filters: Partial<StatisticsFilters> = {}): Promise<TrainingStatistics> {
    const params = {
      ...(filters.employee_id && { employee_id: filters.employee_id }),
      ...(filters.training_type && { training_type: filters.training_type }),
      ...(filters.year && { year: filters.year }),
      ...(filters.start_date && { start_date: filters.start_date }),
      ...(filters.end_date && { end_date: filters.end_date }),
    };

    const response = await apiService.get<TrainingStatisticsApiResponse>('/trainings/statistics', params);
    if (!response.data) throw new Error('Training statistics not available');
    return response.data;
  }

  /**
   * Get dashboard statistics for current year
   */
  async getDashboardStatistics(): Promise<TrainingStatistics> {
    const currentYear = new Date().getFullYear();
    return this.getTrainingStatistics({ year: currentYear });
  }

  /**
   * Get training completion trends by month for a specific year
   */
  async getTrainingTrends(year?: number): Promise<Array<{ month: string; count: number; hours: number }>> {
    const filters = year ? { year } : {};
    const statistics = await this.getTrainingStatistics(filters);
    return statistics.byMonth || [];
  }

  /**
   * Get training type distribution
   */
  async getTrainingTypeDistribution(year?: number): Promise<TrainingStatistics['byTrainingType']> {
    const filters = year ? { year } : {};
    const statistics = await this.getTrainingStatistics(filters);
    return statistics.byTrainingType;
  }

  // Search and Filtering Helpers

  /**
   * Search training records by title, employee name, or organizer
   */
  async searchTrainings(query: string, filters: Partial<TrainingFilters> = {}): Promise<TrainingResponse> {
    return this.getTrainings({
      ...filters,
      search: query,
    });
  }

  /**
   * Get training records filtered by date range
   */
  async getTrainingsByDateRange(startDate: string, endDate: string, additionalFilters: Partial<TrainingFilters> = {}): Promise<TrainingResponse> {
    return this.getTrainings({
      ...additionalFilters,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get upcoming training records (starting from today)
   */
  async getUpcomingTrainings(filters: Partial<TrainingFilters> = {}): Promise<TrainingResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getTrainings({
      ...filters,
      start_date: today,
      sort_by: 'start_date',
      sort_order: 'asc',
    });
  }

  /**
   * Get completed training records
   */
  async getCompletedTrainings(filters: Partial<TrainingFilters> = {}): Promise<TrainingResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getTrainings({
      ...filters,
      end_date: today,
      sort_by: 'end_date',
      sort_order: 'desc',
    });
  }

  /**
   * Get training records with certificates
   */
  async getCertifiedTrainings(filters: Partial<TrainingFilters> = {}): Promise<TrainingResponse> {
    return this.getTrainings({
      ...filters,
      certificate_issued: true,
    });
  }

  // Validation Helpers

  /**
   * Validate training dates (ensure end date is after start date)
   */
  validateTrainingDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return {
        isValid: false,
        error: 'End date must be after start date',
      };
    }
    
    if (start < new Date('2020-01-01')) {
      return {
        isValid: false,
        error: 'Start date cannot be before 2020',
      };
    }
    
    return { isValid: true };
  }

  /**
   * Calculate training duration in hours based on dates
   */
  calculateDuration(startDate: string, endDate: string, hoursPerDay: number = 8): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays * hoursPerDay;
  }

  // Export Functionality (placeholder for future implementation)

  /**
   * Export training data to CSV
   */
  async exportTrainingsToCSV(filters: Partial<TrainingFilters> = {}): Promise<Blob> {
    // This would be implemented when backend supports export functionality
    const response = await apiService.get<string>('/trainings/export/csv', filters);
    return new Blob([response], { type: 'text/csv' });
  }

  /**
   * Export training statistics to PDF
   */
  async exportStatisticsToPDF(filters: Partial<StatisticsFilters> = {}): Promise<Blob> {
    // This would be implemented when backend supports export functionality
    const response = await apiService.get<ArrayBuffer>('/trainings/export/statistics-pdf', filters);
    return new Blob([response], { type: 'application/pdf' });
  }
}

// Create and export a singleton instance
export const trainingService = new TrainingService();
export default trainingService;