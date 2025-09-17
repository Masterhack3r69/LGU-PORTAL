const request = require('supertest');
const app = require('../server');
const mysql = require('mysql2/promise');

// Mock the database connection
jest.mock('mysql2/promise');

describe('Manual Compensation & Benefits System Tests', () => {
  let mockConnection;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock database connection
    mockConnection = {
      execute: jest.fn(),
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      end: jest.fn()
    };

    mysql.createConnection.mockResolvedValue(mockConnection);

    // Mock request and response objects
    mockRequest = {
      params: {},
      body: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Available Benefits Retrieval', () => {
    test('should get available benefits for employee successfully', async () => {
      const mockEmployeeId = 1;
      const mockYear = 2024;
      
      // Mock benefit types data
      const mockBenefitTypes = [
        {
          id: 1,
          name: 'Health Insurance',
          category: 'Health',
          description: 'Comprehensive health coverage',
          eligibility_criteria: '{"tenure_months": 6}',
          max_amount: 50000.00,
          is_active: 1
        },
        {
          id: 2,
          name: 'Life Insurance',
          category: 'Insurance',
          description: 'Life insurance coverage',
          eligibility_criteria: '{"tenure_months": 12}',
          max_amount: 100000.00,
          is_active: 1
        },
        {
          id: 3,
          name: 'Education Allowance',
          category: 'Education',
          description: 'Educational support allowance',
          eligibility_criteria: '{"tenure_months": 24}',
          max_amount: 25000.00,
          is_active: 1
        }
      ];

      // Mock employee data
      const mockEmployee = [{
        id: 1,
        hire_date: '2022-01-15',
        position: 'Software Engineer',
        department: 'IT'
      }];

      // Mock current selections
      const mockCurrentSelections = [
        {
          benefit_type_id: 1,
          selected_amount: 30000.00,
          status: 'active'
        }
      ];

      mockRequest.params = { employeeId: mockEmployeeId };
      mockRequest.query = { year: mockYear };

      // Mock database queries
      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitTypes]) // Get benefit types
        .mockResolvedValueOnce([mockEmployee]) // Get employee info
        .mockResolvedValueOnce([mockCurrentSelections]); // Get current selections

      const { getAvailableBenefits } = require('../controllers/compensationBenefitsController');
      
      await getAvailableBenefits(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            employee_id: mockEmployeeId,
            year: mockYear,
            benefits_by_category: expect.objectContaining({
              'Health': expect.arrayContaining([
                expect.objectContaining({
                  id: 1,
                  name: 'Health Insurance',
                  is_eligible: true,
                  current_selection: expect.objectContaining({
                    selected_amount: 30000.00,
                    status: 'active'
                  })
                })
              ]),
              'Insurance': expect.arrayContaining([
                expect.objectContaining({
                  id: 2,
                  name: 'Life Insurance',
                  is_eligible: false // Not eligible due to tenure requirement
                })
              ])
            })
          })
        })
      );
    });

    test('should handle employee not found error', async () => {
      const mockEmployeeId = 999;
      
      mockRequest.params = { employeeId: mockEmployeeId };
      mockRequest.query = { year: 2024 };

      // Mock empty employee result
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Empty benefit types
        .mockResolvedValueOnce([[]]); // Empty employee result

      const { getAvailableBenefits } = require('../controllers/compensationBenefitsController');
      
      await getAvailableBenefits(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Employee not found'
        })
      );
    });
  });

  describe('Benefit Selection Submission', () => {
    test('should submit benefit selections successfully', async () => {
      const mockEmployeeId = 1;
      const mockSelections = [
        {
          benefit_type_id: 1,
          selected_amount: 40000.00
        },
        {
          benefit_type_id: 3,
          selected_amount: 20000.00
        }
      ];

      mockRequest.body = {
        employee_id: mockEmployeeId,
        year: 2024,
        selections: mockSelections
      };

      // Mock benefit types for validation
      const mockBenefitTypes = [
        { id: 1, max_amount: 50000.00, name: 'Health Insurance' },
        { id: 3, max_amount: 25000.00, name: 'Education Allowance' }
      ];

      // Mock employee data
      const mockEmployee = [{
        id: 1,
        hire_date: '2022-01-15'
      }];

      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitTypes]) // Get benefit types
        .mockResolvedValueOnce([mockEmployee]) // Get employee info
        .mockResolvedValueOnce([{ affectedRows: 2 }]) // Delete existing selections
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert new selections
        .mockResolvedValueOnce([{ insertId: 2 }]); // Insert new selections

      const { submitBenefitSelections } = require('../controllers/compensationBenefitsController');
      
      await submitBenefitSelections(mockRequest, mockResponse);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Benefit selections submitted successfully',
          data: expect.objectContaining({
            employee_id: mockEmployeeId,
            year: 2024,
            selections_count: 2
          })
        })
      );
    });

    test('should reject selections exceeding maximum amounts', async () => {
      const mockEmployeeId = 1;
      const mockSelections = [
        {
          benefit_type_id: 1,
          selected_amount: 60000.00 // Exceeds max of 50000
        }
      ];

      mockRequest.body = {
        employee_id: mockEmployeeId,
        year: 2024,
        selections: mockSelections
      };

      // Mock benefit types
      const mockBenefitTypes = [
        { id: 1, max_amount: 50000.00, name: 'Health Insurance' }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitTypes]);

      const { submitBenefitSelections } = require('../controllers/compensationBenefitsController');
      
      await submitBenefitSelections(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Selected amount for Health Insurance exceeds maximum')
        })
      );
    });

    test('should handle database transaction rollback on error', async () => {
      const mockEmployeeId = 1;
      const mockSelections = [
        {
          benefit_type_id: 1,
          selected_amount: 40000.00
        }
      ];

      mockRequest.body = {
        employee_id: mockEmployeeId,
        year: 2024,
        selections: mockSelections
      };

      // Mock benefit types
      const mockBenefitTypes = [
        { id: 1, max_amount: 50000.00, name: 'Health Insurance' }
      ];

      const mockEmployee = [{ id: 1, hire_date: '2022-01-15' }];

      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitTypes])
        .mockResolvedValueOnce([mockEmployee])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockRejectedValueOnce(new Error('Database error during insert'));

      const { submitBenefitSelections } = require('../controllers/compensationBenefitsController');
      
      await submitBenefitSelections(mockRequest, mockResponse);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to submit benefit selections'
        })
      );
    });
  });

  describe('Employee Benefit History', () => {
    test('should retrieve employee benefit history successfully', async () => {
      const mockEmployeeId = 1;
      
      const mockBenefitHistory = [
        {
          id: 1,
          benefit_type_id: 1,
          benefit_name: 'Health Insurance',
          selected_amount: 40000.00,
          year: 2024,
          status: 'active',
          date_selected: '2024-01-15T00:00:00.000Z',
          last_updated: '2024-01-15T00:00:00.000Z'
        },
        {
          id: 2,
          benefit_type_id: 3,
          benefit_name: 'Education Allowance',
          selected_amount: 20000.00,
          year: 2024,
          status: 'active',
          date_selected: '2024-01-15T00:00:00.000Z',
          last_updated: '2024-01-15T00:00:00.000Z'
        }
      ];

      mockRequest.params = { employeeId: mockEmployeeId };

      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitHistory]);

      const { getEmployeeBenefitHistory } = require('../controllers/compensationBenefitsController');
      
      await getEmployeeBenefitHistory(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            employee_id: mockEmployeeId,
            total_records: 2,
            benefit_history: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                benefit_name: 'Health Insurance',
                selected_amount: 40000.00,
                year: 2024,
                status: 'active'
              }),
              expect.objectContaining({
                id: 2,
                benefit_name: 'Education Allowance',
                selected_amount: 20000.00,
                year: 2024,
                status: 'active'
              })
            ])
          })
        })
      );
    });

    test('should handle empty benefit history', async () => {
      const mockEmployeeId = 1;

      mockRequest.params = { employeeId: mockEmployeeId };

      mockConnection.execute
        .mockResolvedValueOnce([[]]);

      const { getEmployeeBenefitHistory } = require('../controllers/compensationBenefitsController');
      
      await getEmployeeBenefitHistory(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            employee_id: mockEmployeeId,
            total_records: 0,
            benefit_history: []
          })
        })
      );
    });
  });

  describe('Benefit Eligibility Validation', () => {
    test('should validate employee eligibility correctly', async () => {
      const mockEmployeeId = 1;
      const mockBenefitTypeId = 2; // Life Insurance requiring 12 months tenure
      
      // Mock employee with 18 months tenure
      const mockEmployee = [{
        id: 1,
        hire_date: '2022-06-15', // 18+ months ago
        position: 'Software Engineer',
        department: 'IT'
      }];

      // Mock benefit type
      const mockBenefitType = [{
        id: 2,
        name: 'Life Insurance',
        eligibility_criteria: '{"tenure_months": 12, "departments": ["IT", "HR"]}'
      }];

      mockRequest.params = { employeeId: mockEmployeeId, benefitTypeId: mockBenefitTypeId };

      mockConnection.execute
        .mockResolvedValueOnce([mockEmployee])
        .mockResolvedValueOnce([mockBenefitType]);

      const { checkBenefitEligibility } = require('../controllers/compensationBenefitsController');
      
      await checkBenefitEligibility(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            employee_id: mockEmployeeId,
            benefit_type_id: mockBenefitTypeId,
            is_eligible: true,
            eligibility_details: expect.objectContaining({
              tenure_check: true,
              department_check: true
            })
          })
        })
      );
    });

    test('should reject ineligible employee due to insufficient tenure', async () => {
      const mockEmployeeId = 1;
      const mockBenefitTypeId = 2;
      
      // Mock employee with 6 months tenure (insufficient for 12 month requirement)
      const mockEmployee = [{
        id: 1,
        hire_date: '2023-06-15', // Only 6 months ago
        position: 'Software Engineer',
        department: 'IT'
      }];

      const mockBenefitType = [{
        id: 2,
        name: 'Life Insurance',
        eligibility_criteria: '{"tenure_months": 12}'
      }];

      mockRequest.params = { employeeId: mockEmployeeId, benefitTypeId: mockBenefitTypeId };

      mockConnection.execute
        .mockResolvedValueOnce([mockEmployee])
        .mockResolvedValueOnce([mockBenefitType]);

      const { checkBenefitEligibility } = require('../controllers/compensationBenefitsController');
      
      await checkBenefitEligibility(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            employee_id: mockEmployeeId,
            benefit_type_id: mockBenefitTypeId,
            is_eligible: false,
            eligibility_details: expect.objectContaining({
              tenure_check: false,
              reasons: expect.arrayContaining([
                expect.stringContaining('Insufficient tenure')
              ])
            })
          })
        })
      );
    });
  });

  describe('Benefit Type Management', () => {
    test('should retrieve all active benefit types', async () => {
      const mockBenefitTypes = [
        {
          id: 1,
          name: 'Health Insurance',
          category: 'Health',
          description: 'Comprehensive health coverage',
          max_amount: 50000.00,
          is_active: 1
        },
        {
          id: 2,
          name: 'Life Insurance',
          category: 'Insurance',
          description: 'Life insurance coverage',
          max_amount: 100000.00,
          is_active: 1
        }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitTypes]);

      const { getAllBenefitTypes } = require('../controllers/compensationBenefitsController');
      
      await getAllBenefitTypes(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total_types: 2,
            benefit_types: mockBenefitTypes
          })
        })
      );
    });

    test('should create new benefit type successfully', async () => {
      const mockNewBenefitType = {
        name: 'Retirement Savings',
        category: 'Retirement',
        description: 'Company retirement savings plan',
        eligibility_criteria: '{"tenure_months": 6}',
        max_amount: 75000.00
      };

      mockRequest.body = mockNewBenefitType;

      mockConnection.execute
        .mockResolvedValueOnce([{ insertId: 5 }]);

      const { createBenefitType } = require('../controllers/compensationBenefitsController');
      
      await createBenefitType(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Benefit type created successfully',
          data: expect.objectContaining({
            id: 5,
            ...mockNewBenefitType
          })
        })
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete benefit selection workflow', async () => {
      const mockEmployeeId = 1;
      const mockYear = 2024;

      // Step 1: Get available benefits
      const mockBenefitTypes = [
        {
          id: 1,
          name: 'Health Insurance',
          category: 'Health',
          eligibility_criteria: '{"tenure_months": 6}',
          max_amount: 50000.00,
          is_active: 1
        }
      ];

      const mockEmployee = [{
        id: 1,
        hire_date: '2022-01-15'
      }];

      // Step 2: Submit benefit selections
      const mockSelections = [
        {
          benefit_type_id: 1,
          selected_amount: 45000.00
        }
      ];

      // Step 3: Verify benefit history
      const mockHistoryAfterSubmission = [
        {
          id: 1,
          benefit_type_id: 1,
          benefit_name: 'Health Insurance',
          selected_amount: 45000.00,
          year: 2024,
          status: 'active'
        }
      ];

      mockConnection.execute
        .mockResolvedValueOnce([mockBenefitTypes]) // getAvailableBenefits - benefit types
        .mockResolvedValueOnce([mockEmployee]) // getAvailableBenefits - employee info
        .mockResolvedValueOnce([[]]) // getAvailableBenefits - current selections
        .mockResolvedValueOnce([mockBenefitTypes]) // submitBenefitSelections - benefit validation
        .mockResolvedValueOnce([mockEmployee]) // submitBenefitSelections - employee validation
        .mockResolvedValueOnce([{ affectedRows: 0 }]) // submitBenefitSelections - delete existing
        .mockResolvedValueOnce([{ insertId: 1 }]) // submitBenefitSelections - insert new
        .mockResolvedValueOnce([mockHistoryAfterSubmission]); // getEmployeeBenefitHistory

      const { 
        getAvailableBenefits, 
        submitBenefitSelections, 
        getEmployeeBenefitHistory 
      } = require('../controllers/compensationBenefitsController');

      // Execute the complete workflow
      mockRequest.params = { employeeId: mockEmployeeId };
      mockRequest.query = { year: mockYear };
      await getAvailableBenefits(mockRequest, mockResponse);

      mockRequest.body = {
        employee_id: mockEmployeeId,
        year: mockYear,
        selections: mockSelections
      };
      await submitBenefitSelections(mockRequest, mockResponse);

      mockRequest.params = { employeeId: mockEmployeeId };
      await getEmployeeBenefitHistory(mockRequest, mockResponse);

      // Verify all steps completed successfully
      expect(mockConnection.execute).toHaveBeenCalledTimes(8);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });
});