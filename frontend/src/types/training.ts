// Training Management System Types
// Based on the comprehensive documentation and backend schema

import type { ApiResponse } from './api';

// Enums for training types
export type TrainingType = 'Internal' | 'External' | 'Online' | 'Seminar' | 'Workshop';

export type TrainingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

// Training Program Interface
export interface TrainingProgram {
  id: number;
  title: string;
  description?: string;
  duration_hours?: number;
  training_type: TrainingType;
  created_at: string;
  updated_at?: string;
}

// Training Record Interface
export interface Training {
  id: number;
  employee_id: number;
  training_program_id?: number;
  training_title: string;
  start_date: string;
  end_date: string;
  duration_hours?: number;
  venue?: string;
  organizer?: string;
  certificate_issued: boolean;
  certificate_number?: string;
  status?: TrainingStatus;
  created_at: string;
  updated_at?: string;
  
  // Joined fields from backend
  employee_name?: string;
  employee_number?: string;
  program_title?: string;
  training_type?: TrainingType;
}

// Filter interfaces
export interface TrainingFilters {
  employee_id?: number;
  training_program_id?: number;
  training_type?: TrainingType;
  start_date?: string;
  end_date?: string;
  year?: number;
  search?: string;
  certificate_issued?: boolean;
  status?: TrainingStatus;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface StatisticsFilters {
  employee_id?: number;
  training_type?: TrainingType;
  year?: number;
  start_date?: string;
  end_date?: string;
}

// Response interfaces
export interface TrainingResponse {
  trainings: Training[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TrainingProgramResponse {
  programs: TrainingProgram[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Statistics interfaces
export interface TrainingStatisticsSummary {
  total_trainings: number;
  employees_trained: number;
  avg_duration: string;
  total_hours: string;
  certificates_issued: number;
}

export interface TrainingTypeStatistic {
  training_type: string;
  count: number;
}

export interface TrainingTrendStatistic {
  month: string;
  count: number;
}

export interface EmployeeTrainingStatistic {
  employee_id: number;
  employee_name: string;
  count: number;
  hours: string;
  certificates: number;
}

export interface TrainingStatistics {
  summary: TrainingStatisticsSummary;
  by_type: TrainingTypeStatistic[];
  trends: TrainingTrendStatistic[];
  by_employee?: EmployeeTrainingStatistic[];
}

// Legacy interface for backward compatibility
export interface LegacyTrainingStatistics {
  totalTrainings: number;
  completedTrainings: number;
  inProgressTrainings: number;
  scheduledTrainings: number;
  totalHours: number;
  averageHours: number;
  certificatesIssued: number;
  byTrainingType: {
    [key in TrainingType]: {
      count: number;
      hours: number;
      certificates: number;
    };
  };
  byMonth: Array<{
    month: string;
    count: number;
    hours: number;
  }>;
  byEmployee?: Array<{
    employee_id: number;
    employee_name: string;
    count: number;
    hours: number;
    certificates: number;
  }>;
}

export interface EmployeeTrainingHistory {
  employee: {
    id: number;
    name: string;
    employee_number: string;
    department?: string;
  };
  trainings: Training[];
  statistics: {
    totalTrainings: number;
    totalHours: number;
    certificatesEarned: number;
    latestTraining?: Training;
    upcomingTrainings: Training[];
  };
}

// Create/Update DTOs
export interface CreateTrainingProgramDTO {
  title: string;
  description?: string;
  duration_hours?: number;
  training_type: TrainingType;
}

export type UpdateTrainingProgramDTO = Partial<CreateTrainingProgramDTO>;

export interface CreateTrainingDTO {
  employee_id: number;
  training_program_id?: number;
  training_title: string;
  start_date: string;
  end_date: string;
  duration_hours?: number;
  venue?: string;
  organizer?: string;
  certificate_issued?: boolean;
  certificate_number?: string;
  status?: TrainingStatus;
}

export type UpdateTrainingDTO = Partial<CreateTrainingDTO>;

// Form interfaces for components
export interface TrainingFormData {
  employee_id: number | string;
  training_program_id?: number | string;
  training_title: string;
  start_date: string;
  end_date: string;
  duration_hours?: number | string;
  venue?: string;
  organizer?: string;
  certificate_issued: boolean;
  certificate_number?: string;
  status?: TrainingStatus;
}

export interface TrainingProgramFormData {
  title: string;
  description?: string;
  duration_hours?: number | string;
  training_type: TrainingType | '';
}

// Table column definitions
export interface TrainingTableColumn {
  key: keyof Training | 'actions';
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface TrainingProgramTableColumn {
  key: keyof TrainingProgram | 'actions';
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

// Dashboard card interfaces
export interface TrainingDashboardCard {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ComponentType;
}

// Validation schemas (to be used with zod)
export interface TrainingValidationErrors {
  employee_id?: string;
  training_program_id?: string;
  training_title?: string;
  start_date?: string;
  end_date?: string;
  duration_hours?: string;
  venue?: string;
  organizer?: string;
  certificate_number?: string;
  status?: string;
}

export interface TrainingProgramValidationErrors {
  title?: string;
  description?: string;
  duration_hours?: string;
  training_type?: string;
}

// Training calendar interfaces
export interface TrainingCalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: TrainingType;
  employee_name?: string;
  venue?: string;
  status: TrainingStatus;
}

// Export preferences
export interface TrainingExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: TrainingFilters;
  includeStatistics?: boolean;
}

// API service response types
export type TrainingApiResponse<T = unknown> = ApiResponse<T>;
export type TrainingsApiResponse = ApiResponse<TrainingResponse>;
export type TrainingProgramsApiResponse = ApiResponse<TrainingProgramResponse>;
export type TrainingStatisticsApiResponse = ApiResponse<TrainingStatistics>;
export type EmployeeTrainingHistoryApiResponse = ApiResponse<EmployeeTrainingHistory>;

// Component prop interfaces
export interface TrainingComponentProps {
  className?: string;
  onDataChange?: () => void;
}

export interface TrainingListProps extends TrainingComponentProps {
  filters?: TrainingFilters;
  readOnly?: boolean;
  showEmployeeColumn?: boolean;
}

export interface TrainingFormProps extends TrainingComponentProps {
  training?: Training;
  onSubmit: (data: CreateTrainingDTO | UpdateTrainingDTO) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TrainingProgramFormProps extends TrainingComponentProps {
  program?: TrainingProgram;
  onSubmit: (data: CreateTrainingProgramDTO | UpdateTrainingProgramDTO) => void;
  onCancel: () => void;
  isLoading?: boolean;
}