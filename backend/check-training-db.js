/**
 * Database Table Check for Training System
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTrainingTables() {
    console.log('🔍 Checking Training System Database Tables...\n');
    
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'employee_management_system'
        });

        console.log('✅ Database connection successful');

        // Check if training_programs table exists
        console.log('\n📋 Checking training_programs table...');
        const [programsTableResult] = await connection.execute(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = ? AND table_name = 'training_programs'
        `, [process.env.DB_NAME || 'employee_management_system']);
        
        if (programsTableResult[0].count > 0) {
            console.log('✅ training_programs table exists');
            
            // Check data in table
            const [programsData] = await connection.execute('SELECT COUNT(*) as count FROM training_programs');
            console.log(`   Records: ${programsData[0].count}`);
        } else {
            console.log('❌ training_programs table does not exist');
        }

        // Check if employee_trainings table exists  
        console.log('\n📋 Checking employee_trainings table...');
        const [trainingsTableResult] = await connection.execute(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = ? AND table_name = 'employee_trainings'
        `, [process.env.DB_NAME || 'employee_management_system']);
        
        if (trainingsTableResult[0].count > 0) {
            console.log('✅ employee_trainings table exists');
            
            // Check data in table
            const [trainingsData] = await connection.execute('SELECT COUNT(*) as count FROM employee_trainings');
            console.log(`   Records: ${trainingsData[0].count}`);
        } else {
            console.log('❌ employee_trainings table does not exist');
        }

        // Check if employees table has data
        console.log('\n📋 Checking employees table...');
        const [employeesData] = await connection.execute('SELECT COUNT(*) as count FROM employees WHERE deleted_at IS NULL');
        console.log(`✅ Active employees: ${employeesData[0].count}`);

        // Check test users
        console.log('\n👥 Checking test users...');
        const [testUsers] = await connection.execute(`
            SELECT u.username, u.role, e.first_name, e.last_name, e.id as employee_id
            FROM users u 
            LEFT JOIN employees e ON u.id = e.user_id 
            WHERE u.username IN ('deckson', 'dave')
        `);
        
        testUsers.forEach(user => {
            console.log(`   ${user.username}: ${user.role} - ${user.first_name} ${user.last_name} (Employee ID: ${user.employee_id})`);
        });

        await connection.end();
        console.log('\n✅ Database check completed successfully');

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Check database credentials in .env file');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database does not exist - run setup script');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 MySQL server is not running');
        }
    }
}

if (require.main === module) {
    checkTrainingTables();
}