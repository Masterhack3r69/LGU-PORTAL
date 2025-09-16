// controllers/benefitsController.js - Employee Benefits Management
const { executeQuery, executeTransaction } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// GET /api/benefits/employee/:id - Get employee benefits summary
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

// POST /api/benefits/calculate - Calculate benefits for employee
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
            const calculation = await calculateThirteenthMonthPay(employee_id, year);
            calculatedAmount = calculation.amount;
            eligibilityCheck = calculation.eligibility;
            break;

        case 'fourteenth_month':
            const calc14th = await calculateFourteenthMonthPay(employee_id, year);
            calculatedAmount = calc14th.amount;
            eligibilityCheck = calc14th.eligibility;
            break;

        case 'pbb':
            const pbbCalc = await calculatePBB(employee_id, year);
            calculatedAmount = pbbCalc.amount;
            eligibilityCheck = pbbCalc.eligibility;
            break;

        case 'loyalty_award':
            const loyaltyCalc = await calculateLoyaltyAward(employee);
            calculatedAmount = loyaltyCalc.amount;
            eligibilityCheck = loyaltyCalc.eligibility;
            break;

        case 'leave_monetization':
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

// Helper function to calculate 13th month pay
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

// Helper function to calculate 14th month pay
const calculateFourteenthMonthPay = async (employeeId, year) => {
    // Check if 14th month pay is applicable (usually same as 13th month)
    const thirteenthMonth = await calculateThirteenthMonthPay(employeeId, year);
    
    return {
        amount: thirteenthMonth.amount,
        eligibility: thirteenthMonth.eligibility
    };
};

// Helper function to calculate Performance-Based Bonus (PBB)
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

// Helper function to calculate loyalty award
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

// GET /api/benefits/types - Get benefit types
const getBenefitTypes = asyncHandler(async (req, res) => {
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

// POST /api/benefits/loyalty-award - Calculate and process loyalty award
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

// GET /api/benefits/summary/:year - Get benefits summary report
const getBenefitsSummary = asyncHandler(async (req, res) => {
    const { year } = req.params;
    const { department, benefit_type } = req.query;

    let whereConditions = ['ec.year = ?'];
    let queryParams = [year];

    if (department) {
        whereConditions.push('e.department = ?');
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

// Helper function to calculate leave monetization potential
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
    getEmployeeBenefits,
    calculateBenefits,
    getBenefitTypes,
    processLoyaltyAward,
    getBenefitsSummary
};