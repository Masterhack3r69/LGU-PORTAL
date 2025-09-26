  z// scripts/test-backup.js - Test backup functionality
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

async function testBackup() {
    try {
        console.log('🧪 Testing mysqldump command...');
        
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '3306',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'employee_management_system'
        };

        const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
        const testFile = path.join(__dirname, '../backups/test_backup.sql');

        const args = [
            `--host=${dbConfig.host}`,
            `--port=${dbConfig.port}`,
            `--user=${dbConfig.user}`,
            '--single-transaction',
            '--routines',
            '--triggers',
            '--add-drop-table',
            '--complete-insert',
            '--extended-insert',
            '--comments',
            '--skip-lock-tables',
            '--force',
            dbConfig.database
        ];

        // Set environment variables for MySQL password
        const env = {
            ...process.env,
            MYSQL_PWD: dbConfig.password
        };

        console.log('📋 Running mysqldump with args:', args.join(' '));

        const mysqldump = spawn(mysqldumpPath, args, { env });
        const fs = require('fs');
        const writeStream = fs.createWriteStream(testFile);

        mysqldump.stdout.pipe(writeStream);

        let errorOutput = '';
        mysqldump.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        mysqldump.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Test backup completed successfully');
                if (errorOutput && errorOutput.includes('Warning')) {
                    console.log('⚠️ Warnings:', errorOutput);
                }
                
                // Check file size
                const stats = fs.statSync(testFile);
                console.log(`📊 Backup file size: ${stats.size} bytes`);
                
                // Clean up test file
                fs.unlinkSync(testFile);
                console.log('🧹 Test file cleaned up');
            } else {
                console.error('❌ Test backup failed with code:', code);
                console.error('❌ Error output:', errorOutput);
            }
        });

        mysqldump.on('error', (error) => {
            console.error('❌ mysqldump process error:', error);
        });

    } catch (error) {
        console.error('❌ Test backup error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    testBackup();
}

module.exports = { testBackup };