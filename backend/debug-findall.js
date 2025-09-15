/**
 * Debug findAll method
 */

const { Training } = require('./models/Training');

async function debugFindAll() {
    console.log('🔍 Testing findAll with different filters...\n');

    try {
        // Test 1: No filters
        console.log('1. Testing with no filters...');
        const result1 = await Training.findAll({});
        console.log(`Result 1: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result1.success) console.log('Error 1:', result1.error);

        // Test 2: With certificate_issued filter
        console.log('\n2. Testing with certificate_issued filter...');
        const result2 = await Training.findAll({ certificate_issued: true });
        console.log(`Result 2: ${result2.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result2.success) console.log('Error 2:', result2.error);

        // Test 3: With year filter
        console.log('\n3. Testing with year filter...');
        const result3 = await Training.findAll({ year: 2024 });
        console.log(`Result 3: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result3.success) console.log('Error 3:', result3.error);

        // Test 4: With combined filters (the failing case)
        console.log('\n4. Testing with combined filters (certificate_issued + year)...');
        const result4 = await Training.findAll({ certificate_issued: true, year: 2024 });
        console.log(`Result 4: ${result4.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result4.success) console.log('Error 4:', result4.error);

    } catch (error) {
        console.error('❌ Debug test failed:', error);
    }
}

if (require.main === module) {
    debugFindAll().then(() => {
        console.log('\n🏁 Debug test completed');
        process.exit(0);
    });
}