const axios = require('axios');

const main = async () => {
    try {
        // First login as admin
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'deckson',
            password: 'admin123'
        }, { withCredentials: true });

        // Extract session cookie
        let sessionCookie = '';
        const setCookieHeader = loginResponse.headers['set-cookie'];
        if (setCookieHeader) {
            const sessionCookieMatch = setCookieHeader.find(cookie => cookie.startsWith('ems_session='));
            if (sessionCookieMatch) {
                sessionCookie = sessionCookieMatch.split(';')[0];
            }
        }

        console.log('Login successful, cookie:', sessionCookie.substring(0, 50) + '...');

        // Now try to get TLB records
        const response = await axios.get('http://localhost:3000/api/tlb?page=1&limit=10', {
            headers: { 'Cookie': sessionCookie },
            withCredentials: true
        });

        console.log('TLB request successful:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data);
    }
};

main();