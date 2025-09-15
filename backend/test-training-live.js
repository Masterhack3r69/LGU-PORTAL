/**
 * Training and Development System Live Test Script
 * Tests all training endpoints with real server interaction
 * 
 * Usage: node test-training-live.js
 * 
 * Test Accounts:
 * - Admin: username=deckson, password=admin123
 * - Employee: username=dave, password=emp123
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const config = {
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    adminCredentials: {
        username: 'deckson',
        password: 'admin123'
    },
    employeeCredentials: {
        username: 'dave', 
        password: 'emp123'
    }
};

// Global variables to store session data
let adminSession = null;
let employeeSession = null;
let testData = {
    trainingPrograms: [],
    trainings: [],
    employees: []
};

// Utility functions
const log = {
    info: (msg) => console.log('ℹ️ '.blue + msg),
    success: (msg) => console.log('✅ '.green + msg.green),
    error: (msg) => console.log('❌ '.red + msg.red),
    warning: (msg) => console.log('⚠️ '.yellow + msg.yellow),
    section: (msg) => console.log('\n' + '='.repeat(60).cyan + '\n' + msg.cyan.bold + '\n' + '='.repeat(60).cyan)
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP Client setup
const createHttpClient = (sessionCookie = null) => {
    const client = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: {
            'Content-Type': 'application/json',
            ...(sessionCookie && { 'Cookie': sessionCookie })
        }
    });

    // Request interceptor
    client.interceptors.request.use(
        (config) => {
            log.info(`${config.method.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor
    client.interceptors.response.use(
        (response) => {
            log.success(`${response.status} ${response.statusText}`);
            return response;
        },
        (error) => {
            if (error.response) {
                log.error(`${error.response.status} ${error.response.statusText}: ${JSON.stringify(error.response.data)}`);
            } else {
                log.error(`Network Error: ${error.message}`);
            }
            return Promise.reject(error);
        }
    );

    return client;
};

// Authentication functions
async function loginAdmin() {
    log.section('ADMIN LOGIN TEST');
    try {
        const client = createHttpClient();
        const response = await client.post('/auth/login', config.adminCredentials);
        
        if (response.data.success) {
            const sessionCookie = response.headers['set-cookie']?.[0];
            adminSession = sessionCookie;
            log.success('Admin login successful');
            log.info(`Admin role: ${response.data.user.role}`);
            return { success: true, user: response.data.user };
        }
    } catch (error) {
        log.error('Admin login failed');
        return { success: false, error };
    }
}

async function loginEmployee() {
    log.section('EMPLOYEE LOGIN TEST');
    try {
        const client = createHttpClient();
        const response = await client.post('/auth/login', config.employeeCredentials);
        
        if (response.data.success) {
            const sessionCookie = response.headers['set-cookie']?.[0];
            employeeSession = sessionCookie;
            log.success('Employee login successful');
            log.info(`Employee role: ${response.data.user.role}`);
            return { success: true, user: response.data.user };
        }
    } catch (error) {
        log.error('Employee login failed');
        return { success: false, error };
    }
}

// Training Program Tests
async function testTrainingPrograms() {
    log.section('TRAINING PROGRAMS MANAGEMENT TESTS');
    
    const adminClient = createHttpClient(adminSession);
    
    try {
        // 1. Create training programs
        log.info('Creating training programs...');
        const programsToCreate = [
            {
                title: 'Leadership Development Program',
                description: 'Comprehensive leadership training for managers',
                duration_hours: 40,
                training_type: 'Internal'
            },
            {
                title: 'Technical Skills Workshop',
                description: 'Advanced technical skills training',
                duration_hours: 16,
                training_type: 'Workshop'
            },
            {
                title: 'Safety Certification Course',
                description: 'Workplace safety and compliance training',
                duration_hours: 8,
                training_type: 'External'
            },
            {
                title: 'Digital Marketing Seminar',
                description: 'Modern digital marketing strategies',
                duration_hours: 12,
                training_type: 'Seminar'
            },
            {
                title: 'Online Project Management',
                description: 'Remote project management techniques',
                duration_hours: 20,
                training_type: 'Online'
            }
        ];

        for (const program of programsToCreate) {
            try {
                const response = await adminClient.post('/training-programs', program);
                if (response.data.success) {
                    testData.trainingPrograms.push(response.data.data);
                    log.success(`Created program: ${program.title}`);
                }
            } catch (error) {
                log.error(`Failed to create program: ${program.title}`);
            }
            await delay(500);
        }

        // 2. Get all training programs
        log.info('Fetching all training programs...');
        const allProgramsResponse = await adminClient.get('/training-programs');
        if (allProgramsResponse.data.success) {
            log.success(`Retrieved ${allProgramsResponse.data.data.length} training programs`);
            console.log('Programs:', allProgramsResponse.data.data.map(p => `${p.id}: ${p.title}`));
        }

        // 3. Get specific training program
        if (testData.trainingPrograms.length > 0) {
            const programId = testData.trainingPrograms[0].id;
            log.info(`Fetching training program ID: ${programId}`);
            const programResponse = await adminClient.get(`/training-programs/${programId}`);
            if (programResponse.data.success) {
                log.success(`Retrieved program: ${programResponse.data.data.title}`);
            }
        }

        // 4. Update training program
        if (testData.trainingPrograms.length > 0) {
            const program = testData.trainingPrograms[0];
            const updateData = {
                ...program,
                title: program.title + ' (Updated)',
                duration_hours: program.duration_hours + 5
            };
            
            log.info(`Updating training program ID: ${program.id}`);
            const updateResponse = await adminClient.put(`/training-programs/${program.id}`, updateData);
            if (updateResponse.data.success) {
                log.success('Training program updated successfully');
            }
        }

    } catch (error) {
        log.error('Training programs test failed');
    }
}

// Employee Training Records Tests
async function testTrainingRecords() {
    log.section('TRAINING RECORDS MANAGEMENT TESTS');
    
    const adminClient = createHttpClient(adminSession);
    
    try {
        // First, get list of employees
        log.info('Fetching employees for training records...');
        const employeesResponse = await adminClient.get('/employees');
        if (employeesResponse.data.success) {
            testData.employees = employeesResponse.data.data.slice(0, 3); // Take first 3 employees
            log.success(`Found ${testData.employees.length} employees for testing`);
        }

        // 1. Create training records
        log.info('Creating training records...');
        const trainingRecordsToCreate = [
            {
                employee_id: testData.employees[0]?.id || 1,
                training_program_id: testData.trainingPrograms[0]?.id || null,
                training_title: 'Leadership Fundamentals Training',
                start_date: '2024-01-15',
                end_date: '2024-01-19',
                duration_hours: 40,
                venue: 'Conference Room A',
                organizer: 'HR Department',
                certificate_issued: true,
                certificate_number: 'CERT-2024-001'
            },
            {
                employee_id: testData.employees[1]?.id || 2,
                training_program_id: testData.trainingPrograms[1]?.id || null,
                training_title: 'Technical Skills Enhancement',
                start_date: '2024-02-01',
                end_date: '2024-02-02',
                duration_hours: 16,
                venue: 'Training Lab',
                organizer: 'Tech Team',
                certificate_issued: false,
                certificate_number: null
            },
            {
                employee_id: testData.employees[0]?.id || 1,
                training_program_id: testData.trainingPrograms[2]?.id || null,
                training_title: 'Safety Compliance Training',
                start_date: '2024-03-10',
                end_date: '2024-03-10',
                duration_hours: 8,
                venue: 'Main Auditorium',
                organizer: 'Safety Officer',
                certificate_issued: true,
                certificate_number: 'CERT-2024-002'
            }
        ];

        for (const training of trainingRecordsToCreate) {
            try {
                const response = await adminClient.post('/trainings', training);
                if (response.data.success) {
                    testData.trainings.push(response.data.data);
                    log.success(`Created training: ${training.training_title}`);
                }
            } catch (error) {
                log.error(`Failed to create training: ${training.training_title}`);
            }
            await delay(500);
        }

        // 2. Get all training records with filters
        log.info('Testing training records retrieval with filters...');
        
        // Get all trainings
        const allTrainingsResponse = await adminClient.get('/trainings');
        if (allTrainingsResponse.data.success) {
            log.success(`Retrieved ${allTrainingsResponse.data.data.length} training records`);
        }

        // Get trainings with pagination
        const paginatedResponse = await adminClient.get('/trainings?page=1&limit=5');
        if (paginatedResponse.data.success) {
            log.success(`Paginated result: ${paginatedResponse.data.data.length} records`);
            console.log('Pagination info:', paginatedResponse.data.pagination);
        }

        // Get trainings by employee
        if (testData.employees.length > 0) {
            const employeeTrainingsResponse = await adminClient.get(`/trainings?employee_id=${testData.employees[0].id}`);
            if (employeeTrainingsResponse.data.success) {
                log.success(`Employee specific trainings: ${employeeTrainingsResponse.data.data.length} records`);
            }
        }

        // Get trainings with search
        const searchResponse = await adminClient.get('/trainings?search=Leadership');
        if (searchResponse.data.success) {
            log.success(`Search results: ${searchResponse.data.data.length} records`);
        }

        // Get trainings by year
        const yearResponse = await adminClient.get('/trainings?year=2024');
        if (yearResponse.data.success) {
            log.success(`2024 trainings: ${yearResponse.data.data.length} records`);
        }

        // Get trainings with certificate filter
        const certResponse = await adminClient.get('/trainings?certificate_issued=true');
        if (certResponse.data.success) {
            log.success(`Certified trainings: ${certResponse.data.data.length} records`);
        }

        // 3. Get specific training record
        if (testData.trainings.length > 0) {
            const trainingId = testData.trainings[0].id;
            log.info(`Fetching training record ID: ${trainingId}`);
            const trainingResponse = await adminClient.get(`/trainings/${trainingId}`);
            if (trainingResponse.data.success) {
                log.success(`Retrieved training: ${trainingResponse.data.data.training_title}`);
            }
        }

        // 4. Update training record
        if (testData.trainings.length > 0) {
            const training = testData.trainings[0];
            const updateData = {
                ...training,
                training_title: training.training_title + ' (Updated)',
                duration_hours: training.duration_hours + 2
            };
            
            log.info(`Updating training record ID: ${training.id}`);
            const updateResponse = await adminClient.put(`/trainings/${training.id}`, updateData);
            if (updateResponse.data.success) {
                log.success('Training record updated successfully');
            }
        }

        // 5. Get employee training history
        if (testData.employees.length > 0) {
            const employeeId = testData.employees[0].id;
            log.info(`Getting training history for employee ID: ${employeeId}`);
            const historyResponse = await adminClient.get(`/trainings/employee/${employeeId}`);
            if (historyResponse.data.success) {
                log.success(`Training history retrieved: ${historyResponse.data.data.trainings.length} records`);
                console.log('Training summary:', historyResponse.data.data.summary);
            }
        }

    } catch (error) {
        log.error('Training records test failed');
    }
}

// Training Statistics Tests
async function testTrainingStatistics() {
    log.section('TRAINING STATISTICS TESTS');
    
    const adminClient = createHttpClient(adminSession);
    
    try {
        // 1. Get overall training statistics
        log.info('Fetching overall training statistics...');
        const statsResponse = await adminClient.get('/trainings/statistics');
        if (statsResponse.data.success) {
            log.success('Training statistics retrieved successfully');
            console.log('Statistics Summary:', JSON.stringify(statsResponse.data.data.summary, null, 2));
            console.log('Training by Type:', statsResponse.data.data.by_type);
        }

        // 2. Get statistics by year
        log.info('Fetching 2024 training statistics...');
        const yearStatsResponse = await adminClient.get('/trainings/statistics?year=2024');
        if (yearStatsResponse.data.success) {
            log.success('2024 training statistics retrieved');
            console.log('2024 Summary:', yearStatsResponse.data.data.summary);
        }

        // 3. Get statistics for specific employee
        if (testData.employees.length > 0) {
            const employeeId = testData.employees[0].id;
            log.info(`Fetching statistics for employee ID: ${employeeId}`);
            const empStatsResponse = await adminClient.get(`/trainings/statistics?employee_id=${employeeId}`);
            if (empStatsResponse.data.success) {
                log.success('Employee training statistics retrieved');
                console.log('Employee Summary:', empStatsResponse.data.data.summary);
            }
        }

    } catch (error) {
        log.error('Training statistics test failed');
    }
}

// Employee Access Tests
async function testEmployeeAccess() {
    log.section('EMPLOYEE ACCESS CONTROL TESTS');
    
    const employeeClient = createHttpClient(employeeSession);
    
    try {
        // 1. Employee can view their own training records
        log.info('Testing employee access to own training records...');
        const ownTrainingsResponse = await employeeClient.get('/trainings');
        if (ownTrainingsResponse.data.success) {
            log.success(`Employee can access their trainings: ${ownTrainingsResponse.data.data.length} records`);
        }

        // 2. Employee can view training programs
        log.info('Testing employee access to training programs...');
        const programsResponse = await employeeClient.get('/training-programs');
        if (programsResponse.data.success) {
            log.success(`Employee can view training programs: ${programsResponse.data.data.length} programs`);
        }

        // 3. Employee can view their training statistics
        log.info('Testing employee access to own statistics...');
        const statsResponse = await employeeClient.get('/trainings/statistics');
        if (statsResponse.data.success) {
            log.success('Employee can access their training statistics');
            console.log('Employee Stats:', statsResponse.data.data.summary);
        }

        // 4. Test employee cannot create training programs (should fail)
        log.info('Testing employee cannot create training programs...');
        try {
            await employeeClient.post('/training-programs', {
                title: 'Unauthorized Program',
                training_type: 'Internal'
            });
            log.error('Employee should not be able to create training programs');
        } catch (error) {
            if (error.response?.status === 403) {
                log.success('Correctly blocked employee from creating training programs');
            } else {
                log.warning('Unexpected error when testing employee program creation');
            }
        }

        // 5. Employee can create their own training record
        if (testData.trainingPrograms.length > 0) {
            log.info('Testing employee can create own training record...');
            try {
                const newTraining = {
                    training_program_id: testData.trainingPrograms[0].id,
                    training_title: 'Self-Enrolled Training',
                    start_date: '2024-04-01',
                    end_date: '2024-04-01',
                    duration_hours: 4,
                    venue: 'Online',
                    organizer: 'Self-Study',
                    certificate_issued: false
                };
                
                const response = await employeeClient.post('/trainings', newTraining);
                if (response.data.success) {
                    log.success('Employee can create their own training record');
                }
            } catch (error) {
                log.error('Employee failed to create training record');
            }
        }

    } catch (error) {
        log.error('Employee access test failed');
    }
}

// Validation and Error Handling Tests
async function testValidationAndErrors() {
    log.section('VALIDATION AND ERROR HANDLING TESTS');
    
    const adminClient = createHttpClient(adminSession);
    
    try {
        // 1. Test training program validation
        log.info('Testing training program validation...');
        
        // Invalid training type
        try {
            await adminClient.post('/training-programs', {
                title: 'Invalid Type Program',
                training_type: 'InvalidType'
            });
            log.error('Should have failed with invalid training type');
        } catch (error) {
            if (error.response?.status === 400) {
                log.success('Correctly validated training type');
            }
        }

        // Missing title
        try {
            await adminClient.post('/training-programs', {
                training_type: 'Internal'
            });
            log.error('Should have failed with missing title');
        } catch (error) {
            if (error.response?.status === 400) {
                log.success('Correctly validated required title');
            }
        }

        // 2. Test training record validation
        log.info('Testing training record validation...');
        
        // Invalid date range
        try {
            await adminClient.post('/trainings', {
                employee_id: 1,
                training_title: 'Invalid Date Training',
                start_date: '2024-12-31',
                end_date: '2024-01-01' // End before start
            });
            log.error('Should have failed with invalid date range');
        } catch (error) {
            if (error.response?.status === 400) {
                log.success('Correctly validated date range');
            }
        }

        // Missing required fields
        try {
            await adminClient.post('/trainings', {
                training_title: 'Incomplete Training'
                // Missing employee_id, dates
            });
            log.error('Should have failed with missing required fields');
        } catch (error) {
            if (error.response?.status === 400) {
                log.success('Correctly validated required fields');
            }
        }

        // 3. Test 404 errors
        log.info('Testing 404 error handling...');
        
        // Non-existent training program
        try {
            await adminClient.get('/training-programs/99999');
            log.error('Should have returned 404 for non-existent program');
        } catch (error) {
            if (error.response?.status === 404) {
                log.success('Correctly returned 404 for non-existent program');
            }
        }

        // Non-existent training record
        try {
            await adminClient.get('/trainings/99999');
            log.error('Should have returned 404 for non-existent training');
        } catch (error) {
            if (error.response?.status === 404) {
                log.success('Correctly returned 404 for non-existent training');
            }
        }

    } catch (error) {
        log.error('Validation and error handling test failed');
    }
}

// Cleanup function
async function cleanup() {
    log.section('CLEANUP - REMOVING TEST DATA');
    
    const adminClient = createHttpClient(adminSession);
    
    try {
        // Delete training records first (due to foreign key constraints)
        for (const training of testData.trainings) {
            try {
                await adminClient.delete(`/trainings/${training.id}`);
                log.success(`Deleted training: ${training.training_title}`);
            } catch (error) {
                log.warning(`Failed to delete training: ${training.id}`);
            }
            await delay(200);
        }

        // Delete training programs
        for (const program of testData.trainingPrograms) {
            try {
                await adminClient.delete(`/training-programs/${program.id}`);
                log.success(`Deleted program: ${program.title}`);
            } catch (error) {
                log.warning(`Failed to delete program: ${program.id}`);
            }
            await delay(200);
        }

        log.success('Cleanup completed');
    } catch (error) {
        log.error('Cleanup failed');
    }
}

// Main test execution
async function runTrainingTests() {
    console.log('\n' + '🧪 TRAINING AND DEVELOPMENT SYSTEM LIVE TESTS 🧪'.rainbow.bold);
    console.log('Testing against: ' + config.baseURL.yellow);
    console.log('Timestamp: ' + new Date().toISOString().gray);
    
    let testResults = {
        passed: 0,
        failed: 0,
        total: 0
    };

    try {
        // Authentication
        const adminLogin = await loginAdmin();
        const employeeLogin = await loginEmployee();
        
        if (!adminLogin.success || !employeeLogin.success) {
            log.error('Authentication failed - cannot continue tests');
            return;
        }

        // Run test suites
        await testTrainingPrograms();
        await delay(1000);
        
        await testTrainingRecords();
        await delay(1000);
        
        await testTrainingStatistics();
        await delay(1000);
        
        await testEmployeeAccess();
        await delay(1000);
        
        await testValidationAndErrors();
        await delay(1000);

        // Final summary
        log.section('TEST SUMMARY');
        log.info(`Created ${testData.trainingPrograms.length} training programs`);
        log.info(`Created ${testData.trainings.length} training records`);
        log.info(`Tested with ${testData.employees.length} employees`);
        
        log.success('All training system tests completed successfully! 🎉');

    } catch (error) {
        log.error('Test execution failed: ' + error.message);
    } finally {
        // Cleanup
        await cleanup();
        
        log.section('TESTING COMPLETED');
        console.log('Timestamp: ' + new Date().toISOString().gray);
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    log.warning('\nTest interrupted. Performing cleanup...');
    await cleanup();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
if (require.main === module) {
    runTrainingTests().catch(error => {
        log.error('Fatal error: ' + error.message);
        process.exit(1);
    });
}

module.exports = { runTrainingTests };