// utils/payrollValidation.js - Payroll validation engine
const PayrollPeriod = require('../models/Payroll/PayrollPeriod');
const PayrollItem = require('../models/Payroll/PayrollItem');

class PayrollValidationEngine {
    constructor() {
        this.validationRules = this.initializeValidationRules();
    }

    // Initialize validation rules
    initializeValidationRules() {
        return {
            payrollPeriod: {
                year: { min: 2020, max: 2050 },
                month: { min: 1, max: 12 },
                periodNumber: [1, 2],
                maxOverlapDays: 0
            },
            employee: {
                minDailyRate: 100,
                maxDailyRate: 10000,
                maxWorkingDays: 31
            }
        };
    }

    // Validate payroll period data
    async validatePayrollPeriod(periodData) {
        const errors = [];
        
        // Basic field validation
        if (!periodData.year || periodData.year < this.validationRules.payrollPeriod.year.min || 
            periodData.year > this.validationRules.payrollPeriod.year.max) {
            errors.push(`Year must be between ${this.validationRules.payrollPeriod.year.min} and ${this.validationRules.payrollPeriod.year.max}`);
        }

        if (!periodData.month || periodData.month < 1 || periodData.month > 12) {
            errors.push('Month must be between 1 and 12');
        }

        if (!periodData.period_number || !this.validationRules.payrollPeriod.periodNumber.includes(periodData.period_number)) {
            errors.push('Period number must be 1 or 2');
        }

        if (!periodData.start_date) {
            errors.push('Start date is required');
        }

        if (!periodData.end_date) {
            errors.push('End date is required');
        }

        // Date validation
        if (periodData.start_date && periodData.end_date) {
            const startDate = new Date(periodData.start_date);
            const endDate = new Date(periodData.end_date);
            
            if (startDate >= endDate) {
                errors.push('End date must be after start date');
            }

            // Check for overlapping periods
            if (periodData.year && periodData.month && periodData.period_number) {
                const overlap = await this.checkPeriodOverlap(periodData);
                if (!overlap.isValid) {
                    errors.push(...overlap.errors);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check for overlapping payroll periods
    async checkPeriodOverlap(periodData) {
        try {
            const existingPeriod = await PayrollPeriod.findByPeriod(
                periodData.year, 
                periodData.month, 
                periodData.period_number
            );

            if (existingPeriod.success && existingPeriod.data && 
                existingPeriod.data.id !== periodData.id) {
                return {
                    isValid: false,
                    errors: ['A payroll period already exists for this year, month, and period number']
                };
            }

            return { isValid: true, errors: [] };
        } catch (error) {
            return {
                isValid: false,
                errors: ['Failed to validate period overlap']
            };
        }
    }

    // Validate period can be finalized
    async validatePeriodFinalization(periodId) {
        const errors = [];

        try {
            // Get period
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                errors.push('Payroll period not found');
                return { isValid: false, errors };
            }

            const period = periodResult.data;

            // Check status
            if (!period.canFinalize()) {
                errors.push(`Cannot finalize period with status: ${period.status}`);
            }

            // Check if all payroll items are processed
            const itemsResult = await PayrollItem.findByPeriod(periodId);
            if (itemsResult.success) {
                const draftItems = itemsResult.data.filter(item => item.status === 'draft');
                if (draftItems.length > 0) {
                    errors.push(`${draftItems.length} employees still have draft payroll items`);
                }
            }

        } catch (error) {
            errors.push('Failed to validate period finalization');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate bulk payroll processing
    async validateBulkPayroll(employees, workingDaysData) {
        const errors = [];

        if (!employees || employees.length === 0) {
            errors.push('No employees provided for processing');
            return { isValid: false, errors };
        }

        // Validate each employee
        for (const employee of employees) {
            const empErrors = this.validateEmployeeForPayroll(employee, workingDaysData[employee.id]);
            if (empErrors.length > 0) {
                errors.push(`Employee ${employee.first_name} ${employee.last_name}: ${empErrors.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate individual employee for payroll
    validateEmployeeForPayroll(employee, workingDaysInfo) {
        const errors = [];

        if (!employee.id) {
            errors.push('Invalid employee ID');
        }

        if (!employee.current_daily_rate || employee.current_daily_rate < this.validationRules.employee.minDailyRate) {
            errors.push(`Daily rate too low (minimum: ₱${this.validationRules.employee.minDailyRate})`);
        }

        if (employee.current_daily_rate > this.validationRules.employee.maxDailyRate) {
            errors.push(`Daily rate too high (maximum: ₱${this.validationRules.employee.maxDailyRate})`);
        }

        if (employee.employment_status !== 'Active') {
            errors.push('Employee is not active');
        }

        // Validate working days
        if (workingDaysInfo && workingDaysInfo.working_days) {
            const workingDays = workingDaysInfo.working_days;
            if (workingDays < 0 || workingDays > this.validationRules.employee.maxWorkingDays) {
                errors.push(`Invalid working days: ${workingDays} (must be 0-${this.validationRules.employee.maxWorkingDays})`);
            }
        }

        return errors;
    }

    // Validate payroll calculation data
    validateCalculationData(calculationData) {
        const errors = [];
        const warnings = [];

        if (!calculationData.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!calculationData.period_id) {
            errors.push('Period ID is required');
        }

        if (calculationData.basic_pay < 0) {
            errors.push('Basic pay cannot be negative');
        }

        if (calculationData.total_allowances < 0) {
            errors.push('Total allowances cannot be negative');
        }

        if (calculationData.total_deductions < 0) {
            errors.push('Total deductions cannot be negative');
        }

        if (calculationData.net_pay < 0) {
            warnings.push('Net pay is negative');
        }

        // Validate calculation logic
        const expectedGrossPay = calculationData.basic_pay + calculationData.total_allowances;
        if (Math.abs(calculationData.gross_pay - expectedGrossPay) > 0.01) {
            errors.push('Gross pay calculation mismatch');
        }

        const expectedNetPay = calculationData.gross_pay - calculationData.total_deductions;
        if (Math.abs(calculationData.net_pay - expectedNetPay) > 0.01) {
            errors.push('Net pay calculation mismatch');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate allowance/deduction amounts
    validateAmount(amount, type = 'allowance') {
        const errors = [];

        if (typeof amount !== 'number' || isNaN(amount)) {
            errors.push(`${type} amount must be a valid number`);
            return { isValid: false, errors };
        }

        if (amount < 0) {
            errors.push(`${type} amount cannot be negative`);
        }

        // Set reasonable limits
        const maxAmount = type === 'allowance' ? 100000 : 50000;
        if (amount > maxAmount) {
            errors.push(`${type} amount exceeds maximum limit of ₱${maxAmount.toLocaleString()}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate date ranges
    validateDateRange(startDate, endDate) {
        const errors = [];

        if (!startDate || !endDate) {
            errors.push('Both start and end dates are required');
            return { isValid: false, errors };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            errors.push('Invalid date format');
            return { isValid: false, errors };
        }

        if (start >= end) {
            errors.push('End date must be after start date');
        }

        // Check for reasonable date range (not more than 2 months)
        const maxDays = 62;
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > maxDays) {
            errors.push(`Date range too long (maximum: ${maxDays} days)`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = PayrollValidationEngine;