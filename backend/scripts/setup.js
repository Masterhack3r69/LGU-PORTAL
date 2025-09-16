// scripts/setup.js - Database and initial data setup script
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
    console.log('🚀 Starting Employee Management System Setup...\n');

    try {
        // Create connection without database selection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL server');

        // Read and execute schema file
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        console.log('📊 Creating database and tables...');
        await connection.query(schema);
        console.log('✅ Database schema created successfully');

        // Create default admin user
        console.log('👤 Creating default admin user...');
        
        const adminUsername = 'admin';
        const adminEmail = 'admin@company.com';
        const adminPassword = 'Admin@123'; // Change this in production
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        await connection.query(`
            USE ${process.env.DB_NAME || 'employee_management_system'}
        `);

        // Check if admin user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [adminUsername, adminEmail]
        );

        if (existingUsers.length === 0) {
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [adminUsername, adminEmail, passwordHash, 'admin']
            );
            console.log('✅ Default admin user created');
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('   ⚠️  Please change the default password after first login!');
        } else {
            console.log('ℹ️  Admin user already exists, skipping creation');
        }

        // Insert system settings now that admin user exists
        console.log('⚙️ Configuring system settings...');
        const systemSettings = [
            ['annual_vl_credit', '15', 'Annual vacation leave credits'],
            ['annual_sl_credit', '15', 'Annual sick leave credits'],
            ['monthly_vl_accrual', '1.25', 'Monthly VL accrual rate'],
            ['monthly_sl_accrual', '1.25', 'Monthly SL accrual rate'],
            ['tlb_constant_factor', '1.00', 'Terminal Leave Benefits calculation factor'],
            ['max_monetizable_days', '29', 'Maximum days for leave monetization without clearance'],
            ['loyalty_award_10_years', '10000', 'Loyalty award amount for first 10 years'],
            ['loyalty_award_5_years', '5000', 'Loyalty award amount for every 5 years after 10']
        ];

        for (const [key, value, description] of systemSettings) {
            const [existingSetting] = await connection.execute(
                'SELECT id FROM system_settings WHERE setting_key = ?',
                [key]
            );

            if (existingSetting.length === 0) {
                await connection.execute(
                    'INSERT INTO system_settings (setting_key, setting_value, description, updated_by) VALUES (?, ?, ?, ?)',
                    [key, value, description, 1]
                );
            }
        }
        console.log('✅ System settings configured');

        // Setup compensation types for leave monetization
        console.log('💰 Setting up compensation types...');
        const compensationTypes = [
            ['PBB', 'Performance-Based Bonus', 'Annual performance-based bonus for eligible employees', 1, 'Fixed'],
            ['MYB', '13th Month Pay', 'Mid-year bonus equivalent to one month salary', 1, 'Formula'],
            ['YEB', '14th Month Pay', 'Year-end bonus equivalent to one month salary', 1, 'Formula'],
            ['LA', 'Loyalty Award', 'Award for long-term service milestones', 0, 'Formula'],
            ['RATA', 'Representation Allowance', 'Representation and Transportation Allowance', 0, 'Fixed'],
            ['CA', 'Clothing Allowance', 'Annual clothing allowance', 0, 'Fixed'],
            ['MA', 'Medical Allowance', 'Medical/Health allowance', 0, 'Fixed'],
            ['HA', 'Hazard Allowance', 'Hazard pay for risky work conditions', 1, 'Fixed'],
            ['SL', 'Subsistence & Laundry', 'Subsistence and laundry allowance', 0, 'Fixed'],
            ['VLM', 'Vacation Leave Monetization', 'Monetization of unused vacation leave credits', 1, 'Formula'],
            ['SLM', 'Sick Leave Monetization', 'Monetization of unused sick leave credits', 1, 'Formula']
        ];

        for (const [code, name, description, is_taxable, calculation_method] of compensationTypes) {
            const [existingType] = await connection.execute(
                'SELECT id FROM compensation_types WHERE code = ?',
                [code]
            );

            if (existingType.length === 0) {
                await connection.execute(
                    'INSERT INTO compensation_types (code, name, description, is_taxable, calculation_method) VALUES (?, ?, ?, ?, ?)',
                    [code, name, description, is_taxable, calculation_method]
                );
                console.log(`   ✅ Created compensation type: ${name} (${code})`);
            } else {
                console.log(`   ℹ️  Compensation type ${code} already exists`);
            }
        }

        // Create upload directories
        console.log('📁 Creating upload directories...');
        const uploadDirs = [
            './uploads',
            './uploads/employees',
            './uploads/temp',
            './logs'
        ];

        for (const dir of uploadDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`   ✅ Created ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.log(`   ⚠️  Warning: Could not create ${dir}`);
                }
            }
        }

        await connection.end();

        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Copy .env.example to .env and configure your settings');
        console.log('2. Update the default admin password');
        console.log('3. Start the server with: npm run dev');
        console.log('4. Access the application at: http://localhost:3000');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Tips:');
            console.log('- Check your MySQL credentials in .env file');
            console.log('- Make sure MySQL server is running');
            console.log('- Verify the database user has necessary privileges');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Tips:');
            console.log('- Make sure MySQL server is running');
            console.log('- Check the host and port configuration');
        }
        
        process.exit(1);
    }
};

// Run setup if called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };