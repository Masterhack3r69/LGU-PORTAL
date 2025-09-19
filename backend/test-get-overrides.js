// Test script to get all overrides
const axios = require('axios');

const BASE_URL = 'http://10.0.0.73:3000';
const ADMIN_CREDENTIALS = {
    username: 'deckson',
    password: 'admin123'
};

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testGetOverrides() {
    try {
        // Login
        console.log('Logging in...');
        const loginResponse = await api.post('/api/auth/login', ADMIN_CREDENTIALS);
        if (loginResponse.headers['set-cookie']) {
            api.defaults.headers.Cookie = loginResponse.headers['set-cookie'].join('; ');
        }

        // Get overrides
        console.log('Getting overrides...');
        const response = await api.get('/api/payroll/overrides');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testGetOverrides();