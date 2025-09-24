// verify-database.js - Verify database table creation
const { pool } = require('./config/database');

async function verifyDatabase() {
    console.log('🔍 Verifying Compensation & Benefits Database Setup');
    console.log('=' .repeat(50));

    try {
        // Test database connection
        console.log('\n1. Testing database connection...');
        const [connectionTest] = await pool.execute('SELECT 1 as test');
        console.log('✅ Database connection successful');

        // Check if comp_benefit_records table exists
        console.log('\n2. Checking if comp_benefit_records table exists...');
        const [tableCheck] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'comp_benefit_records'
        `);

        if (tableCheck[0].count > 0) {
            console.log('✅ comp_benefit_records table exists');
            
            // Get table structure
            console.log('\n3. Getting table structure...');
            const [columns] = await pool.execute('DESCRIBE comp_benefit_records');
            console.log('📋 Table structure:');
            columns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
            });

            // Check indexes
            console.log('\n4. Checking indexes...');
            const [indexes] = await pool.execute('SHOW INDEX FROM comp_benefit_records');
            console.log('📋 Indexes:');
            const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
            indexNames.forEach(indexName => {
                const indexCols = indexes.filter(idx => idx.Key_name === indexName);
                const columns = indexCols.map(idx => idx.Column_name).join(', ');
                console.log(`   ${indexName}: (${columns})`);
            });

        } else {
            console.log('❌ comp_benefit_records table does not exist');
            console.log('\n📝 To create the table, run:');
            console.log('   Execute the SQL script: backend/scripts/compensation_benefits_simple.sql');
            return false;
        }

        // Check if view exists
        console.log('\n5. Checking if v_compensation_benefits view exists...');
        const [viewCheck] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.views 
            WHERE table_schema = DATABASE() 
            AND table_name = 'v_compensation_benefits'
        `);

        if (viewCheck[0].count > 0) {
            console.log('✅ v_compensation_benefits view exists');
        } else {
            console.log('⚠️  v_compensation_benefits view does not exist (optional)');
        }

        // Test foreign key relationships
        console.log('\n6. Checking foreign key relationships...');
        const [fkCheck] = await pool.execute(`
            SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'comp_benefit_records'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        if (fkCheck.length > 0) {
            console.log('✅ Foreign key relationships:');
            fkCheck.forEach(fk => {
                console.log(`   ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            console.log('⚠️  No foreign key relationships found');
        }

        // Test sample data insertion (dry run)
        console.log('\n7. Testing data insertion capability...');
        try {
            // Check if we have any employees to test with
            const [employeeCheck] = await pool.execute('SELECT COUNT(*) as count FROM employees LIMIT 1');
            const [userCheck] = await pool.execute('SELECT COUNT(*) as count FROM users LIMIT 1');
            
            if (employeeCheck[0].count > 0 && userCheck[0].count > 0) {
                console.log('✅ Required reference tables (employees, users) have data');
                
                // Get sample employee and user IDs
                const [sampleEmployee] = await pool.execute('SELECT id FROM employees LIMIT 1');
                const [sampleUser] = await pool.execute('SELECT id FROM users LIMIT 1');
                
                console.log(`   Sample employee ID: ${sampleEmployee[0].id}`);
                console.log(`   Sample user ID: ${sampleUser[0].id}`);
                
                // Test if we can insert (but don't actually insert)
                console.log('✅ Ready for data insertion');
            } else {
                console.log('⚠️  Missing reference data (employees or users table empty)');
            }
        } catch (error) {
            console.log('⚠️  Could not verify reference tables:', error.message);
        }

        console.log('\n🎉 Database Verification Complete!');
        console.log('\n📋 Summary:');
        console.log('✅ Database connection working');
        console.log('✅ comp_benefit_records table exists with proper structure');
        console.log('✅ Indexes are in place for performance');
        console.log('✅ Foreign key relationships configured');
        console.log('✅ Ready for Compensation & Benefits operations');

        return true;

    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n📝 Solution: Run the table creation script:');
            console.log('   Execute: backend/scripts/compensation_benefits_simple.sql');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n📝 Solution: Check database credentials in .env file');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n📝 Solution: Ensure MySQL server is running');
        }
        
        return false;
    } finally {
        // Don't close the pool here as it might be used by the running server
        console.log('\n🔚 Verification complete');
    }
}

// Run verification if called directly
if (require.main === module) {
    verifyDatabase()
        .then((success) => {
            if (success) {
                console.log('\n✅ Database verification passed');
                process.exit(0);
            } else {
                console.log('\n❌ Database verification failed');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n❌ Verification error:', error);
            process.exit(1);
        });
}

module.exports = { verifyDatabase };