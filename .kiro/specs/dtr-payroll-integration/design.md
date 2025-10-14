# DTR (Daily Time Record) Module - Design Document

## Overview

The DTR module introduces an Excel-based attendance import system that replaces the manual employee selection and working days adjustment process in payroll. The design follows the existing system architecture patterns, integrating seamlessly with the current payroll workflow while maintaining data integrity and audit trail requirements.

### Key Design Principles

1. **Separation of Concerns**: DTR data is stored separately from payroll items to maintain audit trail
2. **Data Integrity**: All operations maintain referential integrity and use transactions
3. **User Experience**: Clear workflow with validation feedback at each step
4. **Audit Trail**: Complete tracking of all imports and modifications
5. **Backward Compatibility**: Existing payroll functionality remains intact

## Architecture

### System Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    DTR MODULE ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React)              Backend (Node.js/Express)   │
│  ├── DTRImportPage.tsx        ├── dtrController.js         │
│  ├── DTRTemplateExport.tsx    ├── dtrService.js            │
│  ├── DTRRecordsTable.tsx      ├── excelParser.js           │
│  └── DTRImportPreview.tsx     └── dtrValidator.js          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE (MySQL)                         │
│  ├── dtr_records              (New Table)                  │
│  ├── dtr_import_batches       (New Table)                  │
│  ├── payroll_periods          (Existing - Modified)        │
│  ├── payroll_items            (Existing - Modified)        │
│  └── employees                (Existing - Referenced)      │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Integration

The DTR module integrates into the existing payroll workflow as follows:

**Current Payroll Workflow:**
```
Create Period → Select Employees → Configure Working Days → Process Payroll → Finalize
```

**New DTR-Integrated Workflow:**
```
Create Period → Import DTR → [Auto-Process Payroll] → Review → Finalize
```

## Components and Interfaces

### Database Schema

#### 1. dtr_records Table

```sql
CREATE TABLE `dtr_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `employee_number` varchar(20) NOT NULL COMMENT 'Denormalized for reference',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `working_days` decimal(4,2) NOT NULL,
  `import_batch_id` int NOT NULL,
  `status` enum('Active','Superseded','Deleted') NOT NULL DEFAULT 'Active',
  `notes` text DEFAULT NULL,
  `imported_by` int NOT NULL,
  `imported_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_period_batch` (`employee_id`, `payroll_period_id`, `import_batch_id`),
  KEY `idx_dtr_period` (`payroll_period_id`),
  KEY `idx_dtr_employee` (`employee_id`),
  KEY `idx_dtr_batch` (`import_batch_id`),
  KEY `idx_dtr_status` (`status`),
  KEY `idx_dtr_employee_number` (`employee_number`),
  KEY `idx_dtr_period_status` (`payroll_period_id`, `status`),
  CONSTRAINT `dtr_records_ibfk_1` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dtr_records_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dtr_records_ibfk_3` FOREIGN KEY (`import_batch_id`) REFERENCES `dtr_import_batches` (`id`),
  CONSTRAINT `dtr_records_ibfk_4` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`),
  CONSTRAINT `dtr_records_ibfk_5` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily Time Record attendance data';
```

**Design Rationale:**
- `employee_number` is denormalized for quick reference and reporting
- `status` enum allows soft deletes and superseding old records
- Unique constraint on `employee_id`, `payroll_period_id`, `import_batch_id` prevents duplicates within a batch
- Multiple indexes optimize common queries (by period, by employee, by status)

#### 2. dtr_import_batches Table

```sql
CREATE TABLE `dtr_import_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `total_records` int NOT NULL DEFAULT 0,
  `valid_records` int NOT NULL DEFAULT 0,
  `invalid_records` int NOT NULL DEFAULT 0,
  `warning_records` int NOT NULL DEFAULT 0,
  `status` enum('Processing','Completed','Partial','Failed') NOT NULL DEFAULT 'Processing',
  `error_log` json DEFAULT NULL COMMENT 'Stores all errors and warnings',
  `imported_by` int NOT NULL,
  `imported_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_batch_period` (`payroll_period_id`),
  KEY `idx_batch_status` (`status`),
  KEY `idx_batch_imported_by` (`imported_by`),
  KEY `idx_batch_imported_at` (`imported_at`),
  CONSTRAINT `dtr_import_batches_ibfk_1` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dtr_import_batches_ibfk_2` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DTR import batch tracking and audit trail';
```

**Design Rationale:**
- Tracks each import operation as a batch for audit purposes
- `error_log` JSON field stores detailed validation results
- Status tracking allows monitoring of long-running imports
- File metadata preserved for troubleshooting

#### 3. Database View for DTR Records

```sql
CREATE OR REPLACE VIEW `v_dtr_records_detail` AS
SELECT 
  dr.id,
  dr.payroll_period_id,
  pp.year,
  pp.month,
  pp.period_number,
  pp.start_date AS period_start_date,
  pp.end_date AS period_end_date,
  dr.employee_id,
  dr.employee_number,
  CONCAT(e.first_name, ' ', IFNULL(CONCAT(LEFT(e.middle_name, 1), '. '), ''), e.last_name) AS employee_name,
  e.plantilla_position,
  e.current_daily_rate,
  dr.start_date,
  dr.end_date,
  dr.working_days,
  (dr.working_days * e.current_daily_rate) AS calculated_basic_pay,
  dr.status,
  dr.notes,
  dr.import_batch_id,
  ib.file_name AS import_file_name,
  ib.imported_at AS import_date,
  u1.username AS imported_by_username,
  dr.updated_by,
  u2.username AS updated_by_username,
  dr.updated_at
FROM dtr_records dr
JOIN payroll_periods pp ON dr.payroll_period_id = pp.id
JOIN employees e ON dr.employee_id = e.id
JOIN dtr_import_batches ib ON dr.import_batch_id = ib.id
JOIN users u1 ON dr.imported_by = u1.id
LEFT JOIN users u2 ON dr.updated_by = u2.id
WHERE e.deleted_at IS NULL;
```

### Backend API Endpoints

#### DTR Controller (`backend/controllers/dtrController.js`)

```javascript
// Template Export
GET    /api/dtr/template/:periodId
  - Generates Excel template for specified payroll period
  - Returns: Excel file download

// DTR Import
POST   /api/dtr/import/:periodId
  - Accepts Excel file upload
  - Validates and parses data
  - Returns: Import preview with validation results

POST   /api/dtr/import/:periodId/confirm
  - Confirms and processes validated import
  - Creates dtr_records and import_batch
  - Returns: Import summary

// DTR Records Management
GET    /api/dtr/records/:periodId
  - Retrieves all DTR records for a period
  - Returns: Array of DTR records with employee details

GET    /api/dtr/records/:periodId/:employeeId
  - Retrieves specific employee's DTR record
  - Returns: Single DTR record

PUT    /api/dtr/records/:id
  - Updates a DTR record (working days, notes)
  - Logs change in audit_logs
  - Returns: Updated record

DELETE /api/dtr/records/:id
  - Soft deletes a DTR record (sets status to 'Deleted')
  - Logs deletion in audit_logs
  - Returns: Success message

// Import History
GET    /api/dtr/imports/:periodId
  - Retrieves import history for a period
  - Returns: Array of import batches

GET    /api/dtr/imports/batch/:batchId
  - Retrieves detailed import batch information
  - Returns: Batch details with error log

// DTR Statistics
GET    /api/dtr/stats/:periodId
  - Retrieves DTR statistics for a period
  - Returns: Summary statistics (total employees, total working days, etc.)
```

#### DTR Service Layer (`backend/services/dtrService.js`)

```javascript
class DTRService {
  // Template Generation
  async generateTemplate(periodId, userId)
  
  // Import Processing
  async parseExcelFile(file, periodId)
  async validateDTRRecords(records, periodId)
  async saveDTRRecords(records, batchId, userId)
  
  // Record Management
  async getDTRRecords(periodId, filters)
  async updateDTRRecord(recordId, updates, userId)
  async deleteDTRRecord(recordId, userId)
  
  // Import History
  async getImportHistory(periodId)
  async getImportBatchDetails(batchId)
  
  // Validation Helpers
  async validateEmployeeNumber(employeeNumber)
  async validateDateAlignment(startDate, endDate, periodId)
  async validateWorkingDays(workingDays, periodDuration)
  
  // Supersede Logic
  async supersedePreviousRecords(periodId, newBatchId)
}
```

#### Excel Parser Utility (`backend/utils/excelParser.js`)

```javascript
class ExcelParser {
  // Parse Excel file to JSON
  async parseFile(filePath)
  
  // Validate Excel structure
  validateStructure(data)
  
  // Extract DTR records
  extractDTRRecords(data)
  
  // Handle various date formats
  parseDateField(value)
  
  // Handle decimal separators
  parseDecimalField(value)
}
```

#### DTR Validator (`backend/utils/dtrValidator.js`)

```javascript
class DTRValidator {
  // Validate single record
  validateRecord(record, period, employees)
  
  // Batch validation
  validateBatch(records, period, employees)
  
  // Specific validations
  validateEmployeeExists(employeeNumber, employees)
  validateDateMatch(recordDates, periodDates)
  validateWorkingDays(days, maxDays)
  validateDecimalPrecision(value)
  
  // Error formatting
  formatValidationErrors(errors)
  formatWarnings(warnings)
}
```

### Frontend Components

#### 1. DTR Import Page (`frontend/src/pages/payroll/DTRImportPage.tsx`)

```typescript
interface DTRImportPageProps {
  periodId: number;
}

// Main page component that orchestrates the import workflow
// Steps: Upload → Validate → Preview → Confirm → Complete
```

#### 2. DTR Template Export Component (`frontend/src/components/payroll/DTRTemplateExport.tsx`)

```typescript
interface DTRTemplateExportProps {
  periodId: number;
  periodName: string;
}

// Button component that triggers template download
// Handles loading state and error display
```

#### 3. DTR File Upload Component (`frontend/src/components/payroll/DTRFileUpload.tsx`)

```typescript
interface DTRFileUploadProps {
  periodId: number;
  onUploadSuccess: (previewData: DTRPreviewData) => void;
  onUploadError: (error: string) => void;
}

// Drag-and-drop file upload with validation
// Shows file info and upload progress
```

#### 4. DTR Import Preview Component (`frontend/src/components/payroll/DTRImportPreview.tsx`)

```typescript
interface DTRImportPreviewProps {
  previewData: DTRPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
}

interface DTRPreviewData {
  totalRecords: number;
  validRecords: DTRRecord[];
  invalidRecords: DTRValidationError[];
  warnings: DTRWarning[];
  summary: {
    totalEmployees: number;
    totalWorkingDays: number;
    estimatedBasicPay: number;
  };
}

// Displays validation results in tabs:
// - Valid Records (green)
// - Invalid Records (red) with error messages
// - Warnings (yellow) with warning messages
// - Summary statistics
```

#### 5. DTR Records Table Component (`frontend/src/components/payroll/DTRRecordsTable.tsx`)

```typescript
interface DTRRecordsTableProps {
  periodId: number;
  editable?: boolean;
  onRecordUpdate?: (recordId: number, updates: Partial<DTRRecord>) => void;
  onRecordDelete?: (recordId: number) => void;
}

// Data table showing all DTR records for a period
// Features: sorting, filtering, inline editing, delete
// Displays: employee info, working days, import info, actions
```

#### 6. DTR Import History Component (`frontend/src/components/payroll/DTRImportHistory.tsx`)

```typescript
interface DTRImportHistoryProps {
  periodId: number;
}

// Timeline/list view of all imports for a period
// Shows: import date, user, record counts, status
// Allows viewing detailed error logs
```

## Data Models

### DTR Record Model

```typescript
interface DTRRecord {
  id: number;
  payrollPeriodId: number;
  employeeId: number;
  employeeNumber: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  workingDays: number; // decimal with 2 places
  importBatchId: number;
  status: 'Active' | 'Superseded' | 'Deleted';
  notes?: string;
  importedBy: number;
  importedAt: string; // ISO timestamp
  updatedBy?: number;
  updatedAt?: string; // ISO timestamp
}
```

### DTR Import Batch Model

```typescript
interface DTRImportBatch {
  id: number;
  payrollPeriodId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warningRecords: number;
  status: 'Processing' | 'Completed' | 'Partial' | 'Failed';
  errorLog?: DTRErrorLog;
  importedBy: number;
  importedAt: string;
  completedAt?: string;
}
```

### DTR Error Log Model

```typescript
interface DTRErrorLog {
  errors: Array<{
    row: number;
    employeeNumber: string;
    field: string;
    message: string;
    value?: any;
  }>;
  warnings: Array<{
    row: number;
    employeeNumber: string;
    message: string;
    value?: any;
  }>;
}
```

### DTR Validation Result Model

```typescript
interface DTRValidationResult {
  isValid: boolean;
  record: DTRRecord;
  errors: string[];
  warnings: string[];
}
```

## Error Handling

### Validation Error Types

```typescript
enum DTRValidationErrorType {
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYEE_INACTIVE = 'EMPLOYEE_INACTIVE',
  INVALID_WORKING_DAYS = 'INVALID_WORKING_DAYS',
  NEGATIVE_WORKING_DAYS = 'NEGATIVE_WORKING_DAYS',
  WORKING_DAYS_EXCEEDS_PERIOD = 'WORKING_DAYS_EXCEEDS_PERIOD',
  DATE_MISMATCH = 'DATE_MISMATCH',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DUPLICATE_EMPLOYEE = 'DUPLICATE_EMPLOYEE',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}
```

### Error Response Format

```typescript
interface DTRErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Success Response Format

```typescript
interface DTRSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

## Testing Strategy

### Unit Tests

1. **Excel Parser Tests**
   - Test parsing various Excel formats (.xlsx, .xls)
   - Test date format handling (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
   - Test decimal separator handling (comma, period)
   - Test malformed file handling

2. **Validator Tests**
   - Test employee number validation
   - Test working days validation (positive, negative, decimal, exceeds period)
   - Test date alignment validation
   - Test batch validation with mixed valid/invalid records

3. **Service Layer Tests**
   - Test DTR record creation
   - Test supersede logic
   - Test soft delete functionality
   - Test import batch creation

### Integration Tests

1. **API Endpoint Tests**
   - Test template export endpoint
   - Test import upload and validation
   - Test import confirmation
   - Test record CRUD operations
   - Test import history retrieval

2. **Database Tests**
   - Test foreign key constraints
   - Test unique constraints
   - Test cascade deletes
   - Test transaction rollback on error

3. **Payroll Integration Tests**
   - Test payroll processing with DTR data
   - Test payroll calculation using working days from DTR
   - Test handling missing DTR data
   - Test re-import and payroll recalculation

### End-to-End Tests

1. **Complete Import Workflow**
   - Export template → Fill data → Import → Validate → Confirm → Process Payroll

2. **Error Scenarios**
   - Import with invalid employee numbers
   - Import with date mismatches
   - Import with invalid working days
   - Re-import after payroll finalization (should fail)

3. **Correction Workflow**
   - Import → Identify errors → Edit records → Reprocess payroll

## Security Considerations

### Authentication & Authorization

- All DTR endpoints require authentication
- Only users with `role = 'admin'` can access DTR functionality
- Middleware: `auth.js` and `roleCheck.js` (existing)

### File Upload Security

```javascript
// File validation rules
const DTR_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ],
  allowedExtensions: ['.xlsx', '.xls'],
  uploadPath: 'uploads/dtr/',
  virusScan: true, // Enable virus scanning
};
```

### Data Validation

- Server-side validation for all inputs
- SQL injection prevention using parameterized queries
- XSS prevention by sanitizing user inputs
- File path traversal prevention

### Audit Logging

All DTR operations logged in `audit_logs` table:

```javascript
// Log DTR import
await auditLog.create({
  user_id: userId,
  action: 'DTR_IMPORT',
  table_name: 'dtr_records',
  record_id: batchId,
  new_values: { totalRecords, validRecords, invalidRecords },
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});

// Log DTR record update
await auditLog.create({
  user_id: userId,
  action: 'DTR_UPDATE',
  table_name: 'dtr_records',
  record_id: recordId,
  old_values: { working_days: oldValue },
  new_values: { working_days: newValue, notes },
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});
```

## Performance Optimization

### Database Optimization

1. **Indexes**
   - Composite index on `(payroll_period_id, status)` for fast active record retrieval
   - Index on `employee_number` for quick lookups during import
   - Index on `import_batch_id` for batch operations

2. **Query Optimization**
   - Use view `v_dtr_records_detail` for complex joins
   - Batch inserts for import (100 records per transaction)
   - Use `SELECT FOR UPDATE` for concurrent import prevention

3. **Caching Strategy**
   - Cache employee list during import validation
   - Cache payroll period details
   - Invalidate cache on employee or period updates

### File Processing Optimization

```javascript
// Process large files in chunks
async function processLargeImport(file, periodId, userId) {
  const CHUNK_SIZE = 100;
  const records = await parseExcelFile(file);
  
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    await processChunk(chunk, periodId, userId);
    
    // Update progress
    await updateImportProgress(batchId, i + chunk.length, records.length);
  }
}
```

### Frontend Optimization

- Lazy load DTR components
- Paginate large DTR record tables (50 records per page)
- Debounce search/filter inputs
- Use React Query for caching API responses

## Migration Strategy

### Database Migration

```sql
-- Migration: Add DTR tables
-- File: backend/migrations/YYYYMMDDHHMMSS_add_dtr_tables.sql

-- Create dtr_import_batches table
CREATE TABLE `dtr_import_batches` (...);

-- Create dtr_records table
CREATE TABLE `dtr_records` (...);

-- Create view
CREATE OR REPLACE VIEW `v_dtr_records_detail` AS ...;

-- Add indexes
CREATE INDEX idx_dtr_period ON dtr_records(payroll_period_id);
CREATE INDEX idx_dtr_employee ON dtr_records(employee_id);
-- ... additional indexes
```

### Rollback Plan

```sql
-- Rollback: Remove DTR tables
-- File: backend/migrations/YYYYMMDDHHMMSS_add_dtr_tables_rollback.sql

DROP VIEW IF EXISTS `v_dtr_records_detail`;
DROP TABLE IF EXISTS `dtr_records`;
DROP TABLE IF EXISTS `dtr_import_batches`;
```

### Data Migration

No data migration needed as this is a new feature. Existing payroll data remains unchanged.

## Deployment Checklist

### Backend Deployment

- [ ] Run database migrations
- [ ] Deploy new API endpoints
- [ ] Configure file upload directory with proper permissions
- [ ] Update API documentation
- [ ] Configure virus scanning for uploads
- [ ] Set up monitoring for import operations

### Frontend Deployment

- [ ] Deploy new DTR components
- [ ] Update payroll workflow UI
- [ ] Add DTR menu items to navigation
- [ ] Update user documentation
- [ ] Create video tutorial for DTR import

### Testing in Production

- [ ] Test template export with real data
- [ ] Test import with sample file (5-10 employees)
- [ ] Test import with full dataset
- [ ] Verify payroll calculation accuracy
- [ ] Test error scenarios
- [ ] Verify audit logs are created

### Monitoring

- [ ] Set up alerts for failed imports
- [ ] Monitor file upload sizes
- [ ] Track import processing times
- [ ] Monitor database performance
- [ ] Track user adoption metrics

## Future Enhancements

### Phase 2 Features

1. **Bulk Edit DTR Records**
   - Allow editing multiple records at once
   - Apply percentage adjustments to working days

2. **DTR Templates with Formulas**
   - Pre-calculate expected working days
   - Add validation formulas in Excel template

3. **Automated DTR Import**
   - Schedule automatic imports from attendance system
   - API integration with attendance system

4. **DTR Analytics Dashboard**
   - Attendance trends and patterns
   - Absenteeism reports
   - Working days distribution charts

5. **Mobile DTR Entry**
   - Mobile app for supervisors to enter DTR
   - Offline support with sync

6. **DTR Approval Workflow**
   - Require supervisor approval before payroll processing
   - Multi-level approval for corrections

## Conclusion

This design provides a robust, scalable solution for DTR integration with the payroll system. It maintains the existing system's architecture patterns while introducing new functionality that streamlines the payroll process. The separation of DTR data from payroll items ensures data integrity and provides a complete audit trail, while the Excel-based import process offers a familiar and efficient workflow for administrators.
