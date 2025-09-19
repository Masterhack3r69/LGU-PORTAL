// Cleanup script to remove test allowance override
const axios = require('axios');

// Configuration
const BASE_URL = 'http://10.0.0.73:3000';
const ADMIN_CREDENTIALS = {
    username: 'deckson',
    password: 'admin123'
};

const TEST_EMPLOYEE_ID = 37;

// Create axios instance with session support
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function cleanupTest() {
    console.log('🧹 Starting Cleanup Test');
    console.log('========================');
    
    try {
        // Step 1: Login as admin
        console.log('🔐 Step 1: Authenticating as admin...');
        const loginResponse = await api.post('/api/auth/login', ADMIN_CREDENTIALS);
        
        if (loginResponse.status === 200) {
            console.log('✅ Login successful');
            
            // Extract session cookies if present
            if (loginResponse.headers['set-cookie']) {
                const cookies = loginResponse.headers['set-cookie'];
                api.defaults.headers.Cookie = cookies.join('; ');
                console.log('   Session cookies set');
            }
        } else {
            throw new Error('Login failed');
        }

        // Step 2: Get all overrides for the test employee
        console.log(`\n🔍 Step 2: Finding test overrides for employee ${TEST_EMPLOYEE_ID}...`);
        const overridesResponse = await api.get(`/api/payroll/employees/${TEST_EMPLOYEE_ID}/overrides`);
        
        if (overridesResponse.status === 200) {
            const overrides = overridesResponse.data.data;
            console.log(`✅ Found ${overrides.allowance_overrides.length} allowance overrides`);
            
            // Look for overrides with amount 5000 (our test override)
            const testOverrides = overrides.allowance_overrides.filter(
                override => override.override_amount === 5000
            );
            
            if (testOverrides.length > 0) {
                console.log(`✅ Found ${testOverrides.length} test override(s) to delete`);
                
                // Delete each test override
                for (const override of testOverrides) {
                    console.log(`\n🗑️  Deleting override ID: ${override.id}`);
                    try {
                        const deleteResponse = await api.delete(`/api/payroll/overrides/allowances/${override.id}`);
                        if (deleteResponse.status === 200) {
                            console.log(`✅ Override ${override.id} deleted successfully`);
                        } else {
                            console.log(`⚠️  Failed to delete override ${override.id}`);
                        }
                    } catch (deleteError) {
                        console.log(`⚠️  Error deleting override ${override.id}: ${deleteError.message}`);
                    }
                }
            } else {
                console.log('✅ No test overrides found to delete');
            }
        } else {
            throw new Error('Failed to fetch employee overrides');
        }

        console.log('\n🎉 Cleanup completed successfully!');
        console.log('========================');

    } catch (error) {
        console.error('\n❌ Cleanup failed:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Status Text: ${error.response.statusText}`);
            
            if (error.response.data) {
                console.error(`   Error Message: ${error.response.data.error || error.response.data.message || 'Unknown error'}`);
            }
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        console.error('========================');
        process.exit(1);
    }
}

// Run the cleanup
if (require.main === module) {
    cleanupTest().catch(console.error);
}

module.exports = { cleanupTest };