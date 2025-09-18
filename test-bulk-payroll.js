// Test script for bulk payroll processing
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  period_id: 7, // Use an existing payroll period ID
  employee_ids: [37], // Use an existing employee ID
  selected_allowance_types: [2, 3, 4], // Use existing allowance type IDs
  selected_deduction_types: [1, 2, 3, 4] // Use existing deduction type IDs
};

async function testBulkPayroll() {
  try {
    console.log('Testing bulk payroll processing...');
    console.log('Test data:', testData);
    
    const response = await axios.post(`${BASE_URL}/payroll-system/bulk-process`, testData);
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testBulkPayroll();