// check-tables.js - Check table structures
const { pool } = require('./config/database');

async function checkTables() {
    try {
        console.log('Checking users table structure...');
        const [userRows] = await pool.execute('DESCRIBE users');
        console.log('Users table:');
        userRows.forEach(row => {
            console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        console.log('\nChecking employees table structure...');
        const [empRows] = await pool.execute('DESCRIBE employees');
        console.log('Employees table:');
        empRows.forEach(row => {
            console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        console.log('\nChecking leave_types table...');
        const [leaveRows] = await pool.execute('DESCRIBE leave_types');
        console.log('Leave_types table:');
        leaveRows.forEach(row => {
            console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkTables();