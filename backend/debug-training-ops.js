/**
 * Debug Training Database Operations
 */

const { TrainingProgram, Training } = require('./models/Training');

async function debugTrainingOperations() {
    console.log('🔍 Testing Training Database Operations...\n');

    try {
        // Test 1: Create a training program
        console.log('1. Creating a training program...');
        const program = new TrainingProgram({
            title: 'Debug Test Program',
            description: 'Test program for debugging',
            duration_hours: 10,
            training_type: 'Internal'
        });

        const programResult = await program.save();
        console.log('Program creation result:', programResult);
        
        if (programResult.success) {
            console.log(`✅ Program created with ID: ${programResult.data.id}`);
            
            // Test 2: Create a training record
            console.log('\n2. Creating a training record...');
            const training = new Training({
                employee_id: 36, // Using Dave's employee ID from the database check
                training_program_id: programResult.data.id,
                training_title: 'Debug Test Training',
                start_date: '2024-01-15',
                end_date: '2024-01-15',
                duration_hours: 8,
                venue: 'Test Venue',
                organizer: 'Test Organizer',
                certificate_issued: true,
                certificate_number: 'DEBUG-001'
            });

            const trainingResult = await training.save();
            console.log('Training creation result:', trainingResult);
            
            if (trainingResult.success) {
                console.log(`✅ Training created with ID: ${trainingResult.data.id}`);
                
                // Test 3: Get training statistics
                console.log('\n3. Getting training statistics...');
                const statsResult = await Training.getStatistics();
                console.log('Statistics result:', JSON.stringify(statsResult, null, 2));
                
                // Test 4: Clean up
                console.log('\n4. Cleaning up...');
                await Training.delete(trainingResult.data.id);
                await TrainingProgram.delete(programResult.data.id);
                console.log('✅ Cleanup completed');
            } else {
                console.log('❌ Training creation failed');
            }
        } else {
            console.log('❌ Program creation failed');
        }

    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
}

if (require.main === module) {
    debugTrainingOperations().then(() => {
        console.log('\n🏁 Debug test completed');
        process.exit(0);
    });
}