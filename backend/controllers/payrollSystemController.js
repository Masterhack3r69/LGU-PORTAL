// controllers/payrollSystemController.js - Automated Payroll Processing System
const { executeQuery, executeTransaction } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// Logger utility for payroll system
const payrollLogger = {
    info: (message, data = {}) => {
        console.log(`[PAYROLL-SYSTEM] ${new Date().toISOString()}: ${message}`, data);
    },
    error: (message, error = {}, data = {}) => {
        console.error(`[PAYROLL-SYSTEM-ERROR] ${new Date().toISOString()}: ${message}`, {
            error: error.message || error,
            stack: error.stack,
            data
        });
    }
};

// ===================================================================
// AUTOMATED PAYROLL GENERATION
// ===================================================================

// POST /api/payroll-system/generate - Generate automated payroll for period
const generateAutomatedPayroll = asyncHandler(async (req, res) => {
    const { period_id, employee_ids } = req.body; // Support individual employee processing
    const startTime = Date.now();

    payrollLogger.info('Starting automated payroll generation', { 
        period_id, 
        employee_ids: employee_ids?.length || 'all',
        user_id: req.user?.id 
    });

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

    // Check period status - allow both Draft and Processing for testing
    if (period.status !== 'Draft' && period.status !== 'Processing') {
        // For testing purposes, if it's a completed period, just return success with explanation
        if (period.status === 'Completed') {
            return res.json({
                success: true,
                data: {
                    period_id,
                    message: 'Payroll already generated and completed for this period',
                    status: period.status,
                    action: 'skipped'
                },
                message: 'Payroll generation skipped - period already completed'
            });
        }
        throw new ValidationError(`Cannot generate payroll for periods with status: ${period.status}. Only Draft periods are allowed.`);
    }

    // Check if payroll items already exist
    const existingItemsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM payroll_items WHERE payroll_period_id = ?',
        [period_id]
    );

    if (existingItemsResult.success && existingItemsResult.data[0].count > 0) {
        return res.json({
            success: true,
            data: {
                period_id,
                message: 'Payroll items already exist for this period',
                existing_items: existingItemsResult.data[0].count,
                action: 'skipped'
            },
            message: 'Payroll generation skipped - items already exist'
        });
    }

    try {
        // Step A: Admin Selects Payroll Period - Get active employees with filtering support
        let employeesQuery = `
            SELECT 
                id, employee_number, first_name, last_name,
                current_daily_rate, current_monthly_salary,
                appointment_date, employment_status,
                salary_grade, step_increment
            FROM employees 
            WHERE employment_status = 'Active'
                AND appointment_date <= ?
        `;
        
        let queryParams = [period.end_date];
        
        // Support individual employee processing
        if (employee_ids && employee_ids.length > 0) {
            const placeholders = employee_ids.map(() => '?').join(',');
            employeesQuery += ` AND id IN (${placeholders})`;
            queryParams.push(...employee_ids);
            payrollLogger.info('Processing specific employees', { employee_ids });
        }
        
        employeesQuery += ' ORDER BY employee_number ASC LIMIT 50';
        
        // Step B: System Gets Active Employees
        const employeesResult = await executeQuery(employeesQuery, queryParams);

        if (!employeesResult.success) {
            throw new Error('Failed to fetch employees: ' + employeesResult.error);
        }
        
        if (employeesResult.data.length === 0) {
            return res.json({
                success: true,
                data: {
                    period_id,
                    message: 'No active employees found for payroll generation',
                    employees_processed: 0,
                    action: 'no_employees'
                },
                message: 'No employees to process'
            });
        }

        const employees = employeesResult.data;
        payrollLogger.info('Processing automated payroll for employees', { 
            employee_count: employees.length, 
            period_id 
        });

        const payrollItems = [];
        let successCount = 0;
        let errorCount = 0;

        // Process each employee with database-driven allowances and deductions
        for (const employee of employees) {
            try {
                // Basic calculation parameters
                const workingDaysInMonth = 22;
                const dailyRate = parseFloat(employee.current_daily_rate) || (parseFloat(employee.current_monthly_salary) / 22) || 500;
                
                // Basic salary calculation
                const basicSalary = dailyRate * workingDaysInMonth;
                
                // Get employee-specific allowances from database
                const allowancesQuery = `
                    SELECT epa.amount, pat.code, pat.name, pat.is_monthly, pat.is_prorated
                    FROM employee_payroll_allowances epa
                    JOIN payroll_allowance_types pat ON epa.allowance_type_id = pat.id
                    WHERE epa.employee_id = ? AND epa.is_active = 1
                    ORDER BY pat.name ASC
                `;
                
                const allowancesResult = await executeQuery(allowancesQuery, [employee.id]);
                let totalAllowances = 0;
                
                if (allowancesResult.success && allowancesResult.data.length > 0) {
                    // Calculate total allowances from employee-specific configuration
                    totalAllowances = allowancesResult.data.reduce((sum, allowance) => {
                        let allowanceAmount = parseFloat(allowance.amount) || 0;
                        
                        // Apply proration if needed (for partial months)
                        if (allowance.is_prorated && workingDaysInMonth < 22) {
                            allowanceAmount = (allowanceAmount * workingDaysInMonth) / 22;
                        }
                        
                        return sum + allowanceAmount;
                    }, 0);
                } else {
                    // Fallback: Get default allowances from allowance types
                    const defaultAllowancesQuery = `
                        SELECT amount, code, name, is_monthly, is_prorated
                        FROM payroll_allowance_types 
                        WHERE is_active = 1 AND code != 'SALARY'
                        ORDER BY name ASC
                    `;
                    
                    const defaultAllowancesResult = await executeQuery(defaultAllowancesQuery, []);
                    if (defaultAllowancesResult.success && defaultAllowancesResult.data.length > 0) {
                        totalAllowances = defaultAllowancesResult.data.reduce((sum, allowance) => {
                            let allowanceAmount = parseFloat(allowance.amount) || 0;
                            
                            if (allowance.is_prorated && workingDaysInMonth < 22) {
                                allowanceAmount = (allowanceAmount * workingDaysInMonth) / 22;
                            }
                            
                            return sum + allowanceAmount;
                        }, 0);
                    } else {
                        // Final fallback to standard RATA
                        totalAllowances = 2000;
                    }
                }
                
                // Calculate gross pay
                const grossPay = basicSalary + totalAllowances;
                
                // Get all active deductions from database and calculate them
                const deductionsQuery = `
                    SELECT code, name, deduction_type, amount, percentage, max_amount, is_government, is_mandatory
                    FROM payroll_deduction_types 
                    WHERE is_active = 1
                    ORDER BY is_government DESC, is_mandatory DESC, name ASC
                `;
                
                const deductionsResult = await executeQuery(deductionsQuery, []);
                let gsis = 0, pagibig = 0, philhealth = 0, tax = 0, otherDeductions = 0;
                
                if (deductionsResult.success && deductionsResult.data.length > 0) {
                    // Calculate deductions based on database configuration
                    deductionsResult.data.forEach(deduction => {
                        let deductionAmount = 0;
                        
                        if (deduction.deduction_type === 'fixed') {
                            deductionAmount = parseFloat(deduction.amount || 0);
                        } else if (deduction.deduction_type === 'percentage') {
                            deductionAmount = grossPay * (parseFloat(deduction.percentage || 0) / 100);
                            
                            // Apply maximum amount if specified
                            if (deduction.max_amount && deductionAmount > parseFloat(deduction.max_amount)) {
                                deductionAmount = parseFloat(deduction.max_amount);
                            }
                        }
                        
                        // Categorize deductions
                        switch (deduction.code) {
                            case 'GSIS':
                                gsis = deductionAmount;
                                break;
                            case 'PAGIBIG':
                                pagibig = deductionAmount;
                                break;
                            case 'PHILHEALTH':
                                philhealth = deductionAmount;
                                break;
                            case 'WITHHOLDING_TAX':
                                tax = deductionAmount;
                                break;
                            default:
                                if (!deduction.is_government) {
                                    otherDeductions += deductionAmount;
                                }
                                break;
                        }
                    });
                } else {
                    // Fallback to fixed government deduction calculations
                    gsis = grossPay * 0.09;
                    pagibig = Math.min(grossPay * 0.02, 100);
                    philhealth = Math.min(grossPay * 0.0275, 1800);
                    tax = grossPay > 20833 ? (grossPay - 20833) * 0.15 : 0;
                }
                
                const totalDeductions = gsis + pagibig + philhealth + tax + otherDeductions;
                
                // Calculate net pay
                const netPay = grossPay - totalDeductions;

                // Insert payroll item using actual database columns
                const insertResult = await executeQuery(`
                    INSERT INTO payroll_items 
                    (employee_id, payroll_period_id, basic_salary, 
                     total_allowances, pagibig_contribution, 
                     gross_pay, total_deductions, net_pay)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    employee.id, period_id, parseFloat(basicSalary.toFixed(2)),
                    parseFloat(totalAllowances.toFixed(2)), parseFloat(pagibig.toFixed(2)), 
                    parseFloat(grossPay.toFixed(2)), parseFloat(totalDeductions.toFixed(2)), parseFloat(netPay.toFixed(2))
                ]);

                if (insertResult.success) {
                    successCount++;
                    payrollItems.push({
                        employee_id: employee.id,
                        employee_number: employee.employee_number,
                        employee_name: `${employee.first_name} ${employee.last_name}`,
                        basic_salary: parseFloat(basicSalary.toFixed(2)),
                        gross_pay: parseFloat(grossPay.toFixed(2)),
                        net_pay: parseFloat(netPay.toFixed(2))
                    });
                } else {
                    errorCount++;
                    payrollLogger.error('Failed to insert payroll item', insertResult.error, {
                        employee_id: employee.id,
                        employee_number: employee.employee_number
                    });
                }

            } catch (employeeError) {
                errorCount++;
                payrollLogger.error('Error processing employee payroll', employeeError, { 
                    employee_id: employee.id,
                    employee_number: employee.employee_number 
                });
            }
        }

        // Update period status if any payroll items were created
        if (successCount > 0) {
            await executeQuery(
                'UPDATE payroll_periods SET status = "Processing" WHERE id = ?',
                [period_id]
            );
        }

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        payrollLogger.info('Automated payroll generation completed', {
            period_id,
            employees_processed: employees.length,
            successful_items: successCount,
            failed_items: errorCount,
            processing_time_ms: processingTime
        });

        res.json({
            success: true,
            data: {
                period_id,
                employees_processed: employees.length,
                successful_items: successCount,
                failed_items: errorCount,
                sample_payroll_items: payrollItems.slice(0, 3), // Show first 3 as sample
                processing_summary: {
                    total_gross_pay: payrollItems.reduce((sum, item) => sum + item.gross_pay, 0),
                    total_net_pay: payrollItems.reduce((sum, item) => sum + item.net_pay, 0),
                    processing_time_ms: processingTime
                }
            },
            message: `Automated payroll generated successfully. ${successCount} items created${errorCount > 0 ? `, ${errorCount} errors` : ''}.`
        });
    } catch (error) {
        payrollLogger.error('Automated payroll generation failed', error, { period_id });
        
        // Return more detailed error for debugging
        res.status(500).json({
            success: false,
            error: {
                message: `Automated payroll generation failed: ${error.message}`,
                code: 'PAYROLL_GENERATION_ERROR',
                details: {
                    period_id,
                    error_details: error.stack || error.toString()
                }
            }
        });
    }
});

// ===================================================================
// BULK PAYROLL PROCESSING
// ===================================================================

// POST /api/payroll-system/bulk-process - Process payroll for multiple employees with selected allowances/deductions
const bulkProcessPayroll = asyncHandler(async (req, res) => {
    const { period_id, employee_ids, selected_allowance_types, selected_deduction_types } = req.body;
    const startTime = Date.now();

    payrollLogger.info('Starting bulk payroll processing', { 
        period_id, 
        employee_count: employee_ids?.length || 0,
        selected_allowance_types: selected_allowance_types?.length || 0,
        selected_deduction_types: selected_deduction_types?.length || 0,
        user_id: req.user?.id 
    });

    if (!period_id) {
        throw new ValidationError('Payroll period ID is required');
    }

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        throw new ValidationError('At least one employee ID is required');
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

    // Check period status - only allow Draft periods
    if (period.status !== 'Draft') {
        throw new ValidationError(`Cannot process payroll for periods with status: ${period.status}. Only Draft periods are allowed.`);
    }

    try {
        // Get selected allowance types details
        let allowanceTypes = [];
        if (selected_allowance_types && selected_allowance_types.length > 0) {
            const allowanceQuery = `
                SELECT * FROM payroll_allowance_types 
                WHERE id IN (${selected_allowance_types.map(() => '?').join(',')}) AND is_active = 1
            `;
            const allowanceResult = await executeQuery(allowanceQuery, selected_allowance_types);
            allowanceTypes = allowanceResult.success ? allowanceResult.data : [];
        }

        // Get selected deduction types details
        let deductionTypes = [];
        if (selected_deduction_types && selected_deduction_types.length > 0) {
            const deductionQuery = `
                SELECT * FROM payroll_deduction_types 
                WHERE id IN (${selected_deduction_types.map(() => '?').join(',')}) AND is_active = 1
            `;
            const deductionResult = await executeQuery(deductionQuery, selected_deduction_types);
            deductionTypes = deductionResult.success ? deductionResult.data : [];
        }

        // Get active employees
        const placeholders = employee_ids.map(() => '?').join(',');
        const employeesQuery = `
            SELECT 
                id, employee_number, first_name, last_name,
                current_daily_rate, current_monthly_salary,
                appointment_date, employment_status,
                salary_grade, step_increment
            FROM employees 
            WHERE id IN (${placeholders}) AND employment_status = 'Active'
                AND appointment_date <= ?
            ORDER BY employee_number ASC
        `;
        
        const queryParams = [...employee_ids, period.end_date];
        const employeesResult = await executeQuery(employeesQuery, queryParams);

        if (!employeesResult.success) {
            throw new Error('Failed to fetch employees: ' + employeesResult.error);
        }
        
        if (employeesResult.data.length === 0) {
            return res.json({
                success: true,
                data: {
                    period_id,
                    message: 'No active employees found for payroll processing',
                    employees_processed: 0,
                    action: 'no_employees'
                },
                message: 'No employees to process'
            });
        }

        const employees = employeesResult.data;
        payrollLogger.info('Processing bulk payroll for employees', { 
            employee_count: employees.length, 
            period_id 
        });

        const payrollItems = [];
        let successCount = 0;
        let errorCount = 0;

        // Process each employee with selected allowances and deductions
        for (const employee of employees) {
            try {
                // Basic calculation parameters
                const workingDaysInMonth = 22;
                const dailyRate = parseFloat(employee.current_daily_rate) || (parseFloat(employee.current_monthly_salary) / 22) || 500;
                
                // Basic salary calculation
                const basicSalary = dailyRate * workingDaysInMonth;
                
                // Calculate total allowances from selected types
                let totalAllowances = 0;
                const allowanceBreakdown = [];
                
                for (const allowanceType of allowanceTypes) {
                    let allowanceAmount = parseFloat(allowanceType.amount) || 0;
                    
                    // Apply proration if needed
                    if (allowanceType.is_prorated && workingDaysInMonth < 22) {
                        allowanceAmount = (allowanceAmount * workingDaysInMonth) / 22;
                    }
                    
                    totalAllowances += allowanceAmount;
                    allowanceBreakdown.push({
                        code: allowanceType.code,
                        name: allowanceType.name,
                        amount: parseFloat(allowanceAmount.toFixed(2)),
                        is_prorated: allowanceType.is_prorated
                    });
                }
                
                // Calculate gross pay
                const grossPay = basicSalary + totalAllowances;
                
                // Calculate deductions from selected types
                let gsis = 0, pagibig = 0, philhealth = 0, tax = 0, otherDeductions = 0;
                const deductionBreakdown = [];
                
                for (const deductionType of deductionTypes) {
                    let deductionAmount = 0;
                    
                    if (deductionType.deduction_type === 'fixed') {
                        deductionAmount = parseFloat(deductionType.amount || 0);
                    } else if (deductionType.deduction_type === 'percentage') {
                        deductionAmount = grossPay * (parseFloat(deductionType.percentage || 0) / 100);
                        
                        // Apply maximum amount if specified
                        if (deductionType.max_amount && deductionAmount > parseFloat(deductionType.max_amount)) {
                            deductionAmount = parseFloat(deductionType.max_amount);
                        }
                    }
                    
                    // Categorize deductions
                    switch (deductionType.code) {
                        case 'GSIS':
                            gsis = deductionAmount;
                            break;
                        case 'PAGIBIG':
                            pagibig = deductionAmount;
                            break;
                        case 'PHILHEALTH':
                            philhealth = deductionAmount;
                            break;
                        case 'WITHHOLDING_TAX':
                            tax = deductionAmount;
                            break;
                        default:
                            otherDeductions += deductionAmount;
                            break;
                    }
                    
                    deductionBreakdown.push({
                        code: deductionType.code,
                        name: deductionType.name,
                        type: deductionType.deduction_type,
                        amount: parseFloat(deductionAmount.toFixed(2)),
                        is_government: deductionType.is_government,
                        is_mandatory: deductionType.is_mandatory
                    });
                }
                
                const totalDeductions = gsis + pagibig + philhealth + tax + otherDeductions;
                
                // Calculate net pay
                const netPay = grossPay - totalDeductions;

                // Insert payroll item
                const insertResult = await executeQuery(`
                    INSERT INTO payroll_items 
                    (employee_id, payroll_period_id, basic_salary, 
                     total_allowances, pagibig_contribution, 
                     gross_pay, total_deductions, net_pay,
                     allowances_breakdown, deductions_breakdown)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    employee.id, period_id, parseFloat(basicSalary.toFixed(2)),
                    parseFloat(totalAllowances.toFixed(2)), parseFloat(pagibig.toFixed(2)), 
                    parseFloat(grossPay.toFixed(2)), parseFloat(totalDeductions.toFixed(2)), parseFloat(netPay.toFixed(2)),
                    JSON.stringify(allowanceBreakdown), JSON.stringify(deductionBreakdown)
                ]);

                if (insertResult.success) {
                    successCount++;
                    payrollItems.push({
                        employee_id: employee.id,
                        employee_number: employee.employee_number,
                        employee_name: `${employee.first_name} ${employee.last_name}`,
                        basic_salary: parseFloat(basicSalary.toFixed(2)),
                        total_allowances: parseFloat(totalAllowances.toFixed(2)),
                        gross_pay: parseFloat(grossPay.toFixed(2)),
                        total_deductions: parseFloat(totalDeductions.toFixed(2)),
                        net_pay: parseFloat(netPay.toFixed(2))
                    });
                } else {
                    errorCount++;
                    payrollLogger.error('Failed to insert payroll item', insertResult.error, {
                        employee_id: employee.id,
                        employee_number: employee.employee_number
                    });
                }

            } catch (employeeError) {
                errorCount++;
                payrollLogger.error('Error processing employee payroll', employeeError, { 
                    employee_id: employee.id,
                    employee_number: employee.employee_number 
                });
            }
        }

        // Update period status if any payroll items were created
        if (successCount > 0) {
            await executeQuery(
                'UPDATE payroll_periods SET status = "Processing" WHERE id = ?',
                [period_id]
            );
        }

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        payrollLogger.info('Bulk payroll processing completed', {
            period_id,
            employees_processed: employees.length,
            successful_items: successCount,
            failed_items: errorCount,
            processing_time_ms: processingTime
        });

        res.json({
            success: true,
            data: {
                period_id,
                employees_processed: employees.length,
                successful_items: successCount,
                failed_items: errorCount,
                sample_payroll_items: payrollItems.slice(0, 3), // Show first 3 as sample
                processing_summary: {
                    total_gross_pay: payrollItems.reduce((sum, item) => sum + item.gross_pay, 0),
                    total_net_pay: payrollItems.reduce((sum, item) => sum + item.net_pay, 0),
                    processing_time_ms: processingTime
                }
            },
            message: `Bulk payroll processed successfully. ${successCount} items created${errorCount > 0 ? `, ${errorCount} errors` : ''}.`
        });
    } catch (error) {
        payrollLogger.error('Bulk payroll processing failed', error, { period_id });
        
        res.status(500).json({
            success: false,
            error: {
                message: `Bulk payroll processing failed: ${error.message}`,
                code: 'BULK_PAYROLL_PROCESSING_ERROR',
                details: {
                    period_id,
                    error_details: error.stack || error.toString()
                }
            }
        });
    }
});

// ===================================================================
// PAYROLL COMPUTATION AND DETAILS
// ===================================================================

// GET /api/payroll-system/computation/:period_id OR /api/payroll-system/computations/:employee_id
const getPayrollComputation = asyncHandler(async (req, res) => {
    const { period_id, employee_id } = req.params;
    const { period_id: queryPeriodId } = req.query;
    
    // Determine which parameter to use
    const targetPeriodId = period_id || queryPeriodId;
    const targetEmployeeId = employee_id;

    // Validate parameters
    if (!targetPeriodId && !targetEmployeeId) {
        throw new ValidationError('Either period_id or employee_id with period_id query parameter is required');
    }

    // If we have employee_id but no period_id, provide a helpful error
    if (targetEmployeeId && !targetPeriodId) {
        throw new ValidationError('When using employee_id, period_id query parameter is required');
    }

    try {
        let periodQuery, itemsQuery;
        let queryParams;

        if (targetPeriodId && !targetEmployeeId) {
            // Period-based query - get all employees for the period
            periodQuery = `
                SELECT pp.*, u.username as created_by_name
                FROM payroll_periods pp
                LEFT JOIN users u ON pp.created_by = u.id
                WHERE pp.id = ?
            `;

            itemsQuery = `
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
            
            queryParams = [targetPeriodId, targetPeriodId];
        } else if (targetEmployeeId && targetPeriodId) {
            // Employee-specific query for a period
            periodQuery = `
                SELECT pp.*, u.username as created_by_name
                FROM payroll_periods pp
                LEFT JOIN users u ON pp.created_by = u.id
                WHERE pp.id = ?
            `;

            itemsQuery = `
                SELECT 
                    pi.*,
                    e.first_name,
                    e.last_name,
                    e.employee_number,
                    e.current_daily_rate,
                    e.current_monthly_salary
                FROM payroll_items pi
                LEFT JOIN employees e ON pi.employee_id = e.id
                WHERE pi.payroll_period_id = ? AND pi.employee_id = ?
                ORDER BY e.employee_number ASC
            `;
            
            queryParams = [targetPeriodId, targetPeriodId, targetEmployeeId];
        }

        const [periodResult, itemsResult] = await Promise.all([
            executeQuery(periodQuery, [queryParams[0]]),
            executeQuery(itemsQuery, queryParams.slice(1))
        ]);

        if (!periodResult.success || periodResult.data.length === 0) {
            throw new NotFoundError(`Payroll period with ID ${targetPeriodId} not found`);
        }

        const period = periodResult.data[0];
        const items = itemsResult.success ? itemsResult.data : [];

        // Get any available allowance data (optional since new tables might not have data yet)
        let allowanceItems = [];
        try {
            const allowanceQuery = `
                SELECT 
                    pai.*,
                    pat.code as allowance_code,
                    pat.name as allowance_name,
                    pi.employee_id
                FROM payroll_allowance_items pai
                JOIN payroll_allowance_types pat ON pai.allowance_type_id = pat.id
                JOIN payroll_items pi ON pai.payroll_item_id = pi.id
                WHERE pi.payroll_period_id = ?
                ORDER BY pi.employee_id, pat.name
            `;
            
            const allowanceResult = await executeQuery(allowanceQuery, [targetPeriodId]);
            allowanceItems = allowanceResult.success ? allowanceResult.data : [];
        } catch (error) {
            // Allowance items are optional for now
            allowanceItems = [];
        }

        // Group allowance items by employee
        const allowancesByEmployee = allowanceItems.reduce((acc, item) => {
            if (!acc[item.employee_id]) {
                acc[item.employee_id] = [];
            }
            acc[item.employee_id].push(item);
            return acc;
        }, {});

        // Enhance items with allowance details
        const enhancedItems = items.map(item => ({
            ...item,
            allowances: allowancesByEmployee[item.employee_id] || []
        }));

        res.json({
            success: true,
            data: {
                period,
                items: enhancedItems,
                query_info: {
                    target_period_id: targetPeriodId,
                    target_employee_id: targetEmployeeId,
                    query_type: targetEmployeeId ? 'employee_specific' : 'period_wide'
                },
                summary: {
                    employee_count: items.length,
                    total_gross_pay: items.reduce((sum, item) => sum + parseFloat(item.gross_pay || 0), 0),
                    total_deductions: items.reduce((sum, item) => sum + parseFloat(item.total_deductions || 0), 0),
                    total_net_pay: items.reduce((sum, item) => sum + parseFloat(item.net_pay || 0), 0),
                    total_allowances: items.reduce((sum, item) => sum + parseFloat(item.total_allowances || 0), 0)
                }
            }
        });
    } catch (error) {
        payrollLogger.error('Payroll computation retrieval failed', error, {
            period_id: targetPeriodId,
            employee_id: targetEmployeeId
        });
        throw error; // Re-throw to be handled by error middleware
    }
});

// ===================================================================
// EMPLOYEE ALLOWANCE MANAGEMENT
// ===================================================================

// GET /api/payroll-system/allowances/:employee_id - Get employee allowances
const getEmployeeAllowances = asyncHandler(async (req, res) => {
    const { employee_id } = req.params;

    const query = `
        SELECT 
            epa.*,
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

    const result = await executeQuery(query, [employee_id]);

    if (!result.success) {
        throw new Error('Failed to fetch employee allowances');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// PUT /api/payroll-system/allowances/:employee_id - Update employee allowances
const updateEmployeeAllowances = asyncHandler(async (req, res) => {
    const { employee_id } = req.params;
    const { allowances } = req.body;

    if (!Array.isArray(allowances)) {
        throw new ValidationError('Allowances must be an array');
    }

    await executeTransaction(async (connection) => {
        // Deactivate existing allowances
        await connection.execute(
            'UPDATE employee_payroll_allowances SET is_active = 0 WHERE employee_id = ?',
            [employee_id]
        );

        // Insert new allowances
        for (const allowance of allowances) {
            await connection.execute(`
                INSERT INTO employee_payroll_allowances 
                (employee_id, allowance_type_id, amount, effective_date, is_active)
                VALUES (?, ?, ?, ?, 1)
            `, [
                employee_id,
                allowance.allowance_type_id,
                allowance.amount,
                allowance.effective_date || new Date().toISOString().split('T')[0]
            ]);
        }
    });

    res.json({
        success: true,
        message: 'Employee allowances updated successfully'
    });
});

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

// Helper function to calculate leave deductions for payroll period
const calculateLeaveDeductionsForPeriod = async (connection, employeeId, startDate, endDate) => {
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

    const [rows] = await connection.execute(query, [
        employeeId, startDate, endDate, startDate, endDate, startDate, endDate
    ]);

    return {
        unpaidLeaveDays: parseFloat(rows[0]?.unpaid_leave_days || 0),
        totalLeaveDays: parseFloat(rows[0]?.total_leave_days || 0)
    };
};

// Helper function to get employee allowances for payroll period
const getEmployeeAllowancesForPeriod = async (connection, employeeId, year, month) => {
    const query = `
        SELECT 
            epa.amount as base_amount,
            pat.code,
            pat.name,
            pat.is_prorated,
            epa.allowance_type_id
        FROM employee_payroll_allowances epa
        JOIN payroll_allowance_types pat ON epa.allowance_type_id = pat.id
        WHERE epa.employee_id = ? 
            AND epa.is_active = 1
            AND epa.effective_date <= LAST_DAY(CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
            AND (epa.end_date IS NULL OR epa.end_date >= CONCAT(?, '-', LPAD(?, 2, '0'), '-01'))
        ORDER BY pat.name
    `;

    const [rows] = await connection.execute(query, [employeeId, year, month, year, month]);

    const allowances = {
        total: 0,
        items: []
    };

    rows.forEach(row => {
        const proratedAmount = row.is_prorated ? row.base_amount : row.base_amount;
        allowances.total += proratedAmount;
        allowances.items.push({
            allowance_type_id: row.allowance_type_id,
            code: row.code,
            name: row.name,
            base_amount: row.base_amount,
            prorated_amount: proratedAmount
        });
    });

    return allowances;
};

// Helper function to calculate government deductions
const calculateGovDeductions = async (connection, employee, basicSalary, grossPay) => {
    // Standard government deduction rates (can be made configurable)
    const gsisRate = 0.09; // 9% for employee
    const pagibigRate = 0.02; // 2% (max 100)
    const philhealthRate = 0.0275; // 2.75% (max based on income bracket)

    const gsis = basicSalary * gsisRate;
    const pagibig = Math.min(grossPay * pagibigRate, 100);
    const philhealth = Math.min(grossPay * philhealthRate, 1800); // 2024 max
    
    // Simplified tax calculation (should use proper tax brackets)
    let tax = 0;
    const monthlyTaxableIncome = grossPay - gsis - pagibig - philhealth;
    if (monthlyTaxableIncome > 20833) {
        tax = (monthlyTaxableIncome - 20833) * 0.15;
    }

    const other = 0;
    const total = gsis + pagibig + philhealth + tax + other;

    return {
        gsis: parseFloat(gsis.toFixed(2)),
        pagibig: parseFloat(pagibig.toFixed(2)),
        philhealth: parseFloat(philhealth.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        other: parseFloat(other.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
};

// ===================================================================
// HELPER FUNCTIONS FOR AUTOMATED PAYROLL WORKFLOW
// ===================================================================

/**
 * Step D: Calculate Basic Salary
 * Handles working days calculation and basic salary computation
 */
const calculateBasicSalary = async (employee, period) => {
    const workingDaysInMonth = 22; // Standard working days
    const dailyRate = parseFloat(employee.current_daily_rate) || 
                     (parseFloat(employee.current_monthly_salary) / 22) || 
                     500; // Default minimum
    
    const daysWorked = workingDaysInMonth; // Will be adjusted by leave deductions
    const basicSalary = dailyRate * daysWorked;
    
    return {
        dailyRate,
        workingDaysInMonth,
        daysWorked,
        basicSalary
    };
};

/**
 * Step E: Get Leave Usage for Month
 * Retrieves and calculates leave deductions for the period
 */
const getLeaveUsage = async (employeeId, period) => {
    try {
        // Query approved leaves that overlap with the payroll period
        const leaveResult = await executeQuery(`
            SELECT 
                la.start_date,
                la.end_date,
                la.total_days,
                lt.name as leave_type,
                lt.is_paid
            FROM leave_applications la
            JOIN leave_types lt ON la.leave_type_id = lt.id
            WHERE la.employee_id = ? 
                AND la.status = 'Approved'
                AND (
                    (la.start_date BETWEEN ? AND ?) OR
                    (la.end_date BETWEEN ? AND ?) OR
                    (la.start_date <= ? AND la.end_date >= ?)
                )
        `, [
            employeeId,
            period.start_date, period.end_date,
            period.start_date, period.end_date,
            period.start_date, period.end_date
        ]);
        
        if (!leaveResult.success) {
            throw new Error('Failed to fetch leave data: ' + leaveResult.error);
        }
        
        // Calculate LWOP (Leave Without Pay) days
        const lwopDays = leaveResult.data
            .filter(leave => !leave.is_paid)
            .reduce((total, leave) => total + parseFloat(leave.total_days), 0);
        
        const paidLeaveDays = leaveResult.data
            .filter(leave => leave.is_paid)
            .reduce((total, leave) => total + parseFloat(leave.total_days), 0);
        
        return {
            totalLeaves: leaveResult.data.length,
            lwopDays,
            paidLeaveDays,
            leaveDetails: leaveResult.data
        };
    } catch (error) {
        payrollLogger.warn('Could not fetch leave data, assuming no leaves', { employeeId, error: error.message });
        return {
            totalLeaves: 0,
            lwopDays: 0,
            paidLeaveDays: 0,
            leaveDetails: []
        };
    }
};

/**
 * Step F: Apply Leave Deductions
 * Adjusts basic salary based on leave without pay
 */
const applyLeaveDeductions = (basicSalaryData, leaveData) => {
    const { basicSalary, dailyRate, workingDaysInMonth } = basicSalaryData;
    const { lwopDays } = leaveData;
    
    // Calculate prorated salary after LWOP deductions
    const effectiveDaysWorked = workingDaysInMonth - lwopDays;
    const adjustedSalary = (basicSalary / workingDaysInMonth) * effectiveDaysWorked;
    
    return Math.max(0, adjustedSalary); // Ensure non-negative
};

/**
 * Step G: Add Active Allowances
 * Retrieves and calculates employee allowances
 */
const getActiveAllowances = async (employeeId, period) => {
    try {
        // Query active allowances for the employee
        const allowanceResult = await executeQuery(`
            SELECT 
                at.code,
                at.name,
                at.is_monthly,
                at.is_prorated,
                ea.amount
            FROM employee_allowances ea
            JOIN allowance_types at ON ea.allowance_type_id = at.id
            WHERE ea.employee_id = ? 
                AND ea.is_active = 1
                AND ea.effective_date <= ?
                AND (ea.end_date IS NULL OR ea.end_date >= ?)
        `, [employeeId, period.end_date, period.start_date]);
        
        if (!allowanceResult.success) {
            payrollLogger.warn('Could not fetch allowances, using defaults', { employeeId });
        }
        
        // Default allowances if no specific allowances found
        const defaultAllowances = [
            { code: 'RATA', name: 'Representation and Transportation Allowance', amount: 2000 },
            { code: 'MEDICAL', name: 'Medical Allowance', amount: 1500 },
            { code: 'HAZARD', name: 'Hazard Pay', amount: 1000 }
        ];
        
        const allowances = allowanceResult.success && allowanceResult.data.length > 0 
            ? allowanceResult.data 
            : defaultAllowances;
        
        const total = allowances.reduce((sum, allowance) => sum + parseFloat(allowance.amount), 0);
        
        return {
            allowances,
            total,
            breakdown: allowances.reduce((acc, allowance) => {
                acc[allowance.code.toLowerCase()] = parseFloat(allowance.amount);
                return acc;
            }, {})
        };
    } catch (error) {
        payrollLogger.warn('Error fetching allowances, using defaults', { employeeId, error: error.message });
        return {
            allowances: [{ code: 'RATA', name: 'RATA', amount: 2000 }],
            total: 2000,
            breakdown: { rata: 2000 }
        };
    }
};

/**
 * Step H: Calculate Government Deductions
 * Computes GSIS, Pag-IBIG, PhilHealth, and BIR Tax
 */
const calculateGovernmentDeductions = (grossPay) => {
    // GSIS Contribution (9% of gross pay)
    const gsis = grossPay * 0.09;
    
    // Pag-IBIG Contribution (2% of gross pay, max ₱100)
    const pagibig = Math.min(grossPay * 0.02, 100);
    
    // PhilHealth Contribution (2.75% of gross pay, max ₱1,800)
    const philhealth = Math.min(grossPay * 0.0275, 1800);
    
    // BIR Tax (simplified calculation)
    let tax = 0;
    if (grossPay > 20833) {
        tax = (grossPay - 20833) * 0.15;
    }
    
    const total = gsis + pagibig + philhealth + tax;
    
    return {
        gsis: parseFloat(gsis.toFixed(2)),
        pagibig: parseFloat(pagibig.toFixed(2)),
        philhealth: parseFloat(philhealth.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
};

module.exports = {
    generateAutomatedPayroll,
    bulkProcessPayroll,
    getPayrollComputation,
    getEmployeeAllowances,
    updateEmployeeAllowances,
    // Export helper functions for testing
    calculateBasicSalary,
    getLeaveUsage,
    applyLeaveDeductions,
    getActiveAllowances,
    calculateGovernmentDeductions
};