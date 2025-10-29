# Implementation Plan

## Overview
This implementation plan breaks down the New Payroll System into discrete, manageable coding tasks. Each task builds incrementally on previous work, following the phase-based workflow: Database → Core Services → Calculation Engine → Document Generation → Workflow → Frontend Integration.

## Task List

- [ ] 1. Database Schema and Migration Setup
- [ ] 1.1 Create database migration script for new payroll tables
  - Create migration file `migrations/XXX_payroll_system_schema.sql`
  - Add tables: `payroll_periods`, `payroll_items`, `payroll_item_lines`, `dtr_records`, `billing_deductions`, `generated_documents`, `remittances`, `tax_tables`, `employee_overrides`, `deduction_types`, `allowance_types`
  - Add indexes for performance optimization
  - Add foreign key constraints with proper CASCADE rules
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 1.2 Create seed data for configuration tables
  - Populate `deduction_types` with GSIS, Pag-IBIG, PhilHealth, BIR, loan types
  - Populate `allowance_types` with RATA, Hazard Pay, Subsistence, Laundry
  - Populate `tax_tables` with current BIR tax brackets and rates
  - Create seed script `scripts/seed-payroll-config.js`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1, 14.2, 14.3_

- [ ] 1.3 Update existing Employee model to support payroll integration
  - Add method `getConsistentSalaryValues()` to ensure 22-day rule compliance
  - Add method `getDailyRateForPeriod(periodId)` to get rate with overrides
  - Add method `getActiveOverrides(periodId)` to retrieve applicable overrides
  - Ensure `current_monthly_salary` and `current_daily_rate` are always synchronized
  - _Requirements: 2.1, 2.2, 13.1, 13.2, 13.3_


- [ ] 2. Core Calculation Engine Implementation
- [ ] 2.1 Create TaxCalculator utility class
  - Implement `calculateWithholdingTax(taxableIncome, taxTable)` using BIR graduated tax formula
  - Implement `getTaxTable(effectiveDate)` to retrieve active tax brackets
  - Implement `calculateTaxableIncome(grossPay, nonTaxableDeductions)` 
  - Handle edge cases: zero income, negative values, missing tax table
  - _Requirements: 3.5, 3.6, 14.1_

- [ ] 2.2 Create DeductionCalculator utility class
  - Implement `calculateGSISPremium(basicSalary)` - 9% of basic salary
  - Implement `calculatePagIBIGPremium(basicSalary)` - Php 100 standard or 2% for high earners
  - Implement `calculatePhilHealthPremium(basicSalary)` - 4% / 2 with floor/ceiling
  - Implement `calculateECFund()` - Fixed Php 100
  - Implement `getTotalMandatoryDeductions(basicSalary, grossPay)`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 2.3 Create AllowanceCalculator utility class
  - Implement `calculatePERA(daysPresent, workingDays)` - Php 2000 prorated
  - Implement `calculateRATA(employee, period, attendance)` - Position-based with attendance
  - Implement `calculateHazardPay(employee, daysWorked)` - 20-25% based on department
  - Implement `calculateSubsistence(daysWorked)` - Php 50 per day
  - Implement `calculateLaundry(daysWorked)` - Php 6.818 per day
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2.4 Create SalaryCalculator utility class
  - Implement `calculateBasicSalary(monthlySalary, workingDays, daysPresent)` - Prorated by attendance
  - Implement `calculateDailyRate(monthlySalary)` - Monthly / 22
  - Implement `applyLWOP(basicSalary, lwopDays, dailyRate)` - Deduct LWOP days
  - Handle partial month scenarios (newly hired, separated employees)
  - _Requirements: 2.1, 2.2_

- [ ] 2.5 Create main PayrollCalculationEngine class
  - Implement `calculateEmployeePayroll(employee, period, workingDays, overrides)` orchestrator
  - Integrate TaxCalculator, DeductionCalculator, AllowanceCalculator, SalaryCalculator
  - Implement `validateCalculation(payrollItem)` to check for errors
  - Implement `generateCalculationBreakdown(payrollItem)` for audit trail
  - Handle calculation errors gracefully with detailed error messages
  - Create file `backend/utils/PayrollCalculationEngine.js`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_


- [ ] 3. DTR Import Service Implementation
- [ ] 3.1 Create DTRImportService class
  - Implement `importDTRFile(file, periodId)` to handle file upload and parsing
  - Implement `parseDTRFile(file)` to support Excel (.xlsx) and CSV formats
  - Implement `validateDTRRecords(records, period)` to check data integrity
  - Implement `calculateAttendance(dtrRecord, period)` to compute days present
  - Implement `detectLWOP(employeeId, startDate, endDate)` by querying leave_applications
  - Implement `storeDTRRecords(periodId, records)` to save to dtr_records table
  - Create file `backend/services/DTRImportService.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 3.2 Create DTR import API endpoint
  - Add POST `/api/dtr/import/:periodId` route
  - Use multer middleware for file upload handling
  - Validate file format and size (max 5MB)
  - Call DTRImportService to process file
  - Return import summary with success/error counts
  - Add route to `backend/routes/dtrRoutes.js`
  - _Requirements: 1.1, 1.2, 1.6, 15.1_

- [ ] 3.3 Create DTR records retrieval endpoints
  - Add GET `/api/dtr/period/:periodId` to retrieve all DTR records for a period
  - Add GET `/api/dtr/employee/:employeeId/period/:periodId` for employee-specific DTR
  - Add GET `/api/dtr/summary/:periodId` for attendance summary statistics
  - Support filtering by employee, date range, attendance status
  - _Requirements: 1.1, 1.2, 1.3, 1.4_


- [ ] 4. Billing Parser Service Implementation
- [ ] 4.1 Create base BillingParserService class
  - Implement `parseBillingFile(file, billingType, periodId)` orchestrator
  - Implement `validateBillingData(data, billingType)` for data validation
  - Implement `matchEmployeesToBilling(billingRecords, employees)` for employee matching
  - Implement `storeBillingDeductions(periodId, deductions)` to save to billing_deductions table
  - Implement `generateImportReport(results)` for import summary
  - Create file `backend/services/BillingParserService.js`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4.2 Create agency-specific billing parsers
  - Implement `GSISBillingParser` for GSIS loan format (CSV with BP Number, loan types, amounts)
  - Implement `PagIBIGBillingParser` for Pag-IBIG format (CSV with ID Number, loan amount)
  - Implement `BankBillingParser` for DBP/City Savings format (CSV with account number, amount)
  - Implement `SJMOBillingParser` for SJMO format (CSV with employee number, amount)
  - Support both CSV and Excel formats for each parser
  - Create files in `backend/services/billingParsers/` directory
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 15.2_

- [ ] 4.3 Create billing import API endpoints
  - Add POST `/api/billing/import/:periodId/:billingType` route
  - Support billingType: 'gsis', 'pagibig', 'dbp', 'city-savings', 'sjmo'
  - Use multer middleware for file upload
  - Call appropriate billing parser based on billingType
  - Return import summary with matched/unmatched employees
  - Add routes to `backend/routes/billingRoutes.js`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.2_

- [ ] 4.4 Create billing deductions retrieval endpoints
  - Add GET `/api/billing/period/:periodId` to retrieve all billing deductions
  - Add GET `/api/billing/employee/:employeeId/period/:periodId` for employee-specific deductions
  - Add GET `/api/billing/summary/:periodId/:billingType` for agency-specific summaries
  - Support filtering and sorting
  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [ ] 5. Payroll Processing and Calculation Integration
- [ ] 5.1 Update PayrollPeriod model with new workflow methods
  - Add method `canTransitionTo(newStatus)` to validate state transitions
  - Add method `getRequiredDataForCalculation()` to check prerequisites
  - Add method `calculateAllItems(userId)` to trigger bulk calculation
  - Add method `validateAllCalculations()` to check for errors
  - Update existing `backend/models/Payroll/PayrollPeriod.js`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 5.2 Update PayrollItem model with calculation integration
  - Add method `calculateFromDTR(dtrRecords)` to get attendance data
  - Add method `applyBillingDeductions(billingDeductions)` to add loan deductions
  - Add method `applyOverrides(overrides)` to apply temporary adjustments
  - Add method `recalculate()` to recompute using PayrollCalculationEngine
  - Add method `getCalculationBreakdown()` to retrieve detailed line items
  - Update existing `backend/models/Payroll/PayrollItem.js`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 13.1, 13.2, 13.3_

- [ ] 5.3 Create PayrollProcessingService for bulk operations
  - Implement `processPayrollPeriod(periodId, userId)` orchestrator
  - Implement `validatePeriodData(periodId)` to check DTR and billing imports
  - Implement `calculateAllEmployees(periodId, userId)` using PayrollCalculationEngine
  - Implement `generatePayrollItemLines(payrollItem)` to create detailed breakdown
  - Implement `validateCalculationResults(periodId)` to check for errors
  - Create file `backend/services/PayrollProcessingService.js`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 12.3, 12.4_

- [ ] 5.4 Create payroll processing API endpoints
  - Add POST `/api/payroll/periods/:periodId/calculate` to trigger calculation
  - Add POST `/api/payroll/periods/:periodId/validate` to validate calculations
  - Add POST `/api/payroll/items/:itemId/recalculate` to recalculate single item
  - Add GET `/api/payroll/periods/:periodId/calculation-status` for progress tracking
  - Add routes to `backend/routes/payrollRoutes.js`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_


- [ ] 6. Document Generation Service Implementation
- [ ] 6.1 Create base DocumentGenerationService class
  - Implement `generateDocument(periodId, documentType, options)` orchestrator
  - Implement `createPDF(template, data, outputPath)` using PDFKit
  - Implement `createExcel(template, data, outputPath)` using xlsx library
  - Implement `saveDocumentRecord(periodId, documentType, filePath, metadata)` to generated_documents table
  - Create file `backend/services/DocumentGenerationService.js`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 6.2 Create CAFOAGenerator class
  - Implement `generateCAFOA(periodId)` to create CAFOA document
  - Implement `summarizeExpensesByType(periodId)` to aggregate amounts
  - Implement `formatCAFOAPDF(data)` to create formatted PDF with signature blocks
  - Include breakdown by Function/Allotment Class/Expense Code
  - Create file `backend/services/generators/CAFOAGenerator.js`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.3 Create ADAGenerator class
  - Implement `generateADA(periodId, employeeIds)` to create ADA document
  - Implement `compileEmployeeList(periodId, employeeIds)` with account numbers and amounts
  - Implement `validateADAData(data)` to ensure sum matches total
  - Implement `formatADAPDF(data)` and `formatADACSV(data)` for bank submission
  - Create file `backend/services/generators/ADAGenerator.js`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 6.4 Create PayslipGenerator class
  - Implement `generatePayslips(periodId)` to create payslips for all employees
  - Implement `generateEmployeePayslip(payrollItemId)` for single employee
  - Implement `formatPayslipPDF(payrollItem, employee, period)` with earnings/deductions table
  - Include YTD totals for gross pay, deductions, and net pay
  - Create file `backend/services/generators/PayslipGenerator.js`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 6.5 Create RemittanceListGenerator class
  - Implement `generateRemittanceList(periodId, agencyType)` for specific agency
  - Implement `generateBIRRemittance(periodId)` with TIN and tax withheld
  - Implement `generateGSISRemittance(periodId)` with BP Number, shares, and loans
  - Implement `generatePagIBIGRemittance(periodId)` with ID, shares, and loans
  - Implement `generatePhilHealthRemittance(periodId)` with PhilHealth Number and shares
  - Implement `generateBankRemittance(periodId, bankName)` with account and loan amounts
  - Create file `backend/services/generators/RemittanceListGenerator.js`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 6.6 Create document generation API endpoints
  - Add POST `/api/documents/cafoa/:periodId` to generate CAFOA
  - Add POST `/api/documents/ada/:periodId` to generate ADA
  - Add POST `/api/documents/payslips/:periodId` to generate all payslips
  - Add POST `/api/documents/payslip/:payrollItemId` to generate single payslip
  - Add POST `/api/documents/remittance/:periodId/:agencyType` to generate remittance list
  - Add GET `/api/documents/period/:periodId` to list all generated documents
  - Add GET `/api/documents/download/:documentId` to download document file
  - Add routes to `backend/routes/documentRoutes.js`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_


- [ ] 7. Workflow Management Implementation
- [ ] 7.1 Create PayrollWorkflowManager class
  - Implement `transitionPeriod(periodId, newStatus, userId)` for state changes
  - Implement `validateTransition(currentStatus, newStatus)` to check allowed transitions
  - Implement `executeStatusActions(periodId, status)` for status-specific operations
  - Implement `revertPeriod(periodId, targetStatus, reason, userId)` for rollback
  - Implement `canFinalize(periodId)` to check prerequisites
  - Implement `lockPeriod(periodId)` and `unlockPeriod(periodId)` for editing control
  - Create file `backend/services/PayrollWorkflowManager.js`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 7.2 Create workflow state transition rules
  - Define allowed transitions: Draft → Processing → Calculated → Ready for CAFOA → CAFOA Approved → Ready for Disbursement → Disbursed → Completed
  - Define prerequisites for each transition (e.g., DTR imported, calculations complete, CAFOA approved)
  - Define rollback rules (can revert from Processing/Calculated to Draft)
  - Create configuration file `backend/config/workflowRules.js`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 7.3 Create workflow API endpoints
  - Add POST `/api/payroll/periods/:periodId/transition` to change status
  - Add POST `/api/payroll/periods/:periodId/revert` to rollback status
  - Add POST `/api/payroll/periods/:periodId/lock` to lock/unlock period
  - Add GET `/api/payroll/periods/:periodId/workflow-history` to view state changes
  - Add GET `/api/payroll/periods/:periodId/can-transition/:newStatus` to check if transition is allowed
  - Add routes to `backend/routes/payrollRoutes.js`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_


- [ ] 8. Remittance Management Implementation
- [ ] 8.1 Create RemittanceManager class
  - Implement `createRemittances(periodId)` to generate remittance records
  - Implement `markRemittancePaid(remittanceId, paymentDetails)` to record payment
  - Implement `getOverdueRemittances()` to find unpaid remittances past due date
  - Implement `getRemittanceSummary(periodId)` for period summary
  - Implement `reconcileRemittance(remittanceId, billingId)` for billing reconciliation
  - Create file `backend/services/RemittanceManager.js`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 8.2 Create remittance schedule configuration
  - Define due dates for each agency type (BIR: 10th, GSIS: 15th, Pag-IBIG: 10th, PhilHealth: 10th)
  - Implement automatic due date calculation based on pay date
  - Support custom due dates for bank/cooperative loans
  - Create configuration file `backend/config/remittanceSchedules.js`
  - _Requirements: 9.7_

- [ ] 8.3 Create remittance API endpoints
  - Add POST `/api/remittances/period/:periodId/create` to generate remittances
  - Add POST `/api/remittances/:remittanceId/mark-paid` to record payment
  - Add GET `/api/remittances/period/:periodId` to list all remittances
  - Add GET `/api/remittances/overdue` to get overdue remittances
  - Add GET `/api/remittances/summary/:periodId` for summary report
  - Add routes to `backend/routes/remittanceRoutes.js`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_


- [ ] 9. Employee Override and Adjustment Management
- [ ] 9.1 Create EmployeeOverride model
  - Implement `create()` to add new override
  - Implement `update()` to modify existing override
  - Implement `delete()` to remove override
  - Implement static `getActiveOverrides(employeeId, periodId)` to retrieve applicable overrides
  - Implement static `getOverrideHistory(employeeId)` for audit trail
  - Create file `backend/models/EmployeeOverride.js`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 9.2 Create employee override API endpoints
  - Add POST `/api/employee-overrides` to create override
  - Add PUT `/api/employee-overrides/:overrideId` to update override
  - Add DELETE `/api/employee-overrides/:overrideId` to delete override
  - Add GET `/api/employee-overrides/employee/:employeeId` to list employee overrides
  - Add GET `/api/employee-overrides/period/:periodId` to list period overrides
  - Add routes to `backend/routes/employeeOverrideRoutes.js`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_


- [ ] 10. Configuration and Maintenance Features
- [ ] 10.1 Create TaxTable model for BIR tax configuration
  - Implement `create()` to add new tax bracket
  - Implement `update()` to modify tax bracket
  - Implement static `getActiveTaxTable(effectiveDate)` to retrieve current brackets
  - Implement static `updateTaxTable(newBrackets, effectiveDate)` to update all brackets
  - Create file `backend/models/TaxTable.js`
  - _Requirements: 14.1_

- [ ] 10.2 Create configuration API endpoints
  - Add POST `/api/config/tax-tables` to create/update tax brackets
  - Add GET `/api/config/tax-tables` to retrieve current tax table
  - Add GET `/api/config/tax-tables/history` to view historical tax tables
  - Add PUT `/api/config/deduction-types/:deductionTypeId` to update deduction rates
  - Add PUT `/api/config/allowance-types/:allowanceTypeId` to update allowance rates
  - Add GET `/api/config/working-days/:year/:month` to get/set working days
  - Add routes to `backend/routes/configRoutes.js`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 10.3 Create configuration management UI components
  - Create `TaxTableConfig.jsx` for managing tax brackets
  - Create `DeductionRatesConfig.jsx` for GSIS/Pag-IBIG/PhilHealth rates
  - Create `AllowanceRatesConfig.jsx` for RATA/Hazard Pay rates
  - Create `WorkingDaysConfig.jsx` for period-specific working days
  - Add components to `frontend/src/components/payroll/config/`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_


- [ ] 11. Audit Trail and Reporting
- [ ] 11.1 Enhance audit logging for payroll operations
  - Update `backend/middleware/auditLogger.js` to capture payroll-specific events
  - Log calculation inputs, formulas, and results
  - Log period status changes with user and timestamp
  - Log manual adjustments with old/new values
  - Log document generation events
  - Log remittance payment confirmations
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 11.2 Create audit report generation service
  - Implement `generateAuditReport(periodId, options)` for comprehensive audit trail
  - Implement `getCalculationAudit(payrollItemId)` for detailed calculation history
  - Implement `getWorkflowAudit(periodId)` for status change history
  - Implement `getDocumentAudit(periodId)` for document generation history
  - Create file `backend/services/AuditReportService.js`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 11.3 Create audit report API endpoints
  - Add GET `/api/audit/period/:periodId` for period audit trail
  - Add GET `/api/audit/payroll-item/:itemId` for item calculation audit
  - Add GET `/api/audit/workflow/:periodId` for workflow history
  - Add GET `/api/audit/documents/:periodId` for document generation audit
  - Add GET `/api/audit/export/:periodId` to export audit report (PDF/Excel)
  - Add routes to `backend/routes/auditRoutes.js`
  - _Requirements: 11.7_


- [ ] 12. Frontend - Payroll Period Management
- [ ] 12.1 Create PayrollPeriodList component
  - Display list of payroll periods with status, dates, and totals
  - Support filtering by year, month, status
  - Support sorting by date, status
  - Add "Create New Period" button
  - Add actions: View, Edit, Calculate, Generate Documents
  - Create file `frontend/src/components/payroll/PayrollPeriodList.jsx`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 12.2 Create PayrollPeriodForm component
  - Form fields: year, month, period_number, start_date, end_date, pay_date, working_days
  - Validate date ranges and overlapping periods
  - Support create and edit modes
  - Create file `frontend/src/components/payroll/PayrollPeriodForm.jsx`
  - _Requirements: 12.1, 12.2_

- [ ] 12.3 Create PayrollPeriodDetail component
  - Display period information and current status
  - Show workflow progress indicator
  - Display summary statistics (employee count, total gross, total net)
  - Show action buttons based on current status
  - Create file `frontend/src/components/payroll/PayrollPeriodDetail.jsx`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 12.4 Create PayrollWorkflowStepper component
  - Visual stepper showing workflow stages
  - Highlight current stage
  - Show completed stages with checkmarks
  - Display transition buttons (Next, Revert)
  - Create file `frontend/src/components/payroll/PayrollWorkflowStepper.jsx`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_


- [ ] 13. Frontend - Data Import Components
- [ ] 13.1 Create DTRImportForm component
  - File upload field with drag-and-drop support
  - File format validation (Excel, CSV)
  - Display upload progress
  - Show import results (success/error counts, unmatched employees)
  - Create file `frontend/src/components/payroll/DTRImportForm.jsx`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 15.1_

- [ ] 13.2 Create BillingImportForm component
  - File upload field with billing type selector (GSIS, Pag-IBIG, DBP, etc.)
  - File format validation
  - Display upload progress
  - Show import results with matched/unmatched employees
  - Create file `frontend/src/components/payroll/BillingImportForm.jsx`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.2_

- [ ] 13.3 Create DTRRecordsTable component
  - Display DTR records for a period
  - Show employee name, dates, attendance status, LWOP
  - Support filtering by employee, date range
  - Support editing individual DTR records
  - Create file `frontend/src/components/payroll/DTRRecordsTable.jsx`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 13.4 Create BillingDeductionsTable component
  - Display billing deductions for a period
  - Show employee name, deduction type, amount, source
  - Support filtering by employee, deduction type
  - Support editing individual deductions
  - Create file `frontend/src/components/payroll/BillingDeductionsTable.jsx`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_


- [ ] 14. Frontend - Payroll Items and Calculation
- [ ] 14.1 Create PayrollItemsTable component
  - Display payroll items for a period
  - Show employee name, basic pay, allowances, deductions, net pay
  - Support filtering by employee, status
  - Support sorting by name, net pay
  - Add actions: View Details, Recalculate, Edit
  - Create file `frontend/src/components/payroll/PayrollItemsTable.jsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 14.2 Create PayrollItemDetail component
  - Display detailed breakdown of earnings and deductions
  - Show calculation formulas and inputs
  - Display line items with categories
  - Show validation errors if any
  - Add "Recalculate" button
  - Create file `frontend/src/components/payroll/PayrollItemDetail.jsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 14.3 Create PayrollCalculationProgress component
  - Display calculation progress (X of Y employees processed)
  - Show progress bar
  - Display errors encountered during calculation
  - Auto-refresh status during calculation
  - Create file `frontend/src/components/payroll/PayrollCalculationProgress.jsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 14.4 Create PayrollSummaryCard component
  - Display summary statistics for a period
  - Show total employees, total gross pay, total deductions, total net pay
  - Show breakdown by expense type (Basic Salary, PERA, RATA, etc.)
  - Create file `frontend/src/components/payroll/PayrollSummaryCard.jsx`
  - _Requirements: 6.6, 6.7_


- [ ] 15. Frontend - Document Generation and Management
- [ ] 15.1 Create DocumentGenerationPanel component
  - Display available document types (CAFOA, ADA, Payslips, Remittance Lists)
  - Show generation status for each document type
  - Add "Generate" buttons for each document type
  - Display generation progress and results
  - Create file `frontend/src/components/payroll/DocumentGenerationPanel.jsx`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 15.2 Create GeneratedDocumentsList component
  - Display list of generated documents for a period
  - Show document type, generation date, file size, status
  - Add "Download" and "Preview" actions
  - Support filtering by document type
  - Create file `frontend/src/components/payroll/GeneratedDocumentsList.jsx`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 15.3 Create CAFOAApprovalForm component
  - Display CAFOA document preview
  - Show signature status for each signatory
  - Add "Approve" and "Reject" buttons
  - Record approval notes
  - Create file `frontend/src/components/payroll/CAFOAApprovalForm.jsx`
  - _Requirements: 7.5, 7.6, 7.7_

- [ ] 15.4 Create PayslipViewer component
  - Display employee payslip with earnings and deductions
  - Show period information and employee details
  - Add "Download PDF" and "Print" buttons
  - Support navigation between employee payslips
  - Create file `frontend/src/components/payroll/PayslipViewer.jsx`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_


- [ ] 16. Frontend - Remittance Management
- [ ] 16.1 Create RemittancesList component
  - Display list of remittances for a period
  - Show agency type, amount, due date, status
  - Support filtering by agency type, status
  - Add "Mark as Paid" action
  - Create file `frontend/src/components/payroll/RemittancesList.jsx`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 16.2 Create RemittancePaymentForm component
  - Form to record remittance payment
  - Fields: payment_date, payment_reference, check_number, notes
  - Validate payment date
  - Create file `frontend/src/components/payroll/RemittancePaymentForm.jsx`
  - _Requirements: 9.7_

- [ ] 16.3 Create OverdueRemittancesAlert component
  - Display alert for overdue remittances
  - Show count and total amount overdue
  - Link to remittances list filtered by overdue
  - Create file `frontend/src/components/payroll/OverdueRemittancesAlert.jsx`
  - _Requirements: 9.3_


- [ ] 17. Frontend - Employee Overrides Management
- [ ] 17.1 Create EmployeeOverrideForm component
  - Form to create/edit employee override
  - Fields: employee, override_type, item_code, amount, reason, effective_from, effective_to
  - Validate date ranges and amounts
  - Create file `frontend/src/components/payroll/EmployeeOverrideForm.jsx`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 17.2 Create EmployeeOverridesList component
  - Display list of overrides for an employee or period
  - Show override type, item, amount, effective dates, status
  - Add actions: Edit, Delete, View History
  - Support filtering by employee, period, status
  - Create file `frontend/src/components/payroll/EmployeeOverridesList.jsx`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_


- [ ] 18. Frontend - Main Payroll Pages and Routing
- [ ] 18.1 Create PayrollDashboard page
  - Display current period status and quick actions
  - Show summary cards for active periods
  - Display overdue remittances alert
  - Show recent activity feed
  - Create file `frontend/src/pages/payroll/PayrollDashboard.jsx`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 18.2 Create PayrollPeriodPage page
  - Display PayrollPeriodDetail component
  - Show PayrollWorkflowStepper
  - Display tabs: Overview, DTR, Billing, Payroll Items, Documents, Remittances
  - Create file `frontend/src/pages/payroll/PayrollPeriodPage.jsx`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 18.3 Create PayrollConfigPage page
  - Display tabs: Tax Tables, Deduction Rates, Allowance Rates, Working Days
  - Include configuration components for each tab
  - Add save/cancel actions
  - Create file `frontend/src/pages/payroll/PayrollConfigPage.jsx`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 18.4 Update application routing
  - Add routes for payroll pages: /payroll, /payroll/periods/:id, /payroll/config
  - Add navigation menu items for payroll section
  - Update `frontend/src/App.jsx` or routing configuration
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_


- [ ] 19. Integration and End-to-End Testing
- [ ] 19.1 Write integration tests for payroll calculation flow
  - Test complete calculation flow: DTR import → Billing import → Calculate → Validate
  - Test error handling and validation
  - Test override application
  - Create test file `backend/tests/integration/payrollCalculation.test.js`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 19.2 Write integration tests for workflow management
  - Test state transitions and validation
  - Test rollback functionality
  - Test period locking
  - Create test file `backend/tests/integration/payrollWorkflow.test.js`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 19.3 Write integration tests for document generation
  - Test CAFOA generation with correct data
  - Test ADA generation with employee accounts
  - Test payslip generation
  - Test remittance list generation
  - Create test file `backend/tests/integration/documentGeneration.test.js`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 19.4 Write end-to-end tests for complete payroll cycle
  - Test full cycle: Create period → Import data → Calculate → Generate documents → Disburse → Remit → Complete
  - Test with realistic employee data (50+ employees)
  - Verify all calculations and documents
  - Create test file `backend/tests/e2e/payrollCycle.test.js`
  - _Requirements: All requirements_


- [ ] 20. Documentation and Deployment
- [ ] 20.1 Create user documentation
  - Write user guide for payroll officers
  - Document workflow steps and procedures
  - Create troubleshooting guide
  - Add screenshots and examples
  - Create file `docs/PAYROLL_USER_GUIDE.md`
  - _Requirements: All requirements_

- [ ] 20.2 Create technical documentation
  - Document API endpoints with request/response examples
  - Document database schema and relationships
  - Document calculation formulas and business rules
  - Create deployment guide
  - Create file `docs/PAYROLL_TECHNICAL_GUIDE.md`
  - _Requirements: All requirements_

- [ ] 20.3 Create database migration and deployment scripts
  - Create migration script to add new tables
  - Create rollback script for migration
  - Create seed data script for initial configuration
  - Test migration on staging environment
  - Create files in `backend/migrations/` directory
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 20.4 Deploy to staging environment
  - Run database migrations
  - Deploy backend code
  - Deploy frontend build
  - Test critical functionality
  - Verify integration with existing modules
  - _Requirements: All requirements_

- [ ] 20.5 Conduct user acceptance testing
  - Train payroll officers on new system
  - Process test payroll period with real data
  - Gather feedback and address issues
  - Document any required adjustments
  - _Requirements: All requirements_