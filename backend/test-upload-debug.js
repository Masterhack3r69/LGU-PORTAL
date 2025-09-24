// Test script to debug file upload
const express = require('express');
const fileUpload = require('express-fileupload');
const XLSX = require('xlsx');

const app = express();

// Configure file upload middleware
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    useTempFiles: true,
    tempFileDir: './uploads/temp/',
    createParentPath: true
}));

// Test endpoint
app.post('/test-upload', (req, res) => {
    console.log('📁 Files received:', Object.keys(req.files || {}));
    console.log('📋 Body:', req.body);
    
    if (!req.files || !req.files.excel_file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.files.excel_file;
    console.log('📄 File details:');
    console.log('- Name:', file.name);
    console.log('- Size:', file.size);
    console.log('- MIME type:', file.mimetype);
    console.log('- Data length:', file.data ? file.data.length : 'No data');
    
    try {
        // Try to read the Excel file
        const workbook = XLSX.read(file.data, { type: 'buffer' });
        console.log('📊 Workbook sheets:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('📋 JSON data:');
        console.log('- Total rows:', jsonData.length);
        console.log('- First few rows:', jsonData.slice(0, 3));
        
        res.json({
            success: true,
            file: {
                name: file.name,
                size: file.size,
                mimetype: file.mimetype
            },
            excel: {
                sheets: workbook.SheetNames,
                totalRows: jsonData.length,
                headers: jsonData[0],
                sampleData: jsonData.slice(1, 3)
            }
        });
        
    } catch (error) {
        console.error('❌ Error processing Excel:', error.message);
        res.status(400).json({ 
            error: 'Failed to process Excel file',
            details: error.message 
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log(`📤 Test upload endpoint: POST http://localhost:${PORT}/test-upload`);
    console.log('Use form field name: excel_file');
});