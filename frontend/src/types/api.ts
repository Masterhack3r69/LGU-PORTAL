export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: number;
  details?: unknown;
}

export interface FilterState {
  [key: string]: unknown;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}