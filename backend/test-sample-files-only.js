// Test sample files without requiring server authentication
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Import validation logic from controller
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

function simulateImportPreview(filePath) {
    console.log(`\n🧪 Testing: ${path.basename(filePath)}`);
    console.log('='.repeat(50));
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ File not found');
        return false;
    }
    
    try {
        // Read Excel file exactly like the controller
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`📊 File Analysis:`);
        console.log(`   • Total rows: ${jsonData.length}`);
        console.log(`   • Sheets: ${workbook.SheetNames.join(', ')}`);
        console.log(`   • Using sheet: ${sheetName}`);
        
        // Validate minimum structure
        if (jsonData.length < 2) {
            console.log('❌ VALIDATION FAILED: Excel file must contain at least a header row and one data row');
            return false;
        }
        
        console.log('✅ Basic structure validation passed');
        
        // Test field mapping
        const headers = jsonData[0];
        const fieldMapping = {};
        const unmappedColumns = [];
        
        console.log(`\n🗺️ Field Mapping:`);
        headers.forEach((header, index) => {
            const field = findFieldMapping(header);
            if (field) {
                fieldMapping[index] = field;
                console.log(`   ✅ "${header}" -> ${field}`);
            } else {
                unmappedColumns.push({ column: header, index });
                console.log(`   ⚠️  "${header}" -> NOT MAPPED`);
            }
        });
        
        // Check required fields are mapped
        const requiredFields = ['employee_number', 'first_name', 'last_name', 'sex', 'birth_date', 'appointment_date'];
        const mappedFields = Object.values(fieldMapping);
        const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
        
        console.log(`\n📋 Required Fields Check:`);
        if (missingRequired.length > 0) {
            console.log(`   ❌ Missing required fields: ${missingRequired.join(', ')}`);
            return false;
        } else {
            console.log(`   ✅ All required fields mapped`);
        }
        
        // Process sample data
        const dataRows = jsonData.slice(1, Math.min(jsonData.length, 4)); // Test first 3 rows
        let validCount = 0;
        let invalidCount = 0;
        
        console.log(`\n👥 Sample Data Validation:`);
        dataRows.forEach((row, index) => {
            const rowData = {};
            
            // Map row data to fields
            row.forEach((cellValue, colIndex) => {
                if (fieldMapping[colIndex]) {
                    rowData[fieldMapping[colIndex]] = cellValue;
                }
            });
            
            // Basic validation
            const errors = [];
            requiredFields.forEach(field => {
                if (!rowData[field] || String(rowData[field]).trim() === '') {
                    errors.push(`${field} is required`);
                }
            });
            
            const rowNum = index + 2; // +2 because we start from row 1 and skip header
            if (errors.length > 0) {
                invalidCount++;
                console.log(`   ❌ Row ${rowNum}: ${rowData.first_name || 'Unknown'} ${rowData.last_name || ''} - ${errors.length} errors`);
            } else {
                validCount++;
                console.log(`   ✅ Row ${rowNum}: ${rowData.first_name} ${rowData.last_name} (${rowData.employee_number})`);
            }
        });
        
        // Summary
        console.log(`\n📊 Summary:`);
        console.log(`   • Total data rows: ${jsonData.length - 1}`);
        console.log(`   • Sample tested: ${dataRows.length}`);
        console.log(`   • Valid samples: ${validCount}`);
        console.log(`   • Invalid samples: ${invalidCount}`);
        console.log(`   • Unmapped columns: ${unmappedColumns.length}`);
        
        const success = validCount > 0 && missingRequired.length === 0;
        console.log(`\n${success ? '✅ FILE READY FOR IMPORT' : '❌ FILE NEEDS FIXES'}`);
        
        return success;
        
    } catch (error) {
        console.log(`❌ Error processing file: ${error.message}`);
        return false;
    }
}

function testAllSampleFiles() {
    console.log('🚀 Testing All Sample Excel Files');
    console.log('This test simulates the import preview logic without requiring server authentication\n');
    
    const sampleFiles = [
        'employee_import_sample.xlsx',
        'employee_import_minimal.xlsx',
        'employee_import_alternative_headers.xlsx',
        'employee_import_invalid_sample.xlsx'
    ];
    
    let passedCount = 0;
    let totalCount = 0;
    
    sampleFiles.forEach(fileName => {
        const filePath = path.join(__dirname, fileName);
        totalCount++;
        
        if (simulateImportPreview(filePath)) {
            passedCount++;
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 FINAL RESULTS: ${passedCount}/${totalCount} files ready for import`);
    
    if (passedCount === totalCount) {
        console.log('🎉 All sample files are working correctly!');
        console.log('📤 You can now use these files to test the actual import functionality');
    } else {
        console.log('⚠️  Some files have issues - check the details above');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: cd ../frontend && npm run dev');
    console.log('3. Login with: username=admin, password=Admin@123');
    console.log('4. Navigate to Admin → Import Employees');
    console.log('5. Upload one of the working sample files');
    
    return passedCount === totalCount;
}

// Run the test
if (require.main === module) {
    testAllSampleFiles();
}

module.exports = { testAllSampleFiles, simulateImportPreview };