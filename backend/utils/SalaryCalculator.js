// utils/SalaryCalculator.js - Basic Salary and Daily Rate Calculator
// Handles salary calculations with attendance proration and LWOP

/**
 * SalaryCalculator - Calculates basic salary with attendance considerations
 * Implements the 22-day rule for government employees
 */
class SalaryCalculator {
    constructor() {
        // Standard working days per month (government standard)
        this.standardWorkingDays = 22;
    }

    /**
     * Calculate basic salary prorated by attendance
     * Formula: (Monthly Salary / Working Days) × Days Present
     * @param {number} monthlySalary - Employee's monthly salary
     * @param {number} workingDays - Total working days in the period
     * @param {number} daysPresent - Number of days employee was present
     * @returns {Object} - { amount, basis, dailyRate, prorationFactor }
     */
    calculateBasicSalary(monthlySalary, workingDays, daysPresent) {
        try {
            // Validate inputs
            const validation = this.validateSalaryInputs(monthlySalary, workingDays, daysPresent);
            if (!validation.isValid) {
                return {
                    amount: 0,
                    basis: `Validation errors: ${validation.errors.join(', ')}`,
                    dailyRate: 0,
                    prorationFactor: 0,
                    errors: validation.errors
                };
            }

            // Handle zero working days
            if (workingDays === 0) {
                return {
                    amount: 0,
                    basis: 'No working days in period',
                    dailyRate: 0,
                    prorationFactor: 0,
                    monthlySalary: monthlySalary
                };
            }

            // Calculate daily rate
            const dailyRate = monthlySalary / workingDays;

            // Calculate basic salary
            const amount = dailyRate * daysPresent;

            // Calculate proration factor
            const prorationFactor = daysPresent / workingDays;

            // Build basis string
            let basis = '';
            if (daysPresent === workingDays) {
                basis = `Full salary: ₱${monthlySalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${daysPresent}/${workingDays} days)`;
            } else {
                basis = `Prorated salary: ₱${monthlySalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${workingDays} days × ${daysPresent} days = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                dailyRate: parseFloat(dailyRate.toFixed(2)),
                prorationFactor: parseFloat(prorationFactor.toFixed(4)),
                monthlySalary: parseFloat(monthlySalary.toFixed(2)),
                workingDays: workingDays,
                daysPresent: daysPresent,
                warnings: validation.warnings
            };

        } catch (error) {
            console.error('Basic salary calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                dailyRate: 0,
                prorationFactor: 0,
                error: error.message
            };
        }
    }

    /**
     * Calculate daily rate from monthly salary
     * Formula: Monthly Salary / 22 (standard government working days)
     * @param {number} monthlySalary - Employee's monthly salary
     * @returns {Object} - { dailyRate, basis, monthlySalary }
     */
    calculateDailyRate(monthlySalary) {
        try {
            // Validate input
            if (monthlySalary === null || monthlySalary === undefined) {
                return {
                    dailyRate: 0,
                    basis: 'Monthly salary is required',
                    monthlySalary: 0,
                    error: 'Invalid monthly salary'
                };
            }

            if (typeof monthlySalary !== 'number' || monthlySalary < 0) {
                return {
                    dailyRate: 0,
                    basis: 'Invalid monthly salary value',
                    monthlySalary: 0,
                    error: 'Monthly salary must be a non-negative number'
                };
            }

            if (monthlySalary === 0) {
                return {
                    dailyRate: 0,
                    basis: 'Monthly salary is zero',
                    monthlySalary: 0
                };
            }

            // Calculate daily rate using 22-day rule
            const dailyRate = monthlySalary / this.standardWorkingDays;

            // Build basis string
            const basis = `₱${monthlySalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${this.standardWorkingDays} days = ₱${dailyRate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return {
                dailyRate: parseFloat(dailyRate.toFixed(2)),
                basis: basis,
                monthlySalary: parseFloat(monthlySalary.toFixed(2)),
                standardWorkingDays: this.standardWorkingDays
            };

        } catch (error) {
            console.error('Daily rate calculation error:', error);
            return {
                dailyRate: 0,
                basis: `Error: ${error.message}`,
                monthlySalary: 0,
                error: error.message
            };
        }
    }

    /**
     * Apply LWOP (Leave Without Pay) deduction to basic salary
     * Formula: Basic Salary - (LWOP Days × Daily Rate)
     * @param {number} basicSalary - Calculated basic salary before LWOP
     * @param {number} lwopDays - Number of LWOP days
     * @param {number} dailyRate - Employee's daily rate
     * @returns {Object} - { amount, basis, lwopDeduction, adjustedSalary }
     */
    applyLWOP(basicSalary, lwopDays, dailyRate) {
        try {
            // Validate inputs
            if (basicSalary === null || basicSalary === undefined || basicSalary < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid basic salary',
                    lwopDeduction: 0,
                    adjustedSalary: 0,
                    error: 'Invalid basic salary value'
                };
            }

            if (lwopDays === null || lwopDays === undefined || lwopDays < 0) {
                return {
                    amount: basicSalary,
                    basis: 'Invalid LWOP days - no deduction applied',
                    lwopDeduction: 0,
                    adjustedSalary: basicSalary,
                    error: 'Invalid LWOP days value'
                };
            }

            if (dailyRate === null || dailyRate === undefined || dailyRate < 0) {
                return {
                    amount: basicSalary,
                    basis: 'Invalid daily rate - no deduction applied',
                    lwopDeduction: 0,
                    adjustedSalary: basicSalary,
                    error: 'Invalid daily rate value'
                };
            }

            // No LWOP days - return original salary
            if (lwopDays === 0) {
                return {
                    amount: parseFloat(basicSalary.toFixed(2)),
                    basis: 'No LWOP days',
                    lwopDeduction: 0,
                    adjustedSalary: parseFloat(basicSalary.toFixed(2)),
                    basicSalary: parseFloat(basicSalary.toFixed(2)),
                    lwopDays: 0,
                    dailyRate: parseFloat(dailyRate.toFixed(2))
                };
            }

            // Calculate LWOP deduction
            const lwopDeduction = lwopDays * dailyRate;

            // Calculate adjusted salary (cannot be negative)
            const adjustedSalary = Math.max(0, basicSalary - lwopDeduction);

            // Build basis string
            const basis = `Basic salary: ₱${basicSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ` +
                         `LWOP deduction: (${lwopDays} days × ₱${dailyRate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) = ` +
                         `₱${adjustedSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const warnings = [];
            if (adjustedSalary === 0 && basicSalary > 0) {
                warnings.push('LWOP deduction resulted in zero salary');
            }
            if (lwopDeduction > basicSalary) {
                warnings.push('LWOP deduction exceeds basic salary - salary capped at zero');
            }

            return {
                amount: parseFloat(adjustedSalary.toFixed(2)),
                basis: basis,
                lwopDeduction: parseFloat(lwopDeduction.toFixed(2)),
                adjustedSalary: parseFloat(adjustedSalary.toFixed(2)),
                basicSalary: parseFloat(basicSalary.toFixed(2)),
                lwopDays: lwopDays,
                dailyRate: parseFloat(dailyRate.toFixed(2)),
                warnings: warnings
            };

        } catch (error) {
            console.error('LWOP application error:', error);
            return {
                amount: basicSalary,
                basis: `Error: ${error.message}`,
                lwopDeduction: 0,
                adjustedSalary: basicSalary,
                error: error.message
            };
        }
    }

    /**
     * Handle partial month scenarios (newly hired or separated employees)
     * Calculates prorated salary based on actual days worked in the month
     * @param {number} monthlySalary - Employee's monthly salary
     * @param {Date} startDate - Start date of employment or period
     * @param {Date} endDate - End date of employment or period
     * @param {number} totalWorkingDays - Total working days in the full month
     * @returns {Object} - { amount, basis, actualWorkingDays, prorationFactor }
     */
    handlePartialMonth(monthlySalary, startDate, endDate, totalWorkingDays) {
        try {
            // Validate inputs
            if (!startDate || !endDate) {
                return {
                    amount: 0,
                    basis: 'Invalid date range',
                    actualWorkingDays: 0,
                    prorationFactor: 0,
                    error: 'Start date and end date are required'
                };
            }

            if (monthlySalary === null || monthlySalary === undefined || monthlySalary < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid monthly salary',
                    actualWorkingDays: 0,
                    prorationFactor: 0,
                    error: 'Invalid monthly salary value'
                };
            }

            // Convert to Date objects if strings
            const start = startDate instanceof Date ? startDate : new Date(startDate);
            const end = endDate instanceof Date ? endDate : new Date(endDate);

            // Calculate actual working days (excluding weekends)
            let actualWorkingDays = 0;
            const currentDate = new Date(start);

            while (currentDate <= end) {
                const dayOfWeek = currentDate.getDay();
                // Count weekdays only (Monday = 1, Friday = 5)
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    actualWorkingDays++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Use provided total working days or standard
            const workingDaysInMonth = totalWorkingDays || this.standardWorkingDays;

            // Calculate prorated salary
            const prorationFactor = actualWorkingDays / workingDaysInMonth;
            const amount = monthlySalary * prorationFactor;

            // Build basis string
            const basis = `Partial month: ₱${monthlySalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${actualWorkingDays}/${workingDaysInMonth} days ` +
                         `(${start.toLocaleDateString()} to ${end.toLocaleDateString()}) = ` +
                         `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                actualWorkingDays: actualWorkingDays,
                prorationFactor: parseFloat(prorationFactor.toFixed(4)),
                monthlySalary: parseFloat(monthlySalary.toFixed(2)),
                startDate: start,
                endDate: end,
                totalWorkingDays: workingDaysInMonth
            };

        } catch (error) {
            console.error('Partial month calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                actualWorkingDays: 0,
                prorationFactor: 0,
                error: error.message
            };
        }
    }

    /**
     * Validate salary calculation inputs
     * @param {number} monthlySalary - Monthly salary to validate
     * @param {number} workingDays - Working days to validate
     * @param {number} daysPresent - Days present to validate
     * @returns {Object} - { isValid, errors, warnings }
     */
    validateSalaryInputs(monthlySalary, workingDays, daysPresent) {
        const errors = [];
        const warnings = [];

        // Validate monthly salary
        if (monthlySalary === null || monthlySalary === undefined) {
            errors.push('Monthly salary is required');
        } else if (typeof monthlySalary !== 'number') {
            errors.push('Monthly salary must be a number');
        } else if (monthlySalary < 0) {
            errors.push('Monthly salary cannot be negative');
        } else if (monthlySalary === 0) {
            warnings.push('Monthly salary is zero');
        }

        // Validate working days
        if (workingDays === null || workingDays === undefined) {
            errors.push('Working days is required');
        } else if (typeof workingDays !== 'number') {
            errors.push('Working days must be a number');
        } else if (workingDays < 0) {
            errors.push('Working days cannot be negative');
        } else if (workingDays === 0) {
            warnings.push('Working days is zero');
        } else if (workingDays > 31) {
            warnings.push('Working days exceeds maximum days in a month');
        }

        // Validate days present
        if (daysPresent === null || daysPresent === undefined) {
            errors.push('Days present is required');
        } else if (typeof daysPresent !== 'number') {
            errors.push('Days present must be a number');
        } else if (daysPresent < 0) {
            errors.push('Days present cannot be negative');
        } else if (daysPresent === 0) {
            warnings.push('Days present is zero - salary will be zero');
        }

        // Cross-validation
        if (workingDays > 0 && daysPresent > workingDays) {
            warnings.push('Days present exceeds working days');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Get standard working days
     * @returns {number} - Standard working days (22)
     */
    getStandardWorkingDays() {
        return this.standardWorkingDays;
    }
}

module.exports = SalaryCalculator;
