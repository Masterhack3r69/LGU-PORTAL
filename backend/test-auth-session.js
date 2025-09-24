// test-auth-session.js - Test authentication and session handling
const axios = require('axios');

const API_BASE_URL = 'http://10.0.0.73:3000/api';

// Create axios instance with session support
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testAuthFlow() {
  try {
    console.log('🔍 Testing Authentication Flow...\n');

    // Step 1: Check session without login
    console.log('1. Checking session without login...');
    try {
      const sessionCheck = await api.get('/auth/check-session');
      console.log('   Session check result:', sessionCheck.data);
    } catch (error) {
      console.log('   Expected: No active session -', error.response?.status, error.response?.data?.message);
    }

    // Step 2: Try to access import template without login
    console.log('\n2. Trying to access import template without login...');
    try {
      const templateResponse = await api.get('/import/employees/template');
      console.log('   Unexpected: Template access allowed without login');
    } catch (error) {
      console.log('   Expected: 401 Unauthorized -', error.response?.status, error.response?.data?.message);
    }

    // Step 3: Login with admin credentials
    console.log('\n3. Attempting login with admin credentials...');
    try {
      const loginResponse = await api.post('/auth/login', {
        username: 'admin',
        password: 'Admin@123'
      });
      console.log('   Login successful:', loginResponse.data);
    } catch (error) {
      console.log('   Login failed:', error.response?.status, error.response?.data?.message);
      console.log('   Note: Make sure admin user exists with username "admin" and password "admin123"');
      return;
    }

    // Step 4: Check session after login
    console.log('\n4. Checking session after login...');
    try {
      const sessionCheck = await api.get('/auth/check-session');
      console.log('   Session check result:', sessionCheck.data);
    } catch (error) {
      console.log('   Session check failed:', error.response?.status, error.response?.data?.message);
    }

    // Step 5: Try to access import template after login
    console.log('\n5. Trying to access import template after login...');
    try {
      const templateResponse = await api.get('/import/employees/template', {
        responseType: 'blob'
      });
      console.log('   Template access successful - Content-Type:', templateResponse.headers['content-type']);
      console.log('   Content-Length:', templateResponse.headers['content-length']);
    } catch (error) {
      console.log('   Template access failed:', error.response?.status, error.response?.data?.message);
    }

    // Step 6: Logout
    console.log('\n6. Logging out...');
    try {
      await api.post('/auth/logout');
      console.log('   Logout successful');
    } catch (error) {
      console.log('   Logout failed:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();