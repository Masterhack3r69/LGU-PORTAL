// tests/leaveModel.test.js - Tests for Leave Model
const { Leave, LeaveBalance, LeaveType } = require('../models/Leave');

// Mock database functions
jest.mock('../config/database', () => ({
  executeQuery: jest.fn(),
  findOne: jest.fn(),
  executeTransaction: jest.fn()
}));

const { executeQuery, findOne, executeTransaction } = require('../config/database');

describe('Leave Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Leave', () => {
    test('should create a Leave instance with default values', () => {
      const leave = new Leave();
      expect(leave.id).toBeNull();
      expect(leave.employee_id).toBeNull();
      expect(leave.status).toBe('Pending');
    });

    test('should create a Leave instance with provided values', () => {
      const data = {
        id: 1,
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-01-01',
        end_date: '2023-01-05',
        days_requested: 5,
        reason: 'Vacation',
        status: 'Approved'
      };
      
      const leave = new Leave(data);
      expect(leave.id).toBe(1);
      expect(leave.employee_id).toBe(123);
      expect(leave.leave_type_id).toBe(1);
      expect(leave.start_date).toBe('2023-01-01');
      expect(leave.end_date).toBe('2023-01-05');
      expect(leave.days_requested).toBe(5);
      expect(leave.reason).toBe('Vacation');
      expect(leave.status).toBe('Approved');
    });

    test('should validate leave application correctly', async () => {
      const leave = new Leave({
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-01-10',
        end_date: '2023-01-05', // Invalid: end before start
        days_requested: 5
      });

      const validation = await leave.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Start date cannot be after end date');
    });

    test('should calculate working days correctly', () => {
      const workingDays = Leave.calculateWorkingDays('2023-01-02', '2023-01-06'); // Mon-Fri
      expect(workingDays).toBe(5);
    });

    test('should save leave application successfully', async () => {
      const leave = new Leave({
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-01-10',
        end_date: '2023-01-15',
        days_requested: 5,
        reason: 'Vacation'
      });

      executeQuery.mockResolvedValue({ success: true, data: { insertId: 1 } });

      const result = await leave.save();
      expect(result.success).toBe(true);
      expect(leave.id).toBe(1);
    });

    test('should find leave by ID', async () => {
      const mockLeave = {
        id: 1,
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-01-10',
        end_date: '2023-01-15',
        days_requested: 5,
        reason: 'Vacation',
        status: 'Pending'
      };

      findOne.mockResolvedValue({ success: true, data: mockLeave });

      const result = await Leave.findById(1);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Leave);
      expect(result.data.id).toBe(1);
    });

    test('should approve leave application', async () => {
      const leave = new Leave({
        id: 1,
        employee_id: 123,
        leave_type_id: 1,
        start_date: '2023-01-10',
        end_date: '2023-01-15',
        days_requested: 5,
        status: 'Pending'
      });

      executeTransaction.mockImplementation(async (callback) => {
        return await callback({
          execute: jest.fn().mockResolvedValue({ affectedRows: 1 })
        });
      });

      const result = await leave.approve(1, 'Approved for vacation');
      expect(result.success).toBe(true);
      expect(leave.status).toBe('Approved');
    });
  });

  describe('LeaveBalance', () => {
    test('should create a LeaveBalance instance with default values', () => {
      const balance = new LeaveBalance();
      expect(balance.id).toBeNull();
      expect(balance.employee_id).toBeNull();
      expect(balance.year).toBe(new Date().getFullYear());
      expect(balance.current_balance).toBe(0);
    });

    test('should calculate balance correctly', () => {
      const balance = new LeaveBalance({
        earned_days: 15,
        used_days: 3,
        monetized_days: 2,
        carried_forward: 1.5
      });

      const calculatedBalance = balance.calculateBalance();
      expect(calculatedBalance).toBe(11.5);
      expect(balance.current_balance).toBe(11.5);
    });

    test('should validate balance data correctly', () => {
      const balance = new LeaveBalance({
        employee_id: 123,
        leave_type_id: 1,
        year: 2023,
        earned_days: -5 // Invalid: negative value
      });

      const validation = balance.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Earned days cannot be negative');
    });

    test('should save leave balance successfully', async () => {
      const balance = new LeaveBalance({
        employee_id: 123,
        leave_type_id: 1,
        year: 2023,
        earned_days: 15,
        used_days: 3,
        current_balance: 12
      });

      executeQuery.mockResolvedValue({ success: true, data: { affectedRows: 1 } });

      const result = await balance.save();
      expect(result.success).toBe(true);
    });
  });

  describe('LeaveType', () => {
    test('should create a LeaveType instance with default values', () => {
      const leaveType = new LeaveType();
      expect(leaveType.id).toBeNull();
      expect(leaveType.name).toBeNull();
      expect(leaveType.code).toBeNull();
    });

    test('should validate leave type data correctly', () => {
      const leaveType = new LeaveType({
        name: '', // Invalid: empty name
        code: 'VL'
      });

      const validation = leaveType.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Leave type name is required');
    });

    test('should save leave type successfully', async () => {
      const leaveType = new LeaveType({
        name: 'Vacation Leave',
        code: 'VL',
        description: 'Annual vacation leave',
        max_days_per_year: 15,
        is_monetizable: true
      });

      // Mock duplicate check
      executeQuery
        .mockResolvedValueOnce({ success: true, data: [] }) // Duplicate check
        .mockResolvedValueOnce({ success: true, data: { insertId: 1 } }); // Insert

      const result = await leaveType.save();
      expect(result.success).toBe(true);
      expect(leaveType.id).toBe(1);
    });

    test('should find leave type by ID', async () => {
      const mockLeaveType = {
        id: 1,
        name: 'Vacation Leave',
        code: 'VL',
        description: 'Annual vacation leave',
        max_days_per_year: 15,
        is_monetizable: true
      };

      findOne.mockResolvedValue({ success: true, data: mockLeaveType });

      const result = await LeaveType.findById(1);
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(LeaveType);
      expect(result.data.id).toBe(1);
    });
  });
});