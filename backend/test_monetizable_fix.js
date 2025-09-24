// Test script to verify monetizable leave types fix
const { executeQuery, findOne } = require('./config/database');
const CompensationBenefitService = require('./services/compensationBenefitService');

async function testMonetizableFix() {
    console.log('🔍 Testing monetizable leave types fix...');
    
    const testEmployeeId = 46; // Ana Mendoza
    
    try {
        // 1. Check current leave balances for the employee
        console.log('\n1. Checking all leave balances for employee...');
        const allBalances = await executeQuery(`
            SELECT elb.*, lt.name, lt.code, lt.is_monetizable
            FROM employee_leave_balances elb
            JOIN leave_types lt ON elb.leave_type_id = lt.id
            WHERE elb.employee_id = ? AND elb.year = YEAR(CURDATE())
            ORDER BY lt.name
        `, [testEmployeeId]);
        
        console.log('All leave balances:', JSON.stringify(allBalances.data, null, 2));
        
        // 2. Test the getEmployeeLeaveBalance method
        console.log('\n2. Testing getEmployeeLeaveBalance method...');
        const service = new CompensationBenefitService();
        const leaveBalance = await service.getEmployeeLeaveBalance(testEmployeeId);
        console.log('Leave balance result:', leaveBalance);
        
        // 3. Calculate total monetizable vs total all
        const totalAll = allBalances.data.reduce((sum, balance) => sum + parseFloat(balance.current_balance), 0);
        const totalMonetizable = allBalances.data
            .filter(balance => balance.is_monetizable === 1)
            .reduce((sum, balance) => sum + parseFloat(balance.current_balance), 0);
            
        console.log('\n3. Balance comparison:');
        console.log(`Total all leave types: ${totalAll} days`);
        console.log(`Total monetizable only: ${totalMonetizable} days`);
        console.log(`System reports total: ${leaveBalance.data?.total_balance || 0} days`);
        
        // 4. Verify the fix
        if (leaveBalance.data?.total_balance === totalMonetizable) {
            console.log('✅ FIX VERIFIED: System correctly excludes non-monetizable leave types');
        } else {
            console.log('❌ FIX FAILED: System still includes non-monetizable leave types');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Run the test
testMonetizableFix().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});