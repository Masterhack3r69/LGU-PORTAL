# Leave Balance Display Fix

## Issue
Employees were showing 150.0 days total available in the summary table, but when drilling down into individual balances, all leave types showed 0.0 earned days.

## Root Cause
The backend `generateBalanceReport` query in `backend/models/Leave.js` was missing the `employee_id` field in the SELECT statement. This caused:

1. The frontend to receive balance data without employee IDs
2. The frontend to fall back to using `0` as the employee_id
3. When clicking on an employee to view details, the API was called with `employee_id: 0`
4. The API returned empty/default balances (all zeros) for employee_id 0

## Fix Applied

### Backend Change
**File:** `backend/models/Leave.js` (line ~1810)

Added `e.id as employee_id` to the SELECT statement in the `generateBalanceReport` method:

```javascript
SELECT 
    e.id as employee_id,  // <-- ADDED THIS LINE
    e.employee_number,
    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
    // ... rest of the query
```

### Frontend Changes
**File:** `frontend/src/components/leaves/AdminLeaveBalances.tsx`

1. Fixed React key warning by using a fallback key when balance.id is null:
   ```typescript
   key={balance.id || `balance-${balance.leave_type_id}-${idx}`}
   ```

2. The frontend grouping logic already had a fallback for missing employee_id, but now it will receive the correct ID from the backend.

## Testing
After applying this fix:
1. Refresh the browser (hard refresh: Ctrl+Shift+R)
2. Navigate to Leave Management → Balances
3. Click on any employee row
4. The detail dialog should now show the correct earned days for each leave type

## Expected Results
- Forced Leave: 5.0 days
- Special Privilege Leave: 3.0 days  
- Maternity Leave: 105.0 days
- Paternity Leave: 7.0 days
- Sick Leave: 15.0 days
- Vacation Leave: 15.0 days
- **Total: 150.0 days**

## Additional Features
The fix also enables the new Edit and Delete functionality for leave balances:
- Click "Edit" to adjust earned days or carried forward days
- Click "Delete" to remove incorrect balance entries
- All changes require a reason and are logged for audit purposes
