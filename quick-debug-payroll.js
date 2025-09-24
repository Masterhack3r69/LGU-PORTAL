#!/usr/bin/env node

/**
 * Quick Debug Script for Employee Payroll Issue
 * 
 * This script helps identify why finalized payroll items are not showing
 * by testing the data flow step by step.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'employee_management_system'
};

async function debugEmployeePayroll() {
  let connection;
  
  try {
    console.log('🔍 Quick Employee Payroll Debug');
    console.log('=' .repeat(50));
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // 1. Check if there are any payroll items at all
    console.log('\n1️⃣ Checking all payroll items...');
    const [allItems] = await connection.execute(`
      SELECT pi.id, pi.employee_id, pi.status, pi.net_pay, 
             e.first_name, e.last_name, e.employee_number,
             pp.year, pp.month, pp.period_number
      FROM payroll_items pi
      JOIN employees e ON pi.employee_id = e.id
      JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
      ORDER BY pp.year DESC, pp.month DESC, pi.id DESC
      LIMIT 10
    `);
    
    console.log(`   Found ${allItems.length} payroll items total`);
    if (allItems.length > 0) {
      console.log('   Recent items:');
      allItems.forEach(item => {
        console.log(`   • ${item.first_name} ${item.last_name} (${item.employee_number}): ${item.status} - ₱${item.net_pay}`);
      });
    }
    
    // 2. Check status distribution
    console.log('\n2️⃣ Checking status distribution...');
    const [statusDist] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM payroll_items
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('   Status distribution:');
    statusDist.forEach(row => {
      console.log(`   • ${row.status}: ${row.count} items`);
    });
    
    // 3. Check for finalized/paid items specifically
    console.log('\n3️⃣ Checking finalized/paid items...');
    const [finalizedItems] = await connection.execute(`
      SELECT pi.id, pi.employee_id, pi.status, pi.net_pay,
             e.first_name, e.last_name, e.employee_number,
             pp.year, pp.month, pp.period_number
      FROM payroll_items pi
      JOIN employees e ON pi.employee_id = e.id
      JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
      WHERE pi.status IN ('Finalized', 'Paid')
      ORDER BY pp.year DESC, pp.month DESC
    `);
    
    console.log(`   Found ${finalizedItems.length} finalized/paid items`);
    if (finalizedItems.length > 0) {
      console.log('   Finalized/Paid items:');
      finalizedItems.forEach(item => {
        console.log(`   • ${item.first_name} ${item.last_name} (${item.employee_number}): ${item.status} - ₱${item.net_pay}`);
      });
    } else {
      console.log('   ❌ NO FINALIZED/PAID ITEMS FOUND - This is the issue!');
    }
    
    // 4. Check users with employee role
    console.log('\n4️⃣ Checking employee users...');
    const [employeeUsers] = await connection.execute(`
      SELECT u.id, u.username, u.employee_id, u.role,
             e.first_name, e.last_name, e.employee_number
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.role = 'employee'
      ORDER BY u.id
      LIMIT 5
    `);
    
    console.log(`   Found ${employeeUsers.length} employee users`);
    employeeUsers.forEach(user => {
      console.log(`   • ${user.username} (ID: ${user.id}) -> Employee: ${user.first_name} ${user.last_name} (${user.employee_number})`);
    });
    
    // 5. Check if any employee users have finalized payroll
    if (employeeUsers.length > 0) {
      console.log('\n5️⃣ Checking payroll for employee users...');
      
      for (const user of employeeUsers.slice(0, 3)) { // Check first 3 users
        if (user.employee_id) {
          const [userPayroll] = await connection.execute(`
            SELECT pi.id, pi.status, pi.net_pay,
                   pp.year, pp.month, pp.period_number
            FROM payroll_items pi
            JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
            WHERE pi.employee_id = ?
            ORDER BY pp.year DESC, pp.month DESC
          `, [user.employee_id]);
          
          const finalizedCount = userPayroll.filter(item => 
            item.status === 'Finalized' || item.status === 'Paid'
          ).length;
          
          console.log(`   • ${user.first_name} ${user.last_name}: ${userPayroll.length} total, ${finalizedCount} finalized`);
          
          if (finalizedCount > 0) {
            console.log('     ✅ This user should see payroll data');
          } else if (userPayroll.length > 0) {
            console.log('     ⚠️  Has payroll but none finalized');
            userPayroll.forEach(item => {
              console.log(`       - ${item.year}/${item.month}: ${item.status}`);
            });
          } else {
            console.log('     ❌ No payroll data at all');
          }
        }
      }
    }
    
    // 6. Provide recommendations
    console.log('\n6️⃣ Recommendations:');
    if (finalizedItems.length === 0) {
      console.log('   ❌ ISSUE: No finalized payroll items exist');
      console.log('   🔧 SOLUTION: Admin needs to:');
      console.log('      1. Go to Payroll Processing page');
      console.log('      2. Process payroll (Draft -> Processed)');
      console.log('      3. Finalize payroll items (Processed -> Finalized)');
      console.log('      4. Optionally mark as paid (Finalized -> Paid)');
    } else {
      console.log('   ✅ Finalized items exist');
      console.log('   🔧 Check frontend:');
      console.log('      1. Browser console for errors');
      console.log('      2. Network tab for API calls');
      console.log('      3. Authentication/session issues');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the debug
debugEmployeePayroll();