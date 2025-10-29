  export interface Employee {
    id: number;
    user_id?: number;
    employee_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    sex?: 'Male' | 'Female';
    birth_date?: string;
    birth_place?: string;
    civil_status?: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced';
    contact_number?: string;
    email_address?: string;
    current_address?: string;
    permanent_address?: string;
    tin?: string;
    gsis_number?: string;
    pagibig_number?: string;
    philhealth_number?: string;
    sss_number?: string;
    appointment_date: string;
    plantilla_position?: string;
    department?: string;
    plantilla_number?: string;
    salary_grade?: number;
    step_increment?: number;
    current_monthly_salary?: number;
    current_daily_rate?: number;
    employment_status: 'Active' | 'Resigned' | 'Retired' | 'Terminated' | 'AWOL';
    separation_date?: string;
    separation_reason?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
                                                                           
    // Computed fields for UI compatibility
    employee_id?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    address?: string;
    department?: string;
    position?: string;
    hire_date?: string;
    salary?: number;
    status?: 'active' | 'inactive' | 'pending';
  }                                                                        
                                                                           
  export interface CreateEmployeeDTO {
    employee_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    sex?: 'Male' | 'Female';
    birth_date?: string;
    birth_place?: string;
    civil_status?: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced';
    contact_number?: string;
    email_address?: string;
    current_address?: string;
    permanent_address?: string;
    tin?: string;
    gsis_number?: string;
    pagibig_number?: string;
    philhealth_number?: string;
    sss_number?: string;
    appointment_date: string;
    plantilla_position?: string;
    department?: string;
    plantilla_number?: string;
    salary_grade?: number;
    step_increment?: number;
    current_daily_rate?: number;
    employment_status?: 'Active' | 'Resigned' | 'Retired' | 'Terminated' | 'AWOL';
    separation_date?: string;
    separation_reason?: string;
  }                                                                        
                                                                           
  export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {  
    id: number;
  }                                                                        
                                                                           
  export interface EmployeeFilters {
    name: string;
    department: string;
    position: string;
    status: 'active' | 'inactive' | 'pending' | '';
    page?: number;
    limit?: number;
  }                                                                        
                                                                           
  export interface EmployeeResponse {
    employees: Employee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }                                                                        
                                                                           
  export interface Document {
    id: number;
    employee_id: number;
    document_type_id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    upload_date?: string;
    uploaded_by: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    reviewed_by?: number;
    reviewed_at?: string;
    review_notes?: string;
    description?: string;
    
    // Joined fields from backend
    document_type_name?: string;
    document_type_description?: string;
    employee_name?: string;
    employee_number?: string;
    uploaded_by_username?: string;
    reviewed_by_username?: string;
    
    // Legacy fields for backward compatibility
    file_type?: string;
    uploaded_at?: string;
    category?: string;
  }
  
  export interface DocumentType {
    id: number;
    name: string;
    description?: string;
    is_required: boolean;
    max_file_size: number;
    allowed_extensions: string[];
  }
  
  export interface DocumentUploadData {
    employee_id: number;
    document_type_id: number;
    description?: string;
    file: File;
  }
  
  export interface DocumentChecklist {
    document_type_id: number;
    document_type_name: string;
    description?: string;
    is_required: boolean;
    is_uploaded: boolean;
    status?: 'Pending' | 'Approved' | 'Rejected';
    upload_date?: string;
  }
  
  export interface DocumentStatistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Array<{ name: string; count: number }>;
  }

  export interface ExamCertificate {
    id?: number;
    employee_id: number;
    exam_name: string;
    exam_type?: string;
    rating?: number;
    date_taken?: string;
    place_of_examination?: string;
    license_number?: string;
    validity_date?: string;
    created_at?: string;
    updated_at?: string;
  }

  export interface CreateExamCertificateDTO {
    employee_id: number;
    exam_name: string;
    exam_type?: string;
    rating?: number;
    date_taken?: string;
    place_of_examination?: string;
    license_number?: string;
    validity_date?: string;
  }

  export interface UpdateExamCertificateDTO extends Partial<CreateExamCertificateDTO> {
    id: number;
  }                                                                        
        