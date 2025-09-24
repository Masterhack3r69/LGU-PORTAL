// scripts/setup-compensation-benefits.js - Setup script for Compensation & Benefits module
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function setupCompensationBenefits() {
    try {
        console.log('🚀 Setting up Compensation & Benefits module...');

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'create_compensation_benefits_table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split SQL statements (simple split by semicolon)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`📝 Executing ${statements.length} SQL statements...`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim() === '') {
                continue;
            }

            try {
                console.log(`   ${i + 1}. Executing: ${statement.substring(0, 50)}...`);
                await pool.execute(statement);
            } catch (error) {
                // Skip errors for statements that might already exist (like CREATE TABLE IF NOT EXISTS)
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
                    console.log(`   ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
                } else {
                    console.error(`   ❌ Error executing statement: ${statement.substring(0, 50)}...`);
                    console.error(`      Error: ${error.message}`);
                }
            }
        }

        // Verify table creation
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'comp_benefit_records'
        `);

        if (rows[0].count > 0) {
            console.log('✅ comp_benefit_records table verified successfully');
        } else {
            throw new Error('Table creation verification failed');
        }

        // Check if view was created
        const [viewRows] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.views 
            WHERE table_schema = DATABASE() 
            AND table_name = 'v_compensation_benefits'
        `);

        if (viewRows[0].count > 0) {
            console.log('✅ v_compensation_benefits view verified successfully');
        } else {
            console.log('⚠️  View creation may have failed, but table setup is complete');
        }

        console.log('🎉 Compensation & Benefits module setup completed successfully!');
        console.log('');
        console.log('📋 Module Features:');
        console.log('   • Terminal Leave Benefit calculation');
        console.log('   • Leave Monetization with balance updates');
        console.log('   • Performance-Based Bonus (PBB)');
        console.log('   • 13th Month Bonus (Mid-Year)');
        console.log('   • 14th Month Bonus (Year-End)');
        console.log('   • Employee Compensation (EC) - manual input');
        console.log('   • GSIS contribution calculation');
        console.log('   • Loyalty Award calculation');
        console.log('   • Bulk processing capabilities');
        console.log('   • Comprehensive reporting and history');
        console.log('');
        console.log('🔗 API Endpoints available at: /api/compensation-benefits');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        throw error;
    }
}

// Run setup if called directly
if (require.main === module) {
    setupCompensationBenefits()
        .then(() => {
            console.log('Setup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupCompensationBenefits };