// Debug script to test monetization process
const {
  executeQuery,
  findOne,
  executeTransaction,
} = require("./config/database");
const CompensationBenefitService = require("./services/compensationBenefitService");

async function debugMonetization() {
  console.log("🔍 Starting monetization debug...");

  // Test employee ID (using an actual employee ID)
  const testEmployeeId = 46;
  const testDays = 5;
  const testProcessedBy = 36; // Use actual admin user ID

  try {
    // 1. Check if employee exists
    console.log("\n1. Checking if employee exists...");
    const employeeCheck = await findOne(
      "SELECT id, first_name, last_name, current_monthly_salary FROM employees WHERE id = ?",
      [testEmployeeId]
    );
    if (!employeeCheck.success || !employeeCheck.data) {
      console.log("❌ Employee not found");
      return;
    }
    console.log("✅ Employee found:", employeeCheck.data);

    // 2. Check current leave balance
    console.log("\n2. Checking current leave balance...");
    const balanceCheck = await findOne(
      "SELECT * FROM employee_leave_balances WHERE employee_id = ? AND leave_type_id = 7 AND year = YEAR(CURDATE())",
      [testEmployeeId]
    );
    console.log("Leave balance result:", balanceCheck);

    // 3. If no balance record exists, create one
    if (!balanceCheck.success || !balanceCheck.data) {
      console.log("\n3. Creating leave balance record...");
      const createBalance = await executeQuery(
        `INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, earned_days, current_balance) 
                 VALUES (?, 7, YEAR(CURDATE()), 15, 15)`,
        [testEmployeeId]
      );
      console.log("Create balance result:", createBalance);
    }

    // 4. Test the monetization calculation
    console.log("\n4. Testing monetization calculation...");
    const service = new CompensationBenefitService();
    const calculation = await service.calculateMonetization(
      testEmployeeId,
      testDays
    );
    console.log("Calculation result:", calculation);

    // 5. Test the full monetization process
    console.log("\n5. Testing full monetization process...");
    const processResult = await service.processMonetization(
      testEmployeeId,
      testDays,
      testProcessedBy,
      "Debug test"
    );
    console.log("Process result:", processResult);

    // 6. Check the updated balance
    console.log("\n6. Checking updated leave balance...");
    const updatedBalance = await findOne(
      "SELECT * FROM employee_leave_balances WHERE employee_id = ? AND leave_type_id = 7 AND year = YEAR(CURDATE())",
      [testEmployeeId]
    );
    console.log("Updated balance:", updatedBalance);

    // 7. Check the compensation record
    console.log("\n7. Checking compensation record...");
    const compRecord = await findOne(
      "SELECT * FROM comp_benefit_records WHERE employee_id = ? ORDER BY id DESC LIMIT 1",
      [testEmployeeId]
    );
    console.log("Compensation record:", compRecord);
  } catch (error) {
    console.error("❌ Debug error:", error);
  }
}

// Run the debug
debugMonetization()
  .then(() => {
    console.log("\n🏁 Debug completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });
