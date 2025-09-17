# EMS Intranet Testing Guide

This guide helps you run the payroll and compensation & benefits test scripts in your intranet environment.

## Problem Solved

The test scripts were failing because they were configured for localhost but your EMS system runs on intranet IP `10.0.0.73:3000`.

## Changes Made

1. **Updated test scripts** to use intranet IP instead of localhost
2. **Fixed authentication** to use session-based auth instead of token-based
3. **Created setup scripts** to ensure test user exists
4. **Added intranet test runner** for comprehensive testing

## Prerequisites

1. **Backend server must be running** on `10.0.0.73:3000`
2. **Database must be accessible** and properly configured
3. **Test user 'deckson'** must exist (we'll create it if needed)

## Quick Start

### Option 1: Run All Tests (Recommended)

```bash
cd backend
npm run test:intranet
```

This runs:
- Environment verification
- Test user setup
- Server health check
- Quick payroll & C&B tests
- Live payroll & C&B tests
- Comprehensive reporting

### Option 2: Individual Test Scripts

```bash
# Setup test user first (run once)
npm run setup:test-user

# Run quick tests (2-3 minutes)
npm run test:payroll-cb-quick

# Run comprehensive tests (5-10 minutes)
npm run test:payroll-cb-live
```

## Step-by-Step Instructions

### 1. Start Backend Server

```bash
cd backend
npm run dev:intranet
```

The server should start on `http://10.0.0.73:3000`

### 2. Verify Server is Running

Open browser and go to: `http://10.0.0.73:3000/api/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": "...",
  "database": {
    "status": "connected"
  }
}
```

### 3. Setup Test User (First Time Only)

```bash
npm run setup:test-user
```

This creates:
- Username: `deckson`
- Password: `admin123`
- Role: `admin`

### 4. Run Tests

```bash
# Quick test (recommended first)
npm run test:payroll-cb-quick

# Comprehensive test
npm run test:payroll-cb-live

# All tests with full reporting
npm run test:intranet
```

## Expected Output

### Successful Quick Test
```
[timestamp] 🚀 EMS Quick Test Suite Starting...
[timestamp] ✅ System Authentication (123ms)
[timestamp] ✅ Test Data Setup (456ms)
[timestamp] ✅ Payroll Allowance Types Query (89ms)
[timestamp] ✅ Employee Allowances Query (67ms)
[timestamp] ✅ Automated Payroll Generation (1234ms)
[timestamp] ✅ Payroll Computation Retrieval (123ms)
[timestamp] ✅ Benefit Types Query (78ms)
[timestamp] ✅ Available Benefits Query (101ms)
[timestamp] ✅ Benefit Selection Process (234ms)
[timestamp] ✅ Benefit History Query (89ms)
[timestamp] ✅ System Independence Check (345ms)
[timestamp] ✅ Cross-System API Check (123ms)

📋 QUICK TEST RESULTS
==================================================
📊 Results Summary:
   Total Tests: 12
   ✅ Passed: 12
   ❌ Failed: 0
   Success Rate: 100.0%

🎯 QUICK STATUS:
   ✅ CORE SYSTEMS OPERATIONAL
   Essential payroll and benefits workflows are working.
```

## Troubleshooting

### Authentication Issues
```
❌ System Authentication: Invalid username or password
```

**Solution:** Run the user setup script:
```bash
npm run setup:test-user
```

### Server Connection Issues
```
❌ Server is not accessible
Error: connect ECONNREFUSED 10.0.0.73:3000
```

**Solution:** 
1. Make sure backend server is running: `npm run dev:intranet`
2. Check your network adapter is set to `10.0.0.73`
3. Verify CORS configuration allows intranet access

### Database Issues
```
❌ No active employees found
```

**Solution:** 
1. Check database connection in `.env`
2. Ensure database has sample data
3. Run database setup if needed

### Rate Limiting Issues
```
❌ Rate limit exceeded. Too many login attempts.
```

**Solution:** Wait 15 minutes or restart the server to reset rate limits.

## Network Configuration

If `10.0.0.73` is not available on your system:

1. **Check available IPs:**
   ```cmd
   ipconfig
   ```

2. **Update configuration files:**
   - `backend\.env` → Update `CORS_ORIGINS`
   - `frontend\.env` → Update `VITE_API_BASE_URL`
   - Test scripts will automatically use the new IP

3. **Set static IP:**
   - Go to Network Settings
   - Set static IP to `10.0.0.73`
   - Subnet: `255.255.255.0`

## Files Modified

1. `backend/scripts/quick-payroll-cb-test.js` - Fixed for intranet + session auth
2. `backend/scripts/live-payroll-cb-test.js` - Fixed for intranet + session auth
3. `backend/scripts/setup-test-user.js` - New: Creates test user
4. `backend/scripts/run-intranet-tests.js` - New: Comprehensive test runner
5. `backend/package.json` - Added new test scripts

## Test Coverage

The tests verify:

### Automated Payroll System
- ✅ Allowance types retrieval
- ✅ Employee allowances
- ✅ Payroll generation
- ✅ Computation validation

### Manual Compensation & Benefits
- ✅ Benefit types retrieval
- ✅ Available benefits
- ✅ Benefit selection
- ✅ Selection history

### System Integration
- ✅ Data separation
- ✅ API performance
- ✅ Database integrity
- ✅ Cross-system functionality

## Support

If you encounter issues:

1. **Check logs** in the backend terminal
2. **Verify network configuration** 
3. **Ensure database is running**
4. **Check .env file configuration**

The tests now properly handle your intranet environment and should work reliably with your `10.0.0.73:3000` setup!