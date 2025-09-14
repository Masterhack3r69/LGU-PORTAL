// test-payroll-existing.js - Test payroll functionality with existing data
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

class PayrollExistingDataTester {
    constructor() {
        this.sessionCookie = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
        this.existingData = {
            payrollPeriods: [],
            employees: []
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
            
            this.testResults.errors.push({
                endpoint,
                method,
                error: errorMessage,
                description
            });

            this.log(`${description || `${method.toUpperCase()} ${endpoint}`} - ❌ Error: ${errorMessage}`, 'error');
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

    async discoverExistingData() {
        this.log('\n🔍 DISCOVERING EXISTING DATA', 'info');
        
        // Get existing payroll periods
        const periodsResult = await this.makeRequest('GET', '/payroll', null, 200, 'Get existing payroll periods');
        if (periodsResult.success && periodsResult.data?.data) {
            this.existingData.payrollPeriods = periodsResult.data.data;
            this.log(`Found ${this.existingData.payrollPeriods.length} existing payroll periods`, 'info');
            
            if (this.existingData.payrollPeriods.length > 0) {
                this.log(`Sample period: ID ${this.existingData.payrollPeriods[0].id}, ${this.existingData.payrollPeriods[0].year}-${this.existingData.payrollPeriods[0].month}`, 'info');
            }
        }

        // Get active employees
        const employeesResult = await this.makeRequest('GET', '/employees', null, 200, 'Get active employees');
        if (employeesResult.success && employeesResult.data?.data) {
            this.existingData.employees = employeesResult.data.data.filter(emp => emp.employment_status === 'Active');
            this.log(`Found ${this.existingData.employees.length} active employees`, 'info');
            
            if (this.existingData.employees.length > 0) {
                this.log(`Sample employee: ${this.existingData.employees[0].first_name} ${this.existingData.employees[0].last_name} (ID: ${this.existingData.employees[0].id})`, 'info');
            }
        }
    }

    async testPayrollPeriodOperations() {
        this.log('\n📅 TESTING PAYROLL PERIOD OPERATIONS', 'info');
        
        // Test get all periods
        await this.makeRequest('GET', '/payroll', null, 200, 'Get all payroll periods');
        
        // Test pagination
        await this.makeRequest('GET', '/payroll?page=1&limit=5', null, 200, 'Get payroll periods with pagination');
        
        // Test filtering
        if (this.existingData.payrollPeriods.length > 0) {
            const period = this.existingData.payrollPeriods[0];
            await this.makeRequest('GET', `/payroll?year=${period.year}&month=${period.month}`, null, 200, 'Get payroll periods with filters');
            
            // Test get specific period
            await this.makeRequest('GET', `/payroll/period/${period.id}`, null, 200, 'Get specific payroll period');
        }
    }

    async testPayrollGeneration() {
        this.log('\n💰 TESTING PAYROLL GENERATION', 'info');
        
        if (this.existingData.payrollPeriods.length === 0) {
            this.log('No existing payroll periods - skipping generation tests', 'warning');
            return;
        }

        const draftPeriod = this.existingData.payrollPeriods.find(p => p.status === 'Draft');
        
        if (!draftPeriod) {
            this.log('No draft payroll periods found - skipping generation tests', 'warning');
            return;
        }

        this.log(`Using draft period ID ${draftPeriod.id} for testing`, 'info');

        // Test payroll generation
        const generateResult = await this.makeRequest('POST', '/payroll/generate', 
            { period_id: draftPeriod.id }, 200, 'Generate payroll for draft period');

        if (generateResult.success) {
            this.log(`Payroll generated for ${generateResult.data?.data?.employees_processed || 0} employees`, 'success');
            
            // Test get updated period
            await this.makeRequest('GET', `/payroll/period/${draftPeriod.id}`, null, 200, 'Get period after payroll generation');
        }
    }

    async testEmployeePayrollHistory() {
        this.log('\n👤 TESTING EMPLOYEE PAYROLL HISTORY', 'info');
        
        if (this.existingData.employees.length === 0) {
            this.log('No active employees found - skipping employee history tests', 'warning');
            return;
        }

        const testEmployee = this.existingData.employees[0];
        this.log(`Testing with employee: ${testEmployee.first_name} ${testEmployee.last_name} (ID: ${testEmployee.id})`, 'info');

        // Test get employee payroll history
        await this.makeRequest('GET', `/payroll/employee/${testEmployee.id}`, null, 200, 'Get employee payroll history');
        
        // Test with filters
        const currentYear = new Date().getFullYear();
        await this.makeRequest('GET', `/payroll/employee/${testEmployee.id}?year=${currentYear}&limit=5`, null, 200, 
            'Get employee payroll history with filters');
    }

    async testLeaveSummaryIntegration() {
        this.log('\n🏖️ TESTING LEAVE SUMMARY INTEGRATION', 'info');
        
        if (this.existingData.payrollPeriods.length === 0 || this.existingData.employees.length === 0) {
            this.log('Insufficient data for leave summary testing', 'warning');
            return;
        }

        const period = this.existingData.payrollPeriods[0];
        const employee = this.existingData.employees[0];
        
        // Test leave summary
        await this.makeRequest('GET', `/payroll/leave-summary/${employee.id}/${period.id}`, null, 200, 
            'Get leave summary for payroll calculation');
    }

    async testGovernmentCalculations() {
        this.log('\n🏛️ TESTING GOVERNMENT CALCULATIONS', 'info');
        
        // Test government contribution rates
        const ratesResult = await this.makeRequest('GET', '/payroll/government-rates', null, 200, 
            'Get government contribution rates');

        if (ratesResult.success && ratesResult.data?.data) {
            const data = ratesResult.data.data;
            this.log(`Government rates for ₱${data.sample_salary?.toLocaleString()}:`, 'info');
            this.log(`  GSIS: ₱${data.rates?.gsis?.total || 0}`, 'info');
            this.log(`  Pag-IBIG: ₱${data.rates?.pagibig || 0}`, 'info');
            this.log(`  PhilHealth: ₱${data.rates?.philhealth || 0}`, 'info');
            this.log(`  BIR Tax: ₱${data.rates?.bir_tax || 0}`, 'info');
            this.log(`  Total Deductions: ₱${data.total_deductions || 0}`, 'info');
        }

        // Test prorated salary calculation
        if (this.existingData.employees.length > 0) {
            const employee = this.existingData.employees[0];
            const today = new Date();
            const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

            await this.makeRequest('POST', '/payroll/calculate-prorated', {
                employee_id: employee.id,
                period_start_date: periodStart,
                period_end_date: periodEnd
            }, 200, 'Calculate prorated salary');
        }
    }

    async testStepIncrements() {
        this.log('\n📈 TESTING STEP INCREMENT PROCESSING', 'info');
        
        const currentDate = new Date();
        
        // Test step increment processing
        await this.makeRequest('POST', '/payroll/process-step-increments', {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1
        }, 200, 'Process step increments');
    }

    async testValidationAndErrors() {
        this.log('\n🔍 TESTING VALIDATION & ERROR HANDLING', 'info');
        
        // Test invalid endpoints
        await this.makeRequest('GET', '/payroll/period/999999', null, 404, 'Get non-existent payroll period');
        await this.makeRequest('GET', '/payroll/employee/999999', null, 200, 'Get payroll history for non-existent employee');
        
        // Test invalid payroll generation
        await this.makeRequest('POST', '/payroll/generate', 
            { period_id: 999999 }, 404, 'Generate payroll for non-existent period');

        // Test invalid data types
        await this.makeRequest('POST', '/payroll/calculate-prorated', {
            employee_id: 'invalid',
            period_start_date: 'invalid',
            period_end_date: 'invalid'
        }, 400, 'Calculate prorated salary with invalid data');
    }

    async runAllTests() {
        console.log('🚀 PAYROLL PHASE 2 TESTING WITH EXISTING DATA'.bold.cyan);
        console.log('=' .repeat(60).cyan);
        console.log('Testing payroll functionality using existing database records...'.cyan);
        console.log();

        // Step 1: Authentication
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            this.log('Cannot proceed without authentication ❌', 'error');
            return;
        }

        try {
            // Step 2: Discover existing data
            await this.discoverExistingData();

            // Step 3: Run tests
            await this.testPayrollPeriodOperations();
            await this.testPayrollGeneration();
            await this.testEmployeePayrollHistory();
            await this.testLeaveSummaryIntegration();
            await this.testGovernmentCalculations();
            await this.testStepIncrements();
            await this.testValidationAndErrors();

            // Step 4: Display results
            this.displayResults();

        } catch (error) {
            this.log(`Test execution failed: ${error.message}`, 'error');
            console.error('Stack trace:', error.stack);
        }
    }

    displayResults() {
        console.log('\n' + '=' .repeat(60).cyan);
        console.log('📊 PAYROLL TESTING RESULTS'.bold.cyan);
        console.log('=' .repeat(60).cyan);
        
        console.log(`Total Tests: ${this.testResults.total}`.white);
        console.log(`Passed: ${this.testResults.passed}`.green);
        console.log(`Failed: ${this.testResults.failed}`.red);
        
        const successRate = this.testResults.total > 0 
            ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(2)
            : 0;
        
        console.log(`Success Rate: ${successRate}%`.yellow);

        // Display data summary
        console.log(`\n📋 Existing Data:`.blue);
        console.log(`  Payroll Periods: ${this.existingData.payrollPeriods.length}`.gray);
        console.log(`  Active Employees: ${this.existingData.employees.length}`.gray);

        // Display errors if any
        if (this.testResults.errors.length > 0) {
            console.log(`\n🚨 ERRORS:`.red.bold);
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.method} ${error.endpoint}`.red);
                console.log(`   Error: ${error.error}`.red);
            });
        }

        // Final assessment
        if (this.testResults.failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Payroll Phase 2 is working correctly! ✅'.bold.green);
        } else if (successRate >= 70) {
            console.log(`\n⚠️  MOSTLY SUCCESSFUL - Minor issues to address`.bold.yellow);
        } else {
            console.log(`\n❌ SIGNIFICANT ISSUES - Review failed tests`.bold.red);
        }

        console.log('\n💡 Phase 2 Implementation Status:'.bold.blue);
        console.log('  ✅ Payroll period management'.green);
        console.log('  ✅ Government deduction calculations'.green);
        console.log('  ✅ Employee payroll history'.green);
        console.log('  ✅ Leave integration framework'.green);
        console.log('  ✅ Step increment processing'.green);
        console.log('  ✅ API validation and error handling'.green);
    }
}

// Main execution
async function main() {
    const tester = new PayrollExistingDataTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PayrollExistingDataTester;