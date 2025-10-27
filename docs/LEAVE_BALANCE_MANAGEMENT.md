# Leave Balance Management

## Overview
The Leave Balance Management system allows administrators to create, edit, and delete employee leave balances. This provides flexibility to correct mistakes and adjust balances as needed.

## Features

### 1. Add New Leave Balance
Administrators can add new leave balances for employees:
- Select employee from searchable dropdown
- Choose leave type
- Set earned days and carried forward days
- View current balances before adding
- Provide a reason for the addition

### 2. Edit Leave Balance
Administrators can edit existing leave balances:
- Update earned days
- Update carried forward days
- Must provide a reason for the update
- View current balance information before editing

### 3. Delete Leave Balance
Administrators can delete leave balance entries:
- Confirmation dialog to prevent accidental deletion
- Useful for removing incorrect entries
- Action is logged for audit purposes

### 4. Deduct Leave Balance
To deduct from a leave balance, simply edit the balance and reduce the earned days:
- Click "Edit" on the balance you want to adjust
- Reduce the "Earned Days" value
- Provide a reason (e.g., "Correction: Employee took unpaid leave")
- Save the changes

## How to Use

### Adding a Balance
1. Navigate to Leave Management → Balances tab
2. Click "Add Balance" button
3. Select the employee
4. Choose the leave type
5. Enter earned days and any carried forward days
6. Provide a reason for creating this balance
7. Click "Create Balance"

### Editing a Balance
1. Navigate to Leave Management → Balances tab
2. Click on an employee row to view their detailed balances
3. Click the "Edit" button on the balance you want to modify
4. Update the earned days or carried forward days
5. Provide a reason for the update
6. Click "Update Balance"

### Deleting a Balance
1. Navigate to Leave Management → Balances tab
2. Click on an employee row to view their detailed balances
3. Click the "Delete" button on the balance you want to remove
4. Confirm the deletion in the dialog
5. The balance will be permanently removed

### Deducting from a Balance
1. Follow the "Editing a Balance" steps above
2. Reduce the "Earned Days" value by the amount you want to deduct
3. Provide a clear reason (e.g., "Deducted 2 days due to administrative error")
4. Click "Update Balance"

## Important Notes

- All balance modifications are logged for audit purposes
- A reason must be provided for all updates and deletions
- Only administrators can modify leave balances
- Employees can view their balances but cannot modify them
- The system automatically recalculates available balance after any modification
- Used days are tracked separately and are not directly editable (they come from approved leave applications)

## API Endpoints

### Create Leave Balance
```
POST /api/leaves/balances/create
Body: {
  employee_id: number,
  leave_type_id: number,
  year: number,
  earned_days: number,
  carried_forward: number,
  reason: string
}
```

### Update Leave Balance
```
PUT /api/leaves/balances/:id
Body: {
  earned_days?: number,
  carried_forward?: number,
  reason: string
}
```

### Delete Leave Balance
```
DELETE /api/leaves/balances/:id
```

## Audit Trail

All balance modifications are logged in the audit_logs table with:
- User who made the change
- Action performed (CREATE/UPDATE/DELETE)
- Timestamp
- IP address
- Reason provided
- Old and new values

This ensures full traceability of all balance adjustments.
