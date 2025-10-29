// Script to add deleted_at column to payroll_periods table
const { executeQuery } = require('../config/database');

async function addDeletedAtColumn() {
    try {
        console.log('Checking if deleted_at column exists...');
        
        // Check if column exists
        const checkResult = await executeQuery(
            "SHOW COLUMNS FROM payroll_periods LIKE 'deleted_at'"
        );
        
        if (checkResult.success && checkResult.data.length > 0) {
            console.log('✅ Column deleted_at already exists');
            return;
        }
        
        console.log('Adding deleted_at column...');
        
        // Add column
        const addColumnResult = await executeQuery(`
            ALTER TABLE payroll_periods
            ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL 
            COMMENT 'Timestamp when the period was soft deleted (only for Completed status)'
        `);
        
        if (!addColumnResult.success) {
            console.error('❌ Failed to add column:', addColumnResult.error);
            return;
        }
        
        console.log('✅ Column deleted_at added successfully');
        
        // Add index
        console.log('Adding index...');
        const addIndexResult = await executeQuery(`
            CREATE INDEX idx_payroll_periods_deleted_at ON payroll_periods(deleted_at)
        `);
        
        if (!addIndexResult.success) {
            console.log('⚠️  Index may already exist or failed to create:', addIndexResult.error);
        } else {
            console.log('✅ Index created successfully');
        }
        
        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

addDeletedAtColumn();
