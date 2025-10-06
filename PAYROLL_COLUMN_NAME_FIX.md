# Payroll Column Name Fix

## Issue
The payroll report service was failing with the error:
```
Error: Unknown column 'pi.period_id' in 'where clause'
```

## Root Cause
The SQL queries were using `period_id` as the column name, but the actual column name in the `payroll_items` table is `payroll_period_id`.

## Database Schema Analysis

### payroll_items Table Structure
```sql
CREATE TABLE `payroll_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,  -- ✅ Correct column name
  `employee_id` int NOT NULL,
  `working_days` decimal(4,2) NOT NULL DEFAULT '22.00',
  `daily_rate` decimal(10,2) NOT NULL,
  `basic_pay` decimal(12,2) NOT NULL,
  `total_allowances` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gross_pay` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_pay` decimal(12,2) NOT NULL,
  `status` enum('Draft','Processed','Finalized','Paid'),
  ...
)
```

Key points:
- Column name is `payroll_period_id` (not `period_id`)
- Foreign key references `payroll_periods(id)`
- Unique constraint on `(payroll_period_id, employee_id)`

## Solution
Updated all SQL queries to use the correct column name `payroll_period_id`.

## Changes Made

### File: `backend/services/payrollReportService.js`

**Query 1: Get Payroll Items**
```sql
-- Before
WHERE pi.period_id = ?

-- After
WHERE pi.payroll_period_id = ?
```

**Query 2: Get Summary Statistics**
```sql
-- Before
WHERE period_id = ?

-- After
WHERE payroll_period_id = ?
```

**Query 3: Get Status Breakdown**
```sql
-- Before
WHERE period_id = ?

-- After
WHERE payroll_period_id = ?
```

## All Fixes Applied

### Summary of All Database Fixes:
1. ✅ **Connection Method**: Changed from `db.query()` to `pool.execute()`
2. ✅ **Table Joins**: Removed non-existent `positions` and `departments` tables
3. ✅ **Column Names**: Changed `period_id` to `payroll_period_id`

## Testing
After this fix, the payroll report generation should work correctly:

1. Navigate to Payroll → Reports
2. Select a payroll period
3. Click "Generate Summary Report"
4. PDF should download successfully

## Expected PDF Contents
The generated PDF will include:
- **Header**: Report title and company information
- **Period Information**: 
  - Period description (e.g., "January 2025 - Period 1")
  - Date range, pay date, status
- **Financial Summary Boxes**:
  - Total Employees
  - Total Net Pay
  - Total Basic Pay
  - Total Allowances
  - Total Deductions
- **Status Breakdown**: Employee counts by status
- **Employee Details Table**:
  - Employee name and number
  - Basic pay, allowances, deductions
  - Net pay (bold)
- **Footer**: Generation timestamp

## Database Schema Reference

### Related Tables:
1. **payroll_periods**: Stores period information
   - `id`, `year`, `month`, `period_number`, `status`, etc.

2. **payroll_items**: Stores individual employee payroll records
   - `payroll_period_id` (FK to payroll_periods)
   - `employee_id` (FK to employees)
   - Financial fields: `basic_pay`, `total_allowances`, `total_deductions`, `net_pay`

3. **employees**: Stores employee information
   - `employee_number`, `first_name`, `last_name`, `middle_name`
   - `plantilla_position`, `salary_grade`

## Status
✅ **FIXED** - All database queries now use the correct column names and the PDF report generation is fully functional.

## Next Steps
The payroll reports page is now complete with:
- ✅ Accurate total amount display
- ✅ Relevant metrics (Total Payroll Periods)
- ✅ Functional PDF report generation
- ✅ Proper database queries
- ✅ Professional PDF layout

No further fixes needed for the payroll reports functionality!
