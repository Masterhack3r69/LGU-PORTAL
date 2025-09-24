// types/import.ts - Import-related type definitions

export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, any>;
  hasErrors: boolean;
  errors: string[];
}

export interface ImportPreviewData {
  totalRows: number;
  previewRows: number;
  validRows: number;
  invalidRows: number;
  fieldMapping: Record<string, string>;
  unmappedColumns: Array<{
    column: string;
    index: number;
  }>;
  validationErrors: string[];
  previewData: ImportPreviewRow[];
  passwordStrategies: Record<string, string>;
}

export interface ImportedEmployee {
  id: number;
  employee_number: string;
  full_name: string;
  email?: string;
  user_account_created: boolean;
}

export interface UserAccount {
  employee_number: string;
  username: string;
  email: string;
  temporary_password: string;
}

export interface PasswordReport {
  strategy_used: string;
  total_accounts: number;
  accounts: UserAccount[];
  instructions: string;
  security_recommendations: string[];
  report_file?: string;
}

export interface ImportSummary {
  total_processed: number;
  successful_imports: number;
  failed_imports: number;
  skipped_rows: number;
  user_accounts_created: number;
  success_rate: string;
}

export interface ImportExecutionResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  createdEmployees: ImportedEmployee[];
  userAccounts: UserAccount[];
  passwordReport?: PasswordReport;
  summary: ImportSummary;
}

export interface ImportOptions {
  password_strategy?: PasswordStrategy;
  create_user_accounts?: boolean;
  skip_invalid_rows?: boolean;
  initialize_leave_balances?: boolean;
}

export type PasswordStrategy =
  | "employee_number"
  | "birth_date"
  | "random"
  | "custom_pattern";

export const PasswordStrategyOptions = {
  EMPLOYEE_NUMBER: "employee_number" as const,
  BIRTH_DATE: "birth_date" as const,
  RANDOM: "random" as const,
  CUSTOM_PATTERN: "custom_pattern" as const,
} as const;

export interface ImportValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportProgress {
  stage: "uploading" | "validating" | "processing" | "completed" | "error";
  progress: number;
  message: string;
  currentRow?: number;
  totalRows?: number;
}

export interface ImportStats {
  totalFiles: number;
  totalEmployees: number;
  successfulImports: number;
  failedImports: number;
  lastImportDate?: string;
}

// Field mapping for Excel columns to database fields
export interface FieldMapping {
  [excelColumn: string]: string;
}

// Import configuration
export interface ImportConfig {
  allowedFileTypes: string[];
  maxFileSize: number;
  maxRowsPerImport: number;
  requiredFields: string[];
  optionalFields: string[];
}

export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  allowedFileTypes: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxRowsPerImport: 1000,
  requiredFields: [
    "employee_number",
    "first_name",
    "last_name",
    "sex",
    "birth_date",
    "appointment_date",
  ],
  optionalFields: [
    "middle_name",
    "suffix",
    "birth_place",
    "civil_status",
    "contact_number",
    "email_address",
    "current_address",
    "permanent_address",
    "tin",
    "gsis_number",
    "pagibig_number",
    "philhealth_number",
    "sss_number",
    "plantilla_position",
    "plantilla_number",
    "salary_grade",
    "step_increment",
    "current_monthly_salary",
    "current_daily_rate",
    "employment_status",
  ],
};
