// test-payroll-apis.js - Comprehensive test script for payroll management APIs
const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3000/api';

// Test configuration
const config = {
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
};

class PayrollAPITester {
    constructor() {
        this.sessionCookie = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        switch (type) {
            case 'success':
                console.log(`[${timestamp}] ✅ ${message}`.green);
                break;
            case 'error':
                console.log(`[${timestamp}] ❌ ${message}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
                break;
            case 'info':
            default:
                console.log(`[${timestamp}] ℹ️  ${message}`.blue);
                break;
        }
    }

    async makeRequest(method, endpoint, data = null, expectedStatus = 200) {
        try {
            this.testResults.total++;
            
            const requestConfig = {
                method: method.toUpperCase(),
                url: `${BASE_URL}${endpoint}`,
                ...config
            };

            if (this.sessionCookie) {
                requestConfig.headers['Cookie'] = this.sessionCookie;
            }

            if (data) {
                requestConfig.data = data;
            }

            const response = await axios(requestConfig);

            if (response.status === expectedStatus) {
                this.testResults.passed++;
                this.log(`${method.toUpperCase()} ${endpoint} - Status: ${response.status}`, 'success');
                return { success: true, data: response.data, status: response.status };
            } else {
                this.testResults.failed++;
                this.log(`${method.toUpperCase()} ${endpoint} - Expected ${expectedStatus}, got ${response.status}`, 'error');
                return { success: false, error: `Unexpected status code: ${response.status}`, data: response.data };
            }
        } catch (error) {
            this.testResults.failed++;
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
            this.log(`${method.toUpperCase()} ${endpoint} - Error: ${errorMessage}`, 'error');
            if (error.response?.data && typeof error.response.data === 'object') {
                console.log('Error details:', errorDetails);
            }
            return { 
                success: false, 
                error: errorMessage, 
                status: error.response?.status,
                data: error.response?.data 
            };
        }
    }

    async login() {
        this.log('🔐 Attempting to login as admin...', 'info');
        
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, {
                username: 'deckson',
                password: 'admin123'
            }, config);

            if (response.status === 200 && response.headers['set-cookie']) {
                this.sessionCookie = response.headers['set-cookie'][0];
                this.log('Login successful', 'success');
                return true;
            } else {
                this.log('Login failed - no session cookie received', 'error');
                return false;
            }
        } catch (error) {
            this.log(`Login failed: ${error.response?.data?.message || error.message}`, 'error');
            return false;
        }
    }

    async testCompensationAPIs() {
        this.log('\n📊 Testing Compensation APIs...', 'info');

        // Test get compensation types
        await this.makeRequest('GET', '/compensation/types');

        // Test get all compensations
        await this.makeRequest('GET', '/compensation');

        // Test get employee compensation (using active employee ID 21)
        await this.makeRequest('GET', '/compensation/employee/21');

        // Test create compensation record (try different compensation type to avoid duplicates)
        const timestamp = Date.now();
        const compensationData = {
            employee_id: 21,
            compensation_type_id: 2, // Use different compensation type
            amount: 3000.00,
            year: 2025,
            month: 10, // Use different month
            date_paid: '2025-10-15',
            reference_number: `TEST-${timestamp}`,
            notes: 'Test compensation record'
        };

        const createResult = await this.makeRequest('POST', '/compensation', compensationData, 201);
        let compensationId = null;

        if (createResult.success && createResult.data?.data?.id) {
            compensationId = createResult.data.data.id;
            
            // Test update compensation
            const updateData = {
                amount: 5500.00,
                notes: 'Updated test compensation record'
            };
            await this.makeRequest('PUT', `/compensation/${compensationId}`, updateData);

            // Test delete compensation
            await this.makeRequest('DELETE', `/compensation/${compensationId}`);
        }

        // Test bulk operations
        const bulkData = {
            operation: 'create',
            data: [
                {
                    employee_id: 21,
                    compensation_type_id: 2,
                    amount: 3000.00,
                    year: 2025,
                    month: 9
                }
            ]
        };
        await this.makeRequest('POST', '/compensation/bulk', bulkData);
    }

    async testPayrollAPIs() {
        this.log('\n💰 Testing Payroll APIs...', 'info');

        // Test get payroll periods
        await this.makeRequest('GET', '/payroll');

        // Test create payroll period (with unique period to avoid duplicates)
        const timestamp = Date.now();
        const dayOfYear = Math.floor((Date.now() - new Date(2025, 0, 1)) / (1000 * 60 * 60 * 24));
        const uniqueMonth = (dayOfYear % 12) + 1;
        const payrollPeriodData = {
            year: 2025,
            month: uniqueMonth,
            period_number: 1,
            start_date: `2025-${uniqueMonth.toString().padStart(2, '0')}-01`,
            end_date: `2025-${uniqueMonth.toString().padStart(2, '0')}-15`,
            pay_date: `2025-${uniqueMonth.toString().padStart(2, '0')}-20`
        };

        const periodResult = await this.makeRequest('POST', '/payroll/period', payrollPeriodData, 201);
        let periodId = null;

        if (periodResult.success && periodResult.data?.data?.id) {
            periodId = periodResult.data.data.id;

            // Test get specific payroll period
            await this.makeRequest('GET', `/payroll/period/${periodId}`);

            // Test generate payroll
            const generateData = {
                period_id: periodId
            };
            await this.makeRequest('POST', '/payroll/generate', generateData);

            // Test get leave summary (using active employee ID 21)
            await this.makeRequest('GET', `/payroll/leave-summary/21/${periodId}`);
        }

        // Test get employee payroll history (using active employee ID 21)
        await this.makeRequest('GET', '/payroll/employee/21');
    }

    async testBenefitsAPIs() {
        this.log('\n🎁 Testing Benefits APIs...', 'info');

        // Test get benefit types
        await this.makeRequest('GET', '/benefits/types');

        // Test get employee benefits (using active employee ID 21)
        await this.makeRequest('GET', '/benefits/employee/21');

        // Test calculate benefits
        const calculateData = {
            employee_id: 21,
            benefit_type: 'thirteenth_month',
            year: 2025
        };
        await this.makeRequest('POST', '/benefits/calculate', calculateData);

        // Test PBB calculation
        const pbbData = {
            employee_id: 21,
            benefit_type: 'pbb',
            year: 2025
        };
        await this.makeRequest('POST', '/benefits/calculate', pbbData);

        // Test benefits summary
        await this.makeRequest('GET', '/benefits/summary/2025');
    }

    async testErrorHandling() {
        this.log('\n🔍 Testing Error Handling...', 'info');

        // Test invalid employee ID (should return empty result, not necessarily 404)
        await this.makeRequest('GET', '/compensation/employee/999999', null, 200);

        // Test invalid compensation data
        const invalidData = {
            employee_id: 'invalid',
            compensation_type_id: 'invalid',
            amount: 'not_a_number'
        };
        await this.makeRequest('POST', '/compensation', invalidData, 400);

        // Test invalid payroll period
        const invalidPeriod = {
            year: 1999,
            month: 13,
            period_number: 3
        };
        await this.makeRequest('POST', '/payroll/period', invalidPeriod, 400);
    }

    async runAllTests() {
        console.log('🚀 Starting Payroll Management API Tests'.bold.cyan);
        console.log('=' .repeat(60).cyan);

        // Step 1: Login
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('Cannot proceed without authentication', 'error');
            return;
        }

        try {
            // Step 2: Test APIs
            await this.testCompensationAPIs();
            await this.testPayrollAPIs();
            await this.testBenefitsAPIs();
            await this.testErrorHandling();

            // Step 3: Display results
            this.displayResults();

        } catch (error) {
            this.log(`Test execution failed: ${error.message}`, 'error');
        }
    }

    displayResults() {
        console.log('\n' + '=' .repeat(60).cyan);
        console.log('📊 Test Results Summary'.bold.cyan);
        console.log('=' .repeat(60).cyan);
        
        console.log(`Total Tests: ${this.testResults.total}`.white);
        console.log(`Passed: ${this.testResults.passed}`.green);
        console.log(`Failed: ${this.testResults.failed}`.red);
        
        const successRate = this.testResults.total > 0 
            ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2)
            : 0;
        
        console.log(`Success Rate: ${successRate}%`.yellow);
        
        if (this.testResults.failed === 0) {
            console.log('\n🎉 All tests passed!'.bold.green);
        } else {
            console.log(`\n⚠️  ${this.testResults.failed} test(s) failed. Check the logs above for details.`.bold.red);
        }
    }
}

// Main execution
async function main() {
    const tester = new PayrollAPITester();
    await tester.runAllTests();
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = PayrollAPITester;