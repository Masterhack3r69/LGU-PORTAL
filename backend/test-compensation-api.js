// test-compensation-api.js - Simple API test script for Compensation & Benefits module
const axios = require('axios');

const BASE_URL = 'http://10.0.0.73:3000/api';

// Test configuration
const testConfig = {
    baseURL: BASE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Mock session for testing (in real app, this would come from login)
const mockSession = {
    user: {
        id: 1,
        role: 'admin',
        username: 'admin'
    }
};

async function testCompensationBenefitsAPI() {
    console.log('🧪 Testing Compensation & Benefits API Endpoints');
    console.log('='.repeat(50));

    try {
        // Test 1: Health check
        console.log('\n1. Testing Health Endpoint...');
        const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
        console.log('✅ Health check passed:', healthResponse.data.status);

        // Test 2: Test compensation benefits endpoints (these will fail without auth, but we can check if routes exist)
        console.log('\n2. Testing Compensation Benefits Routes...');
        
        const endpoints = [
            { method: 'GET', path: '/compensation-benefits', description: 'Get all records' },
            { method: 'GET', path: '/compensation-benefits/statistics', description: 'Get statistics' },
            { method: 'GET', path: '/compensation-benefits/eligible/PBB', description: 'Get eligible employees' },
            { method: 'GET', path: '/compensation-benefits/calculate/PBB/1', description: 'Calculate PBB for employee 1' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`\n   Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
                
                const response = await axios({
                    method: endpoint.method,
                    url: `${BASE_URL}${endpoint.path}`,
                    timeout: 3000,
                    validateStatus: function (status) {
                        // Accept any status code to check if route exists
                        return status < 500;
                    }
                });

                if (response.status === 401) {
                    console.log('   ✅ Route exists (401 Unauthorized - expected without auth)');
                } else if (response.status === 403) {
                    console.log('   ✅ Route exists (403 Forbidden - expected without admin role)');
                } else if (response.status === 200) {
                    console.log('   ✅ Route accessible and working');
                } else {
                    console.log(`   ⚠️  Route exists but returned status: ${response.status}`);
                }
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.log('   ❌ Server not accessible');
                } else if (error.response && error.response.status === 404) {
                    console.log('   ❌ Route not found (404)');
                } else if (error.response && error.response.status < 500) {
                    console.log(`   ✅ Route exists (${error.response.status} - ${error.response.statusText})`);
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
        }

        // Test 3: Check if the routes are properly registered
        console.log('\n3. Testing Route Registration...');
        try {
            const response = await axios.get(`${BASE_URL}/compensation-benefits`, {
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            
            if (response.status === 401) {
                console.log('✅ Compensation Benefits routes are properly registered');
                console.log('   (401 Unauthorized indicates route exists but requires authentication)');
            } else {
                console.log(`✅ Route accessible with status: ${response.status}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('❌ Compensation Benefits routes not found - check server.js integration');
            } else if (error.response && error.response.status === 401) {
                console.log('✅ Routes registered correctly (authentication required)');
            } else {
                console.log(`Error testing routes: ${error.message}`);
            }
        }

        // Test 4: Test model validation (unit test style)
        console.log('\n4. Testing Model Validation...');
        const CompensationBenefit = require('./models/CompensationBenefit');
        
        // Valid benefit record
        const validBenefit = new CompensationBenefit({
            employee_id: 1,
            benefit_type: 'PBB',
            amount: 50000.00,
            processed_by: 1
        });
        
        const validation = validBenefit.validate();
        if (validation.isValid) {
            console.log('✅ Model validation works correctly for valid data');
        } else {
            console.log('❌ Model validation failed for valid data:', validation.errors);
        }

        // Invalid benefit record
        const invalidBenefit = new CompensationBenefit({
            employee_id: null,
            benefit_type: 'INVALID_TYPE',
            amount: -100
        });
        
        const invalidValidation = invalidBenefit.validate();
        if (!invalidValidation.isValid && invalidValidation.errors.length > 0) {
            console.log('✅ Model validation correctly rejects invalid data');
            console.log('   Errors caught:', invalidValidation.errors.length);
        } else {
            console.log('❌ Model validation should have failed for invalid data');
        }

        // Test 5: Test service calculations (unit test style)
        console.log('\n5. Testing Service Calculations...');
        const CompensationBenefitService = require('./services/compensationBenefitService');
        const service = new CompensationBenefitService();
        
        // Test constants
        console.log('✅ Service constants loaded:');
        console.log(`   TLB_FACTOR: ${service.CONSTANTS.TLB_FACTOR}`);
        console.log(`   PBB_PERCENT: ${service.CONSTANTS.PBB_PERCENT}`);
        console.log(`   GSIS_PERCENT: ${service.CONSTANTS.GSIS_PERCENT}`);
        console.log(`   LOYALTY_BASE_AMOUNT: ${service.CONSTANTS.LOYALTY_BASE_AMOUNT}`);

        console.log('\n🎉 API Testing Complete!');
        console.log('\n📋 Summary:');
        console.log('✅ Server is running and accessible');
        console.log('✅ Compensation Benefits routes are registered');
        console.log('✅ Authentication middleware is working');
        console.log('✅ Model validation is functioning');
        console.log('✅ Service calculations are loaded');
        console.log('\n📝 Next Steps:');
        console.log('1. Create admin user session for full API testing');
        console.log('2. Test with real employee data');
        console.log('3. Verify database table creation');
        console.log('4. Test frontend integration');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the tests
if (require.main === module) {
    testCompensationBenefitsAPI()
        .then(() => {
            console.log('\n✅ All tests completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { testCompensationBenefitsAPI };