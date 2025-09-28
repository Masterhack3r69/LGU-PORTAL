# Employee Management System - API Documentation

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`
- **Intranet**: `http://10.0.0.73:3000/api`

## Authentication

All API endpoints (except login) require authentication via session cookies.

### Session-Based Authentication
The system uses session-based authentication with secure HTTP-only cookies.

```javascript
// Login request
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "employee_id": null
  }
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "pagination": { /* pagination info if applicable */ }
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "code": "ERROR_CODE"
}
```

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and create session.

**Request Body:**
```javascript
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin|employee",
    "employee_id": null|number
  }
}
```

### POST /api/auth/logout
Destroy user session.

**Response:**
```javascript
{
  "success": true,
  "message": "Logout successful"
}
```

### GET /api/auth/session
Get current session information.

**Response:**
```javascript
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "employee_id": null
  }
}
```

## Employee Management Endpoints

### GET /api/employees
Get all employees (Admin only).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term for name or employee number
- `department` (string): Filter by department
- `status` (string): Filter by status (Active, Inactive, Terminated)

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_number": "EMP001",
      "first_name": "John",
      "middle_name": "M",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "position": "Software Developer",
      "department": "IT",
      "hire_date": "2024-01-15",
      "employment_status": "Regular",
      "employment_type": "Full-time",
      "basic_salary": 50000.00,
      "status": "Active",
      "created_at": "2024-01-15T08:00:00.000Z",
      "updated_at": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### GET /api/employees/:id
Get employee by ID.

**Response:**
```javascript
{
  "success": true,
  "data": {
    "id": 1,
    "employee_number": "EMP001",
    "first_name": "John",
    "middle_name": "M",
    "last_name": "Doe",
    "suffix": null,
    "email": "john.doe@company.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "date_of_birth": "1990-05-15",
    "gender": "Male",
    "civil_status": "Single",
    "hire_date": "2024-01-15",
    "position": "Software Developer",
    "department": "IT",
    "employment_status": "Regular",
    "employment_type": "Full-time",
    "basic_salary": 50000.00,
    "daily_rate": 2307.69,
    "hourly_rate": 288.46,
    "status": "Active",
    "profile_photo": "/uploads/employees/1/profile.jpg",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+1234567891",
    "emergency_contact_relationship": "Spouse",
    "created_at": "2024-01-15T08:00:00.000Z",
    "updated_at": "2024-01-15T08:00:00.000Z"
  }
}
```

### POST /api/employees
Create new employee (Admin only).

**Request Body:**
```javascript
{
  "employee_number": "EMP002",
  "first_name": "Jane",
  "middle_name": "A",
  "last_name": "Smith",
  "suffix": null,
  "email": "jane.smith@company.com",
  "phone": "+1234567892",
  "address": "456 Oak Ave, City, State",
  "date_of_birth": "1992-08-20",
  "gender": "Female",
  "civil_status": "Married",
  "hire_date": "2024-02-01",
  "position": "HR Specialist",
  "department": "Human Resources",
  "employment_status": "Probationary",
  "employment_type": "Full-time",
  "basic_salary": 45000.00,
  "emergency_contact_name": "John Smith",
  "emergency_contact_phone": "+1234567893",
  "emergency_contact_relationship": "Spouse"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 2,
    "employee_number": "EMP002",
    // ... other employee fields
  }
}
```

### PUT /api/employees/:id
Update employee (Admin only).

**Request Body:** Same as POST /api/employees

**Response:**
```javascript
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    // Updated employee data
  }
}
```

### DELETE /api/employees/:id
Soft delete employee (Admin only).

**Response:**
```javascript
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

### GET /api/employees/profile
Get current user's employee profile.

**Response:**
```javascript
{
  "success": true,
  "data": {
    // Employee profile data (same structure as GET /api/employees/:id)
  }
}
```

### PUT /api/employees/profile
Update current user's employee profile.

**Request Body:**
```javascript
{
  "email": "updated.email@company.com",
  "phone": "+1234567894",
  "address": "789 Pine St, City, State",
  "emergency_contact_name": "Updated Contact",
  "emergency_contact_phone": "+1234567895",
  "emergency_contact_relationship": "Parent"
}
```

## Leave Management Endpoints

### GET /api/leave/applications
Get leave applications.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `employee_id` (number): Filter by employee (Admin only)

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "John Doe",
      "leave_type_id": 1,
      "leave_type_name": "Annual Leave",
      "start_date": "2024-03-01",
      "end_date": "2024-03-05",
      "days_requested": 5.0,
      "reason": "Family vacation",
      "status": "Pending",
      "approved_by": null,
      "approved_at": null,
      "rejection_reason": null,
      "created_at": "2024-02-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### POST /api/leave/applications
Submit leave application.

**Request Body:**
```javascript
{
  "leave_type_id": 1,
  "start_date": "2024-03-01",
  "end_date": "2024-03-05",
  "reason": "Family vacation"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Leave application submitted successfully",
  "data": {
    "id": 1,
    "employee_id": 1,
    "leave_type_id": 1,
    "start_date": "2024-03-01",
    "end_date": "2024-03-05",
    "days_requested": 5.0,
    "reason": "Family vacation",
    "status": "Pending",
    "created_at": "2024-02-15T10:00:00.000Z"
  }
}
```

### PUT /api/leave/applications/:id/approve
Approve leave application (Admin only).

**Request Body:**
```javascript
{
  "approved_days": 5.0,
  "notes": "Approved as requested"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Leave application approved successfully"
}
```

### PUT /api/leave/applications/:id/reject
Reject leave application (Admin only).

**Request Body:**
```javascript
{
  "rejection_reason": "Insufficient leave balance"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Leave application rejected successfully"
}
```

### GET /api/leave/balances
Get leave balances.

**Query Parameters:**
- `employee_id` (number): Specific employee (Admin only)
- `year` (number): Specific year (default: current year)

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "John Doe",
      "leave_type_id": 1,
      "leave_type_name": "Annual Leave",
      "year": 2024,
      "earned_days": 15.0,
      "used_days": 3.0,
      "remaining_days": 12.0,
      "carried_forward": 0.0
    }
  ]
}
```

### GET /api/leave/types
Get leave types.

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Annual Leave",
      "description": "Yearly vacation leave",
      "max_days_per_year": 15,
      "is_paid": true,
      "requires_approval": true,
      "is_active": true
    }
  ]
}
```

## Payroll Management Endpoints

### GET /api/payroll/periods
Get payroll periods (Admin only).

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "January 2024",
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "pay_date": "2024-02-05",
      "status": "Finalized",
      "total_employees": 50,
      "total_gross_pay": 2500000.00,
      "total_deductions": 500000.00,
      "total_net_pay": 2000000.00,
      "processed_by": 1,
      "processed_at": "2024-02-01T10:00:00.000Z",
      "finalized_by": 1,
      "finalized_at": "2024-02-03T15:00:00.000Z"
    }
  ]
}
```

### POST /api/payroll/periods
Create payroll period (Admin only).

**Request Body:**
```javascript
{
  "name": "February 2024",
  "start_date": "2024-02-01",
  "end_date": "2024-02-29",
  "pay_date": "2024-03-05"
}
```

### GET /api/payroll/employees
Get employees for payroll processing (Admin only).

**Query Parameters:**
- `period_id` (number): Payroll period ID
- `department` (string): Filter by department
- `status` (string): Filter by employment status

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_number": "EMP001",
      "full_name": "John Doe",
      "department": "IT",
      "position": "Software Developer",
      "basic_salary": 50000.00,
      "daily_rate": 2307.69,
      "hourly_rate": 288.46,
      "employment_status": "Regular",
      "has_payroll_item": false
    }
  ]
}
```

### POST /api/payroll/process
Process payroll for selected employees (Admin only).

**Request Body:**
```javascript
{
  "period_id": 1,
  "employee_ids": [1, 2, 3],
  "working_days": 22,
  "processing_options": {
    "include_overtime": true,
    "include_holiday_pay": true,
    "apply_overrides": true
  }
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Payroll processed successfully",
  "data": {
    "processed_employees": 3,
    "total_gross_pay": 150000.00,
    "total_deductions": 30000.00,
    "total_net_pay": 120000.00
  }
}
```

### GET /api/payroll/items/:periodId
Get payroll items for a period (Admin only).

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "payroll_period_id": 1,
      "employee_id": 1,
      "employee_name": "John Doe",
      "basic_salary": 50000.00,
      "days_worked": 22.0,
      "basic_pay": 50000.00,
      "overtime_pay": 5000.00,
      "holiday_pay": 2000.00,
      "allowances": {
        "transportation": 2000,
        "meal": 1500
      },
      "total_allowances": 3500.00,
      "deductions": {
        "sss": 500,
        "philhealth": 200,
        "pagibig": 100,
        "tax": 8000
      },
      "total_deductions": 8800.00,
      "gross_pay": 60500.00,
      "net_pay": 51700.00,
      "status": "Calculated"
    }
  ]
}
```

### GET /api/payroll/my-payslips
Get employee's payslips.

**Query Parameters:**
- `year` (number): Filter by year
- `limit` (number): Items per page

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "period_name": "January 2024",
      "pay_date": "2024-02-05",
      "basic_pay": 50000.00,
      "total_allowances": 3500.00,
      "total_deductions": 8800.00,
      "gross_pay": 60500.00,
      "net_pay": 51700.00,
      "status": "Paid"
    }
  ]
}
```

### GET /api/payroll/payslip/:id
Get detailed payslip.

**Response:**
```javascript
{
  "success": true,
  "data": {
    "id": 1,
    "employee": {
      "employee_number": "EMP001",
      "full_name": "John Doe",
      "position": "Software Developer",
      "department": "IT"
    },
    "period": {
      "name": "January 2024",
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "pay_date": "2024-02-05"
    },
    "earnings": {
      "basic_pay": 50000.00,
      "overtime_pay": 5000.00,
      "holiday_pay": 2000.00,
      "allowances": {
        "transportation": 2000,
        "meal": 1500
      },
      "total_allowances": 3500.00,
      "gross_pay": 60500.00
    },
    "deductions": {
      "sss": 500,
      "philhealth": 200,
      "pagibig": 100,
      "tax": 8000,
      "total_deductions": 8800.00
    },
    "net_pay": 51700.00,
    "status": "Paid"
  }
}
```

## Compensation & Benefits Endpoints

### GET /api/compensation/records
Get benefit records.

**Query Parameters:**
- `employee_id` (number): Filter by employee (Admin only)
- `benefit_type` (string): Filter by benefit type
- `status` (string): Filter by status
- `year` (number): Filter by year

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "John Doe",
      "benefit_type": "13th Month",
      "base_amount": 50000.00,
      "total_amount": 50000.00,
      "processing_date": "2024-12-15",
      "period_covered": "2024",
      "status": "Approved",
      "processed_by": 1,
      "approved_by": 1,
      "approved_at": "2024-12-16T10:00:00.000Z",
      "payment_date": "2024-12-20",
      "payment_method": "Bank Transfer",
      "reference_number": "BT202412001"
    }
  ]
}
```

### POST /api/compensation/process
Process benefit (Admin only).

**Request Body:**
```javascript
{
  "employee_ids": [1, 2, 3],
  "benefit_type": "13th Month",
  "processing_date": "2024-12-15",
  "period_covered": "2024",
  "calculation_method": "basic_salary",
  "notes": "Year-end 13th month pay"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Benefits processed successfully",
  "data": {
    "processed_records": 3,
    "total_amount": 150000.00,
    "records": [
      {
        "employee_id": 1,
        "employee_name": "John Doe",
        "amount": 50000.00
      }
    ]
  }
}
```

### POST /api/compensation/monetization
Process leave monetization (Admin only).

**Request Body:**
```javascript
{
  "employee_id": 1,
  "leave_days": 5.0,
  "rate_per_day": 2307.69,
  "processing_date": "2024-12-15",
  "notes": "Unused leave monetization"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Leave monetization processed successfully",
  "data": {
    "id": 5,
    "employee_id": 1,
    "benefit_type": "Leave Monetization",
    "total_amount": 11538.45,
    "calculation_details": {
      "leave_days": 5.0,
      "rate_per_day": 2307.69,
      "total_amount": 11538.45
    }
  }
}
```

## Training Management Endpoints

### GET /api/training/programs
Get training programs.

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Leadership Development Program",
      "description": "Comprehensive leadership training for managers",
      "duration_hours": 40,
      "max_participants": 20,
      "instructor": "Dr. Jane Smith",
      "location": "Conference Room A",
      "training_type": "Internal",
      "status": "Active",
      "start_date": "2024-03-01",
      "end_date": "2024-03-05",
      "registration_deadline": "2024-02-25",
      "cost_per_participant": 5000.00,
      "enrolled_count": 15,
      "available_slots": 5
    }
  ]
}
```

### POST /api/training/programs
Create training program (Admin only).

**Request Body:**
```javascript
{
  "title": "Data Analytics Workshop",
  "description": "Introduction to data analytics tools and techniques",
  "duration_hours": 16,
  "max_participants": 15,
  "instructor": "John Analytics",
  "location": "Training Room B",
  "training_type": "Workshop",
  "start_date": "2024-04-01",
  "end_date": "2024-04-02",
  "registration_deadline": "2024-03-25",
  "cost_per_participant": 3000.00,
  "requirements": "Basic computer skills",
  "objectives": "Learn data visualization and basic analytics"
}
```

### GET /api/training/records
Get training records.

**Query Parameters:**
- `employee_id` (number): Filter by employee (Admin only)
- `program_id` (number): Filter by program
- `status` (string): Filter by status

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "John Doe",
      "training_program_id": 1,
      "program_title": "Leadership Development Program",
      "enrollment_date": "2024-02-20",
      "completion_date": "2024-03-05",
      "status": "Completed",
      "score": 85.5,
      "certificate_issued": true,
      "certificate_path": "/uploads/certificates/cert_001.pdf",
      "feedback": "Excellent program, very informative",
      "cost": 5000.00
    }
  ]
}
```

### POST /api/training/enroll
Enroll in training program.

**Request Body:**
```javascript
{
  "training_program_id": 1,
  "employee_id": 1  // Optional for admin, auto-filled for employees
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Successfully enrolled in training program",
  "data": {
    "id": 2,
    "employee_id": 1,
    "training_program_id": 1,
    "enrollment_date": "2024-02-20",
    "status": "Enrolled"
  }
}
```

## Document Management Endpoints

### GET /api/documents/types
Get document types.

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Resume/CV",
      "description": "Employee resume or curriculum vitae",
      "is_required": true,
      "max_file_size": 5242880,
      "allowed_extensions": ["pdf", "doc", "docx"],
      "is_active": true
    }
  ]
}
```

### GET /api/documents/employee/:employeeId
Get employee documents.

**Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "document_type_id": 1,
      "document_type_name": "Resume/CV",
      "filename": "resume_john_doe.pdf",
      "original_filename": "John_Doe_Resume.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "status": "Approved",
      "approved_by": 1,
      "approved_at": "2024-01-16T10:00:00.000Z",
      "created_at": "2024-01-15T14:00:00.000Z"
    }
  ]
}
```

### POST /api/documents/upload
Upload document.

**Request:** Multipart form data
- `file`: Document file
- `employee_id`: Employee ID (Admin only)
- `document_type_id`: Document type ID

**Response:**
```javascript
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": 2,
    "filename": "document_123456.pdf",
    "original_filename": "Certificate.pdf",
    "status": "Pending"
  }
}
```

## Reports & Analytics Endpoints

### GET /api/reports/dashboard
Get dashboard statistics (Admin only).

**Response:**
```javascript
{
  "success": true,
  "data": {
    "employees": {
      "total": 100,
      "active": 95,
      "inactive": 3,
      "terminated": 2,
      "new_this_month": 5
    },
    "leave": {
      "pending_applications": 12,
      "approved_this_month": 25,
      "total_days_taken": 150
    },
    "payroll": {
      "current_period": "February 2024",
      "total_employees_processed": 95,
      "total_gross_pay": 4750000.00,
      "total_net_pay": 3800000.00
    },
    "training": {
      "active_programs": 5,
      "enrolled_employees": 45,
      "completed_this_month": 20
    }
  }
}
```

### GET /api/reports/employees
Get employee reports (Admin only).

**Query Parameters:**
- `format` (string): 'json' or 'excel'
- `department` (string): Filter by department
- `status` (string): Filter by status

**Response:**
```javascript
{
  "success": true,
  "data": {
    "summary": {
      "total_employees": 100,
      "by_department": {
        "IT": 25,
        "HR": 10,
        "Finance": 15,
        "Operations": 50
      },
      "by_status": {
        "Active": 95,
        "Inactive": 3,
        "Terminated": 2
      }
    },
    "employees": [
      // Employee data array
    ]
  }
}
```

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid username or password
- `SESSION_EXPIRED`: Session has expired
- `ACCESS_DENIED`: Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Invalid data format
- `DUPLICATE_ENTRY`: Duplicate entry detected

### Business Logic Errors
- `EMPLOYEE_NOT_FOUND`: Employee not found
- `INSUFFICIENT_LEAVE_BALANCE`: Not enough leave balance
- `PAYROLL_ALREADY_PROCESSED`: Payroll already processed for this period
- `INVALID_DATE_RANGE`: Invalid date range specified

### System Errors
- `DATABASE_ERROR`: Database operation failed
- `FILE_UPLOAD_ERROR`: File upload failed
- `INTERNAL_SERVER_ERROR`: Internal server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per user
- **File upload endpoints**: 10 requests per 15 minutes per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination information is included in the response:
```javascript
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## File Handling

### File Upload Limits
- Maximum file size: 5MB
- Allowed file types: PDF, DOC, DOCX, JPG, PNG
- Files are stored in `/uploads/employees/{employee_id}/` directory

### File Access
Files can be accessed via:
```
GET /uploads/employees/{employee_id}/{filename}
```

Files are protected and require authentication to access.

This API documentation provides comprehensive information for integrating with the Employee Management System API, including all endpoints, request/response formats, error handling, and usage guidelines.