// Test client for debug upload server
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDebugUpload() {
    console.log('🧪 Testing debug upload server...\n');
    
    const sampleFile = path.join(__dirname, 'employee_import_minimal.xlsx');
    
    if (!fs.existsSync(sampleFile)) {
        console.log('❌ Sample file not found. Creating it...');
        const { createMinimalSample } = require('./create-minimal-sample');
        createMinimalSample();
    }
    
    // Verify file exists and is readable
    const stats = fs.statSync(sampleFile);
    console.log(`📄 Sample file: ${path.basename(sampleFile)}`);
    console.log(`   • Size: ${stats.size} bytes`);
    console.log(`   • Modified: ${stats.mtime}`);
    
    // Test with FormData (like the real request)
    const form = new FormData();
    form.append('excel_file', fs.createReadStream(sampleFile), {
        filename: 'employee_import_minimal.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    try {
        const response = await axios.post('http://localhost:3001/debug-upload', form, {
            headers: {
                ...form.getHeaders()
            },
            timeout: 30000
        });
        
        console.log('\n✅ Debug upload successful!');
        console.log(`   • Status: ${response.status}`);
        console.log(`   • Response: ${JSON.stringify(response.data, null, 2)}`);
        
    } catch (error) {
        console.log('\n❌ Debug upload failed');
        console.log(`   • Status: ${error.response?.status}`);
        console.log(`   • Error: ${error.response?.data?.error || error.message}`);
        
        if (error.response?.data?.details) {
            console.log(`   • Details: ${error.response.data.details}`);
        }
    }
}

// Run test
testDebugUpload().catch(console.error);