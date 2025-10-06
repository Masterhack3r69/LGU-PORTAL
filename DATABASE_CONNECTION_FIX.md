# Database Connection Fix for Payroll Report Service

## Issue
The payroll report service was failing with the error:
```
TypeError: db.query is not a function
```

## Root Cause
The service was incorrectly trying to use `db.query()` method, but the database configuration module exports a `pool` object with an `execute()` method, not a `query()` method.

## Solution

### Changed Import Statement
**Before:**
```javascript
const db = require('../config/database');
```

**After:**
```javascript
const { pool } = require('../config/database');
```

### Changed Database Calls
**Before:**
```javascript
const [periodRows] = await db.query(
  `SELECT * FROM payroll_periods WHERE id = ?`,
  [periodId]
);
```

**After:**
```javascript
const [periodRows] = await pool.execute(
  `SELECT * FROM payroll_periods WHERE id = ?`,
  [periodId]
);
```

## File Modified
- `backend/services/payrollReportService.js`

## Changes Made
1. Updated the require statement to destructure `pool` from the database module
2. Changed all `db.query()` calls to `pool.execute()` calls (4 occurrences)

## Database Module Structure
The `backend/config/database.js` module exports:
- `pool` - MySQL connection pool (use `pool.execute()` for queries)
- `testConnection` - Test database connectivity
- `executeQuery` - Helper for executing queries
- `findOne` - Helper for finding single records
- `findOneByTable` - Helper for finding by table and conditions
- `executeTransaction` - Transaction wrapper
- `getPoolStats` - Get pool statistics
- `closePool` - Close the connection pool

## Correct Usage Pattern
```javascript
const { pool } = require('../config/database');

// Execute a query
const [rows] = await pool.execute('SELECT * FROM table WHERE id = ?', [id]);

// Or use helper methods
const { executeQuery } = require('../config/database');
const result = await executeQuery('SELECT * FROM table WHERE id = ?', [id]);
```

## Testing
After this fix, the payroll report generation should work correctly:
1. Navigate to Payroll → Reports
2. Select a payroll period
3. Click "Generate Summary Report"
4. PDF should download successfully

## Status
✅ Fixed - The service now correctly uses `pool.execute()` for all database queries.
