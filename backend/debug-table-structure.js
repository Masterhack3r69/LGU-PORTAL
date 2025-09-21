const { executeQuery } = require('./config/database');

async function debugTableStructure() {
  try {
    // Get column information
    const result = await executeQuery(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'employee_management_system' 
      AND TABLE_NAME = 'benefit_items' 
      ORDER BY ORDINAL_POSITION
    `);

    if (result.success) {
      console.log('benefit_items table columns:');
      result.data.forEach((col, index) => {
        console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
      });
      
      console.log(`\nTotal columns: ${result.data.length}`);
      
      // Try a simple insert with all required fields
      console.log('\nTesting simple insert...');
      const insertSQL = `
        INSERT INTO benefit_items (
          benefit_cycle_id, employee_id, base_salary, service_months,
          calculated_amount, final_amount, net_amount, 
          calculation_basis, status, is_eligible
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [13, 37, 26906.00, 13, 0, 0, 0, 'Test insert', 'Calculated', 1];
      console.log('SQL:', insertSQL);
      console.log('Params:', insertParams);
      console.log('Param count:', insertParams.length);
      
      const insertResult = await executeQuery(insertSQL, insertParams);
      
      if (insertResult.success) {
        console.log('✅ Insert successful! ID:', insertResult.data.insertId);
        
        // Clean up
        await executeQuery('DELETE FROM benefit_items WHERE id = ?', [insertResult.data.insertId]);
        console.log('✅ Test record cleaned up');
      } else {
        console.log('❌ Insert failed:', insertResult.error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTableStructure().then(() => process.exit(0));