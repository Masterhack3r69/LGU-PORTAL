# Excel Import Guide for Employee Management System

## Overview

The Employee Management System supports importing employee data from Excel files (.xlsx, .xls) or CSV files. This guide provides sample files and instructions for successful imports.

## Sample Files Created

### 1. Complete Sample (`employee_import_sample.xlsx`)
- **Purpose**: Full-featured example with all supported fields
- **Contains**: 5 sample employees with complete data
- **Sheets**: 
  - Employee Data (main data)
  - Instructions (detailed guide)
  - Field Mapping (column alternatives)
- **Use Case**: Production imports with comprehensive employee data

### 2. Minimal Sample (`employee_import_minimal.xlsx`)
- **Purpose**: Quick testing with only required fields
- **Contains**: 3 sample employees with minimal data
- **Fields**: employee_number, first_name, last_name, sex, birth_date, appointment_date
- **Use Case**: Quick testing or basic employee imports

### 3. Alternative Headers (`employee_import_alternative_headers.xlsx`)
- **Purpose**: Test column name mapping functionality
- **Contains**: 2 sample employees with user-friendly column names
- **Headers**: "Employee Number", "First Name", "Gender", etc.
- **Use Case**: Testing flexibility of column name recognition

### 4. Invalid Sample (`employee_import_invalid_sample.xlsx`)
- **Purpose**: Test error handling and validation
- **Contains**: 5 rows with various validation errors
- **Errors**: Missing required fields, invalid dates, invalid sex values
- **Use Case**: Testing validation and error reporting

## Required Fields

All Excel files must contain these required fields:

| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `employee_number` | Unique employee identifier | Text | EMP001, EMP002 |
| `first_name` | Employee's first name | Text | Juan, Maria |
| `last_name` | Employee's last name | Text | Cruz, Garcia |
| `sex` | Gender | Male/Female or M/F | Male, Female, M, F |
| `birth_date` | Date of birth | YYYY-MM-DD or Excel date | 1990-01-15 |
| `appointment_date` | Employment start date | YYYY-MM-DD or Excel date | 2023-01-01 |

## Optional Fields

The system supports many optional fields for comprehensive employee records:

### Personal Information
- `middle_name` - Middle name
- `suffix` - Name suffix (Jr., Sr., III)
- `birth_place` - Place of birth
- `civil_status` - Single, Married, Divorced, Widowed
- `contact_number` - Phone number
- `email_address` - Email (required for user account creation)

### Address Information
- `current_address` - Current residential address
- `permanent_address` - Permanent address

### Government IDs
- `tin` - Tax Identification Number
- `gsis_number` - GSIS number
- `pagibig_number` - Pag-IBIG number
- `philhealth_number` - PhilHealth number
- `sss_number` - SSS number

### Employment Details
- `plantilla_position` - Job position/title
- `plantilla_number` - Plantilla item number
- `salary_grade` - Salary grade (numeric)
- `step_increment` - Step increment (numeric, default: 1)
- `current_monthly_salary` - Monthly salary amount
- `current_daily_rate` - Daily rate amount
- `employment_status` - Active, Resigned, Retired, Terminated (default: Active)

## Column Name Flexibility

The system recognizes various column name formats:

| Standard Field | Alternative Names |
|----------------|-------------------|
| `employee_number` | emp_no, employee no, empno |
| `first_name` | firstname, first name, fname |
| `last_name` | lastname, last name, lname, surname |
| `birth_date` | birthdate, birth date, date_of_birth, dob |
| `appointment_date` | appointmentdate, appointment date, date_appointed |
| `contact_number` | contactnumber, contact number, phone, mobile |
| `email_address` | email, email address |
| `salary_grade` | salarygrade, salary grade, sg |

## Import Process

### Step 1: Upload File
1. Navigate to Admin → Import Employees
2. Download template (optional)
3. Upload your Excel file
4. Click "Preview Import"

### Step 2: Review Preview
- Check field mapping
- Review validation errors
- Verify sample data
- Confirm employee count

### Step 3: Configure Options
- **Password Strategy**: How temporary passwords are generated
  - Employee Number: Uses employee number as password
  - Birth Date: Uses birth date (DDMMYYYY) as password
  - Random: Generates secure random passwords
  - Custom Pattern: Employee number + birth day/month (Recommended)
- **Create User Accounts**: Generate login accounts for employees with emails
- **Skip Invalid Rows**: Continue import despite validation errors
- **Initialize Leave Balances**: Set up leave entitlements

### Step 4: Execute Import
- Review final settings
- Execute import
- Download password report (if user accounts created)

## Password Generation Examples

For employee EMP001 born on March 15, 1990:

- **Employee Number**: `EMP001`
- **Birth Date**: `15031990`
- **Random**: `Kx9mP2nQ7wE5`
- **Custom Pattern**: `EMP0011503` (employee number + day/month)

## Validation Rules

### Required Field Validation
- All required fields must have values
- Employee numbers must be unique
- Email addresses must be unique (if provided)

### Data Format Validation
- Sex: Must be Male, Female, M, or F
- Dates: Must be valid dates in YYYY-MM-DD format or Excel date format
- Email: Must be valid email format
- Numeric fields: Must be positive numbers

### Business Rules
- Employee numbers cannot duplicate existing employees
- Email addresses cannot duplicate existing employees
- All employees default to "Active" status if not specified

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Excel file must contain at least a header row and one data row" | Empty file or only headers | Add data rows with employee information |
| "Invalid sex value" | Sex field contains invalid value | Use Male, Female, M, or F |
| "Invalid email format" | Email field has incorrect format | Use valid email format (user@domain.com) |
| "Employee number already exists" | Duplicate employee number | Use unique employee numbers |
| "Invalid date format" | Date field cannot be parsed | Use YYYY-MM-DD format or Excel dates |

### Import Options for Errors
- **Skip Invalid Rows**: Continue importing valid employees, skip problematic ones
- **Stop on Error**: Halt import process when validation fails
- **Review and Fix**: Download error report and fix Excel file

## Best Practices

### File Preparation
1. Use the provided template as a starting point
2. Fill required fields for all employees
3. Validate data before upload (dates, emails, unique values)
4. Keep file size under 10MB
5. Use consistent date formats

### Data Quality
1. Ensure employee numbers are unique and meaningful
2. Use consistent naming conventions
3. Validate email addresses for user account creation
4. Include complete address information when available
5. Verify government ID numbers are correctly formatted

### Import Strategy
1. Test with small batches first
2. Use minimal sample for initial testing
3. Review preview carefully before executing
4. Keep backup of original Excel file
5. Document any data transformations needed

## Troubleshooting

### File Upload Issues
- Check file format (.xlsx, .xls, .csv)
- Verify file size is under 10MB
- Ensure file is not corrupted
- Try with minimal sample first

### Validation Errors
- Review error messages in preview
- Check required fields are filled
- Validate date formats
- Ensure unique values for employee numbers and emails

### Import Failures
- Check server logs for detailed errors
- Verify database connectivity
- Ensure sufficient permissions
- Try smaller batch sizes

## Sample Data Reference

The complete sample file includes these example employees:

1. **Juan Dela Cruz Jr.** (EMP001) - Administrative Assistant I
2. **Maria Santos Garcia** (EMP002) - Administrative Assistant II  
3. **Roberto Miguel Fernandez Sr.** (EMP003) - Senior Administrative Assistant
4. **Ana Rose Mendoza** (EMP004) - Administrative Officer I
5. **Carlos Antonio Reyes III** (EMP005) - Administrative Officer II

Each sample includes complete personal information, government IDs, employment details, and salary information.

## Support

For additional help:
1. Review the Instructions sheet in the complete sample file
2. Test with provided sample files
3. Check validation errors in preview mode
4. Contact system administrator for database-related issues

---

**Note**: Always backup your data before performing bulk imports. Test with sample files first to ensure the process works correctly in your environment.