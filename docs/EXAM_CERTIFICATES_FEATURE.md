# Exam Certificates Feature

## Overview
The Exam Certificates feature allows HR administrators to record and manage employee examination records, including Civil Service examinations, professional board exams, and other certifications.

## Features

### Multiple Certificates per Employee
- Employees can have multiple exam certificates
- Each certificate is stored separately with detailed information
- Easy to add, edit, and delete certificates

### Certificate Information
Each exam certificate can store:
- **Exam Name** (required) - e.g., "Career Service Professional"
- **Exam Type** - e.g., "Professional", "Sub-Professional"
- **Rating** - Percentage score (0-100)
- **Date Taken** - When the exam was taken
- **Place of Examination** - Location where exam was conducted
- **License Number** - Certificate or license number
- **Validity Date** - Expiration date of the certificate

## User Interface

### Create Employee Page
When creating a new employee:
1. Fill in basic employee information
2. Scroll to the "Exam Certificates" section
3. Click "Add Certificate" button
4. Fill in the exam details
5. Click "Add" to save the certificate
6. Repeat to add multiple certificates
7. Certificates are saved when the employee is created

### Edit Employee Page
When editing an existing employee:
1. Navigate to the employee's edit page
2. Scroll to the "Exam Certificates" section
3. View all existing certificates
4. Click "Edit" icon to modify a certificate
5. Click "Delete" icon to remove a certificate
6. Click "Add Certificate" to add new ones
7. Changes are saved when you update the employee

### Certificate Display
Each certificate is displayed in a card showing:
- Exam name (prominent)
- Exam type
- Rating percentage
- Date taken
- License number
- Place of examination
- Edit and Delete buttons

## API Endpoints

### Get Certificates for Employee
```
GET /api/exam-certificates/employee/:employeeId
```
Returns all exam certificates for a specific employee.

### Get Single Certificate
```
GET /api/exam-certificates/:id
```
Returns details of a specific exam certificate.

### Create Certificate
```
POST /api/exam-certificates
```
Creates a new exam certificate.

**Request Body:**
```json
{
  "employee_id": 1,
  "exam_name": "Career Service Professional",
  "exam_type": "Professional",
  "rating": 85.50,
  "date_taken": "2023-06-15",
  "place_of_examination": "Manila, Philippines",
  "license_number": "CSC-12345",
  "validity_date": "2028-06-15"
}
```

### Update Certificate
```
PUT /api/exam-certificates/:id
```
Updates an existing exam certificate.

### Delete Certificate
```
DELETE /api/exam-certificates/:id
```
Deletes an exam certificate.

## Database Schema

### Table: exam_certificates

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| employee_id | INT | Foreign key to employees table |
| exam_name | VARCHAR(255) | Name of the exam (required) |
| exam_type | VARCHAR(100) | Type/category of exam |
| rating | DECIMAL(5,2) | Score percentage (0-100) |
| date_taken | DATE | Date exam was taken |
| place_of_examination | VARCHAR(255) | Location of exam |
| license_number | VARCHAR(100) | Certificate/license number |
| validity_date | DATE | Expiration date |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Foreign key on `employee_id` (CASCADE on delete)
- Index on `employee_id` for fast lookups
- Index on `exam_name` for searching
- Index on `date_taken` for sorting

## Validation Rules

### Backend Validation
- `employee_id`: Required, must be a valid integer
- `exam_name`: Required, max 255 characters
- `exam_type`: Optional, max 100 characters
- `rating`: Optional, must be between 0 and 100
- `date_taken`: Optional, must be valid date (YYYY-MM-DD)
- `place_of_examination`: Optional, max 255 characters
- `license_number`: Optional, max 100 characters
- `validity_date`: Optional, must be valid date (YYYY-MM-DD)

### Frontend Validation
- Exam name is required before adding a certificate
- Rating must be a number between 0 and 100
- Dates are validated using date picker component

## Security

### Authentication & Authorization
- All endpoints require authentication
- Only admin users can create, update, or delete certificates
- Employees can view their own certificates
- Audit logging is enabled for all operations

### Data Protection
- Input sanitization on all fields
- SQL injection prevention through parameterized queries
- XSS protection through proper encoding

## Installation

1. **Run Database Migration:**
   ```bash
   mysql -u username -p database_name < backend/scripts/create_exam_certificates_table.sql
   ```

2. **Restart Backend Server:**
   ```bash
   cd backend
   npm start
   ```

3. **Rebuild Frontend (if needed):**
   ```bash
   cd frontend
   npm run build
   ```

## Usage Examples

### Example 1: Civil Service Exam
```json
{
  "exam_name": "Career Service Professional",
  "exam_type": "Professional",
  "rating": 82.45,
  "date_taken": "2023-03-15",
  "place_of_examination": "Manila, Philippines",
  "license_number": "CSC-2023-12345"
}
```

### Example 2: Board Exam
```json
{
  "exam_name": "Licensure Examination for Teachers",
  "exam_type": "Professional Board Exam",
  "rating": 78.90,
  "date_taken": "2022-09-25",
  "place_of_examination": "Cebu City, Philippines",
  "license_number": "PRC-LET-2022-67890",
  "validity_date": "2025-09-25"
}
```

### Example 3: Certification
```json
{
  "exam_name": "Project Management Professional (PMP)",
  "exam_type": "International Certification",
  "rating": 95.00,
  "date_taken": "2023-01-10",
  "place_of_examination": "Online",
  "license_number": "PMI-12345678",
  "validity_date": "2026-01-10"
}
```

## Troubleshooting

### Certificates Not Saving
- Check browser console for errors
- Verify backend server is running
- Check database connection
- Ensure user has admin privileges

### Certificates Not Loading
- Check API endpoint is accessible
- Verify employee_id is correct
- Check browser network tab for errors
- Ensure database table exists

### Migration Issues
- Verify database credentials
- Check if table already exists
- Ensure foreign key constraints are satisfied
- Review migration logs for errors

## Future Enhancements

Potential improvements for future versions:
- File upload for certificate scans/PDFs
- Certificate expiration notifications
- Bulk import of certificates
- Certificate verification status
- Integration with external verification systems
- Certificate templates and printing
- Advanced search and filtering
- Certificate analytics and reporting

## Support

For issues or questions:
1. Check the migration instructions in `backend/scripts/MIGRATION_INSTRUCTIONS.md`
2. Review API documentation
3. Check server logs for errors
4. Verify database schema matches documentation
