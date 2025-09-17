// Quick test to debug the benefit submission API
const axios = require('axios');

async function testBenefitSubmission() {
    try {
        const testData = {
            employee_id: 37,
            year: 2025,
            selections: [
                {
                    benefit_type_id: 1,
                    selected_amount: 25000
                },
                {
                    benefit_type_id: 4,
                    selected_amount: 29830
                }
            ]
        };

        console.log('Testing benefit submission with data:', JSON.stringify(testData, null, 2));

        const response = await axios.post('http://10.0.0.73:3000/api/compensation-benefits/submit-selections', testData);

        console.log('✅ SUCCESS:', response.data);
    } catch (error) {
        console.log('❌ ERROR:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.message || error.message,
            errorDetails: error.response?.data
        });
    }
}

