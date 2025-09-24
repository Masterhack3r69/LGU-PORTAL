// Simple test to verify file upload is working
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

async function testUpload() {
    console.log('🧪 Testing file upload to import preview endpoint...');
    
    // Create a simple test Excel file
    const workbook = XLSX.utils.book_new();
    const headers = ['employee_number', 'first_name', 'last_name', 'sex', 'birth_date', 'appointment_date'];
    const testData = [
        ['EMP001', 'John', 'Doe', 'Male', '1990-01-15', '2023-01-01'],
        ['EMP002', 'Jane', 'Smith', 'Female', '1985-05-20', '2023-02-01']
    ];
    
    const wsData = [headers, ...testData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    
    // Write test file
    const testFilePath = path.join(__dirname, 'test_upload.xlsx');
    XLSX.writeFile(workbook, testFilePath);
    console.log('✅ Created test file:', testFilePath);
    
    try {
        // Create form data
        const form = new FormData();
        form.append('excel_file', fs.createReadStream(testFilePath));
        
        // Make request to preview endpoint
        const response = await axios.post('http://10.0.0.73:3000/api/import/employees/preview', form, {
            headers: {
                ...form.getHeaders(),
                'Cookie': 'ems_session=s%3AyourSessionId' // You might need a valid session
            },
            timeout: 30000
        });
        
        console.log('✅ Upload successful!');
        console.log('📊 Response status:', response.status);
        console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Upload failed:');
        if (error.response) {
            console.error('- Status:', error.response.status);
            console.error('- Data:', error.response.data);
        } else {
            console.error('- Error:', error.message);
        }
    } finally {
        // Clean up
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
            console.log('🧹 Cleaned up test file');
        }
    }
}

// Run test
testUpload().catch(console.error);