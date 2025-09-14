// test-payroll-live.js - Comprehensive Live Testing for Payroll Phase 2 Implementation
const axios = require('axios');
const colors = require('colors');
const moment = require('moment');

const BASE_URL = 'http://localhost:3000/api';

// Enhanced test configuration
const config = {
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
};

class PayrollLiveTester {
    constructor() {
        this.sessionCookie = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: [],
            warnings: []
        };
        this.createdResources = {
            payrollPeriods: [],
            compensationRecords: [],
            payrollItems: []
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

    async makeRequest(method, endpoint, data = null, expectedStatus = 200, description = '') {
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
                this.log(`${description || `${method.toUpperCase()} ${endpoint}`} - ✅ Status: ${response.status}`, 'success');
                return { success: true, data: response.data, status: response.status };
            } else {
                this.testResults.failed++;
                this.log(`${description || `${method.toUpperCase()} ${endpoint}`} - ❌ Expected ${expectedStatus}, got ${response.status}`, 'error');
                return { success: false, error: `Unexpected status code: ${response.status}`, data: response.data };
            }
        } catch (error) {
            this.testResults.failed++;
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            const errorDetails = error.response?.data || error.message;
            
            this.testResults.errors.push({
                endpoint,
                method,
                error: errorMessage,
                details: errorDetails,
                description
            });

            this.log(`${description || `${method.toUpperCase()} ${endpoint}`} - ❌ Error: ${errorMessage}`, 'error');
            
            if (error.response?.data && typeof error.response.data === 'object') {
                console.log('📋 Error details:', JSON.stringify(errorDetails, null, 2).gray);
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
        this.log('🔐 Authenticating as admin user...', 'info');
        
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, {
                username: 'deckson',
                password: 'admin123'
            }, config);

            if (response.status === 200 && response.headers['set-cookie']) {
                this.sessionCookie = response.headers['set-cookie'][0];
                this.log('Authentication successful ✅', 'success');
                return true;
            } else {
                this.log('Authentication failed - no session cookie received ❌', 'error');
                return false;
            }
        } catch (error) {
            this.log(`Authentication failed: ${error.response?.data?.message || error.message}`, 'error');
            return false;
        }
    }

    async testPayrollPeriodManagement() {
        this.log('\n📅 TESTING PAYROLL PERIOD MANAGEMENT', 'info');
        this.log('=' .repeat(50), 'info');

        // Test 1: Get payroll periods (should work even with empty data)
        await this.makeRequest('GET', '/payroll', null, 200, 'Get all payroll periods');

        // Test 2: Create new payroll period with unique data
        const currentDate = moment();
        const year = currentDate.year();
        const month = currentDate.month() + 2; // Use next month to avoid duplicates
        const adjustedMonth = month > 12 ? month - 12 : month;
        const adjustedYear = month > 12 ? year + 1 : year;
        
        const periodData = {
            year: adjustedYear,
            month: adjustedMonth,
            period_number: 2, // Use period 2 to avoid duplicates
            start_date: `${adjustedYear}-${String(adjustedMonth).padStart(2, '0')}-16`,
            end_date: `${adjustedYear}-${String(adjustedMonth).padStart(2, '0')}-31`,
            pay_date: `${adjustedYear}-${String(adjustedMonth + 1 > 12 ? 1 : adjustedMonth + 1).padStart(2, '0')}-05`
        };

        const createResult = await this.makeRequest('POST', '/payroll/period', periodData, 201, 'Create payroll period');
        
        if (createResult.success && createResult.data?.data?.id) {
            const periodId = createResult.data.data.id;
            this.createdResources.payrollPeriods.push(periodId);

            // Test 3: Get specific payroll period
            await this.makeRequest('GET', `/payroll/period/${periodId}`, null, 200, 'Get specific payroll period');

            // Test 4: Try to create duplicate period (should fail)
            await this.makeRequest('POST', '/payroll/period', periodData, 400, 'Create duplicate period (should fail)');

            return periodId;
        }

        return null;
    }

    async testPayrollGeneration() {
        this.log('\n💰 TESTING PAYROLL GENERATION', 'info');
        this.log('=' .repeat(50), 'info');

        // First create a payroll period for testing
        const periodId = await this.testPayrollPeriodManagement();
        
        if (!periodId) {
            this.log('Skipping payroll generation tests - no valid period created', 'warning');
            return;
        }

        // Test 1: Generate payroll for the period
        const generateResult = await this.makeRequest('POST', '/payroll/generate', 
            { period_id: periodId }, 200, 'Generate payroll for period');

        if (generateResult.success) {
            this.log(`Payroll generated for ${generateResult.data?.data?.employees_processed || 0} employees`, 'success');
        }

        // Test 2: Try to generate again (should handle gracefully)
        await this.makeRequest('POST', '/payroll/generate', 
            { period_id: periodId }, 400, 'Generate payroll again (should warn about existing)');

        // Test 3: Finalize payroll period
        await this.makeRequest('POST', '/payroll/process', 
            { period_id: periodId }, 200, 'Finalize payroll period');
    }

    async testEmployeePayrollHistory() {
        this.log('\n📊 TESTING EMPLOYEE PAYROLL HISTORY', 'info');
        this.log('=' .repeat(50), 'info');

        // Test with known employee ID (21 from previous tests)
        await this.makeRequest('GET', '/payroll/employee/21', null, 200, 'Get employee payroll history');

        // Test with filters
        const currentYear = new Date().getFullYear();
        await this.makeRequest('GET', `/payroll/employee/21?year=${currentYear}&limit=5`, null, 200, 
            'Get employee payroll history with filters');

        // Test with invalid employee
        await this.makeRequest('GET', '/payroll/employee/999999', null, 200, 
            'Get payroll history for non-existent employee');
    }

    async testLeaveSummaryIntegration() {
        this.log('\n🏖️ TESTING LEAVE SUMMARY INTEGRATION', 'info');
        this.log('=' .repeat(50), 'info');

        if (this.createdResources.payrollPeriods.length === 0) {
            this.log('No payroll periods available for leave summary testing', 'warning');
            return;
        }

        const periodId = this.createdResources.payrollPeriods[0];
        
        // Test leave summary for employee
        await this.makeRequest('GET', `/payroll/leave-summary/21/${periodId}`, null, 200, 
            'Get leave summary for payroll calculation');
    }

    async testGovernmentContributions() {
        this.log('\n🏛️ TESTING GOVERNMENT CONTRIBUTION CALCULATIONS', 'info');
        this.log('=' .repeat(50), 'info');

        // Test get government rates
        const ratesResult = await this.makeRequest('GET', '/payroll/government-rates', null, 200, 
            'Get government contribution rates');

        if (ratesResult.success) {
            const rates = ratesResult.data?.data?.rates;
            this.log(`Sample calculation for ₱${ratesResult.data?.data?.sample_salary?.toLocaleString()}:`, 'info');
            this.log(`  GSIS: ₱${rates?.gsis?.total || 0}`, 'info');
            this.log(`  Pag-IBIG: ₱${rates?.pagibig || 0}`, 'info');
            this.log(`  PhilHealth: ₱${rates?.philhealth || 0}`, 'info');
            this.log(`  BIR Tax: ₱${rates?.bir_tax || 0}`, 'info');
            this.log(`  Total Deductions: ₱${ratesResult.data?.data?.total_deductions || 0}`, 'info');
        }
    }

    async testProratedSalaryCalculations() {
        this.log('\n⏰ TESTING PRORATED SALARY CALCULATIONS', 'info');
        this.log('=' .repeat(50), 'info');

        const currentDate = moment();
        const periodStart = currentDate.clone().startOf('month').format('YYYY-MM-DD');
        const periodEnd = currentDate.clone().endOf('month').format('YYYY-MM-DD');

        // Test prorated calculation for employee
        await this.makeRequest('POST', '/payroll/calculate-prorated', {
            employee_id: 21,
            period_start_date: periodStart,
            period_end_date: periodEnd
        }, 200, 'Calculate prorated salary for employee');

        // Test with invalid employee
        await this.makeRequest('POST', '/payroll/calculate-prorated', {
            employee_id: 999999,
            period_start_date: periodStart,
            period_end_date: periodEnd
        }, 404, 'Calculate prorated salary for invalid employee');
    }

    async testStepIncrementProcessing() {
        this.log('\n📈 TESTING STEP INCREMENT PROCESSING', 'info');
        this.log('=' .repeat(50), 'info');

        const currentDate = moment();
        
        // Test step increment processing
        await this.makeRequest('POST', '/payroll/process-step-increments', {
            year: currentDate.year(),
            month: currentDate.month() + 1
        }, 200, 'Process step increments for eligible employees');

        // Test with invalid data
        await this.makeRequest('POST', '/payroll/process-step-increments', {
            year: 'invalid',
            month: 'invalid'
        }, 400, 'Process step increments with invalid data');
    }

    async testErrorHandlingAndValidation() {
        this.log('\n🔍 TESTING ERROR HANDLING & VALIDATION', 'info');
        this.log('=' .repeat(50), 'info');

        // Test invalid payroll period data
        await this.makeRequest('POST', '/payroll/period', {
            year: 1999, // Too old
            month: 13,  // Invalid month
            period_number: 3 // Invalid period number
        }, 400, 'Create payroll period with invalid data');

        // Test missing required fields
        await this.makeRequest('POST', '/payroll/period', {
            year: 2025
            // Missing other required fields
        }, 400, 'Create payroll period with missing fields');

        // Test invalid payroll generation
        await this.makeRequest('POST', '/payroll/generate', {
            period_id: 'invalid'
        }, 400, 'Generate payroll with invalid period ID');

        // Test finalize non-existent period
        await this.makeRequest('POST', '/payroll/process', {
            period_id: 999999
        }, 404, 'Finalize non-existent payroll period');
    }

    async testDataIntegrity() {
        this.log('\n🔒 TESTING DATA INTEGRITY', 'info');
        this.log('=' .repeat(50), 'info');

        // Test pagination limits
        await this.makeRequest('GET', '/payroll?page=1&limit=1000', null, 200, 
            'Test pagination with large limit (should be capped)');

        // Test with various query parameters
        await this.makeRequest('GET', '/payroll?year=2025&month=1&status=Draft', null, 200, 
            'Test payroll periods with filters');

        // Test employee payroll history with edge cases
        await this.makeRequest('GET', '/payroll/employee/21?limit=0', null, 200, 
            'Test employee payroll with zero limit');
    }

    async runComprehensiveTests() {
        console.log('🚀 COMPREHENSIVE PAYROLL PHASE 2 LIVE TESTING'.bold.cyan);
        console.log('=' .repeat(80).cyan);
        console.log('Testing all implemented payroll functionality...'.cyan);
        console.log();

        // Step 1: Authentication
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('Cannot proceed without authentication ❌', 'error');
            return;
        }

        try {
            // Step 2: Run all test suites
            await this.testPayrollPeriodManagement();
            await this.testPayrollGeneration();
            await this.testEmployeePayrollHistory();
            await this.testLeaveSummaryIntegration();
            await this.testGovernmentContributions();
            await this.testProratedSalaryCalculations();
            await this.testStepIncrementProcessing();
            await this.testErrorHandlingAndValidation();
            await this.testDataIntegrity();

            // Step 3: Display comprehensive results
            this.displayDetailedResults();

        } catch (error) {
            this.log(`Test execution failed: ${error.message}`, 'error');
            console.error('Stack trace:', error.stack);
        }
    }

    displayDetailedResults() {
        console.log('\n' + '=' .repeat(80).cyan);
        console.log('📊 COMPREHENSIVE TEST RESULTS'.bold.cyan);
        console.log('=' .repeat(80).cyan);
        
        console.log(`Total Tests Executed: ${this.testResults.total}`.white);
        console.log(`Passed: ${this.testResults.passed}`.green);
        console.log(`Failed: ${this.testResults.failed}`.red);
        console.log(`Warnings: ${this.testResults.warnings.length}`.yellow);
        
        const successRate = this.testResults.total > 0 
            ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2)
            : 0;
        
        console.log(`Success Rate: ${successRate}%`.yellow);

        // Display created resources
        if (this.createdResources.payrollPeriods.length > 0) {
            console.log(`\n📋 Created Resources:`.blue);
            console.log(`  Payroll Periods: ${this.createdResources.payrollPeriods.join(', ')}`.gray);
        }

        // Display error summary
        if (this.testResults.errors.length > 0) {
            console.log(`\n🚨 ERROR SUMMARY:`.red.bold);
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.method} ${error.endpoint}`.red);
                console.log(`   Description: ${error.description}`.gray);
                console.log(`   Error: ${error.error}`.red);
                console.log();
            });
        }

        // Overall assessment
        if (this.testResults.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Phase 2 implementation is solid! ✅'.bold.green);
        } else if (successRate >= 80) {
            console.log(`\n⚠️  MOSTLY SUCCESSFUL with ${this.testResults.failed} issues to address`.bold.yellow);
        } else {
            console.log(`\n❌ SIGNIFICANT ISSUES FOUND - ${this.testResults.failed} failures need attention`.bold.red);
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:'.bold.blue);
        if (this.testResults.failed > 0) {
            console.log('  • Review failed endpoints and fix validation/error handling'.blue);
            console.log('  • Ensure database schema matches implementation'.blue);
            console.log('  • Test with actual employee data for realistic scenarios'.blue);
        }
        console.log('  • Add more comprehensive unit tests for edge cases'.blue);
        console.log('  • Consider adding integration tests for leave calculations'.blue);
        console.log('  • Implement automated testing in CI/CD pipeline'.blue);
    }
}

// Execute tests if run directly
async function main() {
    const tester = new PayrollLiveTester();
    await tester.runComprehensiveTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PayrollLiveTester;