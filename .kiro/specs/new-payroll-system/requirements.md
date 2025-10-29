# Requirements Document

## Introduction

This document outlines the requirements for implementing a comprehensive, automated payroll system for a Local Government Unit (LGU). The system will transform the current manual, spreadsheet-based payroll process into an integrated digital workflow that handles all phases from data gathering through disbursement and remittance. The new system will automate calculations, enforce compliance with Philippine government regulations (BIR, GSIS, Pag-IBIG, PhilHealth), and generate all required financial documents (CAFOA, ADA, remittance lists).

## Glossary

- **System**: The LGU Payroll Management System
- **DTR**: Daily Time Record - attendance documentation submitted by employees
- **CAFOA**: Certification of Availability of Funds and Obligation of Allotment - document certifying budget availability
- **ADA**: Authority to Debit Account - instruction to bank for salary disbursement
- **GSIS**: Government Service Insurance System - mandatory insurance for government employees
- **Pag-IBIG**: Home Development Mutual Fund - mandatory savings program
- **PhilHealth**: Philippine Health Insurance Corporation - mandatory health insurance
- **BIR**: Bureau of Internal Revenue - tax authority
- **RATA**: Representation and Transportation Allowance
- **PERA**: Personnel Economic Relief Allowance (Php 2,000/month fixed)
- **SB**: Sangguniang Bayan - municipal council
- **MSWD**: Municipal Social Welfare and Development office
- **RHU**: Rural Health Unit
- **Hazard Pay**: Additional compensation for health and social workers (20-25% of basic salary)
- **S&L**: Subsistence and Laundry Allowance
- **LWOP**: Leave Without Pay
- **Payroll Period**: A specific timeframe for payroll processing (typically semi-monthly)
- **Gross Pay**: Total earnings before deductions
- **Net Pay**: Take-home pay after all deductions
- **Mandatory Deductions**: Required government contributions (GSIS, Pag-IBIG, PhilHealth, Withholding Tax)
- **Loan Deductions**: Employee loan payments to GSIS, Pag-IBIG, banks, cooperatives
- **Working Days**: Standard 22 working days per month for salary calculations
- **Billing**: Official statement from lending institutions showing loan balances and required payments

## Requirements

### Requirement 1: Automated Data Collection and Validation

**User Story:** As an HR Administrator, I want the system to automatically collect and validate input data from multiple sources, so that payroll processing begins with accurate and complete information.

#### Acceptance Criteria

1. WHEN an HR Administrator uploads a DTR file, THE System SHALL validate the file format and extract attendance data for all employees
2. WHEN a DTR record is processed, THE System SHALL calculate the number of days present and identify any LWOP instances
3. WHEN an SB Session Minutes document is uploaded, THE System SHALL extract session attendance data for Sangguniang Bayan members
4. WHEN an MSWD Report is uploaded, THE System SHALL extract fieldwork days for MSWD employees
5. WHEN billing files are uploaded from GSIS, Pag-IBIG, Banks, or SJMO, THE System SHALL parse and store loan deduction amounts for each employee
6. WHEN input data validation fails, THE System SHALL generate an error report identifying specific issues and affected records
7. WHEN all required input data for a payroll period is collected, THE System SHALL mark the period as ready for calculation

### Requirement 2: Salary and Allowance Calculation Engine

**User Story:** As a Payroll Officer, I want the system to automatically calculate gross pay including basic salary, PERA, and RATA based on attendance and position, so that calculations are accurate and consistent.

#### Acceptance Criteria

1. WHEN calculating basic salary for an employee, THE System SHALL apply the formula: (Monthly Basic Salary / 22) * Days Present from DTR
2. WHEN an employee has full attendance, THE System SHALL add the fixed PERA amount of Php 2,000 to gross compensation
3. WHEN an employee has partial attendance, THE System SHALL prorate PERA based on days present
4. WHEN calculating RATA for Executive employees, THE System SHALL apply the formula: (Monthly RATA / Working Days in Month) * Actual Days Worked
5. WHEN calculating RATA for SB members, THE System SHALL apply the formula: (Monthly RATA / Number of Sessions in Month) * Sessions Attended
6. WHEN RATA amounts are position-dependent, THE System SHALL retrieve the correct monthly RATA rate from the employee's position configuration
7. WHEN gross compensation is calculated, THE System SHALL sum Basic Salary and PERA for regular salary streams

### Requirement 3: Mandatory Deduction Calculation

**User Story:** As a Payroll Officer, I want the system to automatically calculate all mandatory government deductions according to current regulations, so that the LGU remains compliant with Philippine labor laws.

#### Acceptance Criteria

1. WHEN calculating GSIS Life/Retirement Premium, THE System SHALL apply 9% of Basic Salary as the employee share (Personal Share)
2. WHEN calculating GSIS State Insurance EC Fund, THE System SHALL apply the fixed amount of Php 100 as the employer share (Government Share)
3. WHEN calculating Pag-IBIG Premium, THE System SHALL apply Php 100 as the standard employee share for salaries above Php 5,000
4. WHEN calculating PhilHealth Premium, THE System SHALL apply the current PhilHealth contribution rate (4% of Basic Salary divided by 2) with applicable floor and ceiling limits
5. WHEN calculating Withholding Tax, THE System SHALL apply the BIR graduated tax table based on taxable income (Gross Compensation minus non-taxable deductions)
6. WHEN determining taxable income, THE System SHALL exclude GSIS premiums, Pag-IBIG premiums, PhilHealth premiums, and Union Dues from gross compensation
7. WHEN tax brackets change, THE System SHALL allow administrators to update the tax table configuration without code changes

### Requirement 4: Loan and Other Deduction Processing

**User Story:** As a Payroll Officer, I want the system to automatically apply loan deductions from official billings, so that employee obligations are accurately deducted each period.

#### Acceptance Criteria

1. WHEN processing GSIS loan deductions, THE System SHALL retrieve the billed amount from the uploaded GSIS billing file for each employee
2. WHEN processing Pag-IBIG loan deductions, THE System SHALL retrieve the billed amount from the uploaded Pag-IBIG billing file for each employee
3. WHEN processing bank loan deductions, THE System SHALL retrieve the billed amount from uploaded bank statements (DBP, City Savings) for each employee
4. WHEN processing SJMO deductions, THE System SHALL retrieve the billed amount from the uploaded SJMO statement for each employee
5. WHEN a billing file contains an employee not in the system, THE System SHALL log a warning and continue processing other employees
6. WHEN an employee has no loan billing for a period, THE System SHALL apply zero deduction for that loan type
7. WHEN total deductions exceed 50% of gross pay, THE System SHALL flag the payroll item for manual review

### Requirement 5: Special Benefits Calculation

**User Story:** As a Payroll Officer, I want the system to automatically calculate hazard pay and subsistence/laundry allowances based on attendance and employee type, so that eligible employees receive correct benefits.

#### Acceptance Criteria

1. WHEN calculating Hazard Pay for Health Workers, THE System SHALL apply the formula: (Monthly Basic Salary / 22) * No. of Days * 25%
2. WHEN calculating Hazard Pay for Social Workers, THE System SHALL apply the formula: (Monthly Basic Salary / 22) * No. of Days * 20%
3. WHEN calculating Subsistence Allowance, THE System SHALL apply the formula: No. of Days * Php 50
4. WHEN calculating Laundry Allowance, THE System SHALL apply the formula: No. of Days * Php 6.818
5. WHEN determining eligibility for Hazard Pay, THE System SHALL verify the employee's department (RHU for Health Workers, MSWD for Social Workers)
6. WHEN attendance data is missing for hazard-eligible employees, THE System SHALL flag the payroll item for manual review
7. WHEN special benefits are calculated, THE System SHALL store the breakdown (days, rate, percentage) for audit purposes

### Requirement 6: Net Pay Calculation and Validation

**User Story:** As a Payroll Officer, I want the system to calculate net pay and validate all calculations before finalization, so that employees receive accurate compensation.

#### Acceptance Criteria

1. WHEN calculating Total Deductions, THE System SHALL sum Withholding Tax, all mandatory premiums, and all loan deductions
2. WHEN calculating Net Amount Due for salary, THE System SHALL subtract Total Deductions from Gross Compensation
3. WHEN calculating consolidated Net Pay for disbursement, THE System SHALL add Net Amount Due from salary and Total Allowances from RATA
4. WHEN Net Pay is negative, THE System SHALL flag the payroll item as an error and prevent finalization
5. WHEN Net Pay exceeds Gross Pay, THE System SHALL flag the payroll item as an error and prevent finalization
6. WHEN all payroll items for a period are calculated, THE System SHALL generate a summary report showing totals by expense type
7. WHEN calculation validation fails for any employee, THE System SHALL provide detailed error information including employee name, calculation step, and expected vs actual values

### Requirement 7: CAFOA Document Generation

**User Story:** As a Municipal Accountant, I want the system to automatically generate CAFOA documents with proper expense breakdowns, so that fund availability can be certified efficiently.

#### Acceptance Criteria

1. WHEN a payroll period is ready for CAFOA generation, THE System SHALL summarize gross amounts by expense type (Salaries, PERA, RATA RA, RATA TA, Hazard, S&L, GSIS GS, Pag-IBIG GS, PhilHealth GS, EC GS)
2. WHEN generating a CAFOA document, THE System SHALL include the payee (DBP), particulars description, and breakdown by Function/Allotment Class/Expense Code
3. WHEN CAFOA data is compiled, THE System SHALL calculate the total amount requiring certification
4. WHEN a CAFOA document is generated, THE System SHALL create a PDF with proper formatting for signature routing
5. WHEN a CAFOA requires multiple signatories, THE System SHALL track signature status (Municipal Budget Officer, Municipal Treasurer, Municipal Accountant)
6. WHEN all required signatures are obtained, THE System SHALL mark the CAFOA as approved and enable ADA generation
7. WHEN a CAFOA is rejected, THE System SHALL allow the payroll period to be reopened for corrections

### Requirement 8: ADA Document Generation and Bank Integration

**User Story:** As a Municipal Treasurer, I want the system to generate ADA documents with employee account details, so that salary disbursement can be processed through the bank efficiently.

#### Acceptance Criteria

1. WHEN generating an ADA document, THE System SHALL include the LGU's DBP Current Account Number and total debit amount
2. WHEN compiling ADA employee list, THE System SHALL include each employee's name, DBP Savings Account Number, and consolidated net amount
3. WHEN an employee lacks a DBP account number, THE System SHALL flag the employee and exclude them from the ADA
4. WHEN ADA data is compiled, THE System SHALL verify that the sum of individual net amounts equals the total debit amount
5. WHEN an ADA document is generated, THE System SHALL create both PDF and CSV formats for bank submission
6. WHEN an ADA is submitted to the bank, THE System SHALL record the submission date and authorized signatories
7. WHEN bank processing is confirmed, THE System SHALL mark all included payroll items as "Paid" and record the payment date

### Requirement 9: Remittance List Generation and Tracking

**User Story:** As a Payroll Officer, I want the system to generate remittance lists for all deduction recipients, so that third-party obligations can be paid accurately and on time.

#### Acceptance Criteria

1. WHEN generating a BIR remittance list, THE System SHALL summarize withholding tax by employee with TIN and total tax withheld
2. WHEN generating a GSIS remittance list, THE System SHALL include employee GSIS BP Number, Employee Share, Government Share, and breakdown by loan type
3. WHEN generating a Pag-IBIG remittance list, THE System SHALL include employee Pag-IBIG ID, Employee Share, Employer Share, and loan payments
4. WHEN generating a PhilHealth remittance list, THE System SHALL include employee PhilHealth Number, Employee Share, and Employer Share
5. WHEN generating bank/cooperative remittance lists, THE System SHALL include employee identifiers and total loan payment amounts
6. WHEN remittance lists are generated, THE System SHALL calculate the total amount due to each agency/lender across all payroll runs
7. WHEN a remittance is marked as paid, THE System SHALL record the payment date, check number, and amount for audit tracking

### Requirement 10: Payslip Generation and Distribution

**User Story:** As an Employee, I want to receive a detailed payslip showing all earnings and deductions, so that I can verify my compensation and understand my take-home pay.

#### Acceptance Criteria

1. WHEN generating a payslip, THE System SHALL include all earnings (Basic Salary, PERA, RATA, Hazard Pay, S&L Allowance)
2. WHEN generating a payslip, THE System SHALL include all deductions (Withholding Tax, GSIS, Pag-IBIG, PhilHealth, all loan types)
3. WHEN generating a payslip, THE System SHALL display the payroll period dates, pay date, and employee information
4. WHEN generating a payslip, THE System SHALL show year-to-date totals for gross pay, total deductions, and net pay
5. WHEN payslips are generated for a period, THE System SHALL create individual PDF files for each employee
6. WHEN payslips are ready, THE System SHALL notify employees via email with secure download links
7. WHEN an employee requests a historical payslip, THE System SHALL retrieve and display the archived payslip from any previous period

### Requirement 11: Audit Trail and Reporting

**User Story:** As an Auditor, I want the system to maintain comprehensive audit trails of all payroll transactions, so that compliance and accuracy can be verified.

#### Acceptance Criteria

1. WHEN any payroll calculation is performed, THE System SHALL log the calculation inputs, formula used, and result
2. WHEN a payroll period status changes, THE System SHALL record the user, timestamp, old status, and new status
3. WHEN manual adjustments are made to payroll items, THE System SHALL record the user, timestamp, field changed, old value, and new value
4. WHEN deduction billings are imported, THE System SHALL log the file name, upload timestamp, number of records processed, and any errors
5. WHEN CAFOA or ADA documents are generated, THE System SHALL store a copy with generation timestamp and user
6. WHEN remittances are marked as paid, THE System SHALL record the payment details and user who confirmed payment
7. WHEN audit reports are requested, THE System SHALL generate comprehensive reports showing all transactions for a specified period with drill-down capability

### Requirement 12: Payroll Period Management and Workflow

**User Story:** As an HR Administrator, I want to manage payroll periods through a structured workflow, so that processing follows a consistent and controlled sequence.

#### Acceptance Criteria

1. WHEN creating a new payroll period, THE System SHALL validate that no overlapping periods exist for the same employees
2. WHEN a payroll period is in "Draft" status, THE System SHALL allow data collection and import operations
3. WHEN all required data is collected, THE System SHALL allow the period to be moved to "Processing" status
4. WHEN a period is in "Processing" status, THE System SHALL execute all calculations and generate payroll items
5. WHEN calculations are complete and validated, THE System SHALL allow the period to be moved to "Ready for CAFOA" status
6. WHEN CAFOA is approved, THE System SHALL allow the period to be moved to "Ready for Disbursement" status
7. WHEN ADA is processed and payment confirmed, THE System SHALL move the period to "Completed" status
8. WHEN a period is "Completed", THE System SHALL prevent any modifications to payroll items or calculations
9. WHEN errors are discovered in a "Processing" or later status, THE System SHALL allow authorized users to revert the period to "Draft" with full audit logging

### Requirement 13: Employee Override and Adjustment Management

**User Story:** As a Payroll Officer, I want to apply temporary overrides or adjustments to specific employees, so that special circumstances can be handled without modifying base configurations.

#### Acceptance Criteria

1. WHEN an employee has a temporary salary adjustment, THE System SHALL allow entry of an override amount with effective date range
2. WHEN an employee has a one-time allowance or deduction, THE System SHALL allow entry of the adjustment with description and amount
3. WHEN processing payroll with active overrides, THE System SHALL apply the override value instead of the calculated value
4. WHEN an override expires, THE System SHALL automatically revert to standard calculations in subsequent periods
5. WHEN an override is applied, THE System SHALL log the reason, authorized user, and approval reference
6. WHEN generating payslips with overrides, THE System SHALL clearly indicate which items were adjusted and why
7. WHEN override reports are requested, THE System SHALL list all active and historical overrides with full details

### Requirement 14: Configuration and Maintenance

**User Story:** As a System Administrator, I want to configure system parameters and maintain reference data, so that the system adapts to regulatory changes and organizational needs.

#### Acceptance Criteria

1. WHEN tax tables are updated by BIR, THE System SHALL allow administrators to update tax brackets and rates with effective dates
2. WHEN contribution rates change for GSIS, Pag-IBIG, or PhilHealth, THE System SHALL allow administrators to update rates with effective dates
3. WHEN position-based allowances change, THE System SHALL allow administrators to update RATA rates by position
4. WHEN working days in a month vary, THE System SHALL allow administrators to configure the working days for specific periods
5. WHEN new leave types or deduction types are added, THE System SHALL allow administrators to configure them without code changes
6. WHEN system settings are modified, THE System SHALL validate the changes and require confirmation before applying
7. WHEN configuration changes are saved, THE System SHALL log the change with user, timestamp, and affected parameters

### Requirement 15: Integration and Data Exchange

**User Story:** As an IT Administrator, I want the system to integrate with existing LGU systems and support standard data formats, so that data flows seamlessly across the organization.

#### Acceptance Criteria

1. WHEN importing DTR data, THE System SHALL support Excel (.xlsx), CSV, and standard DTR file formats
2. WHEN importing billing files, THE System SHALL support PDF parsing and CSV formats from GSIS, Pag-IBIG, and banks
3. WHEN exporting payroll data, THE System SHALL generate files in formats required by government agencies (BIR, GSIS, Pag-IBIG, PhilHealth)
4. WHEN integrating with the employee management system, THE System SHALL synchronize employee master data daily
5. WHEN integrating with the leave management system, THE System SHALL retrieve LWOP data for payroll calculations
6. WHEN generating reports, THE System SHALL support export to PDF, Excel, and CSV formats
7. WHEN API access is required, THE System SHALL provide secure REST APIs with authentication and authorization
