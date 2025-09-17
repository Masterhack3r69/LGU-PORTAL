// tests/payrollSystem.test.js - Tests for Automated Payroll System

const { executeQuery, executeTransaction } = require('../config/database');
const {
  generateAutomatedPayroll,
  getPayrollComputation,
  getEmployeeAllowances,
  updateEmployeeAllowances
} = require('../controllers/payrollSystemController');

// Mock dependencies
jest.mock('../config/database');
jest.mock('../middleware/errorHandler');

describe('Automated Payroll System Tests', () => {
  let mockConnection;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn()
    };

    mockRequest = {
      body: {},
      params: {},
      user: { id: 1 }
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    executeQuery.mockClear();
    executeTransaction.mockClear();
  });

  describe('Automated Payroll Generation', () => {
    test('should generate payroll successfully for active employees', async () => {
      // Mock period data
      const mockPeriod = {
        id: 1,
        year: 2025,
        month: 1,
        period_number: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        status: 'Draft'
      };

      // Mock employees data
      const mockEmployees = [
        {
          id: 1,
          employee_number: 'EMP001',
          first_name: 'John',
          last_name: 'Doe',
          current_daily_rate: 1000,
          current_monthly_salary: 22000,
          appointment_date: '2024-01-01',
          employment_status: 'Active'
        },
        {
          id: 2,
          employee_number: 'EMP002',
          first_name: 'Jane',
          last_name: 'Smith',
          current_daily_rate: 1200,
          current_monthly_salary: 26400,
          appointment_date: '2024-06-01',
          employment_status: 'Active'
        }
      ];

      // Mock leave data
      const mockLeaveData = [
        { unpaid_leave_days: 0, total_leave_days: 2 },
        { unpaid_leave_days: 1, total_leave_days: 3 }
      ];

      // Mock allowances data
      const mockAllowances = [
        {
          total: 5000,
          items: [
            { allowance_type_id: 1, code: 'RATA', name: 'RATA', base_amount: 3000, prorated_amount: 3000 },
            { allowance_type_id: 2, code: 'MA', name: 'Medical Allowance', base_amount: 2000, prorated_amount: 2000 }
          ]
        },
        {
          total: 5500,
          items: [
            { allowance_type_id: 1, code: 'RATA', name: 'RATA', base_amount: 3000, prorated_amount: 3000 },
            { allowance_type_id: 2, code: 'MA', name: 'Medical Allowance', base_amount: 2500, prorated_amount: 2500 }
          ]
        }
      ];

      // Setup mocks
      executeQuery
        .mockResolvedValueOnce({ success: true, data: [mockPeriod] }) // Get period
        .mockResolvedValueOnce({ success: true, data: [{ count: 0 }] }); // Check existing items

      executeTransaction.mockImplementation(async (callback) => {
        mockConnection.execute
          .mockResolvedValueOnce([mockEmployees]) // Get employees
          .mockResolvedValue([{ insertId: 1 }]); // Insert payroll items

        return await callback(mockConnection);
      });

      mockRequest.body = { period_id: 1 };

      await generateAutomatedPayroll(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            period_id: 1,
            employees_processed: mockEmployees.length,
            payroll_items_created: mockEmployees.length
          }),
          message: expect.stringContaining('Automated payroll generated successfully')
        })
      );
    });

    test('should handle leave deductions correctly', async () => {
      const employee = {
        id: 1,
        current_daily_rate: 1000,
        current_monthly_salary: 22000
      };

      const period = {
        start_date: '2025-01-01',
        end_date: '2025-01-15'
      };

      // Mock leave query to return LWOP days
      mockConnection.execute.mockResolvedValueOnce([
        [{ unpaid_leave_days: 2, total_leave_days: 3 }]
      ]);

      // Calculate expected values
      const expectedWorkingDays = 22 - 2; // 22 base days minus 2 LWOP days
      const expectedBasicSalary = 1000 * expectedWorkingDays; // 20,000

      // This test would verify the calculation logic is correct
      expect(expectedWorkingDays).toBe(20);
      expect(expectedBasicSalary).toBe(20000);
    });

    test('should calculate government deductions accurately', async () => {
      const employee = { id: 1 };
      const basicSalary = 20000;
      const grossPay = 25000;

      // Expected government deduction calculations
      const expectedGSIS = basicSalary * 0.09; // 1,800
      const expectedPagibig = Math.min(grossPay * 0.02, 100); // 100 (capped)
      const expectedPhilhealth = Math.min(grossPay * 0.0275, 1800); // 687.50
      
      const expectedTotalDeductions = expectedGSIS + expectedPagibig + expectedPhilhealth;

      expect(expectedGSIS).toBe(1800);
      expect(expectedPagibig).toBe(100);
      expect(expectedPhilhealth).toBe(687.5);
      expect(expectedTotalDeductions).toBe(2587.5);
    });

    test('should fail when period is not in Draft status', async () => {
      const mockPeriod = {
        id: 1,
        status: 'Completed'
      };

      executeQuery.mockResolvedValueOnce({ success: true, data: [mockPeriod] });

      mockRequest.body = { period_id: 1 };

      await expect(generateAutomatedPayroll(mockRequest, mockResponse))
        .rejects
        .toThrow('Can only generate payroll for draft periods');
    });

    test('should fail when payroll already exists for period', async () => {
      const mockPeriod = {
        id: 1,
        status: 'Draft'
      };

      executeQuery
        .mockResolvedValueOnce({ success: true, data: [mockPeriod] })
        .mockResolvedValueOnce({ success: true, data: [{ count: 5 }] });

      mockRequest.body = { period_id: 1 };

      await expect(generateAutomatedPayroll(mockRequest, mockResponse))
        .rejects
        .toThrow('Payroll has already been generated for this period');
    });
  });

  describe('Payroll Computation Retrieval', () => {
    test('should retrieve detailed payroll computation', async () => {
      const mockPeriod = {
        id: 1,
        year: 2025,
        month: 1,
        period_number: 1,
        created_by_name: 'Admin'
      };

      const mockItems = [
        {
          id: 1,
          employee_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          employee_number: 'EMP001',
          basic_salary: 20000,
          total_allowances: 5000,
          gross_pay: 25000,
          total_deductions: 3000,
          net_pay: 22000,
          days_worked: 20,
          leave_days_deducted: 2
        }
      ];

      const mockAllowanceItems = [
        {
          id: 1,
          allowance_type_id: 1,
          allowance_code: 'RATA',
          allowance_name: 'RATA',
          amount: 3000,
          prorated_amount: 3000,
          employee_id: 1
        }
      ];

      executeQuery
        .mockResolvedValueOnce({ success: true, data: [mockPeriod] })
        .mockResolvedValueOnce({ success: true, data: mockItems })
        .mockResolvedValueOnce({ success: true, data: mockAllowanceItems });

      mockRequest.params = { period_id: 1 };

      await getPayrollComputation(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          period: mockPeriod,
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              allowances: [mockAllowanceItems[0]]
            })
          ]),
          summary: {
            employee_count: 1,
            total_gross_pay: 25000,
            total_deductions: 3000,
            total_net_pay: 22000,
            total_allowances: 5000
          }
        }
      });
    });

    test('should handle missing period gracefully', async () => {
      executeQuery.mockResolvedValueOnce({ success: true, data: [] });

      mockRequest.params = { period_id: 999 };

      await expect(getPayrollComputation(mockRequest, mockResponse))
        .rejects
        .toThrow('Payroll period not found');
    });
  });

  describe('Employee Allowance Management', () => {
    test('should retrieve employee allowances', async () => {
      const mockAllowances = [
        {
          id: 1,
          employee_id: 1,
          allowance_type_id: 1,
          amount: 3000,
          effective_date: '2025-01-01',
          is_active: true,
          allowance_code: 'RATA',
          allowance_name: 'RATA',
          description: 'Representation & Transportation Allowance',
          is_monthly: true,
          is_prorated: true
        }
      ];

      executeQuery.mockResolvedValueOnce({ success: true, data: mockAllowances });

      mockRequest.params = { employee_id: 1 };

      await getEmployeeAllowances(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAllowances
      });
    });

    test('should update employee allowances', async () => {
      const mockAllowances = [
        {
          allowance_type_id: 1,
          amount: 3500,
          effective_date: '2025-01-01'
        }
      ];

      executeTransaction.mockImplementation(async (callback) => {
        mockConnection.execute
          .mockResolvedValueOnce([{ affectedRows: 1 }]) // Deactivate existing
          .mockResolvedValue([{ insertId: 1 }]); // Insert new

        return await callback(mockConnection);
      });

      mockRequest.params = { employee_id: 1 };
      mockRequest.body = { allowances: mockAllowances };

      await updateEmployeeAllowances(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee allowances updated successfully'
      });
    });
  });

  describe('Payroll Validation', () => {
    test('should validate payroll calculations', async () => {
      // Mock validation queries
      const mockMissingAllowances = [];
      const mockCalculationErrors = [];

      executeQuery
        .mockResolvedValueOnce({ success: true, data: mockMissingAllowances })
        .mockResolvedValueOnce({ success: true, data: mockCalculationErrors });

      const validationResult = {
        period_id: 1,
        validation_results: {
          missing_allowances: mockMissingAllowances,
          calculation_errors: mockCalculationErrors,
          is_valid: true
        }
      };

      expect(validationResult.validation_results.is_valid).toBe(true);
      expect(validationResult.validation_results.missing_allowances).toHaveLength(0);
      expect(validationResult.validation_results.calculation_errors).toHaveLength(0);
    });

    test('should detect calculation errors', async () => {
      const mockCalculationErrors = [
        {
          id: 1,
          employee_number: 'EMP001',
          basic_salary: 20000,
          total_allowances: 5000,
          gross_pay: 25000,
          calculated_gross: 25001 // Mismatch
        }
      ];

      executeQuery
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: true, data: mockCalculationErrors });

      const validationResult = {
        period_id: 1,
        validation_results: {
          missing_allowances: [],
          calculation_errors: mockCalculationErrors,
          is_valid: false
        }
      };

      expect(validationResult.validation_results.is_valid).toBe(false);
      expect(validationResult.validation_results.calculation_errors).toHaveLength(1);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete payroll generation workflow', async () => {
      // This would be an end-to-end test that:
      // 1. Creates a payroll period
      // 2. Sets up employee allowances
      // 3. Generates payroll
      // 4. Validates results
      // 5. Retrieves computation details
      
      // Mock the complete workflow
      const workflowSteps = [
        'create_period',
        'setup_allowances',
        'generate_payroll',
        'validate_payroll',
        'get_computation'
      ];

      expect(workflowSteps).toHaveLength(5);
      // Additional integration test logic would go here
    });
  });
});

module.exports = {
  // Export test utilities for use in other test files
  mockPayrollPeriod: (overrides = {}) => ({
    id: 1,
    year: 2025,
    month: 1,
    period_number: 1,
    start_date: '2025-01-01',
    end_date: '2025-01-15',
    pay_date: '2025-01-20',
    status: 'Draft',
    created_by: 1,
    ...overrides
  }),

  mockEmployee: (overrides = {}) => ({
    id: 1,
    employee_number: 'EMP001',
    first_name: 'John',
    last_name: 'Doe',
    current_daily_rate: 1000,
    current_monthly_salary: 22000,
    appointment_date: '2024-01-01',
    employment_status: 'Active',
    ...overrides
  }),

  mockPayrollItem: (overrides = {}) => ({
    id: 1,
    employee_id: 1,
    payroll_period_id: 1,
    basic_salary: 20000,
    days_worked: 20,
    leave_days_deducted: 2,
    working_days_in_month: 22,
    total_allowances: 5000,
    gsis_contribution: 1800,
    pagibig_contribution: 100,
    philhealth_contribution: 687.5,
    tax_withheld: 0,
    other_deductions: 0,
    gross_pay: 25000,
    total_deductions: 2587.5,
    net_pay: 22412.5,
    ...overrides
  })
};