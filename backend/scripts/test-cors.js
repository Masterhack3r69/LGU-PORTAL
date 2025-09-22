#!/usr/bin/env node

/**
 * CORS Testing Script
 * 
 * This script tests CORS functionality for the EMS backend server.
 * Run this script to verify that CORS is working correctly.
 * 
 * Usage: node scripts/test-cors.js
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.API_BASE_URL || 'http://10.0.0.73:3000';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://10.0.0.73:5173';

console.log('🧪 EMS CORS Testing Script');
console.log('=' .repeat(50));
console.log(`🎯 Backend URL: ${BASE_URL}`);
console.log(`🌐 Frontend Origin: ${FRONTEND_ORIGIN}`);
console.log('=' .repeat(50));

// Test endpoints to check
const endpoints = [
    '/health',
    '/api/payroll/periods',
    '/api/payroll/items',
    '/api/payroll/allowance-types',
    '/api/payroll/deduction-types'
];

async function testCORS(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'OPTIONS',
            headers: {
                'Origin': FRONTEND_ORIGIN,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const result = {
                    endpoint,
                    status: res.statusCode,
                    headers: res.headers,
                    allowOrigin: res.headers['access-control-allow-origin'],
                    allowCredentials: res.headers['access-control-allow-credentials'],
                    allowMethods: res.headers['access-control-allow-methods'],
                    allowHeaders: res.headers['access-control-allow-headers']
                };
                resolve(result);
            });
        });

        req.on('error', (err) => {
            reject({ endpoint, error: err.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject({ endpoint, error: 'Request timeout' });
        });

        req.end();
    });
}

async function testHealthEndpoint() {
    return new Promise((resolve, reject) => {
        const url = new URL('/health', BASE_URL);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (err) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject({ error: err.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject({ error: 'Request timeout' });
        });

        req.end();
    });
}

async function runTests() {
    console.log('\n1️⃣  Testing backend connectivity...');
    
    try {
        const healthResult = await testHealthEndpoint();
        if (healthResult.status === 200) {
            console.log('✅ Backend server is responding');
            console.log(`   Status: ${healthResult.data.status}`);
            console.log(`   Environment: ${healthResult.data.environment}`);
        } else {
            console.log(`❌ Backend server responded with status: ${healthResult.status}`);
            return;
        }
    } catch (err) {
        console.log(`❌ Backend server is not accessible: ${err.error}`);
        console.log('\n💡 Troubleshooting steps:');
        console.log('   1. Check if backend server is running: npm run dev');
        console.log('   2. Verify server is listening on correct port');
        console.log('   3. Check firewall/network connectivity');
        return;
    }

    console.log('\n2️⃣  Testing CORS configuration...');
    
    let allPassed = true;
    
    for (const endpoint of endpoints) {
        try {
            const result = await testCORS(endpoint);
            
            if (result.status === 200 || result.status === 204) {
                const corsOk = result.allowOrigin === FRONTEND_ORIGIN && 
                              result.allowCredentials === 'true';
                
                if (corsOk) {
                    console.log(`✅ ${endpoint} - CORS OK`);
                } else {
                    console.log(`⚠️  ${endpoint} - CORS Issues:`);
                    console.log(`   Allow-Origin: ${result.allowOrigin} (expected: ${FRONTEND_ORIGIN})`);
                    console.log(`   Allow-Credentials: ${result.allowCredentials} (expected: true)`);
                    allPassed = false;
                }
            } else {
                console.log(`❌ ${endpoint} - HTTP ${result.status}`);
                allPassed = false;
            }
        } catch (err) {
            console.log(`❌ ${endpoint} - Error: ${err.error}`);
            allPassed = false;
        }
    }

    console.log('\n' + '=' .repeat(50));
    
    if (allPassed) {
        console.log('🎉 All CORS tests passed! Your configuration is working correctly.');
    } else {
        console.log('⚠️  Some CORS tests failed. Check the issues above.');
        console.log('\n💡 Common solutions:');
        console.log('   1. Restart the backend server');
        console.log('   2. Check CORS_ORIGINS in backend/.env');
        console.log('   3. Verify NODE_ENV setting');
        console.log('   4. Review server.js CORS configuration');
    }
    
    console.log('\n📋 Current Configuration:');
    console.log(`   Backend Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Backend URL: ${BASE_URL}`);
    console.log(`   Frontend Origin: ${FRONTEND_ORIGIN}`);
}

// Run the tests
runTests().catch(console.error);