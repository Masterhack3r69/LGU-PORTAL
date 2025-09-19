// Script to execute payroll schema creation
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function executePayrollSchema() {
    try {
        console.log('🔄 Starting payroll schema creation...');
        
        // Test database connection
        await pool.execute('SELECT 1 as test');
        console.log('✅ Database connection successful');
        
        // Execute schema creation
        const schemaPath = path.join(__dirname, 'payroll_schema_clean.sql');
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Split into individual CREATE TABLE statements
        const statements = sqlContent
            .split('-- ')  // Split by comment lines that separate tables
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.includes('CREATE TABLE'));
        
        console.log(`📝 Found ${statements.length} table creation statements`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await pool.execute(statement);
                console.log(`✅ Table ${i + 1}/${statements.length} created successfully`);
            } catch (error) {
                console.log(`⚠️  Table ${i + 1} creation failed: ${error.message.substring(0, 100)}`);
            }
        }
        
        // Insert default data
        const defaultDataPath = path.join(__dirname, 'payroll_default_data.sql');
        const defaultDataSql = fs.readFileSync(defaultDataPath, 'utf8');
        
        const insertStatements = defaultDataSql
            .split('INSERT IGNORE')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)
            .map(stmt => 'INSERT IGNORE' + stmt);
        
        console.log(`📝 Inserting ${insertStatements.length} default data sets`);
        
        for (let i = 0; i < insertStatements.length; i++) {
            const statement = insertStatements[i];
            if (statement.includes('INSERT IGNORE')) {
                try {
                    await pool.execute(statement);
                    console.log(`✅ Default data set ${i + 1} inserted successfully`);
                } catch (error) {
                    console.log(`⚠️  Default data ${i + 1} failed: ${error.message.substring(0, 100)}`);
                }
            }
        }
        
        // Verify tables were created
        const [tables] = await pool.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'employee_management_system' 
            AND (TABLE_NAME LIKE 'payroll_%' OR TABLE_NAME LIKE '%allowance%' OR TABLE_NAME LIKE '%deduction%')
            ORDER BY TABLE_NAME
        `);
        
        console.log('📊 Created payroll tables:');
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        console.log('🎉 Payroll schema creation completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Failed to create payroll schema:', error.message);
        process.exit(1);
    }
}

executePayrollSchema();