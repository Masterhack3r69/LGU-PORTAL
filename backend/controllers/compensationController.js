// controllers/compensationController.js - Employee Compensation Management
const { executeQuery, executeTransaction } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// Validation rules for compensation
const compensationValidationRules = [
    body('employee_id')
        .isInt({ min: 1 })
        .withMessage('Valid employee ID is required'),
    body('compensation_type_id')
        .isInt({ min: 1 })
        .withMessage('Valid compensation type is required'),
    body('amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
    body('year')
        .isInt({ min: 2020, max: 2030 })
        .withMessage('Valid year is required'),
    body('month')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('Month must be between 1 and 12'),
    body('date_paid')
        .optional()
        .isISO8601()
        .withMessage('Valid date is required')
];

// GET /api/compensation - Get all compensation records with pagination and filtering
const getAllCompensations = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        employee_id,
        compensation_type_id,
        year,
        month,
        date_from,
        date_to
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNumber - 1) * pageSize;

    // Build WHERE clause with filters
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (employee_id) {
        whereConditions.push('ec.employee_id = ?');
        queryParams.push(employee_id);
    }

    if (compensation_type_id) {
        whereConditions.push('ec.compensation_type_id = ?');
        queryParams.push(compensation_type_id);
    }

    if (year) {
        whereConditions.push('ec.year = ?');
        queryParams.push(year);
    }

    if (month) {
        whereConditions.push('ec.month = ?');
        queryParams.push(month);
    }

    if (date_from) {
        whereConditions.push('ec.date_paid >= ?');
        queryParams.push(date_from);
    }

    if (date_to) {
        whereConditions.push('ec.date_paid <= ?');
        queryParams.push(date_to);
    }

    const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';

    const query = `
        SELECT 
            ec.*,
            ct.name as compensation_type_name,
            ct.code as compensation_type_code,
            ct.description as compensation_type_description,
            e.first_name,
            e.last_name,
            e.employee_number,
            e.current_monthly_salary,
            e.current_daily_rate
        FROM employee_compensation ec
        LEFT JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        LEFT JOIN employees e ON ec.employee_id = e.id
        WHERE ${whereClause}
        ORDER BY ec.created_at DESC
        LIMIT ? OFFSET ?
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM employee_compensation ec
        WHERE ${whereClause}
    `;

    const [compensationsResult, countResult] = await Promise.all([
        executeQuery(query, [...queryParams, pageSize.toString(), offset.toString()]),
        executeQuery(countQuery, queryParams)
    ]);

    if (!compensationsResult.success) {
        throw new Error('Failed to fetch compensation records');
    }

    if (!countResult.success) {
        throw new Error('Failed to count compensation records');
    }

    const totalCount = countResult.data[0].total;
    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
        success: true,
        data: compensationsResult.data,
        pagination: {
            currentPage: pageNumber,
            pageSize: pageSize,
            totalRecords: totalCount,
            totalPages: totalPages,
            hasNext: pageNumber < totalPages,
            hasPrevious: pageNumber > 1
        }
    });
});

// GET /api/compensation/employee/:id - Get employee compensation history
const getEmployeeCompensation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year, type } = req.query;

    let whereConditions = ['ec.employee_id = ?'];
    let queryParams = [id];

    if (year) {
        whereConditions.push('ec.year = ?');
        queryParams.push(year);
    }

    if (type) {
        whereConditions.push('ec.compensation_type_id = ?');
        queryParams.push(type);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
        SELECT 
            ec.*,
            ct.name as compensation_type_name,
            ct.code as compensation_type_code,
            ct.description as compensation_type_description,
            ct.is_taxable,
            ct.calculation_method
        FROM employee_compensation ec
        LEFT JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        WHERE ${whereClause}
        ORDER BY ec.year DESC, ec.month DESC, ec.created_at DESC
    `;

    const result = await executeQuery(query, queryParams);

    if (!result.success) {
        throw new Error('Failed to fetch employee compensation');
    }

    // Group by year for better organization
    const compensationByYear = result.data.reduce((acc, comp) => {
        const year = comp.year;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(comp);
        return acc;
    }, {});

    res.json({
        success: true,
        data: compensationByYear,
        summary: {
            totalRecords: result.data.length,
            years: Object.keys(compensationByYear).sort((a, b) => b - a)
        }
    });
});

// POST /api/compensation - Create new compensation record
const createCompensation = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const {
        employee_id,
        compensation_type_id,
        amount,
        year,
        month,
        date_paid,
        reference_number,
        notes
    } = req.body;

    // Verify employee exists
    const employeeCheck = await executeQuery(
        'SELECT id FROM employees WHERE id = ? AND employment_status = "Active"',
        [employee_id]
    );

    if (!employeeCheck.success || employeeCheck.data.length === 0) {
        throw new NotFoundError('Employee not found or inactive');
    }

    // Verify compensation type exists
    const compensationTypeCheck = await executeQuery(
        'SELECT * FROM compensation_types WHERE id = ?',
        [compensation_type_id]
    );

    if (!compensationTypeCheck.success || compensationTypeCheck.data.length === 0) {
        throw new NotFoundError('Compensation type not found');
    }

    const compensationType = compensationTypeCheck.data[0];

    // Check for duplicates (same employee, type, year, month)
    let duplicateQuery = `
        SELECT id FROM employee_compensation 
        WHERE employee_id = ? AND compensation_type_id = ? AND year = ?
    `;
    let duplicateParams = [employee_id, compensation_type_id, year];

    if (month) {
        duplicateQuery += ' AND month = ?';
        duplicateParams.push(month);
    } else {
        duplicateQuery += ' AND month IS NULL';
    }

    const duplicateCheck = await executeQuery(duplicateQuery, duplicateParams);
    if (duplicateCheck.success && duplicateCheck.data.length > 0) {
        throw new ValidationError('Compensation record already exists for this period');
    }

    // Calculate amount if needed based on compensation type
    let finalAmount = amount;
    if (compensationType.calculation_method === 'Formula') {
        finalAmount = await calculateCompensationAmount(employee_id, compensation_type_id, year, month);
    }

    const insertQuery = `
        INSERT INTO employee_compensation 
        (employee_id, compensation_type_id, amount, year, month, date_paid, reference_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(insertQuery, [
        employee_id,
        compensation_type_id,
        finalAmount,
        year,
        month || null,
        date_paid || null,
        reference_number || null,
        notes || null
    ]);

    if (!result.success) {
        throw new Error('Failed to create compensation record');
    }

    // Fetch the created record with details
    const createdRecord = await executeQuery(`
        SELECT 
            ec.*,
            ct.name as compensation_type_name,
            ct.code as compensation_type_code,
            e.first_name,
            e.last_name,
            e.employee_number
        FROM employee_compensation ec
        LEFT JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        LEFT JOIN employees e ON ec.employee_id = e.id
        WHERE ec.id = ?
    `, [result.insertId]);

    if (!createdRecord.success || !createdRecord.data || createdRecord.data.length === 0) {
        throw new Error('Failed to fetch created compensation record');
    }

    res.status(201).json({
        success: true,
        data: createdRecord.data[0],
        message: 'Compensation record created successfully'
    });
});

// Helper function to calculate compensation amounts
const calculateCompensationAmount = async (employeeId, compensationTypeId, year, month) => {
    // Get employee salary information
    const employeeQuery = `
        SELECT current_monthly_salary, current_daily_rate, appointment_date
        FROM employees 
        WHERE id = ?
    `;
    const employeeResult = await executeQuery(employeeQuery, [employeeId]);
    
    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new Error('Employee not found');
    }

    const employee = employeeResult.data[0];
    const monthlySalary = employee.current_monthly_salary || (employee.current_daily_rate * 22);

    // Get compensation type
    const typeQuery = 'SELECT * FROM compensation_types WHERE id = ?';
    const typeResult = await executeQuery(typeQuery, [compensationTypeId]);
    
    if (!typeResult.success || typeResult.data.length === 0) {
        throw new Error('Compensation type not found');
    }

    const compensationType = typeResult.data[0];

    switch (compensationType.code) {
        case 'MYB': // 13th Month Pay
        case 'YEB': // 14th Month Pay
            // Calculate based on total salary received in the year
            const salaryQuery = `
                SELECT COALESCE(SUM(amount), 0) as total_salary
                FROM employee_compensation ec
                JOIN compensation_types ct ON ec.compensation_type_id = ct.id
                WHERE ec.employee_id = ? AND ec.year = ? AND ct.code = 'BASIC'
            `;
            const salaryResult = await executeQuery(salaryQuery, [employeeId, year]);
            const totalSalary = salaryResult.data[0]?.total_salary || (monthlySalary * 12);
            return totalSalary / 12;

        case 'LA': // Loyalty Award
            const appointmentDate = new Date(employee.appointment_date);
            const currentDate = new Date();
            const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();
            
            if (serviceYears <= 10) {
                return 10000;
            } else {
                return 10000 + (Math.floor((serviceYears - 10) / 5) * 5000);
            }

        default:
            return 0; // For fixed amounts, return 0 to use the provided amount
    }
};

// PUT /api/compensation/:id - Update compensation record
const updateCompensation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        amount,
        date_paid,
        reference_number,
        notes
    } = req.body;

    // Check if record exists
    const existingRecord = await executeQuery(
        'SELECT * FROM employee_compensation WHERE id = ?',
        [id]
    );

    if (!existingRecord.success || existingRecord.data.length === 0) {
        throw new NotFoundError('Compensation record not found');
    }

    const updateQuery = `
        UPDATE employee_compensation 
        SET amount = ?, date_paid = ?, reference_number = ?, notes = ?
        WHERE id = ?
    `;

    const result = await executeQuery(updateQuery, [
        amount,
        date_paid || null,
        reference_number || null,
        notes || null,
        id
    ]);

    if (!result.success) {
        throw new Error('Failed to update compensation record');
    }

    // Fetch updated record
    const updatedRecord = await executeQuery(`
        SELECT 
            ec.*,
            ct.name as compensation_type_name,
            ct.code as compensation_type_code,
            e.first_name,
            e.last_name,
            e.employee_number
        FROM employee_compensation ec
        LEFT JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        LEFT JOIN employees e ON ec.employee_id = e.id
        WHERE ec.id = ?
    `, [id]);

    res.json({
        success: true,
        data: updatedRecord.data[0],
        message: 'Compensation record updated successfully'
    });
});

// DELETE /api/compensation/:id - Delete compensation record
const deleteCompensation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await executeQuery(
        'DELETE FROM employee_compensation WHERE id = ?',
        [id]
    );

    if (!result.success) {
        throw new Error('Failed to delete compensation record');
    }

    if (result.affectedRows === 0) {
        throw new NotFoundError('Compensation record not found');
    }

    res.json({
        success: true,
        message: 'Compensation record deleted successfully'
    });
});

// GET /api/compensation/types - Get all compensation types
const getCompensationTypes = asyncHandler(async (req, res) => {
    const result = await executeQuery(
        'SELECT * FROM compensation_types ORDER BY name ASC'
    );

    if (!result.success) {
        throw new Error('Failed to fetch compensation types');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/compensation/bulk - Bulk compensation operations
const bulkCompensationOperations = asyncHandler(async (req, res) => {
    const { operation, data } = req.body;

    if (!operation || !data || !Array.isArray(data)) {
        throw new ValidationError('Operation and data array are required');
    }

    switch (operation) {
        case 'create':
            return await bulkCreateCompensations(data, res);
        case 'update':
            return await bulkUpdateCompensations(data, res);
        case 'delete':
            return await bulkDeleteCompensations(data, res);
        default:
            throw new ValidationError('Invalid operation. Supported: create, update, delete');
    }
});

// Helper function for bulk create
const bulkCreateCompensations = async (compensations, res) => {
    const results = [];
    const errors = [];

    for (const compensation of compensations) {
        try {
            // Validate each record
            if (!compensation.employee_id || !compensation.compensation_type_id || !compensation.amount) {
                errors.push({
                    data: compensation,
                    error: 'Missing required fields'
                });
                continue;
            }

            const insertQuery = `
                INSERT INTO employee_compensation 
                (employee_id, compensation_type_id, amount, year, month, date_paid, reference_number, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(insertQuery, [
                compensation.employee_id,
                compensation.compensation_type_id,
                compensation.amount,
                compensation.year,
                compensation.month || null,
                compensation.date_paid || null,
                compensation.reference_number || null,
                compensation.notes || null
            ]);

            if (result.success) {
                results.push({
                    id: result.insertId,
                    ...compensation
                });
            } else {
                errors.push({
                    data: compensation,
                    error: 'Database insertion failed'
                });
            }
        } catch (error) {
            errors.push({
                data: compensation,
                error: error.message
            });
        }
    }

    res.json({
        success: true,
        data: {
            created: results,
            errors: errors
        },
        message: `Bulk operation completed. ${results.length} created, ${errors.length} errors`
    });
};

module.exports = {
    getAllCompensations,
    getEmployeeCompensation,
    createCompensation,
    updateCompensation,
    deleteCompensation,
    getCompensationTypes,
    bulkCompensationOperations,
    compensationValidationRules
};