// tests/leaveIntegration.test.js - Integration tests for Leave Management System
const request = require('supertest');
const express = require('express');
const leaveRoutes = require('../routes/leaveRoutes');
const { executeQuery } = require('../config/database');

// Mock database functions
jest.mock('../config/database', () => ({
  executeQuery: jest.fn(),
  findOne: jest.fn(),
  executeTransaction: jest.fn()
}));

describe('Leave Management System Integration', () => {
  let app;
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/leaves', (req, res, next) => {
      req.session = {
        user: {
          id: 1,
          role: 'admin',
          employee_id: 123
        }
      };
      next();
    });
    
    app.use('/api/leaves', leaveRoutes);
    
    // Mock auth middleware
    jest.mock('../middleware/auth', () => ({
      requireAuth: (req, res, next) => next(),
      requireAdmin: (req, res, next) => {
        if (req.session.user.role === 'admin') {
          next();
        } else {
          res.status(403).json({ error: 'Admin privileges required' });
        }
      }
    }));
  });

  describe('Leave Application Management', () => {
    test('should create a new leave application', async () => {
      const leaveData = {
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-12-01',
        end_date: '2023-12-05',
        reason: 'Annual vacation'
      };

      // Mock database responses
      require('../config/database').findOne
        .mockResolvedValueOnce({ success: true, data: { id: 1, code: 'VL' } }) // Leave type check
        .mockResolvedValueOnce({ success: true, data: null }); // Duplicate check
      
      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: { insertId: 1 } }); // Insert leave

      const response = await request(app)
        .post('/api/leaves')
        .send(leaveData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.message).toBe('Leave application submitted successfully');
    });

    test('should get all leave applications with filtering', async () => {
      const mockLeaves = [
        {
          id: 1,
          employee_id: 123,
          leave_type_id: 1,
          start_date: '2023-12-01',
          end_date: '2023-12-05',
          status: 'Pending',
          leave_type_name: 'Vacation Leave',
          employee_name: 'John Doe'
        }
      ];

      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: [{ total: 1 }] }) // Count query
        .mockResolvedValueOnce({ success: true, data: mockLeaves }); // Select query

      const response = await request(app)
        .get('/api/leaves?status=Pending&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('Pending');
    });

    test('should get leave application by ID', async () => {
      const mockLeave = {
        id: 1,
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-12-01',
        end_date: '2023-12-05',
        days_requested: 5,
        reason: 'Annual vacation',
        status: 'Pending',
        leave_type_name: 'Vacation Leave',
        employee_name: 'John Doe'
      };

      require('../config/database').findOne
        .mockResolvedValueOnce({ success: true, data: mockLeave });

      const response = await request(app)
        .get('/api/leaves/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.leave_type_name).toBe('Vacation Leave');
    });

    test('should approve a leave application', async () => {
      // Mock transaction
      require('../config/database').executeTransaction
        .mockImplementation(async (callback) => {
          const mockConnection = {
            execute: jest.fn().mockResolvedValue({ affectedRows: 1 })
          };
          return await callback(mockConnection);
        });

      const response = await request(app)
        .put('/api/leaves/1/approve')
        .send({ review_notes: 'Approved for vacation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Leave application approved successfully');
    });
  });

  describe('Leave Balance Management', () => {
    test('should get employee leave balances', async () => {
      const mockBalances = [
        {
          employee_id: 123,
          leave_type_id: 1,
          year: 2023,
          earned_days: 15.0,
          used_days: 3.0,
          monetized_days: 0.0,
          carried_forward: 2.5,
          current_balance: 14.5,
          leave_type_name: 'Vacation Leave',
          leave_type_code: 'VL'
        }
      ];

      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: mockBalances });

      const response = await request(app)
        .get('/api/leaves/balances/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].current_balance).toBe(14.5);
    });

    test('should initialize yearly leave balances', async () => {
      require('../config/database').executeTransaction
        .mockImplementation(async (callback) => {
          const mockConnection = {
            execute: jest.fn()
              .mockResolvedValueOnce({}) // Get leave types
              .mockResolvedValueOnce({ length: 0 }) // Check existing balance
              .mockResolvedValueOnce({}) // Insert balance
          };
          return await callback(mockConnection);
        });

      const response = await request(app)
        .post('/api/leaves/initialize-balances')
        .send({ employee_id: 123, year: 2023 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Leave balances initialized successfully');
    });
  });

  describe('Leave Type Management', () => {
    test('should create a new leave type', async () => {
      const leaveTypeData = {
        name: 'Emergency Leave',
        code: 'EL',
        description: 'Emergency leave for urgent situations',
        max_days_per_year: 5,
        is_monetizable: false
      };

      // Mock duplicate check and insert
      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: [] }) // Duplicate check
        .mockResolvedValueOnce({ success: true, data: { insertId: 1 } }); // Insert

      const response = await request(app)
        .post('/api/leaves/types')
        .send(leaveTypeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.message).toBe('Leave type created successfully');
    });

    test('should get all leave types', async () => {
      const mockLeaveTypes = [
        { id: 1, name: 'Vacation Leave', code: 'VL', max_days_per_year: 15 },
        { id: 2, name: 'Sick Leave', code: 'SL', max_days_per_year: 15 }
      ];

      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: mockLeaveTypes });

      const response = await request(app)
        .get('/api/leaves/types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].code).toBe('VL');
    });
  });

  describe('Reporting and Analytics', () => {
    test('should generate leave statistics', async () => {
      const mockStats = {
        total: 10,
        pending: 3,
        approved: 6,
        rejected: 1,
        byType: [
          { name: 'Vacation Leave', count: 7 },
          { name: 'Sick Leave', count: 3 }
        ]
      };

      // Mock multiple queries for statistics
      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: [{ total: 10 }] }) // Total
        .mockResolvedValueOnce({ success: true, data: [{ total: 3 }] }) // Pending
        .mockResolvedValueOnce({ success: true, data: [{ total: 6 }] }) // Approved
        .mockResolvedValueOnce({ success: true, data: [{ total: 1 }] }) // Rejected
        .mockResolvedValueOnce({ success: true, data: mockStats.byType }); // By type

      const response = await request(app)
        .get('/api/leaves/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(10);
      expect(response.body.data.pending).toBe(3);
    });

    test('should generate leave summary report', async () => {
      const mockReport = [
        {
          employee_id: 123,
          employee_number: 'EMP001',
          employee_name: 'John Doe',
          leave_type: 'Vacation Leave',
          approved_days: 10,
          current_balance: 5
        }
      ];

      require('../config/database').executeQuery
        .mockResolvedValueOnce({ success: true, data: mockReport });

      const response = await request(app)
        .get('/api/leaves/reports/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.report_type).toBe('leave_summary');
    });
  });
});