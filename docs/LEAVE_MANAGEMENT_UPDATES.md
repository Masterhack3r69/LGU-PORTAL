# Leave Management System Updates

## Overview
This document describes the updates made to the leave management system to support:
1. Past date leave applications with warnings
2. Medical certificate uploads for leave types that require them
3. Display of medical certificates in admin view

## Database Changes

### Migration File
- **File**: `backend/migrations/add_medical_certificate_to_leaves.sql`
- **Changes**:
  - Added `medical_certificate_path` column to `leave_applications` table
  - Added index for faster queries on medical certificate path
  - Updated table comment

### Running the Migration
```sql
-- Execute the migration file in your MySQL database
mysql -u your_username -p employee_management_system < backend/migrations/add_medical_certificate_to_leaves.sql
```

## Backend Changes

### 1. Leave Controller (`backend/controllers/leaveController.js`)

#### Updated Validation Rules
- **Removed**: Hard validation that prevented past date leave applications
- **Added**: Support for file uploads via `req.files.medical_certificate`
- **Added**: Validation to check if medical certificate is required for the leave type

#### Key Changes in `createLeave` function:
```javascript
// Handle file upload for medical certificate
if (req.files && req.files.medical_certificate) {
  // File upload logic
  // Saves to uploads/medical_certificates/
}

// Check if medical certificate is required but not provided
if (leaveType.data.requires_medical_certificate && !medicalCertificatePath) {
  throw new ValidationError(`Medical certificate is required for ${leaveType.data.name}`);
}
```

### 2. Leave Model (`backend/models/Leave.js`)

#### Constructor Updates
- Added `medical_certificate_path` property

#### Validation Updates
- **Changed**: Past date validation from error to warning
- **Before**: `errors.push('Leave must be applied at least 1 day in advance')`
- **After**: `warnings.push('Leave is being applied for a past date. This may require special approval.')`

#### Database Query Updates
- Updated `create()` method to include `medical_certificate_path`
- Updated `update()` method to include `medical_certificate_path`
- Updated `findById()` to include `requires_medical_certificate` from leave types
- Updated `findAll()` to include `requires_medical_certificate` from leave types

### 3. Leave Routes (`backend/routes/leaveRoutes.js`)

#### New Route
```javascript
// Serve medical certificate files
router.get('/medical-certificates/:filename', (req, res) => {
  // Serves files from uploads/medical_certificates/
});
```

## Frontend Changes

### 1. Leave Application Form (`frontend/src/components/leaves/LeaveApplicationForm.tsx`)

#### New State Variables
```typescript
const [medicalCertificateFile, setMedicalCertificateFile] = useState<File | null>(null);
const [pastDateWarning, setPastDateWarning] = useState<string | null>(null);
```

#### Past Date Warning
- Added `useEffect` hook to check if selected start date is in the past
- Displays warning message when past date is selected
- Does not prevent submission, only warns the user

#### Medical Certificate Upload
- Added file input field that appears when leave type requires medical certificate
- Validates file size (max 5MB)
- Accepts PDF, JPG, PNG formats
- Shows selected file name
- Provides clear button to remove selected file

#### Form Submission
- Changed from JSON to FormData for file upload support
- Validates that medical certificate is provided when required
- Uses new `createLeaveApplicationWithFile` service method

### 2. Admin Leave Applications (`frontend/src/components/leaves/AdminLeaveApplications.tsx`)

#### New Action Button
```typescript
{application.medical_certificate_path && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
      window.open(`${baseUrl}/${application.medical_certificate_path}`, '_blank');
    }}
    className="border-purple-300 hover:bg-purple-50"
  >
    <Eye className="h-4 w-4 mr-1" />
    View Certificate
  </Button>
)}
```

- Displays "View Certificate" button when medical certificate is available
- Opens certificate in new tab when clicked

### 3. Leave Service (`frontend/src/services/leaveService.ts`)

#### New Method
```typescript
async createLeaveApplicationWithFile(formData: FormData): Promise<LeaveApplication> {
  const response = await apiService.postFormData<{ success: boolean; data: LeaveApplication }>('/leaves', formData);
  return response.data;
}
```

### 4. API Service (`frontend/src/services/api.ts`)

#### New Method
```typescript
public async postFormData<T>(url: string, formData: FormData): Promise<T> {
  const response = await this.api.post(url, formData);
  return response.data;
}
```

### 5. Type Definitions (`frontend/src/types/leave.ts`)

#### Updated LeaveApplication Interface
```typescript
export interface LeaveApplication {
  // ... existing fields
  medical_certificate_path?: string;
  // ... joined fields
  requires_medical_certificate?: boolean;
}
```

## Features

### 1. Past Date Leave Applications

**User Experience:**
- Users can now select past dates for leave applications
- A warning message appears: "You are applying for leave on a past date. This may require special approval."
- The application can still be submitted
- Useful for employees who were sick and couldn't apply for leave in time

**Technical Implementation:**
- Validation changed from hard error to warning
- Date comparison uses proper date normalization (setting hours to 0)
- Warning is displayed in a yellow alert box with icon

### 2. Medical Certificate Upload

**User Experience:**
- File upload field appears automatically when leave type requires medical certificate
- Clear indication that certificate is required
- File validation (size and format)
- Visual feedback showing selected file
- Ability to clear and reselect file

**Technical Implementation:**
- Uses FormData for multipart/form-data submission
- Files stored in `uploads/medical_certificates/` directory
- Filename format: `medical_cert_{employee_id}_{timestamp}.{ext}`
- Server-side validation ensures certificate is provided when required

### 3. Medical Certificate Display (Admin)

**User Experience:**
- "View Certificate" button appears in admin view when certificate is available
- Opens certificate in new browser tab
- Easy access for review during approval process

**Technical Implementation:**
- Secure file serving through authenticated route
- File path stored in database
- URL construction uses environment variable for API base URL

## File Upload Configuration

### Directory Structure
```
backend/
  uploads/
    medical_certificates/
      medical_cert_1_1730380000000.pdf
      medical_cert_2_1730380001000.jpg
```

### File Naming Convention
- Format: `medical_cert_{employee_id}_{timestamp}.{extension}`
- Example: `medical_cert_42_1730380000000.pdf`

### Accepted File Types
- PDF (.pdf)
- JPEG (.jpg, .jpeg)
- PNG (.png)

### File Size Limit
- Maximum: 5MB per file

## Security Considerations

1. **Authentication**: All routes require authentication
2. **File Validation**: 
   - File size checked on frontend and should be validated on backend
   - File type restricted to specific formats
3. **File Storage**: Files stored outside web root with controlled access
4. **File Serving**: Files served through authenticated route, not direct access

## Testing Checklist

### Backend Testing
- [ ] Run database migration successfully
- [ ] Test leave application creation with medical certificate
- [ ] Test leave application creation without medical certificate (when not required)
- [ ] Test validation error when certificate required but not provided
- [ ] Test file upload with various file types
- [ ] Test file upload with oversized files
- [ ] Test medical certificate file serving route

### Frontend Testing
- [ ] Test past date selection shows warning
- [ ] Test past date application can be submitted
- [ ] Test medical certificate field appears for required leave types
- [ ] Test medical certificate field hidden for non-required leave types
- [ ] Test file selection and validation
- [ ] Test file clear functionality
- [ ] Test form submission with file
- [ ] Test "View Certificate" button in admin view
- [ ] Test certificate opens in new tab

### Integration Testing
- [ ] End-to-end: Employee applies for sick leave with past date and medical certificate
- [ ] End-to-end: Admin reviews application and views medical certificate
- [ ] End-to-end: Admin approves/rejects application
- [ ] Verify file persists after application submission
- [ ] Verify file accessible after approval

## Environment Variables

Ensure the following environment variable is set in your frontend `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Deployment Notes

1. **Database Migration**: Run the migration script before deploying code changes
2. **File Storage**: Ensure `uploads/medical_certificates/` directory exists and has write permissions
3. **File Serving**: Verify that the backend can serve files from the uploads directory
4. **Environment Variables**: Update `VITE_API_BASE_URL` for production environment

## Future Enhancements

1. **File Compression**: Implement automatic image compression for uploaded files
2. **File Preview**: Add inline preview of medical certificates in admin view
3. **Multiple Files**: Support multiple file uploads per application
4. **File Deletion**: Add ability to delete/replace medical certificates
5. **Audit Trail**: Log file uploads and views in audit logs
6. **Notifications**: Notify admin when application includes medical certificate
7. **Bulk Download**: Allow admin to download all certificates for a period
8. **OCR Integration**: Extract information from medical certificates automatically

## Troubleshooting

### Issue: File upload fails
**Solution**: 
- Check that `uploads/medical_certificates/` directory exists
- Verify directory has write permissions
- Check file size is under 5MB
- Verify file format is supported

### Issue: Medical certificate not displaying
**Solution**:
- Verify file path is stored correctly in database
- Check that file exists in uploads directory
- Verify API base URL is configured correctly
- Check browser console for errors

### Issue: Past date warning not showing
**Solution**:
- Clear browser cache
- Verify date comparison logic in useEffect
- Check that startDate state is being updated

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
