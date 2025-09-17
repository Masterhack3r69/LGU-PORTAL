const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('../server');

// Integration tests for the complete EMS restructured system
describe('EMS System Integration Tests', () => {
  let dbConnection;
  let testEmployeeId;
  let testPeriodId;

  beforeAll(async () => {
    // Setup test database connection
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root', 
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ems_system_test'
    });

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await dbConnection.end();
  });

  async function setupTestData() {
    // Create test employee
    const [employeeResult] = await dbConnection.execute(`
      INSERT INTO employees (first_name, last_name, email, hire_date, position, department, basic_salary, status)
      VALUES ('John', 'Doe', 'john.doe@test.com', '2022-01-15', 'Software Engineer', 'IT', 50000.00, 'active')
    `);
    testEmployeeId = employeeResult.insertId;

    // Create test payroll period
    const [periodResult] = await dbConnection.execute(`
      INSERT INTO payroll_periods (period_name, start_date, end_date, pay_date, status)
      VALUES ('Test Period Jan 2024', '2024-01-01', '2024-01-31', '2024-02-05', 'open')
    `);
    testPeriodId = periodResult.insertId;

    // Setup payroll allowance types
    await dbConnection.execute(`
      INSERT INTO payroll_allowance_types (name, description, calculation_type, default_amount, is_active)
      VALUES 
      ('RATA', 'Rice and Transportation Allowance', 'fixed', 2000.00, 1),
      ('Medical Allowance', 'Medical coverage allowance', 'fixed', 1500.00, 1),
      ('Performance Bonus', 'Performance-based bonus', 'percentage', 10.00, 1)
    `);

    // Setup employee allowances
    const [allowanceTypes] = await dbConnection.execute(`
      SELECT id FROM payroll_allowance_types WHERE is_active = 1
    `);

    for (const allowanceType of allowanceTypes) {
      await dbConnection.execute(`
        INSERT INTO employee_payroll_allowances (employee_id, allowance_type_id, amount, effective_date, status)
        VALUES (?, ?, 
          CASE 
            WHEN ? = (SELECT id FROM payroll_allowance_types WHERE name = 'Performance Bonus') THEN 10.00
            ELSE (SELECT default_amount FROM payroll_allowance_types WHERE id = ?)
          END, 
          '2024-01-01', 'active')
      `, [testEmployeeId, allowanceType.id, allowanceType.id, allowanceType.id]);
    }

    // Setup benefit types
    await dbConnection.execute(`
      INSERT INTO cb_benefit_types (name, category, description, eligibility_criteria, max_amount, is_active)
      VALUES 
      ('Health Insurance', 'Health', 'Comprehensive health coverage', '{"tenure_months": 6}', 50000.00, 1),
      ('Life Insurance', 'Insurance', 'Life insurance coverage', '{"tenure_months": 12}', 100000.00, 1),
      ('Education Allowance', 'Education', 'Educational support', '{"tenure_months": 24}', 25000.00, 1)
    `);
  }

  async function cleanupTestData() {
    // Clean up in reverse order due to foreign key constraints
    await dbConnection.execute('DELETE FROM payroll_items WHERE employee_id = ?', [testEmployeeId]);
    await dbConnection.execute('DELETE FROM employee_benefit_selections WHERE employee_id = ?', [testEmployeeId]);
    await dbConnection.execute('DELETE FROM employee_payroll_allowances WHERE employee_id = ?', [testEmployeeId]);
    await dbConnection.execute('DELETE FROM payroll_periods WHERE id = ?', [testPeriodId]);
    await dbConnection.execute('DELETE FROM employees WHERE id = ?', [testEmployeeId]);
    await dbConnection.execute('DELETE FROM payroll_allowance_types WHERE name IN ("RATA", "Medical Allowance", "Performance Bonus")');
    await dbConnection.execute('DELETE FROM cb_benefit_types WHERE name IN ("Health Insurance", "Life Insurance", "Education Allowance")');
  }

  describe('Automated Payroll System Integration', () => {
    test('should generate automated payroll end-to-end', async () => {
      // Test the complete automated payroll generation workflow
      
      // Step 1: Generate automated payroll via API
      const payrollResponse = await request(app)
        .post('/api/payroll-system/generate-automated')
        .send({
          period_id: testPeriodId
        })
        .expect(200);

      expect(payrollResponse.body.success).toBe(true);
      expect(payrollResponse.body.data.employees_processed).toBeGreaterThan(0);
      expect(payrollResponse.body.data.period_id).toBe(testPeriodId);

      // Step 2: Verify payroll items were created
      const [payrollItems] = await dbConnection.execute(`
        SELECT * FROM payroll_items 
        WHERE employee_id = ? AND period_id = ?
      `, [testEmployeeId, testPeriodId]);

      expect(payrollItems.length).toBe(1);
      const payrollItem = payrollItems[0];
      
      // Verify basic salary
      expect(parseFloat(payrollItem.basic_salary)).toBe(50000.00);
      
      // Verify allowances were included
      expect(parseFloat(payrollItem.allowances)).toBeGreaterThan(0);
      
      // Verify government deductions were calculated
      expect(parseFloat(payrollItem.gsis_contribution)).toBeGreaterThan(0);
      expect(parseFloat(payrollItem.philhealth_contribution)).toBeGreaterThan(0);
      expect(parseFloat(payrollItem.pagibig_contribution)).toBeGreaterThan(0);
      
      // Verify net pay calculation
      const expectedGrossPay = parseFloat(payrollItem.basic_salary) + parseFloat(payrollItem.allowances);
      const totalDeductions = parseFloat(payrollItem.gsis_contribution) + 
                             parseFloat(payrollItem.philhealth_contribution) + 
                             parseFloat(payrollItem.pagibig_contribution) +
                             parseFloat(payrollItem.bir_tax);
      const expectedNetPay = expectedGrossPay - totalDeductions;
      
      expect(Math.abs(parseFloat(payrollItem.net_pay) - expectedNetPay)).toBeLessThan(0.01);
    });

    test('should retrieve payroll computations correctly', async () => {
      // Test retrieving payroll computations via API
      const response = await request(app)
        .get(`/api/payroll-system/computations/${testEmployeeId}`)
        .query({ period_id: testPeriodId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee_id).toBe(testEmployeeId);
      expect(response.body.data.period_id).toBe(testPeriodId);
      expect(response.body.data.payroll_computation).toBeDefined();
      
      const computation = response.body.data.payroll_computation;
      expect(computation.basic_salary).toBeDefined();
      expect(computation.allowances).toBeDefined();
      expect(computation.deductions).toBeDefined();
      expect(computation.net_pay).toBeDefined();
    });

    test('should manage employee allowances correctly', async () => {
      // Test retrieving employee allowances
      const getAllowancesResponse = await request(app)
        .get(`/api/payroll-system/allowances/${testEmployeeId}`)
        .expect(200);

      expect(getAllowancesResponse.body.success).toBe(true);
      expect(getAllowancesResponse.body.data.employee_id).toBe(testEmployeeId);
      expect(getAllowancesResponse.body.data.allowances.length).toBeGreaterThan(0);

      // Test updating an allowance
      const allowanceToUpdate = getAllowancesResponse.body.data.allowances[0];
      const newAmount = 2500.00;

      const updateResponse = await request(app)
        .put(`/api/payroll-system/allowances/${testEmployeeId}/${allowanceToUpdate.allowance_type_id}`)
        .send({
          amount: newAmount,
          effective_date: '2024-02-01'
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(parseFloat(updateResponse.body.data.amount)).toBe(newAmount);

      // Verify the update in database
      const [updatedAllowances] = await dbConnection.execute(`
        SELECT amount FROM employee_payroll_allowances 
        WHERE employee_id = ? AND allowance_type_id = ? AND status = 'active'
      `, [testEmployeeId, allowanceToUpdate.allowance_type_id]);

      expect(parseFloat(updatedAllowances[0].amount)).toBe(newAmount);
    });
  });

  describe('Manual Compensation & Benefits System Integration', () => {
    test('should retrieve available benefits with eligibility checking', async () => {
      // Test getting available benefits for the employee
      const response = await request(app)
        .get(`/api/compensation-benefits/available-benefits/${testEmployeeId}`)
        .query({ year: 2024 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee_id).toBe(testEmployeeId);
      expect(response.body.data.year).toBe(2024);
      expect(response.body.data.benefits_by_category).toBeDefined();

      // Check that benefits are categorized correctly
      const benefits = response.body.data.benefits_by_category;
      expect(benefits.Health).toBeDefined();
      expect(benefits.Insurance).toBeDefined();
      expect(benefits.Education).toBeDefined();

      // Check eligibility - employee should be eligible for Health Insurance (6+ months tenure)
      const healthBenefits = benefits.Health;
      const healthInsurance = healthBenefits.find(b => b.name === 'Health Insurance');
      expect(healthInsurance.is_eligible).toBe(true);

      // Employee should NOT be eligible for Education Allowance (requires 24+ months)
      const educationBenefits = benefits.Education;
      const educationAllowance = educationBenefits.find(b => b.name === 'Education Allowance');
      expect(educationAllowance.is_eligible).toBe(false);
    });

    test('should submit benefit selections successfully', async () => {
      // Test submitting benefit selections
      const selections = [
        {
          benefit_type_id: 1, // Health Insurance
          selected_amount: 40000.00
        }
      ];

      const response = await request(app)
        .post('/api/compensation-benefits/submit-selections')
        .send({
          employee_id: testEmployeeId,
          year: 2024,
          selections: selections
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee_id).toBe(testEmployeeId);
      expect(response.body.data.year).toBe(2024);
      expect(response.body.data.selections_count).toBe(1);

      // Verify the selection was saved in database
      const [savedSelections] = await dbConnection.execute(`
        SELECT * FROM employee_benefit_selections 
        WHERE employee_id = ? AND year = ? AND status = 'active'
      `, [testEmployeeId, 2024]);

      expect(savedSelections.length).toBe(1);
      expect(parseFloat(savedSelections[0].selected_amount)).toBe(40000.00);
    });

    test('should reject invalid benefit selections', async () => {
      // Test submitting selections that exceed maximum amounts
      const invalidSelections = [
        {
          benefit_type_id: 1, // Health Insurance (max 50000)
          selected_amount: 60000.00 // Exceeds maximum
        }
      ];

      const response = await request(app)
        .post('/api/compensation-benefits/submit-selections')
        .send({
          employee_id: testEmployeeId,
          year: 2024,
          selections: invalidSelections
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exceeds maximum');
    });

    test('should retrieve employee benefit history', async () => {
      // Test retrieving benefit history
      const response = await request(app)
        .get(`/api/compensation-benefits/history/${testEmployeeId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee_id).toBe(testEmployeeId);
      expect(response.body.data.benefit_history).toBeDefined();
      
      // Should have the health insurance selection from previous test
      const history = response.body.data.benefit_history;
      expect(history.length).toBeGreaterThan(0);
      
      const healthSelection = history.find(h => h.benefit_name === 'Health Insurance');
      expect(healthSelection).toBeDefined();
      expect(parseFloat(healthSelection.selected_amount)).toBe(40000.00);
    });
  });

  describe('System Integration and Data Flow', () => {
    test('should maintain data consistency between payroll and benefits', async () => {
      // Verify that payroll system and benefits system don't interfere with each other
      
      // Generate payroll again after benefit selections
      const payrollResponse = await request(app)
        .post('/api/payroll-system/generate-automated')
        .send({
          period_id: testPeriodId
        })
        .expect(200);

      expect(payrollResponse.body.success).toBe(true);

      // Verify benefit selections are still intact
      const benefitResponse = await request(app)
        .get(`/api/compensation-benefits/history/${testEmployeeId}`)
        .expect(200);

      expect(benefitResponse.body.success).toBe(true);
      expect(benefitResponse.body.data.benefit_history.length).toBeGreaterThan(0);

      // Verify payroll computations include allowances but not manual benefits
      const computationResponse = await request(app)
        .get(`/api/payroll-system/computations/${testEmployeeId}`)
        .query({ period_id: testPeriodId })
        .expect(200);

      const computation = computationResponse.body.data.payroll_computation;
      
      // Payroll should include automated allowances
      expect(parseFloat(computation.allowances)).toBeGreaterThan(0);
      
      // But should not include manual benefit selections
      // (benefits are selected separately and not part of regular payroll)
      const [benefitSelections] = await dbConnection.execute(`
        SELECT SUM(selected_amount) as total_benefits
        FROM employee_benefit_selections 
        WHERE employee_id = ? AND year = 2024 AND status = 'active'
      `, [testEmployeeId]);

      const totalBenefits = parseFloat(benefitSelections[0].total_benefits || 0);
      expect(totalBenefits).toBeGreaterThan(0); // Benefits exist
      
      // But benefits shouldn't be included in regular payroll allowances
      expect(parseFloat(computation.allowances)).not.toBe(totalBenefits);
    });

    test('should handle concurrent operations correctly', async () => {
      // Test that the system can handle concurrent payroll and benefit operations
      
      const promises = [
        // Concurrent payroll computation retrieval
        request(app)
          .get(`/api/payroll-system/computations/${testEmployeeId}`)
          .query({ period_id: testPeriodId }),
        
        // Concurrent benefit availability check
        request(app)
          .get(`/api/compensation-benefits/available-benefits/${testEmployeeId}`)
          .query({ year: 2024 }),
        
        // Concurrent allowance retrieval
        request(app)
          .get(`/api/payroll-system/allowances/${testEmployeeId}`)
      ];

      const results = await Promise.all(promises);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });
    });

    test('should validate API response formats', async () => {
      // Test that all API responses follow the expected format
      
      // Test payroll system API format
      const payrollResponse = await request(app)
        .get(`/api/payroll-system/computations/${testEmployeeId}`)
        .query({ period_id: testPeriodId })
        .expect(200);

      expect(payrollResponse.body).toHaveProperty('success');
      expect(payrollResponse.body).toHaveProperty('data');
      expect(payrollResponse.body.data).toHaveProperty('employee_id');
      expect(payrollResponse.body.data).toHaveProperty('payroll_computation');

      // Test benefits system API format
      const benefitResponse = await request(app)
        .get(`/api/compensation-benefits/available-benefits/${testEmployeeId}`)
        .query({ year: 2024 })
        .expect(200);

      expect(benefitResponse.body).toHaveProperty('success');
      expect(benefitResponse.body).toHaveProperty('data');
      expect(benefitResponse.body.data).toHaveProperty('employee_id');
      expect(benefitResponse.body.data).toHaveProperty('benefits_by_category');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid employee IDs gracefully', async () => {
      const invalidEmployeeId = 99999;

      // Test payroll system with invalid employee
      const payrollResponse = await request(app)
        .get(`/api/payroll-system/computations/${invalidEmployeeId}`)
        .query({ period_id: testPeriodId })
        .expect(404);

      expect(payrollResponse.body.success).toBe(false);
      expect(payrollResponse.body.message).toContain('not found');

      // Test benefits system with invalid employee
      const benefitResponse = await request(app)
        .get(`/api/compensation-benefits/available-benefits/${invalidEmployeeId}`)
        .query({ year: 2024 })
        .expect(404);

      expect(benefitResponse.body.success).toBe(false);
      expect(benefitResponse.body.message).toContain('not found');
    });

    test('should handle invalid period IDs gracefully', async () => {
      const invalidPeriodId = 99999;

      const response = await request(app)
        .post('/api/payroll-system/generate-automated')
        .send({
          period_id: invalidPeriodId
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Period not found');
    });

    test('should validate required fields in requests', async () => {
      // Test missing required fields in benefit submission
      const response = await request(app)
        .post('/api/compensation-benefits/submit-selections')
        .send({
          employee_id: testEmployeeId,
          // Missing year and selections
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });
});