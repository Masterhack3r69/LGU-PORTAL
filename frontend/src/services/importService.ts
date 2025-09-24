// services/importService.ts - Excel import service
import { apiService } from "./api";

export interface ImportPreviewData {
  totalRows: number;
  previewRows: number;
  validRows: number;
  invalidRows: number;
  fieldMapping: Record<string, string>;
  unmappedColumns: Array<{ column: string; index: number }>;
  validationErrors: string[];
  previewData: Array<{
    rowNumber: number;
    data: any;
    hasErrors: boolean;
    errors: string[];
  }>;
  passwordStrategies: Record<string, string>;
}

export interface ImportExecutionResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  createdEmployees: Array<{
    id: number;
    employee_number: string;
    full_name: string;
    email?: string;
    user_account_created: boolean;
  }>;
  userAccounts: Array<{
    employee_number: string;
    username: string;
    email: string;
    temporary_password: string;
  }>;
  passwordReport?: {
    strategy_used: string;
    total_accounts: number;
    accounts: Array<{
      employee_number: string;
      username: string;
      email: string;
      temporary_password: string;
    }>;
    instructions: string;
    security_recommendations: string[];
    report_file?: string;
  };
  summary: {
    total_processed: number;
    successful_imports: number;
    failed_imports: number;
    skipped_rows: number;
    user_accounts_created: number;
    success_rate: string;
  };
}

export interface ImportOptions {
  password_strategy?: string;
  create_user_accounts?: boolean;
  skip_invalid_rows?: boolean;
  initialize_leave_balances?: boolean;
}

class ImportService {
  // Download Excel import template
  async downloadTemplate(): Promise<Blob> {
    const response = await apiService.get<Blob>("/import/employees/template", {
      responseType: "blob",
    });
    return response;
  }

  // Preview Excel import
  async previewImport(file: File): Promise<ImportPreviewData> {
    const formData = new FormData();
    formData.append("excel_file", file);

    const response = await apiService.upload<{ data: ImportPreviewData }>("/import/employees/preview", formData);
    return response.data;
  }

  // Execute Excel import
  async executeImport(
    file: File,
    options: ImportOptions = {}
  ): Promise<ImportExecutionResult> {
    const formData = new FormData();
    formData.append("excel_file", file);

    // Add options to form data
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await apiService.upload<{ data: ImportExecutionResult }>("/import/employees/execute", formData);
    return response.data;
  }

  // Get password strategies
  getPasswordStrategies() {
    return {
      employee_number: "Employee Number",
      birth_date: "Birth Date (DDMMYYYY)",
      random: "Random Secure Password",
      custom_pattern: "Employee Number + Birth Day/Month (Default)",
    };
  }

  // Get password strategy description
  getPasswordStrategyDescription(strategy: string): string {
    const descriptions: Record<string, string> = {
      employee_number:
        "Uses the employee number as the password. Employees should change this immediately upon first login.",
      birth_date:
        "Uses the birth date in DDMMYYYY format as the password. Employees should change this immediately upon first login.",
      random:
        "Generates secure random passwords. These should be provided to employees through secure channels.",
      custom_pattern:
        "Uses employee number + day/month of birth (DDMM). For example: EMP001 born on March 15th = EMP0011503. This is the recommended default option.",
    };

    return descriptions[strategy] || "Unknown password strategy";
  }

  // Validate file before upload
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.",
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size too large. Maximum allowed size is 10MB.",
      };
    }

    return { isValid: true };
  }

  // Format import summary for display
  formatImportSummary(result: ImportExecutionResult): string {
    const { summary } = result;
    return `
Import completed successfully!

📊 Summary:
• Total processed: ${summary.total_processed} rows
• Successfully imported: ${summary.successful_imports} employees
• Failed imports: ${summary.failed_imports}
• Skipped rows: ${summary.skipped_rows}
• User accounts created: ${summary.user_accounts_created}
• Success rate: ${summary.success_rate}

${
  result.userAccounts.length > 0
    ? `🔐 User accounts were created with temporary passwords. Please ensure employees change their passwords on first login.`
    : ""
}
    `.trim();
  }

  // Export password report as CSV
  exportPasswordReport(
    userAccounts: Array<{
      employee_number: string;
      username: string;
      email: string;
      temporary_password: string;
    }>
  ): Blob {
    const headers = [
      "Employee Number",
      "Username",
      "Email",
      "Temporary Password",
    ];
    const csvContent = [
      headers.join(","),
      ...userAccounts.map((account) =>
        [
          account.employee_number,
          account.username,
          account.email,
          account.temporary_password,
        ].join(",")
      ),
    ].join("\n");

    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  }
}

export const importService = new ImportService();
