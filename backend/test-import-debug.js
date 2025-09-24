// Test script to debug import functionality
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Test the Excel processing logic
function testExcelProcessing() {
    console.log('🔍 Testing Excel processing logic...');
    
    // Create a simple test Excel file
    const workbook = XLSX.utils.book_new();
    
    // Test headers and data
    const headers = ['employee_number', 'first_name', 'last_name', 'sex', 'birth_date', 'appointment_date'];
    const testData = [
        ['EMP001', 'John', 'Doe', 'Male', '1990-01-15', '2023-01-01'],
        ['EMP002', 'Jane', 'Smith', 'Female', '1985-05-20', '2023-02-01']
    ];
    
    const wsData = [headers, ...testData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    
    // Write test file
    const testFilePath = path.join(__dirname, 'test_import.xlsx');
    XLSX.writeFile(workbook, testFilePath);
    console.log('✅ Created test Excel file:', testFilePath);
    
    // Now read it back and test processing
    try {
        const fileBuffer = fs.readFileSync(testFilePath);
        const readWorkbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = readWorkbook.SheetNames[0];
        const readWorksheet = readWorkbook.Sheets[sheetName];
        
        console.log('📊 Sheet names:', readWorkbook.SheetNames);
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(readWorksheet, { header: 1 });
        console.log('📋 JSON Data:');
        console.log('- Total rows:', jsonData.length);
        console.log('- Headers:', jsonData[0]);
        console.log('- First data row:', jsonData[1]);
        console.log('- Second data row:', jsonData[2]);
        
        // Test validation
        if (jsonData.length < 2) {
            console.log('❌ Validation failed: Not enough rows');
        } else {
            console.log('✅ Validation passed: Has header and data rows');
        }
        
        // Clean up
        fs.unlinkSync(testFilePath);
        console.log('🧹 Cleaned up test file');
        
    } catch (error) {
        console.error('❌ Error processing test file:', error.message);
    }
}

// Test field mapping
function testFieldMapping() {
    console.log('\n🗺️ Testing field mapping...');
    
    const COLUMN_MAPPING = {
        'employee_number': ['employee_number', 'emp_no', 'employee no', 'empno'],
        'first_name': ['first_name', 'firstname', 'first name', 'fname'],
        'last_name': ['last_name', 'lastname', 'last name', 'lname', 'surname'],
        'sex': ['sex', 'gender'],
        'birth_date': ['birth_date', 'birthdate', 'birth date', 'date_of_birth', 'dob'],
        'appointment_date': ['appointment_date', 'appointmentdate', 'appointment date', 'date_appointed']
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
    
    // Test various column names
    const testColumns = [
        'employee_number',
        'Employee Number',
        'EMP NO',
        'first_name',
        'First Name',
        'FIRSTNAME',
        'unknown_column'
    ];
    
    testColumns.forEach(col => {
        const mapped = findFieldMapping(col);
        console.log(`- "${col}" -> ${mapped || 'NOT MAPPED'}`);
    });
}

// Run tests
console.log('🚀 Starting Excel Import Debug Tests\n');
testExcelProcessing();
testFieldMapping();
console.log('\n✅ Debug tests completed');