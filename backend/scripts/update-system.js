// scripts/update-system.js - System update script for backend improvements
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const updateSystem = async () => {
    console.log('🔄 Starting system update process...\n');

    try {
        // Step 1: Install new dependencies
        console.log('📦 Installing new dependencies...');
        try {
            execSync('npm install compression@^1.7.4', { stdio: 'inherit' });
            console.log('✅ Dependencies installed successfully');
        } catch (error) {
            console.warn('⚠️  Warning: Could not install dependencies automatically');
            console.log('Please run: npm install compression@^1.7.4');
        }

        // Step 2: Run database migration
        console.log('\n🗄️  Running database migration...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'employee_management_system',
            multipleStatements: true
        });

        // Read and execute migration
        const migrationPath = path.join(__dirname, 'add_soft_delete_migration.sql');
        const migration = await fs.readFile(migrationPath, 'utf8');
        
        await connection.query(migration);
        console.log('✅ Database migration completed successfully');
        
        // Step 3: Test database connection with new configuration
        console.log('\n🔍 Testing enhanced database connection...');
        await connection.execute('SELECT 1 as health_check');
        console.log('✅ Database connection test passed');
        
        await connection.end();

        console.log('\n🎉 System update completed successfully!');
        console.log('\n📋 What was updated:');
        console.log('• Enhanced database connection pooling with retry logic');
        console.log('• Added compression middleware for better performance');
        console.log('• Implemented standardized API responses');
        console.log('• Added request ID tracking for better debugging');
        console.log('• Fixed transaction handling bugs');
        console.log('• Added database schema improvements (indexes, constraints)');
        console.log('• Enhanced security with better password generation');
        console.log('• Improved graceful shutdown with pool cleanup');
        console.log('• Added comprehensive health check endpoint');
        
        console.log('\n🚀 Next steps:');
        console.log('1. Update your .env file with new configuration options');
        console.log('2. Restart your server to apply all changes');
        console.log('3. Monitor the enhanced /health endpoint for system status');
        console.log('4. Review logs for any connection pool issues');
        
        console.log('\n📊 New Environment Variables Available:');
        console.log('• DB_POOL_SIZE (default: 20)');
        console.log('• DB_SSL (default: false)');
        console.log('\n💡 For production, consider:');
        console.log('• Setting up Redis for session storage');
        console.log('• Enabling SSL for database connections');
        console.log('• Monitoring database pool usage via /health endpoint');
        
    } catch (error) {
        console.error('❌ System update failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Database access denied. Please check:');
            console.log('- MySQL credentials in .env file');
            console.log('- Database user privileges');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Cannot connect to database. Please check:');
            console.log('- MySQL server is running');
            console.log('- Host and port configuration');
        }
        
        process.exit(1);
    }
};

// Run update if called directly
if (require.main === module) {
    updateSystem();
}

module.exports = { updateSystem };