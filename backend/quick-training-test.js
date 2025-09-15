/**
 * Quick Training System Workflow Test
 * Focused test for core training functionality
 * 
 * Usage: node quick-training-test.js
 */

const axios = require('axios');
const colors = require('colors');

const config = {
    baseURL: 'http://localhost:3000/api',
    admin: { username: 'deckson', password: 'admin123' },
    employee: { username: 'dave', password: 'emp123' }
};

const log = {
    info: (msg) => console.log('ℹ️ '.blue + msg),
    success: (msg) => console.log('✅ '.green + msg.green),
    error: (msg) => console.log('❌ '.red + msg.red),
    title: (msg) => console.log('\n' + '📋 '.yellow + msg.yellow.bold)
};

let adminSession = null;

async function runQuickTest() {
    console.log('\n🚀 QUICK TRAINING SYSTEM TEST'.rainbow.bold);
    
    try {
        // 1. Admin Login
        log.title('STEP 1: Admin Authentication');
        const loginResponse = await axios.post(`${config.baseURL}/auth/login`, config.admin);
        adminSession = loginResponse.headers['set-cookie']?.[0];
        log.success(`Admin logged in: ${loginResponse.data.user?.first_name || 'Unknown'}`);

        const client = axios.create({
            baseURL: config.baseURL,
            headers: { 'Cookie': adminSession }
        });

        // 2. Create Training Program
        log.title('STEP 2: Create Training Program');
        const programData = {
            title: 'Quick Test Leadership Program',
            description: 'Test program for workflow verification',
            duration_hours: 24,
            training_type: 'Internal'
        };
        
        const programResponse = await client.post('/training-programs', programData);
        const programId = programResponse.data.data?.id;
        if (!programId) {
            throw new Error('Failed to get program ID: ' + JSON.stringify(programResponse.data));
        }
        log.success(`Created program ID: ${programId}`);

        // 3. Get Employees
        log.title('STEP 3: Get Employee for Training');
        const employeesResponse = await client.get('/employees?limit=1');
        const employee = employeesResponse.data.data[0];
        log.success(`Found employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);

        // 4. Create Training Record
        log.title('STEP 4: Create Training Record');
        const trainingData = {
            employee_id: employee.id,
            training_program_id: programId,
            training_title: 'Leadership Skills Development',
            start_date: '2024-01-15',
            end_date: '2024-01-17',
            duration_hours: 24,
            venue: 'Main Conference Room',
            organizer: 'HR Department',
            certificate_issued: true,
            certificate_number: 'CERT-TEST-001'
        };
        
        const trainingResponse = await client.post('/trainings', trainingData);
        const trainingId = trainingResponse.data.data?.id;
        if (!trainingId) {
            throw new Error('Failed to get training ID: ' + JSON.stringify(trainingResponse.data));
        }
        log.success(`Created training record ID: ${trainingId}`);

        // 5. Retrieve and Verify Training
        log.title('STEP 5: Verify Training Record');
        const getTrainingResponse = await client.get(`/trainings/${trainingId}`);
        const training = getTrainingResponse.data.data;
        log.success(`Retrieved: ${training?.training_title || 'Unknown'}`);
        log.info(`Employee: ${training?.employee_name || 'Unknown'}`);
        log.info(`Program: ${training?.program_title || 'Unknown'}`);
        log.info(`Certificate: ${training?.certificate_issued ? 'Yes' : 'No'}`);

        // 6. Get Training Statistics
        log.title('STEP 6: Check Training Statistics');
        const statsResponse = await client.get('/trainings/statistics');
        const stats = statsResponse.data.data.summary;
        log.success(`Total trainings: ${stats.total_trainings}`);
        log.success(`Total hours: ${stats.total_hours}`);
        log.success(`Certificates issued: ${stats.certificates_issued}`);

        // 7. Get Employee Training History
        log.title('STEP 7: Employee Training History');
        const historyResponse = await client.get(`/trainings/employee/${employee.id}`);
        const history = historyResponse.data.data;
        log.success(`Employee has ${history.trainings.length} training records`);
        log.success(`Total training hours: ${history.summary.total_hours}`);

        // 8. Update Training Record
        log.title('STEP 8: Update Training Record');
        const updateData = {
            ...trainingData,
            training_title: 'Advanced Leadership Skills Development',
            duration_hours: 30
        };
        
        await client.put(`/trainings/${trainingId}`, updateData);
        log.success('Training record updated successfully');

        // 9. Test Filtering
        log.title('STEP 9: Test Training Filters');
        const filteredResponse = await client.get('/trainings?certificate_issued=true&year=2024');
        log.success(`Found ${filteredResponse.data.data.length} certified trainings in 2024`);

        // 10. Cleanup
        log.title('STEP 10: Cleanup Test Data');
        await client.delete(`/trainings/${trainingId}`);
        log.success('Training record deleted');
        
        await client.delete(`/training-programs/${programId}`);
        log.success('Training program deleted');

        console.log('\n🎉 ALL TESTS PASSED! Training system is working correctly.'.green.bold);

    } catch (error) {
        log.error('Test failed: ' + (error.response?.data?.error || error.message));
        console.log('Error details:', error.response?.data);
        process.exit(1);
    }
}

if (require.main === module) {
    runQuickTest();
}