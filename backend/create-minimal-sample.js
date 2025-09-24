// Create a minimal Excel sample with just required fields
const XLSX = require('xlsx');
const path = require('path');

function createMinimalSample() {
    console.log('📊 Creating minimal Excel sample (required fields only)...');
    
    const workbook = XLSX.utils.book_new();
    
    // Only required fields
    const headers = [
        'employee_number',
        'first_name', 
        'last_name',
        'sex',
        'birth_date',
        'appointment_date'
    ];
    
    // Simple sample data
    const sampleData = [
        ['EMP001', 'John', 'Doe', 'Male', '1990-01-15', '2023-01-01'],
        ['EMP002', 'Jane', 'Smith', 'Female', '1985-05-20', '2023-02-01'],
        ['EMP003', 'Bob', 'Johnson', 'Male', '1988-03-10', '2023-03-01']
    ];
    
    const wsData = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    
    // Save minimal file
    const fileName = 'employee_import_minimal.xlsx';
    const filePath = path.join(__dirname, fileName);
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Minimal sample created:', fileName);
    console.log('📋 Contains only required fields for quick testing');
    
    return filePath;
}

function createAlternativeHeaders() {
    console.log('📊 Creating sample with alternative column names...');
    
    const workbook = XLSX.utils.book_new();
    
    // Alternative column names to test mapping
    const headers = [
        'Employee Number',  // instead of employee_number
        'First Name',       // instead of first_name
        'Last Name',        // instead of last_name
        'Gender',           // instead of sex
        'Birth Date',       // instead of birth_date
        'Date Appointed'    // instead of appointment_date
    ];
    
    const sampleData = [
        ['EMP001', 'Alice', 'Brown', 'F', '1992-07-15', '2023-04-01'],
        ['EMP002', 'Charlie', 'Wilson', 'M', '1987-11-20', '2023-05-01']
    ];
    
    const wsData = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    
    const fileName = 'employee_import_alternative_headers.xlsx';
    const filePath = path.join(__dirname, fileName);
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Alternative headers sample created:', fileName);
    console.log('📋 Tests column name mapping functionality');
    
    return filePath;
}

function createInvalidSample() {
    console.log('📊 Creating invalid sample for error testing...');
    
    const workbook = XLSX.utils.book_new();
    
    const headers = [
        'employee_number',
        'first_name', 
        'last_name',
        'sex',
        'birth_date',
        'appointment_date'
    ];
    
    // Data with various validation errors
    const sampleData = [
        ['', 'Missing', 'EmpNumber', 'Male', '1990-01-15', '2023-01-01'],           // Missing employee_number
        ['EMP002', '', 'MissingFirst', 'Female', '1985-05-20', '2023-02-01'],       // Missing first_name
        ['EMP003', 'Invalid', 'Sex', 'Unknown', '1988-03-10', '2023-03-01'],       // Invalid sex
        ['EMP004', 'Invalid', 'Date', 'Male', 'not-a-date', '2023-04-01'],         // Invalid birth_date
        ['EMP005', 'Valid', 'Employee', 'Female', '1990-12-25', '2023-05-01']      // Valid row
    ];
    
    const wsData = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    
    const fileName = 'employee_import_invalid_sample.xlsx';
    const filePath = path.join(__dirname, fileName);
    XLSX.writeFile(workbook, filePath);
    
    console.log('✅ Invalid sample created:', fileName);
    console.log('📋 Contains validation errors for testing error handling');
    
    return filePath;
}

// Create all sample files
if (require.main === module) {
    console.log('🚀 Creating various Excel samples for testing...\n');
    
    createMinimalSample();
    console.log('');
    
    createAlternativeHeaders();
    console.log('');
    
    createInvalidSample();
    console.log('');
    
    console.log('✅ All sample files created successfully!');
    console.log('📁 Files are ready for import testing');
}

module.exports = {
    createMinimalSample,
    createAlternativeHeaders,
    createInvalidSample
};