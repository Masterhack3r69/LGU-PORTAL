// controllers/compensationBenefitsController.js - Manual Compensation & Benefits Selection System
const { executeQuery, executeTransaction } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const Employee = require('../models/Employee');

// Logger utility for compensation & benefits
const cbLogger = {
    info: (message, data = {}) => {
        console.log(`[COMPENSATION-BENEFITS] ${new Date().toISOString()}: ${message}`, data);
    },
    error: (message, error = {}, data = {}) => {
        console.error(`[COMPENSATION-BENEFITS-ERROR] ${new Date().toISOString()}: ${message}`, {
            error: error.message || error,
            stack: error.stack,
            data
        });
    }
};

// ===================================================================
// BENEFIT AVAILABILITY AND ELIGIBILITY
// ===================================================================

// GET /api/compensation-benefits/available-benefits/:id?year=2024 - Get available benefits for employee
const getAvailableBenefits = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;

    // Validate parameters
    const employeeId = parseInt(id);
    const yearNum = parseInt(year || new Date().getFullYear());
    
    if (isNaN(employeeId) || employeeId <= 0) {
        throw new ValidationError('Invalid employee ID');
    }
    
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        throw new ValidationError('Invalid year');
    }

    // Get employee information
    const employeeResult = await executeQuery(`
        SELECT 
            id, employee_number, first_name, last_name,
            appointment_date, current_monthly_salary, current_daily_rate,
            employment_status
        FROM employees 
        WHERE id = ?
    `, [employeeId]);

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found');
    }

    const employee = employeeResult.data[0];

    // Get all active benefit types
    const benefitTypesResult = await executeQuery(`
        SELECT * FROM cb_benefit_types 
        WHERE is_active = true 
        ORDER BY category, name
    `);

    if (!benefitTypesResult.success) {
        throw new Error('Failed to fetch benefit types');
    }

    const benefitTypes = benefitTypesResult.data;

    // Check eligibility and calculate estimated amounts for each benefit
    const availableBenefits = [];
    for (const benefit of benefitTypes) {
        try {
            const eligibility = await checkBenefitEligibility(employee, benefit, yearNum);
            
            if (eligibility.eligible) {
                const estimatedAmount = await calculateBenefitAmount(employee, benefit, yearNum);
                
                availableBenefits.push({
                    ...benefit,
                    estimated_amount: estimatedAmount,
                    eligibility_details: eligibility.details,
                    can_select: true
                });
            } else {
                availableBenefits.push({
                    ...benefit,
                    estimated_amount: 0,
                    eligibility_details: eligibility.details,
                    can_select: false,
                    ineligibility_reason: eligibility.reason
                });
            }
        } catch (error) {
            cbLogger.error('Error checking benefit eligibility', error, { 
                employee_id: employeeId,
                benefit_id: benefit.id 
            });
            // Add benefit with error status
            availableBenefits.push({
                ...benefit,
                estimated_amount: 0,
                can_select: false,
                ineligibility_reason: 'System error checking eligibility'
            });
        }
    }

    // Get current selections for the year
    const currentSelectionsResult = await executeQuery(`
        SELECT 
            ebs.*,
            cbt.code as benefit_code,
            cbt.name as benefit_name
        FROM employee_benefit_selections ebs
        JOIN cb_benefit_types cbt ON ebs.benefit_type_id = cbt.id
        WHERE ebs.employee_id = ? AND ebs.year = ?
    `, [employeeId, yearNum]);

    const currentSelections = currentSelectionsResult.success ? currentSelectionsResult.data : [];

    // Group benefits by category
    const benefitsByCategory = availableBenefits.reduce((acc, benefit) => {
        if (!acc[benefit.category]) {
            acc[benefit.category] = [];
        }
        acc[benefit.category].push(benefit);
        return acc;
    }, {});

    res.json({
        success: true,
        data: {
            employee: {
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                appointment_date: employee.appointment_date,
                employment_status: employee.employment_status
            },
            year: yearNum,
            benefits_by_category: benefitsByCategory,
            current_selections: currentSelections,
            summary: {
                total_available: availableBenefits.filter(b => b.can_select).length,
                total_selected: currentSelections.filter(s => s.is_selected).length,
                estimated_total_amount: availableBenefits
                    .filter(b => b.can_select)
                    .reduce((sum, b) => sum + b.estimated_amount, 0)
            }
        }
    });
});

// ===================================================================
// BENEFIT SELECTION PROCESS
// ===================================================================

// POST /api/compensation-benefits/submit-selections - Submit benefit selections for employee
const submitBenefitSelections = asyncHandler(async (req, res) => {
    const { employee_id, year, selections } = req.body;

    cbLogger.info('Benefit submission request received', {
        employee_id,
        year,
        selections_count: selections ? selections.length : 0
    });

    // Enhanced validation
    if (!employee_id) {
        throw new ValidationError('Employee ID is required');
    }
    
    if (!year) {
        throw new ValidationError('Year is required');
    }
    
    if (!Array.isArray(selections)) {
        throw new ValidationError('Selections must be an array');
    }

    // Validate employee exists
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ? AND employment_status IN ("Active", "Resigned")',
        [employee_id]
    );

    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found or not eligible for benefits');
    }

    const employee = employeeResult.data[0];
    
    // Handle empty selections (clearing all selections)
    if (selections.length === 0) {
        try {
            const deleteResult = await executeQuery(
                'DELETE FROM employee_benefit_selections WHERE employee_id = ? AND year = ?',
                [employee_id, year]
            );

            return res.json({
                success: true,
                message: 'All benefit selections cleared successfully',
                data: {
                    employee_id,
                    year,
                    selections_count: 0,
                    action: 'cleared'
                }
            });
        } catch (error) {
            throw new Error(`Failed to clear benefit selections: ${error.message}`);
        }
    }
    
    // Validate selections have required fields
    for (let i = 0; i < selections.length; i++) {
        const selection = selections[i];
        if (!selection.benefit_type_id) {
            throw new ValidationError(`Selection ${i + 1}: benefit_type_id is required`);
        }
        if (!selection.selected_amount && selection.selected_amount !== 0) {
            throw new ValidationError(`Selection ${i + 1}: selected_amount is required`);
        }
        if (selection.selected_amount < 0) {
            throw new ValidationError(`Selection ${i + 1}: selected_amount cannot be negative`);
        }
    }
    
    // Quick validation - check if selections array is reasonable size
    if (selections.length > 50) {
        throw new ValidationError('Too many benefit selections. Maximum 50 allowed.');
    }
    
    // Batch validate benefit types exist
    const benefitTypeIds = selections.map(s => s.benefit_type_id).filter(Boolean);
    if (benefitTypeIds.length > 0) {
        // Create a safe SQL query with proper placeholders
        const placeholders = benefitTypeIds.map(() => '?').join(',');
        const benefitTypesResult = await executeQuery(
            `SELECT id, name, base_amount, calculation_method FROM cb_benefit_types
             WHERE id IN (${placeholders}) AND is_active = 1`,
            benefitTypeIds
        );
        
        if (!benefitTypesResult.success) {
            throw new Error('Failed to validate benefit types');
        }
        
        if (benefitTypesResult.data.length !== benefitTypeIds.length) {
            const validIds = benefitTypesResult.data.map(bt => bt.id);
            const invalidIds = benefitTypeIds.filter(id => !validIds.includes(id));
            throw new ValidationError(`Invalid benefit type IDs: ${invalidIds.join(', ')}`);
        }
        
        // Quick amount validation against base amounts or reasonable fallback
        const benefitTypesMap = new Map(
            benefitTypesResult.data.map(bt => [bt.id, bt])
        );

        for (const selection of selections) {
            if (selection.benefit_type_id && selection.selected_amount) {
                const benefitType = benefitTypesMap.get(selection.benefit_type_id);

                if (benefitType) {
                    // Use base_amount if valid (> 0), otherwise use reasonable fallback based on calculation_method
                    let maxAmount;
                    if (benefitType.base_amount && parseFloat(benefitType.base_amount) > 0) {
                        maxAmount = parseFloat(benefitType.base_amount) * 2;
                    } else if (benefitType.calculation_method === 'FORMULA') {
                        // For formula-based benefits, use generous limit based on employee salary
                        maxAmount = parseFloat(employee.current_monthly_salary) || 100000; // Fallback to 100k if no salary
                    } else {
                        // For FIXED benefits, use reasonable default
                        maxAmount = 10000; // 10k limit for fixed benefits
                    }

                    if (parseFloat(selection.selected_amount) > maxAmount) {
                        throw new ValidationError(`Selected amount for ${benefitType.name} exceeds reasonable limit (max: ${maxAmount})`);
                    }
                }
            }
        }
    }

    cbLogger.info('Starting benefit selection submission', {
        employee_id,
        year,
        selections: selections.length
    });

    // Check if employee has salary data
    const { getConsistentSalaryValues } = require('../models/Employee');
    const salaryData = getConsistentSalaryValues(employee);

    cbLogger.info('Employee salary data', {
        employee_id,
        has_monthly_salary: !!salaryData.monthlySalary,
        monthly_salary: salaryData.monthlySalary,
        daily_rate: salaryData.dailyRate
    });

    // Use a simpler transaction approach for better performance
    try {
        // Delete existing selections for the year
        const deleteResult = await executeQuery(
            'DELETE FROM employee_benefit_selections WHERE employee_id = ? AND year = ?',
            [employee_id, year]
        );

        if (!deleteResult.success) {
            throw new Error('Failed to clear existing selections');
        }

        // Batch insert new selections for better performance
        if (selections.length > 0) {
            const insertValues = [];
            const insertParams = [];
            
            for (const selection of selections) {
                if (selection.benefit_type_id && (selection.selected_amount || selection.selected_amount === 0)) {
                    insertValues.push('(?, ?, ?, ?, ?, ?, "CALCULATED", NOW())');
                    insertParams.push(
                        employee_id,
                        selection.benefit_type_id,
                        year,
                        0, // is_selected (legacy field, set to 0)
                        parseFloat(selection.selected_amount), // calculated_amount
                        parseFloat(selection.selected_amount) // actual_amount initially = calculated_amount
                    );
                }
            }

            if (insertValues.length > 0) {
                const insertQuery = `
                    INSERT INTO employee_benefit_selections
                    (employee_id, benefit_type_id, year, is_selected, calculated_amount, actual_amount, status, selection_date)
                    VALUES ${insertValues.join(', ')}
                `;

                const insertResult = await executeQuery(insertQuery, insertParams);

                if (!insertResult.success) {
                    throw new Error('Failed to save benefit selections');
                }
            }
        }

        cbLogger.info('Benefit selections submitted successfully', {
            employee_id,
            year,
            selections_count: selections.length
        });

        res.json({
            success: true,
            message: 'Benefit selections submitted successfully',
            data: {
                employee_id,
                year,
                selections_count: selections.length,
                processing_time: 'optimized',
                employee_name: `${employee.first_name} ${employee.last_name}`
            }
        });
    } catch (error) {
        cbLogger.error('Error in benefit selection submission', error, {
            employee_id,
            year,
            selections_count: selections.length
        });
        throw new Error(`Failed to submit benefit selections: ${error.message}`);
    }
});

// Original selectBenefits function (kept for backward compatibility)
const selectBenefits = submitBenefitSelections;

// ===================================================================
// BENEFIT PROCESSING AND APPROVAL
// ===================================================================

// POST /api/compensation-benefits/process - Process approved benefits for payment
const processBenefits = asyncHandler(async (req, res) => {
    const { selection_ids, processed_by } = req.body;

    if (!Array.isArray(selection_ids) || selection_ids.length === 0) {
        throw new ValidationError('Selection IDs array is required');
    }

    await executeTransaction(async (connection) => {
        const processedSelections = [];

        for (const selectionId of selection_ids) {
            try {
                // Get selection details
                const [selectionRows] = await connection.execute(`
                    SELECT 
                        ebs.*,
                        cbt.name as benefit_name,
                        e.first_name,
                        e.last_name,
                        e.employee_number
                    FROM employee_benefit_selections ebs
                    JOIN cb_benefit_types cbt ON ebs.benefit_type_id = cbt.id
                    JOIN employees e ON ebs.employee_id = e.id
                    WHERE ebs.id = ? AND ebs.status IN ('CALCULATED', 'APPROVED')
                `, [selectionId]);

                if (selectionRows.length === 0) {
                    cbLogger.error('Selection not found or not in processable status', {}, { 
                        selection_id: selectionId 
                    });
                    continue;
                }

                const selection = selectionRows[0];

                // Generate reference number
                const referenceNumber = `CB-${selection.year}-${selection.employee_number}-${String(selectionId).padStart(4, '0')}`;

                // Update selection status to APPROVED/PAID
                await connection.execute(`
                    UPDATE employee_benefit_selections 
                    SET status = 'APPROVED', 
                        processed_by = ?, 
                        processed_date = NOW(),
                        reference_number = ?
                    WHERE id = ?
                `, [processed_by || null, referenceNumber, selectionId]);

                processedSelections.push({
                    selection_id: selectionId,
                    employee_name: `${selection.first_name} ${selection.last_name}`,
                    benefit_name: selection.benefit_name,
                    amount: selection.actual_amount,
                    reference_number: referenceNumber
                });

            } catch (error) {
                cbLogger.error('Error processing benefit selection', error, { 
                    selection_id: selectionId 
                });
            }
        }

        res.json({
            success: true,
            data: {
                processed_count: processedSelections.length,
                processed_selections: processedSelections,
                total_amount: processedSelections.reduce((sum, ps) => sum + parseFloat(ps.amount), 0)
            },
            message: `Successfully processed ${processedSelections.length} benefit selections`
        });
    });
});

// ===================================================================
// BENEFIT QUERIES AND REPORTS
// ===================================================================

// GET /api/compensation-benefits/history/:id - Get employee benefit selection history
const getBenefitSelections = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year } = req.query; // Optional year filter

    let query = `
        SELECT 
            ebs.*,
            cbt.name as benefit_name,
            cbt.code as benefit_code,
            cbt.category,
            cbt.description,
            u.username as processed_by_name
        FROM employee_benefit_selections ebs
        JOIN cb_benefit_types cbt ON ebs.benefit_type_id = cbt.id
        LEFT JOIN users u ON ebs.processed_by = u.id
        WHERE ebs.employee_id = ?
    `;
    
    const queryParams = [id];
    
    if (year) {
        query += ' AND ebs.year = ?';
        queryParams.push(year);
    }
    
    query += ' ORDER BY ebs.year DESC, cbt.category, cbt.name';

    const result = await executeQuery(query, queryParams);

    if (!result.success) {
        throw new Error('Failed to fetch benefit selections');
    }

    const selections = result.data;
    const groupedByCategory = selections.reduce((acc, selection) => {
        if (!acc[selection.category]) {
            acc[selection.category] = [];
        }
        acc[selection.category].push(selection);
        return acc;
    }, {});

    res.json({
        success: true,
        data: {
            employee_id: parseInt(id),
            year: year ? parseInt(year) : null,
            total_records: selections.length,
            benefit_history: selections,
            selections_by_category: groupedByCategory,
            summary: {
                total_selections: selections.length,
                selected_count: selections.filter(s => s.is_selected).length,
                total_amount: selections.reduce((sum, s) => sum + parseFloat(s.actual_amount || 0), 0),
                pending_count: selections.filter(s => s.status === 'PENDING').length,
                approved_count: selections.filter(s => s.status === 'APPROVED').length,
                paid_count: selections.filter(s => s.status === 'PAID').length
            }
        }
    });
});

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

// Helper function to check benefit eligibility
const checkBenefitEligibility = async (employee, benefitType, year) => {
    const appointmentDate = new Date(employee.appointment_date);
    const yearStart = new Date(year, 0, 1);
    const currentDate = new Date();

    // Parse eligibility rules
    let eligibilityRules = {};
    try {
        eligibilityRules = benefitType.eligibility_rules ? JSON.parse(benefitType.eligibility_rules) : {};
    } catch (error) {
        eligibilityRules = {};
    }

    // Calculate service years and months
    const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();
    const serviceMonthsInYear = appointmentDate <= yearStart ? 12 : 12 - appointmentDate.getMonth();

    switch (benefitType.code) {
        case 'PBB': // Performance-Based Bonus
            const minServiceMonths = eligibilityRules.min_service_months || 4;
            if (serviceMonthsInYear < minServiceMonths) {
                return {
                    eligible: false,
                    reason: `Insufficient service months: ${serviceMonthsInYear} (minimum ${minServiceMonths} required)`,
                    details: { service_months: serviceMonthsInYear, required_months: minServiceMonths }
                };
            }
            break;

        case 'MYB': // 13th Month Pay
        case 'YEB': // 14th Month Pay
            if (serviceMonthsInYear < 1) {
                return {
                    eligible: false,
                    reason: 'Must have served at least 1 month in the year',
                    details: { service_months: serviceMonthsInYear }
                };
            }
            break;

        case 'LA': // Loyalty Award
            const minServiceYears = eligibilityRules.min_service_years || 10;
            if (serviceYears < minServiceYears) {
                return {
                    eligible: false,
                    reason: `Insufficient service years: ${serviceYears} (minimum ${minServiceYears} required)`,
                    details: { service_years: serviceYears, required_years: minServiceYears }
                };
            }
            break;

        case 'VLM': // Vacation Leave Monetization
        case 'SLM': // Sick Leave Monetization
            // Check leave balances (simplified - would need to query actual balances)
            const minBalance = eligibilityRules.min_balance || 30;
            // For now, assume eligible if employee is active
            if (employee.employment_status !== 'Active') {
                return {
                    eligible: false,
                    reason: 'Leave monetization only available for active employees',
                    details: { employment_status: employee.employment_status }
                };
            }
            break;
    }

    return {
        eligible: true,
        reason: null,
        details: {
            service_years: serviceYears,
            service_months_in_year: serviceMonthsInYear
        }
    };
};

// Helper function to calculate benefit amount
const calculateBenefitAmount = async (employee, benefitType, year) => {
    // Use Employee model utility to get consistent salary values
    const salaryData = Employee.getConsistentSalaryValues(employee);
    
    if (salaryData.monthlySalary <= 0) {
        cbLogger.warn('No valid salary data available for employee', {
            employee_id: employee.id,
            employee_number: employee.employee_number,
            current_monthly_salary: employee.current_monthly_salary,
            current_daily_rate: employee.current_daily_rate
        });
        
        // Return 0 for benefits calculation if no salary data
        // This prevents the .toFixed() error and allows the system to continue
        return 0;
    }
    
    const monthlySalary = salaryData.monthlySalary;

    cbLogger.info('Salary calculation for benefits', {
        employee_id: employee.id,
        original_monthly: employee.current_monthly_salary,
        original_daily: employee.current_daily_rate,
        calculated_monthly: monthlySalary,
        calculated_daily: salaryData.dailyRate
    });

    switch (benefitType.calculation_method) {
        case 'FIXED':
            return parseFloat(benefitType.base_amount || 0);

        case 'PERCENTAGE':
            const percentageRate = parseFloat(benefitType.percentage_rate) || 0;
            return parseFloat((monthlySalary * percentageRate).toFixed(2));

        case 'FORMULA':
            return await calculateFormulaAmount(employee, benefitType, year, monthlySalary);

        default:
            return 0;
    }
};

// Helper function to calculate formula-based amounts
const calculateFormulaAmount = async (employee, benefitType, year, monthlySalary) => {
    // Validate monthlySalary parameter
    if (isNaN(monthlySalary) || monthlySalary <= 0) {
        throw new Error('Invalid monthly salary provided for formula calculation');
    }

    const appointmentDate = new Date(employee.appointment_date);
    const currentDate = new Date();
    const serviceYears = currentDate.getFullYear() - appointmentDate.getFullYear();

    switch (benefitType.code) {
        case 'MYB': // 13th Month Pay
        case 'YEB': // 14th Month Pay
            // Calculate based on total salary received in the year (simplified)
            cbLogger.info('13th/14th month pay calculation', {
                employee_id: employee.id,
                code: benefitType.code,
                monthlySalary,
                result: parseFloat(monthlySalary.toFixed(2))
            });
            return parseFloat(monthlySalary.toFixed(2));

        case 'PBB': // Performance-Based Bonus
            // Typically equivalent to 1 month salary
            return parseFloat(monthlySalary.toFixed(2));

        case 'LA': // Loyalty Award
            const baseAmount = 10000; // First 10 years
            if (serviceYears <= 10) {
                return baseAmount;
            } else {
                const additionalFiveYearPeriods = Math.floor((serviceYears - 10) / 5);
                return baseAmount + (additionalFiveYearPeriods * 5000);
            }

        case 'VLM': // Vacation Leave Monetization
        case 'SLM': // Sick Leave Monetization
            // Calculate based on daily rate and available leave days (simplified)
            // Use the consistent 22-day rule: daily_rate = monthly_salary / 22
            const dailyRate = monthlySalary / 22;
            const estimatedLeaveDays = 29; // Maximum monetizable days
            return parseFloat((dailyRate * estimatedLeaveDays).toFixed(2));

        default:
            return 0;
    }
};

// GET /api/compensation-benefits/eligibility/:employee_id/:benefit_type_id - Check benefit eligibility
const checkEmployeeBenefitEligibility = asyncHandler(async (req, res) => {
    const { employee_id, benefit_type_id } = req.params;
    
    // Get employee details
    const employeeResult = await executeQuery(
        'SELECT * FROM employees WHERE id = ?',
        [employee_id]
    );
    
    if (!employeeResult.success || employeeResult.data.length === 0) {
        throw new NotFoundError('Employee not found');
    }
    
    // Get benefit type details
    const benefitResult = await executeQuery(
        'SELECT * FROM cb_benefit_types WHERE id = ?',
        [benefit_type_id]
    );
    
    if (!benefitResult.success || benefitResult.data.length === 0) {
        throw new NotFoundError('Benefit type not found');
    }
    
    const employee = employeeResult.data[0];
    const benefitType = benefitResult.data[0];
    const year = new Date().getFullYear();
    
    const eligibility = await checkBenefitEligibility(employee, benefitType, year);
    
    res.json({
        success: true,
        data: {
            employee_id: parseInt(id),
            benefit_type_id: parseInt(benefit_type_id),
            is_eligible: eligibility.eligible,
            eligibility_details: eligibility
        }
    });
});

module.exports = {
    getAvailableBenefits,
    selectBenefits,
    submitBenefitSelections,
    processBenefits,
    getBenefitSelections,
    checkEmployeeBenefitEligibility
};
