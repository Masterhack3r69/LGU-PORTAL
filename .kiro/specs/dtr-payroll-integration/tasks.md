# DTR (Daily Time Record) Module - Implementation Plan

- [x] 1. Database Schema Setup

  - Create migration file for DTR tables
  - Create `dtr_import_batches` table with all fields, indexes, and foreign keys
  - Create `dtr_records` table with all fields, indexes, and foreign keys
  - Create `v_dtr_records_detail` view for optimized queries
  - Add indexes for performance optimization
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2_

- [x] 2. Backend - Excel Parser Utility

  - Create `backend/utils/excelParser.js` file
  - Implement `parseFile()` method to read Excel files (.xlsx, .xls)
  - Implement `validateStructure()` to check required columns
  - Implement `extractDTRRecords()` to convert Excel rows to DTR objects
  - Implement `parseDateField()` to handle various date formats
  - Implement `parseDecimalField()` to handle decimal separators (comma and period)
  - Handle empty rows and malformed data gracefully
  - _Requirements: 2.3, 2.4, 4.5_

- [x] 3. Backend - DTR Validator Utility

  - Create `backend/utils/dtrValidator.js` file
  - Implement `validateRecord()` for single record validation
  - Implement `validateBatch()` for batch validation
  - Implement `validateEmployeeExists()` to check employee number against database
  - Implement `validateDateMatch()` to verify start/end dates match payroll period
  - Implement `validateWorkingDays()` to check valid decimal, non-negative, within period range
  - Implement `validateDecimalPrecision()` to ensure 2 decimal places max
  - Implement `formatValidationErrors()` and `formatWarnings()` for user-friendly messages
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 5.4_

- [x] 4. Backend - DTR Service Layer

  - Create `backend/services/dtrService.js` file
  - Implement `generateTemplate()` to create Excel template with employee data
  - Implement `parseExcelFile()` to process uploaded file
  - Implement `validateDTRRecords()` to validate all records in batch
  - Implement `saveDTRRecords()` to insert records into database with transaction
  - Implement `getDTRRecords()` to retrieve records with filters
  - Implement `updateDTRRecord()` to modify working days and notes
  - Implement `deleteDTRRecord()` to soft delete (set status to 'Deleted')
  - Implement `getImportHistory()` to retrieve import batches for a period
  - Implement `getImportBatchDetails()` to get detailed batch information
  - Implement `supersedePreviousRecords()` to mark old records as 'Superseded' on re-import
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.6, 2.7, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4, 9.2, 9.3, 9.4, 9.5, 10.2, 10.3_

- [x] 5. Backend - DTR Controller

  - Create `backend/controllers/dtrController.js` file
  - Implement `GET /api/dtr/template/:periodId` endpoint for template export
  - Implement `POST /api/dtr/import/:periodId` endpoint for file upload and validation
  - Implement `POST /api/dtr/import/:periodId/confirm` endpoint for import confirmation
  - Implement `GET /api/dtr/records/:periodId` endpoint to retrieve all DTR records
  - Implement `GET /api/dtr/records/:periodId/:employeeId` endpoint for specific employee
  - Implement `PUT /api/dtr/records/:id` endpoint to update DTR record
  - Implement `DELETE /api/dtr/records/:id` endpoint to soft delete record
  - Implement `GET /api/dtr/imports/:periodId` endpoint for import history
  - Implement `GET /api/dtr/imports/batch/:batchId` endpoint for batch details
  - Implement `GET /api/dtr/stats/:periodId` endpoint for statistics
  - Add error handling and response formatting for all endpoints
  - Add audit logging for all DTR operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.6, 2.7, 7.3, 7.4, 7.5, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Backend - DTR Routes

  - Create `backend/routes/dtrRoutes.js` file
  - Define all DTR routes with proper HTTP methods
  - Add authentication middleware (`auth.js`) to all routes
  - Add role check middleware (`roleCheck.js`) to restrict to admin only
  - Add file upload middleware (multer) for import endpoint
  - Configure file size limits (10MB) and allowed file types (.xlsx, .xls)
  - Register routes in main Express app
  - _Requirements: 2.1, 2.2, Security Requirements_

- [x] 7. Backend - Payroll Service Integration

  - Modify `backend/services/payrollService.js` to integrate DTR data
  - Update `processPayroll()` method to check for DTR records before processing
  - Implement `getDTRDataForPeriod()` to retrieve active DTR records
  - Update payroll item creation to use `dtr_records.working_days` instead of manual input

  - Add validation to prevent payroll processing without DTR data
  - Update `calculateBasicPay()` to use DTR working days: `daily_rate × working_days`
  - Add error handling for missing DTR data
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Backend - Payroll Controller Updates

  - Modify `backend/controllers/payrollController.js` to remove employee selection step
  - Remove manual working days adjustment endpoints
  - Update payroll processing endpoint to automatically use DTR data
  - Add DTR data validation before payroll processing
  - Update response to include DTR source information
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Frontend - DTR Template Export Component

  - Create `frontend/src/components/payroll/DTRTemplateExport.tsx`
  - Implement button to trigger template download
  - Add loading state during template generation
  - Handle download success and error states
  - Display success message with file name
  - Add tooltip explaining template purpose
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 10. Frontend - DTR File Upload Component

  - Create `frontend/src/components/payroll/DTRFileUpload.tsx`
  - Implement drag-and-drop file upload interface
  - Add file type validation (.xlsx, .xls only)
  - Add file size validation (max 10MB)
  - Display file information (name, size) after selection
  - Show upload progress bar
  - Handle upload errors with user-friendly messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.1, 11.2, 11.3, 11.4_

- [x] 11. Frontend - DTR Import Preview Component

  - Create `frontend/src/components/payroll/DTRImportPreview.tsx`
  - Implement tabbed interface for validation results (Valid, Invalid, Warnings, Summary)
  - Display valid records in a table with green indicators

  - Display invalid records with error messages in red
  - Display warning records with warning messages in yellow
  - Show summary statistics (total employees, working days, estimated pay)
  - Add "Confirm Import" and "Cancel" buttons
  - Disable confirm button if there are invalid records
  - _Requirements: 2.6, 2.7, 11.1, 11.2, 11.3_

- [x] 12. Frontend - DTR Records Table Component

  - Create `frontend/src/components/payroll/DTRRecordsTable.tsx`
  - Implement data table with columns: Employee Number, Name, Position, Working Days, Import Date, Status, Actions
  - Add sorting functionality for all columns
  - Add filtering by employee name/number

  - Implement inline editing for working days and notes
  - Add delete button with confirmation dialog
  - Show import source information (batch, imported by, date)
  - Add pagination (50 records per page)
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 13. Frontend - DTR Import History Component

  - Create `frontend/src/components/payroll/DTRImportHistory.tsx`
  - Display list of all imports for a payroll period
  - Show import date/time, imported by username, record counts, status
  - Add "View Details" button to see error log
  - Implement modal to display detailed error log with errors and warnings
  - Show color-coded status badges (Completed: green, Partial: yellow, Failed: red)
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 14. Frontend - DTR Import Page

  - Create `frontend/src/pages/payroll/DTRImportPage.tsx`
  - Implement multi-step workflow: Upload → Validate → Preview → Confirm → Complete
  - Add step indicator showing current step
  - Integrate DTRTemplateExport component
  - Integrate DTRFileUpload component
  - Integrate DTRImportPreview component
  - Show success message with import summary after completion
  - Add navigation back to payroll period page
  - Handle all error states with user-friendly messages
  - _Requirements: 2.1, 2.2, 2.6, 2.7, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 15. Frontend - Payroll Management Page Updates

  - Modify `frontend/src/pages/payroll/PayrollManagementPage.tsx`
  - Remove "Select Employees" button and modal
  - Remove manual working days adjustment interface
  - Add "Import DTR" button that navigates to DTR Import Page
  - Add "View DTR Records" button that shows DTR Records Table
  - Display DTR import status for the period (imported, not imported, needs re-import)
  - Show DTR statistics (total employees, total working days) if imported
  - Add warning if no DTR data exists when trying to process payroll
  - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2_

- [x] 16. Frontend - DTR Menu Navigation

  - Update navigation menu to include DTR section under Payroll Management
  - Add "Import DTR" menu item
  - Add "DTR Records" menu item
  - Add "Import History" menu item
  - Restrict menu items to admin role only

  - _Requirements: Navigation, Security_

- [x] 17. Frontend - API Service Layer

  - Create `frontend/src/services/dtrService.ts`
  - Implement `exportTemplate(periodId)` API call
  - Implement `uploadDTRFile(periodId, file)` API call
  - Implement `confirmImport(periodId, previewData)` API call
  - Implement `getDTRRecords(periodId, filters)` API call
  - Implement `updateDTRRecord(recordId, updates)` API call
  - Implement `deleteDTRRecord(recordId)` API call
  - Implement `getImportHistory(periodId)` API call
  - Implement `getImportBatchDetails(batchId)` API call
  - Implement `getDTRStats(periodId)` API call
  - Add error handling and response type definitions
  - _Requirements: All API integration requirements_

- [x] 18. Frontend - React Query Hooks

  - Create `frontend/src/hooks/useDTR.ts`
  - Implement `useExportTemplate()` hook
  - Implement `useUploadDTR()` hook with mutation
  - Implement `useConfirmImport()` hook with mutation
  - Implement `useDTRRecords()` hook with caching
  - Implement `useUpdateDTRRecord()` hook with mutation
  - Implement `useDeleteDTRRecord()` hook with mutation
  - Implement `useImportHistory()` hook with caching
  - Implement `useDTRStats()` hook with caching
  - Configure cache invalidation on mutations
  - _Requirements: Performance, State Management_

- [x] 19. Backend - Re-import Logic


  - Implement re-import detection in DTR service
  - Add check for existing DTR records before import
  - Implement supersede logic to mark old records as 'Superseded'
  - Add validation to prevent re-import if payroll is finalized
  - Allow re-import if payroll status is 'Draft' or 'Processing'
  - Add warning message for re-import scenarios
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 20. Frontend - Re-import Warning Dialog

  - Create re-import warning dialog component
  - Display warning when DTR already exists for period
  - Show existing import information (date, imported by, record count)
  - Add "Continue" and "Cancel" buttons
  - Explain that existing records will be superseded
  - Prevent re-import if payroll is finalized (show error instead)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 21. Backend - Audit Logging

  - Add audit log entries for DTR template export
  - Add audit log entries for DTR import (success and failure)
  - Add audit log entries for DTR record updates
  - Add audit log entries for DTR record deletions
  - Add audit log entries for re-imports
  - Include relevant metadata (file name, record counts, errors)
  - _Requirements: 7.1, 7.2, Security Requirements_

- [x] 22. Backend - File Storage Management






  - Create upload directory structure: `uploads/dtr/[year]/[month]/`
  - Implement file naming convention: `DTR_[periodId]_[timestamp]_[originalName]`
  - Add file cleanup for old imports (retention policy: 90 days)
  - Implement file retrieval for viewing import history
  - Add file size validation (max 10MB)
  - Add virus scanning integration (if available)
  - _Requirements: 2.1, 2.2, Security Requirements_

- [ ] 23. Backend - Error Handling Middleware

  - Create DTR-specific error classes (DTRValidationError, DTRImportError, etc.)
  - Implement error handler middleware for DTR routes
  - Format error responses consistently
  - Log errors with appropriate severity levels
  - Return user-friendly error messages
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 24. Frontend - Error Boundary Component

  - Create error boundary for DTR components
  - Display user-friendly error messages
  - Add "Retry" and "Go Back" options
  - Log errors to console for debugging
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 25. Frontend - Loading States

  - Add loading spinners for template export
  - Add loading spinners for file upload
  - Add loading spinners for import confirmation
  - Add skeleton loaders for DTR records table
  - Add progress indicators for long-running operations
  - _Requirements: User Experience_

- [ ] 26. Frontend - Success/Error Notifications

  - Implement toast notifications for successful operations
  - Implement toast notifications for errors
  - Add success message after template export
  - Add success message after import completion
  - Add success message after record update/delete
  - Display error details in notifications
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 27. Documentation - API Documentation

  - Document all DTR API endpoints in API documentation
  - Include request/response examples
  - Document error codes and messages
  - Add authentication requirements
  - Include rate limiting information (if applicable)
  - _Requirements: Documentation_

- [ ] 28. Documentation - User Guide

  - Create user guide for DTR import process
  - Include step-by-step instructions with screenshots
  - Document template format and required columns
  - Explain validation rules and common errors
  - Provide troubleshooting section
  - Add FAQ section
  - _Requirements: 11.5, Documentation_

- [ ] 29. Testing - Backend Unit Tests

  - Write tests for Excel parser utility
  - Write tests for DTR validator utility
  - Write tests for DTR service methods
  - Write tests for date parsing and decimal handling
  - Write tests for validation logic (employee matching, date alignment, working days)
  - Write tests for supersede logic
  - Achieve 80%+ code coverage
  - _Requirements: Testing Strategy_

- [ ] 30. Testing - Backend Integration Tests

  - Write tests for DTR API endpoints
  - Test template export endpoint
  - Test import upload and validation endpoint
  - Test import confirmation endpoint
  - Test DTR record CRUD endpoints
  - Test import history endpoints
  - Test error scenarios (invalid file, missing employees, date mismatches)
  - Test re-import scenarios
  - _Requirements: Testing Strategy_

- [ ] 31. Testing - Frontend Component Tests

  - Write tests for DTR Template Export component
  - Write tests for DTR File Upload component
  - Write tests for DTR Import Preview component
  - Write tests for DTR Records Table component
  - Write tests for DTR Import History component
  - Test user interactions (button clicks, file selection, form submission)
  - Test error state rendering
  - _Requirements: Testing Strategy_

- [ ] 32. Testing - End-to-End Tests

  - Write E2E test for complete import workflow
  - Test: Export template → Fill data → Import → Validate → Confirm → Process Payroll
  - Test error scenario: Import with invalid employee numbers
  - Test error scenario: Import with date mismatches
  - Test correction workflow: Import → Edit records → Reprocess payroll
  - Test re-import scenario: Import → Re-import with corrections
  - _Requirements: Testing Strategy_

- [ ] 33. Database Migration Execution

  - Run migration in development environment
  - Verify tables created correctly
  - Verify indexes created
  - Verify foreign key constraints
  - Test rollback migration
  - Prepare migration for staging/production
  - _Requirements: 6.1, 6.2, 6.3, Migration Strategy_

- [ ] 34. Deployment - Staging Environment

  - Deploy backend changes to staging
  - Deploy frontend changes to staging
  - Run database migrations on staging
  - Configure file upload directory on staging server
  - Test complete workflow in staging
  - Verify audit logs are created
  - Test with real-world data sample
  - _Requirements: Deployment Checklist_

- [ ] 35. Deployment - Production Environment

  - Deploy backend changes to production
  - Deploy frontend changes to production
  - Run database migrations on production
  - Configure file upload directory on production server
  - Set up monitoring and alerts
  - Verify system is operational
  - Monitor for errors in first 24 hours
  - _Requirements: Deployment Checklist_

- [ ] 36. Post-Deployment Validation

  - Test template export with production data
  - Test import with small sample file (5-10 employees)
  - Verify payroll calculation accuracy
  - Check audit logs are being created
  - Monitor system performance
  - Gather user feedback
  - _Requirements: Deployment Checklist, Testing in Production_

- [ ] 37. User Training and Documentation
  - Conduct training session for admin users
  - Provide user guide and documentation
  - Create video tutorial for DTR import process
  - Set up support channel for questions
  - Collect feedback for improvements
  - _Requirements: Documentation, User Training_
