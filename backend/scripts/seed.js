// scripts/seed.js - Sample data seeding script
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sampleEmployees = [
    {
        username: 'jdoe',
        email: 'john.doe@company.com',
        first_name: 'John',
        middle_name: 'Michael',
        last_name: 'Doe',
        sex: 'Male',
        birth_date: '1985-06-15',
        appointment_date: '2020-01-15',
        employee_number: 'EMP20200001',
        plantilla_position: 'Administrative Officer I',
        salary_grade: 18
    },
    {
        username: 'msmith',
        email: 'mary.smith@company.com',
        first_name: 'Mary',
        middle_name: 'Jane',
        last_name: 'Smith',
        sex: 'Female',
        birth_date: '1990-03-22',
        appointment_date: '2021-03-01',
        employee_number: 'EMP20210001',
        plantilla_position: 'Administrative Assistant II',
        salary_grade: 15
    },
    {
        username: 'rjohnson',
        email: 'robert.johnson@company.com',
        first_name: 'Robert',
        middle_name: 'Lee',
        last_name: 'Johnson',
        sex: 'Male',
        birth_date: '1982-11-08',
        appointment_date: '2019-05-20',
        employee_number: 'EMP20190001',
        plantilla_position: 'Senior Administrative Officer',
        salary_grade: 22
    }
];

const seedDatabase = async () => {
    console.log('🌱 Starting database seeding...\n');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'employee_management_system'
        });

        console.log('✅ Connected to database');

        // Check if employees already exist
        const [existingEmployees] = await connection.execute('SELECT COUNT(*) as count FROM employees');
        
        if (existingEmployees[0].count > 0) {
            console.log('ℹ️  Database already contains employee data');
            const answer = await askQuestion('Do you want to continue seeding? This will add more test data. (y/N): ');
            if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                console.log('Seeding cancelled');
                await connection.end();
                return;
            }
        }

        console.log('👥 Creating sample employees...');

        // Start transaction
        await connection.beginTransaction();

        try {
            for (const empData of sampleEmployees) {
                // Check if user already exists
                const [existingUser] = await connection.execute(
                    'SELECT id FROM users WHERE username = ? OR email = ?',
                    [empData.username, empData.email]
                );

                let userId;

                if (existingUser.length === 0) {
                    // Create user account
                    const defaultPassword = 'Employee@123'; // Default password for all sample employees
                    const passwordHash = await bcrypt.hash(defaultPassword, 12);

                    const [userResult] = await connection.execute(
                        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                        [empData.username, empData.email, passwordHash, 'employee']
                    );

                    userId = userResult.insertId;
                    console.log(`   ✅ Created user: ${empData.username}`);
                } else {
                    userId = existingUser[0].id;
                    console.log(`   ℹ️  User ${empData.username} already exists`);
                }

                // Check if employee record exists
                const [existingEmployee] = await connection.execute(
                    'SELECT id FROM employees WHERE user_id = ? OR employee_number = ?',
                    [userId, empData.employee_number]
                );

                if (existingEmployee.length === 0) {
                    // Create employee record
                    await connection.execute(`
                        INSERT INTO employees (
                            user_id, employee_number, first_name, middle_name, last_name,
                            sex, birth_date, appointment_date, plantilla_position,
                            salary_grade, current_monthly_salary, current_daily_rate,
                            highest_monthly_salary, highest_daily_rate
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        userId, empData.employee_number, empData.first_name, empData.middle_name,
                        empData.last_name, empData.sex, empData.birth_date, empData.appointment_date,
                        empData.plantilla_position, empData.salary_grade, empData.current_monthly_salary,
                        Math.round((empData.current_monthly_salary / 22) * 100) / 100, // Calculate daily rate
                        empData.current_monthly_salary, // highest monthly = current for new employees
                        Math.round((empData.current_monthly_salary / 22) * 100) / 100  // highest daily = current for new employees
                    ]);

                    console.log(`   ✅ Created employee: ${empData.first_name} ${empData.last_name}`);
                } else {
                    console.log(`   ℹ️  Employee ${empData.first_name} ${empData.last_name} already exists`);
                }
            }

            // Initialize leave balances for current year
            console.log('📅 Initializing leave balances...');
            const currentYear = new Date().getFullYear();

            const [employees] = await connection.execute('SELECT id FROM employees');
            const [leaveTypes] = await connection.execute('SELECT id, max_days_per_year FROM leave_types');

            for (const employee of employees) {
                for (const leaveType of leaveTypes) {
                    const earnedDays = leaveType.max_days_per_year || 0;
                    
                    // Only create balance for leave types that have max days defined
                    if (leaveType.max_days_per_year && leaveType.max_days_per_year > 0) {
                        // Check if balance already exists
                        const [existingBalance] = await connection.execute(
                            'SELECT id FROM employee_leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
                            [employee.id, leaveType.id, currentYear]
                        );

                        if (existingBalance.length === 0) {
                            await connection.execute(`
                                INSERT INTO employee_leave_balances 
                                (employee_id, leave_type_id, year, earned_days, current_balance)
                                VALUES (?, ?, ?, ?, ?)
                            `, [employee.id, leaveType.id, currentYear, earnedDays, earnedDays]);
                        }
                    }
                }
            }

            console.log('✅ Leave balances initialized');

            // Commit transaction
            await connection.commit();
            console.log('\n🎉 Database seeding completed successfully!');

            console.log('\n📋 Sample user accounts created:');
            console.log('Username: admin, Password: Admin@123 (Administrator)');
            for (const emp of sampleEmployees) {
                console.log(`Username: ${emp.username}, Password: Employee@123 (Employee)`);
            }
            console.log('\n⚠️  Please change all default passwords in production!');

        } catch (error) {
            await connection.rollback();
            throw error;
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

// Helper function to get user input (for Node.js environments)
const askQuestion = (question) => {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

// Run seeding if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };