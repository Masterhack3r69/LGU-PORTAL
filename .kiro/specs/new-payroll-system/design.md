# Design Document

## Overview

The New Payroll System transforms the LGU's manual, spreadsheet-based payroll process into an automated, integrated digital workflow. The system is built on the existing LGU Portal architecture (Node.js/Express backend, React frontend, MySQL database) and extends the current payroll, employee, and leave management modules.

The design follows a phase-based workflow that mirrors the real-world LGU payroll process:
1. **Data Collection Phase** - Import and validate DTR, billings, and reports
2. **Calculation Phase** - Automated computation of gross pay, deductions, and net pay
3. **Certification Phase** - CAFOA generation and approval workflow
4. **Disbursement Phase** - ADA generation and bank processing
5. **Remittance Phase** - Third-party payment tracking
6. **Reporting Phase** - Payslips, summaries, and audit reports

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payroll    │  │   Document   │  │   Reports    │      │
│  │  Management  │  │  Generation  │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Express Routes)                  │
│  /api/payroll/*  /api/dtr/*  /api/documents/*  /api/reports/*│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Calculation │  │   Document   │  │  Remittance  │      │
│  │    Engine    │  │  Generator   │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Billing    │  │   Workflow   │  │    Audit     │      │
│  │    Parser    │  │   Manager    │  │    Logger    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payroll    │  │   Employee   │  │    Leave     │      │
│  │    Models    │  │    Models    │  │    Models    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MySQL Database                          │
│  Payroll Tables │ Employee Tables │ Configuration Tables    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Node.js 16+, Express 4.x
- **Frontend**: React 18+, Vite
- **Database**: MySQL 8.0+
- **PDF Generation**: PDFKit
- **Excel Processing**: xlsx library
- **File Upload**: Multer
- **Authentication**: Express Session
- **Validation**: Express Validator

## Components and Interfaces

### 1. Payroll Calculation Engine

**Purpose**: Core calculation logic for all payroll computations

**Key Classes**:
- `PayrollCalculationEngine` - Main calculation orchestrator
- `SalaryCalculator` - Basic salary and PERA calculations
- `AllowanceCalculator` - RATA, Hazard Pay, S&L calculations
- `DeductionCalculator` - Mandatory and loan deductions
- `TaxCalculator` - BIR withholding tax computation

**Key Methods**:
```javascript
class PayrollCalculationEngine {
  // Calculate complete payroll for an employee
  async calculateEmployeePayroll(employee, period, workingDays, overrides)
  
  // Calculate basic salary with LWOP consideration
  calculateBasicSalary(monthlySalary, workingDays, daysPresent)
  
  // Calculate PERA (fixed or prorated)
  calculatePERA(daysPresent, workingDays)
  
  // Calculate RATA based on position and attendance
  calculateRATA(employee, period, attendance)
  
  // Calculate all mandatory deductions
  calculateMandatoryDeductions(basicSalary, grossPay)
  
  // Calculate withholding tax using BIR tables
  calculateWithholdingTax(taxableIncome, taxTable)
  
  // Calculate hazard pay for eligible employees
  calculateHazardPay(employee, daysWorked)
  
  // Calculate S&L allowances
  calculateSubsistenceLaundry(daysWorked)
  
  // Validate calculation results
  validateCalculation(payrollItem)
}
```

**Integration Points**:
- Reads from: `employees`, `payroll_periods`, `dtr_records`, `employee_overrides`, `tax_tables`
- Writes to: `payroll_items`, `payroll_item_lines`
- Calls: `TaxCalculator`, `DeductionCalculator`

### 2. Billing Parser Service

**Purpose**: Parse and extract deduction amounts from uploaded billing files

**Key Classes**:
- `BillingParserService` - Main parser orchestrator
- `GSISBillingParser` - GSIS-specific parsing
- `PagIBIGBillingParser` - Pag-IBIG-specific parsing
- `BankBillingParser` - Bank statement parsing
- `PDFBillingParser` - Generic PDF parsing utility

**Key Methods**:
```javascript
class BillingParserService {
  // Parse billing file and extract deductions
  async parseBillingFile(file, billingType, periodId)
  
  // Validate billing data format
  validateBillingData(data, billingType)
  
  // Match billing records to employees
  matchEmployeesToBilling(billingRecords, employees)
  
  // Store billing deductions
  async storeBillingDeductions(periodId, deductions)
  
  // Generate billing import report
  generateImportReport(results)
}
```

**Supported Formats**:
- CSV files with standard column mappings
- Excel files (.xlsx) with configurable sheet/column selection
- PDF files with text extraction and pattern matching

**Integration Points**:
- Reads from: Uploaded files, `employees`, `deduction_types`
- Writes to: `billing_deductions`, `import_logs`
- Calls: File parsing libraries (xlsx, pdf-parse)

### 3. DTR Import Service

**Purpose**: Import and process Daily Time Records

**Key Classes**:
- `DTRImportService` - Main DTR import handler
- `DTRValidator` - Validate DTR data integrity
- `AttendanceCalculator` - Calculate working days and LWOP

**Key Methods**:
```javascript
class DTRImportService {
  // Import DTR file for a payroll period
  async importDTRFile(file, periodId)
  
  // Parse DTR file format
  parseDTRFile(file)
  
  // Validate DTR records
  validateDTRRecords(records, period)
  
  // Calculate attendance metrics
  calculateAttendance(dtrRecord, period)
  
  // Detect LWOP from leave system
  async detectLWOP(employeeId, startDate, endDate)
  
  // Store DTR records
  async storeDTRRecords(periodId, records)
}
```

**Integration Points**:
- Reads from: Uploaded files, `employees`, `leave_applications`, `payroll_periods`
- Writes to: `dtr_records`, `import_logs`
- Calls: `LeaveBalance.getEmployeeBalances()` for LWOP detection

### 4. Document Generation Service

**Purpose**: Generate CAFOA, ADA, payslips, and remittance lists

**Key Classes**:
- `DocumentGenerationService` - Main document generator
- `CAFOAGenerator` - CAFOA document creation
- `ADAGenerator` - ADA document creation
- `PayslipGenerator` - Employee payslip creation
- `RemittanceListGenerator` - Third-party remittance lists

**Key Methods**:
```javascript
class DocumentGenerationService {
  // Generate CAFOA document
  async generateCAFOA(periodId)
  
  // Generate ADA document
  async generateADA(periodId, employeeIds)
  
  // Generate payslips for all employees
  async generatePayslips(periodId)
  
  // Generate remittance list for agency
  async generateRemittanceList(periodId, agencyType)
  
  // Create PDF document
  async createPDF(template, data, outputPath)
  
  // Create Excel document
  async createExcel(template, data, outputPath)
}
```

**Document Templates**:
- CAFOA: PDF with expense breakdown table, signature blocks
- ADA: PDF and CSV with employee list, account numbers, amounts
- Payslip: PDF with earnings/deductions table, YTD totals
- Remittance Lists: Excel with agency-specific formats

**Integration Points**:
- Reads from: `payroll_periods`, `payroll_items`, `employees`, `billing_deductions`
- Writes to: File system (`/uploads/documents/`), `generated_documents` table
- Calls: PDFKit, xlsx library

### 5. Workflow Manager

**Purpose**: Manage payroll period workflow and state transitions

**Key Classes**:
- `PayrollWorkflowManager` - Workflow orchestrator
- `WorkflowValidator` - Validate state transition rules
- `WorkflowNotifier` - Send notifications on state changes

**Key Methods**:
```javascript
class PayrollWorkflowManager {
  // Transition period to next status
  async transitionPeriod(periodId, newStatus, userId)
  
  // Validate transition is allowed
  validateTransition(currentStatus, newStatus)
  
  // Execute status-specific actions
  async executeStatusActions(periodId, status)
  
  // Revert period to previous status
  async revertPeriod(periodId, targetStatus, reason, userId)
  
  // Check if period can be finalized
  async canFinalize(periodId)
  
  // Lock/unlock period for editing
  async togglePeriodLock(periodId, locked)
}
```

**Workflow States**:
1. `Draft` - Data collection in progress
2. `Processing` - Calculations running
3. `Calculated` - Calculations complete, pending review
4. `Ready for CAFOA` - Validated, ready for certification
5. `CAFOA Approved` - Certified, ready for disbursement
6. `Ready for Disbursement` - ADA generated
7. `Disbursed` - Payment processed
8. `Completed` - All remittances done, period closed

**Integration Points**:
- Reads from: `payroll_periods`, `payroll_items`, `generated_documents`
- Writes to: `payroll_periods`, `workflow_history`, `notifications`
- Calls: `PayrollCalculationEngine`, `DocumentGenerationService`

### 6. Remittance Manager

**Purpose**: Track third-party remittances and payment status

**Key Classes**:
- `RemittanceManager` - Remittance tracking orchestrator
- `RemittanceScheduler` - Track due dates and deadlines
- `RemittanceReconciler` - Reconcile payments with billings

**Key Methods**:
```javascript
class RemittanceManager {
  // Create remittance records for period
  async createRemittances(periodId)
  
  // Mark remittance as paid
  async markRemittancePaid(remittanceId, paymentDetails)
  
  // Get overdue remittances
  async getOverdueRemittances()
  
  // Generate remittance summary
  async getRemittanceSummary(periodId)
  
  // Reconcile remittance with billing
  async reconcileRemittance(remittanceId, billingId)
}
```

**Remittance Types**:
- BIR Withholding Tax (due 10th of following month)
- GSIS Contributions (due 15th of following month)
- Pag-IBIG Contributions (due 10th of following month)
- PhilHealth Contributions (due 10th of following month)
- Bank Loans (various due dates)
- Cooperative Loans (various due dates)

**Integration Points**:
- Reads from: `payroll_items`, `billing_deductions`, `remittance_schedules`
- Writes to: `remittances`, `remittance_payments`
- Calls: `DocumentGenerationService.generateRemittanceList()`

## Data Models

### Core Tables

#### payroll_periods
```sql
CREATE TABLE payroll_periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  year INT NOT NULL,
  month INT NOT NULL,
  period_number INT NOT NULL, -- 1 or 2 (semi-monthly)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pay_date DATE NOT NULL,
  status ENUM('Draft', 'Processing', 'Calculated', 'Ready for CAFOA', 
              'CAFOA Approved', 'Ready for Disbursement', 'Disbursed', 
              'Completed') DEFAULT 'Draft',
  working_days DECIMAL(5,2) DEFAULT 22.00,
  created_by INT,
  finalized_by INT,
  finalized_at DATETIME,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_period (year, month, period_number),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (finalized_by) REFERENCES users(id)
);
```

#### payroll_items
```sql
CREATE TABLE payroll_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_period_id INT NOT NULL,
  employee_id INT NOT NULL,
  working_days DECIMAL(5,2) DEFAULT 22.00,
  days_present DECIMAL(5,2) DEFAULT 22.00,
  days_lwop DECIMAL(5,2) DEFAULT 0.00,
  daily_rate DECIMAL(10,2) DEFAULT 0.00,
  basic_pay DECIMAL(10,2) DEFAULT 0.00,
  pera DECIMAL(10,2) DEFAULT 0.00,
  total_allowances DECIMAL(10,2) DEFAULT 0.00,
  total_deductions DECIMAL(10,2) DEFAULT 0.00,
  gross_pay DECIMAL(10,2) DEFAULT 0.00,
  net_pay DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Draft', 'Calculated', 'Validated', 'Paid') DEFAULT 'Draft',
  calculation_errors TEXT,
  processed_by INT,
  processed_at DATETIME,
  paid_at DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_period (payroll_period_id, employee_id),
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (processed_by) REFERENCES users(id),
  INDEX idx_period_status (payroll_period_id, status),
  INDEX idx_employee (employee_id)
);
```

#### payroll_item_lines
```sql
CREATE TABLE payroll_item_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_item_id INT NOT NULL,
  line_type ENUM('Earning', 'Deduction') NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'Basic Salary', 'PERA', 'RATA', 'Hazard Pay', etc.
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  calculation_basis TEXT, -- JSON with calculation details
  is_taxable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id) ON DELETE CASCADE,
  INDEX idx_payroll_item (payroll_item_id),
  INDEX idx_category (category)
);
```

#### dtr_records
```sql
CREATE TABLE dtr_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_period_id INT NOT NULL,
  employee_id INT NOT NULL,
  record_date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  hours_worked DECIMAL(5,2),
  is_present BOOLEAN DEFAULT TRUE,
  is_lwop BOOLEAN DEFAULT FALSE,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_weekend BOOLEAN DEFAULT FALSE,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_date (employee_id, record_date),
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  INDEX idx_period_employee (payroll_period_id, employee_id),
  INDEX idx_date (record_date)
);
```

#### billing_deductions
```sql
CREATE TABLE billing_deductions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_period_id INT NOT NULL,
  employee_id INT NOT NULL,
  deduction_type_id INT NOT NULL,
  billing_source VARCHAR(50) NOT NULL, -- 'GSIS', 'PagIBIG', 'DBP', etc.
  billing_reference VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  billing_date DATE,
  imported_at DATETIME,
  imported_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (deduction_type_id) REFERENCES deduction_types(id),
  FOREIGN KEY (imported_by) REFERENCES users(id),
  INDEX idx_period_employee (payroll_period_id, employee_id),
  INDEX idx_source (billing_source)
);
```

#### generated_documents
```sql
CREATE TABLE generated_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_period_id INT NOT NULL,
  document_type ENUM('CAFOA', 'ADA', 'Payslip', 'Remittance List', 'Summary Report') NOT NULL,
  document_subtype VARCHAR(50), -- For remittance lists: 'BIR', 'GSIS', etc.
  file_path VARCHAR(500) NOT NULL,
  file_format VARCHAR(10) NOT NULL, -- 'PDF', 'XLSX', 'CSV'
  file_size INT,
  generated_by INT NOT NULL,
  generated_at DATETIME NOT NULL,
  status ENUM('Draft', 'Final', 'Submitted', 'Archived') DEFAULT 'Draft',
  metadata JSON, -- Additional document-specific data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id),
  INDEX idx_period_type (payroll_period_id, document_type),
  INDEX idx_generated_at (generated_at)
);
```

#### remittances
```sql
CREATE TABLE remittances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_period_id INT NOT NULL,
  agency_type ENUM('BIR', 'GSIS', 'PagIBIG', 'PhilHealth', 'Bank', 'Cooperative') NOT NULL,
  agency_name VARCHAR(100) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
  payment_date DATE,
  payment_reference VARCHAR(100),
  check_number VARCHAR(50),
  paid_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (paid_by) REFERENCES users(id),
  INDEX idx_period_agency (payroll_period_id, agency_type),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
);
```

#### tax_tables
```sql
CREATE TABLE tax_tables (
  id INT PRIMARY KEY AUTO_INCREMENT,
  effective_date DATE NOT NULL,
  bracket_min DECIMAL(12,2) NOT NULL,
  bracket_max DECIMAL(12,2),
  base_tax DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.20 for 20%
  excess_over DECIMAL(12,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_effective_date (effective_date),
  INDEX idx_active (is_active)
);
```

#### employee_overrides
```sql
CREATE TABLE employee_overrides (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  payroll_period_id INT,
  override_type ENUM('Allowance', 'Deduction', 'Salary Adjustment') NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  override_amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  approved_by INT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_employee_period (employee_id, payroll_period_id),
  INDEX idx_effective_dates (effective_from, effective_to)
);
```

### Configuration Tables

#### deduction_types
```sql
CREATE TABLE deduction_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('Mandatory', 'Loan', 'Other') NOT NULL,
  is_taxable BOOLEAN DEFAULT FALSE,
  calculation_method ENUM('Fixed', 'Percentage', 'Billing', 'Formula') NOT NULL,
  calculation_value DECIMAL(10,4), -- For fixed amounts or percentages
  calculation_formula TEXT, -- For complex formulas
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### allowance_types
```sql
CREATE TABLE allowance_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category ENUM('RATA', 'Hazard Pay', 'Subsistence', 'Laundry', 'Other') NOT NULL,
  is_taxable BOOLEAN DEFAULT TRUE,
  calculation_method ENUM('Fixed', 'Daily Rate', 'Percentage', 'Formula') NOT NULL,
  calculation_value DECIMAL(10,4),
  calculation_formula TEXT,
  eligibility_criteria JSON, -- Position, department, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Error Handling

### Validation Errors
- **DTR Import Errors**: Missing employees, invalid dates, duplicate records
- **Billing Import Errors**: Unmatched employees, invalid amounts, format errors
- **Calculation Errors**: Negative net pay, missing salary data, formula errors
- **Workflow Errors**: Invalid state transitions, missing prerequisites

### Error Response Format
```javascript
{
  success: false,
  error: "Error message",
  errorCode: "ERR_CODE",
  details: {
    field: "field_name",
    value: "invalid_value",
    constraint: "validation_rule"
  },
  timestamp: "2025-10-29T10:30:00Z"
}
```

### Error Recovery
- **Automatic Retry**: For transient database errors (3 attempts with exponential backoff)
- **Manual Intervention**: For data validation errors (flag for review, provide correction interface)
- **Rollback**: For calculation errors (revert period to previous status, preserve audit trail)

## Testing Strategy

### Unit Tests
- **Calculation Engine**: Test all formulas with known inputs/outputs
- **Billing Parsers**: Test with sample files from each agency
- **Validators**: Test all validation rules with valid/invalid data
- **Document Generators**: Test PDF/Excel generation with sample data

### Integration Tests
- **Workflow**: Test complete period lifecycle from Draft to Completed
- **Data Flow**: Test DTR → Calculation → CAFOA → ADA → Remittance flow
- **Database**: Test transactions, rollbacks, and data integrity
- **File Processing**: Test upload, parsing, and storage of various file types

### End-to-End Tests
- **Complete Payroll Cycle**: Process a full period with real-world data
- **Multi-User Scenarios**: Test concurrent access and role-based permissions
- **Error Scenarios**: Test error handling and recovery mechanisms
- **Performance**: Test with large datasets (500+ employees)

### Test Data
- **Sample Employees**: 50 employees with varied positions, salaries, and deductions
- **Sample DTR Files**: Excel and CSV formats with various attendance patterns
- **Sample Billing Files**: GSIS, Pag-IBIG, bank statements with loan deductions
- **Sample Periods**: Multiple periods across different months and years

### Testing Tools
- **Jest**: Unit and integration testing framework
- **Supertest**: API endpoint testing
- **Database Fixtures**: Seed data for consistent test environments
- **Mock Services**: Mock external dependencies (file system, email)

## Performance Considerations

### Optimization Strategies
- **Batch Processing**: Process payroll items in batches of 50 employees
- **Database Indexing**: Index on frequently queried fields (period_id, employee_id, status)
- **Caching**: Cache tax tables, deduction types, and allowance types
- **Async Operations**: Use async/await for I/O operations (file uploads, database queries)
- **Connection Pooling**: MySQL connection pool with 10-20 connections

### Expected Performance
- **DTR Import**: < 5 seconds for 500 employees
- **Payroll Calculation**: < 30 seconds for 500 employees
- **Document Generation**: < 10 seconds per document type
- **Report Generation**: < 15 seconds for complex reports

### Scalability
- **Current Scope**: 500-1000 employees
- **Database**: MySQL can handle 10,000+ employees with proper indexing
- **File Storage**: Local file system with periodic archival to cloud storage
- **Concurrent Users**: Support 20-50 concurrent users

## Security Considerations

### Authentication & Authorization
- **Role-Based Access Control (RBAC)**: Admin, Payroll Officer, Accountant, Treasurer, Employee
- **Session Management**: Secure session cookies with 8-hour timeout
- **Password Policy**: Minimum 8 characters, complexity requirements
- **Audit Logging**: Log all sensitive operations (calculations, approvals, payments)

### Data Protection
- **Encryption at Rest**: Encrypt sensitive fields (salary, account numbers) in database
- **Encryption in Transit**: HTTPS for all API communications
- **File Upload Validation**: Validate file types, sizes, and content
- **SQL Injection Prevention**: Use parameterized queries for all database operations
- **XSS Prevention**: Sanitize all user inputs and outputs

### Access Controls
- **Payroll Period Locking**: Prevent modifications to finalized periods
- **Document Access**: Restrict document downloads to authorized users
- **Approval Workflows**: Require multiple approvals for CAFOA and ADA
- **Audit Trail**: Immutable log of all changes with user, timestamp, and action

## Deployment Strategy

### Environment Setup
- **Development**: Local MySQL, Node.js development server
- **Staging**: Intranet server with production-like configuration
- **Production**: LGU intranet server (10.0.0.73:3000)

### Database Migration
- **Migration Scripts**: SQL scripts for schema changes
- **Data Migration**: Scripts to migrate existing payroll data
- **Rollback Plan**: Backup database before each migration

### Deployment Steps
1. Backup production database
2. Run database migration scripts
3. Deploy new backend code
4. Deploy new frontend build
5. Restart application server
6. Verify critical functionality
7. Monitor logs for errors

### Rollback Plan
1. Stop application server
2. Restore database from backup
3. Deploy previous version of code
4. Restart application server
5. Verify system functionality

## Monitoring and Maintenance

### Application Monitoring
- **Health Checks**: `/health` endpoint for system status
- **Error Logging**: Winston logger with file and console transports
- **Performance Metrics**: Track API response times and database query performance
- **Audit Logs**: Track all payroll operations for compliance

### Database Maintenance
- **Backup Schedule**: Daily automated backups at 2:00 AM
- **Retention Policy**: Keep 30 days of daily backups, 12 months of monthly backups
- **Index Optimization**: Monthly index analysis and optimization
- **Data Archival**: Archive completed payroll periods older than 3 years

### System Updates
- **Security Patches**: Apply critical security updates within 48 hours
- **Feature Updates**: Quarterly feature releases with user acceptance testing
- **Regulatory Updates**: Update tax tables and contribution rates as regulations change
- **Documentation**: Maintain up-to-date user guides and technical documentation
