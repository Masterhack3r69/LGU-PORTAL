// Inspect the sample file to see if there's an issue with it
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function inspectFile(filePath) {
    console.log(`🔍 Inspecting: ${path.basename(filePath)}`);
    console.log('='.repeat(50));
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ File does not exist');
        return false;
    }
    
    const stats = fs.statSync(filePath);
    console.log(`📄 File Stats:`);
    console.log(`   • Size: ${stats.size} bytes`);
    console.log(`   • Modified: ${stats.mtime}`);
    console.log(`   • Is file: ${stats.isFile()}`);
    
    try {
        // Read as buffer (like the controller does)
        const buffer = fs.readFileSync(filePath);
        console.log(`   • Buffer length: ${buffer.length} bytes`);
        
        // Try to read with XLSX
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        console.log(`\n📊 Excel Analysis:`);
        console.log(`   • Sheets: ${workbook.SheetNames.join(', ')}`);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`   • Total rows: ${jsonData.length}`);
        
        if (jsonData.length === 0) {
            console.log('   ❌ No data found in worksheet');
            return false;
        }
        
        console.log(`   • Headers: ${JSON.stringify(jsonData[0])}`);
        
        if (jsonData.length < 2) {
            console.log('   ❌ No data rows found (only headers)');
            return false;
        }
        
        console.log(`   • Data rows: ${jsonData.length - 1}`);
        console.log(`   • First data row: ${JSON.stringify(jsonData[1])}`);
        
        // Check if this would pass the controller validation
        if (jsonData.length >= 2) {
            console.log(`\n✅ File structure is valid for import`);
            console.log(`   • Has header row: Yes`);
            console.log(`   • Has data rows: ${jsonData.length - 1}`);
            return true;
        } else {
            console.log(`\n❌ File structure is invalid`);
            return false;
        }
        
    } catch (error) {
        console.log(`\n❌ Error reading file: ${error.message}`);
        console.log(`   • Stack: ${error.stack}`);
        return false;
    }
}

function inspectAllSamples() {
    console.log('🚀 Inspecting all sample files...\n');
    
    const files = [
        'employee_import_sample.xlsx',
        'employee_import_minimal.xlsx',
        'employee_import_alternative_headers.xlsx',
        'employee_import_invalid_sample.xlsx'
    ];
    
    let validCount = 0;
    
    files.forEach((fileName, index) => {
        const filePath = path.join(__dirname, fileName);
        const isValid = inspectFile(filePath);
        
        if (isValid) validCount++;
        
        if (index < files.length - 1) {
            console.log('\n');
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary: ${validCount}/${files.length} files are structurally valid`);
    
    if (validCount === files.length) {
        console.log('🎉 All sample files have correct structure!');
        console.log('📋 The issue is likely with file upload or processing, not the files themselves');
    } else {
        console.log('⚠️  Some files have structural issues');
    }
}

// Run inspection
inspectAllSamples();