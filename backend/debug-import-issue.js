// Debug the specific import issue
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Simulate the exact same processing as the controller
function debugImportProcessing(fileBuffer) {
    console.log('🔍 Debugging import processing...');
    console.log('📄 File buffer length:', fileBuffer ? fileBuffer.length : 'No buffer');
    
    try {
        // Read the Excel file exactly like the controller
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        console.log('📊 Workbook created successfully');
        console.log('📋 Sheet names:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        console.log('📄 Using sheet:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        console.log('📊 Worksheet loaded');
        
        // Convert to JSON exactly like the controller
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('📋 JSON conversion completed');
        console.log('📊 Total rows:', jsonData.length);
        
        if (jsonData.length === 0) {
            console.log('❌ No data found in Excel file');
            return false;
        }
        
        if (jsonData.length === 1) {
            console.log('❌ Only header row found, no data rows');
            console.log('📋 Header row:', jsonData[0]);
            return false;
        }
        
        console.log('✅ Validation passed');
        console.log('📋 Headers:', jsonData[0]);
        console.log('📋 First data row:', jsonData[1]);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error processing Excel file:', error.message);
        console.error('📋 Stack trace:', error.stack);
        return false;
    }
}

// Test with different file scenarios
function runTests() {
    console.log('🚀 Starting import debugging tests\n');
    
    // Test 1: Empty file
    console.log('Test 1: Empty buffer');
    debugImportProcessing(null);
    console.log('');
    
    // Test 2: Valid Excel file with headers only
    console.log('Test 2: Headers only');
    const workbook1 = XLSX.utils.book_new();
    const headers = ['employee_number', 'first_name', 'last_name'];
    const worksheet1 = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(workbook1, worksheet1, 'Sheet1');
    const buffer1 = XLSX.write(workbook1, { type: 'buffer', bookType: 'xlsx' });
    debugImportProcessing(buffer1);
    console.log('');
    
    // Test 3: Valid Excel file with headers and data
    console.log('Test 3: Headers and data');
    const workbook2 = XLSX.utils.book_new();
    const data = [
        ['employee_number', 'first_name', 'last_name'],
        ['EMP001', 'John', 'Doe']
    ];
    const worksheet2 = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook2, worksheet2, 'Sheet1');
    const buffer2 = XLSX.write(workbook2, { type: 'buffer', bookType: 'xlsx' });
    debugImportProcessing(buffer2);
    console.log('');
    
    // Test 4: Empty sheet
    console.log('Test 4: Empty sheet');
    const workbook3 = XLSX.utils.book_new();
    const worksheet3 = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook3, worksheet3, 'Sheet1');
    const buffer3 = XLSX.write(workbook3, { type: 'buffer', bookType: 'xlsx' });
    debugImportProcessing(buffer3);
    console.log('');
    
    console.log('✅ All tests completed');
}

runTests();