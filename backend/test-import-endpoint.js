// Test the actual import endpoint with our sample file
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImportEndpoint() {
    console.log('🧪 Testing import endpoint with sample file...\n');
    
    const sampleFile = path.join(__dirname, 'employee_import_minimal.xlsx');
    
    if (!fs.existsSync(sampleFile)) {
        console.error('❌ Sample file not found. Run create-minimal-sample.js first.');
        return;
    }
    
    try {
        // Test 1: Template download
        console.log('📥 Testing template download...');
        try {
            const templateResponse = await axios.get('http://10.0.0.73:3000/api/import/employees/template', {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            
            console.log('✅ Template download successful');
            console.log(`   • Status: ${templateResponse.status}`);
            console.log(`   • Content-Type: ${templateResponse.headers['content-type']}`);
            console.log(`   • Size: ${templateResponse.data.length} bytes`);
        } catch (error) {
            console.log('❌ Template download failed:', error.response?.status || error.message);
        }
        
        console.log('');
        
        // Test 2: Preview import
        console.log('👁️ Testing import preview...');
        
        const form = new FormData();
        form.append('excel_file', fs.createReadStream(sampleFile));
        
        try {
            const previewResponse = await axios.post('http://10.0.0.73:3000/api/import/employees/preview', form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 30000,
                withCredentials: true
            });
            
            console.log('✅ Preview successful!');
            console.log(`   • Status: ${previewResponse.status}`);
            console.log(`   • Total rows: ${previewResponse.data.data.totalRows}`);
            console.log(`   • Valid rows: ${previewResponse.data.data.validRows}`);
            console.log(`   • Invalid rows: ${previewResponse.data.data.invalidRows}`);
            console.log(`   • Validation errors: ${previewResponse.data.data.validationErrors.length}`);
            
            if (previewResponse.data.data.validationErrors.length > 0) {
                console.log('   • Errors:');
                previewResponse.data.data.validationErrors.forEach(error => {
                    console.log(`     - ${error}`);
                });
            }
            
            // Show field mapping
            console.log('   • Field mapping:');
            Object.entries(previewResponse.data.data.fieldMapping).forEach(([field, column]) => {
                console.log(`     - ${field} <- ${column}`);
            });
            
        } catch (error) {
            console.log('❌ Preview failed:');
            if (error.response) {
                console.log(`   • Status: ${error.response.status}`);
                console.log(`   • Error: ${error.response.data?.message || error.response.data}`);
            } else {
                console.log(`   • Error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test with authentication (you might need to get a valid session)
async function testWithAuth() {
    console.log('🔐 Testing with authentication...\n');
    
    try {
        // First try to login with default admin credentials
        const loginData = {
            username: 'admin',
            password: 'Admin@123' // Default password from reset-database.js
        };
        
        const loginResponse = await axios.post('http://10.0.0.73:3000/api/auth/login', loginData, {
            withCredentials: true
        });
        
        console.log('✅ Login successful');
        
        // Get cookies from login response
        const cookies = loginResponse.headers['set-cookie'];
        
        // Now test import with authentication
        const sampleFile = path.join(__dirname, 'employee_import_minimal.xlsx');
        const form = new FormData();
        form.append('excel_file', fs.createReadStream(sampleFile));
        
        const previewResponse = await axios.post('http://10.0.0.73:3000/api/import/employees/preview', form, {
            headers: {
                ...form.getHeaders(),
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            withCredentials: true,
            timeout: 30000
        });
        
        console.log('✅ Authenticated preview successful!');
        console.log(`   • Total rows: ${previewResponse.data.data.totalRows}`);
        console.log(`   • Valid rows: ${previewResponse.data.data.validRows}`);
        
    } catch (error) {
        console.log('❌ Authentication test failed:');
        if (error.response) {
            console.log(`   • Status: ${error.response.status}`);
            console.log(`   • Error: ${error.response.data?.message || 'Unknown error'}`);
        } else {
            console.log(`   • Error: ${error.message}`);
        }
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting import endpoint tests...\n');
    
    await testImportEndpoint();
    console.log('\n' + '='.repeat(50) + '\n');
    await testWithAuth();
    
    console.log('\n✅ Tests completed');
}

runTests().catch(console.error);