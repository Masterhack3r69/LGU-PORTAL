# Exam Certificates Migration Instructions

## Overview
This migration adds support for storing employee exam certificates (Civil Service, professional exams, etc.)

## Database Changes

### New Table: `exam_certificates`

Run the following SQL script in your database:

```sql
CREATE TABLE IF NOT EXISTS exam_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(100),
    rating DECIMAL(5, 2),
    date_taken DATE,
    place_of_examination VARCHAR(255),
    license_number VARCHAR(100),
    validity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_exam_name (exam_name),
    INDEX idx_date_taken (date_taken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## How to Run

### Option 1: Using MySQL Command Line
```bash
mysql -u your_username -p your_database_name < backend/scripts/create_exam_certificates_table.sql
```

### Option 2: Using phpMyAdmin or MySQL Workbench
1. Open your database management tool
2. Select your database
3. Copy and paste the SQL script above
4. Execute the query

### Option 3: Using the Migration Script
```bash
cd backend
node scripts/add_exam_certificates_migration.js
```

## Verification

After running the migration, verify the table was created:

```sql
SHOW TABLES LIKE 'exam_certificates';
DESCRIBE exam_certificates;
```

## Rollback (if needed)

To remove the table:

```sql
DROP TABLE IF EXISTS exam_certificates;
```

## Features Added

1. **Backend:**
   - New `ExamCertificate` model
   - New exam certificate controller with CRUD operations
   - New API routes for exam certificates
   - Validation rules for exam certificate data

2. **Frontend:**
   - `ExamCertificateManager` component for managing certificates
   - Integration with Create Employee page
   - Integration with Edit Employee page
   - Service layer for API calls

3. **API Endpoints:**
   - `GET /api/exam-certificates/employee/:employeeId` - Get all certificates for an employee
   - `GET /api/exam-certificates/:id` - Get specific certificate
   - `POST /api/exam-certificates` - Create new certificate
   - `PUT /api/exam-certificates/:id` - Update certificate
   - `DELETE /api/exam-certificates/:id` - Delete certificate

## Usage

### Creating an Employee with Exam Certificates
1. Navigate to Add New Employee page
2. Fill in employee details
3. Scroll to "Exam Certificates" section
4. Click "Add Certificate"
5. Fill in exam details (name, type, rating, date, etc.)
6. Click "Add" to add the certificate
7. Repeat for multiple certificates
8. Save the employee

### Editing Employee Exam Certificates
1. Navigate to Edit Employee page
2. Scroll to "Exam Certificates" section
3. View existing certificates
4. Click "Edit" to modify a certificate
5. Click "Delete" to remove a certificate
6. Click "Add Certificate" to add new ones
7. Save changes

## Notes

- Exam certificates are automatically deleted when an employee is deleted (CASCADE)
- All fields except `exam_name` are optional
- Rating is stored as a decimal (0-100)
- Dates are stored in DATE format (YYYY-MM-DD)
