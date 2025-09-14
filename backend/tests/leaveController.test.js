// tests/leaveController.test.js - Tests for Leave Controller
const request = require('supertest');
const express = require('express');
const { leaveController } = require('../controllers/leaveController');

// Mock the Leave model and related modules
jest.mock('../models/Leave', () => {
  return {
    Leave: {
      findAll: jest.fn(),
      findById: jest.fn(),
      calculateWorkingDays: jest.fn(() => 5)
    },
    LeaveBalance: {},
    LeaveType: {
      findById: jest.fn()
    }
  };
});

jest.mock('../middleware/errorHandler', () => {
  return {
    asyncHandler: (fn) => fn,
    ValidationError: class ValidationError extends Error {
      constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
      }
    },
    NotFoundError: class NotFoundError extends Error {
      constructor(message) {
        super(message);
        this.name = 'NotFoundError';
      }
    }
  };
});

jest.mock('express-validator', () => {
  return {
    body: () => ({
      isInt: () => ({ withMessage: () => ({ custom: () => ({}) }) }),
      isISO8601: () => ({ withMessage: () => ({ custom: () => ({}) }) }),
      optional: () => ({ trim: () => ({ isLength: () => ({ withMessage: () => ({}) }) }) }),
      isFloat: () => ({ withMessage: () => ({}) })
    }),
    validationResult: () => ({
      isEmpty: () => true,
      array: () => []
    })
  };
});

jest.mock('../utils/helpers', () => {
  return {
    generatePagination: (page, limit, total) => ({
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      offset: (page - 1) * limit
    })
  };
});

const { Leave, LeaveType } = require('../models/Leave');

describe('Leave Controller', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = { user: { id: 1, role: 'admin', employee_id: 123 } };
      next();
    });
    
    // Mock routes
    app.get('/api/leaves', leaveController.getAllLeaves);
    app.get('/api/leaves/:id', leaveController.getLeaveById);
    app.post('/api/leaves', leaveController.createLeave);
  });

  describe('getAllLeaves', () => {
    test('should return leave applications successfully', async () => {
      const mockLeaves = [
        { id: 1, employee_id: 123, leave_type_id: 1, status: 'Pending' },
        { id: 2, employee_id: 124, leave_type_id: 2, status: 'Approved' }
      ];

      Leave.findAll.mockResolvedValue({ success: true, data: mockLeaves });
      Leave.getCount.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/leaves')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(Leave.findAll).toHaveBeenCalled();
    });

    test('should handle errors when fetching leave applications', async () => {
      Leave.findAll.mockResolvedValue({ success: false, error: 'Database error' });

      const response = await request(app)
        .get('/api/leaves')
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('getLeaveById', () => {
    test('should return leave application by ID successfully', async () => {
      const mockLeave = {
        id: 1,
        employee_id: 123,
        leave_type_id: 1,
        status: 'Pending',
        employee_name: 'John Doe'
      };

      Leave.findById.mockResolvedValue({ success: true, data: mockLeave });

      const response = await request(app)
        .get('/api/leaves/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(Leave.findById).toHaveBeenCalledWith('1');
    });

    test('should return 404 when leave application not found', async () => {
      Leave.findById.mockResolvedValue({ success: true, data: null });

      const response = await request(app)
        .get('/api/leaves/999')
        .expect(404);

      expect(response.body.error).toBe('Leave application not found');
    });
  });

  describe('createLeave', () => {
    test('should create leave application successfully', async () => {
      const leaveData = {
        leave_type_id: 1,
        start_date: '2023-01-10',
        end_date: '2023-01-15',
        reason: 'Vacation'
      };

      const mockLeave = {
        id: 1,
        employee_id: 123,
        ...leaveData,
        days_requested: 5,
        status: 'Pending'
      };

      LeaveType.findById.mockResolvedValue({ success: true, data: { id: 1 } });
      const mockLeaveInstance = {
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        save: jest.fn().mockResolvedValue({ success: true, data: mockLeave })
      };
      jest.mock('../models/Leave', () => {
        return {
          Leave: jest.fn(() => mockLeaveInstance),
          LeaveBalance: {},
          LeaveType: { findById: jest.fn() }
        };
      });

      const response = await request(app)
        .post('/api/leaves')
        .send(leaveData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    test('should handle validation errors', async () => {
      jest.mock('express-validator', () => {
        return {
          body: () => ({
            isInt: () => ({ withMessage: () => ({ custom: () => ({}) }) }),
            isISO8601: () => ({ withMessage: () => ({ custom: () => ({}) }) }),
            optional: () => ({ trim: () => ({ isLength: () => ({ withMessage: () => ({}) }) }) }),
            isFloat: () => ({ withMessage: () => ({}) })
          }),
          validationResult: () => ({
            isEmpty: () => false,
            array: () => [{ msg: 'Validation error' }]
          })
        };
      });

      const response = await request(app)
        .post('/api/leaves')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});