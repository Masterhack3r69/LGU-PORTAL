const { BenefitType, BenefitCycle, BenefitItem } = require('./models/Benefits');
const Employee = require('./models/Employee');
const benefitsCalculationService = require('./services/benefitsCalculationService');

async function debugBenefitProcessing() {
  try {
    console.log('🔍 Starting benefit processing debug...\n');

    // 1. Get first available benefit cycle
    console.log('1. Getting benefit cycles...');
    const cycles = await BenefitCycle.findAll();
    if (!cycles.success || cycles.data.length === 0) {
      console.log('❌ No benefit cycles found');
      return;
    }
    
    const cycle = cycles.data[0];
    console.log(`✅ Found cycle: ${cycle.cycle_name} (ID: ${cycle.id})`);

    // 2. Get benefit type
    console.log('\n2. Getting benefit type...');
    const benefitType = await BenefitType.findById(cycle.benefit_type_id);
    if (!benefitType.success) {
      console.log('❌ Benefit type not found');
      return;
    }
    console.log(`✅ Benefit type: ${benefitType.data.name} (${benefitType.data.calculation_type})`);

    // 3. Get eligible employees
    console.log('\n3. Getting eligible employees...');
    const eligibleResult = await benefitsCalculationService.getEligibleEmployees(
      benefitType.data, 
      cycle.cutoff_date
    );
    
    if (!eligibleResult.success) {
      console.log('❌ Failed to get eligible employees:', eligibleResult.error);
      return;
    }
    
    const employees = eligibleResult.data;
    console.log(`✅ Found ${employees.length} eligible employees`);
    
    if (employees.length === 0) {
      console.log('❌ No eligible employees found');
      return;
    }

    // 4. Take first employee for testing
    const testEmployee = employees[0];
    console.log(`\n4. Testing calculation for: ${testEmployee.full_name} (ID: ${testEmployee.id})`);
    console.log('Employee data:', JSON.stringify(testEmployee, null, 2));
    
    // Get full employee record from database
    console.log('\n4b. Getting full employee record from database...');
    const fullEmployeeResult = await Employee.findById(testEmployee.id);
    if (fullEmployeeResult.success) {
      console.log('Full employee data:', JSON.stringify(fullEmployeeResult.data, null, 2));
    } else {
      console.log('Failed to get full employee data:', fullEmployeeResult.error);
    }

    // 5. Calculate benefits
    console.log('\n5. Calculating benefits...');
    // Use the full employee record for calculation
    const employeeForCalc = fullEmployeeResult.success ? fullEmployeeResult.data : testEmployee;
    const calculations = await benefitsCalculationService.bulkCalculateBenefits(
      [employeeForCalc], 
      benefitType.data, 
      { cutoffDate: cycle.cutoff_date }
    );

    console.log('Calculation results:', JSON.stringify(calculations, null, 2));

    if (calculations.length === 0 || !calculations[0].success) {
      console.log('❌ Calculation failed');
      return;
    }

    const calc = calculations[0];
    console.log(`✅ Calculation successful: ₱${calc.calculation.calculated_amount}`);

    // 6. Create benefit item
    console.log('\n6. Creating benefit item...');
    const benefitItemData = {
      benefit_cycle_id: cycle.id,
      employee_id: calc.employee_id,
      base_salary: calc.calculation.base_salary,
      service_months: calc.calculation.service_months,
      calculated_amount: calc.calculation.calculated_amount,
      final_amount: calc.calculation.final_amount,
      tax_amount: calc.calculation.tax_amount,
      net_amount: calc.calculation.net_amount,
      calculation_basis: calc.calculation.calculation_basis,
      status: 'Calculated',
      is_eligible: calc.calculation.is_eligible,
      eligibility_notes: calc.calculation.eligibility_notes
    };

    console.log('Creating BenefitItem with data:', JSON.stringify(benefitItemData, null, 2));

    const benefitItem = new BenefitItem(benefitItemData);
    const saveResult = await benefitItem.save();
    
    if (saveResult.success) {
      console.log(`✅ Benefit item created successfully: ID ${saveResult.data.id}`);
      
      // Verify it was saved to database
      console.log('\n7. Verifying database save...');
      const verifyResult = await BenefitItem.findById(saveResult.data.id);
      if (verifyResult.success) {
        console.log('✅ Benefit item verified in database');
        console.log('Saved item:', JSON.stringify(verifyResult.data, null, 2));
      } else {
        console.log('❌ Failed to verify benefit item in database');
      }
    } else {
      console.log('❌ Failed to create benefit item:', saveResult.error);
      if (saveResult.details) {
        console.log('Details:', saveResult.details);
      }
    }

    // 8. Check all benefit items for this cycle
    console.log('\n8. Checking all items for this cycle...');
    const allItemsResult = await BenefitItem.findAll({ benefit_cycle_id: cycle.id });
    if (allItemsResult.success) {
      console.log(`Found ${allItemsResult.data.length} total items for cycle ${cycle.id}`);
      allItemsResult.data.forEach(item => {
        console.log(`- Item ID: ${item.id}, Employee: ${item.employee_id}, Amount: ₱${item.final_amount}`);
      });
    } else {
      console.log('❌ Failed to get items for cycle');
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugBenefitProcessing().then(() => {
  console.log('\n🔍 Debug completed');
  process.exit(0);
}).catch(console.error);