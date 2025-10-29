# Document Rejection Behavior - Auto-Delete

## Overview

When an admin rejects a document, the system now **automatically deletes** the document and its associated file from the system, instead of just marking it as "Rejected".

## Why This Change?

**Previous Behavior:**
- Document marked as "Rejected" in database
- File remained on disk
- Document still visible in the system with "Rejected" status
- Employee had to manually delete and re-upload

**New Behavior:**
- Document is completely removed from database
- File is deleted from disk
- Document no longer appears in the system
- Employee can upload a new corrected version
- Cleaner system with no rejected documents cluttering the database

## Implementation Details

### Backend Changes

**File**: `backend/routes/documentRoutes.js`

**Endpoint**: `PUT /api/documents/:id/reject`

**Flow**:
1. Admin clicks "Reject" with rejection notes
2. System validates the document exists and is pending
3. System sends notification to employee (BEFORE deleting)
4. System deletes the document record from database
5. System deletes the physical file from disk
6. Returns success message

### Notification Changes

**Updated Message**:
- Old: "Your [Document Type] document has been rejected. Reason: [Notes]"
- New: "Your [Document Type] document has been rejected and removed from the system. Reason: [Notes]. Please upload a corrected version."

**Metadata Changes**:
- `reference_id`: Set to `null` (since document is deleted)
- `document_type_id`: Added to help employee know which document to re-upload
- `rejected_by`: Added admin username for audit trail

## User Experience

### Admin Workflow

1. **View Pending Documents**
   - Navigate to Documents section
   - Filter by "Pending" status
   - See list of documents awaiting review

2. **Reject Document**
   - Click "Reject" button
   - Enter rejection reason (required)
   - Confirm rejection

3. **Result**
   - Document disappears from list immediately
   - Employee receives notification
   - File is deleted from server

### Employee Workflow

1. **Upload Document**
   - Upload document for approval
   - Document shows as "Pending"

2. **Receive Rejection Notification**
   - Notification appears in bell icon
   - Title: "Document Rejected and Deleted"
   - Message includes rejection reason
   - Priority: HIGH (orange badge)

3. **Re-upload Corrected Document**
   - Document no longer appears in their list
   - Can upload new corrected version
   - New upload starts fresh approval process

## Benefits

### For Admins
✅ Cleaner document list (no rejected documents)
✅ Less clutter in the system
✅ Clear audit trail via notifications
✅ Easier to track pending vs approved documents

### For Employees
✅ Clear indication document was rejected
✅ No confusion about document status
✅ Can immediately upload corrected version
✅ No need to manually delete rejected document

### For System
✅ Reduced database records
✅ Freed disk space (deleted files)
✅ Better performance (fewer records to query)
✅ Cleaner data (no rejected documents)

## Technical Details

### Database Operations

**Before Deletion**:
```javascript
// Document exists in database
SELECT * FROM employee_documents WHERE id = ?
// Returns: { id: 16, status: 'Pending', file_path: '...', ... }
```

**After Deletion**:
```javascript
// Document removed from database
SELECT * FROM employee_documents WHERE id = ?
// Returns: null (not found)
```

### File System Operations

**Before Deletion**:
```
uploads/employees/51/document_file.pdf  ← File exists
```

**After Deletion**:
```
uploads/employees/51/document_file.pdf  ← File deleted
```

### Notification Record

Even though the document is deleted, the notification is preserved:
```javascript
{
  id: 227,
  user_id: 65,
  type: 'document_rejected',
  title: 'Document Rejected and Deleted',
  message: 'Your Valid ID document has been rejected...',
  reference_id: null,  // Document no longer exists
  metadata: {
    document_type: 'Valid ID',
    document_type_id: 39,  // Employee can see which type to re-upload
    review_notes: 'Image is blurry, please upload clearer photo',
    rejected_by: 'admin'
  }
}
```

## API Response

### Success Response
```json
{
  "success": true,
  "message": "Document rejected and deleted successfully"
}
```

### Error Responses

**Document Not Found**:
```json
{
  "success": false,
  "message": "Document not found"
}
```

**Already Reviewed**:
```json
{
  "success": false,
  "message": "Document has already been reviewed"
}
```

**Missing Rejection Notes**:
```json
{
  "success": false,
  "message": "Review notes are required when rejecting a document"
}
```

## Console Logs

When rejecting a document, you'll see:
```
DEBUG: Sending document rejection notification to employee ID: 51
DEBUG: Employee rows found: [ { id: 65, first_name: 'Juan', last_name: 'Cruz' } ]
DEBUG: Sending rejection notification to user ID: 65
DEBUG: NotificationService.createNotification called with: {...}
DEBUG: Rejection notification sent successfully: Notification { id: 227, ... }
DEBUG: Deleting rejected document and file...
DEBUG: Document and file deleted successfully
```

## Comparison: Approve vs Reject

### Approve Flow
1. Document status → "Approved"
2. Document **remains** in system
3. File **remains** on disk
4. Employee receives approval notification
5. Document visible with "Approved" status

### Reject Flow
1. Notification sent to employee
2. Document **deleted** from database
3. File **deleted** from disk
4. Employee receives rejection notification
5. Document **no longer visible** anywhere

## Migration Notes

### Existing Rejected Documents

If you have existing documents with status="Rejected" in your database, they will remain there. This change only affects **new rejections** going forward.

To clean up existing rejected documents:
```sql
-- View existing rejected documents
SELECT id, employee_id, document_type_id, file_name, file_path 
FROM employee_documents 
WHERE status = 'Rejected';

-- Optional: Delete existing rejected documents
-- WARNING: This will permanently delete the records and files
-- Make sure to backup first!
DELETE FROM employee_documents WHERE status = 'Rejected';
```

## Testing Guide

### Test Rejection Flow

1. **Setup**:
   - Login as employee
   - Upload a test document
   - Note the document ID

2. **Reject Document**:
   - Login as admin
   - Navigate to Documents
   - Find the pending document
   - Click "Reject"
   - Enter reason: "Test rejection - please re-upload"
   - Confirm

3. **Verify Deletion**:
   - Check document list (should not appear)
   - Check database: `SELECT * FROM employee_documents WHERE id = ?`
   - Check file system: File should be deleted
   - Check notifications: Employee should have rejection notification

4. **Verify Employee Experience**:
   - Login as employee
   - Check notification bell (should show rejection)
   - Check documents list (rejected document should not appear)
   - Upload new document (should work normally)

## Rollback

If you need to revert to the old behavior (mark as rejected instead of delete):

1. Replace the rejection endpoint code with:
```javascript
const rejectResult = await document.reject(currentUser.id, review_notes);
```

2. Update notification message to remove "and removed from the system"

3. Restart server

## Summary

✅ **Rejected documents are now automatically deleted**
✅ **Files are removed from disk**
✅ **Employees receive clear notification with reason**
✅ **System stays clean with no rejected documents**
✅ **Employees can immediately re-upload corrected version**

This provides a better user experience and keeps the system clean and efficient!
