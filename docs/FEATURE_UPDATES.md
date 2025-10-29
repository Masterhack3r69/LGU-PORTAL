# Feature Updates

## Document Approval Notifications

### Overview
When an employee uploads a document for approval, the system now automatically notifies admin users to review and approve/reject the document.

### Changes Made

#### 1. Document Upload Notification (backend/routes/documentRoutes.js)
- Added notification to ALL admin users when an employee uploads a document with "Pending" status
- Each admin receives an individual notification
- Notification includes:
  - Employee name
  - Document type
  - High priority flag
  - Reference to the document for quick access

#### 2. Document Approval/Rejection Notifications (backend/routes/documentRoutes.js)
- Added notification to employee when their document is approved
- Added notification to employee when their document is rejected (includes rejection reason)
- Both notifications include document type and reference for tracking

#### 3. Notification Types (backend/services/notificationService.js)
- Added new notification types:
  - `DOCUMENT_APPROVAL_REQUEST`: Sent to admins when employee uploads document
  - `DOCUMENT_APPROVED`: Sent to employee when document is approved
  - `DOCUMENT_REJECTED`: Sent to employee when document is rejected

### How It Works

1. **Employee uploads document**:
   - If user is not admin, document status is set to "Pending"
   - System sends notification to all admin users
   - Notification appears in admin's notification panel

2. **Admin approves document**:
   - Admin reviews and approves the document
   - System sends notification to the employee
   - Employee receives confirmation of approval

3. **Admin rejects document**:
   - Admin reviews and rejects with notes
   - System sends notification to employee with rejection reason
   - Employee can see why document was rejected

## Leave Management Date Validation

### Overview
The leave management system validates that leave request dates do not overlap with existing approved or pending leave requests for the same employee.

### Existing Validation (Confirmed Working)

#### Overlap Check (backend/models/Leave.js)
The system already includes comprehensive overlap validation:

```javascript
async checkOverlappingLeave() {
    const query = `
        SELECT COUNT(*) as overlap_count
        FROM leave_applications
        WHERE employee_id = ? 
            AND status IN ('Pending', 'Approved')
            AND id != COALESCE(?, 0)
            AND (
                (start_date <= ? AND end_date >= ?) OR
                (start_date <= ? AND end_date >= ?) OR
                (start_date >= ? AND end_date <= ?)
            )
    `;
    // ... validation logic
}
```

### Changes Made

#### Updated Error Message (backend/models/Leave.js)
- Changed error message from "Leave dates overlap with existing approved leave"
- To: "Leave dates overlap with existing approved or pending leave"
- This accurately reflects that the system checks both approved AND pending leave requests

### How It Works

1. **Employee submits leave request**:
   - System checks for any overlapping dates with existing leave
   - Checks both "Approved" and "Pending" status leaves
   - Prevents double-booking of leave dates

2. **Validation scenarios**:
   - ✅ No overlap: Leave request is accepted
   - ❌ Overlap with approved leave: Request rejected with error
   - ❌ Overlap with pending leave: Request rejected with error
   - ✅ Updating own leave: System excludes current leave ID from check

3. **Date overlap detection**:
   - Checks if new leave starts during existing leave
   - Checks if new leave ends during existing leave
   - Checks if new leave completely encompasses existing leave
   - Checks if new leave is completely within existing leave

## Testing Recommendations

### Document Notifications
1. Login as employee
2. Upload a document (should be set to "Pending")
3. Verify admin receives notification
4. Login as admin
5. Approve/reject the document
6. Verify employee receives notification

### Leave Overlap Validation
1. Login as employee
2. Submit a leave request (e.g., Jan 10-15)
3. Wait for approval or keep it pending
4. Try to submit another leave request with overlapping dates (e.g., Jan 12-17)
5. Verify system rejects with overlap error message
6. Try to submit leave with non-overlapping dates (e.g., Jan 20-25)
7. Verify system accepts the request

## Database Requirements

No database schema changes required. All features use existing tables:
- `employee_documents` table for document management
- `notifications` table for notification system
- `leave_applications` table for leave management

## API Endpoints Affected

### Document Management
- `POST /api/documents/upload` - Now sends admin notification
- `PUT /api/documents/:id/approve` - Now sends employee notification
- `PUT /api/documents/:id/reject` - Now sends employee notification

### Leave Management
- `POST /api/leaves` - Validates overlap with pending/approved leaves
- `PUT /api/leaves/:id` - Validates overlap when updating leave

## Notes

- All notifications are sent asynchronously and failures do not affect the main operation
- Notification errors are logged but don't prevent document upload/approval
- Leave overlap validation is mandatory and will prevent submission if overlap detected
- Admin users receive notifications for all employee document uploads
- Only active users receive notifications
