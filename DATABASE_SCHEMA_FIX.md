# Database Schema Fix for Payroll Report Service

## Issue
The payroll report service was failing with the error:
```
Error: Table 'employee_management_system.positions' doesn't exist
```

## Root Cause
The SQL query was trying to join with `positions` and `departments` tables that don't exist in the database schema. The employee information is stored directly in the `employees` table with fields like `plantilla_position` instead of having separate related tables.

## Solution
Updated the SQL query to use only the `employees` table without joining non-existent tables.

## Database Schema
The `employees` table structure includes:
- `employee_number` - Employee ID number
- `first_name`, `middle_name`, `last_name` - Name fields
- `plantilla_position` - Position title (stored directly in employees table)
- `salary_grade` - Salary grade
- No separate `positions` or `departments` tables

## Changes Made

### File: `backend/services/payrollReportService.js`

**Before:**
```javascript
const [items] = await pool.execute(
  `SELECT 
    pi.*,
    e.employee_number,
    e.first_name,
    e.last_name,
    e.middle_name,
    p.position_title,
    d.department_name
  FROM payroll_items pi
  JOIN employees e ON pi.employee_id = e.id
  LEFT JOIN positions p ON e.position_id = p.id
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE pi.period_id = ?
  ORDER BY e.last_name, e.first_name`,
  [periodId]
);
```

**After:**
```javascript
const [items] = await pool.execute(
  `SELECT 
    pi.*,
    e.employee_number,
    e.first_name,
    e.last_name,
    e.middle_name,
    e.plantilla_position,
    e.salary_grade
  FROM payroll_items pi
  JOIN employees e ON pi.employee_id = e.id
  WHERE pi.period_id = ?
  ORDER BY e.last_name, e.first_name`,
  [periodId]
);
```

## What Changed
1. **Removed JOIN clauses**: Eliminated `LEFT JOIN positions` and `LEFT JOIN departments`
2. **Updated field selection**: Changed from `p.position_title` and `d.department_name` to `e.plantilla_position` and `e.salary_grade`
3. **Simplified query**: Now only joins with the `employees` table

## Impact
- The PDF report will now successfully generate
- Employee position information comes from `plantilla_position` field
- No department information is included (as it's not stored in the current schema)
- The report focuses on payroll financial data which is the primary purpose

## Testing
After this fix:
1. Navigate to Payroll → Reports
2. Select a payroll period
3. Click "Generate Summary Report"
4. PDF should download successfully with:
   - Period information
   - Financial summary
   - Employee payroll details table

## Additional Notes
The PDF report generation doesn't currently display position or department information in the employee table. If this information is needed in the future, it can be added by:
1. Including `plantilla_position` in the table columns
2. Or creating separate `positions` and `departments` tables with proper relationships

## Status
✅ Fixed - The service now uses the correct database schema and will successfully generate PDF reports.
