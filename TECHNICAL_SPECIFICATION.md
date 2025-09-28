# Employee Management System - Technical Specification

## System Components Deep Dive

### Backend API Architecture

#### Authentication System
```javascript
// Session-based authentication with role management
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
GET  /api/auth/user

// Middleware chain: auth.js → roleCheck.js → audit.js
```

#### Employee Management API
```javascript
// Admin-only endpoints
GET    /api/employees              # List all employees
POST   /api/employees              # Create employee
GET    /api/employees/:id          # Get employee details
PUT    /api/employees/:id          # Update employee
DELETE /api/employees/:id          # Soft delete employee

// Employee self-service endpoints
GET    /api/employees/profile      # Get own profile
PUT    /api/employees/profile      # Update own profile
```

#### Leave Management API
```javascript
// Admin endpoints
GET    /api/leave/applications     # All leave applications
PUT    /api/leave/applications/:id/approve
PUT    /api/leave/applications/:id/reject
GET    /api/leave/balances         # All employee balances
POST   /api/leave/balances/adjust  # Manual balance adjustment

// Employee endpoints
GET    /api/leave/my-applications  # Own applications
POST   /api/leave/applications     # Submit application
GET    /api/leave/my-balance       # Own leave balance
```

#### Payroll Management API
```javascript
// Admin-only endpoints
GET    /api/payroll/periods        # Payroll periods
POST   /api/payroll/periods        # Create payroll period
PUT    /api/payroll/periods/:id    # Update payroll period
DELETE /api/payroll/periods/:id    # Delete payroll period

GET    /api/payroll/employees      # Get employees for payroll
POST   /api/payroll/process        # Process payroll for selected employees
GET    /api/payroll/items/:periodId # Get payroll items for period
PUT    /api/payroll/items/:id      # Update payroll item
POST   /api/payroll/finalize/:periodId # Finalize payroll period

// Payroll configuration endpoints
GET    /api/payroll/allowance-types    # Get allowance types
POST   /api/payroll/allowance-types    # Create allowance type
PUT    /api/payroll/allowance-types/:id # Update allowance type
DELETE /api/payroll/allowance-types/:id # Delete allowance type

GET    /api/payroll/deduction-types    # Get deduction types
POST   /api/payroll/deduction-types    # Create deduction type
PUT    /api/payroll/deduction-types/:id # Update deduction type
DELETE /api/payroll/deduction-types/:id # Delete deduction type

GET    /api/payroll/overrides/:employeeId # Get employee overrides
POST   /api/payroll/overrides          # Create override
PUT    /api/payroll/overrides/:id      # Update override
DELETE /api/payroll/overrides/:id      # Delete override

// Employee payroll access
GET    /api/payroll/my-payslips        # Employee's payslips
GET    /api/payroll/payslip/:id        # Specific payslip details
```#### C
ompensation & Benefits API
```javascript
// Admin endpoints
GET    /api/compensation/records     # All benefit records
POST   /api/compensation/process     # Process benefits (single/bulk)
GET    /api/compensation/types       # Available benefit types
PUT    /api/compensation/records/:id # Update benefit record
DELETE /api/compensation/records/:id # Delete benefit record

POST   /api/compensation/monetization # Process leave monetization
GET    /api/compensation/eligibility/:employeeId # Check eligibility

// Employee endpoints
GET    /api/compensation/my-records  # Employee's benefit records
GET    /api/compensation/my-eligibility # Employee's eligibility status
```

#### Training Management API
```javascript
// Admin endpoints
GET    /api/training/programs        # All training programs
POST   /api/training/programs        # Create training program
PUT    /api/training/programs/:id    # Update training program
DELETE /api/training/programs/:id    # Delete training program

GET    /api/training/records         # All training records
POST   /api/training/records         # Create training record
PUT    /api/training/records/:id     # Update training record
DELETE /api/training/records/:id     # Delete training record

GET    /api/training/enrollments     # All enrollments
POST   /api/training/enroll          # Enroll employee in program

// Employee endpoints
GET    /api/training/my-programs     # Available programs for employee
GET    /api/training/my-records      # Employee's training history
POST   /api/training/request-enrollment # Request enrollment
```

#### Document Management API
```javascript
// Admin endpoints
GET    /api/documents/types          # Document types
POST   /api/documents/types          # Create document type
PUT    /api/documents/types/:id      # Update document type
DELETE /api/documents/types/:id      # Delete document type

GET    /api/documents/pending        # Pending document approvals
PUT    /api/documents/:id/approve    # Approve document
PUT    /api/documents/:id/reject     # Reject document

// Shared endpoints
GET    /api/documents/employee/:id   # Employee documents
POST   /api/documents/upload         # Upload document
GET    /api/documents/:id            # Get document
DELETE /api/documents/:id            # Delete document
```

#### Reports & Analytics API
```javascript
// Admin-only endpoints
GET    /api/reports/dashboard        # Dashboard statistics
GET    /api/reports/employees        # Employee reports
GET    /api/reports/leave            # Leave analytics
GET    /api/reports/payroll          # Payroll reports
GET    /api/reports/benefits         # Benefits reports
GET    /api/reports/training         # Training reports
GET    /api/reports/audit            # Audit reports

POST   /api/reports/export           # Export reports (PDF/Excel)
```

#### Backup & System Management API
```javascript
// Admin-only endpoints
GET    /api/backup/list              # List available backups
POST   /api/backup/create            # Create database backup
POST   /api/backup/restore           # Restore from backup
DELETE /api/backup/:filename         # Delete backup file

GET    /api/system/health            # System health check
GET    /api/system/audit-logs        # System audit logs
```

### Database Schema Architecture

#### Core Tables Structure

##### Authentication & User Management
```sql
-- Users table for authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') NOT NULL,
    employee_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Session management
CREATE TABLE user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

##### Employee Management
```sql
-- Main employees table
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(10),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    civil_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    
    -- Employment details
    hire_date DATE NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    employment_status ENUM('Regular', 'Contractual', 'Probationary') DEFAULT 'Probationary',
    employment_type ENUM('Full-time', 'Part-time', 'Contractual') DEFAULT 'Full-time',
    
    -- Compensation
    basic_salary DECIMAL(12,2) DEFAULT 0.00,
    daily_rate DECIMAL(10,2) DEFAULT 0.00,
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    
    -- Status and metadata
    status ENUM('Active', 'Inactive', 'Terminated') DEFAULT 'Active',
    termination_date DATE NULL,
    termination_reason TEXT NULL,
    
    -- Profile and documents
    profile_photo VARCHAR(255),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_employee_number (employee_number),
    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_employment_status (employment_status)
);

-- Employee documents
CREATE TABLE employee_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    document_type_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100),
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (document_type_id) REFERENCES document_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Document types configuration
CREATE TABLE document_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    max_file_size INT DEFAULT 5242880, -- 5MB default
    allowed_extensions JSON, -- ['pdf', 'jpg', 'png', 'doc', 'docx']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

##### Leave Management System
```sql
-- Leave types configuration
CREATE TABLE leave_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_days_per_year INT DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee leave balances
CREATE TABLE leave_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year INT NOT NULL,
    earned_days DECIMAL(5,2) DEFAULT 0.00,
    used_days DECIMAL(5,2) DEFAULT 0.00,
    remaining_days DECIMAL(5,2) DEFAULT 0.00,
    carried_forward DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    UNIQUE KEY unique_employee_leave_year (employee_id, leave_type_id, year)
);

-- Leave applications
CREATE TABLE leave_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    
    INDEX idx_employee_status (employee_id, status),
    INDEX idx_date_range (start_date, end_date),
    INDEX idx_status (status)
);
```

##### Payroll Management System
```sql
-- Payroll periods
CREATE TABLE payroll_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status ENUM('Draft', 'Processing', 'Finalized', 'Paid') DEFAULT 'Draft',
    total_employees INT DEFAULT 0,
    total_gross_pay DECIMAL(15,2) DEFAULT 0.00,
    total_deductions DECIMAL(15,2) DEFAULT 0.00,
    total_net_pay DECIMAL(15,2) DEFAULT 0.00,
    processed_by INT NULL,
    processed_at TIMESTAMP NULL,
    finalized_by INT NULL,
    finalized_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (processed_by) REFERENCES users(id),
    FOREIGN KEY (finalized_by) REFERENCES users(id),
    
    INDEX idx_period_dates (start_date, end_date),
    INDEX idx_status (status)
);

-- Individual payroll items
CREATE TABLE payroll_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payroll_period_id INT NOT NULL,
    employee_id INT NOT NULL,
    
    -- Basic pay calculation
    basic_salary DECIMAL(12,2) DEFAULT 0.00,
    daily_rate DECIMAL(10,2) DEFAULT 0.00,
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    days_worked DECIMAL(5,2) DEFAULT 0.00,
    hours_worked DECIMAL(7,2) DEFAULT 0.00,
    
    -- Gross pay components
    basic_pay DECIMAL(12,2) DEFAULT 0.00,
    overtime_pay DECIMAL(12,2) DEFAULT 0.00,
    holiday_pay DECIMAL(12,2) DEFAULT 0.00,
    night_differential DECIMAL(12,2) DEFAULT 0.00,
    
    -- Allowances (stored as JSON for flexibility)
    allowances JSON, -- {"transportation": 2000, "meal": 1500, "communication": 800}
    total_allowances DECIMAL(12,2) DEFAULT 0.00,
    
    -- Deductions (stored as JSON for flexibility)
    deductions JSON, -- {"sss": 500, "philhealth": 200, "pagibig": 100, "tax": 1500}
    total_deductions DECIMAL(12,2) DEFAULT 0.00,
    
    -- Final calculations
    gross_pay DECIMAL(12,2) DEFAULT 0.00,
    net_pay DECIMAL(12,2) DEFAULT 0.00,
    
    -- Status and metadata
    status ENUM('Draft', 'Calculated', 'Approved', 'Paid') DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    
    UNIQUE KEY unique_period_employee (payroll_period_id, employee_id),
    INDEX idx_employee_period (employee_id, payroll_period_id),
    INDEX idx_status (status)
);

-- Allowance types configuration
CREATE TABLE allowance_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    default_amount DECIMAL(10,2) DEFAULT 0.00,
    calculation_type ENUM('Fixed', 'Percentage', 'Formula') DEFAULT 'Fixed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Deduction types configuration
CREATE TABLE deduction_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    default_amount DECIMAL(10,2) DEFAULT 0.00,
    calculation_type ENUM('Fixed', 'Percentage', 'Formula') DEFAULT 'Fixed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee-specific payroll overrides
CREATE TABLE employee_payroll_overrides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    override_type ENUM('Allowance', 'Deduction') NOT NULL,
    type_id INT NOT NULL, -- References allowance_types or deduction_types
    amount DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL,
    end_date DATE NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_employee_type (employee_id, override_type),
    INDEX idx_effective_date (effective_date)
);
```

##### Compensation & Benefits System
```sql
-- Compensation and benefit records
CREATE TABLE comp_benefit_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    benefit_type ENUM('Terminal Leave', 'Leave Monetization', 'PBB', '13th Month', '14th Month', 'GSIS', 'Loyalty Award') NOT NULL,
    
    -- Calculation details
    base_amount DECIMAL(12,2) DEFAULT 0.00,
    calculation_details JSON, -- Store calculation breakdown
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Processing information
    processing_date DATE NOT NULL,
    period_covered VARCHAR(100), -- e.g., "January 2024", "2024", "Service Years: 5"
    status ENUM('Pending', 'Approved', 'Paid', 'Cancelled') DEFAULT 'Pending',
    
    -- Approval workflow
    processed_by INT NOT NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Payment details
    payment_date DATE NULL,
    payment_method ENUM('Cash', 'Bank Transfer', 'Check') NULL,
    reference_number VARCHAR(100) NULL,
    
    -- Additional information
    notes TEXT,
    attachments JSON, -- Store file paths for supporting documents
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    
    INDEX idx_employee_type (employee_id, benefit_type),
    INDEX idx_processing_date (processing_date),
    INDEX idx_status (status)
);
```

##### Training Management System
```sql
-- Training programs
CREATE TABLE training_programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_hours INT DEFAULT 0,
    max_participants INT DEFAULT 0,
    instructor VARCHAR(200),
    location VARCHAR(200),
    training_type ENUM('Internal', 'External', 'Online', 'Workshop', 'Seminar') DEFAULT 'Internal',
    status ENUM('Active', 'Inactive', 'Completed', 'Cancelled') DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    cost_per_participant DECIMAL(10,2) DEFAULT 0.00,
    requirements TEXT,
    objectives TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_training_dates (start_date, end_date)
);

-- Training records (employee participation)
CREATE TABLE training_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    training_program_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    completion_date DATE NULL,
    status ENUM('Enrolled', 'In Progress', 'Completed', 'Dropped', 'Failed') DEFAULT 'Enrolled',
    score DECIMAL(5,2) NULL,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_path VARCHAR(500) NULL,
    feedback TEXT,
    cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (training_program_id) REFERENCES training_programs(id),
    
    UNIQUE KEY unique_employee_program (employee_id, training_program_id),
    INDEX idx_employee_status (employee_id, status),
    INDEX idx_completion_date (completion_date)
);
```

##### Audit & Logging System
```sql
-- Comprehensive audit logging
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    employee_id INT NULL, -- For employee-related actions
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    table_name VARCHAR(100) NULL, -- Affected table
    record_id INT NULL, -- Affected record ID
    old_values JSON NULL, -- Previous values (for updates)
    new_values JSON NULL, -- New values (for creates/updates)
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(128),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    
    INDEX idx_user_action (user_id, action),
    INDEX idx_timestamp (timestamp),
    INDEX idx_table_record (table_name, record_id)
);

-- System activity logs
CREATE TABLE system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('INFO', 'WARNING', 'ERROR', 'DEBUG') NOT NULL,
    message TEXT NOT NULL,
    context JSON NULL, -- Additional context data
    source VARCHAR(100), -- Controller, Service, Job, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level_timestamp (level, timestamp),
    INDEX idx_source (source)
);
```

### Frontend Architecture Deep Dive

#### Component Hierarchy & Data Flow

##### Authentication Flow
```typescript
// Login flow with role-based routing
LoginPage → AuthService → API → Session → RoleBasedRouter → Dashboard

// Authentication context provider
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}
```

##### Admin Dashboard Components
```typescript
// Admin-specific component structure
AdminDashboard/
├── EmployeeManagement/
│   ├── EmployeeListPage
│   ├── EmployeeCreatePage
│   ├── EmployeeEditPage
│   └── DocumentManagementPage
├── LeaveManagement/
│   ├── AdminLeaveManagement
│   ├── AdminLeaveApprovals
│   ├── AdminLeaveBalances
│   └── AdminLeaveTypes
├── PayrollManagement/
│   ├── PayrollManagementPage
│   ├── PayrollPeriodsPage
│   ├── PayrollReportsPage
│   ├── AllowanceTypesManagement
│   ├── DeductionTypesManagement
│   └── EmployeeOverridesManagement
├── BenefitsManagement/
│   ├── CompensationBenefitsPage
│   ├── BulkProcessingPanel
│   ├── SingleProcessingPanel
│   └── MonetizationPanel
├── TrainingManagement/
│   ├── AdminTrainingPrograms
│   └── AdminTrainingRecords
└── SystemAdministration/
    ├── AuditLogsPage
    ├── EmployeeImportPage
    ├── BackupManagement
    └── DocumentTypesManagement
```

##### Employee Portal Components
```typescript
// Employee-specific component structure
EmployeePortal/
├── ProfileManagement/
│   ├── ProfilePage
│   ├── ProfileSettings
│   └── DocumentSubmission
├── LeaveManagement/
│   ├── EmployeeLeaveApplications
│   ├── EmployeeLeaveBalance
│   └── LeaveApplicationForm
├── PayrollAccess/
│   ├── PayslipViewer
│   ├── PayrollHistory
│   └── DeductionDetails
├── BenefitsInquiry/
│   ├── BenefitRecordsTable
│   └── EligibilityStatus
└── TrainingPortal/
    ├── EmployeeMyTrainingsPage
    ├── AvailablePrograms
    └── TrainingHistory
```

#### State Management Architecture

##### React Query Integration
```typescript
// API service layer with React Query
interface ApiService {
  // Employee management
  employees: {
    getAll: () => Promise<Employee[]>;
    getById: (id: number) => Promise<Employee>;
    create: (data: CreateEmployeeData) => Promise<Employee>;
    update: (id: number, data: UpdateEmployeeData) => Promise<Employee>;
    delete: (id: number) => Promise<void>;
  };
  
  // Leave management
  leave: {
    getApplications: () => Promise<LeaveApplication[]>;
    submitApplication: (data: LeaveApplicationData) => Promise<LeaveApplication>;
    approveApplication: (id: number) => Promise<void>;
    rejectApplication: (id: number, reason: string) => Promise<void>;
    getBalances: (employeeId?: number) => Promise<LeaveBalance[]>;
  };
  
  // Payroll management
  payroll: {
    getPeriods: () => Promise<PayrollPeriod[]>;
    processPayroll: (data: PayrollProcessData) => Promise<void>;
    getPayslips: (employeeId?: number) => Promise<Payslip[]>;
    getOverrides: (employeeId: number) => Promise<PayrollOverride[]>;
  };
  
  // Benefits management
  benefits: {
    getRecords: (employeeId?: number) => Promise<BenefitRecord[]>;
    processBenefit: (data: BenefitProcessData) => Promise<BenefitRecord>;
    checkEligibility: (employeeId: number, benefitType: string) => Promise<EligibilityStatus>;
  };
  
  // Training management
  training: {
    getPrograms: () => Promise<TrainingProgram[]>;
    getRecords: (employeeId?: number) => Promise<TrainingRecord[]>;
    enrollEmployee: (data: EnrollmentData) => Promise<TrainingRecord>;
  };
}
```

##### Custom Hooks for Data Management
```typescript
// Employee management hooks
export const useEmployees = () => useQuery(['employees'], api.employees.getAll);
export const useEmployee = (id: number) => useQuery(['employee', id], () => api.employees.getById(id));
export const useCreateEmployee = () => useMutation(api.employees.create);
export const useUpdateEmployee = () => useMutation(api.employees.update);

// Leave management hooks
export const useLeaveApplications = () => useQuery(['leave-applications'], api.leave.getApplications);
export const useLeaveBalances = (employeeId?: number) => 
  useQuery(['leave-balances', employeeId], () => api.leave.getBalances(employeeId));
export const useSubmitLeaveApplication = () => useMutation(api.leave.submitApplication);

// Payroll management hooks
export const usePayrollPeriods = () => useQuery(['payroll-periods'], api.payroll.getPeriods);
export const usePayslips = (employeeId?: number) => 
  useQuery(['payslips', employeeId], () => api.payroll.getPayslips(employeeId));
export const useProcessPayroll = () => useMutation(api.payroll.processPayroll);

// Benefits management hooks
export const useBenefitRecords = (employeeId?: number) => 
  useQuery(['benefit-records', employeeId], () => api.benefits.getRecords(employeeId));
export const useProcessBenefit = () => useMutation(api.benefits.processBenefit);

// Training management hooks
export const useTrainingPrograms = () => useQuery(['training-programs'], api.training.getPrograms);
export const useTrainingRecords = (employeeId?: number) => 
  useQuery(['training-records', employeeId], () => api.training.getRecords(employeeId));
```

#### UI Component Library Integration

##### shadcn/ui Components Usage
```typescript
// Form components with validation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Data display components
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Loading } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
```

##### Form Validation with React Hook Form + Zod
```typescript
// Employee form validation schema
const employeeSchema = z.object({
  employee_number: z.string().min(1, "Employee number is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  hire_date: z.string().min(1, "Hire date is required"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  basic_salary: z.number().min(0, "Salary must be positive"),
  employment_status: z.enum(["Regular", "Contractual", "Probationary"]),
  employment_type: z.enum(["Full-time", "Part-time", "Contractual"])
});

// Leave application validation schema
const leaveApplicationSchema = z.object({
  leave_type_id: z.number().min(1, "Leave type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters")
});

// Payroll processing validation schema
const payrollProcessSchema = z.object({
  period_id: z.number().min(1, "Payroll period is required"),
  employee_ids: z.array(z.number()).min(1, "At least one employee must be selected"),
  working_days: z.number().min(1).max(31, "Working days must be between 1 and 31")
});
```

### Security Implementation

#### Authentication & Authorization
```typescript
// JWT token management (if using JWT) or session-based auth
interface AuthenticationService {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  getCurrentUser: () => Promise<User>;
  checkPermission: (permission: string) => boolean;
}

// Role-based access control
enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

enum Permission {
  // Employee management
  VIEW_ALL_EMPLOYEES = 'view_all_employees',
  CREATE_EMPLOYEE = 'create_employee',
  UPDATE_EMPLOYEE = 'update_employee',
  DELETE_EMPLOYEE = 'delete_employee',
  
  // Leave management
  APPROVE_LEAVE = 'approve_leave',
  VIEW_ALL_LEAVE = 'view_all_leave',
  MANAGE_LEAVE_TYPES = 'manage_leave_types',
  
  // Payroll management
  PROCESS_PAYROLL = 'process_payroll',
  VIEW_ALL_PAYROLL = 'view_all_payroll',
  MANAGE_PAYROLL_CONFIG = 'manage_payroll_config',
  
  // Benefits management
  PROCESS_BENEFITS = 'process_benefits',
  VIEW_ALL_BENEFITS = 'view_all_benefits',
  
  // System administration
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_SYSTEM = 'manage_system',
  BACKUP_RESTORE = 'backup_restore'
}
```

#### Input Validation & Sanitization
```javascript
// Backend validation middleware
const { body, param, query, validationResult } = require('express-validator');

// Employee validation rules
const employeeValidationRules = () => {
  return [
    body('employee_number').isLength({ min: 1 }).withMessage('Employee number is required'),
    body('first_name').isLength({ min: 1 }).withMessage('First name is required'),
    body('last_name').isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('basic_salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
    body('hire_date').isISO8601().withMessage('Invalid hire date format')
  ];
};

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
```

#### File Upload Security
```javascript
// Secure file upload configuration
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/employees', req.params.employeeId);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});
```

### Performance Optimization

#### Database Optimization
```sql
-- Optimized indexes for common queries
CREATE INDEX idx_employees_search ON employees(first_name, last_name, employee_number);
CREATE INDEX idx_leave_applications_employee_status ON leave_applications(employee_id, status);
CREATE INDEX idx_payroll_items_period_employee ON payroll_items(payroll_period_id, employee_id);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

-- Composite indexes for complex queries
CREATE INDEX idx_employees_status_department ON employees(status, department);
CREATE INDEX idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX idx_comp_benefit_records_employee_type_date ON comp_benefit_records(employee_id, benefit_type, processing_date);
```

#### API Response Optimization
```javascript
// Pagination helper
const paginate = (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return query.limit(limit).offset(offset);
};

// Response caching for static data
const cache = require('memory-cache');

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    
    next();
  };
};
```

#### Frontend Performance
```typescript
// Lazy loading for route components
const EmployeeListPage = lazy(() => import('@/pages/employees/EmployeeListPage'));
const PayrollManagementPage = lazy(() => import('@/pages/payroll/PayrollManagementPage'));
const CompensationBenefitsPage = lazy(() => import('@/pages/benefits/CompensationBenefitsPage'));

// Memoized components for expensive renders
const EmployeeTable = memo(({ employees, onEdit, onDelete }) => {
  return (
    <DataTable
      data={employees}
      columns={employeeColumns}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
});

// Virtual scrolling for large datasets
import { FixedSizeList as List } from 'react-window';

const VirtualizedEmployeeList = ({ employees }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <EmployeeRow employee={employees[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={employees.length}
      itemSize={60}
    >
      {Row}
    </List>
  );
};
```

This comprehensive technical specification covers the complete architecture, implementation details, and best practices for the Employee Management System, providing a solid foundation for development and maintenance.