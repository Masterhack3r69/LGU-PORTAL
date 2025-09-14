// controllers/leaveController.js - Enhanced Leave management controller
const { Leave, LeaveBalance, LeaveType, LeaveReports } = require('../models/Leave');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult, query } = require('express-validator');
const helpers = require('../utils/helpers');

// Enhanced validation rules for leave application
const leaveValidationRules = [
    body('leave_type_id')
        .isInt({ min: 1 })
        .withMessage('Valid leave type is required')
        .custom(async (value) => {
            const leaveType = await LeaveType.findById(value);
            if (!leaveType.success || !leaveType.data) {
                throw new Error('Invalid leave type');
            }
            return true;
        }),
    body('start_date')
        .isISO8601()
        .withMessage('Valid start date is required')
        .custom((value) => {
            const startDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate <= today) {
                throw new Error('Start date must be in the future');
            }
            return true;
        }),
    body('end_date')
        .isISO8601()
        .withMessage('Valid end date is required')
        .custom((value, { req }) => {
            const endDate = new Date(value);
            const startDate = new Date(req.body.start_date);
            if (endDate < startDate) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters'),
    body('days_requested')
        .optional()
        .isFloat({ min: 0.5, max: 365 })
        .withMessage('Days requested must be between 0.5 and 365')
];

// Validation rules for leave type management
const leaveTypeValidationRules = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Leave type name is required and must be less than 50 characters'),
    body('code')
        .trim()
        .isLength({ min: 1, max: 10 })
        .withMessage('Leave type code is required and must be less than 10 characters')
        .matches(/^[A-Z]+$/)
        .withMessage('Leave type code must contain only uppercase letters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description must be less than 255 characters'),
    body('max_days_per_year')
        .optional()
        .isInt({ min: 0, max: 365 })
        .withMessage('Maximum days per year must be between 0 and 365'),
    body('is_monetizable')
        .optional()
        .isBoolean()
        .withMessage('is_monetizable must be a boolean'),
    body('requires_medical_certificate')
        .optional()
        .isBoolean()
        .withMessage('requires_medical_certificate must be a boolean')
];

// Enhanced GET /api/leaves - Get leave applications with advanced filtering
const getAllLeaves = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        employee_id, 
        leave_type_id, 
        leave_type_code,
        start_date, 
        end_date,
        year,
        month,
        search,
        sort_by,
        sort_order
    } = req.query;
    
    const currentUser = req.session.user;
    
    const filters = {};
    
    // Role-based access control
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    } else if (employee_id) {
        filters.employee_id = employee_id;
    }
    
    // Apply filters
    if (status) {
        if (status.includes(',')) {
            filters.status = status.split(',');
        } else {
            filters.status = status;
        }
    }
    if (leave_type_id) filters.leave_type_id = leave_type_id;
    if (leave_type_code) filters.leave_type_code = leave_type_code;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (year) filters.year = year;
    if (month) filters.month = month;
    if (search) filters.search = search;
    if (sort_by) filters.sort_by = sort_by;
    if (sort_order) filters.sort_order = sort_order;
    
    // Add pagination
    const pagination = helpers.generatePagination(page, limit, 0);
    filters.limit = pagination.pageSize;
    filters.offset = pagination.offset;
    
    // Get total count for pagination
    const totalCount = await Leave.getCount(filters);
    const updatedPagination = helpers.generatePagination(page, limit, totalCount);
    
    const result = await Leave.findAll(filters);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data,
        pagination: updatedPagination
    });
});

// GET /api/leaves/:id - Get leave application by ID
const getLeaveById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;
    
    console.log(`DEBUG: getLeaveById called with id: ${id}`);
    
    const result = await Leave.findById(id);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    if (!result.data) {
        throw new NotFoundError('Leave application not found');
    }
    
    const leave = result.data;
    
    // Check if user can access this leave
    if (currentUser.role !== 'admin' && leave.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    res.json({
        success: true,
        data: leave
    });
});

// Enhanced POST /api/leaves - Create new leave application
const createLeave = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const currentUser = req.session.user;
    
    // Ensure employee can only create their own leave
    if (currentUser.role !== 'admin') {
        req.body.employee_id = currentUser.employee_id;
    }
    
    // Calculate working days if not provided
    if (!req.body.days_requested || req.body.days_requested === 0) {
        const workingDays = Leave.calculateWorkingDays(req.body.start_date, req.body.end_date);
        req.body.days_requested = workingDays;
    }
    
    // Validate leave type specific rules before creating
    const leaveType = await LeaveType.findById(req.body.leave_type_id);
    if (!leaveType.success || !leaveType.data) {
        throw new ValidationError('Invalid leave type');
    }
    
    const leave = new Leave(req.body);
    
    // Perform comprehensive validation
    const validation = await leave.validate();
    if (!validation.isValid) {
        throw new ValidationError('Leave application validation failed', validation.errors);
    }
    
    const result = await leave.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to create leave application');
    }
    
    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Leave application submitted successfully',
        warnings: validation.warnings || []
    });
});

// PUT /api/leaves/:id - Update leave application
const updateLeave = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const { id } = req.params;
    const currentUser = req.session.user;
    
    // Get existing leave
    const existingResult = await Leave.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Leave application not found');
    }
    
    const leave = existingResult.data;
    
    // Check permissions
    if (currentUser.role !== 'admin' && leave.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    // Only allow updates if status is pending
    if (leave.status !== 'Pending') {
        throw new ValidationError('Cannot update leave application that has been reviewed');
    }
    
    // Update leave data
    Object.assign(leave, req.body);
    leave.id = id; // Ensure ID is preserved
    
    const result = await leave.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to update leave application');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: 'Leave application updated successfully'
    });
});

// PUT /api/leaves/:id/approve - Approve leave application
const approveLeave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { review_notes } = req.body;
    const currentUser = req.session.user;
    
    // Only admins can approve
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can approve leave applications');
    }
    
    // Get existing leave
    const existingResult = await Leave.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Leave application not found');
    }
    
    const leave = existingResult.data;
    
    if (leave.status !== 'Pending') {
        throw new ValidationError('Leave application has already been reviewed');
    }
    
    const result = await leave.approve(currentUser.id, review_notes);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to approve leave application');
    }
    
    res.json({
        success: true,
        message: 'Leave application approved successfully'
    });
});

// PUT /api/leaves/:id/reject - Reject leave application
const rejectLeave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { review_notes } = req.body;
    const currentUser = req.session.user;
    
    // Only admins can reject
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can reject leave applications');
    }
    
    if (!review_notes || review_notes.trim().length === 0) {
        throw new ValidationError('Review notes are required when rejecting a leave application');
    }
    
    // Get existing leave
    const existingResult = await Leave.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Leave application not found');
    }
    
    const leave = existingResult.data;
    
    if (leave.status !== 'Pending') {
        throw new ValidationError('Leave application has already been reviewed');
    }
    
    const result = await leave.reject(currentUser.id, review_notes);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to reject leave application');
    }
    
    res.json({
        success: true,
        message: 'Leave application rejected successfully'
    });
});

// PUT /api/leaves/:id/cancel - Cancel leave application
const cancelLeave = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;
    
    // Get existing leave
    const existingResult = await Leave.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Leave application not found');
    }
    
    const leave = existingResult.data;
    
    // Check permissions
    if (currentUser.role !== 'admin' && leave.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    if (leave.status !== 'Pending') {
        throw new ValidationError('Can only cancel pending leave applications');
    }
    
    const result = await leave.cancel();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to cancel leave application');
    }
    
    res.json({
        success: true,
        message: 'Leave application cancelled successfully'
    });
});

// POST /api/leaves/admin-create - Admin creates leave on behalf of employee (auto-approved)
const createAdminLeave = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const currentUser = req.session.user;
    
    // Only admins can create admin leaves
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can create leave on behalf of employees');
    }
    
    // Ensure employee_id is provided
    if (!req.body.employee_id) {
        throw new ValidationError('Employee ID is required');
    }
    
    // Calculate working days if not provided
    if (!req.body.days_requested || req.body.days_requested === 0) {
        const workingDays = Leave.calculateWorkingDays(req.body.start_date, req.body.end_date);
        req.body.days_requested = workingDays;
    }
    
    // Validate leave type specific rules before creating
    const leaveType = await LeaveType.findById(req.body.leave_type_id);
    if (!leaveType.success || !leaveType.data) {
        throw new ValidationError('Invalid leave type');
    }
    
    // Create the leave application
    const leave = new Leave(req.body);
    
    // Perform comprehensive validation
    const validation = await leave.validate();
    if (!validation.isValid) {
        throw new ValidationError('Leave application validation failed', validation.errors);
    }
    
    // Save the leave application
    const saveResult = await leave.save();
    
    if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to create leave application');
    }
    
    // Use the saved leave data which includes the ID
    const savedLeave = saveResult.data;
    
    // Auto-approve the leave application
    const approveResult = await savedLeave.approve(currentUser.id, 'Auto-approved by admin');
    
    if (!approveResult.success) {
        throw new Error(approveResult.error || 'Failed to auto-approve leave application');
    }
    
    res.status(201).json({
        success: true,
        data: approveResult.data,
        message: 'Leave application created and auto-approved successfully',
        warnings: validation.warnings || []
    });
});

// GET /api/leaves/balances/:employeeId - Get employee leave balances
const getLeaveBalances = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { year } = req.query;
    const currentUser = req.session.user;
    
    console.log(`DEBUG: getLeaveBalances called with employeeId: ${employeeId}, year: ${year}`);
    console.log(`DEBUG: Current user role: ${currentUser.role}, employee_id: ${currentUser.employee_id}`);
    
    // Validate employeeId
    if (!employeeId || isNaN(parseInt(employeeId))) {
        throw new ValidationError('Valid employee ID is required');
    }
    
    // Check permissions
    if (currentUser.role !== 'admin' && parseInt(employeeId) !== currentUser.employee_id) {
        console.log(`DEBUG: Access denied - user ${currentUser.employee_id} trying to access employee ${employeeId}`);
        throw new ValidationError('Access denied');
    }
    
    try {
        const result = await LeaveBalance.getEmployeeBalances(employeeId, year);
        
        console.log(`DEBUG: LeaveBalance.getEmployeeBalances result:`, result);
        
        if (!result.success) {
            console.error(`DEBUG: Error from LeaveBalance.getEmployeeBalances:`, result.error);
            throw new Error(result.error);
        }
        
        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error(`DEBUG: Exception in getLeaveBalances:`, error);
        throw error;
    }
});

// GET /api/leaves/statistics - Get leave statistics
const getLeaveStatistics = asyncHandler(async (req, res) => {
    const { year, employee_id } = req.query;
    const currentUser = req.session.user;
    
    const filters = {};
    if (year) filters.year = year;
    
    // If not admin, only show own statistics
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    } else if (employee_id) {
        filters.employee_id = employee_id;
    }
    
    const result = await Leave.getStatistics(filters);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/leaves/initialize-balances - Initialize yearly leave balances
const initializeLeaveBalances = asyncHandler(async (req, res) => {
    const { employee_id, year } = req.body;
    const currentUser = req.session.user;
    
    // Only admins can initialize balances
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can initialize leave balances');
    }
    
    if (!employee_id || !year) {
        throw new ValidationError('Employee ID and year are required');
    }
    
    const result = await LeaveBalance.initializeYearlyBalances(employee_id, year);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to initialize leave balances');
    }
    
    res.json({
        success: true,
        message: 'Leave balances initialized successfully'
    });
});

// POST /api/leaves/process-accrual - Process monthly leave accrual
const processMonthlyAccrual = asyncHandler(async (req, res) => {
    const { employee_id, year, month } = req.body;
    const currentUser = req.session.user;
    
    // Only admins can process accrual
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can process leave accrual');
    }
    
    if (!employee_id || !year || !month) {
        throw new ValidationError('Employee ID, year, and month are required');
    }
    
    const result = await LeaveBalance.processMonthlyAccrual(employee_id, year, month);
    
    if (!result.success) {
        // If it's the specific case of no existing balances, return a special message
        if (result.message && result.message.includes('no existing leave balances')) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        throw new Error(result.error || 'Failed to process monthly accrual');
    }
    
    res.json({
        success: true,
        message: 'Monthly leave accrual processed successfully'
    });
});

// ========================================
// LEAVE TYPE MANAGEMENT CONTROLLERS
// ========================================

// GET /api/leave-types - Get all leave types
const getAllLeaveTypes = asyncHandler(async (req, res) => {
    const { search, is_monetizable, requires_medical_certificate } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (is_monetizable !== undefined) filters.is_monetizable = is_monetizable === 'true';
    if (requires_medical_certificate !== undefined) filters.requires_medical_certificate = requires_medical_certificate === 'true';
    
    const result = await LeaveType.findAll(filters);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
});

// GET /api/leave-types/:id - Get leave type by ID
const getLeaveTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await LeaveType.findById(id);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    if (!result.data) {
        throw new NotFoundError('Leave type not found');
    }
    
    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/leave-types - Create new leave type (admin only)
const createLeaveType = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const leaveType = new LeaveType(req.body);
    const result = await leaveType.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to create leave type');
    }
    
    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Leave type created successfully'
    });
});

// PUT /api/leave-types/:id - Update leave type (admin only)
const updateLeaveType = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const { id } = req.params;
    
    const existingResult = await LeaveType.findById(id);
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Leave type not found');
    }
    
    const leaveType = existingResult.data;
    Object.assign(leaveType, req.body);
    leaveType.id = id;
    
    const result = await leaveType.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to update leave type');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: 'Leave type updated successfully'
    });
});

// DELETE /api/leave-types/:id - Delete leave type (admin only)
const deleteLeaveType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await LeaveType.deleteById(id);
    
    if (!result.success) {
        if (result.canSoftDelete) {
            return res.status(409).json({
                success: false,
                error: result.error,
                canSoftDelete: true,
                message: 'Leave type is in use. Consider soft delete instead.'
            });
        }
        throw new Error(result.error || 'Failed to delete leave type');
    }
    
    res.json({
        success: true,
        message: 'Leave type deleted successfully'
    });
});

// GET /api/leave-types/statistics - Get leave type statistics (admin only)
const getLeaveTypeStatistics = asyncHandler(async (req, res) => {
    const result = await LeaveType.getStatistics();
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
});

// ========================================
// ADVANCED BALANCE MANAGEMENT CONTROLLERS
// ========================================

// POST /api/leaves/balances/create - Create or update employee leave balance (admin only)
const createLeaveBalance = asyncHandler(async (req, res) => {
    const { employee_id, leave_type_id, year, earned_days, used_days, monetized_days, carried_forward, reason } = req.body;
    const currentUser = req.session.user;
    
    // Only admins can create/update leave balances
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can manage leave balances');
    }
    
    // Validate required fields
    if (!employee_id || !leave_type_id || !year) {
        throw new ValidationError('Employee ID, leave type ID, and year are required');
    }
    
    // Create leave balance object
    const leaveBalance = new LeaveBalance({
        employee_id,
        leave_type_id,
        year,
        earned_days: earned_days || 0,
        used_days: used_days || 0,
        monetized_days: monetized_days || 0,
        carried_forward: carried_forward || 0
    });
    
    // Calculate current balance
    leaveBalance.calculateBalance();
    
    // Save the leave balance
    const result = await leaveBalance.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to create/update leave balance');
    }
    
    // Log the manual balance update
    await logManualBalanceUpdate(currentUser.id, employee_id, leave_type_id, year, 'CREATE/UPDATE', reason, req);
    
    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Leave balance created/updated successfully'
    });
});

// PUT /api/leaves/balances/:id - Update employee leave balance (admin only)
const updateLeaveBalance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { earned_days, used_days, monetized_days, carried_forward, reason } = req.body;
    const currentUser = req.session.user;
    
    // Only admins can update leave balances
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can manage leave balances');
    }
    
    // Get existing balance
    const query = 'SELECT * FROM employee_leave_balances WHERE id = ?';
    const existingResult = await executeQuery(query, [id]);
    
    if (!existingResult.success || existingResult.data.length === 0) {
        throw new NotFoundError('Leave balance record not found');
    }
    
    const existingBalance = existingResult.data[0];
    
    // Update balance object
    const leaveBalance = new LeaveBalance({
        ...existingBalance,
        earned_days: earned_days !== undefined ? earned_days : existingBalance.earned_days,
        used_days: used_days !== undefined ? used_days : existingBalance.used_days,
        monetized_days: monetized_days !== undefined ? monetized_days : existingBalance.monetized_days,
        carried_forward: carried_forward !== undefined ? carried_forward : existingBalance.carried_forward
    });
    
    // Calculate current balance
    leaveBalance.calculateBalance();
    
    // Save the updated leave balance
    const result = await leaveBalance.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to update leave balance');
    }
    
    // Log the manual balance update
    await logManualBalanceUpdate(currentUser.id, existingBalance.employee_id, existingBalance.leave_type_id, existingBalance.year, 'UPDATE', reason, req);
    
    res.json({
        success: true,
        data: result.data,
        message: 'Leave balance updated successfully'
    });
});

// DELETE /api/leaves/balances/:id - Delete employee leave balance (admin only)
const deleteLeaveBalance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;
    
    // Only admins can delete leave balances
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can manage leave balances');
    }
    
    // Get the balance record before deleting for audit logging
    const getQuery = 'SELECT * FROM employee_leave_balances WHERE id = ?';
    const getResult = await executeQuery(getQuery, [id]);
    
    if (!getResult.success || getResult.data.length === 0) {
        throw new NotFoundError('Leave balance record not found');
    }
    
    const balanceRecord = getResult.data[0];
    
    // Delete the leave balance record
    const deleteQuery = 'DELETE FROM employee_leave_balances WHERE id = ?';
    const result = await executeQuery(deleteQuery, [id]);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to delete leave balance');
    }
    
    if (result.data.affectedRows === 0) {
        throw new NotFoundError('Leave balance record not found');
    }
    
    // Log the manual balance deletion
    await logManualBalanceUpdate(currentUser.id, balanceRecord.employee_id, balanceRecord.leave_type_id, balanceRecord.year, 'DELETE', 'Manual deletion', req);
    
    res.json({
        success: true,
        message: 'Leave balance deleted successfully'
    });
});

// Helper function to log manual balance updates
const logManualBalanceUpdate = async (userId, employeeId, leaveTypeId, year, operation, reason, req) => {
    try {
        const auditQuery = `
            INSERT INTO audit_logs (
                user_id, 
                action, 
                table_name, 
                record_id, 
                old_values, 
                new_values, 
                ip_address, 
                user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const auditParams = [
            userId,
            `MANUAL_BALANCE_${operation}`,
            'employee_leave_balances',
            employeeId,
            null,
            JSON.stringify({ employee_id: employeeId, leave_type_id: leaveTypeId, year, reason }),
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent')
        ];

        await executeQuery(auditQuery, auditParams);
    } catch (error) {
        console.error('Failed to log manual balance update:', error);
    }
};

// POST /api/leave-balances/monetize - Process leave monetization (admin only)
const processLeaveMonetization = asyncHandler(async (req, res) => {
    const { employee_id, leave_type_id, year, days_to_monetize } = req.body;
    const currentUser = req.session.user;
    
    if (!employee_id || !leave_type_id || !year || !days_to_monetize) {
        throw new ValidationError('Employee ID, leave type ID, year, and days to monetize are required');
    }
    
    if (days_to_monetize <= 0) {
        throw new ValidationError('Days to monetize must be greater than 0');
    }
    
    const result = await LeaveBalance.processMonetization(
        employee_id, leave_type_id, year, days_to_monetize, currentUser.id
    );
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to process leave monetization');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: result.message
    });
});

// POST /api/leave-balances/carry-forward - Process year-end carry forward (admin only)
const processCarryForward = asyncHandler(async (req, res) => {
    const { employee_id, from_year, to_year } = req.body;
    
    if (!employee_id || !from_year || !to_year) {
        throw new ValidationError('Employee ID, from year, and to year are required');
    }
    
    if (to_year !== from_year + 1) {
        throw new ValidationError('To year must be exactly one year after from year');
    }
    
    const result = await LeaveBalance.processCarryForward(employee_id, from_year, to_year);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to process carry forward');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: result.message
    });
});

// GET /api/leaves/calendar - Get leave calendar for conflict checking
const getLeaveCalendar = asyncHandler(async (req, res) => {
    const { start_date, end_date, exclude_employee_id } = req.query;
    
    if (!start_date || !end_date) {
        throw new ValidationError('Start date and end date are required');
    }
    
    const result = await Leave.getLeaveCalendar(start_date, end_date, exclude_employee_id);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to get leave calendar');
    }
    
    res.json({
        success: true,
        data: result.data
    });
});

// GET /api/leaves/pending-approvals - Get pending approvals dashboard (admin only)
const getPendingApprovals = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const filters = { status: 'Pending' };
    
    if (limit) filters.limit = parseInt(limit);
    
    const result = await Leave.getPendingApprovals(filters);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to get pending approvals');
    }
    
    res.json({
        success: true,
        data: result.data
    });
});

// ========================================
// REPORTING AND ANALYTICS CONTROLLERS
// ========================================

// GET /api/reports/leave-summary - Generate leave summary report
const generateLeaveSummaryReport = asyncHandler(async (req, res) => {
    const { year, department, employee_id, start_date, end_date } = req.query;
    
    const filters = {};
    if (year) filters.year = year;
    if (department) filters.department = department;
    if (employee_id) filters.employee_id = employee_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    
    const result = await LeaveReports.generateSummaryReport(filters);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate summary report');
    }
    
    res.json({
        success: true,
        data: result.data,
        report_type: 'leave_summary',
        generated_at: new Date().toISOString()
    });
});

// GET /api/reports/leave-usage-analytics - Generate usage analytics
const generateUsageAnalytics = asyncHandler(async (req, res) => {
    const { year } = req.query;
    
    const filters = {};
    if (year) filters.year = year;
    
    const result = await LeaveReports.generateUsageAnalytics(filters);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate usage analytics');
    }
    
    res.json({
        success: true,
        data: result.data,
        report_type: 'usage_analytics',
        generated_at: new Date().toISOString()
    });
});

// GET /api/reports/balance-utilization - Generate balance utilization report
const generateBalanceReport = asyncHandler(async (req, res) => {
    const { year, employee_id } = req.query;
    
    const filters = {};
    if (year) filters.year = year;
    if (employee_id) filters.employee_id = employee_id;
    
    const result = await LeaveReports.generateBalanceReport(filters);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate balance report');
    }
    
    res.json({
        success: true,
        data: result.data,
        report_type: 'balance_utilization',
        generated_at: new Date().toISOString()
    });
});

// GET /api/reports/pending-approvals-dashboard - Generate pending approvals dashboard
const generatePendingApprovalsDashboard = asyncHandler(async (req, res) => {
    const result = await LeaveReports.generatePendingApprovalsDashboard();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate pending approvals dashboard');
    }
    
    res.json({
        success: true,
        data: result.data,
        report_type: 'pending_approvals_dashboard',
        generated_at: new Date().toISOString()
    });
});

// GET /api/reports/compliance - Generate compliance report
const generateComplianceReport = asyncHandler(async (req, res) => {
    const { year } = req.query;
    
    const filters = {};
    if (year) filters.year = year;
    
    const result = await LeaveReports.generateComplianceReport(filters);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate compliance report');
    }
    
    res.json({
        success: true,
        data: result.data,
        report_type: 'compliance',
        generated_at: new Date().toISOString()
    });
});

// GET /api/reports/forecasting - Generate forecasting report
const generateForecastingReport = asyncHandler(async (req, res) => {
    const { year } = req.query;
    
    const filters = {};
    if (year) filters.year = year;
    
    const result = await LeaveReports.generateForecastingReport(filters);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to generate forecasting report');
    }
    
    res.json({
        success: true,
        data: result.data,
        report_type: 'forecasting',
        generated_at: new Date().toISOString()
    });
});

// POST /api/leaves/validate - Validate leave application data
const validateLeaveApplication = asyncHandler(async (req, res) => {
    const currentUser = req.session.user;
    
    // Ensure employee can only validate their own leave
    if (currentUser.role !== 'admin') {
        req.body.employee_id = currentUser.employee_id;
    }
    
    // Calculate working days if not provided
    if (!req.body.days_requested && req.body.start_date && req.body.end_date) {
        const workingDays = Leave.calculateWorkingDays(req.body.start_date, req.body.end_date);
        req.body.days_requested = workingDays;
    }
    
    // Create a temporary leave instance for validation
    const leave = new Leave(req.body);
    
    // Perform comprehensive validation
    const validation = await leave.validate();
    
    res.json({
        success: true,
        data: {
            isValid: validation.isValid,
            errors: validation.errors || [],
            warnings: validation.warnings || [],
            calculatedDays: req.body.days_requested
        }
    });
});

// POST /api/leaves/calculate-working-days - Calculate working days between dates
const calculateWorkingDays = asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.body;
    
    if (!start_date || !end_date) {
        throw new ValidationError('Start date and end date are required');
    }
    
    // Validate date format
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format');
    }
    
    if (endDate < startDate) {
        throw new ValidationError('End date must be after start date');
    }
    
    // Calculate working days using the Leave model method
    const workingDays = Leave.calculateWorkingDays(start_date, end_date);
    
    res.json({
        success: true,
        data: {
            start_date,
            end_date,
            working_days: workingDays,
            calendar_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        }
    });
});

module.exports = {
    // Leave Application Management
    getAllLeaves,
    getLeaveById,
    createLeave,
    updateLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
    createAdminLeave,
    getLeaveCalendar,
    getPendingApprovals,
    validateLeaveApplication,
    calculateWorkingDays,
    
    // Leave Balance Management
    getLeaveBalances,
    createLeaveBalance, // Add this line
    updateLeaveBalance, // Add this line
    deleteLeaveBalance, // Add this line
    initializeLeaveBalances,
    processMonthlyAccrual,
    processLeaveMonetization,
    processCarryForward,
    
    // Leave Type Management
    getAllLeaveTypes,
    getLeaveTypeById,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    getLeaveTypeStatistics,
    leaveTypeValidationRules,
    
    // Reporting and Analytics
    getLeaveStatistics,
    generateLeaveSummaryReport,
    generateUsageAnalytics,
    generateBalanceReport,
    generatePendingApprovalsDashboard,
    generateComplianceReport,
    generateForecastingReport,
    
    // Validation Rules
    leaveValidationRules
};