// utils/payrollCalculations.js - Enhanced Payroll Calculation Utilities
const { executeQuery } = require('../config/database');
const moment = require('moment');

/**
 * Enhanced Government Deductions Calculator
 * Includes accurate contribution rates and tax brackets
 */
class GovernmentDeductionsCalculator {

    // GSIS Contribution based on salary grade and step (2025 rates)
    static getGSISContribution(monthlySalary, salaryGrade, stepIncrement) {
        // GSIS PC Fund - Employee share (9%)
        const employeeShare = monthlySalary * 0.09;

        // GSIS MPL/GP Fund (Employee Contribution)
        let mpliContribution = 0;
        if (monthlySalary <= 1000) {
            mpliContribution = 10.00;
        } else if (monthlySalary > 1000 && monthlySalary <= 1500) {
            mpliContribution = 10.00 + ((monthlySalary - 1000) * 0.01);
        } else {
            mpliContribution = 10.00 + 5.00 + ((monthlySalary - 1500) * 0.02);
        }

        return {
            employeePC: parseFloat(employeeShare.toFixed(2)),
            employeeMPLI: parseFloat(mpliContribution.toFixed(2)),
            totalGSIS: parseFloat((employeeShare + mpliContribution).toFixed(2))
        };
    }

    // Pag-IBIG contribution (2025 rates)
    static getPagibigContribution(monthlySalary) {
        // Optional: 1% minimum or 2% maximum
        const contribution = Math.min(monthlySalary * 0.02, 100); // Max 100 pesos
        return parseFloat(contribution.toFixed(2));
    }

    // PhilHealth contribution (2025 premiums)
    static getPhilhealthContribution(monthlySalary) {
        let premium = 0;

        if (monthlySalary <= 10000) {
            premium = 200; // Minimum
        } else if (monthlySalary <= 40000) {
            premium = monthlySalary * 0.025; // 2.25%
        } else if (monthlySalary <= 60000) {
            premium = monthlySalary * 0.025; // 2.25%
        } else if (monthlySalary <= 70000) {
            premium = monthlySalary * 0.0225; // 2.25%
        } else {
            premium = 1575; // Maximum
        }

        return parseFloat(premium.toFixed(2));
    }

    // Enhanced BIR Tax Calculator with proper brackets (2025 rates)
    static getBIRTax(monthlySalary, taxableIncome, isMonthlyFiling = true) {
        if (isMonthlyFiling) {
            return this.getMonthlyTaxWithholding(monthlySalary);
        } else {
            return this.getAnnualTaxComputation(taxableIncome);
        }
    }

    // Monthly withholding tax (BIR RMC 5-2025)
    static getMonthlyTaxWithholding(monthlySalary) {
        let tax = 0;
        let excess = 0;

        if (monthlySalary <= 20833) {
            tax = 0;
        } else if (monthlySalary <= 33333) {
            excess = monthlySalary - 20833;
            tax = excess * 0.15; // 15%
        } else if (monthlySalary <= 66667) {
            excess = monthlySalary - 33333;
            tax = 937.50 + (excess * 0.20); // 20%
        } else if (monthlySalary <= 166667) {
            excess = monthlySalary - 66667;
            tax = 9375.00 + (excess * 0.25); // 25%
        } else if (monthlySalary <= 666667) {
            excess = monthlySalary - 166667;
            tax = 35624.98 + (excess * 0.30); // 30%
        } else {
            excess = monthlySalary - 666667;
            tax = 183749.98 + (excess * 0.35); // 35%
        }

        return parseFloat(tax.toFixed(2));
    }

    // Annual tax computation for year-end adjustments
    static getAnnualTaxComputation(annualTaxableIncome) {
        const monthlyTax = this.getMonthlyTaxWithholding(annualTaxableIncome / 12);
        return monthlyTax * 12;
    }

    // Calculate all government deductions with error handling
    static calculateAllDeductions(monthlySalary, salaryGrade = null, stepIncrement = null) {
        try {
            if (!monthlySalary || monthlySalary < 0) {
                throw new Error('Invalid monthly salary for deductions calculation');
            }

            const gsis = this.getGSISContribution(monthlySalary, salaryGrade, stepIncrement);
            const pagibig = this.getPagibigContribution(monthlySalary);
            const philhealth = this.getPhilhealthContribution(monthlySalary);
            const tax = this.getBIRTax(monthlySalary);

            const totalDeductions = gsis.totalGSIS + pagibig + philhealth + tax;

            return {
                gsis: parseFloat(gsis.totalGSIS.toFixed(2)),
                pagibig: parseFloat(pagibig.toFixed(2)),
                philhealth: parseFloat(philhealth.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                totalDeductions: parseFloat(totalDeductions.toFixed(2)),
                calculation_details: {
                    gsis_breakdown: gsis,
                    monthly_salary: monthlySalary,
                    salary_grade: salaryGrade,
                    step_increment: stepIncrement
                }
            };
        } catch (error) {
            console.error('Error calculating government deductions:', error);
            // Return zero deductions with error flag
            return {
                gsis: 0,
                pagibig: 0,
                philhealth: 0,
                tax: 0,
                totalDeductions: 0,
                error: error.message,
                calculation_details: null
            };
        }
    }
}

/**
 * Prorated Salary Calculator
 * Handles mid-month starts, separations, and adjustments
 */
class ProratedSalaryCalculator {

    static calculateProratedSalary(employee, periodStartDate, periodEndDate) {
        const appointmentDate = new Date(employee.appointment_date);
        const separationDate = employee.separation_date ? new Date(employee.separation_date) : null;
        const periodStart = new Date(periodStartDate);
        const periodEnd = new Date(periodEndDate);

        // Calculate working days in period considering appointment/separation
        const workingDays = this.calculateWorkingDaysInPeriod(
            periodStart, periodEnd, appointmentDate, separationDate
        );

        const baseDays = this.getDaysDifference(periodStart, periodEnd) + 1;
        const proratedDays = Math.min(workingDays, 22); // Max 22 days per month

        const dailyRate = employee.current_daily_rate || (employee.current_monthly_salary / 22);
        const proratedSalary = dailyRate * proratedDays;

        return {
            baseDays,
            proratedDays,
            dailyRate: parseFloat(dailyRate.toFixed(2)),
            proratedSalary: parseFloat(proratedSalary.toFixed(2)),
            adjustmentReason: this.getAdjustmentReason(employee, periodStart, periodEnd)
        };
    }

    static calculateWorkingDaysInPeriod(startDate, endDate, appointmentDate, separationDate) {
        let workingDays = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Count working days (Monday-Friday)
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                // Check if employee was active on this date
                if (currentDate >= appointmentDate &&
                    (!separationDate || currentDate <= separationDate)) {
                    workingDays++;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return Math.min(workingDays, 22); // Cap at 22 days
    }

    static getDaysDifference(startDate, endDate) {
        return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    static getAdjustmentReason(employee, periodStart, periodEnd) {
        const appointmentDate = new Date(employee.appointment_date);
        const separationDate = employee.separation_date ? new Date(employee.separation_date) : null;

        if (appointmentDate > periodStart && appointmentDate <= periodEnd) {
            return `Prorated for late start (appointment: ${appointmentDate.toISOString().split('T')[0]})`;
        }

        if (separationDate && separationDate >= periodStart && separationDate < periodEnd) {
            return `Prorated for early separation (separation: ${separationDate.toISOString().split('T')[0]})`;
        }

        return null;
    }
}

/**
 * Step Increment Processor
 * Handles automatic salary increases every 3 years
 */
class StepIncrementProcessor {

    static async checkAndProcessStepIncrements(year, month) {
        const employees = await this.getEligibleEmployeesForIncrement(year, month);

        const results = [];
        for (const employee of employees) {
            try {
                const incrementResult = await this.processEmployeeIncrement(employee, year, month);
                results.push(incrementResult);
            } catch (error) {
                console.error(`Error processing increment for employee ${employee.employee_number}:`, error);
            }
        }

        return {
            processed: results.filter(r => r.success),
            errors: results.filter(r => !r.success),
            totalEmployees: employees.length
        };
    }

    static async getEligibleEmployeesForIncrement(year, month) {
        // Get employees due for step increment (every 3 years)
        const query = `
            SELECT e.*, sg.grade, sg.step_1, sg.step_2, sg.step_3, sg.step_4,
                   sg.step_5, sg.step_6, sg.step_7, sg.step_8
            FROM employees e
            LEFT JOIN salary_grades sg ON e.salary_grade = sg.grade
            WHERE e.employment_status = 'Active'
                AND e.appointment_date <= ?
                AND MOD(TIMESTAMPDIFF(YEAR, e.appointment_date, ?), 3) = 0
                AND MONTH(e.appointment_date) = ?
        `;

        const eligibilityDate = `${year}-${String(month).padStart(2, '0')}-01`;

        const result = await executeQuery(query, [eligibilityDate.replace('-01', '-31'), eligibilityDate, month]);
        return result.success ? result.data : [];
    }

    static async processEmployeeIncrement(employee, year, month) {
        // Calculate new step increment
        const currentStep = employee.step_increment || 1;
        const newStep = Math.min(currentStep + 1, 8); // Max step 8

        if (currentStep >= 8) {
            return { success: false, reason: 'At maximum step increment', employee_id: employee.id };
        }

        // Get new salary amount based on grade and step
        const newSalary = employee[`step_${newStep}`];

        if (!newSalary) {
            return { success: false, reason: 'New salary amount not found', employee_id: employee.id };
        }

        // Update employee salary and step
        const updateQuery = `
            UPDATE employees
            SET current_monthly_salary = ?, step_increment = ?
            WHERE id = ?
        `;

        const updateResult = await executeQuery(updateQuery, [newSalary, newStep, employee.id]);

        if (updateResult.success) {
            return {
                success: true,
                employee_id: employee.id,
                old_step: currentStep,
                new_step: newStep,
                old_salary: employee.current_monthly_salary,
                new_salary: newSalary
            };
        } else {
            return { success: false, reason: 'Database update failed', employee_id: employee.id };
        }
    }
}

module.exports = {
    GovernmentDeductionsCalculator,
    ProratedSalaryCalculator,
    StepIncrementProcessor
};
