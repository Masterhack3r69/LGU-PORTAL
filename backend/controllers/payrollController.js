// controllers/payrollController.js - Enhanced Payroll Management with Leave Integration
const { executeQuery } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const { GovernmentDeductionsCalculator, ProratedSalaryCalculator, StepIncrementProcessor } = require('../utils/payrollCalculations');

// Enhanced logging utility
const payrollLogger = {
    info: (message, data = {}) => {
        console.log(`[PAYROLL-INFO] ${new Date().toISOString()}: ${message}`, data);
    },
    error: (message, error = {}, data = {}) => {
        console.error(`[PAYROLL-ERROR] ${new Date().toISOString()}: ${message}`, {
            error: error.message || error,
            stack: error.stack,
            data
        });
    },
    warn: (message, data = {}) => {
        console.warn(`[PAYROLL-WARN] ${new Date().toISOString()}: ${message}`, data);
    },
    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[PAYROLL-DEBUG] ${new Date().toISOString()}: ${message}`, data);
        }
    }
};

// Validation rules for payroll period
const payrollPeriodValidationRules = [
    body('year')
        .isInt({ min: 2020, max: 2030 })
        .withMessage('Year must be between 2020 and 2030'),
    body('month')
        .isInt({ min: 1, max: 12 })
        .withMessage('Month must be between 1 and 12'),
    body('period_number')
        .isInt({ min: 1, max: 2 })
        .withMessage('Period number must be 1 or 2'),
    body('start_date')
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date (YYYY-MM-DD)')
        .custom((value, { req }) => {
            const startDate = new Date(value);
            const year = req.body.year;
            if (year) {
                const expectedYear = startDate.getFullYear();
                if (expectedYear !== parseInt(year)) {
                    throw new Error('Start date must be in the specified year');
                }
            }
            return true;
        }),
    body('end_date')
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date (YYYY-MM-DD)')
        .custom((value, { req }) => {
            const endDate = new Date(value);
            const startDate = new Date(req.body.start_date);
            if (startDate && endDate <= startDate) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    body('pay_date')
        .isISO8601()
        .withMessage('Pay date must be a valid ISO 8601 date (YYYY-MM-DD)')
        .custom((value, { req }) => {
            const payDate = new Date(value);
            const endDate = new Date(req.body.end_date);
            if (endDate && payDate <= endDate) {
                throw new Error('Pay date must be after end date');
            }
            return true;
        })
];

// GET /api/payroll - Get payroll periods with pagination
const getPayrollPeriods = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        year,
        month,
        status 
    } = req.query;

    // Sanitize and validate pagination parameters
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNumber - 1) * pageSize;

    let whereConditions = ['1=1'];
    let queryParams = [];

    // Validate and add year filter
    if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
            whereConditions.push('year = ?');
            queryParams.push(yearNum);
        }
    }

    // Validate and add month filter
    if (month) {
        const monthNum = parseInt(month);
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
            whereConditions.push('month = ?');
            queryParams.push(monthNum);
        }
    }

    // Validate and add status filter
    if (status) {
        const validStatuses = ['Draft', 'Processing', 'Completed', 'Cancelled'];
        if (validStatuses.includes(status)) {
            whereConditions.push('status = ?');
            queryParams.push(status);
        }
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
        SELECT 
            pp.*,
            u.username as created_by_name,
            (SELECT COUNT(*) FROM payroll_items pi WHERE pi.payroll_period_id = pp.id) as employee_count,
            (SELECT COALESCE(SUM(net_pay), 0) FROM payroll_items pi WHERE pi.payroll_period_id = pp.id) as total_net_pay
        FROM payroll_periods pp
        LEFT JOIN users u ON pp.created_by = u.id
        WHERE ${whereClause}
        ORDER BY pp.year DESC, pp.month DESC, pp.period_number DESC
        LIMIT ? OFFSET ?
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM payroll_periods pp
        WHERE ${whereClause}
    `;

    const [periodsResult, countResult] = await Promise.all([
        executeQuery(query, [...queryParams, pageSize.toString(), offset.toString()]),
        executeQuery(countQuery, queryParams)
    ]);

    if (!periodsResult.success) {
        throw new Error('Failed to fetch payroll periods');
    }

    const totalCount = countResult.success ? countResult.data[0].total : 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
        success: true,
        data: periodsResult.data,
        pagination: {
            currentPage: pageNumber,
            pageSize: pageSize,
            totalRecords: totalCount,
            totalPages: totalPages,
            hasNext: pageNumber < totalPages,
            hasPrevious: pageNumber > 1
        },
        filters: {
            year: year ? parseInt(year) : null,
            month: month ? parseInt(month) : null,
            status: status || null
        }
    });
});

// POST /api/payroll/period - Create new payroll period
const createPayrollPeriod = asyncHandler(async (req, res) => {
    // Add detailed logging for debugging
    payrollLogger.info('Creating payroll period request received', {
        body: req.body,
        user: req.user?.id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        payrollLogger.error('Validation failed for payroll period creation', {
            errors: errors.array(),
            body: req.body
        });
        throw new ValidationError('Validation failed', errors.array());
    }

    const {
        year,
        month,
        period_number,
        start_date,
        end_date,
        pay_date
    } = req.body;

    // Check for duplicate period
    const duplicateCheck = await executeQuery(
        'SELECT id FROM payroll_periods WHERE year = ? AND month = ? AND period_number = ?',
        [year, month, period_number]
    );

    if (!duplicateCheck.success) {
        payrollLogger.error('Duplicate check failed', duplicateCheck.error);
        throw new Error('Failed to check for duplicate payroll period');
    }

    if (duplicateCheck.data.length > 0) {
        throw new ValidationError('Payroll period already exists');
    }

    // Validate date logic
    if (new Date(start_date) >= new Date(end_date)) {
        throw new ValidationError('Start date must be before end date');
    }

    if (new Date(pay_date) <= new Date(end_date)) {
        throw new ValidationError('Pay date must be after end date');
    }

    const insertQuery = `
        INSERT INTO payroll_periods
        (year, month, period_number, start_date, end_date, pay_date, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'Draft', ?)
    `;

    const result = await executeQuery(insertQuery, [
        year, month, period_number, start_date, end_date, pay_date, req.user.id
    ]);

    if (!result.success) {
        payrollLogger.error('Payroll period insert failed', result.error);
        throw new Error('Failed to create payroll period');
    }

    const insertId = result.insertId;
    if (!insertId) {
        throw new Error('Failed to get inserted period ID');
    }

    // Fetch the created period
    const createdPeriod = await executeQuery(
        'SELECT * FROM payroll_periods WHERE id = ?',
        [insertId]
    );

    if (!createdPeriod.success || !createdPeriod.data || createdPeriod.data.length === 0) {
        throw new Error('Failed to fetch created payroll period');
    }

    res.status(201).json({
        success: true,
        data: createdPeriod.data[0],
        message: 'Payroll period created successfully'
    });
});

// GET /api/payroll/period/:id - Get specific payroll period with items
const getPayrollPeriod = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID parameter
    const periodId = parseInt(id);
    if (isNaN(periodId) || periodId <= 0) {
        throw new ValidationError('Invalid payroll period ID. Must be a positive number.');
    }

    const periodQuery = `
        SELECT 
            pp.*,
            u.username as created_by_name
        FROM payroll_periods pp
        LEFT JOIN users u ON pp.created_by = u.id
        WHERE pp.id = ?
    `;

    const itemsQuery = `
        SELECT 
            pi.*,
            e.first_name,
            e.last_name,
            e.employee_number,
            e.current_daily_rate,
            e.current_monthly_salary
        FROM payroll_items pi
        LEFT JOIN employees e ON pi.employee_id = e.id
        WHERE pi.payroll_period_id = ?
        ORDER BY e.employee_number ASC
    `;

    const [periodResult, itemsResult] = await Promise.all([
        executeQuery(periodQuery, [periodId]),
        executeQuery(itemsQuery, [periodId])
    ]);

    if (!periodResult.success) {
        throw new Error('Failed to fetch payroll period from database');
    }

    if (periodResult.data.length === 0) {
        throw new NotFoundError(`Payroll period with ID ${periodId} not found`);
    }

    const period = periodResult.data[0];
    const items = itemsResult.success ? itemsResult.data : [];

    res.json({
        success: true,
        data: {
            period,
            items,
            summary: {
                employee_count: items.length,
                total_gross_pay: items.reduce((sum, item) => sum + parseFloat(item.gross_pay || 0), 0),
                total_deductions: items.reduce((sum, item) => sum + parseFloat(item.total_deductions || 0), 0),
                total_net_pay: items.reduce((sum, item) => sum + parseFloat(item.net_pay || 0), 0)
            }
        }
    });
});

// POST /api/payroll/generate - Generate payroll for period with leave integration
const generatePayroll = asyncHandler(async (req, res) => {
    const { period_id } = req.body;
    const startTime = Date.now();

    payrollLogger.info('Starting payroll generation', { period_id, user_id: req.user.id });

    if (!period_id) {
        throw new ValidationError('Payroll period ID is required');
    }

    // Get payroll period
    const periodResult = await executeQuery(
        'SELECT * FROM payroll_periods WHERE id = ?',
        [period_id]
    );

    if (!periodResult.success || periodResult.data.length === 0) {
        payrollLogger.error('Payroll period not found', {}, { period_id });
        throw new NotFoundError('Payroll period not found');
    }

    const period = periodResult.data[0];

    if (period.status !== 'Draft') {
        payrollLogger.warn('Attempted to generate payroll for non-draft period', { period_id, status: period.status });
        throw new ValidationError('Can only generate payroll for draft periods');
    }

    // Check if payroll items already exist for this period
    const existingItemsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM payroll_items WHERE payroll_period_id = ?',
        [period_id]
    );

    if (existingItemsResult.success && existingItemsResult.data[0].count > 0) {
        payrollLogger.warn('Payroll items already exist for this period', { period_id, existing_count: existingItemsResult.data[0].count });
        throw new ValidationError('Payroll has already been generated for this period. Use update functionality instead.');
    }

    // Get active employees
    const employeesResult = await executeQuery(`
        SELECT 
            id, employee_number, first_name, last_name,
            current_daily_rate, current_monthly_salary,
            appointment_date, employment_status, salary_grade, step_increment
        FROM employees 
        WHERE employment_status = 'Active'
            AND appointment_date <= ?
        ORDER BY employee_number ASC
    `, [period.end_date]);

    if (!employeesResult.success) {
        payrollLogger.error('Failed to fetch employees', employeesResult.error);
        throw new Error('Failed to fetch employees');
    }

    const employees = employeesResult.data;
    payrollLogger.info('Processing payroll for employees', { employee_count: employees.length, period_id });

    const payrollItems = [];
    const processingErrors = [];

    // Process each employee
    for (const employee of employees) {
        try {
            payrollLogger.debug('Processing employee payroll', { employee_id: employee.id, employee_number: employee.employee_number });
            const payrollItem = await calculateEmployeePayroll(employee, period);
            payrollItems.push(payrollItem);
        } catch (error) {
            const errorInfo = {
                employee_id: employee.id,
                employee_number: employee.employee_number,
                error: error.message
            };
            processingErrors.push(errorInfo);
            payrollLogger.error('Error calculating payroll for employee', error, errorInfo);
        }
    }

    if (payrollItems.length === 0) {
        payrollLogger.error('No payroll items generated', {}, { period_id, total_employees: employees.length, errors: processingErrors });
        throw new Error('Failed to generate payroll items for any employees');
    }

    // Insert payroll items
    const insertResults = [];
    let insertErrors = 0;
    
    for (const item of payrollItems) {
        try {
            const insertQuery = `
                INSERT INTO payroll_items 
                (employee_id, payroll_period_id, basic_salary, days_worked, 
                 rata, clothing_allowance, medical_allowance, hazard_allowance, subsistence_laundry,
                 gsis_contribution, pagibig_contribution, philhealth_contribution, tax_withheld, other_deductions,
                 gross_pay, total_deductions, net_pay)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await executeQuery(insertQuery, [
                item.employee_id, period_id, item.basic_salary, item.days_worked,
                item.rata, item.clothing_allowance, item.medical_allowance, item.hazard_allowance, item.subsistence_laundry,
                item.gsis_contribution, item.pagibig_contribution, item.philhealth_contribution, 
                item.tax_withheld, item.other_deductions,
                item.gross_pay, item.total_deductions, item.net_pay
            ]);
            
            if (result.success) {
                insertResults.push({ employee_id: item.employee_id, payroll_item_id: result.insertId });
            } else {
                insertErrors++;
                payrollLogger.error('Failed to insert payroll item', result.error, { employee_id: item.employee_id });
            }
        } catch (error) {
            insertErrors++;
            payrollLogger.error('Error inserting payroll item', error, { employee_id: item.employee_id });
        }
    }

    if (insertResults.length === 0) {
        payrollLogger.error('Failed to insert any payroll items', {}, { period_id, total_items: payrollItems.length });
        throw new Error('Failed to generate any payroll items');
    }

    // Update period status
    const updateResult = await executeQuery(
        'UPDATE payroll_periods SET status = "Processing" WHERE id = ?',
        [period_id]
    );

    if (!updateResult.success) {
        payrollLogger.error('Failed to update period status', updateResult.error, { period_id });
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    payrollLogger.info('Payroll generation completed', {
        period_id,
        employees_processed: employees.length,
        payroll_items_created: insertResults.length,
        processing_errors: processingErrors.length,
        insert_errors: insertErrors,
        processing_time_ms: processingTime
    });

    res.json({
        success: true,
        data: {
            period_id,
            employees_processed: employees.length,
            payroll_items_created: insertResults.length,
            processing_summary: {
                successful_items: insertResults.length,
                failed_items: insertErrors,
                employee_errors: processingErrors.length,
                processing_time_ms: processingTime
            }
        },
        message: `Payroll generated successfully. ${insertResults.length} items created.`,
        warnings: processingErrors.length > 0 ? `${processingErrors.length} employees had processing errors` : null
    });
});

// Helper function to calculate employee payroll with leave integration (optimized)
const calculateEmployeePayroll = async (employee, period) => {
    const baseWorkingDays = 22;
    const dailyRate = employee.current_daily_rate || (employee.current_monthly_salary / 22) || 0;

    try {
        // Get approved leave days for the period (optimized single query)
        const leaveData = await getApprovedLeaveForPeriod(
            employee.id, 
            period.start_date, 
            period.end_date
        );

        // Calculate actual working days
        const actualWorkingDays = Math.max(0, baseWorkingDays - leaveData.unpaidLeaveDays);

        // Calculate basic salary based on actual working days
        const basicSalary = dailyRate * actualWorkingDays;

        // Get allowances (optimized single query)
        const allowances = await getEmployeeAllowances(employee.id, period.year, period.month);

        // Calculate gross pay
        const grossPay = basicSalary + allowances.total;

        // Calculate deductions
        const deductions = await calculateDeductions(employee, basicSalary, grossPay);

        // Calculate net pay
        const netPay = grossPay - deductions.total;

        return {
            employee_id: employee.id,
            basic_salary: parseFloat(basicSalary.toFixed(2)),
            days_worked: actualWorkingDays,
            leave_days_taken: leaveData.totalLeaveDays,
            unpaid_leave_days: leaveData.unpaidLeaveDays,
            rata: allowances.rata,
            clothing_allowance: allowances.clothing_allowance,
            medical_allowance: allowances.medical_allowance,
            hazard_allowance: allowances.hazard_allowance,
            subsistence_laundry: allowances.subsistence_laundry,
            gsis_contribution: deductions.gsis,
            pagibig_contribution: deductions.pagibig,
            philhealth_contribution: deductions.philhealth,
            tax_withheld: deductions.tax,
            other_deductions: deductions.other,
            gross_pay: parseFloat(grossPay.toFixed(2)),
            total_deductions: parseFloat(deductions.total.toFixed(2)),
            net_pay: parseFloat(netPay.toFixed(2))
        };
    } catch (error) {
        console.error(`Error calculating payroll for employee ${employee.employee_number}:`, error);
        throw new Error(`Failed to calculate payroll for employee ${employee.employee_number}: ${error.message}`);
    }
};

// Helper function to get approved leave days for payroll period (optimized)
const getApprovedLeaveForPeriod = async (employeeId, startDate, endDate) => {
    const query = `
        SELECT 
            SUM(CASE 
                WHEN lt.code = 'LWOP' THEN la.days_requested 
                ELSE 0 
            END) as unpaid_leave_days,
            SUM(la.days_requested) as total_leave_days
        FROM leave_applications la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.employee_id = ? 
            AND la.status = 'Approved'
            AND (
                (la.start_date BETWEEN ? AND ?) OR
                (la.end_date BETWEEN ? AND ?) OR
                (la.start_date <= ? AND la.end_date >= ?)
            )
    `;

    try {
        const result = await executeQuery(query, [
            employeeId, startDate, endDate, startDate, endDate, startDate, endDate
        ]);

        if (!result.success || !result.data || result.data.length === 0) {
            return { unpaidLeaveDays: 0, totalLeaveDays: 0 };
        }

        const data = result.data[0];
        return {
            unpaidLeaveDays: parseFloat(data.unpaid_leave_days || 0),
            totalLeaveDays: parseFloat(data.total_leave_days || 0)
        };
    } catch (error) {
        console.error(`Error fetching leave data for employee ${employeeId}:`, error);
        return { unpaidLeaveDays: 0, totalLeaveDays: 0 };
    }
};

// Helper function to get employee allowances
const getEmployeeAllowances = async (employeeId, year, month) => {
    const allowances = {
        rata: 0,
        clothing_allowance: 0,
        medical_allowance: 0,
        hazard_allowance: 0,
        subsistence_laundry: 0,
        total: 0
    };

    // Get compensation records for allowances
    const query = `
        SELECT ec.amount, ct.code
        FROM employee_compensation ec
        JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        WHERE ec.employee_id = ? 
            AND ec.year = ? 
            AND (ec.month = ? OR ec.month IS NULL)
            AND ct.code IN ('RATA', 'CA', 'MA', 'HA', 'SL')
    `;

    const result = await executeQuery(query, [employeeId, year, month]);

    if (result.success) {
        result.data.forEach(comp => {
            switch (comp.code) {
                case 'RATA':
                    allowances.rata = parseFloat(comp.amount);
                    break;
                case 'CA':
                    allowances.clothing_allowance = parseFloat(comp.amount);
                    break;
                case 'MA':
                    allowances.medical_allowance = parseFloat(comp.amount);
                    break;
                case 'HA':
                    allowances.hazard_allowance = parseFloat(comp.amount);
                    break;
                case 'SL':
                    allowances.subsistence_laundry = parseFloat(comp.amount);
                    break;
            }
        });
    }

    allowances.total = allowances.rata + allowances.clothing_allowance + 
                     allowances.medical_allowance + allowances.hazard_allowance + 
                     allowances.subsistence_laundry;

    return allowances;
};

// Helper function to calculate deductions using enhanced government calculator
const calculateDeductions = async (employee, basicSalary, grossPay) => {
    // Get employee details for more accurate calculations
    const employeeDetailsResult = await executeQuery(
        'SELECT salary_grade, step_increment FROM employees WHERE id = ?',
        [employee.id]
    );

    const employeeDetails = employeeDetailsResult.success ? employeeDetailsResult.data[0] : {};

    // Use enhanced government deductions calculator
    const governmentDeductions = GovernmentDeductionsCalculator.calculateAllDeductions(
        basicSalary,
        employeeDetails.salary_grade,
        employeeDetails.step_increment
    );

    return {
        gsis: governmentDeductions.gsis,
        pagibig: governmentDeductions.pagibig,
        philhealth: governmentDeductions.philhealth,
        tax: governmentDeductions.tax,
        other: 0,
        total: governmentDeductions.totalDeductions
    };
};

// GET /api/payroll/employee/:id - Get employee payroll history
const getEmployeePayrollHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year, limit = 12 } = req.query;

    // Validate employee ID
    const employeeId = parseInt(id);
    if (isNaN(employeeId) || employeeId <= 0) {
        throw new ValidationError('Invalid employee ID. Must be a positive number.');
    }

    // Validate limit parameter
    const limitNum = parseInt(limit);
    const finalLimit = isNaN(limitNum) || limitNum <= 0 ? 12 : Math.min(limitNum, 100);

    // First check if employee exists
    const employeeCheck = await executeQuery(
        'SELECT id, first_name, last_name, employee_number FROM employees WHERE id = ?',
        [employeeId]
    );

    if (!employeeCheck.success) {
        throw new Error('Failed to verify employee existence');
    }

    if (employeeCheck.data.length === 0) {
        return res.json({
            success: true,
            data: [],
            message: `No employee found with ID ${employeeId}`,
            summary: {
                total_records: 0,
                total_net_pay: 0,
                employee_info: null
            }
        });
    }

    const employee = employeeCheck.data[0];

    let whereConditions = ['pi.employee_id = ?'];
    let queryParams = [employeeId];

    if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
            whereConditions.push('pp.year = ?');
            queryParams.push(yearNum);
        }
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
        SELECT 
            pi.*,
            pp.year,
            pp.month,
            pp.period_number,
            pp.start_date,
            pp.end_date,
            pp.pay_date,
            pp.status
        FROM payroll_items pi
        JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
        WHERE ${whereClause}
        ORDER BY pp.year DESC, pp.month DESC, pp.period_number DESC
        LIMIT ?
    `;

    const result = await executeQuery(query, [...queryParams, finalLimit.toString()]);

    if (!result.success) {
        throw new Error('Failed to fetch employee payroll history');
    }

    res.json({
        success: true,
        data: result.data,
        summary: {
            total_records: result.data.length,
            total_net_pay: result.data.reduce((sum, item) => sum + parseFloat(item.net_pay || 0), 0),
            employee_info: {
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number
            }
        }
    });
});

// GET /api/payroll/leave-summary/:id/:period - Get leave summary for payroll
const getPayrollLeaveSummary = asyncHandler(async (req, res) => {
    const { id, period } = req.params;

    // Get payroll period
    const periodResult = await executeQuery(
        'SELECT * FROM payroll_periods WHERE id = ?',
        [period]
    );

    if (!periodResult.success || periodResult.data.length === 0) {
        throw new NotFoundError('Payroll period not found');
    }

    const payrollPeriod = periodResult.data[0];

    // Get leave applications for the period
    const leaveQuery = `
        SELECT 
            la.*,
            lt.name as leave_type_name,
            lt.code as leave_type_code,
            e.first_name,
            e.last_name,
            e.employee_number
        FROM leave_applications la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        JOIN employees e ON la.employee_id = e.id
        WHERE la.employee_id = ? 
            AND la.status = 'Approved'
            AND (
                (la.start_date >= ? AND la.start_date <= ?) OR
                (la.end_date >= ? AND la.end_date <= ?) OR
                (la.start_date <= ? AND la.end_date >= ?)
            )
        ORDER BY la.start_date ASC
    `;

    const result = await executeQuery(leaveQuery, [
        id, 
        payrollPeriod.start_date, payrollPeriod.end_date,
        payrollPeriod.start_date, payrollPeriod.end_date,
        payrollPeriod.start_date, payrollPeriod.end_date
    ]);

    if (!result.success) {
        throw new Error('Failed to fetch leave summary');
    }

    const leaves = result.data;
    const totalLeaveDays = leaves.reduce((sum, leave) => sum + parseFloat(leave.days_requested), 0);
    const unpaidLeaveDays = leaves
        .filter(leave => leave.leave_type_code === 'LWOP')
        .reduce((sum, leave) => sum + parseFloat(leave.days_requested), 0);

    res.json({
        success: true,
        data: {
            period: payrollPeriod,
            leaves: leaves,
            summary: {
                total_leave_days: totalLeaveDays,
                unpaid_leave_days: unpaidLeaveDays,
                actual_working_days: 22 - unpaidLeaveDays
            }
        }
    });
});

// POST /api/payroll/calculate-prorated - Calculate prorated salary for new/separated employees
const calculateProratedSalary = asyncHandler(async (req, res) => {
    const { employee_id, period_start_date, period_end_date } = req.body;

    // Enhanced validation
    if (!employee_id) {
        throw new ValidationError('Employee ID is required');
    }

    if (!period_start_date || !period_end_date) {
        throw new ValidationError('Period start date and end date are required');
    }

    // Validate employee_id is a number
    const employeeIdNum = parseInt(employee_id);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
        throw new ValidationError('Employee ID must be a valid positive number');
    }

    // Validate date formats
    const startDate = new Date(period_start_date);
    const endDate = new Date(period_end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format. Use YYYY-MM-DD format');
    }

    if (startDate >= endDate) {
        throw new ValidationError('Start date must be before end date');
    }

    // Get employee details
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ? AND employment_status IN ("Active", "Resigned", "Terminated")',
        [employeeIdNum]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or not eligible for payroll calculation');
    }

    const employee = employeeResult.data[0];
    
    try {
        const proratedCalculation = ProratedSalaryCalculator.calculateProratedSalary(
            employee, period_start_date, period_end_date
        );

        res.json({
            success: true,
            data: {
                employee_id: employeeIdNum,
                employee_name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                calculation: proratedCalculation,
                recommendation: proratedCalculation.proratedDays < 22 ?
                    'Use prorated salary calculation for this employee' : 'Use standard monthly salary',
                period: {
                    start_date: period_start_date,
                    end_date: period_end_date
                }
            }
        });
    } catch (error) {
        console.error('Error calculating prorated salary:', error);
        throw new Error('Failed to calculate prorated salary: ' + error.message);
    }
});

// POST /api/payroll/process-step-increments - Process step increment for eligible employees
const processStepIncrements = asyncHandler(async (req, res) => {
    const { year, month } = req.body;

    if (!year || !month) {
        throw new ValidationError('Year and month are required');
    }

    const results = await StepIncrementProcessor.checkAndProcessStepIncrements(year, month);

    res.json({
        success: true,
        data: {
            year,
            month,
            processed_employees: results.processed.length,
            total_eligible: results.totalEmployees,
            errors: results.errors.length,
            summaries: results.processed.map(r => ({
                employee_id: r.employee_id,
                old_step: r.old_step,
                new_step: r.new_step,
                salary_change: r.new_salary - r.old_salary
            }))
        },
        message: `Step increment processing completed. ${results.processed.length} employees updated, ${results.errors.length} errors.`
    });
});

// POST /api/payroll/finalize-period - Finalize payroll period after review
const finalizePayrollPeriod = asyncHandler(async (req, res) => {
    const { period_id } = req.body;

    if (!period_id) {
        throw new ValidationError('Payroll period ID is required');
    }

    // Get payroll period
    const periodResult = await executeQuery(
        'SELECT * FROM payroll_periods WHERE id = ?',
        [period_id]
    );

    if (!periodResult.success || periodResult.data.length === 0) {
        throw new NotFoundError('Payroll period not found');
    }

    const period = periodResult.data[0];

    if (period.status !== 'Processing') {
        throw new ValidationError('Can only finalize periods in processing status');
    }

    // Verify all payroll items exist and are valid
    const payrollCountResult = await executeQuery(
        'SELECT COUNT(*) as item_count FROM payroll_items WHERE payroll_period_id = ?',
        [period_id]
    );

    if (!payrollCountResult.success) {
        throw new Error('Failed to verify payroll items');
    }

    const itemCount = payrollCountResult.data[0].item_count;

    if (itemCount === 0) {
        throw new ValidationError('Cannot finalize period with no payroll items');
    }

    // Update period status to Completed
    const updateResult = await executeQuery(
        'UPDATE payroll_periods SET status = "Completed" WHERE id = ?',
        [period_id]
    );

    if (!updateResult.success) {
        throw new Error('Failed to finalize payroll period');
    }

    res.json({
        success: true,
        data: {
            period_id,
            status: 'Completed',
            payroll_items_processed: itemCount
        },
        message: 'Payroll period finalized successfully'
    });
});

// GET /api/payroll/government-rates - Get current government contribution rates
const getGovernmentContributionRates = asyncHandler(async (req, res) => {
    // Sample salary for calculation examples
    const sampleSalary = 25000;

    const gsis = GovernmentDeductionsCalculator.getGSISContribution(sampleSalary);
    const pagibig = GovernmentDeductionsCalculator.getPagibigContribution(sampleSalary);
    const philhealth = GovernmentDeductionsCalculator.getPhilhealthContribution(sampleSalary);
    const tax = GovernmentDeductionsCalculator.getBIRTax(sampleSalary);

    res.json({
        success: true,
        data: {
            sample_salary: sampleSalary,
            rates: {
                gsis: {
                    employee_pc: gsis.totalGSIS,
                    employee_mpli: 0, // Not included in basic calculation
                    total: gsis.totalGSIS
                },
                pagibig: pagibig,
                philhealth: philhealth,
                bir_tax: tax
            },
            total_deductions: gsis.totalGSIS + pagibig + philhealth + tax,
            effective_date: '2025-01-01',
            rate_source: 'BIR RMC 5-2025, GSIS Circulars 2025'
        }
    });
});

// ===================================================================
// MANUAL PAYROLL PROCESSING
// ===================================================================

// Enhanced helper function to calculate all deductions from database
const calculateAllDeductions = async (employee, grossPay = null) => {
    // Use gross pay if provided, otherwise use monthly salary
    const salaryBase = grossPay || employee.current_monthly_salary;
    
    // Get all active deduction types from database
    const deductionTypesQuery = `
        SELECT id, code, name, deduction_type, amount, percentage, max_amount, is_government, is_mandatory
        FROM payroll_deduction_types 
        WHERE is_active = 1
        ORDER BY is_government DESC, is_mandatory DESC, name ASC
    `;
    
    const deductionTypesResult = await executeQuery(deductionTypesQuery, []);
    const deductionTypes = deductionTypesResult.success ? deductionTypesResult.data : [];
    
    let totalDeductions = 0;
    const deductionBreakdown = [];
    
    // Calculate each deduction based on its configuration
    for (const deductionType of deductionTypes) {
        let deductionAmount = 0;
        
        if (deductionType.deduction_type === 'fixed') {
            deductionAmount = parseFloat(deductionType.amount || 0);
        } else if (deductionType.deduction_type === 'percentage') {
            deductionAmount = salaryBase * (parseFloat(deductionType.percentage || 0) / 100);
            
            // Apply maximum amount if specified
            if (deductionType.max_amount && deductionAmount > parseFloat(deductionType.max_amount)) {
                deductionAmount = parseFloat(deductionType.max_amount);
            }
        }
        
        totalDeductions += deductionAmount;
        deductionBreakdown.push({
            code: deductionType.code,
            name: deductionType.name,
            type: deductionType.deduction_type,
            amount: parseFloat(deductionAmount.toFixed(2)),
            is_government: deductionType.is_government,
            is_mandatory: deductionType.is_mandatory
        });
    }
    
    // Fallback to government calculator if no deductions found in database
    if (deductionTypes.length === 0) {
        const governmentDeductions = GovernmentDeductionsCalculator.calculateAllDeductions(
            salaryBase,
            employee.salary_grade,
            employee.step_increment
        );
        
        return {
            gsis: governmentDeductions.gsis,
            pagibig: governmentDeductions.pagibig,
            philhealth: governmentDeductions.philhealth,
            tax: governmentDeductions.tax,
            other: 0,
            total: governmentDeductions.totalDeductions,
            breakdown: [
                { code: 'GSIS', name: 'GSIS Contribution', amount: governmentDeductions.gsis, is_government: true },
                { code: 'PAGIBIG', name: 'Pag-IBIG Contribution', amount: governmentDeductions.pagibig, is_government: true },
                { code: 'PHILHEALTH', name: 'PhilHealth Contribution', amount: governmentDeductions.philhealth, is_government: true },
                { code: 'WITHHOLDING_TAX', name: 'Withholding Tax', amount: governmentDeductions.tax, is_government: true }
            ]
        };
    }
    
    // Return structured deduction data
    const gsis = deductionBreakdown.find(d => d.code === 'GSIS')?.amount || 0;
    const pagibig = deductionBreakdown.find(d => d.code === 'PAGIBIG')?.amount || 0;
    const philhealth = deductionBreakdown.find(d => d.code === 'PHILHEALTH')?.amount || 0;
    const tax = deductionBreakdown.find(d => d.code === 'WITHHOLDING_TAX')?.amount || 0;
    const other = deductionBreakdown.filter(d => !d.is_government).reduce((sum, d) => sum + d.amount, 0);
    
    return {
        gsis,
        pagibig,
        philhealth,
        tax,
        other,
        total: totalDeductions,
        breakdown: deductionBreakdown
    };
};

// Legacy function for backward compatibility
const calculateStandardDeductions = async (employee, grossPay = null) => {
    return await calculateAllDeductions(employee, grossPay);
};

// GET /api/payroll/manual/:employee_id - Get employee manual payroll details
const getEmployeeManualPayrollDetails = asyncHandler(async (req, res) => {
    const { employee_id } = req.params;
    const { period_id } = req.query;

    // Validate employee ID
    const employeeIdNum = parseInt(employee_id);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
        throw new ValidationError('Invalid employee ID. Must be a positive number.');
    }

    // Get employee details
    const employeeQuery = `
        SELECT 
            e.*,
            u.username,
            u.role
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.id = ? AND e.deleted_at IS NULL
    `;

    const employeeResult = await executeQuery(employeeQuery, [employeeIdNum]);

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found');
    }

    const employee = employeeResult.data[0];

    // Get current payroll allowances
    const allowancesQuery = `
        SELECT 
            epa.id,
            epa.allowance_type_id,
            epa.amount,
            epa.effective_date,
            epa.end_date,
            epa.is_active,
            pat.code as allowance_code,
            pat.name as allowance_name,
            pat.description,
            pat.is_monthly,
            pat.is_prorated
        FROM employee_payroll_allowances epa
        JOIN payroll_allowance_types pat ON epa.allowance_type_id = pat.id
        WHERE epa.employee_id = ? AND epa.is_active = 1
        ORDER BY pat.name ASC
    `;

    const allowancesResult = await executeQuery(allowancesQuery, [employeeIdNum]);
    const allowances = allowancesResult.success ? allowancesResult.data : [];

    // Get recent payroll history (last 6 months)
    const historyQuery = `
        SELECT 
            pi.*,
            pp.year,
            pp.month,
            pp.period_number,
            pp.start_date,
            pp.end_date,
            pp.pay_date,
            pp.status as period_status
        FROM payroll_items pi
        JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
        WHERE pi.employee_id = ?
        ORDER BY pp.year DESC, pp.month DESC, pp.period_number DESC
        LIMIT 6
    `;

    const historyResult = await executeQuery(historyQuery, [employeeIdNum]);
    const payrollHistory = historyResult.success ? historyResult.data : [];

    // Calculate standard deductions
    const standardDeductions = await calculateStandardDeductions(employee);

    // Get available allowance types for manual addition
    const allowanceTypesQuery = `
        SELECT * FROM payroll_allowance_types 
        WHERE is_active = 1 
        ORDER BY name ASC
    `;

    const allowanceTypesResult = await executeQuery(allowanceTypesQuery);
    const availableAllowanceTypes = allowanceTypesResult.success ? allowanceTypesResult.data : [];

    res.json({
        success: true,
        data: {
            employee: {
                id: employee.id,
                employee_number: employee.employee_number,
                first_name: employee.first_name,
                middle_name: employee.middle_name,
                last_name: employee.last_name,
                current_monthly_salary: employee.current_monthly_salary,
                current_daily_rate: employee.current_daily_rate,
                appointment_date: employee.appointment_date,
                salary_grade: employee.salary_grade,
                step_increment: employee.step_increment,
                plantilla_position: employee.plantilla_position,
                employment_status: employee.employment_status
            },
            current_allowances: allowances,
            standard_deductions: standardDeductions,
            payroll_history: payrollHistory,
            available_allowance_types: availableAllowanceTypes,
            calculation_defaults: {
                working_days_per_month: 22,
                overtime_rate_multiplier: 1.25,
                holiday_rate_multiplier: 2.0
            }
        }
    });
});

// POST /api/payroll/manual/calculate - Calculate manual payroll for employee
const calculateManualPayroll = asyncHandler(async (req, res) => {
    const {
        employee_id,
        period_id,
        days_worked = 22,
        overtime_hours = 0,
        holiday_hours = 0,
        additional_allowances = [],
        additional_deductions = [],
        notes
    } = req.body;

    // Validate inputs
    if (!employee_id) {
        throw new ValidationError('Employee ID is required');
    }

    const employeeIdNum = parseInt(employee_id);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
        throw new ValidationError('Invalid employee ID');
    }

    // Get employee details
    const employeeQuery = `
        SELECT * FROM employees 
        WHERE id = ? AND deleted_at IS NULL
    `;

    const employeeResult = await executeQuery(employeeQuery, [employeeIdNum]);

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found');
    }

    const employee = employeeResult.data[0];

    // Calculate basic salary based on days worked
    const basicSalary = parseFloat((employee.current_monthly_salary * days_worked) / 22);

    // Calculate overtime pay
    const hourlyRate = parseFloat(employee.current_daily_rate) / 8;
    const overtimePay = parseFloat(overtime_hours * hourlyRate * 1.25);
    const holidayPay = parseFloat(holiday_hours * hourlyRate * 2.0);

    // Get current allowances from employee_payroll_allowances table
    const allowancesQuery = `
        SELECT epa.*, pat.name as allowance_name, pat.code as allowance_code, pat.is_prorated
        FROM employee_payroll_allowances epa
        JOIN payroll_allowance_types pat ON epa.allowance_type_id = pat.id
        WHERE epa.employee_id = ? AND epa.is_active = 1
        ORDER BY pat.name ASC
    `;

    const allowancesResult = await executeQuery(allowancesQuery, [employeeIdNum]);
    const currentAllowances = allowancesResult.success ? allowancesResult.data : [];

    // Calculate allowances (prorated based on days worked)
    let totalAllowances = 0;
    const allowanceBreakdown = [];

    // Add configured allowances
    currentAllowances.forEach(allowance => {
        let allowanceAmount = parseFloat(allowance.amount || 0);
        if (allowance.is_prorated && days_worked < 22) {
            allowanceAmount = (allowanceAmount * days_worked) / 22;
        }
        totalAllowances += allowanceAmount;
        allowanceBreakdown.push({
            code: allowance.allowance_code,
            name: allowance.allowance_name,
            base_amount: parseFloat(allowance.amount || 0),
            prorated_amount: allowanceAmount,
            is_prorated: allowance.is_prorated && days_worked < 22
        });
    });

    // Add additional allowances
    additional_allowances.forEach(allowance => {
        const allowanceAmount = parseFloat(allowance.amount || 0);
        totalAllowances += allowanceAmount;
        allowanceBreakdown.push({
            code: 'ADDITIONAL',
            name: allowance.name,
            base_amount: allowanceAmount,
            prorated_amount: allowanceAmount,
            is_prorated: false
        });
    });

    // Calculate gross pay
    const grossPay = parseFloat(basicSalary + overtimePay + holidayPay + totalAllowances);

    // Calculate all deductions using the new database-driven system
    const deductionsData = await calculateAllDeductions(employee, grossPay);
    const totalDeductions = parseFloat(deductionsData.total);

    // Add additional deductions
    let totalDeductionsWithAdditional = totalDeductions;
    const deductionBreakdown = [...deductionsData.breakdown];
    
    additional_deductions.forEach(deduction => {
        const deductionAmount = parseFloat(deduction.amount || 0);
        totalDeductionsWithAdditional += deductionAmount;
        deductionBreakdown.push({
            code: 'ADDITIONAL',
            name: deduction.name,
            base_amount: deductionAmount,
            calculated_amount: deductionAmount,
            is_percentage: false
        });
    });

    // Calculate net pay
    const netPay = parseFloat(grossPay - totalDeductionsWithAdditional);

    // Prepare breakdowns for storage
    const allowancesBreakdownForStorage = {};
    allowanceBreakdown.forEach(item => {
        allowancesBreakdownForStorage[item.name] = {
            code: item.code,
            base_amount: item.base_amount,
            prorated_amount: item.prorated_amount,
            is_prorated: item.is_prorated
        };
    });

    const deductionsBreakdownForStorage = {};
    deductionBreakdown.forEach(item => {
        deductionsBreakdownForStorage[item.name] = {
            code: item.code,
            base_amount: item.base_amount,
            calculated_amount: item.calculated_amount,
            is_percentage: item.is_percentage
        };
    });

    res.json({
        success: true,
        data: {
            employee_id: employeeIdNum,
            calculation_date: new Date().toISOString(),
            calculation: {
                basic_salary: parseFloat(basicSalary.toFixed(2)),
                overtime_pay: parseFloat(overtimePay.toFixed(2)),
                holiday_pay: parseFloat(holidayPay.toFixed(2)),
                total_allowances: parseFloat(totalAllowances.toFixed(2)),
                gross_pay: parseFloat(grossPay.toFixed(2)),
                total_deductions: parseFloat(totalDeductionsWithAdditional.toFixed(2)),
                net_pay: parseFloat(netPay.toFixed(2)),
                days_worked: parseInt(days_worked),
                overtime_hours: parseFloat(overtime_hours),
                holiday_hours: parseFloat(holiday_hours)
            },
            breakdown: {
                allowances: allowanceBreakdown,
                deductions: deductionBreakdown
            },
            allowances_breakdown: JSON.stringify(allowancesBreakdownForStorage),
            deductions_breakdown: JSON.stringify(deductionsBreakdownForStorage),
            notes: notes,
            auto_calculated: {
                allowances_from_database: true,
                deductions_from_database: true,
                message: 'Allowances and deductions automatically loaded from system configuration'
            }
        }
    });
});

// POST /api/payroll/manual/process - Process manual payroll entry
const processManualPayroll = asyncHandler(async (req, res) => {
    const {
        employee_id,
        period_id,
        calculation_data,
        notes,
        override_existing = false
    } = req.body;

    // Validate inputs
    if (!employee_id || !period_id || !calculation_data) {
        throw new ValidationError('Employee ID, period ID, and calculation data are required');
    }

    // Check if payroll period exists
    const periodQuery = `
        SELECT * FROM payroll_periods 
        WHERE id = ? AND status IN ('Draft', 'Processing')
    `;

    const periodResult = await executeQuery(periodQuery, [period_id]);

    if (!periodResult.success || periodResult.data.length === 0) {
        throw new ValidationError('Invalid payroll period or period is already finalized');
    }

    // Check if payroll item already exists
    const existingItemQuery = `
        SELECT id FROM payroll_items 
        WHERE employee_id = ? AND payroll_period_id = ?
    `;

    const existingResult = await executeQuery(existingItemQuery, [employee_id, period_id]);

    if (existingResult.success && existingResult.data.length > 0 && !override_existing) {
        throw new ValidationError('Payroll item already exists for this employee and period. Set override_existing to true to update.');
    }

    const isUpdate = existingResult.success && existingResult.data.length > 0;
    const existingItemId = isUpdate ? existingResult.data[0].id : null;

    // Prepare payroll item data - ensure all numeric values are properly converted
    const payrollItemData = {
        employee_id: parseInt(employee_id),
        payroll_period_id: parseInt(period_id),
        basic_salary: parseFloat(calculation_data.basic_salary || 0),
        days_worked: parseInt(calculation_data.days_worked || 22),
        leave_days_deducted: 22 - parseInt(calculation_data.days_worked || 22),
        working_days_in_month: 22,
        salary_adjustment: parseFloat(calculation_data.overtime_pay || 0) + parseFloat(calculation_data.holiday_pay || 0),
        total_allowances: parseFloat(calculation_data.total_allowances || 0),
        gsis_contribution: parseFloat(calculation_data.standard_deductions?.gsis || 0),
        pagibig_contribution: parseFloat(calculation_data.standard_deductions?.pagibig || 0),
        philhealth_contribution: parseFloat(calculation_data.standard_deductions?.philhealth || 0),
        tax_withheld: parseFloat(calculation_data.standard_deductions?.tax || 0),
        other_deductions: parseFloat(calculation_data.additional_deductions_total || 0),
        gross_pay: parseFloat(calculation_data.gross_pay || 0),
        total_deductions: parseFloat(calculation_data.total_deductions || 0),
        net_pay: parseFloat(calculation_data.net_pay || 0),
        // New fields for dynamic allowances and deductions
        allowances_breakdown: calculation_data.allowances_breakdown || JSON.stringify({}),
        deductions_breakdown: calculation_data.deductions_breakdown || JSON.stringify({})
    };

    let result;

    if (isUpdate) {
        // Update existing payroll item
        const updateQuery = `
            UPDATE payroll_items SET
                basic_salary = ?, days_worked = ?, leave_days_deducted = ?,
                working_days_in_month = ?, salary_adjustment = ?, total_allowances = ?,
                gsis_contribution = ?, pagibig_contribution = ?, philhealth_contribution = ?,
                tax_withheld = ?, other_deductions = ?, gross_pay = ?, total_deductions = ?, net_pay = ?,
                allowances_breakdown = ?, deductions_breakdown = ?
            WHERE id = ?
        `;

        result = await executeQuery(updateQuery, [
            payrollItemData.basic_salary, payrollItemData.days_worked, payrollItemData.leave_days_deducted,
            payrollItemData.working_days_in_month, payrollItemData.salary_adjustment, payrollItemData.total_allowances,
            payrollItemData.gsis_contribution, payrollItemData.pagibig_contribution, payrollItemData.philhealth_contribution,
            payrollItemData.tax_withheld, payrollItemData.other_deductions, payrollItemData.gross_pay,
            payrollItemData.total_deductions, payrollItemData.net_pay, 
            payrollItemData.allowances_breakdown, payrollItemData.deductions_breakdown,
            existingItemId
        ]);
    } else {
        // Create new payroll item
        const insertQuery = `
            INSERT INTO payroll_items (
                employee_id, payroll_period_id, basic_salary, days_worked, leave_days_deducted,
                working_days_in_month, salary_adjustment, total_allowances, gsis_contribution,
                pagibig_contribution, philhealth_contribution, tax_withheld, other_deductions,
                gross_pay, total_deductions, net_pay, allowances_breakdown, deductions_breakdown
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        result = await executeQuery(insertQuery, [
            payrollItemData.employee_id, payrollItemData.payroll_period_id, payrollItemData.basic_salary,
            payrollItemData.days_worked, payrollItemData.leave_days_deducted, payrollItemData.working_days_in_month,
            payrollItemData.salary_adjustment, payrollItemData.total_allowances, payrollItemData.gsis_contribution,
            payrollItemData.pagibig_contribution, payrollItemData.philhealth_contribution, payrollItemData.tax_withheld,
            payrollItemData.other_deductions, payrollItemData.gross_pay, payrollItemData.total_deductions, payrollItemData.net_pay,
            payrollItemData.allowances_breakdown, payrollItemData.deductions_breakdown
        ]);
    }

    if (!result.success) {
        throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} manual payroll item`);
    }

    // Log the manual payroll processing
    payrollLogger.info(`Manual payroll ${isUpdate ? 'updated' : 'created'}`, {
        employee_id: employee_id,
        period_id: period_id,
        processed_by: req.user.id,
        net_pay: calculation_data.net_pay,
        notes: notes
    });

    res.json({
        success: true,
        data: {
            item_id: isUpdate ? existingItemId : result.insertId,
            action: isUpdate ? 'updated' : 'created',
            employee_id: employee_id,
            period_id: period_id,
            calculation_data: calculation_data
        },
        message: `Manual payroll ${isUpdate ? 'updated' : 'processed'} successfully`
    });
});

// DELETE /api/payroll/manual/:item_id - Delete manual payroll item
const deleteManualPayrollItem = asyncHandler(async (req, res) => {
    const { item_id } = req.params;

    // Validate item ID
    const itemIdNum = parseInt(item_id);
    if (isNaN(itemIdNum) || itemIdNum <= 0) {
        throw new ValidationError('Invalid payroll item ID');
    }

    // Check if item exists and get period status
    const itemQuery = `
        SELECT pi.*, pp.status as period_status 
        FROM payroll_items pi
        JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
        WHERE pi.id = ?
    `;

    const itemResult = await executeQuery(itemQuery, [itemIdNum]);

    if (!itemResult.success || itemResult.data.length === 0) {
        throw new NotFoundError('Payroll item not found');
    }

    const item = itemResult.data[0];

    if (item.period_status === 'Completed') {
        throw new ValidationError('Cannot delete payroll item from a completed period');
    }

    // Delete the payroll item
    const deleteQuery = 'DELETE FROM payroll_items WHERE id = ?';
    const deleteResult = await executeQuery(deleteQuery, [itemIdNum]);

    if (!deleteResult.success) {
        throw new Error('Failed to delete payroll item');
    }

    payrollLogger.info('Manual payroll item deleted', {
        item_id: itemIdNum,
        employee_id: item.employee_id,
        period_id: item.payroll_period_id,
        deleted_by: req.user.id
    });

    res.json({
        success: true,
        message: 'Payroll item deleted successfully'
    });
});

// GET /api/payroll/manual/history/:employee_id - Get manual payroll history for employee
const getManualPayrollHistory = asyncHandler(async (req, res) => {
    const { employee_id } = req.params;
    const { year, limit = 12 } = req.query;

    // Validate employee ID
    const employeeIdNum = parseInt(employee_id);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
        throw new ValidationError('Invalid employee ID');
    }

    // Validate limit parameter
    const limitNum = parseInt(limit);
    const finalLimit = isNaN(limitNum) || limitNum <= 0 ? 12 : Math.min(limitNum, 50);

    // Check if employee exists
    const employeeCheck = await executeQuery(
        'SELECT id, first_name, last_name, employee_number FROM employees WHERE id = ?',
        [employeeIdNum]
    );

    if (!employeeCheck.success || employeeCheck.data.length === 0) {
        throw new NotFoundError('Employee not found');
    }

    const employee = employeeCheck.data[0];

    let whereConditions = ['pi.employee_id = ?'];
    let queryParams = [employeeIdNum];

    if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2030) {
            whereConditions.push('pp.year = ?');
            queryParams.push(yearNum);
        }
    }

    const whereClause = whereConditions.join(' AND ');

    // Get manual payroll history with additional metadata
    const query = `
        SELECT 
            pi.*,
            pp.year,
            pp.month,
            pp.period_number,
            pp.start_date,
            pp.end_date,
            pp.pay_date,
            pp.status as period_status,
            pi.created_at as processed_date,
            u.username as processed_by_name
        FROM payroll_items pi
        JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
        LEFT JOIN users u ON pp.created_by = u.id
        WHERE ${whereClause}
        ORDER BY pp.year DESC, pp.month DESC, pp.period_number DESC, pi.created_at DESC
        LIMIT ?
    `;

    const result = await executeQuery(query, [...queryParams, finalLimit.toString()]);

    if (!result.success) {
        throw new Error('Failed to fetch manual payroll history');
    }

    const history = result.data;

    // Calculate summary statistics
    const totalNetPay = history.reduce((sum, item) => sum + parseFloat(item.net_pay || 0), 0);
    const averageNetPay = history.length > 0 ? totalNetPay / history.length : 0;
    const lastProcessedDate = history.length > 0 ? history[0].processed_date : null;

    res.json({
        success: true,
        data: history,
        summary: {
            total_records: history.length,
            total_net_pay: totalNetPay,
            average_net_pay: averageNetPay,
            last_processed_date: lastProcessedDate,
            employee_info: {
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number
            }
        },
        filters: {
            year: year ? parseInt(year) : null,
            limit: finalLimit
        }
    });
});

module.exports = {
    getPayrollPeriods,
    createPayrollPeriod,
    getPayrollPeriod,
    generatePayroll,
    getEmployeePayrollHistory,
    getPayrollLeaveSummary,
    calculateProratedSalary,
    processStepIncrements,
    finalizePayrollPeriod,
    getGovernmentContributionRates,
    payrollPeriodValidationRules,
    // Manual payroll processing
    getEmployeeManualPayrollDetails,
    calculateManualPayroll,
    processManualPayroll,
    deleteManualPayrollItem,
    getManualPayrollHistory
};
