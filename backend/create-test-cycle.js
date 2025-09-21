const { BenefitType, BenefitCycle } = require('./models/Benefits');

async function createTestCycle() {
  try {
    console.log('Getting benefit types...');
    const types = await BenefitType.findAll();
    
    if (types.success && types.data.length > 0) {
      console.log('Available benefit types:');
      types.data.forEach(type => {
        console.log(`- ID: ${type.id}, Name: ${type.name}, Code: ${type.code}`);
      });
      
      const firstType = types.data[0];
      console.log(`\nCreating test cycle for: ${firstType.name}`);
      
      const cycleData = {
        benefit_type_id: firstType.id,
        cycle_year: 2024,
        cycle_name: '2024 Test Cycle',
        applicable_date: '2024-12-31',
        payment_date: '2025-01-15',
        cutoff_date: '2024-12-31',
        status: 'Draft',
        created_by: 1 // Assuming user ID 1 exists
      };
      
      const cycle = new BenefitCycle(cycleData);
      const result = await cycle.save();
      
      if (result.success) {
        console.log('Test cycle created successfully:', result.data.id);
      } else {
        console.log('Failed to create cycle:', result.error);
        if (result.details) {
          console.log('Details:', result.details);
        }
      }
    }
    
    console.log('\nGetting all cycles...');
    const cycles = await BenefitCycle.findAll();
    if (cycles.success) {
      console.log('Available cycles:');
      cycles.data.forEach(cycle => {
        console.log(`- ID: ${cycle.id}, Name: ${cycle.cycle_name}, Status: ${cycle.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestCycle().then(() => process.exit(0));