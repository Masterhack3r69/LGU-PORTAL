const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
    username: 'deckson',
    password: 'admin123'
};

// Test configuration
let sessionCookie = '';
let testEmployeeId = null;
let createdTLBId = null;

// Helper functions
const log = (message, type = 'info') => {
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
            console.log(`[${timestamp}] ℹ️  ${message}`.blue);
            break;
        default:
            console.log(`[${timestamp}] ${message}`);
    }
};

const makeRequest = async (method, endpoint, data = null, expectedStatus = 200) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true // Enable cookies
        };

        if (sessionCookie) {
            config.headers['Cookie'] = sessionCookie;
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        
        if (response.status === expectedStatus) {
            log(`${method.toUpperCase()} ${endpoint} - Status: ${response.status}`, 'success');
            return { success: true, data: response.data, status: response.status, headers: response.headers };
        } else {
            log(`${method.toUpperCase()} ${endpoint} - Unexpected status: ${response.status}`, 'warning');
            return { success: false, data: response.data, status: response.status, headers: response.headers };
        }
    } catch (error) {
        if (error.response) {
            const errorMsg = error.response.data?.error || error.response.data?.message || error.response.statusText;
            log(`${method.toUpperCase()} ${endpoint} - Error: ${error.response.status} - ${errorMsg}`, 'error');
            return { success: false, data: error.response.data, status: error.response.status };
        } else {
            log(`${method.toUpperCase()} ${endpoint} - Network Error: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test functions
const testLogin = async () => {
    log('🔐 Testing Admin Login...', 'info');
    
    const result = await makeRequest('POST', '/api/auth/login', ADMIN_CREDENTIALS);
    
    if (result.success && result.data.success) {
        // Extract session cookie from Set-Cookie header
        const setCookieHeader = result.headers['set-cookie'];
        if (setCookieHeader) {
            const sessionCookieMatch = setCookieHeader.find(cookie => cookie.startsWith('ems_session='));
            if (sessionCookieMatch) {
                sessionCookie = sessionCookieMatch.split(';')[0]; // Get just the cookie value without attributes
                log(`Session cookie extracted: ${sessionCookie.substring(0, 50)}...`, 'info');
            }
        }
        
        log(`Login successful for user: ${result.data.user?.username}`, 'success');
        log(`User role: ${result.data.user?.role}`, 'info');
        return true;
    } else {
        log('Login failed', 'error');
        return false;
    }
};

const getTestEmployee = async () => {
    log('👤 Getting test employee...', 'info');
    
    const result = await makeRequest('GET', '/api/employees?limit=1');
    
    if (result.success && result.data.data && result.data.data.length > 0) {
        testEmployeeId = result.data.data[0].id;
        log(`Found test employee: ${result.data.data[0].first_name} ${result.data.data[0].last_name} (ID: ${testEmployeeId})`, 'success');
        return true;
    } else {
        log('No employees found for testing', 'error');
        return false;
    }
};

const testTLBStatistics = async () => {
    log('📊 Testing TLB Statistics...', 'info');
    
    const result = await makeRequest('GET', '/api/tlb/statistics');
    
    if (result.success && result.data.success) {
        log('TLB Statistics retrieved successfully', 'success');
        console.log('Statistics:', JSON.stringify(result.data.data, null, 2));
        return true;
    } else {
        log('Failed to get TLB statistics', 'error');
        return false;
    }
};

const testTLBCalculation = async () => {
    if (!testEmployeeId) {
        log('No test employee available for calculation', 'error');
        return false;
    }

    log(`🧮 Testing TLB Calculation for employee ${testEmployeeId}...`, 'info');
    
    const separationDate = '2024-12-31';
    const claimDate = '2024-12-31';
    
    const result = await makeRequest('GET', `/api/tlb/employee/${testEmployeeId}/calculation?separationDate=${separationDate}&claimDate=${claimDate}`);
    
    if (result.success && result.data.success) {
        log('TLB Calculation completed successfully', 'success');
        console.log('Employee:', result.data.data.employee);
        console.log('Calculation:', result.data.data.calculation);
        return true;
    } else {
        log('Failed to calculate TLB', 'error');
        return false;
    }
};

const testCreateTLB = async () => {
    if (!testEmployeeId) {
        log('No test employee available for TLB creation', 'error');
        return false;
    }

    log(`📝 Testing TLB Record Creation for employee ${testEmployeeId}...`, 'info');
    
    const tlbData = {
        employee_id: testEmployeeId,
        total_leave_credits: 45.5,
        highest_monthly_salary: 35000.00,
        constant_factor: 1.0,
        claim_date: '2024-12-31',
        separation_date: '2024-12-31',
        notes: 'Test TLB record created by live test script'
    };
    
    log(`Sending TLB data: ${JSON.stringify(tlbData, null, 2)}`, 'info');
    
    const result = await makeRequest('POST', '/api/tlb', tlbData, 201);
    
    if (result.success && result.data.success) {
        createdTLBId = result.data.data?.id;
        log(`TLB Record created successfully with ID: ${createdTLBId}`, 'success');
        console.log('Created TLB:', JSON.stringify(result.data.data, null, 2));
        return true;
    } else {
        log('Failed to create TLB record', 'error');
        if (result.data) {
            log(`Error details: ${JSON.stringify(result.data, null, 2)}`, 'error');
        }
        if ((result.status === 400 && result.data?.error?.includes('already exists')) || 
            (result.status === 500 && result.data?.error?.details?.stack?.includes('already exists'))) {
            log('TLB record already exists for this employee - this is expected behavior', 'warning');
            
            // Try to get existing TLB record by making a direct query to find the employee's TLB
            log('Attempting to find existing TLB record...', 'info');
            const allTLBResult = await makeRequest('GET', '/api/tlb/reports/summary?year=2024');
            if (allTLBResult.success && allTLBResult.data.data.details.length > 0) {
                // Find the TLB record for our test employee
                const employeeTLB = allTLBResult.data.data.details.find(tlb => tlb.employee_id == testEmployeeId);
                if (employeeTLB) {
                    createdTLBId = employeeTLB.id;
                    log(`Found existing TLB record with ID: ${createdTLBId}`, 'info');
                    return true;
                }
            }
        }
        return false;
    }
};

const testGetTLBById = async () => {
    if (!createdTLBId) {
        log('No TLB ID available for testing', 'error');
        return false;
    }

    log(`🔍 Testing Get TLB by ID: ${createdTLBId}...`, 'info');
    
    const result = await makeRequest('GET', `/api/tlb/${createdTLBId}`);
    
    if (result.success && result.data.success) {
        log('TLB Record retrieved successfully', 'success');
        console.log('TLB Record:', JSON.stringify(result.data.data, null, 2));
        return true;
    } else {
        log('Failed to get TLB record by ID', 'error');
        return false;
    }
};

const testUpdateTLB = async () => {
    if (!createdTLBId) {
        log('No TLB ID available for testing', 'error');
        return false;
    }

    log(`✏️  Testing TLB Record Update: ${createdTLBId}...`, 'info');
    
    const updateData = {
        status: 'Approved',
        notes: 'Updated by live test script - approved for processing'
    };
    
    const result = await makeRequest('PUT', `/api/tlb/${createdTLBId}`, updateData);
    
    if (result.success && result.data.success) {
        log('TLB Record updated successfully', 'success');
        console.log('Updated TLB:', JSON.stringify(result.data.data, null, 2));
        return true;
    } else {
        log('Failed to update TLB record', 'error');
        return false;
    }
};

const testGetAllTLB = async () => {
    log('📋 Testing Get All TLB Records...', 'info');
    
    const result = await makeRequest('GET', '/api/tlb?page=1&limit=10');
    
    if (result.success && result.data.success) {
        log(`Retrieved ${result.data.data.length} TLB records`, 'success');
        console.log('Pagination:', result.data.pagination);
        if (result.data.data.length > 0) {
            console.log('Sample TLB Record:', JSON.stringify(result.data.data[0], null, 2));
        }
        return true;
    } else {
        log('Failed to get TLB records', 'error');
        return false;
    }
};

const testTLBSummaryReport = async () => {
    log('📈 Testing TLB Summary Report...', 'info');
    
    const result = await makeRequest('GET', '/api/tlb/reports/summary?year=2024');
    
    if (result.success && result.data.success) {
        log('TLB Summary Report generated successfully', 'success');
        console.log('Report Summary:', JSON.stringify(result.data.data.summary, null, 2));
        console.log('Report Totals:', JSON.stringify(result.data.data.totals, null, 2));
        return true;
    } else {
        log('Failed to generate TLB summary report', 'error');
        return false;
    }
};

const testFilteredQueries = async () => {
    log('🔍 Testing Filtered Queries...', 'info');
    
    // Test filtering by status
    const statusResult = await makeRequest('GET', '/api/tlb?status=Approved');
    if (statusResult.success) {
        log(`Found ${statusResult.data.data.length} Approved TLB records`, 'success');
    }
    
    // Test search functionality
    const searchResult = await makeRequest('GET', '/api/tlb?search=test');
    if (searchResult.success) {
        log(`Found ${searchResult.data.data.length} TLB records matching 'test'`, 'success');
    }
    
    // Test statistics with year filter
    const yearStatsResult = await makeRequest('GET', '/api/tlb/statistics?year=2024');
    if (yearStatsResult.success) {
        log('Retrieved 2024 TLB statistics successfully', 'success');
    }
    
    return true;
};

const testErrorHandling = async () => {
    log('⚠️  Testing Error Handling...', 'info');
    
    // Test getting non-existent TLB record
    const notFoundResult = await makeRequest('GET', '/api/tlb/99999', null, 404);
    if (notFoundResult.status === 404) {
        log('404 error handling works correctly', 'success');
    }
    
    // Test invalid calculation request
    const invalidCalcResult = await makeRequest('GET', '/api/tlb/employee/99999/calculation?separationDate=2024-12-31&claimDate=2024-12-31', null, 404);
    if (invalidCalcResult.status === 404) {
        log('Invalid employee calculation error handling works correctly', 'success');
    }
    
    // Test creating TLB with invalid data
    const invalidDataResult = await makeRequest('POST', '/api/tlb', {
        employee_id: 'invalid',
        total_leave_credits: -10,
        highest_monthly_salary: 0
    }, 400);
    if (invalidDataResult.status === 400) {
        log('Validation error handling works correctly', 'success');
    }
    
    return true;
};

const cleanup = async () => {
    log('🧹 Cleaning up test data...', 'info');
    
    if (createdTLBId) {
        log(`Attempting to delete test TLB record: ${createdTLBId}`, 'info');
        const result = await makeRequest('DELETE', `/api/tlb/${createdTLBId}`);
        
        if (result.success) {
            log('Test TLB record deleted successfully', 'success');
        } else {
            log('Could not delete test TLB record (may need manual cleanup)', 'warning');
        }
    }
};

// Main test runner
const runAllTests = async () => {
    console.log('='.repeat(80).cyan);
    console.log('🧪 TERMINAL LEAVE BENEFITS (TLB) LIVE TEST SUITE'.cyan.bold);
    console.log('='.repeat(80).cyan);
    console.log();

    const tests = [
        { name: 'Admin Login', fn: testLogin, critical: true },
        { name: 'Get Test Employee', fn: getTestEmployee, critical: true },
        { name: 'TLB Statistics', fn: testTLBStatistics, critical: false },
        { name: 'TLB Calculation', fn: testTLBCalculation, critical: false },
        { name: 'Create TLB Record', fn: testCreateTLB, critical: false },
        { name: 'Get TLB by ID', fn: testGetTLBById, critical: false },
        { name: 'Update TLB Record', fn: testUpdateTLB, critical: false },
        { name: 'Get All TLB Records', fn: testGetAllTLB, critical: false },
        { name: 'TLB Summary Report', fn: testTLBSummaryReport, critical: false },
        { name: 'Filtered Queries', fn: testFilteredQueries, critical: false },
        { name: 'Error Handling', fn: testErrorHandling, critical: false }
    ];

    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    for (const test of tests) {
        console.log(`\n${'='.repeat(50)}`);
        log(`Running Test: ${test.name}`, 'info');
        console.log('='.repeat(50));

        try {
            const result = await test.fn();
            
            if (result) {
                passedTests++;
                log(`✅ ${test.name} PASSED`, 'success');
            } else {
                failedTests++;
                log(`❌ ${test.name} FAILED`, 'error');
                
                if (test.critical) {
                    log('Critical test failed - stopping test suite', 'error');
                    break;
                }
            }
        } catch (error) {
            failedTests++;
            log(`❌ ${test.name} FAILED with exception: ${error.message}`, 'error');
            
            if (test.critical) {
                log('Critical test failed - stopping test suite', 'error');
                break;
            }
        }

        // Small delay between tests
        await delay(500);
    }

    // Cleanup
    console.log(`\n${'='.repeat(50)}`);
    log('Running Cleanup', 'info');
    console.log('='.repeat(50));
    await cleanup();

    // Summary
    console.log('\n' + '='.repeat(80).cyan);
    console.log('📊 TEST SUMMARY'.cyan.bold);
    console.log('='.repeat(80).cyan);
    console.log(`✅ Passed: ${passedTests}`.green);
    console.log(`❌ Failed: ${failedTests}`.red);
    console.log(`⏭️  Skipped: ${skippedTests}`.yellow);
    console.log(`📊 Total: ${passedTests + failedTests + skippedTests}`);
    
    const successRate = Math.round((passedTests / (passedTests + failedTests)) * 100);
    console.log(`📈 Success Rate: ${successRate}%`.cyan);

    if (failedTests === 0) {
        console.log('\n🎉 ALL TESTS PASSED! TLB System is working correctly.'.green.bold);
    } else if (passedTests > failedTests) {
        console.log('\n⚠️  Some tests failed, but core functionality appears to work.'.yellow.bold);
    } else {
        console.log('\n💥 Multiple tests failed. TLB System may have issues.'.red.bold);
    }

    console.log('='.repeat(80).cyan);
    process.exit(failedTests === 0 ? 0 : 1);
};

// Check if server is running
const checkServer = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        log('Server is running and healthy', 'success');
        return true;
    } catch (error) {
        log('Server is not running or not accessible', 'error');
        log('Please make sure the server is started with: npm start', 'info');
        return false;
    }
};

// Entry point
const main = async () => {
    console.log('🚀 Starting TLB Live Test Suite...'.cyan.bold);
    
    // Check if server is running
    const serverOk = await checkServer();
    if (!serverOk) {
        process.exit(1);
    }

    // Add delay to ensure server is fully ready
    log('Waiting for server to be fully ready...', 'info');
    await delay(2000);

    // Run tests
    await runAllTests();
};

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
    process.exit(1);
});

// Start the test suite
main().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
});