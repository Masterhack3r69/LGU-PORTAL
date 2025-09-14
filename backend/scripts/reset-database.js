// scripts/reset-database.js - Clean database and create fresh admin account
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetDatabase = async () => {
    console.log('🔄 Resetting database and creating fresh admin account...\n');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'employee_management_system'
        });

        console.log('✅ Connected to database');

        // Start transaction
        await connection.beginTransaction();

        try {
            // Delete all audit logs first (references users)
            console.log('🗑️ Deleting audit logs...');
            await connection.execute('DELETE FROM audit_logs');
            
            // Delete all system settings (references users)
            console.log('🗑️ Deleting system settings...');
            await connection.execute('DELETE FROM system_settings');
            
            // Delete all payroll periods (references users)
            console.log('🗑️ Deleting payroll periods...');
            await connection.execute('DELETE FROM payroll_periods');
            
            // Delete all leave balances first (due to foreign key constraints)
            console.log('🗑️ Deleting leave balances...');
            await connection.execute('DELETE FROM employee_leave_balances');
            
            // Delete all leave applications
            console.log('🗑️ Deleting leave applications...');
            await connection.execute('DELETE FROM leave_applications');
            
            // Delete all service records
            console.log('🗑️ Deleting service records...');
            await connection.execute('DELETE FROM service_records');
            
            // Delete all employee documents
            console.log('🗑️ Deleting employee documents...');
            await connection.execute('DELETE FROM employee_documents');
            
            // Delete all employee education records
            console.log('🗑️ Deleting employee education records...');
            await connection.execute('DELETE FROM employee_education');
            
            // Delete all employee eligibility records
            console.log('🗑️ Deleting employee eligibility records...');
            await connection.execute('DELETE FROM employee_eligibility');
            
            // Delete all employee trainings
            console.log('🗑️ Deleting employee trainings...');
            await connection.execute('DELETE FROM employee_trainings');
            
            // Delete all employee compensation records
            console.log('🗑️ Deleting employee compensation records...');
            await connection.execute('DELETE FROM employee_compensation');
            
            // Delete all payroll items
            console.log('🗑️ Deleting payroll items...');
            await connection.execute('DELETE FROM payroll_items');
            
            // Delete all terminal leave benefits
            console.log('🗑️ Deleting terminal leave benefits...');
            await connection.execute('DELETE FROM terminal_leave_benefits');
            
            // Delete all employees
            console.log('🗑️ Deleting all employees...');
            await connection.execute('DELETE FROM employees');
            
            // Delete all users
            console.log('🗑️ Deleting all users...');
            await connection.execute('DELETE FROM users');
            
            // Reset auto-increment counters
            console.log('🔄 Resetting auto-increment counters...');
            await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
            await connection.execute('ALTER TABLE employees AUTO_INCREMENT = 1');
            await connection.execute('ALTER TABLE employee_leave_balances AUTO_INCREMENT = 1');
            await connection.execute('ALTER TABLE leave_applications AUTO_INCREMENT = 1');

            // Create fresh admin account
            console.log('👤 Creating fresh admin account...');
            
            const adminUsername = 'admin';
            const adminEmail = 'admin@company.com';
            const adminPassword = 'Admin@123';
            const passwordHash = await bcrypt.hash(adminPassword, 12);

            const [userResult] = await connection.execute(
                'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
                [adminUsername, adminEmail, passwordHash, 'admin', 1]
            );

            console.log('✅ Admin account created successfully');
            console.log(`   ID: ${userResult.insertId}`);
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
            console.log(`   Role: admin`);

            // Commit transaction
            await connection.commit();
            console.log('\n🎉 Database reset completed successfully!');
            
            console.log('\n📋 Fresh Admin Account:');
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('   ⚠️  Please change the default password after first login!');

        } catch (error) {
            await connection.rollback();
            throw error;
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        process.exit(1);
    }
};

// Run reset if called directly
if (require.main === module) {
    resetDatabase();
}

module.exports = { resetDatabase };