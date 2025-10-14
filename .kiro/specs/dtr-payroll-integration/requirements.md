# DTR (Daily Time Record) Module - Requirements Document

## Introduction

This document outlines the requirements for implementing a Daily Time Record (DTR) module that integrates with the existing payroll system. The DTR module will replace the manual employee selection and working days adjustment process with an Excel-based import system that automatically populates attendance data for payroll processing.

The system will enable administrators to export employee templates, populate them with attendance data from the company's attendance system, and import the data back into the payroll module for automated payroll calculation.

## Requirements

### Requirement 1: DTR Template Export

**User Story:** As an admin, I want to export an employee template with employee numbers, so that I can populate it with attendance data from our company's attendance system.

#### Acceptance Criteria

1. WHEN the admin accesses the payroll period processing page THEN the system SHALL display an "Export DTR Template" button
2. WHEN the admin clicks "Export DTR Template" for a specific payroll period THEN the system SHALL generate an Excel file containing:
   - Employee Number (from `employees.employee_number`)
   - Employee Name (full name concatenated)
   - Position (from `employees.plantilla_position`)
   - Period Start Date (from `payroll_periods.start_date`)
   - Period End Date (from `payroll_periods.end_date`)
   - Total Working Days (empty column for data entry)
3. WHEN the template is generated THEN the system SHALL only include active employees (where `employment_status` = 'Active' AND `deleted_at` IS NULL)
4. WHEN the template is downloaded THEN the file SHALL be named in the format: `DTR_Template_[Year]_[Month]_Period[Number]_[Timestamp].xlsx`

### Requirement 2: DTR Data Import

**User Story:** As an admin, I want to import DTR data from an Excel file, so that employee attendance is automatically loaded into the payroll system.

#### Acceptance Criteria

1. WHEN the admin accesses the payroll period processing page THEN the system SHALL display an "Import DTR" button
2. WHEN the admin clicks "Import DTR" THEN the system SHALL open a file upload dialog accepting Excel files (.xlsx, .xls)
3. WHEN the admin selects a file THEN the system SHALL validate the file format and structure
4. IF the file structure is invalid THEN the system SHALL display an error message and reject the import
5. WHEN the file is valid THEN the system SHALL parse the Excel data and validate each row
6. WHEN parsing is complete THEN the system SHALL display a preview showing:
   - Total records found
   - Valid records
   - Invalid records with specific error messages
   - Warnings for records that will be skipped
7. WHEN the admin confirms the import THEN the system SHALL process all valid records and store them in the `dtr_records` table

### Requirement 3: Employee Matching

**User Story:** As an admin, I want the system to match DTR records to employees using employee numbers, so that attendance data is accurately linked to the correct employees.

#### Acceptance Criteria

1. WHEN the system processes each DTR record THEN it SHALL match employees using the `employees.employee_number` field
2. IF an employee number in the Excel file does not exist in the system THEN the system SHALL:
   - Mark the record as invalid
   - Add a warning message: "Employee number [X] not found in system"
   - Skip the record without failing the entire import
3. IF an employee number exists but the employee is not active THEN the system SHALL:
   - Mark the record as a warning
   - Add a warning message: "Employee [X] is not active (status: [status])"
   - Allow the admin to decide whether to include or exclude the record
4. WHEN all records are processed THEN the system SHALL display a summary of matched, unmatched, and skipped employees

### Requirement 4: Working Days Validation

**User Story:** As an admin, I want the system to validate working days data, so that only accurate attendance information is imported.

#### Acceptance Criteria

1. WHEN the system validates a DTR record THEN it SHALL check that the "Total Working Days" field contains a valid decimal number
2. IF the working days value is not a number THEN the system SHALL mark the record as invalid with error: "Invalid working days value"
3. IF the working days value is negative THEN the system SHALL mark the record as invalid with error: "Working days cannot be negative"
4. IF the working days value is zero THEN the system SHALL mark the record as a warning with message: "Working days is zero"
5. WHEN the working days value is a decimal (e.g., 0.5, 10.5) THEN the system SHALL accept and store it with up to 2 decimal places
6. IF the working days value exceeds the maximum possible days in the period THEN the system SHALL mark the record as a warning with message: "Working days ([X]) exceeds period duration ([Y] days)"

### Requirement 5: Payroll Period Alignment

**User Story:** As an admin, I want DTR records to align with the correct payroll period, so that attendance data is processed for the appropriate pay period.

#### Acceptance Criteria

1. WHEN the admin imports a DTR file THEN the system SHALL require selection of a target payroll period
2. WHEN the system validates each DTR record THEN it SHALL compare the record's start_date and end_date with the selected payroll period's dates
3. IF the DTR record's start_date does not match `payroll_periods.start_date` THEN the system SHALL:
   - Mark the record as invalid
   - Add error message: "Start date mismatch: Expected [period_start], Found [record_start]"
   - Not include the record in the current import
4. IF the DTR record's end_date does not match `payroll_periods.end_date` THEN the system SHALL:
   - Mark the record as invalid
   - Add error message: "End date mismatch: Expected [period_end], Found [record_end]"
   - Not include the record in the current import
5. WHEN date mismatches occur THEN the system SHALL allow the admin to:
   - Remove the mismatched records from the import
   - Cancel the import and correct the source file
   - View which records have date mismatches before confirming

### Requirement 6: DTR Data Storage

**User Story:** As a system administrator, I want DTR data stored separately from payroll items, so that we maintain a clear audit trail and can reprocess payroll if needed.

#### Acceptance Criteria

1. WHEN valid DTR records are imported THEN the system SHALL store them in a new `dtr_records` table
2. WHEN storing DTR records THEN the system SHALL capture:
   - Employee ID (foreign key to `employees.id`)
   - Payroll Period ID (foreign key to `payroll_periods.id`)
   - Employee Number (for reference)
   - Start Date
   - End Date
   - Working Days (decimal with 2 decimal places)
   - Import Batch ID (to group records from the same import)
   - Imported By (user ID who performed the import)
   - Imported At (timestamp of import)
   - Status (enum: 'Active', 'Superseded', 'Deleted')
3. WHEN a DTR record is imported THEN it SHALL NOT directly update the `payroll_items.working_days` field
4. WHEN payroll is processed THEN the system SHALL read working days from the `dtr_records` table and populate `payroll_items.working_days`
5. IF multiple DTR imports exist for the same employee and period THEN the system SHALL use the most recent active record

### Requirement 7: DTR Import History and Audit Trail

**User Story:** As an admin, I want to track all DTR imports, so that I can audit who imported data and when.

#### Acceptance Criteria

1. WHEN a DTR import is initiated THEN the system SHALL create a record in a new `dtr_import_batches` table
2. WHEN storing import batch information THEN the system SHALL capture:
   - Payroll Period ID
   - File Name (original uploaded file name)
   - File Path (stored file location)
   - Total Records (count of records in file)
   - Valid Records (count of successfully imported records)
   - Invalid Records (count of rejected records)
   - Warning Records (count of records with warnings)
   - Imported By (user ID)
   - Imported At (timestamp)
   - Status (enum: 'Completed', 'Partial', 'Failed')
   - Error Log (JSON containing all errors and warnings)
3. WHEN the admin views a payroll period THEN the system SHALL display a history of all DTR imports for that period
4. WHEN viewing import history THEN the system SHALL show:
   - Import date and time
   - Imported by (username)
   - Number of records imported
   - Status
   - Option to view detailed import log
5. WHEN the admin clicks to view detailed import log THEN the system SHALL display all errors, warnings, and successfully imported records

### Requirement 8: Payroll Processing Integration

**User Story:** As an admin, I want payroll to automatically use DTR data, so that I don't have to manually select employees or adjust working days.

#### Acceptance Criteria

1. WHEN the admin initiates payroll processing for a period THEN the system SHALL automatically retrieve DTR records for that period
2. IF no DTR records exist for the period THEN the system SHALL display an error: "No DTR data found for this period. Please import DTR before processing payroll."
3. WHEN DTR records exist THEN the system SHALL:
   - Remove the "Select Employees" step from the payroll workflow
   - Remove the manual "Working Days" adjustment interface
   - Automatically create payroll items for all employees with DTR records
4. WHEN creating payroll items THEN the system SHALL:
   - Use `dtr_records.working_days` to populate `payroll_items.working_days`
   - Use `employees.current_daily_rate` to calculate basic pay
   - Calculate basic_pay as: `daily_rate × working_days`
5. WHEN payroll calculation is complete THEN the system SHALL display a summary showing:
   - Total employees processed
   - Total working days
   - Total basic pay
   - Link to DTR source data

### Requirement 9: DTR Record Management

**User Story:** As an admin, I want to view and manage DTR records, so that I can correct errors or handle special cases.

#### Acceptance Criteria

1. WHEN the admin views a payroll period THEN the system SHALL provide a "View DTR Records" option
2. WHEN viewing DTR records THEN the system SHALL display a table with:
   - Employee Number
   - Employee Name
   - Position
   - Working Days
   - Import Date
   - Imported By
   - Status
   - Actions (Edit, Delete)
3. WHEN the admin clicks "Edit" on a DTR record THEN the system SHALL allow modification of:
   - Working Days (with validation)
   - Notes (to explain the change)
4. WHEN a DTR record is edited THEN the system SHALL:
   - Log the change in `audit_logs`
   - Update the record's `updated_at` timestamp
   - Store the user ID who made the change
5. WHEN the admin clicks "Delete" on a DTR record THEN the system SHALL:
   - Mark the record status as 'Deleted' (soft delete)
   - Log the deletion in `audit_logs`
   - Warn if payroll has already been processed for that period

### Requirement 10: Re-import and Correction Handling

**User Story:** As an admin, I want to re-import DTR data if corrections are needed, so that I can fix attendance errors before finalizing payroll.

#### Acceptance Criteria

1. WHEN the admin imports DTR for a period that already has DTR data THEN the system SHALL display a warning: "DTR data already exists for this period. Re-importing will supersede existing records."
2. WHEN the admin confirms re-import THEN the system SHALL:
   - Mark all existing DTR records for that period as 'Superseded'
   - Import the new records with status 'Active'
   - Create a new import batch record
3. IF payroll has already been processed (status is 'Completed' or 'Paid') THEN the system SHALL:
   - Display an error: "Cannot re-import DTR. Payroll has been finalized for this period."
   - Prevent the re-import
4. IF payroll is in 'Draft' or 'Processing' status THEN the system SHALL:
   - Allow re-import
   - Display a warning: "Payroll items will need to be recalculated after re-import"
   - Provide an option to automatically recalculate payroll after import

### Requirement 11: Error Handling and User Feedback

**User Story:** As an admin, I want clear error messages and guidance, so that I can quickly resolve issues with DTR imports.

#### Acceptance Criteria

1. WHEN any validation error occurs THEN the system SHALL display a user-friendly error message explaining:
   - What went wrong
   - Which record(s) are affected
   - How to fix the issue
2. WHEN multiple errors occur THEN the system SHALL group errors by type and display a summary
3. WHEN the import completes with warnings THEN the system SHALL:
   - Display a success message with warning count
   - Provide a link to view all warnings
   - Allow the admin to proceed or cancel
4. WHEN the import fails completely THEN the system SHALL:
   - Roll back any partial changes
   - Display the primary error
   - Preserve the uploaded file for review
   - Log the failure in `audit_logs`
5. WHEN the admin needs help THEN the system SHALL provide:
   - Inline help text explaining DTR import process
   - Link to documentation
   - Example template file

### Requirement 12: Performance and Scalability

**User Story:** As a system administrator, I want DTR imports to handle large datasets efficiently, so that processing doesn't timeout or slow down the system.

#### Acceptance Criteria

1. WHEN importing a file with up to 500 employee records THEN the system SHALL complete processing within 30 seconds
2. WHEN importing a file with more than 500 records THEN the system SHALL:
   - Process records in batches of 100
   - Display a progress indicator
   - Allow the admin to cancel the import
3. WHEN processing large imports THEN the system SHALL use database transactions to ensure data integrity
4. IF an import is interrupted THEN the system SHALL:
   - Roll back all changes from that import batch
   - Mark the import batch as 'Failed'
   - Allow the admin to retry

## Non-Functional Requirements

### Security
- Only users with 'admin' role can access DTR import functionality
- All DTR operations must be logged in `audit_logs`
- Uploaded files must be scanned for malicious content
- File uploads must be limited to 10MB maximum size

### Data Integrity
- DTR records must maintain referential integrity with employees and payroll periods
- Soft deletes must be used to preserve audit trail
- All monetary calculations must use DECIMAL types to prevent rounding errors

### Usability
- Import process must be intuitive with clear step-by-step guidance
- Error messages must be actionable and specific
- Progress indicators must be shown for long-running operations

### Compatibility
- Excel files must support both .xlsx and .xls formats
- System must handle various date formats in Excel files
- Decimal separators (both comma and period) must be supported
