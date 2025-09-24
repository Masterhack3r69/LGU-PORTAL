#!/usr/bin/env node

/**
 * Debug Script: Employee Payroll API Testing
 * 
 * This script tests the actual API endpoints to see what data is being returned
 * and helps identify why finalized payroll items are not displaying.
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class EmployeePayrollAPIDebugger {
  constructor() {
    this.baseURL = 'http://localhost:3000/api'; // Adjust as needed
    this.sessionCookie = null;
  }

  async prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async login() {
    console.log('🔐 Employee Login Required');
    console.log('=' .repeat(40));
    
    const username = await this.prompt('Enter employee username: ');
    const password = await this.prompt('Enter employee password: ');
    
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username,
        password
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Extract session cookie
        const cookies = response.headers['set-cookie'];
        if (cookies) {
          this.sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid'));
        }
        
        console.log('✅ Login successful');
        console.log('User:', response.data.data.user);
        return true;
      } else {
        console.log('❌ Login failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async makeAuthenticatedRequest(endpoint) {
    const headers = {};
    if (this.sessionCookie) {
      headers.Cookie = this.sessionCookie;
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error.response?.data || error.message);
      return null;
    }
  }

  async testEmployeePayrollPeriods() {
    console.log('\n🧪 Testing: GET /api/payroll/employee/periods');
    console.log('-' .repeat(50));
    
    const data = await this.makeAuthenticatedRequest('/payroll/employee/periods');
    
    if (data) {
      console.log('✅ Response received');
      console.log('Success:', data.success);
      console.log('Message:', data.message);
      console.log('Data type:', Array.isArray(data.data) ? 'Array' : typeof data.data);
      console.log('Periods count:', Array.isArray(data.data) ? data.data.length : 'N/A');
      
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log('\n📋 Periods found:');
        data.data.forEach((period, index) => {
          console.log(`  ${index + 1}. Period ${period.period_number} - ${period.year}/${period.month}`);
          console.log(`     Status: ${period.status}`);
          console.log(`     Dates: ${period.start_date} to ${period.end_date}`);
        });
      } else {
        console.log('⚠️  No periods found');
      }
    }
    
    return data;
  }

  async testEmployeePayrollItems(periodId = null) {
    const endpoint = periodId 
      ? `/payroll/employee/items?period_id=${periodId}`
      : '/payroll/employee/items';
      
    console.log(`\n🧪 Testing: GET ${endpoint}`);
    console.log('-' .repeat(50));
    
    const data = await this.makeAuthenticatedRequest(endpoint);
    
    if (data) {
      console.log('✅ Response received');
      console.log('Success:', data.success);
      console.log('Message:', data.message);
      console.log('Data type:', Array.isArray(data.data) ? 'Array' : typeof data.data);
      console.log('Items count:', Array.isArray(data.data) ? data.data.length : 'N/A');
      
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log('\n💰 Payroll items found:');
        data.data.forEach((item, index) => {
          console.log(`  ${index + 1}. Item ID: ${item.id}`);
          console.log(`     Status: ${item.status}`);
          console.log(`     Basic Pay: ₱${item.basic_pay?.toLocaleString()}`);
          console.log(`     Net Pay: ₱${item.net_pay?.toLocaleString()}`);
          console.log(`     Working Days: ${item.working_days}`);
          if (item.period) {
            console.log(`     Period: ${item.period.year}/${item.period.month} (${item.period.period_number})`);
          }
        });
        
        // Analyze status distribution
        const statusCounts = {};
        data.data.forEach(item => {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        });
        
        console.log('\n📊 Status Distribution:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`     ${status}: ${count} items`);
        });
        
        // Check for finalized items
        const finalizedItems = data.data.filter(item => 
          item.status?.toLowerCase() === 'finalized' || 
          item.status?.toLowerCase() === 'paid'
        );
        
        console.log(`\n🎯 Finalized/Paid Items: ${finalizedItems.length}`);
        if (finalizedItems.length > 0) {
          finalizedItems.forEach((item, index) => {
            console.log(`  ${index + 1}. Item ${item.id}: ${item.status} - ₱${item.net_pay?.toLocaleString()}`);
          });
        } else {
          console.log('⚠️  No finalized or paid items found - this is why the frontend shows no data!');
        }
        
      } else {
        console.log('⚠️  No payroll items found');
      }
    }
    
    return data;
  }

  async testSpecificPeriodItems(periods) {
    if (!periods || periods.length === 0) {
      console.log('\n⚠️  No periods to test');
      return;
    }

    console.log('\n🔍 Testing items for each period...');
    
    for (const period of periods) {
      console.log(`\n📅 Testing Period ${period.id} (${period.year}/${period.month})`);
      await this.testEmployeePayrollItems(period.id);
    }
  }

  async runDiagnostics() {
    console.log('🔍 Employee Payroll API Diagnostics');
    console.log('=' .repeat(60));
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without login');
      return;
    }

    // Test periods endpoint
    const periodsData = await this.testEmployeePayrollPeriods();
    
    // Test items endpoint (all items)
    const itemsData = await this.testEmployeePayrollItems();
    
    // Test items for specific periods
    if (periodsData?.data) {
      await this.testSpecificPeriodItems(periodsData.data);
    }

    // Summary and recommendations
    this.printDiagnosticSummary(periodsData, itemsData);
  }

  printDiagnosticSummary(periodsData, itemsData) {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('=' .repeat(60));
    
    const periodsCount = periodsData?.data?.length || 0;
    const itemsCount = itemsData?.data?.length || 0;
    
    console.log(`📊 Periods found: ${periodsCount}`);
    console.log(`💰 Total payroll items: ${itemsCount}`);
    
    if (itemsCount > 0) {
      const finalizedCount = itemsData.data.filter(item => 
        item.status?.toLowerCase() === 'finalized' || 
        item.status?.toLowerCase() === 'paid'
      ).length;
      
      console.log(`🎯 Finalized/Paid items: ${finalizedCount}`);
      
      if (finalizedCount === 0) {
        console.log('\n❌ ISSUE IDENTIFIED:');
        console.log('   • No finalized or paid payroll items found');
        console.log('   • This is why the frontend shows no data');
        console.log('\n🔧 SOLUTIONS:');
        console.log('   1. Admin needs to finalize payroll items');
        console.log('   2. Check payroll processing workflow');
        console.log('   3. Verify payroll item statuses in database');
        
        // Show current statuses
        const statusCounts = {};
        itemsData.data.forEach(item => {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        });
        
        console.log('\n📊 Current Status Distribution:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   • ${status}: ${count} items`);
        });
        
      } else {
        console.log('\n✅ FINALIZED ITEMS FOUND:');
        console.log('   • Items should be visible in frontend');
        console.log('   • Check frontend filtering logic');
        console.log('   • Check browser console for errors');
      }
    } else {
      console.log('\n❌ ISSUE IDENTIFIED:');
      console.log('   • No payroll items found for this employee');
      console.log('   • Employee may not have processed payroll');
      console.log('\n🔧 SOLUTIONS:');
      console.log('   1. Admin needs to process payroll for this employee');
      console.log('   2. Check if employee is included in payroll periods');
      console.log('   3. Verify employee ID mapping');
    }
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. If no finalized items: Use admin panel to finalize payroll');
    console.log('   2. If items exist but not showing: Check frontend console');
    console.log('   3. If no items at all: Process payroll for this employee');
  }
}

// Run diagnostics
if (require.main === module) {
  const debugger = new EmployeePayrollAPIDebugger();
  
  debugger.runDiagnostics().then(() => {
    rl.close();
    console.log('\n🏁 Diagnostics complete');
  }).catch(error => {
    console.error('💥 Diagnostics failed:', error);
    rl.close();
    process.exit(1);
  });
}

module.exports = EmployeePayrollAPIDebugger;