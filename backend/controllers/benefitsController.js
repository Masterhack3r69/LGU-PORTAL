// controllers/benefitsController.js - Comprehensive Benefits Management Controller
const { executeQuery, executeTransaction } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const BenefitType = require('../models/BenefitType');
const BenefitCycle = require('../models/BenefitCycle');
const BenefitItem = require('../models/BenefitItem');

// =====================================================================
// BENEFIT TYPE MANAGEMENT - CRUD Operations
// =====================================================================

// GET /api/compensation/employee/:id - Get employee compensation records
const getEmployeeCompensation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // Get employee info
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ? AND employment_status = "Active"',
        [id]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or inactive');
    }

    const employee = employeeResult.data[0];

    // Get compensation records for the year
    const compensationQuery = `
        SELECT
            ec.*,
            ct.name as compensation_type_name,
            ct.code as compensation_type_code,
            ct.description,
            ct.is_taxable
        FROM employee_compensation ec
        JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        WHERE ec.employee_id = ?
            AND ec.year = ?
        ORDER BY ct.name ASC
    `;

    const compensationResult = await executeQuery(compensationQuery, [id, currentYear]);

    const compensation = compensationResult.success ? compensationResult.data : [];

    // Calculate totals
    const totalCompensation = compensation.reduce((sum, comp) => sum + parseFloat(comp.amount), 0);
    const totalTaxable = compensation
        .filter(comp => comp.is_taxable)
        .reduce((sum, comp) => sum + parseFloat(comp.amount), 0);

    res.json({
        success: true,
        data: {
            employee: {
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                appointment_date: employee.appointment_date
            },
            compensation: compensation,
            summary: {
                year: currentYear,
                total_compensation: parseFloat(totalCompensation.toFixed(2)),
                total_taxable: parseFloat(totalTaxable.toFixed(2)),
                compensation_count: compensation.length
            }
        }
    });
});

// POST /api/compensation/employee - Create employee compensation record
const createEmployeeCompensation = asyncHandler(async (req, res) => {
    const {
        employee_id,
        compensation_type_id,
        amount,
        year,
        effective_date,
        notes
    } = req.body;

    if (!employee_id || !compensation_type_id || !amount || !year) {
        throw new ValidationError('Employee ID, compensation type ID, amount, and year are required');
    }

    // Verify employee exists
    const employeeResult = await executeQuery(
        'SELECT id FROM employees WHERE id = ? AND employment_status = "Active"',
        [employee_id]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or inactive');
    }

    // Verify compensation type exists
    const typeResult = await executeQuery(
        'SELECT id FROM compensation_types WHERE id = ?',
        [compensation_type_id]
    );

    if (!typeResult.success || typeResult.data.length === 0) {
        throw new NotFoundError('Compensation type not found');
    }

    // Insert compensation record
    const insertQuery = `
        INSERT INTO employee_compensation
        (employee_id, compensation_type_id, amount, year, effective_date, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertResult = await executeQuery(insertQuery, [
        employee_id,
        compensation_type_id,
        amount,
        year,
        effective_date || new Date(),
        notes || null,
        req.user.id
    ]);

    if (!insertResult.success) {
        throw new Error('Failed to create compensation record');
    }

    res.status(201).json({
        success: true,
        data: {
            id: insertResult.data.insertId,
            employee_id,
            compensation_type_id,
            amount,
            year,
            effective_date,
            notes
        },
        message: 'Compensation record created successfully'
    });
});

// PUT /api/compensation/employee/:id - Update employee compensation record
const updateEmployeeCompensation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if record exists
    const existingResult = await executeQuery(
        'SELECT * FROM employee_compensation WHERE id = ?',
        [id]
    );

    if (!existingResult.success || existingResult.data.length === 0) {
        throw new NotFoundError('Compensation record not found');
    }

    const existing = existingResult.data[0];

    // Update record
    const updateQuery = `
        UPDATE employee_compensation SET
        amount = ?, effective_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const updateResult = await executeQuery(updateQuery, [
        updateData.amount || existing.amount,
        updateData.effective_date || existing.effective_date,
        updateData.notes !== undefined ? updateData.notes : existing.notes,
        id
    ]);

    if (!updateResult.success) {
        throw new Error('Failed to update compensation record');
    }

    res.json({
        success: true,
        data: {
            id: parseInt(id),
            ...existing,
            ...updateData
        },
        message: 'Compensation record updated successfully'
    });
});

// DELETE /api/compensation/employee/:id - Delete employee compensation record
const deleteEmployeeCompensation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await executeQuery('DELETE FROM employee_compensation WHERE id = ?', [id]);

    if (!result.success) {
        throw new Error('Failed to delete compensation record');
    }

    if (result.data.affectedRows === 0) {
        throw new NotFoundError('Compensation record not found');
    }

    res.json({
        success: true,
        message: 'Compensation record deleted successfully'
    });
});

// GET /api/benefits/types - Get all benefit types with filtering and pagination
const getBenefitTypes = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        calculation_type,
        frequency,
        is_active,
        is_taxable,
        is_recurring,
        requires_approval
    } = req.query;

    const filters = {
        search,
        calculation_type,
        frequency,
        is_active: is_active !== undefined ? parseInt(is_active) : undefined,
        is_taxable: is_taxable !== undefined ? parseInt(is_taxable) : undefined,
        is_recurring: is_recurring !== undefined ? parseInt(is_recurring) : undefined,
        requires_approval: requires_approval !== undefined ? parseInt(requires_approval) : undefined,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const [typesResult, countResult] = await Promise.all([
        BenefitType.findAll(filters),
        BenefitType.getCount(filters)
    ]);

    if (!typesResult.success) {
        throw new Error('Failed to fetch benefit types');
    }

    const totalPages = Math.ceil(countResult / parseInt(limit));

    res.json({
        success: true,
        data: typesResult.data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult,
            total_pages: totalPages
        }
    });
});

// GET /api/benefits/types/:id - Get benefit type by ID
const getBenefitTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await BenefitType.findById(id);
    if (!result.success) {
        throw new NotFoundError('Benefit type not found');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/benefits/types - Create new benefit type
const createBenefitType = asyncHandler(async (req, res) => {
    const {
        name,
        code,
        description,
        calculation_type,
        default_amount,
        percentage_base,
        formula,
        frequency,
        is_taxable,
        is_recurring,
        requires_approval,
        is_active
    } = req.body;

    const benefitType = new BenefitType({
        name,
        code,
        description,
        calculation_type,
        default_amount: parseFloat(default_amount) || null,
        percentage_base,
        formula,
        frequency,
        is_taxable: is_taxable !== undefined ? parseInt(is_taxable) : true,
        is_recurring: is_recurring !== undefined ? parseInt(is_recurring) : true,
        requires_approval: requires_approval !== undefined ? parseInt(requires_approval) : false,
        is_active: is_active !== undefined ? parseInt(is_active) : true
    });

    const result = await benefitType.save();
    if (!result.success) {
        throw new ValidationError(result.error || 'Failed to create benefit type');
    }

    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Benefit type created successfully'
    });
});

// PUT /api/benefits/types/:id - Update benefit type
const updateBenefitType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingResult = await BenefitType.findById(id);
    if (!existingResult.success) {
        throw new NotFoundError('Benefit type not found');
    }

    const benefitType = new BenefitType({
        ...existingResult.data,
        ...updateData,
        id: parseInt(id)
    });

    const result = await benefitType.update();
    if (!result.success) {
        throw new ValidationError(result.error || 'Failed to update benefit type');
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Benefit type updated successfully'
    });
});

// DELETE /api/benefits/types/:id - Delete benefit type
const deleteBenefitType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await BenefitType.delete(id);
    if (!result.success) {
        throw new Error('Failed to delete benefit type');
    }

    res.json({
        success: true,
        message: 'Benefit type deleted successfully'
    });
});

// GET /api/benefits/types/statistics - Get benefit types statistics
const getBenefitTypesStatistics = asyncHandler(async (req, res) => {
    const result = await BenefitType.getStatistics();
    if (!result.success) {
        throw new Error('Failed to fetch benefit types statistics');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// =====================================================================
// BENEFIT CYCLE MANAGEMENT
// =====================================================================

// GET /api/benefits/cycles - Get benefit cycles with filtering and pagination
const getBenefitCycles = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        year,
        status,
        compensation_type_id,
        search,
        created_by
    } = req.query;

    const filters = {
        year: year ? parseInt(year) : undefined,
        status,
        compensation_type_id: compensation_type_id ? parseInt(compensation_type_id) : undefined,
        search,
        created_by: created_by ? parseInt(created_by) : undefined,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const [cyclesResult, countResult] = await Promise.all([
        BenefitCycle.getWithCompensationType(filters),
        BenefitCycle.getCount(filters)
    ]);

    if (!cyclesResult.success) {
        throw new Error('Failed to fetch benefit cycles');
    }

    const totalPages = Math.ceil(countResult / parseInt(limit));

    res.json({
        success: true,
        data: cyclesResult.data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult,
            total_pages: totalPages
        }
    });
});

// GET /api/benefits/cycles/:id - Get benefit cycle by ID
const getBenefitCycleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await BenefitCycle.findById(id);
    if (!result.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/benefits/cycles - Create new benefit cycle
const createBenefitCycle = asyncHandler(async (req, res) => {
    const {
        compensation_type_id,
        year,
        cycle_name,
        applicable_date,
        cutoff_date,
        payment_date,
        processing_notes
    } = req.body;

    // TEMPORARY FIX: If req.user is not set but session.user exists, use session.user
    if (!req.user && req.session.user) {
        req.user = req.session.user;
    }

    const benefitCycle = new BenefitCycle({
        compensation_type_id: parseInt(compensation_type_id),
        year: parseInt(year),
        cycle_name,
        applicable_date,
        cutoff_date,
        payment_date,
        status: 'Draft',
        processing_notes,
        created_by: req.user.id
    });

    const result = await benefitCycle.save();
    if (!result.success) {
        throw new ValidationError(result.error || 'Failed to create benefit cycle');
    }

    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Benefit cycle created successfully'
    });
});

// PUT /api/benefits/cycles/:id - Update benefit cycle
const updateBenefitCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingResult = await BenefitCycle.findById(id);
    if (!existingResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const benefitCycle = new BenefitCycle({
        ...existingResult.data,
        ...updateData,
        id: parseInt(id)
    });

    const result = await benefitCycle.save();
    if (!result.success) {
        throw new ValidationError(result.error || 'Failed to update benefit cycle');
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Benefit cycle updated successfully'
    });
});

// POST /api/benefits/cycles/:id/finalize - Finalize benefit cycle
const finalizeBenefitCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycleResult = await BenefitCycle.findById(id);
    if (!cycleResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const benefitCycle = cycleResult.data;

    if (!benefitCycle.canFinalize()) {
        throw new ValidationError('Benefit cycle cannot be finalized in its current state');
    }

    const result = await benefitCycle.finalize(req.user.id);
    if (!result.success) {
        throw new Error('Failed to finalize benefit cycle');
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Benefit cycle finalized successfully'
    });
});

// POST /api/benefits/cycles/:id/release - Release benefit cycle
const releaseBenefitCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycleResult = await BenefitCycle.findById(id);
    if (!cycleResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const benefitCycle = cycleResult.data;

    if (!benefitCycle.canRelease()) {
        throw new ValidationError('Benefit cycle cannot be released in its current state');
    }

    const result = await benefitCycle.release();
    if (!result.success) {
        throw new Error('Failed to release benefit cycle');
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Benefit cycle released successfully'
    });
});

// POST /api/benefits/cycles/:id/cancel - Cancel benefit cycle
const cancelBenefitCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycleResult = await BenefitCycle.findById(id);
    if (!cycleResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const benefitCycle = cycleResult.data;

    const result = await benefitCycle.cancel();
    if (!result.success) {
        throw new Error('Failed to cancel benefit cycle');
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Benefit cycle cancelled successfully'
    });
});

// GET /api/benefits/cycles/statistics - Get benefit cycles statistics
const getBenefitCyclesStatistics = asyncHandler(async (req, res) => {
    const result = await BenefitCycle.getStatistics();
    if (!result.success) {
        throw new Error('Failed to fetch benefit cycles statistics');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// =====================================================================
// EMPLOYEE SELECTION & PROCESSING
// =====================================================================

// GET /api/benefits/cycles/:cycleId/employees - Get employees for benefit cycle
const getEmployeesForBenefitCycle = asyncHandler(async (req, res) => {
    const { cycleId } = req.params;
    const {
        page = 1,
        limit = 50,
        search,
        department,
        status: employeeStatus = 'Active'
    } = req.query;

    // Verify cycle exists
    const cycleResult = await BenefitCycle.findById(cycleId);
    if (!cycleResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const cycle = cycleResult.data;

    // Build employee query
    let employeeQuery = `
        SELECT
            e.id,
            e.employee_number,
            e.first_name,
            e.middle_name,
            e.last_name,
            e.plantilla_position as department,
            e.plantilla_position,
            e.appointment_date,
            e.current_monthly_salary,
            e.current_daily_rate,
            e.employment_status,
            CASE WHEN bi.id IS NOT NULL THEN 1 ELSE 0 END as already_processed,
            bi.status as benefit_status,
            bi.calculated_amount,
            bi.final_amount
        FROM employees e
        LEFT JOIN benefit_items bi ON bi.benefit_cycle_id = ? AND bi.employee_id = e.id
        WHERE e.employment_status = ?
    `;
    const queryParams = [cycleId, employeeStatus];

    if (department) {
        employeeQuery += ' AND e.plantilla_position = ?';
        queryParams.push(department);
    }

    if (search) {
        employeeQuery += ' AND (e.employee_number LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    employeeQuery += ' ORDER BY e.last_name ASC, e.first_name ASC';

    // Handle pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    employeeQuery += ` LIMIT ${offset}, ${parseInt(limit)}`;

    const result = await executeQuery(employeeQuery, queryParams);
    if (!result.success) {
        throw new Error('Failed to fetch employees for benefit cycle');
    }

    // Get total count
    let countQuery = `
        SELECT COUNT(*) as count FROM employees e
        LEFT JOIN benefit_items bi ON bi.benefit_cycle_id = ? AND bi.employee_id = e.id
        WHERE e.employment_status = ?
    `;
    const countParams = [cycleId, employeeStatus];

    if (department) {
        countQuery += ' AND e.plantilla_position = ?';
        countParams.push(department);
    }

    if (search) {
        countQuery += ' AND (e.employee_number LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countResult = await executeQuery(countQuery, countParams);
    const totalCount = countResult.success ? countResult.data[0].count : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
        success: true,
        data: result.data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            total_pages: totalPages
        }
    });
});

// POST /api/benefits/cycles/:cycleId/process-employees - Process selected employees for benefit cycle
const processEmployeesForBenefitCycle = asyncHandler(async (req, res) => {
    const { cycleId } = req.params;
    const { employee_ids, override_settings = {} } = req.body;

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        throw new ValidationError('Employee IDs are required');
    }

    // Verify cycle exists and is in correct state
    const cycleResult = await BenefitCycle.findById(cycleId);
    if (!cycleResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const cycle = cycleResult.data;

    if (cycle.status !== 'Draft' && cycle.status !== 'Processing') {
        throw new ValidationError('Benefit cycle must be in Draft or Processing status to add employees');
    }

    const processedItems = [];
    const errors = [];

    // Process each employee
    for (const employeeId of employee_ids) {
        try {
            // Check if already processed
            const existingResult = await BenefitItem.findByCycleAndEmployee(cycleId, employeeId);
            if (existingResult.success) {
                errors.push(`Employee ${employeeId} already processed in this cycle`);
                continue;
            }

            // Get employee details
            const employeeResult = await executeQuery(
                'SELECT * FROM employees WHERE id = ? AND employment_status = "Active"',
                [employeeId]
            );

            if (!employeeResult.success || employeeResult.data.length === 0) {
                errors.push(`Employee ${employeeId} not found or inactive`);
                continue;
            }

            const employee = employeeResult.data[0];

            // Calculate benefit amount
            const calculationResult = await calculateBenefitAmount(cycle, employee, override_settings);

            // Create benefit item
            const benefitItem = new BenefitItem({
                benefit_cycle_id: parseInt(cycleId),
                employee_id: parseInt(employeeId),
                working_days: calculationResult.working_days,
                basic_salary: calculationResult.basic_salary,
                calculated_amount: calculationResult.calculated_amount,
                final_amount: calculationResult.final_amount,
                status: 'Calculated',
                calculation_details: JSON.stringify(calculationResult.details),
                is_eligible: calculationResult.eligible,
                eligibility_notes: calculationResult.eligibility_notes,
                processed_by: req.user.id,
                processed_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });

            const saveResult = await benefitItem.save();
            if (saveResult.success) {
                processedItems.push(saveResult.data);
            } else {
                errors.push(`Failed to process employee ${employeeId}: ${saveResult.error}`);
            }
        } catch (error) {
            errors.push(`Error processing employee ${employeeId}: ${error.message}`);
        }
    }

    // Update cycle totals
    await cycle.updateTotals();

    res.json({
        success: true,
        data: {
            processed_count: processedItems.length,
            error_count: errors.length,
            processed_items: processedItems,
            errors: errors
        },
        message: `Processed ${processedItems.length} employees, ${errors.length} errors occurred`
    });
});

// =====================================================================
// CALCULATION ENGINE
// =====================================================================

// POST /api/benefits/calculate - Calculate benefit amount for employee
const calculateBenefitAmount = async (cycle, employee, overrideSettings = {}) => {
    const benefitType = await BenefitType.findById(cycle.compensation_type_id);
    if (!benefitType.success) {
        throw new Error('Benefit type not found');
    }

    const type = benefitType.data;
    let calculatedAmount = 0;
    let finalAmount = 0;
    let eligible = true;
    let eligibilityNotes = null;
    let workingDays = null;
    let basicSalary = employee.current_monthly_salary || (employee.current_daily_rate * 22);

    const calculationDetails = {
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        benefit_type: type.name,
        calculation_type: type.calculation_type,
        base_salary: basicSalary,
        calculation_date: new Date().toISOString()
    };

    // Calculate based on type
    switch (type.calculation_type) {
        case 'Fixed':
            calculatedAmount = type.default_amount || 0;
            break;

        case 'Percentage':
            if (!type.percentage_base) {
                throw new Error('Percentage base not defined for this benefit type');
            }

            let baseAmount = 0;
            switch (type.percentage_base) {
                case 'BasicPay':
                case 'MonthlySalary':
                    baseAmount = basicSalary;
                    break;
                case 'AnnualSalary':
                    baseAmount = basicSalary * 12;
                    break;
                case 'GrossPay':
                    // Get gross pay from payroll if available
                    baseAmount = basicSalary;
                    break;
                default:
                    baseAmount = basicSalary;
            }

            calculatedAmount = (baseAmount * (type.default_amount || 0)) / 100;
            calculationDetails.percentage_base = type.percentage_base;
            calculationDetails.base_amount = baseAmount;
            break;

        case 'Formula':
            if (!type.formula) {
                throw new Error('Formula not defined for this benefit type');
            }

            calculatedAmount = await evaluateFormula(type.formula, employee, cycle);
            calculationDetails.formula = type.formula;
            break;

        case 'MonthsWorked':
            // Calculate based on months worked in the year
            const appointmentDate = new Date(employee.appointment_date);
            const yearStart = new Date(cycle.year, 0, 1);
            const yearEnd = new Date(cycle.year, 11, 31);

            let monthsWorked = 12;
            if (appointmentDate > yearStart) {
                monthsWorked = 12 - appointmentDate.getMonth();
            }

            calculatedAmount = (basicSalary * monthsWorked) / 12;
            calculationDetails.months_worked = monthsWorked;
            calculationDetails.appointment_date = employee.appointment_date;
            break;

        default:
            throw new Error(`Unsupported calculation type: ${type.calculation_type}`);
    }

    // Apply eligibility checks
    const eligibilityResult = await checkBenefitEligibility(employee, type, cycle);
    eligible = eligibilityResult.eligible;
    eligibilityNotes = eligibilityResult.notes;

    // Apply final amount (with any overrides)
    finalAmount = overrideSettings.override_amount !== undefined ?
        parseFloat(overrideSettings.override_amount) :
        calculatedAmount;

    calculationDetails.calculated_amount = calculatedAmount;
    calculationDetails.final_amount = finalAmount;
    calculationDetails.eligible = eligible;
    calculationDetails.eligibility_notes = eligibilityNotes;

    return {
        calculated_amount: parseFloat(calculatedAmount.toFixed(2)),
        final_amount: parseFloat(finalAmount.toFixed(2)),
        eligible,
        eligibility_notes: eligibilityNotes,
        working_days: workingDays,
        basic_salary: basicSalary,
        details: calculationDetails
    };
};

// Helper function to evaluate formula
const evaluateFormula = async (formula, employee, cycle) => {
    // Simple formula evaluation - can be extended for complex formulas
    let result = 0;

    try {
        // Replace variables in formula
        let evalFormula = formula
            .replace(/BASIC_SALARY/g, employee.current_monthly_salary || 0)
            .replace(/DAILY_RATE/g, employee.current_daily_rate || 0)
            .replace(/MONTHLY_SALARY/g, employee.current_monthly_salary || 0)
            .replace(/ANNUAL_SALARY/g, (employee.current_monthly_salary || 0) * 12);

        // Add service years calculation
        const appointmentDate = new Date(employee.appointment_date);
        const currentDate = new Date();
        const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();

        evalFormula = evalFormula.replace(/SERVICE_YEARS/g, serviceYears);

        // Simple evaluation (in production, use a proper expression evaluator)
        result = eval(evalFormula);
    } catch (error) {
        throw new Error(`Formula evaluation error: ${error.message}`);
    }

    return parseFloat(result.toFixed(2));
};

// Helper function to check benefit eligibility
const checkBenefitEligibility = async (employee, benefitType, cycle) => {
    let eligible = true;
    let notes = [];

    // Check if employee is active
    if (employee.employment_status !== 'Active') {
        eligible = false;
        notes.push('Employee is not active');
    }

    // Check service requirements based on benefit type
    const appointmentDate = new Date(employee.appointment_date);
    const currentDate = new Date();
    const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();

    // Type-specific eligibility checks
    switch (benefitType.code) {
        case 'PBB':
            // Minimum 4 months service
            const yearStart = new Date(cycle.year, 0, 1);
            let serviceMonths = 12;
            if (appointmentDate > yearStart) {
                serviceMonths = 12 - appointmentDate.getMonth();
            }

            if (serviceMonths < 4) {
                eligible = false;
                notes.push(`Insufficient service: ${serviceMonths} months (minimum 4 required)`);
            }
            break;

        case 'LOYALTY':
            if (serviceYears < 10) {
                eligible = false;
                notes.push(`Insufficient service: ${serviceYears} years (minimum 10 required)`);
            }
            break;

        case 'TERMINAL':
            // Only for separated/retired employees
            if (employee.employment_status === 'Active') {
                eligible = false;
                notes.push('Terminal benefits only for separated/retired employees');
            }
            break;
    }

    // Check cutoff date if specified
    if (cycle.cutoff_date && appointmentDate > new Date(cycle.cutoff_date)) {
        eligible = false;
        notes.push('Appointment date is after cutoff date');
    }

    return {
        eligible,
        notes: notes.length > 0 ? notes.join(', ') : null
    };
};

// =====================================================================
// REVIEW & ADJUSTMENTS
// =====================================================================

// GET /api/benefits/cycles/:cycleId/items - Get benefit items for review
const getBenefitItemsForReview = asyncHandler(async (req, res) => {
    const { cycleId } = req.params;
    const {
        page = 1,
        limit = 20,
        status,
        is_eligible,
        search
    } = req.query;

    const filters = {
        benefit_cycle_id: parseInt(cycleId),
        status,
        is_eligible: is_eligible !== undefined ? parseInt(is_eligible) : undefined,
        search,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const [itemsResult, countResult] = await Promise.all([
        BenefitItem.getWithDetails(filters),
        BenefitItem.getCount(filters)
    ]);

    if (!itemsResult.success) {
        throw new Error('Failed to fetch benefit items');
    }

    const totalPages = Math.ceil(countResult / parseInt(limit));

    res.json({
        success: true,
        data: itemsResult.data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult,
            total_pages: totalPages
        }
    });
});

// PUT /api/benefits/items/:itemId/adjust - Adjust benefit item amount
const adjustBenefitItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { final_amount, adjustment_reason } = req.body;

    if (!final_amount || !adjustment_reason) {
        throw new ValidationError('Final amount and adjustment reason are required');
    }

    const itemResult = await BenefitItem.findById(itemId);
    if (!itemResult.success) {
        throw new NotFoundError('Benefit item not found');
    }

    const benefitItem = itemResult.data;

    if (!benefitItem.canEdit()) {
        throw new ValidationError('Benefit item cannot be adjusted in its current state');
    }

    benefitItem.calculateAdjustment(parseFloat(final_amount), adjustment_reason);

    const result = await benefitItem.update();
    if (!result.success) {
        throw new Error('Failed to adjust benefit item');
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Benefit item adjusted successfully'
    });
});

// POST /api/benefits/items/bulk-adjust - Bulk adjust benefit items
const bulkAdjustBenefitItems = asyncHandler(async (req, res) => {
    const { item_ids, adjustment_type, adjustment_value, adjustment_reason } = req.body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        throw new ValidationError('Item IDs are required');
    }

    if (!adjustment_type || !adjustment_reason) {
        throw new ValidationError('Adjustment type and reason are required');
    }

    const adjustedItems = [];
    const errors = [];

    for (const itemId of item_ids) {
        try {
            const itemResult = await BenefitItem.findById(itemId);
            if (!itemResult.success) {
                errors.push(`Item ${itemId} not found`);
                continue;
            }

            const benefitItem = itemResult.data;

            if (!benefitItem.canEdit()) {
                errors.push(`Item ${itemId} cannot be adjusted in its current state`);
                continue;
            }

            let newAmount = benefitItem.calculated_amount;

            switch (adjustment_type) {
                case 'fixed':
                    newAmount = parseFloat(adjustment_value);
                    break;
                case 'percentage':
                    newAmount = benefitItem.calculated_amount * (1 + parseFloat(adjustment_value) / 100);
                    break;
                case 'addition':
                    newAmount = benefitItem.calculated_amount + parseFloat(adjustment_value);
                    break;
                case 'subtraction':
                    newAmount = benefitItem.calculated_amount - parseFloat(adjustment_value);
                    break;
            }

            benefitItem.calculateAdjustment(newAmount, adjustment_reason);

            const result = await benefitItem.update();
            if (result.success) {
                adjustedItems.push(result.data);
            } else {
                errors.push(`Failed to adjust item ${itemId}: ${result.error}`);
            }
        } catch (error) {
            errors.push(`Error adjusting item ${itemId}: ${error.message}`);
        }
    }

    res.json({
        success: true,
        data: {
            adjusted_count: adjustedItems.length,
            error_count: errors.length,
            adjusted_items: adjustedItems,
            errors: errors
        },
        message: `Adjusted ${adjustedItems.length} items, ${errors.length} errors occurred`
    });
});

// =====================================================================
// FINALIZATION & RELEASE
// =====================================================================

// POST /api/benefits/cycles/:cycleId/approve-items - Approve benefit items
const approveBenefitItems = asyncHandler(async (req, res) => {
    const { cycleId } = req.params;
    const { item_ids } = req.body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        throw new ValidationError('Item IDs are required');
    }

    const result = await BenefitItem.bulkUpdateStatus(item_ids, 'Approved', req.user.id);
    if (!result.success) {
        throw new Error('Failed to approve benefit items');
    }

    res.json({
        success: true,
        data: {
            approved_count: result.affected_rows,
            message: result.message
        },
        message: 'Benefit items approved successfully'
    });
});

// POST /api/benefits/cycles/:cycleId/pay-items - Mark benefit items as paid
const payBenefitItems = asyncHandler(async (req, res) => {
    const { cycleId } = req.params;
    const { item_ids, payment_reference } = req.body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        throw new ValidationError('Item IDs are required');
    }

    const result = await BenefitItem.bulkUpdateStatus(item_ids, 'Paid', req.user.id);
    if (!result.success) {
        throw new Error('Failed to mark benefit items as paid');
    }

    res.json({
        success: true,
        data: {
            paid_count: result.affected_rows,
            payment_reference,
            message: result.message
        },
        message: 'Benefit items marked as paid successfully'
    });
});

// =====================================================================
// INTEGRATION WITH PAYROLL
// =====================================================================

// GET /api/benefits/payroll-periods - Get available payroll periods for integration
const getPayrollPeriodsForIntegration = asyncHandler(async (req, res) => {
    const { year } = req.query;

    const query = `
        SELECT
            pp.id,
            CONCAT(
                CASE pp.month
                    WHEN 1 THEN 'January' WHEN 2 THEN 'February' WHEN 3 THEN 'March'
                    WHEN 4 THEN 'April' WHEN 5 THEN 'May' WHEN 6 THEN 'June'
                    WHEN 7 THEN 'July' WHEN 8 THEN 'August' WHEN 9 THEN 'September'
                    WHEN 10 THEN 'October' WHEN 11 THEN 'November' WHEN 12 THEN 'December'
                END, ' ', pp.year, ' - ', 
                CASE pp.period_number WHEN 1 THEN '1st Half' ELSE '2nd Half' END
            ) as period_name,
            pp.start_date,
            pp.end_date,
            pp.year,
            pp.month,
            pp.status,
            COUNT(pi.id) as employee_count,
            COALESCE(SUM(pi.basic_pay), 0) as total_basic_salary
        FROM payroll_periods pp
        LEFT JOIN payroll_items pi ON pp.id = pi.payroll_period_id
        WHERE pp.status = 'Completed'
        ${year ? 'AND pp.year = ?' : ''}
        GROUP BY pp.id, pp.year, pp.month, pp.period_number, pp.start_date, pp.end_date, pp.status
        ORDER BY pp.start_date DESC
        LIMIT 50
    `;

    const params = year ? [parseInt(year)] : [];

    const result = await executeQuery(query, params);
    if (!result.success) {
        throw new Error('Failed to fetch payroll periods');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/benefits/cycles/:cycleId/integrate-payroll - Integrate benefit cycle with payroll
const integrateBenefitCycleWithPayroll = asyncHandler(async (req, res) => {
    const { cycleId } = req.params;
    const { payroll_period_id, integration_type = 'append' } = req.body;

    // Verify cycle exists
    const cycleResult = await BenefitCycle.findById(cycleId);
    if (!cycleResult.success) {
        throw new NotFoundError('Benefit cycle not found');
    }

    const cycle = cycleResult.data;

    if (cycle.status !== 'Completed') {
        throw new ValidationError('Benefit cycle must be completed before payroll integration');
    }

    // Verify payroll period exists
    const payrollResult = await executeQuery(
        'SELECT * FROM payroll_periods WHERE id = ? AND status = "Completed"',
        [payroll_period_id]
    );

    if (!payrollResult.success || payrollResult.data.length === 0) {
        throw new NotFoundError('Payroll period not found or not completed');
    }

    const payrollPeriod = payrollResult.data[0];

    // Get approved benefit items
    const itemsResult = await BenefitItem.findAll({
        benefit_cycle_id: parseInt(cycleId),
        status: 'Approved'
    });

    if (!itemsResult.success || itemsResult.data.length === 0) {
        throw new ValidationError('No approved benefit items found for integration');
    }

    const integrationResults = [];
    const errors = [];

    // Process integration for each benefit item
    for (const item of itemsResult.data) {
        try {
            // Check if integration record already exists
            const existingQuery = `
                SELECT id FROM payroll_items
                WHERE payroll_period_id = ? AND employee_id = ?
                AND description LIKE ?
            `;
            const existingResult = await executeQuery(existingQuery, [
                payroll_period_id,
                item.employee_id,
                `%${cycle.cycle_name}%`
            ]);

            if (existingResult.success && existingResult.data.length > 0) {
                if (integration_type === 'skip') {
                    continue;
                } else if (integration_type === 'replace') {
                    // Delete existing record
                    await executeQuery('DELETE FROM payroll_items WHERE id = ?', [existingResult.data[0].id]);
                }
            }

            // Create payroll item for benefit
            const payrollItemQuery = `
                INSERT INTO payroll_items (
                    payroll_period_id, employee_id, basic_salary, allowances,
                    deductions, gross_pay, net_pay, description, created_by
                ) VALUES (?, ?, 0, ?, 0, ?, ?, ?, ?)
            `;

            const description = `${cycle.cycle_name} - Benefit Payment`;
            const insertResult = await executeQuery(payrollItemQuery, [
                payroll_period_id,
                item.employee_id,
                item.final_amount,
                item.final_amount,
                description,
                req.user.id
            ]);

            if (insertResult.success) {
                integrationResults.push({
                    employee_id: item.employee_id,
                    benefit_item_id: item.id,
                    payroll_item_id: insertResult.data.insertId,
                    amount: item.final_amount
                });
            } else {
                errors.push(`Failed to integrate benefit for employee ${item.employee_id}`);
            }
        } catch (error) {
            errors.push(`Error integrating benefit for employee ${item.employee_id}: ${error.message}`);
        }
    }

    res.json({
        success: true,
        data: {
            integrated_count: integrationResults.length,
            error_count: errors.length,
            integrations: integrationResults,
            errors: errors,
            payroll_period: payrollPeriod
        },
        message: `Integrated ${integrationResults.length} benefit payments with payroll, ${errors.length} errors occurred`
    });
});

// =====================================================================
// REPORTING
// =====================================================================

// GET /api/benefits/reports/summary - Generate comprehensive benefit summary report
const generateBenefitSummaryReport = asyncHandler(async (req, res) => {
    const {
        year,
        benefit_type_id,
        department,
        status,
        include_details = false
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (year) {
        whereConditions.push('bc.year = ?');
        queryParams.push(parseInt(year));
    }

    if (benefit_type_id) {
        whereConditions.push('bc.compensation_type_id = ?');
        queryParams.push(parseInt(benefit_type_id));
    }

    if (status) {
        whereConditions.push('bc.status = ?');
        queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Summary by benefit type
    const summaryQuery = `
        SELECT
            ct.name as benefit_type_name,
            ct.code as benefit_type_code,
            bc.year,
            bc.status as cycle_status,
            COUNT(DISTINCT bc.id) as cycle_count,
            COUNT(bi.id) as total_items,
            COUNT(CASE WHEN bi.is_eligible = 1 THEN 1 END) as eligible_items,
            COUNT(CASE WHEN bi.status = 'Paid' THEN 1 END) as paid_items,
            COALESCE(SUM(bi.calculated_amount), 0) as total_calculated,
            COALESCE(SUM(bi.final_amount), 0) as total_final,
            COALESCE(SUM(CASE WHEN bi.status = 'Paid' THEN bi.final_amount ELSE 0 END), 0) as total_paid
        FROM benefit_cycles bc
        JOIN compensation_types ct ON bc.compensation_type_id = ct.id
        LEFT JOIN benefit_items bi ON bc.id = bi.benefit_cycle_id
        ${whereClause}
        GROUP BY ct.id, ct.name, ct.code, bc.year, bc.status
        ORDER BY bc.year DESC, ct.name ASC
    `;

    // Department breakdown
    const departmentQuery = `
        SELECT
            e.plantilla_position as department,
            COUNT(DISTINCT e.id) as employee_count,
            COUNT(bi.id) as benefit_items,
            COALESCE(SUM(bi.final_amount), 0) as total_amount
        FROM benefit_cycles bc
        JOIN benefit_items bi ON bc.id = bi.benefit_cycle_id
        JOIN employees e ON bi.employee_id = e.id
        ${whereClause.replace('bc.', 'bc.')}
        GROUP BY e.plantilla_position
        ORDER BY total_amount DESC
    `;

    const [summaryResult, departmentResult] = await Promise.all([
        executeQuery(summaryQuery, queryParams),
        executeQuery(departmentQuery, queryParams)
    ]);

    if (!summaryResult.success || !departmentResult.success) {
        throw new Error('Failed to generate benefit summary report');
    }

    const reportData = {
        summary: summaryResult.data,
        department_breakdown: departmentResult.data,
        totals: {
            total_cycles: summaryResult.data.reduce((sum, item) => sum + parseInt(item.cycle_count), 0),
            total_items: summaryResult.data.reduce((sum, item) => sum + parseInt(item.total_items), 0),
            total_eligible: summaryResult.data.reduce((sum, item) => sum + parseInt(item.eligible_items), 0),
            total_paid: summaryResult.data.reduce((sum, item) => sum + parseInt(item.paid_items), 0),
            total_calculated_amount: summaryResult.data.reduce((sum, item) => sum + parseFloat(item.total_calculated), 0),
            total_final_amount: summaryResult.data.reduce((sum, item) => sum + parseFloat(item.total_final), 0),
            total_paid_amount: summaryResult.data.reduce((sum, item) => sum + parseFloat(item.total_paid), 0)
        }
    };

    res.json({
        success: true,
        data: reportData,
        generated_at: new Date().toISOString(),
        parameters: {
            year,
            benefit_type_id,
            department,
            status
        }
    });
});

// GET /api/benefits/reports/employee/:employeeId - Get employee benefit history
const getEmployeeBenefitHistory = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { year, benefit_type_id } = req.query;

    let whereConditions = ['bi.employee_id = ?'];
    let queryParams = [employeeId];

    if (year) {
        whereConditions.push('bc.year = ?');
        queryParams.push(parseInt(year));
    }

    if (benefit_type_id) {
        whereConditions.push('bc.compensation_type_id = ?');
        queryParams.push(parseInt(benefit_type_id));
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
        SELECT
            bi.*,
            bc.cycle_name,
            bc.year,
            bc.applicable_date,
            bc.status as cycle_status,
            ct.name as benefit_type_name,
            ct.code as benefit_type_code,
            CONCAT(u1.username) as processed_by_username,
            CONCAT(u2.username) as approved_by_username,
            CONCAT(u3.username) as paid_by_username
        FROM benefit_items bi
        JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
        JOIN compensation_types ct ON bc.compensation_type_id = ct.id
        LEFT JOIN users u1 ON bi.processed_by = u1.id
        LEFT JOIN users u2 ON bi.approved_by = u2.id
        LEFT JOIN users u3 ON bi.paid_by = u3.id
        WHERE ${whereClause}
        ORDER BY bc.year DESC, bc.applicable_date DESC
    `;

    const result = await executeQuery(query, queryParams);
    if (!result.success) {
        throw new Error('Failed to fetch employee benefit history');
    }

    // Calculate totals
    const totals = {
        total_items: result.data.length,
        total_calculated: result.data.reduce((sum, item) => sum + parseFloat(item.calculated_amount || 0), 0),
        total_final: result.data.reduce((sum, item) => sum + parseFloat(item.final_amount || 0), 0),
        total_paid: result.data
            .filter(item => item.status === 'Paid')
            .reduce((sum, item) => sum + parseFloat(item.final_amount || 0), 0)
    };

    res.json({
        success: true,
        data: result.data,
        totals: totals
    });
});

// =====================================================================
// LEGACY METHODS (for backward compatibility)
// =====================================================================

// GET /api/benefits/employee/:id - Get employee benefits summary (legacy)
const getEmployeeBenefits = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // Get employee info
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ? AND employment_status = "Active"',
        [id]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or inactive');
    }

    const employee = employeeResult.data[0];

    // Get benefits compensation for the year
    const benefitsQuery = `
        SELECT
            ec.*,
            ct.name as benefit_name,
            ct.code as benefit_code,
            ct.description,
            ct.is_taxable
        FROM employee_compensation ec
        JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        WHERE ec.employee_id = ?
            AND ec.year = ?
            AND ct.code IN ('PBB', 'MYB', 'YEB', 'LA', 'RATA', 'CA', 'MA', 'HA', 'SL')
        ORDER BY ct.name ASC
    `;

    const benefitsResult = await executeQuery(benefitsQuery, [id, currentYear]);

    // Calculate service years for loyalty award eligibility
    const appointmentDate = new Date(employee.appointment_date);
    const currentDate = new Date();
    const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();

    // Check 13th month pay eligibility (served at least 1 month in the year)
    const thirteenthMonthEligible = true; // All employees eligible

    // Check PBB eligibility (minimum 4 months service)
    const pbbEligible = serviceYears > 0 ||
        (appointmentDate.getMonth() <= 8); // Appointed by September

    // Check loyalty award eligibility
    const loyaltyAwardEligible = serviceYears >= 10;
    const nextLoyaltyAward = serviceYears < 10 ? (10 - serviceYears) :
        (5 - ((serviceYears - 10) % 5));

    const benefits = benefitsResult.success ? benefitsResult.data : [];

    // Group benefits by type
    const benefitsSummary = {
        bonuses: benefits.filter(b => ['PBB', 'MYB', 'YEB'].includes(b.benefit_code)),
        allowances: benefits.filter(b => ['RATA', 'CA', 'MA', 'HA', 'SL'].includes(b.benefit_code)),
        awards: benefits.filter(b => b.benefit_code === 'LA'),
        monetization: benefits.filter(b => ['VLM', 'SLM'].includes(b.benefit_code))
    };

    // Calculate totals
    const totalBenefits = benefits.reduce((sum, benefit) => sum + parseFloat(benefit.amount), 0);
    const totalTaxable = benefits
        .filter(b => b.is_taxable)
        .reduce((sum, benefit) => sum + parseFloat(benefit.amount), 0);

    res.json({
        success: true,
        data: {
            employee: {
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                appointment_date: employee.appointment_date,
                service_years: serviceYears
            },
            benefits: benefitsSummary,
            eligibility: {
                thirteenth_month: thirteenthMonthEligible,
                pbb: pbbEligible,
                loyalty_award: loyaltyAwardEligible,
                next_loyalty_award_years: loyaltyAwardEligible ? nextLoyaltyAward : null
            },
            summary: {
                year: currentYear,
                total_benefits: parseFloat(totalBenefits.toFixed(2)),
                total_taxable: parseFloat(totalTaxable.toFixed(2)),
                benefit_count: benefits.length
            }
        }
    });
});

// POST /api/benefits/calculate - Calculate benefits for employee (legacy)
const calculateBenefits = asyncHandler(async (req, res) => {
    const { employee_id, benefit_type, year } = req.body;

    if (!employee_id || !benefit_type || !year) {
        throw new ValidationError('Employee ID, benefit type, and year are required');
    }

    // Get employee information
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ? AND employment_status = "Active"',
        [employee_id]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or inactive');
    }

    const employee = employeeResult.data[0];
    let calculatedAmount = 0;
    let eligibilityCheck = { eligible: true, reason: null };

    switch (benefit_type) {
        case 'thirteenth_month':
        case 'MID_YEAR':
            const calculation = await calculateThirteenthMonthPay(employee_id, year);
            calculatedAmount = calculation.amount;
            eligibilityCheck = calculation.eligibility;
            break;

        case 'fourteenth_month':
        case 'YEAR_END':
            const calc14th = await calculateFourteenthMonthPay(employee_id, year);
            calculatedAmount = calc14th.amount;
            eligibilityCheck = calc14th.eligibility;
            break;

        case 'pbb':
        case 'PBB':
            const pbbCalc = await calculatePBB(employee_id, year);
            calculatedAmount = pbbCalc.amount;
            eligibilityCheck = pbbCalc.eligibility;
            break;

        case 'loyalty_award':
        case 'LOYALTY':
            const loyaltyCalc = await calculateLoyaltyAward(employee);
            calculatedAmount = loyaltyCalc.amount;
            eligibilityCheck = loyaltyCalc.eligibility;
            break;

        case 'leave_monetization':
        case 'MONETIZATION':
            const leaveMonetizationCalc = await calculateLeaveMonetization(employee_id, year);
            calculatedAmount = leaveMonetizationCalc.amount;
            eligibilityCheck = leaveMonetizationCalc.eligibility;
            break;

        default:
            throw new ValidationError('Invalid benefit type');
    }

    res.json({
        success: true,
        data: {
            employee_id,
            benefit_type,
            year,
            calculated_amount: calculatedAmount,
            eligibility: eligibilityCheck,
            calculation_date: new Date()
        }
    });
});

// Helper function to calculate 13th month pay (legacy)
const calculateThirteenthMonthPay = async (employeeId, year) => {
    // Get total salary received in the year from payroll
    const salaryQuery = `
        SELECT COALESCE(SUM(basic_salary), 0) as total_salary
        FROM payroll_items pi
        JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
        WHERE pi.employee_id = ? AND pp.year = ? AND pp.status = 'Completed'
    `;

    const salaryResult = await executeQuery(salaryQuery, [employeeId, year]);

    if (!salaryResult.success) {
        return { amount: 0, eligibility: { eligible: false, reason: 'Cannot fetch salary data' } };
    }

    const totalSalary = salaryResult.data[0]?.total_salary || 0;

    // 13th month pay is 1/12 of total salary received
    const thirteenthMonthPay = totalSalary / 12;

    return {
        amount: parseFloat(thirteenthMonthPay.toFixed(2)),
        eligibility: {
            eligible: totalSalary > 0,
            reason: totalSalary === 0 ? 'No salary received this year' : null
        }
    };
};

// Helper function to calculate 14th month pay (legacy)
const calculateFourteenthMonthPay = async (employeeId, year) => {
    // Check if 14th month pay is applicable (usually same as 13th month)
    const thirteenthMonth = await calculateThirteenthMonthPay(employeeId, year);

    return {
        amount: thirteenthMonth.amount,
        eligibility: thirteenthMonth.eligibility
    };
};

// Helper function to calculate Performance-Based Bonus (PBB) (legacy)
const calculatePBB = async (employeeId, year) => {
    // Get employee appointment date
    const employeeResult = await executeQuery(
        'SELECT appointment_date, current_monthly_salary, current_daily_rate FROM employees WHERE id = ?',
        [employeeId]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        return { amount: 0, eligibility: { eligible: false, reason: 'Employee not found' } };
    }

    const employee = employeeResult.data[0];
    const appointmentDate = new Date(employee.appointment_date);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Check if employee served at least 4 months in the year
    let serviceMonths = 0;
    if (appointmentDate <= yearStart) {
        serviceMonths = 12; // Full year
    } else if (appointmentDate <= yearEnd) {
        serviceMonths = 12 - appointmentDate.getMonth();
    }

    if (serviceMonths < 4) {
        return {
            amount: 0,
            eligibility: {
                eligible: false,
                reason: `Insufficient service months: ${serviceMonths} (minimum 4 required)`
            }
        };
    }

    // PBB is typically equivalent to 1 month salary
    const monthlySalary = employee.current_monthly_salary || (employee.current_daily_rate * 22);

    return {
        amount: parseFloat(monthlySalary.toFixed(2)),
        eligibility: { eligible: true, reason: null }
    };
};

// Helper function to calculate loyalty award (legacy)
const calculateLoyaltyAward = async (employee) => {
    const appointmentDate = new Date(employee.appointment_date);
    const currentDate = new Date();
    const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();

    if (serviceYears < 10) {
        return {
            amount: 0,
            eligibility: {
                eligible: false,
                reason: `Insufficient service years: ${serviceYears} (minimum 10 required)`
            }
        };
    }

    let awardAmount = 10000; // First 10 years

    if (serviceYears > 10) {
        const additionalFiveYearPeriods = Math.floor((serviceYears - 10) / 5);
        awardAmount += additionalFiveYearPeriods * 5000;
    }

    return {
        amount: awardAmount,
        eligibility: { eligible: true, reason: null }
    };
};

// GET /api/benefits/types - Get benefit types (legacy)
const getBenefitTypesLegacy = asyncHandler(async (req, res) => {
    const result = await executeQuery(
        'SELECT * FROM compensation_types WHERE code IN ("PBB", "MYB", "YEB", "LA", "RATA", "CA", "MA", "HA", "SL") ORDER BY name ASC'
    );

    if (!result.success) {
        throw new Error('Failed to fetch benefit types');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/benefits/loyalty-award - Calculate and process loyalty award (legacy)
const processLoyaltyAward = asyncHandler(async (req, res) => {
    const { employee_id, year } = req.body;

    if (!employee_id || !year) {
        throw new ValidationError('Employee ID and year are required');
    }

    // Get employee information
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ? AND employment_status = "Active"',
        [employee_id]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or inactive');
    }

    const employee = employeeResult.data[0];

    // Calculate loyalty award
    const loyaltyCalculation = await calculateLoyaltyAward(employee);

    if (!loyaltyCalculation.eligibility.eligible) {
        throw new ValidationError(loyaltyCalculation.eligibility.reason);
    }

    // Check if already processed for this year
    const existingQuery = `
        SELECT id FROM employee_compensation
        WHERE employee_id = ? AND year = ?
        AND compensation_type_id = (SELECT id FROM compensation_types WHERE code = 'LA')
    `;

    const existingResult = await executeQuery(existingQuery, [employee_id, year]);

    if (existingResult.success && existingResult.data.length > 0) {
        throw new ValidationError('Loyalty award already processed for this year');
    }

    // Get loyalty award compensation type ID
    const typeResult = await executeQuery(
        'SELECT id FROM compensation_types WHERE code = "LA"'
    );

    if (!typeResult.success || typeResult.data.length === 0) {
        throw new Error('Loyalty award compensation type not found');
    }

    const compensationTypeId = typeResult.data[0].id;

    // Insert loyalty award record
    const insertQuery = `
        INSERT INTO employee_compensation
        (employee_id, compensation_type_id, amount, year, date_paid, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const serviceYears = new Date().getFullYear() - new Date(employee.appointment_date).getFullYear();
    const notes = `Loyalty Award for ${serviceYears} years of service`;

    const insertResult = await executeQuery(insertQuery, [
        employee_id,
        compensationTypeId,
        loyaltyCalculation.amount,
        year,
        new Date(),
        notes
    ]);

    if (!insertResult.success) {
        throw new Error('Failed to process loyalty award');
    }

    res.json({
        success: true,
        data: {
            employee_id,
            year,
            service_years: serviceYears,
            award_amount: loyaltyCalculation.amount,
            compensation_id: insertResult.insertId
        },
        message: 'Loyalty award processed successfully'
    });
});

// GET /api/benefits/summary/:year - Get benefits summary report (legacy)
const getBenefitsSummary = asyncHandler(async (req, res) => {
    const { year } = req.params;
    const { department, benefit_type } = req.query;

    let whereConditions = ['ec.year = ?'];
    let queryParams = [year];

    if (department) {
        whereConditions.push('e.plantilla_position = ?');
        queryParams.push(department);
    }

    if (benefit_type) {
        whereConditions.push('ct.code = ?');
        queryParams.push(benefit_type);
    }

    const whereClause = whereConditions.join(' AND ');

    const summaryQuery = `
        SELECT
            ct.name as benefit_name,
            ct.code as benefit_code,
            COUNT(*) as recipient_count,
            SUM(ec.amount) as total_amount,
            AVG(ec.amount) as average_amount,
            MIN(ec.amount) as minimum_amount,
            MAX(ec.amount) as maximum_amount
        FROM employee_compensation ec
        JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        JOIN employees e ON ec.employee_id = e.id
        WHERE ${whereClause}
            AND ct.code IN ('PBB', 'MYB', 'YEB', 'LA', 'RATA', 'CA', 'MA', 'HA', 'SL', 'VLM', 'SLM')
        GROUP BY ct.id, ct.name, ct.code
        ORDER BY total_amount DESC
    `;

    const detailQuery = `
        SELECT
            e.employee_number,
            e.first_name,
            e.last_name,
            ct.name as benefit_name,
            ct.code as benefit_code,
            ec.amount,
            ec.date_paid
        FROM employee_compensation ec
        JOIN compensation_types ct ON ec.compensation_type_id = ct.id
        JOIN employees e ON ec.employee_id = e.id
        WHERE ${whereClause}
            AND ct.code IN ('PBB', 'MYB', 'YEB', 'LA', 'RATA', 'CA', 'MA', 'HA', 'SL', 'VLM', 'SLM')
        ORDER BY e.employee_number, ct.name
    `;

    const [summaryResult, detailResult] = await Promise.all([
        executeQuery(summaryQuery, queryParams),
        executeQuery(detailQuery, queryParams)
    ]);

    if (!summaryResult.success || !detailResult.success) {
        throw new Error('Failed to generate benefits summary');
    }

    const totalBenefits = summaryResult.data.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
    const totalRecipients = detailResult.data.length;

    res.json({
        success: true,
        data: {
            year: parseInt(year),
            summary: summaryResult.data,
            details: detailResult.data,
            totals: {
                total_benefits_amount: parseFloat(totalBenefits.toFixed(2)),
                total_recipients: totalRecipients,
                benefit_types: summaryResult.data.length
            }
        }
    });
});

// Helper function to calculate leave monetization potential (legacy)
const calculateLeaveMonetization = async (employeeId, year) => {
    // Get employee information
    const employeeResult = await executeQuery(
        'SELECT current_daily_rate, current_monthly_salary FROM employees WHERE id = ?',
        [employeeId]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        return { amount: 0, eligibility: { eligible: false, reason: 'Employee not found' } };
    }

    const employee = employeeResult.data[0];
    const dailyRate = employee.current_daily_rate || (employee.current_monthly_salary / 22);

    // Get monetizable leave balances
    const balancesQuery = `
        SELECT
            elb.current_balance,
            elb.monetized_days,
            lt.name as leave_type_name,
            lt.code as leave_type_code,
            lt.is_monetizable
        FROM employee_leave_balances elb
        JOIN leave_types lt ON elb.leave_type_id = lt.id
        WHERE elb.employee_id = ? AND elb.year = ? AND lt.is_monetizable = 1
          AND elb.current_balance > 0
    `;

    const balancesResult = await executeQuery(balancesQuery, [employeeId, year]);

    if (!balancesResult.success) {
        return { amount: 0, eligibility: { eligible: false, reason: 'Cannot fetch leave balances' } };
    }

    const monetizableBalances = balancesResult.data;

    if (monetizableBalances.length === 0) {
        return {
            amount: 0,
            eligibility: {
                eligible: false,
                reason: 'No monetizable leave balances available'
            }
        };
    }

    // Calculate total potential monetization amount
    const totalMonetizableDays = monetizableBalances.reduce((total, balance) => {
        // Apply monetization limits (29 days per leave type without clearance)
        const maxMonetizable = Math.min(balance.current_balance, 29);
        return total + maxMonetizable;
    }, 0);

    const totalMonetizationAmount = totalMonetizableDays * dailyRate;

    return {
        amount: parseFloat(totalMonetizationAmount.toFixed(2)),
        eligibility: {
            eligible: totalMonetizableDays > 0,
            reason: totalMonetizableDays === 0 ? 'No leave days available for monetization' : null
        },
        details: {
            daily_rate: dailyRate,
            monetizable_days: totalMonetizableDays,
            balances: monetizableBalances.map(balance => ({
                leave_type: balance.leave_type_name,
                current_balance: balance.current_balance,
                max_monetizable: Math.min(balance.current_balance, 29)
            }))
        }
    };
};

module.exports = {
    // Benefit Type Management
    getBenefitTypes,
    getBenefitTypeById,
    createBenefitType,
    updateBenefitType,
    deleteBenefitType,
    getBenefitTypesStatistics,

    // Benefit Cycle Management
    getBenefitCycles,
    getBenefitCycleById,
    createBenefitCycle,
    updateBenefitCycle,
    finalizeBenefitCycle,
    releaseBenefitCycle,
    cancelBenefitCycle,
    getBenefitCyclesStatistics,

    // Employee Selection & Processing
    getEmployeesForBenefitCycle,
    processEmployeesForBenefitCycle,

    // Review & Adjustments
    getBenefitItemsForReview,
    adjustBenefitItem,
    bulkAdjustBenefitItems,

    // Finalization & Release
    approveBenefitItems,
    payBenefitItems,

    // Integration with Payroll
    getPayrollPeriodsForIntegration,
    integrateBenefitCycleWithPayroll,

    // Reporting
    generateBenefitSummaryReport,
    getEmployeeBenefitHistory,

    // Employee Compensation Management
    getEmployeeCompensation,
    createEmployeeCompensation,
    updateEmployeeCompensation,
    deleteEmployeeCompensation,

    // Legacy methods (for backward compatibility)
    getEmployeeBenefits,
    calculateBenefits,
    getBenefitTypes: getBenefitTypesLegacy,
    processLoyaltyAward,
    getBenefitsSummary
};