const { body, validationResult } = require('express-validator');
const { executeQuery, executeTransaction } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { calculateTLB, formatCurrency, calculateYearsOfService } = require('../utils/helpers');
const TerminalLeaveBenefits = require('../models/TerminalLeaveBenefits');

// Custom error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

// Validation rules for TLB computation
const tlbComputationValidationRules = [
    body('employee_id')
        .isInt({ min: 1 })
        .withMessage('Valid employee ID is required'),
    body('total_leave_credits')
        .isFloat({ min: 0 })
        .withMessage('Total leave credits must be a positive number'),
    body('highest_monthly_salary')
        .isFloat({ min: 0 })
        .withMessage('Highest monthly salary must be a positive number'),
    body('constant_factor')
        .optional()
        .isFloat({ min: 0.1, max: 2.0 })
        .withMessage('Constant factor must be between 0.1 and 2.0'),
    body('claim_date')
        .isISO8601()
        .withMessage('Valid claim date is required'),
    body('separation_date')
        .isISO8601()
        .withMessage('Valid separation date is required'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be less than 1000 characters')
];

// Validation rules for TLB update
const tlbUpdateValidationRules = [
    body('status')
        .optional()
        .isIn(['Computed', 'Approved', 'Paid', 'Cancelled'])
        .withMessage('Status must be one of: Computed, Approved, Paid, Cancelled'),
    body('check_number')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Check number must be less than 50 characters'),
    body('payment_date')
        .optional()
        .isISO8601()
        .withMessage('Valid payment date is required'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be less than 1000 characters')
];

// GET /api/tlb - Get all TLB records with filtering
const getAllTLBRecords = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        employee_id,
        year,
        search,
        sort_by = 'claim_date',
        sort_order = 'DESC'
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
    if (status) filters.status = status;
    if (year) filters.year = year;
    if (search) filters.search = search;

    const pagination = {
        page,
        limit,
        sort_by,
        sort_order
    };

    const result = await TerminalLeaveBenefits.findAll(filters, pagination);
    
    res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

// GET /api/tlb/statistics - Get TLB statistics
const getTLBStatistics = asyncHandler(async (req, res) => {
    const { year } = req.query;
    const currentUser = req.session.user;
    
    const filters = {};
    
    // Role-based access control
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    }

    // Add year filter if provided
    if (year) {
        filters.year = year;
    }

    const result = await TerminalLeaveBenefits.getStatistics(filters);
    
    res.json({
        success: true,
        data: result.data
    });
});

// GET /api/tlb/employee/:employeeId/calculation - Calculate TLB for an employee
const calculateEmployeeTLB = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { separationDate, claimDate } = req.query;
    const currentUser = req.session.user;

    // Role-based access control
    if (currentUser.role !== 'admin' && currentUser.employee_id != employeeId) {
        throw new ValidationError('You can only calculate TLB for your own record');
    }

    if (!separationDate || !claimDate) {
        throw new ValidationError('Separation date and claim date are required');
    }

    const tlb = await TerminalLeaveBenefits.calculateForEmployee(employeeId, separationDate, claimDate);
    
    res.json({
        success: true,
        data: {
            employee: {
                id: tlb.employee_id,
                name: tlb.employee_name,
                employee_number: tlb.employee_number,
                appointment_date: tlb.appointment_date,
                plantilla_position: tlb.plantilla_position,
                years_of_service: tlb.years_of_service
            },
            calculation: {
                total_leave_credits: tlb.total_leave_credits,
                highest_monthly_salary: tlb.highest_monthly_salary,
                constant_factor: tlb.constant_factor,
                computed_amount: tlb.computed_amount,
                formatted_amount: tlb.formatted_amount
            },
            dates: {
                claim_date: tlb.claim_date,
                separation_date: tlb.separation_date
            }
        }
    });
});

// POST /api/tlb - Create new TLB record
const createTLBRecord = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    const {
        employee_id,
        total_leave_credits,
        highest_monthly_salary,
        constant_factor = 1.0,
        claim_date,
        separation_date,
        notes
    } = req.body;

    const currentUser = req.session.user;

    // Only admins can create TLB records
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can create TLB records');
    }

    // Create TLB instance
    const tlb = new TerminalLeaveBenefits({
        employee_id,
        total_leave_credits,
        highest_monthly_salary,
        constant_factor,
        claim_date,
        separation_date,
        processed_by: currentUser.id,
        notes
    });

    // Save the record (validation happens inside save method)
    await tlb.save();

    // Get the created record with employee information
    const createdRecord = await TerminalLeaveBenefits.findById(tlb.id);

    res.status(201).json({
        success: true,
        data: createdRecord,
        message: 'TLB record created successfully'
    });
});

// PUT /api/tlb/:id - Update TLB record
const updateTLBRecord = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError(errors.array().map(err => err.msg).join(', '));
    }

    const { id } = req.params;
    const {
        status,
        check_number,
        payment_date,
        notes
    } = req.body;

    const currentUser = req.session.user;

    // Only admins can update TLB records
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can update TLB records');
    }

    // Get existing record
    const record = await TerminalLeaveBenefits.findById(id);
    
    if (!record) {
        throw new NotFoundError('TLB record not found');
    }

    // Update fields
    if (status !== undefined) record.status = status;
    if (check_number !== undefined) record.check_number = check_number;
    if (payment_date !== undefined) record.payment_date = payment_date;
    if (notes !== undefined) record.notes = notes;

    // Save updated record
    await record.save();

    // Get updated record with employee information
    const updatedRecord = await TerminalLeaveBenefits.findById(id);

    res.json({
        success: true,
        data: updatedRecord,
        message: 'TLB record updated successfully'
    });
});

// GET /api/tlb/:id - Get TLB record by ID
const getTLBRecordById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    const record = await TerminalLeaveBenefits.findById(id);

    if (!record) {
        throw new NotFoundError('TLB record not found');
    }

    // Role-based access control
    if (currentUser.role !== 'admin' && currentUser.employee_id != record.employee_id) {
        throw new ValidationError('You can only view your own TLB record');
    }

    res.json({
        success: true,
        data: record
    });
});

// DELETE /api/tlb/:id - Delete TLB record
const deleteTLBRecord = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    // Only admins can delete TLB records
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can delete TLB records');
    }

    // Get existing record
    const record = await TerminalLeaveBenefits.findById(id);
    
    if (!record) {
        throw new NotFoundError('TLB record not found');
    }

    // Delete the record (validation happens inside delete method)
    await record.delete();

    res.json({
        success: true,
        message: 'TLB record deleted successfully'
    });
});

// GET /api/tlb/reports/summary - Generate TLB summary report
const generateTLBSummaryReport = asyncHandler(async (req, res) => {
    const { year, status } = req.query;
    const currentUser = req.session.user;

    // Only admins can generate reports
    if (currentUser.role !== 'admin') {
        throw new ValidationError('Only administrators can generate TLB reports');
    }

    let whereClause = '';
    const queryParams = [];

    if (year) {
        whereClause = 'WHERE YEAR(tlb.claim_date) = ?';
        queryParams.push(year);
    }

    if (status) {
        if (whereClause) {
            whereClause += ' AND tlb.status = ?';
        } else {
            whereClause = 'WHERE tlb.status = ?';
        }
        queryParams.push(status);
    }

    const summaryQuery = `
        SELECT 
            tlb.status,
            COUNT(*) as record_count,
            SUM(tlb.computed_amount) as total_amount,
            AVG(tlb.computed_amount) as average_amount,
            MIN(tlb.computed_amount) as min_amount,
            MAX(tlb.computed_amount) as max_amount
        FROM terminal_leave_benefits tlb
        ${whereClause}
        GROUP BY tlb.status
        ORDER BY tlb.status
    `;

    const detailQuery = `
        SELECT 
            tlb.*,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            e.employee_number,
            e.plantilla_position
        FROM terminal_leave_benefits tlb
        JOIN employees e ON tlb.employee_id = e.id
        ${whereClause}
        ORDER BY tlb.claim_date DESC
    `;

    const [summaryResult, detailResult] = await Promise.all([
        executeQuery(summaryQuery, queryParams),
        executeQuery(detailQuery, queryParams)
    ]);

    if (!summaryResult.success || !detailResult.success) {
        throw new Error('Failed to generate TLB summary report');
    }

    const totalAmount = detailResult.data.reduce((sum, record) => sum + parseFloat(record.computed_amount), 0);
    const totalRecords = detailResult.data.length;

    res.json({
        success: true,
        data: {
            summary: summaryResult.data,
            details: detailResult.data,
            totals: {
                total_records: totalRecords,
                total_amount: parseFloat(totalAmount.toFixed(2)),
                formatted_total_amount: formatCurrency(totalAmount)
            },
            filters: {
                year: year || null,
                status: status || null
            }
        }
    });
});

module.exports = {
    // Validation rules
    tlbComputationValidationRules,
    tlbUpdateValidationRules,
    
    // Main CRUD operations
    getAllTLBRecords,
    getTLBStatistics,
    calculateEmployeeTLB,
    createTLBRecord,
    updateTLBRecord,
    getTLBRecordById,
    deleteTLBRecord,
    
    // Reports
    generateTLBSummaryReport
};