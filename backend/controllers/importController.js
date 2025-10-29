// controllers/importController.js - Excel import functionality for employees
const XLSX = require('xlsx');
const Employee = require('../models/Employee');
const { LeaveBalance } = require('../models/Leave');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { executeQuery, executeTransaction } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const helpers = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

// Password generation strategies
const PASSWORD_STRATEGIES = {
    EMPLOYEE_NUMBER: 'employee_number',
    BIRTH_DATE: 'birth_date', 
    RANDOM: 'random',
    CUSTOM_PATTERN: 'custom_pattern'
};

// Default password pattern: EmpNum + DDMM (employee number + day/month of birth)
const generatePassword = (employee, strategy = PASSWORD_STRATEGIES.CUSTOM_PATTERN) => {
    switch (strategy) {
        case PASSWORD_STRATEGIES.EMPLOYEE_NUMBER:
            return employee.employee_number;
            
        case PASSWORD_STRATEGIES.BIRTH_DATE:
            if (employee.birth_date) {
                const date = new Date(employee.birth_date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}${month}${year}`;
            }
            return helpers.generateRandomPassword(8);
            
        case PASSWORD_STRATEGIES.RANDOM:
            return helpers.generateRandomPassword(12);
            
        case PASSWORD_STRATEGIES.CUSTOM_PATTERN:
        default:
            // Default: Employee number + DDMM from birth date
            let password = employee.employee_number || 'EMP';
            if (employee.birth_date) {
                const date = new Date(employee.birth_date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                password += day + month;
            } else {
                password += '0101'; // Default if no birth date
            }
            return password;
    }
};

// Map Excel column names to database fields
const COLUMN_MAPPING = {
    // Required fields
    'employee_number': ['employee_number', 'emp_no', 'employee no', 'empno'],
    'first_name': ['first_name', 'firstname', 'first name', 'fname'],
    'last_name': ['last_name', 'lastname', 'last name', 'lname', 'surname'],
    'sex': ['sex', 'gender'],
    'birth_date': ['birth_date', 'birthdate', 'birth date', 'date_of_birth', 'dob'],
    'appointment_date': ['appointment_date', 'appointmentdate', 'appointment date', 'date_appointed'],
    
    // Optional fields
    'middle_name': ['middle_name', 'middlename', 'middle name', 'mname'],
    'suffix': ['suffix', 'name_suffix'],
    'birth_place': ['birth_place', 'birthplace', 'birth place', 'place_of_birth'],
    'civil_status': ['civil_status', 'civilstatus', 'civil status', 'marital_status'],
    'contact_number': ['contact_number', 'contactnumber', 'contact number', 'phone', 'mobile'],
    'email_address': ['email_address', 'email', 'email address'],
    'current_address': ['current_address', 'currentaddress', 'current address', 'address'],
    'permanent_address': ['permanent_address', 'permanentaddress', 'permanent address'],
    
    // Additional Personal Details
    'height': ['height', 'height_m', 'height (m)'],
    'weight': ['weight', 'weight_kg', 'weight (kg)'],
    'blood_type': ['blood_type', 'bloodtype', 'blood type'],
    'umid_id_no': ['umid_id_no', 'umid_id', 'umid'],
    'philsys_number': ['philsys_number', 'philsys', 'psn'],
    'agency_employee_no': ['agency_employee_no', 'agency_id', 'agency employee no'],
    'citizenship': ['citizenship', 'nationality'],
    'dual_citizenship_country': ['dual_citizenship_country', 'dual citizenship country'],
    'telephone_no': ['telephone_no', 'telephone', 'tel_no'],
    'mobile_no': ['mobile_no', 'mobile', 'cellphone'],
    
    // Residential Address
    'residential_house_no': ['residential_house_no', 'res_house_no', 'residential house no'],
    'residential_street': ['residential_street', 'res_street'],
    'residential_subdivision': ['residential_subdivision', 'res_subdivision'],
    'residential_barangay': ['residential_barangay', 'res_barangay'],
    'residential_city': ['residential_city', 'res_city'],
    'residential_province': ['residential_province', 'res_province'],
    'residential_zipcode': ['residential_zipcode', 'res_zipcode', 'res_zip'],
    
    // Permanent Address
    'permanent_house_no': ['permanent_house_no', 'perm_house_no', 'permanent house no'],
    'permanent_street': ['permanent_street', 'perm_street'],
    'permanent_subdivision': ['permanent_subdivision', 'perm_subdivision'],
    'permanent_barangay': ['permanent_barangay', 'perm_barangay'],
    'permanent_city': ['permanent_city', 'perm_city'],
    'permanent_province': ['permanent_province', 'perm_province'],
    'permanent_zipcode': ['permanent_zipcode', 'perm_zipcode', 'perm_zip'],
    
    // Government IDs
    'tin': ['tin', 'tax_identification_number'],
    'gsis_number': ['gsis_number', 'gsisnumber', 'gsis number', 'gsis'],
    'pagibig_number': ['pagibig_number', 'pagibibnumber', 'pagibig number', 'pagibig'],
    'philhealth_number': ['philhealth_number', 'philhealthnumber', 'philhealth number', 'philhealth'],
    'sss_number': ['sss_number', 'sssnumber', 'sss number', 'sss'],
    
    // Employment Information
    'plantilla_position': ['plantilla_position', 'position', 'job_title', 'designation'],
    'department': ['department', 'dept', 'office', 'division'],
    'plantilla_number': ['plantilla_number', 'plantillanumber', 'plantilla number'],
    'salary_grade': ['salary_grade', 'salarygrade', 'salary grade', 'sg'],
    'step_increment': ['step_increment', 'stepincrement', 'step increment', 'step'],
    'current_monthly_salary': ['current_monthly_salary', 'monthly_salary', 'salary', 'basic_salary'],
    'current_daily_rate': ['current_daily_rate', 'daily_rate', 'daily rate'],
    'employment_status': ['employment_status', 'employmentstatus', 'employment status', 'status']
};

// Normalize column names for mapping
const normalizeColumnName = (columnName) => {
    return columnName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

// Find matching field for Excel column
const findFieldMapping = (excelColumn) => {
    const normalized = normalizeColumnName(excelColumn);
    
    for (const [field, variations] of Object.entries(COLUMN_MAPPING)) {
        if (variations.some(variation => normalizeColumnName(variation) === normalized)) {
            return field;
        }
    }
    
    return null;
};

// Validate and clean employee data from Excel
const validateEmployeeData = (rowData, rowIndex) => {
    const errors = [];
    const employee = {};
    
    // Required fields validation
    const requiredFields = ['employee_number', 'first_name', 'last_name', 'sex', 'birth_date', 'appointment_date'];
    
    for (const field of requiredFields) {
        if (!rowData[field] || String(rowData[field]).trim() === '') {
            errors.push(`Row ${rowIndex}: ${field} is required`);
        } else {
            employee[field] = String(rowData[field]).trim();
        }
    }
    
    // Data type and format validation
    if (rowData.sex) {
        const sex = String(rowData.sex).trim().toLowerCase();
        if (sex === 'male' || sex === 'm') {
            employee.sex = 'Male';
        } else if (sex === 'female' || sex === 'f') {
            employee.sex = 'Female';
        } else {
            errors.push(`Row ${rowIndex}: Invalid sex value. Must be Male/Female or M/F`);
        }
    }
    
    // Date validation and conversion
    ['birth_date', 'appointment_date'].forEach(dateField => {
        if (rowData[dateField]) {
            const dateValue = rowData[dateField];
            let parsedDate;
            
            if (dateValue instanceof Date) {
                parsedDate = dateValue;
            } else if (typeof dateValue === 'number') {
                // Excel serial date
                parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
            } else {
                // String date
                parsedDate = new Date(dateValue);
            }
            
            if (isNaN(parsedDate.getTime())) {
                errors.push(`Row ${rowIndex}: Invalid ${dateField} format`);
            } else {
                employee[dateField] = parsedDate.toISOString().split('T')[0];
            }
        }
    });
    
    // Numeric field validation
    ['salary_grade', 'step_increment', 'current_monthly_salary', 'current_daily_rate'].forEach(numField => {
        if (rowData[numField] !== undefined && rowData[numField] !== null && String(rowData[numField]).trim() !== '') {
            const numValue = parseFloat(rowData[numField]);
            if (isNaN(numValue) || numValue < 0) {
                errors.push(`Row ${rowIndex}: ${numField} must be a positive number`);
            } else {
                employee[numField] = numValue;
            }
        }
    });
    
    // Email validation
    if (rowData.email_address && String(rowData.email_address).trim() !== '') {
        const email = String(rowData.email_address).trim();
        if (!/\S+@\S+\.\S+/.test(email)) {
            errors.push(`Row ${rowIndex}: Invalid email format`);
        } else {
            employee.email_address = email;
        }
    }
    
    // Copy other optional fields
    const optionalFields = [
        'middle_name', 'suffix', 'birth_place', 'civil_status', 'contact_number',
        'current_address', 'permanent_address', 'tin', 'gsis_number', 'pagibig_number',
        'philhealth_number', 'sss_number', 'plantilla_position', 'department', 'plantilla_number',
        'employment_status'
    ];
    
    optionalFields.forEach(field => {
        if (rowData[field] !== undefined && rowData[field] !== null && String(rowData[field]).trim() !== '') {
            employee[field] = String(rowData[field]).trim();
        }
    });
    
    // Set defaults
    employee.civil_status = employee.civil_status || 'Single';
    employee.employment_status = employee.employment_status || 'Active';
    employee.step_increment = employee.step_increment || 1;
    
    return { employee, errors };
};

// POST /api/import/employees/preview - Preview Excel import
const previewEmployeeImport = asyncHandler(async (req, res) => {
    if (!req.files || !req.files.excel_file) {
        throw new ValidationError('Excel file is required');
    }
    
    const file = req.files.excel_file;
    
    // Validate file type
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
        throw new ValidationError('Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file');
    }
    
    try {
        // Read the Excel file - handle both buffer and temp file scenarios
        let workbook;
        
        if (file.data && file.data.length > 0) {
            // File is in memory as buffer
            workbook = XLSX.read(file.data, { type: 'buffer' });
        } else if (file.tempFilePath && require('fs').existsSync(file.tempFilePath)) {
            // File is stored as temp file
            workbook = XLSX.readFile(file.tempFilePath);
        } else {
            throw new ValidationError('Unable to read uploaded file - no data buffer or temp file found');
        }
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new ValidationError('Invalid Excel file - no worksheets found');
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
            throw new ValidationError('Unable to read worksheet data');
        }
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
            throw new ValidationError('Excel file must contain at least a header row and one data row');
        }
        
        // Get headers and map to database fields
        const headers = jsonData[0];
        const fieldMapping = {};
        const unmappedColumns = [];
        
        headers.forEach((header, index) => {
            const field = findFieldMapping(header);
            if (field) {
                fieldMapping[index] = field;
            } else {
                unmappedColumns.push({ column: header, index });
            }
        });
        
        // Process data rows
        const previewData = [];
        const validationErrors = [];
        const duplicateChecks = {
            employee_numbers: new Set(),
            emails: new Set()
        };
        
        for (let i = 1; i < Math.min(jsonData.length, 101); i++) { // Preview first 100 rows
            const row = jsonData[i];
            const rowData = {};
            
            // Map row data to fields
            row.forEach((cellValue, colIndex) => {
                if (fieldMapping[colIndex]) {
                    rowData[fieldMapping[colIndex]] = cellValue;
                }
            });
            
            // Validate employee data
            const { employee, errors } = validateEmployeeData(rowData, i + 1);
            
            if (errors.length > 0) {
                validationErrors.push(...errors);
            }
            
            // Check for duplicates within the file
            if (employee.employee_number) {
                if (duplicateChecks.employee_numbers.has(employee.employee_number)) {
                    validationErrors.push(`Row ${i + 1}: Duplicate employee number ${employee.employee_number} in file`);
                } else {
                    duplicateChecks.employee_numbers.add(employee.employee_number);
                }
            }
            
            if (employee.email_address) {
                if (duplicateChecks.emails.has(employee.email_address)) {
                    validationErrors.push(`Row ${i + 1}: Duplicate email ${employee.email_address} in file`);
                } else {
                    duplicateChecks.emails.add(employee.email_address);
                }
            }
            
            previewData.push({
                rowNumber: i + 1,
                data: employee,
                hasErrors: errors.length > 0,
                errors: errors
            });
        }
        
        // Check for existing employees in database
        const existingEmployees = await Promise.all([
            executeQuery('SELECT employee_number FROM employees WHERE employee_number IN (?)', 
                [Array.from(duplicateChecks.employee_numbers)]),
            executeQuery('SELECT email_address FROM employees WHERE email_address IN (?) AND deleted_at IS NULL', 
                [Array.from(duplicateChecks.emails)])
        ]);
        
        const existingEmployeeNumbers = new Set(existingEmployees[0].success ? 
            existingEmployees[0].data.map(e => e.employee_number) : []);
        const existingEmails = new Set(existingEmployees[1].success ? 
            existingEmployees[1].data.map(e => e.email_address) : []);
        
        // Add database duplicate errors
        previewData.forEach(item => {
            if (item.data.employee_number && existingEmployeeNumbers.has(item.data.employee_number)) {
                item.hasErrors = true;
                item.errors.push(`Employee number ${item.data.employee_number} already exists in database`);
                validationErrors.push(`Row ${item.rowNumber}: Employee number ${item.data.employee_number} already exists in database`);
            }
            
            if (item.data.email_address && existingEmails.has(item.data.email_address)) {
                item.hasErrors = true;
                item.errors.push(`Email ${item.data.email_address} already exists in database`);
                validationErrors.push(`Row ${item.rowNumber}: Email ${item.data.email_address} already exists in database`);
            }
        });
        
        res.json({
            success: true,
            data: {
                totalRows: jsonData.length - 1,
                previewRows: previewData.length,
                validRows: previewData.filter(item => !item.hasErrors).length,
                invalidRows: previewData.filter(item => item.hasErrors).length,
                fieldMapping: Object.entries(fieldMapping).reduce((acc, [colIndex, field]) => {
                    acc[field] = headers[colIndex];
                    return acc;
                }, {}),
                unmappedColumns,
                validationErrors,
                previewData,
                passwordStrategies: PASSWORD_STRATEGIES
            },
            message: 'Excel file preview generated successfully'
        });
        
    } catch (error) {
        throw new ValidationError(`Failed to process Excel file: ${error.message}`);
    }
});

// POST /api/import/employees/execute - Execute Excel import
const executeEmployeeImport = asyncHandler(async (req, res) => {
    if (!req.files || !req.files.excel_file) {
        throw new ValidationError('Excel file is required');
    }
    
    const { 
        password_strategy = PASSWORD_STRATEGIES.CUSTOM_PATTERN,
        create_user_accounts = true,
        skip_invalid_rows = true,
        initialize_leave_balances = true
    } = req.body;
    
    const file = req.files.excel_file;
    
    try {
        // Read and process Excel file (same as preview) - handle both buffer and temp file scenarios
        let workbook;
        
        if (file.data && file.data.length > 0) {
            // File is in memory as buffer
            workbook = XLSX.read(file.data, { type: 'buffer' });
        } else if (file.tempFilePath && require('fs').existsSync(file.tempFilePath)) {
            // File is stored as temp file
            workbook = XLSX.readFile(file.tempFilePath);
        } else {
            throw new ValidationError('Unable to read uploaded file - no data buffer or temp file found');
        }
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new ValidationError('Invalid Excel file - no worksheets found');
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
            throw new ValidationError('Unable to read worksheet data');
        }
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
            throw new ValidationError('Excel file must contain at least a header row and one data row');
        }
        
        // Map headers to fields
        const headers = jsonData[0];
        const fieldMapping = {};
        
        headers.forEach((header, index) => {
            const field = findFieldMapping(header);
            if (field) {
                fieldMapping[index] = field;
            }
        });
        
        // Process all data rows
        const importResults = {
            total: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            createdEmployees: [],
            userAccounts: []
        };
        
        // Use transaction for data integrity
        const connection = await executeTransaction(async (connection) => {
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                const rowData = {};
                
                // Map row data to fields
                row.forEach((cellValue, colIndex) => {
                    if (fieldMapping[colIndex]) {
                        rowData[fieldMapping[colIndex]] = cellValue;
                    }
                });
                
                importResults.total++;
                
                // Validate employee data
                const { employee, errors } = validateEmployeeData(rowData, i + 1);
                
                if (errors.length > 0) {
                    if (skip_invalid_rows === 'true') {
                        importResults.skipped++;
                        importResults.errors.push(...errors);
                        continue;
                    } else {
                        throw new ValidationError(`Validation failed at row ${i + 1}: ${errors.join(', ')}`);
                    }
                }
                
                try {
                    // Check for existing employee
                    const existingEmployee = await Employee.findByEmployeeNumber(employee.employee_number);
                    if (existingEmployee.success && existingEmployee.data) {
                        importResults.failed++;
                        importResults.errors.push(`Row ${i + 1}: Employee number ${employee.employee_number} already exists`);
                        continue;
                    }
                    
                    let userId = null;
                    let tempPassword = null;
                    
                    // Create user account if requested and email is provided
                    if (create_user_accounts === 'true' && employee.email_address) {
                        // Generate username and password
                        const username = `${employee.employee_number.toLowerCase()}_${employee.first_name.toLowerCase().replace(/\s+/g, '')}`;
                        tempPassword = generatePassword(employee, password_strategy);
                        
                        // Create user account
                        const userResult = await authMiddleware.createUser({
                            username: username,
                            email: employee.email_address,
                            password: tempPassword,
                            role: 'employee'
                        });
                        
                        if (userResult.success) {
                            userId = userResult.user_id;
                            importResults.userAccounts.push({
                                employee_number: employee.employee_number,
                                username: username,
                                email: employee.email_address,
                                temporary_password: tempPassword
                            });
                        }
                    }
                    
                    // Create employee
                    employee.user_id = userId;
                    const employeeModel = new Employee(employee);
                    const result = await employeeModel.save();
                    
                    if (!result.success) {
                        // Clean up user account if employee creation fails
                        if (userId) {
                            await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
                        }
                        importResults.failed++;
                        importResults.errors.push(`Row ${i + 1}: Failed to create employee - ${result.error}`);
                        continue;
                    }
                    
                    // Initialize leave balances if requested
                    if (initialize_leave_balances === 'true') {
                        try {
                            const currentYear = new Date().getFullYear();
                            await LeaveBalance.initializeYearlyBalances(
                                result.data.id, 
                                currentYear, 
                                employee.appointment_date
                            );
                        } catch (error) {
                            console.warn(`Failed to initialize leave balances for employee ${result.data.id}:`, error.message);
                        }
                    }
                    
                    importResults.successful++;
                    importResults.createdEmployees.push({
                        id: result.data.id,
                        employee_number: employee.employee_number,
                        full_name: `${employee.first_name} ${employee.last_name}`,
                        email: employee.email_address,
                        user_account_created: userId !== null
                    });
                    
                } catch (error) {
                    importResults.failed++;
                    importResults.errors.push(`Row ${i + 1}: ${error.message}`);
                }
            }
        });
        
        // Generate password report if user accounts were created
        let passwordReport = null;
        if (importResults.userAccounts.length > 0) {
            passwordReport = await generatePasswordReport(importResults.userAccounts, password_strategy);
        }
        
        res.json({
            success: true,
            data: {
                ...importResults,
                passwordReport,
                summary: {
                    total_processed: importResults.total,
                    successful_imports: importResults.successful,
                    failed_imports: importResults.failed,
                    skipped_rows: importResults.skipped,
                    user_accounts_created: importResults.userAccounts.length,
                    success_rate: importResults.total > 0 ? 
                        ((importResults.successful / importResults.total) * 100).toFixed(2) + '%' : '0%'
                }
            },
            message: `Import completed. ${importResults.successful} employees imported successfully.`
        });
        
    } catch (error) {
        throw new ValidationError(`Import failed: ${error.message}`);
    }
});

// Generate password report for created user accounts
const generatePasswordReport = async (userAccounts, strategy) => {
    const reportData = {
        strategy_used: strategy,
        total_accounts: userAccounts.length,
        accounts: userAccounts,
        instructions: getPasswordInstructions(strategy),
        security_recommendations: [
            'All employees should change their passwords on first login',
            'Passwords should be at least 8 characters long',
            'Passwords should contain a mix of letters, numbers, and special characters',
            'Passwords should not be shared or written down in unsecured locations',
            'Consider implementing password expiration policies'
        ]
    };
    
    // Save report to file for admin reference
    const reportPath = path.join(__dirname, '../uploads/temp', `password_report_${Date.now()}.json`);
    
    try {
        // Ensure directory exists
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        reportData.report_file = reportPath;
    } catch (error) {
        console.warn('Failed to save password report to file:', error.message);
    }
    
    return reportData;
};

// Get password generation instructions based on strategy
const getPasswordInstructions = (strategy) => {
    switch (strategy) {
        case PASSWORD_STRATEGIES.EMPLOYEE_NUMBER:
            return 'Passwords are set to the employee number. Employees should change this immediately.';
            
        case PASSWORD_STRATEGIES.BIRTH_DATE:
            return 'Passwords are set to the birth date (DDMMYYYY format). Employees should change this immediately.';
            
        case PASSWORD_STRATEGIES.RANDOM:
            return 'Random secure passwords have been generated. Provide these to employees securely.';
            
        case PASSWORD_STRATEGIES.CUSTOM_PATTERN:
        default:
            return 'Passwords follow the pattern: Employee Number + Day/Month of birth (DDMM). Example: EMP001 + 15th March = EMP0011503. Employees should change this on first login.';
    }
};

// GET /api/import/employees/template - Download Excel template
const downloadImportTemplate = asyncHandler(async (req, res) => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Define template headers with descriptions
    const headers = [
        // Basic Information
        'employee_number', 'first_name', 'middle_name', 'last_name', 'suffix',
        'sex', 'birth_date', 'birth_place', 'civil_status',
        'email_address',
        
        // Additional Personal Details
        'height', 'weight', 'blood_type', 'umid_id_no', 'philsys_number',
        'agency_employee_no', 'citizenship', 'dual_citizenship_country',
        'telephone_no', 'mobile_no',
        
        // Residential Address (Detailed)
        'residential_house_no', 'residential_street', 'residential_subdivision',
        'residential_barangay', 'residential_city', 'residential_province', 'residential_zipcode',
        
        // Permanent Address (Detailed)
        'permanent_house_no', 'permanent_street', 'permanent_subdivision',
        'permanent_barangay', 'permanent_city', 'permanent_province', 'permanent_zipcode',
        
        // Government IDs
        'tin', 'gsis_number', 'pagibig_number', 'philhealth_number', 'sss_number',
        
        // Employment Information
        'appointment_date', 'plantilla_position', 'department', 'plantilla_number',
        'salary_grade', 'step_increment', 'current_monthly_salary',
        'current_daily_rate', 'employment_status'
    ];
    
    // Sample data row
    const sampleData = [
        // Basic Information
        'EMP001', 'Juan', 'Dela', 'Cruz', 'Jr.',
        'Male', '1990-01-15', 'Manila, Philippines', 'Single',
        'juan.cruz@company.com',
        
        // Additional Personal Details
        '1.75', '70.5', 'O+', '0000-0000000-0', '0000-0000-0000',
        'AGY-001', 'Filipino', '', '(02) 1234-5678', '+63 912 345 6789',
        
        // Residential Address (Detailed)
        'Block 1 Lot 2', 'Main Street', 'Greenfield Village',
        'Barangay 1', 'Manila', 'Metro Manila', '1000',
        
        // Permanent Address (Detailed)
        'Block 1 Lot 2', 'Home Street', 'Sunshine Village',
        'Barangay 2', 'Quezon City', 'Metro Manila', '1100',
        
        // Government IDs
        '123-456-789-000', '1234567890', '1234567890123', '12-345678901-2', '03-4567890-1',
        
        // Employment Information
        '2023-01-01', 'Administrative Assistant I', 'Human Resources', 'PLANTILLA-001',
        '11', '1', '22000.00', '1000.00', 'Active'
    ];
    
    // Create worksheet data
    const wsData = [headers, sampleData];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = headers.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Import Template');
    
    // Create instructions sheet
    const instructions = [
        ['Employee Import Template Instructions - Complete PDS Format'],
        [''],
        ['Required Fields (must be filled):'],
        ['- employee_number: Unique identifier for the employee'],
        ['- first_name: Employee\'s first name'],
        ['- last_name: Employee\'s last name'],
        ['- sex: Male or Female (or M/F)'],
        ['- birth_date: Date in YYYY-MM-DD format or Excel date'],
        ['- appointment_date: Date in YYYY-MM-DD format or Excel date'],
        [''],
        ['Basic Optional Fields:'],
        ['- middle_name: Employee\'s middle name'],
        ['- suffix: Jr., Sr., III, etc.'],
        ['- birth_place: Place of birth'],
        ['- civil_status: Single, Married, Divorced, Widowed, Separated'],
        ['- email_address: Valid email (required for user account creation)'],
        [''],
        ['Additional Personal Details (PDS):'],
        ['- height: Height in meters (e.g., 1.75)'],
        ['- weight: Weight in kilograms (e.g., 70.5)'],
        ['- blood_type: Blood type (A+, A-, B+, B-, O+, O-, AB+, AB-)'],
        ['- umid_id_no: UMID ID Number'],
        ['- philsys_number: PhilSys Number (PSN)'],
        ['- agency_employee_no: Agency Employee Number'],
        ['- citizenship: Filipino or Dual Citizenship'],
        ['- dual_citizenship_country: Country if dual citizen'],
        ['- telephone_no: Telephone number'],
        ['- mobile_no: Mobile number'],
        [''],
        ['Residential Address (Detailed):'],
        ['- residential_house_no: House/Block/Lot Number'],
        ['- residential_street: Street name'],
        ['- residential_subdivision: Subdivision/Village'],
        ['- residential_barangay: Barangay'],
        ['- residential_city: City/Municipality'],
        ['- residential_province: Province'],
        ['- residential_zipcode: ZIP Code'],
        [''],
        ['Permanent Address (Detailed):'],
        ['- permanent_house_no: House/Block/Lot Number'],
        ['- permanent_street: Street name'],
        ['- permanent_subdivision: Subdivision/Village'],
        ['- permanent_barangay: Barangay'],
        ['- permanent_city: City/Municipality'],
        ['- permanent_province: Province'],
        ['- permanent_zipcode: ZIP Code'],
        [''],
        ['Government IDs:'],
        ['- tin: Tax Identification Number'],
        ['- gsis_number: GSIS number'],
        ['- pagibig_number: Pag-IBIG number'],
        ['- philhealth_number: PhilHealth number'],
        ['- sss_number: SSS number'],
        [''],
        ['Employment Information:'],
        ['- plantilla_position: Job position/title'],
        ['- department: Department or office name'],
        ['- plantilla_number: Plantilla item number'],
        ['- salary_grade: Salary grade (numeric, 1-33)'],
        ['- step_increment: Step increment (numeric, 1-8, default: 1)'],
        ['- current_monthly_salary: Monthly salary amount'],
        ['- current_daily_rate: Daily rate amount'],
        ['- employment_status: Active, Resigned, Retired, Terminated, AWOL (default: Active)'],
        [''],
        ['Password Generation Options:'],
        ['1. Employee Number: Uses employee number as password'],
        ['2. Birth Date: Uses birth date (DDMMYYYY) as password'],
        ['3. Random: Generates secure random passwords'],
        ['4. Custom Pattern: Employee number + birth day/month (default)'],
        [''],
        ['Important Notes:'],
        ['- Employee numbers must be unique'],
        ['- Email addresses must be unique (if provided)'],
        ['- Dates can be in Excel date format or YYYY-MM-DD text'],
        ['- All employees should change their passwords on first login'],
        ['- Invalid rows can be skipped during import'],
        ['- Leave balances will be automatically initialized'],
        ['- New PDS fields are optional but recommended for complete records'],
        ['- Use detailed address fields (residential/permanent) instead of legacy fields']
    ];
    
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    instructionsWs['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instructions');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.xlsx"');
    
    res.send(excelBuffer);
});

module.exports = {
    previewEmployeeImport,
    executeEmployeeImport,
    downloadImportTemplate,
    PASSWORD_STRATEGIES,
    COLUMN_MAPPING
};