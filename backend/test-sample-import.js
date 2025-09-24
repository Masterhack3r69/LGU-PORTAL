// Test the sample Excel file with the actual import logic
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Import the same validation logic from the controller
const COLUMN_MAPPING = {
    'employee_number': ['employee_number', 'emp_no', 'employee no', 'empno'],
    'first_name': ['first_name', 'firstname', 'first name', 'fname'],
    'last_name': ['last_name', 'lastname', 'last name', 'lname', 'surname'],
    'sex': ['sex', 'gender'],
    'birth_date': ['birth_date', 'birthdate', 'birth date', 'date_of_birth', 'dob'],
    'appointment_date': ['appointment_date', 'appointmentdate', 'appointment date', 'date_appointed'],
    'middle_name': ['middle_name', 'middlename', 'middle name', 'mname'],
    'suffix': ['suffix', 'name_suffix'],
    'birth_place': ['birth_place', 'birthplace', 'birth place', 'place_of_birth'],
    'civil_status': ['civil_status', 'civilstatus', 'civil status', 'marital_status'],
    'contact_number': ['contact_number', 'contactnumber', 'contact number', 'phone', 'mobile'],
    'email_address': ['email_address', 'email', 'email address'],
    'current_address': ['current_address', 'currentaddress', 'current address', 'address'],
    'permanent_address': ['permanent_address', 'permanentaddress', 'permanent address'],
    'tin': ['tin', 'tax_identification_number'],
    'gsis_number': ['gsis_number', 'gsisnumber', 'gsis number', 'gsis'],
    'pagibig_number': ['pagibig_number', 'pagibibnumber', 'pagibig number', 'pagibig'],
    'philhealth_number': ['philhealth_number', 'philhealthnumber', 'philhealth number', 'philhealth'],
    'sss_number': ['sss_number', 'sssnumber', 'sss number', 'sss'],
    'plantilla_position': ['plantilla_position', 'position', 'job_title', 'designation'],
    'plantilla_number': ['plantilla_number', 'plantillanumber', 'plantilla number'],
    'salary_grade': ['salary_grade', 'salarygrade', 'salary grade', 'sg'],
    'step_increment': ['step_increment', 'stepincrement', 'step increment', 'step'],
    'current_monthly_salary': ['current_monthly_salary', 'monthly_salary', 'salary', 'basic_salary'],
    'current_daily_rate': ['current_daily_rate', 'daily_rate', 'daily rate'],
    'employment_status': ['employment_status', 'employmentstatus', 'employment status', 'status']
};

const normalizeColumnName = (columnName) => {
    return columnName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

const findFieldMapping = (excelColumn) => {
    const normalized = normalizeColumnName(excelColumn);
    
    for (const [field, variations] of Object.entries(COLUMN_MAPPING)) {
        if (variations.some(variation => normalizeColumnName(variation) === normalized)) {
            return field;
        }
    }
    
    return null;
};

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
    
    // Sex validation
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
    
    // Date validation
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
    
    // Email validation
    if (rowData.email_address && String(rowData.email_address).trim() !== '') {
        const email = String(rowData.email_address).trim();
        if (!/\S+@\S+\.\S+/.test(email)) {
            errors.push(`Row ${rowIndex}: Invalid email format`);
        } else {
            employee.email_address = email;
        }
    }
    
    // Copy other fields
    const optionalFields = [
        'middle_name', 'suffix', 'birth_place', 'civil_status', 'contact_number',
        'current_address', 'permanent_address', 'tin', 'gsis_number', 'pagibig_number',
        'philhealth_number', 'sss_number', 'plantilla_position', 'plantilla_number',
        'employment_status'
    ];
    
    optionalFields.forEach(field => {
        if (rowData[field] !== undefined && rowData[field] !== null && String(rowData[field]).trim() !== '') {
            employee[field] = String(rowData[field]).trim();
        }
    });
    
    // Numeric fields
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
    
    // Set defaults
    employee.civil_status = employee.civil_status || 'Single';
    employee.employment_status = employee.employment_status || 'Active';
    employee.step_increment = employee.step_increment || 1;
    
    return { employee, errors };
};

function testSampleFile() {
    console.log('🧪 Testing sample Excel file with import logic...\n');
    
    const filePath = path.join(__dirname, 'employee_import_sample.xlsx');
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ Sample file not found. Run create-sample-excel.js first.');
        return;
    }
    
    try {
        // Read the Excel file exactly like the controller
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Should be "Employee Data"
        const worksheet = workbook.Sheets[sheetName];
        
        console.log('📊 Workbook loaded successfully');
        console.log('📋 Available sheets:', workbook.SheetNames);
        console.log('📄 Using sheet:', sheetName);
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('📊 Data extraction:');
        console.log('   • Total rows:', jsonData.length);
        console.log('   • Header row:', jsonData.length > 0 ? 'Yes' : 'No');
        console.log('   • Data rows:', jsonData.length - 1);
        
        if (jsonData.length < 2) {
            console.log('❌ VALIDATION FAILED: Excel file must contain at least a header row and one data row');
            return;
        }
        
        console.log('✅ Basic validation passed\n');
        
        // Test field mapping
        const headers = jsonData[0];
        const fieldMapping = {};
        const unmappedColumns = [];
        
        console.log('🗺️ Field mapping:');
        headers.forEach((header, index) => {
            const field = findFieldMapping(header);
            if (field) {
                fieldMapping[index] = field;
                console.log(`   ✅ "${header}" -> ${field}`);
            } else {
                unmappedColumns.push({ column: header, index });
                console.log(`   ❌ "${header}" -> NOT MAPPED`);
            }
        });
        
        console.log('\n📋 Processing employee data:');
        
        const previewData = [];
        const validationErrors = [];
        let validCount = 0;
        let invalidCount = 0;
        
        // Process first few rows for testing
        for (let i = 1; i < Math.min(jsonData.length, 6); i++) {
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
            
            console.log(`\n   Employee ${i} (Row ${i + 1}):`);
            console.log(`   • Name: ${employee.first_name || 'N/A'} ${employee.last_name || 'N/A'}`);
            console.log(`   • Employee #: ${employee.employee_number || 'N/A'}`);
            console.log(`   • Email: ${employee.email_address || 'N/A'}`);
            console.log(`   • Errors: ${errors.length}`);
            
            if (errors.length > 0) {
                invalidCount++;
                console.log(`   • Issues: ${errors.join(', ')}`);
                validationErrors.push(...errors);
            } else {
                validCount++;
                console.log(`   • Status: ✅ Valid`);
            }
            
            previewData.push({
                rowNumber: i + 1,
                data: employee,
                hasErrors: errors.length > 0,
                errors: errors
            });
        }
        
        console.log('\n📊 Summary:');
        console.log(`   • Total processed: ${previewData.length}`);
        console.log(`   • Valid employees: ${validCount}`);
        console.log(`   • Invalid employees: ${invalidCount}`);
        console.log(`   • Validation errors: ${validationErrors.length}`);
        console.log(`   • Unmapped columns: ${unmappedColumns.length}`);
        
        if (validationErrors.length === 0) {
            console.log('\n✅ ALL TESTS PASSED! Sample file is ready for import.');
        } else {
            console.log('\n⚠️  Some validation issues found:');
            validationErrors.forEach(error => console.log(`   • ${error}`));
        }
        
        // Test the preview response format
        const previewResponse = {
            totalRows: jsonData.length - 1,
            previewRows: previewData.length,
            validRows: validCount,
            invalidRows: invalidCount,
            fieldMapping: Object.entries(fieldMapping).reduce((acc, [colIndex, field]) => {
                acc[field] = headers[colIndex];
                return acc;
            }, {}),
            unmappedColumns,
            validationErrors,
            previewData
        };
        
        console.log('\n📋 Preview response structure:');
        console.log(JSON.stringify(previewResponse, null, 2));
        
    } catch (error) {
        console.error('❌ Error testing sample file:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testSampleFile();