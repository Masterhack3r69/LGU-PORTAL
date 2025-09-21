const { executeQuery } = require('./config/database');

async function testDirectInsert() {
  try {
    console.log('Testing direct SQL insert...');
    
    // Test 1: Try with just required columns
    console.log('\n1. Testing minimal insert...');
    const result1 = await executeQuery(`
      INSERT INTO benefit_items (benefit_cycle_id, employee_id, base_salary) 
      VALUES (?, ?, ?)
    `, [13, 37, 26906.00]);
    
    if (result1.success) {
      console.log('✅ Minimal insert successful! ID:', result1.data.insertId);
      
      // Clean up
      await executeQuery('DELETE FROM benefit_items WHERE id = ?', [result1.data.insertId]);
      console.log('✅ Test record cleaned up');
    } else {
      console.log('❌ Minimal insert failed:', result1.error);
    }
    
    // Test 2: Try with more columns
    console.log('\n2. Testing with more columns...');
    const result2 = await executeQuery(`
      INSERT INTO benefit_items 
      (benefit_cycle_id, employee_id, base_salary, service_months, calculated_amount, final_amount, net_amount, status, is_eligible) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [13, 37, 26906.00, 13, 0, 0, 0, 'Calculated', 1]);
    
    if (result2.success) {
      console.log('✅ Extended insert successful! ID:', result2.data.insertId);
      
      // Clean up
      await executeQuery('DELETE FROM benefit_items WHERE id = ?', [result2.data.insertId]);
      console.log('✅ Test record cleaned up');
    } else {
      console.log('❌ Extended insert failed:', result2.error);
    }
    
    // Test 3: Check if there are any existing records blocking unique constraint
    console.log('\n3. Checking for existing records...');
    const existingResult = await executeQuery(`
      SELECT * FROM benefit_items WHERE benefit_cycle_id = ? AND employee_id = ?
    `, [13, 37]);
    
    if (existingResult.success) {
      if (existingResult.data.length > 0) {
        console.log('⚠️ Found existing record(s):');
        existingResult.data.forEach(record => {
          console.log(`- ID: ${record.id}, Status: ${record.status}, Amount: ${record.final_amount}`);
        });
      } else {
        console.log('✅ No existing records found');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectInsert().then(() => process.exit(0));