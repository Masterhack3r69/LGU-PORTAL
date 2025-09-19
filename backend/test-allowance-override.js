// Test script for creating allowance override
// Employee: Mikey (ID: 37)
// Allowance Type: Overtime Pay (ID: 5)
// Admin: deckson / admin123

const axios = require('axios');

// Configuration
const BASE_URL = 'http://10.0.0.73:3000';
const ADMIN_CREDENTIALS = {
    username: 'deckson',
    password: 'admin123'
};

// Get today's date and future dates
const today = new Date();
const effectiveDate = new Date(today);
effectiveDate.setDate(today.getDate() + 1); // Tomorrow
const endDate = new Date(today);
endDate.setMonth(today.getMonth() + 3); // 3 months from now

const TEST_DATA = {
    employee_id: 37,
    allowance_type_id: 5,
    override_amount: 5000.00,
    effective_date: effectiveDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    end_date: endDate.toISOString().split('T')[0],
    reason: 'Performance bonus - overtime pay increase',
    is_active: true
};

// Create axios instance with session support
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function runTest() {
    console.log('🧪 Starting Allowance Override Test');
    console.log('=====================================');
    
    try {
        // Step 1: Login as admin
        console.log('🔐 Step 1: Authenticating as admin...');
        const loginResponse = await api.post('/api/auth/login', ADMIN_CREDENTIALS);
        
        if (loginResponse.status === 200) {
            console.log('✅ Login successful');
            if (loginResponse.data && loginResponse.data.data && loginResponse.data.data.user) {
                console.log(`   User: ${loginResponse.data.data.user.username}`);
                console.log(`   Role: ${loginResponse.data.data.user.role}`);
            } else {
                console.log('   Login response received, checking session...');
            }
            
            // Extract session cookies if present
            if (loginResponse.headers['set-cookie']) {
                const cookies = loginResponse.headers['set-cookie'];
                api.defaults.headers.Cookie = cookies.join('; ');
                console.log('   Session cookies set');
            }
        } else {
            throw new Error('Login failed');
        }

        // Step 1.5: Verify session
        console.log('\n🔑 Step 1.5: Verifying session...');
        const sessionResponse = await api.get('/api/auth/check-session');
        
        if (sessionResponse.status === 200) {
            console.log('✅ Session verified');
        } else {
            throw new Error('Session verification failed');
        }

        // Step 2: Verify employee exists
        console.log('\n👤 Step 2: Verifying employee exists...');
        const employeeResponse = await api.get(`/api/employees/${TEST_DATA.employee_id}`);
        
        if (employeeResponse.status === 200) {
            const employee = employeeResponse.data.data;
            console.log('✅ Employee found:');
            console.log(`   ID: ${employee.id}`);
            console.log(`   Name: ${employee.first_name} ${employee.last_name}`);
            console.log(`   Employee Number: ${employee.employee_number}`);
        } else {
            throw new Error('Employee not found');
        }

        // Step 3: Verify allowance type exists
        console.log('\n💰 Step 3: Verifying allowance type exists...');
        const allowanceTypesResponse = await api.get('/api/payroll/allowance-types');
        
        if (allowanceTypesResponse.status === 200) {
            const allowanceTypes = allowanceTypesResponse.data.data.allowance_types;
            const overtimeAllowance = allowanceTypes.find(type => type.id === TEST_DATA.allowance_type_id);
            
            if (overtimeAllowance) {
                console.log('✅ Allowance type found:');
                console.log(`   ID: ${overtimeAllowance.id}`);
                console.log(`   Name: ${overtimeAllowance.name}`);
                console.log(`   Type: ${overtimeAllowance.calculation_type}`);
                console.log(`   Active: ${overtimeAllowance.is_active}`);
            } else {
                throw new Error(`Allowance type with ID ${TEST_DATA.allowance_type_id} not found`);
            }
        } else {
            throw new Error('Failed to fetch allowance types');
        }

        // Step 4: Check existing overrides
        console.log('\n📋 Step 4: Checking existing overrides...');
        const existingOverridesResponse = await api.get(`/api/payroll/employees/${TEST_DATA.employee_id}/overrides`);
        
        if (existingOverridesResponse.status === 200) {
            const overrides = existingOverridesResponse.data.data;
            console.log('✅ Current overrides:');
            console.log(`   Active Allowance Overrides: ${overrides.allowance_overrides.length}`);
            console.log(`   Active Deduction Overrides: ${overrides.deduction_overrides.length}`);
            
            // Check if there's already an override for this allowance type
            const existingOverride = overrides.allowance_overrides.find(
                override => override.allowance_type_id === TEST_DATA.allowance_type_id && override.is_active
            );
            
            if (existingOverride) {
                console.log(`   ⚠️  Existing override found for allowance type ${TEST_DATA.allowance_type_id}`);
                console.log(`      Override ID: ${existingOverride.id}, Amount: ₱${existingOverride.override_amount}`);
            }
        }

        // Step 5: Create allowance override
        console.log('\n➕ Step 5: Creating allowance override...');
        console.log('Test Data:');
        console.log(`   Employee ID: ${TEST_DATA.employee_id}`);
        console.log(`   Allowance Type ID: ${TEST_DATA.allowance_type_id}`);
        console.log(`   Override Amount: ₱${TEST_DATA.override_amount}`);
        console.log(`   Effective Date: ${TEST_DATA.effective_date}`);
        console.log(`   End Date: ${TEST_DATA.end_date}`);
        console.log(`   Reason: ${TEST_DATA.reason}`);

        const createResponse = await api.post('/api/payroll/overrides/allowances', TEST_DATA);
        
        if (createResponse.status === 201) {
            const createdOverride = createResponse.data.data;
            console.log('✅ Allowance override created successfully!');
            console.log(`   Override ID: ${createdOverride.id}`);
            console.log(`   Employee ID: ${createdOverride.employee_id}`);
            console.log(`   Allowance Type ID: ${createdOverride.allowance_type_id}`);
            console.log(`   Override Amount: ₱${createdOverride.override_amount}`);
            console.log(`   Effective Date: ${createdOverride.effective_date}`);
            console.log(`   End Date: ${createdOverride.end_date || 'No end date'}`);
            console.log(`   Active: ${createdOverride.is_active}`);
            console.log(`   Created By: ${createdOverride.created_by}`);
            console.log(`   Created At: ${createdOverride.created_at}`);
        } else {
            throw new Error(`Failed to create override. Status: ${createResponse.status}`);
        }

        // Step 6: Verify override was created
        console.log('\n🔍 Step 6: Verifying override was created...');
        const verifyResponse = await api.get(`/api/payroll/employees/${TEST_DATA.employee_id}/overrides`);
        
        if (verifyResponse.status === 200) {
            const updatedOverrides = verifyResponse.data.data;
            const newOverride = updatedOverrides.allowance_overrides.find(
                override => override.allowance_type_id === TEST_DATA.allowance_type_id && 
                           override.override_amount === TEST_DATA.override_amount
            );
            
            if (newOverride) {
                console.log('✅ Override verification successful!');
                console.log(`   Found override with ID: ${newOverride.id}`);
            } else {
                console.log('❌ Override not found in employee overrides');
            }
        }

        // Step 7: Get override summary
        console.log('\n📊 Step 7: Getting employee override summary...');
        const summaryResponse = await api.get(`/api/payroll/employees/${TEST_DATA.employee_id}/override-summary`);
        
        if (summaryResponse.status === 200) {
            const summary = summaryResponse.data.data;
            console.log('✅ Override summary:');
            console.log(`   Total Active Allowance Overrides: ${summary.active_allowance_overrides}`);
            console.log(`   Total Active Deduction Overrides: ${summary.active_deduction_overrides}`);
            console.log(`   Total Allowance Override Amount: ₱${summary.total_allowance_override_amount}`);
            console.log(`   Total Deduction Override Amount: ₱${summary.total_deduction_override_amount}`);
        }

        console.log('\n🎉 Test completed successfully!');
        console.log('=====================================');

    } catch (error) {
        console.error('\n❌ Test failed:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Status Text: ${error.response.statusText}`);
            
            if (error.response.data) {
                console.error(`   Error Message: ${error.response.data.error || error.response.data.message || 'Unknown error'}`);
                
                if (error.response.data.details) {
                    console.error(`   Details:`, JSON.stringify(error.response.data.details, null, 2));
                }
                
                // Log the full response for debugging
                console.error(`   Full Response:`, JSON.stringify(error.response.data, null, 2));
            }
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        console.error('=====================================');
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = { runTest, TEST_DATA };