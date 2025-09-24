# Employee Import API Documentation

## Overview

The Employee Import API provides comprehensive functionality for bulk importing employee data from Excel/CSV files. This system includes intelligent column mapping, data validation, user account creation, and automated leave balance initialization.

## API Endpoints

### 1. Download Import Template

**Endpoint**: `GET /api/import/employees/template`

**Description**: Downloads an Excel template file with sample data and detailed instructions for employee import.

**Authentication**: Admin required

**Response**: Excel file download (.xlsx)

**Features**:
- Pre-formatted template with all supported columns
- Sample data row for reference
- Detailed instructions sheet
- Column width optimization for readability

**Example**:
```bash
curl -X GET http://localhost:3000/api/import/employees/template \
  -H "Authorization: Bearer <admin-token>" \
  -o employee_import_template.xlsx
```

### 2. Preview Employee Import

**Endpoint**: `POST /api/import/employees/preview`

**Description**: Validates and previews employee data from Excel/CSV file without making any database changes.

**Authentication**: Admin required

**Content-Type**: `multipart/form-data`

**Parameters**:
- `excel_file` (file, required): Excel (.xlsx, .xls) or CSV file

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRows": 100,
    "previewRows": 100,
    "validRows": 95,
    "invalidRows": 5,
    "fieldMapping": {
      "employee_number": "Employee Number",
      "first_name": "First Name",
      "last_name": "Last Name"
    },
    "unmappedColumns": [
      {
        "column": "Unknown Column",
        "index": 15
      }
    ],
    "validationErrors": [
      "Row 5: email_address is required",
      "Row 12: Invalid birth_date format"
    ],
    "previewData": [
      {
        "rowNumber": 2,
        "data": {
          "employee_number": "EMP001",
          "first_name": "John",
          "last_name": "Doe"
        },
        "hasErrors": false,
        "errors": []
      }
    ],
    "passwordStrategies": {
      "EMPLOYEE_NUMBER": "employee_number",
      "BIRTH_DATE": "birth_date",
      "RANDOM": "random",
      "CUSTOM_PATTERN": "custom_pattern"
    }
  },
  "message": "Excel file preview generated successfully"
}
```

**Validation Features**:
- Column mapping validation
- Data type validation
- Required field validation
- Duplicate detection (within file and against database)
- Email format validation
- Date format validation
- Numeric field validation

### 3. Execute Employee Import

**Endpoint**: `POST /api/import/employees/execute`

**Description**: Executes the employee import process with user account creation and leave balance initialization.

**Authentication**: Admin required

**Content-Type**: `multipart/form-data`

**Parameters**:
- `excel_file` (file, required): Excel (.xlsx, .xls) or CSV file
- `password_strategy` (string, optional): Password generation strategy
  - `employee_number`: Use employee number as password
  - `birth_date`: Use birth date (DDMMYYYY) as password
  - `random`: Generate secure random passwords
  - `custom_pattern`: Employee number + birth day/month (default)
- `create_user_accounts` (boolean, optional): Create user accounts for employees with email addresses (default: true)
- `skip_invalid_rows` (boolean, optional): Skip rows with validation errors (default: true)
- `initialize_leave_balances` (boolean, optional): Initialize yearly leave balances (default: true)

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "successful": 95,
    "failed": 3,
    "skipped": 2,
    "errors": [
      "Row 5: Employee number EMP005 already exists",
      "Row 12: Invalid email format"
    ],
    "createdEmployees": [
      {
        "id": 123,
        "employee_number": "EMP001",
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "user_account_created": true
      }
    ],
    "userAccounts": [
      {
        "employee_number": "EMP001",
        "username": "emp001_john",
        "email": "john.doe@company.com",
        "temporary_password": "EMP0011501"
      }
    ],
    "passwordReport": {
      "strategy_used": "custom_pattern",
      "total_accounts": 95,
      "accounts": [...],
      "instructions": "Passwords follow the pattern: Employee Number + Day/Month of birth (DDMM)...",
      "security_recommendations": [
        "All employees should change their passwords on first login",
        "Passwords should be at least 8 characters long",
        "Passwords should contain a mix of letters, numbers, and special characters"
      ],
      "report_file": "/path/to/password_report_timestamp.json"
    },
    "summary": {
      "total_processed": 100,
      "successful_imports": 95,
      "failed_imports": 3,
      "skipped_rows": 2,
      "user_accounts_created": 95,
      "success_rate": "95.00%"
    }
  },
  "message": "Import completed. 95 employees imported successfully."
}
```

## Field Mapping

### Column Mapping Intelligence

The system uses intelligent column mapping to automatically detect Excel column headers and map them to database fields. The mapping is case-insensitive and handles various naming conventions.

#### Required Fields

| Database Field | Excel Column Variations |
|---|---|
| `employee_number` | employee_number, emp_no, employee no, empno |
| `first_name` | first_name, firstname, first name, fname |
| `last_name` | last_name, lastname, last name, lname, surname |
| `sex` | sex, gender |
| `birth_date` | birth_date, birthdate, birth date, date_of_birth, dob |
| `appointment_date` | appointment_date, appointmentdate, appointment date, date_appointed |

#### Optional Fields

| Database Field | Excel Column Variations |
|---|---|
| `middle_name` | middle_name, middlename, middle name, mname |
| `suffix` | suffix, name_suffix |
| `birth_place` | birth_place, birthplace, birth place, place_of_birth |
| `civil_status` | civil_status, civilstatus, civil status, marital_status |
| `contact_number` | contact_number, contactnumber, contact number, phone, mobile |
| `email_address` | email_address, email, email address |
| `current_address` | current_address, currentaddress, current address, address |
| `permanent_address` | permanent_address, permanentaddress, permanent address |
| `tin` | tin, tax_identification_number |
| `gsis_number` | gsis_number, gsisnumber, gsis number, gsis |
| `pagibig_number` | pagibig_number, pagibibnumber, pagibig number, pagibig |
| `philhealth_number` | philhealth_number, philhealthnumber, philhealth number, philhealth |
| `sss_number` | sss_number, sssnumber, sss number, sss |
| `plantilla_position` | plantilla_position, position, job_title, designation |
| `plantilla_number` | plantilla_number, plantillanumber, plantilla number |
| `salary_grade` | salary_grade, salarygrade, salary grade, sg |
| `step_increment` | step_increment, stepincrement, step increment, step |
| `current_monthly_salary` | current_monthly_salary, monthly_salary, salary, basic_salary |
| `current_daily_rate` | current_daily_rate, daily_rate, daily rate |
| `employment_status` | employment_status, employmentstatus, employment status, status |

### Data Validation Rules

#### Required Field Validation
- All required fields must have non-empty values
- Employee number must be unique across the system
- Email addresses must be unique (if provided)

#### Data Type Validation
- **Sex**: Must be "Male", "Female", "M", or "F" (case-insensitive)
- **Dates**: Accepts Excel date format, YYYY-MM-DD text format, or standard date strings
- **Numeric Fields**: Salary grade, step increment, salary amounts must be positive numbers
- **Email**: Must follow valid email format (if provided)

#### Business Rule Validation
- Employee numbers cannot be duplicated within the import file
- Email addresses cannot be duplicated within the import file
- Birth date must be a valid date in the past
- Appointment date must be a valid date

## Password Generation Strategies

### 1. Employee Number Strategy
- **Pattern**: Uses the employee number as the password
- **Example**: Employee EMP001 gets password "EMP001"
- **Security**: Low security, requires immediate password change

### 2. Birth Date Strategy
- **Pattern**: Uses birth date in DDMMYYYY format
- **Example**: Born on January 15, 1990 gets password "15011990"
- **Security**: Low security, requires immediate password change

### 3. Random Strategy
- **Pattern**: Generates cryptographically secure random passwords
- **Length**: 12 characters
- **Characters**: Letters, numbers, and special characters
- **Security**: High security, but requires secure distribution

### 4. Custom Pattern Strategy (Default)
- **Pattern**: Employee number + day/month of birth (DDMM)
- **Example**: Employee EMP001 born on January 15 gets password "EMP0011501"
- **Security**: Medium security, balance between security and memorability
- **Fallback**: Uses "0101" if birth date is not provided

## Error Handling

### Validation Errors
- **Field Validation**: Missing required fields, invalid data types
- **Business Rule Violations**: Duplicate employee numbers, invalid dates
- **Format Errors**: Invalid email formats, unsupported file types

### Import Errors
- **Database Errors**: Connection issues, constraint violations
- **File Processing Errors**: Corrupted files, unsupported formats
- **Transaction Errors**: Rollback on critical failures

### Error Response Format
```json
{
  "success": false,
  "error": "Validation failed at row 5: email_address is required",
  "details": {
    "row": 5,
    "field": "email_address",
    "value": "",
    "message": "email_address is required"
  }
}
```

## Security Features

### Authentication & Authorization
- All endpoints require admin authentication
- Role-based access control enforced
- Session-based authentication with secure cookies

### Data Security
- File type validation (only Excel/CSV accepted)
- Input sanitization and validation
- SQL injection prevention with prepared statements
- Secure temporary file handling

### Password Security
- Configurable password generation strategies
- Security recommendations provided
- Temporary password reports for secure distribution
- Encouragement of immediate password changes

### Audit Trail
- Complete logging of all import operations
- User tracking for all actions
- Detailed error logging for troubleshooting
- Import statistics and reporting

## Usage Examples

### Basic Import Workflow

```bash
# 1. Download template
curl -X GET http://localhost:3000/api/import/employees/template \
  -H "Authorization: Bearer <admin-token>" \
  -o template.xlsx

# 2. Fill template with employee data
# (Edit template.xlsx with employee information)

# 3. Preview import
curl -X POST http://localhost:3000/api/import/employees/preview \
  -H "Authorization: Bearer <admin-token>" \
  -F "excel_file=@filled_template.xlsx"

# 4. Execute import with custom settings
curl -X POST http://localhost:3000/api/import/employees/execute \
  -H "Authorization: Bearer <admin-token>" \
  -F "excel_file=@filled_template.xlsx" \
  -F "password_strategy=custom_pattern" \
  -F "create_user_accounts=true" \
  -F "skip_invalid_rows=true" \
  -F "initialize_leave_balances=true"
```

### JavaScript/Node.js Example

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function importEmployees() {
  const form = new FormData();
  form.append('excel_file', fs.createReadStream('employees.xlsx'));
  form.append('password_strategy', 'custom_pattern');
  form.append('create_user_accounts', 'true');
  form.append('skip_invalid_rows', 'true');
  form.append('initialize_leave_balances', 'true');

  try {
    const response = await axios.post(
      'http://localhost:3000/api/import/employees/execute',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer <admin-token>'
        }
      }
    );
    
    console.log('Import successful:', response.data);
  } catch (error) {
    console.error('Import failed:', error.response.data);
  }
}
```

## Best Practices

### Data Preparation
1. **Use the Template**: Always start with the downloaded template
2. **Validate Data**: Ensure all required fields are filled
3. **Check Duplicates**: Verify no duplicate employee numbers or emails
4. **Date Formats**: Use consistent date formats (YYYY-MM-DD recommended)
5. **Email Validation**: Ensure all email addresses are valid and unique

### Import Process
1. **Preview First**: Always preview before executing import
2. **Small Batches**: Import in smaller batches for better error handling
3. **Backup Database**: Create database backup before large imports
4. **Monitor Progress**: Check import results and error reports
5. **Verify Data**: Validate imported data in the system

### Security Considerations
1. **Secure File Handling**: Delete temporary files after import
2. **Password Distribution**: Securely distribute temporary passwords
3. **Access Control**: Limit import functionality to authorized admins
4. **Audit Logging**: Monitor and review import activities
5. **Data Privacy**: Ensure compliance with data protection regulations

## Troubleshooting

### Common Issues

#### File Format Issues
- **Problem**: "Invalid file type" error
- **Solution**: Ensure file is .xlsx, .xls, or .csv format

#### Column Mapping Issues
- **Problem**: Required fields not detected
- **Solution**: Check column headers match supported variations

#### Validation Errors
- **Problem**: Multiple validation errors
- **Solution**: Use preview mode to identify and fix issues

#### Duplicate Data
- **Problem**: "Employee already exists" errors
- **Solution**: Check for existing employees before import

#### Performance Issues
- **Problem**: Import timeout for large files
- **Solution**: Split large files into smaller batches

### Error Codes

| Error Code | Description | Solution |
|---|---|---|
| `INVALID_FILE_TYPE` | Unsupported file format | Use .xlsx, .xls, or .csv files |
| `MISSING_REQUIRED_FIELD` | Required field is empty | Fill all required fields |
| `DUPLICATE_EMPLOYEE_NUMBER` | Employee number already exists | Use unique employee numbers |
| `INVALID_EMAIL_FORMAT` | Email format is invalid | Use valid email format |
| `INVALID_DATE_FORMAT` | Date format not recognized | Use YYYY-MM-DD format |
| `DATABASE_ERROR` | Database operation failed | Check database connection |

## API Integration

### Frontend Integration Example

```typescript
// TypeScript interface for import response
interface ImportResponse {
  success: boolean;
  data: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    createdEmployees: Employee[];
    userAccounts: UserAccount[];
    passwordReport: PasswordReport;
    summary: ImportSummary;
  };
  message: string;
}

// Import service
class ImportService {
  async previewImport(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('excel_file', file);
    
    const response = await fetch('/api/import/employees/preview', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.json();
  }
  
  async executeImport(
    file: File, 
    options: ImportOptions
  ): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('password_strategy', options.passwordStrategy);
    formData.append('create_user_accounts', options.createUserAccounts.toString());
    formData.append('skip_invalid_rows', options.skipInvalidRows.toString());
    formData.append('initialize_leave_balances', options.initializeLeaveBalances.toString());
    
    const response = await fetch('/api/import/employees/execute', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.json();
  }
}
```

## Changelog

### Version 1.1.0 (Latest)
- **Enhanced Column Mapping**: Fixed `plantilla_number` field mapping to include additional variations
- **Improved Field Recognition**: Better automatic detection of plantilla-related fields
- **Template Updates**: Updated Excel template to reflect improved field mappings
- **Validation Enhancement**: Better handling of plantilla position and number fields

### Version 1.0.0
- Initial release with comprehensive import functionality
- Excel/CSV support with intelligent column mapping
- User account creation with configurable password strategies
- Leave balance initialization
- Comprehensive validation and error handling
- Audit trail and security features