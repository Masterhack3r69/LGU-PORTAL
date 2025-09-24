// Test script for new TLB formula: Total Leave Earned × Highest Salary × Constant Factor
const { executeQuery, findOne } = require('./config/database');
const CompensationBenefitService = require('./services/compensationBenefitService');

async function testNewTLBFormula() {
    console.log('🧪 Testing New TLB Formula: Total Leave Earned × Highest Salary × Constant Factor\n');
    
    const service = new CompensationBenefitService();
    
    try {
        // Find an employee with resigned/terminated/retired status
        const employeeQuery = `
            SELECT e.id, e.employee_number, e.first_name, e.last_name, 
                   e.employment_status, e.current_monthly_salary, e.highest_monthly_salary
            FROM employees e 
            WHERE e.employment_status IN ('Resigned', 'Terminated', 'Retired') 
            AND e.deleted_at IS NULL 
            LIMIT 1
        `;
        
        const employeeResult = await findOne(employeeQuery);
        if (!employeeResult.success || !employeeResult.data) {
            console.log('❌ No eligible employee found. Creating test scenario...');
            
            // Create a test scenario with a resigned employee
            const testEmployeeId = await createTestEmployee();
            await createTestLeaveBalance(testEmployeeId);
            
            console.log(`✅ Created test employee ID: ${testEmployeeId}`);
            
            // Test the calculation
            await testTLBCalculation(service, testEmployeeId);
        } else {
            const employee = employeeResult.data;
            console.log(`📋 Testing with existing employee: ${employee.first_name} ${employee.last_name} (${employee.employee_number})`);
            console.log(`   Status: ${employee.employment_status}`);
            console.log(`   Current Salary: ₱${parseFloat(employee.current_monthly_salary).toLocaleString()}`);
            console.log(`   Highest Salary: ₱${parseFloat(employee.highest_monthly_salary || employee.current_monthly_salary).toLocaleString()}\n`);
            
            await testTLBCalculation(service, employee.id);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function createTestEmployee() {
    const insertQuery = `
        INSERT INTO employees (
            employee_number, first_name, last_name, email, 
            current_monthly_salary, highest_monthly_salary, 
            employment_status, appointment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        'TEST-TLB-001',
        'Test',
        'Employee',
        'test.tlb@company.com',
        55000.00,
        65000.00,
        'Resigned',
        '2020-01-15'
    ];
    
    const result = await executeQuery(insertQuery, params);
    return result.data.insertId;
}

async function createTestLeaveBalance(employeeId) {
    // Get vacation leave type ID
    const leaveTypeQuery = `SELECT id FROM leave_types WHERE name = 'Vacation Leave' LIMIT 1`;
    const leaveTypeResult = await findOne(leaveTypeQuery);
    
    if (!leaveTypeResult.success || !leaveTypeResult.data) {
        throw new Error('Vacation Leave type not found');
    }
    
    const leaveTypeId = leaveTypeResult.data.id;
    
    // Create leave balance with earned days
    const insertBalanceQuery = `
        INSERT INTO employee_leave_balances (
            employee_id, leave_type_id, year, earned_days, 
            used_days, current_balance
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const earnedDays = 30.0; // Total leave earned
    const usedDays = 12.0;   // Days used
    const currentBalance = earnedDays - usedDays; // Remaining balance
    
    const params = [
        employeeId,
        leaveTypeId,
        new Date().getFullYear(),
        earnedDays,
        usedDays,
        currentBalance
    ];
    
    await executeQuery(insertBalanceQuery, params);
    
    console.log(`✅ Created leave balance:`);
    console.log(`   Total Earned: ${earnedDays} days`);
    console.log(`   Used: ${usedDays} days`);
    console.log(`   Current Balance: ${currentBalance} days\n`);
}

async function testTLBCalculation(service, employeeId) {
    console.log('🔢 Testing TLB Calculation...\n');
    
    // Get employee leave balance details
    const leaveQuery = `
        SELECT elb.earned_days, elb.used_days, elb.current_balance
        FROM employee_leave_balances elb
        JOIN leave_types lt ON elb.leave_type_id = lt.id
        WHERE elb.employee_id = ? AND lt.name = 'Vacation Leave' AND elb.year = YEAR(CURDATE())
    `;
    
    const leaveResult = await findOne(leaveQuery, [employeeId]);
    if (leaveResult.success && leaveResult.data) {
        const leave = leaveResult.data;
        console.log(`📊 Leave Balance Details:`);
        console.log(`   Total Earned: ${leave.earned_days} days`);
        console.log(`   Used: ${leave.used_days} days`);
        console.log(`   Current Balance (Unused): ${leave.current_balance} days\n`);
    }
    
    // Calculate TLB using new formula
    const result = await service.calculateTerminalLeave(employeeId);
    
    if (result.success) {
        const calculation = result.data;
        console.log('✅ TLB Calculation Successful!');
        console.log(`📋 Calculation Details:`);
        console.log(`   Employee ID: ${calculation.employee_id}`);
        console.log(`   Benefit Type: ${calculation.benefit_type}`);
        console.log(`   Days Used in Calculation: ${calculation.days_used} days`);
        console.log(`   Final Amount: ₱${calculation.amount.toLocaleString()}\n`);
        
        if (calculation.calculation_details) {
            const details = calculation.calculation_details;
            console.log(`🔍 Formula Breakdown:`);
            console.log(`   Total Leave Earned: ${details.total_leave_earned} days`);
            console.log(`   Highest Salary: ₱${details.highest_salary.toLocaleString()}`);
            console.log(`   Daily Rate: ₱${details.daily_rate.toLocaleString()}`);
            console.log(`   TLB Factor: ${details.tlb_factor}`);
            console.log(`   Formula: ${details.total_leave_earned} × ₱${details.daily_rate} × ${details.tlb_factor} = ₱${calculation.amount.toLocaleString()}\n`);
        }
        
        // Verify the calculation manually
        if (calculation.calculation_details) {
            const expected = calculation.calculation_details.total_leave_earned * 
                           calculation.calculation_details.daily_rate * 
                           calculation.calculation_details.tlb_factor;
            
            if (Math.abs(expected - calculation.amount) < 0.01) {
                console.log('✅ Manual verification: Calculation is correct!');
            } else {
                console.log(`❌ Manual verification failed: Expected ₱${expected.toFixed(2)}, Got ₱${calculation.amount}`);
            }
        }
        
    } else {
        console.log('❌ TLB Calculation Failed:', result.error);
    }
}

// Run the test
testNewTLBFormula().then(() => {
    console.log('\n🎉 TLB Formula Test Complete!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test Error:', error);
    process.exit(1);
});