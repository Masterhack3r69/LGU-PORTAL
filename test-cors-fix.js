#!/usr/bin/env node

/**
 * CORS Testing and Troubleshooting Script
 * This script tests various CORS scenarios to ensure proper configuration
 */

const http = require('http');
const https = require('https');

const BACKEND_URL = 'http://10.0.0.73:3000';
const FRONTEND_URL = 'http://10.0.0.73:5173';

// ANSI color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'CORS-Test-Script/1.0',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.data) {
            req.write(options.data);
        }

        req.end();
    });
}

async function testCORS() {
    log('\n🔍 CORS Configuration Test Suite', 'bold');
    log('=====================================\n', 'blue');

    const tests = [
        {
            name: 'Health Check (No Origin)',
            url: `${BACKEND_URL}/health`,
            headers: {}
        },
        {
            name: 'Health Check (Frontend Origin)',
            url: `${BACKEND_URL}/health`,
            headers: {
                'Origin': FRONTEND_URL
            }
        },
        {
            name: 'Preflight Request',
            url: `${BACKEND_URL}/api/auth/profile`,
            method: 'OPTIONS',
            headers: {
                'Origin': FRONTEND_URL,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        },
        {
            name: 'API Endpoint Test',
            url: `${BACKEND_URL}/api/auth/profile`,
            headers: {
                'Origin': FRONTEND_URL,
                'Content-Type': 'application/json'
            }
        }
    ];

    for (const test of tests) {
        try {
            log(`🧪 Testing: ${test.name}`, 'yellow');
            
            const response = await makeRequest(test.url, {
                method: test.method,
                headers: test.headers
            });

            log(`   Status: ${response.statusCode}`, response.statusCode < 400 ? 'green' : 'red');
            
            // Check important CORS headers
            const corsHeaders = {
                'access-control-allow-origin': response.headers['access-control-allow-origin'],
                'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
                'access-control-allow-methods': response.headers['access-control-allow-methods'],
                'access-control-allow-headers': response.headers['access-control-allow-headers']
            };

            Object.entries(corsHeaders).forEach(([header, value]) => {
                if (value) {
                    log(`   ${header}: ${value}`, 'green');
                }
            });

            if (test.headers.Origin && !response.headers['access-control-allow-origin']) {
                log('   ⚠️  WARNING: No Access-Control-Allow-Origin header found', 'red');
            }

        } catch (error) {
            log(`   ❌ ERROR: ${error.message}`, 'red');
        }
        
        log(''); // Empty line for separation
    }
}

async function validateConfiguration() {
    log('🔧 Configuration Validation', 'bold');
    log('==========================\n', 'blue');

    try {
        // Test if servers are running
        log('🔍 Checking server status...', 'yellow');
        
        const backendResponse = await makeRequest(`${BACKEND_URL}/health`);
        log(`   ✅ Backend server: Running (Status: ${backendResponse.statusCode})`, 'green');
        
        // Try to parse health response
        try {
            const healthData = JSON.parse(backendResponse.data);
            log(`   Environment: ${healthData.environment}`, 'blue');
            log(`   Database: ${healthData.database?.status}`, 'blue');
        } catch (e) {
            // Ignore JSON parse errors
        }

    } catch (error) {
        log(`   ❌ Backend server: Not responding (${error.message})`, 'red');
        return false;
    }

    return true;
}

async function main() {
    log('🚀 CORS Troubleshooting Tool', 'bold');
    log('============================\n', 'blue');
    
    const isValid = await validateConfiguration();
    
    if (isValid) {
        await testCORS();
        
        log('💡 Tips for resolving CORS issues:', 'bold');
        log('==================================', 'blue');
        log('1. Ensure your frontend is making requests to http://10.0.0.73:3000/api');
        log('2. Check that cookies/credentials are enabled (withCredentials: true)');
        log('3. Verify the Origin header matches your frontend URL exactly');
        log('4. Clear browser cache and restart both servers if issues persist');
        log('5. Check browser developer tools Network tab for detailed error messages\n');
        
        log('✅ CORS test completed!', 'green');
    } else {
        log('❌ Server validation failed. Please start the backend server first.', 'red');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testCORS, validateConfiguration };