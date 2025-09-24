// Debug file upload to see exactly what's being received
const express = require('express');
const fileUpload = require('express-fileupload');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();

// Configure file upload middleware exactly like the main server
app.use(fileUpload({
    limits: { 
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
    },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: './uploads/temp/',
    safeFileNames: true,
    preserveExtension: true
}));

app.use(express.json());

// Debug endpoint
app.post('/debug-upload', (req, res) => {
    console.log('\n🔍 DEBUG: File upload received');
    console.log('='.repeat(50));
    
    // Check request details
    console.log('📋 Request Details:');
    console.log(`   • Content-Type: ${req.headers['content-type']}`);
    console.log(`   • Content-Length: ${req.headers['content-length']}`);
    console.log(`   • Method: ${req.method}`);
    
    // Check files
    console.log('\n📁 Files Object:');
    if (!req.files) {
        console.log('   ❌ No files object found');
        return res.status(400).json({ error: 'No files received' });
    }
    
    console.log(`   • Files keys: ${Object.keys(req.files)}`);
    
    if (!req.files.excel_file) {
        console.log('   ❌ No excel_file found');
        console.log(`   • Available files: ${Object.keys(req.files).join(', ')}`);
        return res.status(400).json({ error: 'No excel_file found' });
    }
    
    const file = req.files.excel_file;
    
    console.log('\n📄 File Details:');
    console.log(`   • Name: ${file.name}`);
    console.log(`   • Size: ${file.size} bytes`);
    console.log(`   • MIME Type: ${file.mimetype}`);
    console.log(`   • MD5: ${file.md5}`);
    console.log(`   • Data buffer length: ${file.data ? file.data.length : 'No data buffer'}`);
    console.log(`   • Temp file path: ${file.tempFilePath || 'No temp file'}`);
    
    // Try to process the Excel file
    try {
        console.log('\n📊 Excel Processing:');
        
        // Method 1: Try with data buffer
        if (file.data) {
            console.log('   • Trying with data buffer...');
            const workbook1 = XLSX.read(file.data, { type: 'buffer' });
            console.log(`   ✅ Buffer method worked! Sheets: ${workbook1.SheetNames.join(', ')}`);
            
            const worksheet = workbook1.Sheets[workbook1.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            console.log(`   • Rows found: ${jsonData.length}`);
            console.log(`   • Headers: ${JSON.stringify(jsonData[0])}`);
            if (jsonData.length > 1) {
                console.log(`   • First data row: ${JSON.stringify(jsonData[1])}`);
            }
        }
        
        // Method 2: Try with temp file path
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
            console.log('   • Trying with temp file...');
            const workbook2 = XLSX.readFile(file.tempFilePath);
            console.log(`   ✅ Temp file method worked! Sheets: ${workbook2.SheetNames.join(', ')}`);
        }
        
        res.json({
            success: true,
            message: 'File processed successfully',
            file: {
                name: file.name,
                size: file.size,
                mimetype: file.mimetype,
                hasData: !!file.data,
                hasTempFile: !!file.tempFilePath
            }
        });
        
    } catch (error) {
        console.log(`   ❌ Excel processing failed: ${error.message}`);
        console.log(`   • Stack: ${error.stack}`);
        
        res.status(400).json({
            error: 'Failed to process Excel file',
            details: error.message
        });
    }
});

// Start debug server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🧪 Debug server running on port ${PORT}`);
    console.log(`📤 Test endpoint: POST http://localhost:${PORT}/debug-upload`);
    console.log('Use form field name: excel_file');
    console.log('\nTo test, run the debug client script...');
});

// Export for testing
module.exports = app;