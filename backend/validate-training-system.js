/**
 * Training System Pre-Test Validation
 * Checks if the system is ready for testing
 */

const axios = require('axios');
const colors = require('colors');

const config = {
    baseURL: 'http://localhost:3000',
    adminCredentials: { username: 'deckson', password: 'admin123' },
    employeeCredentials: { username: 'dave', password: 'emp123' }
};

const log = {
    info: (msg) => console.log('ℹ️ '.blue + msg),
    success: (msg) => console.log('✅ '.green + msg.green),
    error: (msg) => console.log('❌ '.red + msg.red),
    warning: (msg) => console.log('⚠️ '.yellow + msg.yellow)
};

async function validateSystem() {
    console.log('\n🔍 TRAINING SYSTEM PRE-TEST VALIDATION'.cyan.bold);
    console.log('Checking system readiness...\n');

    let allChecksPass = true;

    try {
        // 1. Check server health
        log.info('Checking server health...');
        const healthResponse = await axios.get(`${config.baseURL}/health`);
        if (healthResponse.status === 200) {
            log.success('Server is running and healthy');
            console.log(`   Uptime: ${Math.floor(healthResponse.data.uptime)}s`);
            console.log(`   Database: ${healthResponse.data.database.status}`);
        }
    } catch (error) {
        log.error('Server health check failed - is the server running?');
        allChecksPass = false;
    }

    try {
        // 2. Check admin login
        log.info('Validating admin credentials...');
        const adminLogin = await axios.post(`${config.baseURL}/api/auth/login`, config.adminCredentials);
        if (adminLogin.data.success && adminLogin.data.user.role === 'admin') {
            log.success(`Admin login successful: ${adminLogin.data.user.first_name} ${adminLogin.data.user.last_name}`);
        } else {
            log.error('Admin login successful but user is not admin');
            allChecksPass = false;
        }
    } catch (error) {
        log.error('Admin login failed - check credentials');
        allChecksPass = false;
    }

    try {
        // 3. Check employee login
        log.info('Validating employee credentials...');
        const employeeLogin = await axios.post(`${config.baseURL}/api/auth/login`, config.employeeCredentials);
        if (employeeLogin.data.success) {
            log.success(`Employee login successful: ${employeeLogin.data.user.first_name} ${employeeLogin.data.user.last_name}`);
        } else {
            log.error('Employee login failed');
            allChecksPass = false;
        }
    } catch (error) {
        log.error('Employee login failed - check credentials');
        allChecksPass = false;
    }

    try {
        // 4. Check database tables exist
        log.info('Checking training system endpoints...');
        const adminLogin = await axios.post(`${config.baseURL}/api/auth/login`, config.adminCredentials);
        const sessionCookie = adminLogin.headers['set-cookie']?.[0];
        
        const client = axios.create({
            baseURL: `${config.baseURL}/api`,
            headers: { 'Cookie': sessionCookie }
        });

        // Check training programs endpoint
        const programsResponse = await client.get('/training-programs');
        if (programsResponse.data.success) {
            log.success('Training programs endpoint accessible');
        }

        // Check trainings endpoint
        const trainingsResponse = await client.get('/trainings');
        if (trainingsResponse.data.success) {
            log.success('Training records endpoint accessible');
        }

    } catch (error) {
        log.error('Training endpoints check failed');
        allChecksPass = false;
    }

    // Final result
    console.log('\n' + '='.repeat(50));
    if (allChecksPass) {
        log.success('🎉 System validation passed! Ready for training tests.');
        console.log('\nYou can now run:');
        console.log('  npm run test:training-quick'.yellow);
        console.log('  npm run test:training-live'.yellow);
    } else {
        log.error('❌ System validation failed! Please fix issues before testing.');
        console.log('\nCommon fixes:');
        console.log('  1. Start the server: npm run dev');
        console.log('  2. Check database connection');
        console.log('  3. Verify test account credentials');
    }
    console.log('='.repeat(50));
}

if (require.main === module) {
    validateSystem().catch(error => {
        log.error('Validation error: ' + error.message);
        process.exit(1);
    });
}