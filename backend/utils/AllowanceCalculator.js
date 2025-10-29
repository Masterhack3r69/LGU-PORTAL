// utils/AllowanceCalculator.js - Government Allowances Calculator
// Handles PERA, RATA, Hazard Pay, Subsistence, and Laundry allowances

/**
 * AllowanceCalculator - Calculates government employee allowances
 * Based on Philippine LGU compensation standards
 */
class AllowanceCalculator {
    constructor() {
        // PERA (Personnel Economic Relief Allowance) - Fixed monthly amount
        this.peraConfig = {
            monthlyAmount: 2000,           // ₱2,000 per month fixed
            standardWorkingDays: 22        // Standard working days for proration
        };

        // Hazard Pay rates by department
        this.hazardPayConfig = {
            healthWorkers: {
                rate: 0.25,                // 25% of basic salary
                departments: ['RHU', 'HEALTH', 'RURAL HEALTH UNIT']
            },
            socialWorkers: {
                rate: 0.20,                // 20% of basic salary
                departments: ['MSWD', 'SOCIAL WELFARE']
            }
        };

        // Subsistence Allowance
        this.subsistenceConfig = {
            dailyRate: 50                  // ₱50 per day
        };

        // Laundry Allowance
        this.laundryConfig = {
            dailyRate: 6.818               // ₱6.818 per day
        };
    }

    /**
     * Calculate PERA (Personnel Economic Relief Allowance)
     * Formula: ₱2,000 prorated by attendance
     * @param {number} daysPresent - Number of days employee was present
     * @param {number} workingDays - Total working days in the period
     * @returns {Object} - { amount, basis, monthlyAmount, prorationFactor }
     */
    calculatePERA(daysPresent, workingDays = null) {
        try {
            // Handle edge cases
            if (daysPresent === null || daysPresent === undefined || daysPresent < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid days present',
                    monthlyAmount: this.peraConfig.monthlyAmount,
                    prorationFactor: 0,
                    error: 'Invalid days present value'
                };
            }

            // Use standard working days if not provided
            const totalWorkingDays = workingDays || this.peraConfig.standardWorkingDays;

            if (totalWorkingDays <= 0) {
                return {
                    amount: 0,
                    basis: 'Invalid working days',
                    monthlyAmount: this.peraConfig.monthlyAmount,
                    prorationFactor: 0,
                    error: 'Working days must be greater than zero'
                };
            }

            // Calculate proration factor
            const prorationFactor = daysPresent / totalWorkingDays;

            // Calculate prorated PERA
            const amount = this.peraConfig.monthlyAmount * prorationFactor;

            // Build basis string
            let basis = '';
            if (daysPresent >= totalWorkingDays) {
                basis = `Full PERA: ₱${this.peraConfig.monthlyAmount.toLocaleString()} (${daysPresent}/${totalWorkingDays} days)`;
            } else {
                basis = `Prorated PERA: ₱${this.peraConfig.monthlyAmount.toLocaleString()} × ${daysPresent}/${totalWorkingDays} days = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                monthlyAmount: this.peraConfig.monthlyAmount,
                prorationFactor: parseFloat(prorationFactor.toFixed(4)),
                daysPresent: daysPresent,
                workingDays: totalWorkingDays
            };

        } catch (error) {
            console.error('PERA calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                monthlyAmount: this.peraConfig.monthlyAmount,
                prorationFactor: 0,
                error: error.message
            };
        }
    }

    /**
     * Calculate RATA (Representation and Transportation Allowance)
     * Position-based allowance with attendance consideration
     * @param {Object} employee - Employee object with position and department info
     * @param {Object} period - Payroll period information
     * @param {Object} attendance - Attendance data { daysPresent, workingDays, sessionsAttended, totalSessions }
     * @returns {Object} - { amount, basis, rataType, calculationMethod }
     */
    calculateRATA(employee, period, attendance) {
        try {
            // Validate inputs
            if (!employee || !attendance) {
                return {
                    amount: 0,
                    basis: 'Missing employee or attendance data',
                    rataType: 'None',
                    calculationMethod: 'N/A',
                    error: 'Invalid input parameters'
                };
            }

            // Get employee's monthly RATA from position or employee record
            const monthlyRATA = employee.monthly_rata || employee.rata_amount || 0;

            if (monthlyRATA === 0) {
                return {
                    amount: 0,
                    basis: 'No RATA assigned to this position',
                    rataType: 'None',
                    calculationMethod: 'N/A',
                    monthlyRATA: 0
                };
            }

            // Determine calculation method based on employee type
            const isSBMember = this.isSangguniangBayanMember(employee);
            
            let amount = 0;
            let basis = '';
            let calculationMethod = '';

            if (isSBMember) {
                // SB Members: RATA based on sessions attended
                const sessionsAttended = attendance.sessionsAttended || 0;
                const totalSessions = attendance.totalSessions || 1;

                if (totalSessions === 0) {
                    return {
                        amount: 0,
                        basis: 'No sessions scheduled for this period',
                        rataType: 'SB Member',
                        calculationMethod: 'Session-based',
                        monthlyRATA: monthlyRATA
                    };
                }

                amount = (monthlyRATA / totalSessions) * sessionsAttended;
                basis = `SB RATA: ₱${monthlyRATA.toLocaleString()} / ${totalSessions} sessions × ${sessionsAttended} attended = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                calculationMethod = 'Session-based';

            } else {
                // Executive employees: RATA based on working days
                const daysPresent = attendance.daysPresent || 0;
                const workingDays = attendance.workingDays || this.peraConfig.standardWorkingDays;

                if (workingDays === 0) {
                    return {
                        amount: 0,
                        basis: 'No working days in period',
                        rataType: 'Executive',
                        calculationMethod: 'Days-based',
                        monthlyRATA: monthlyRATA
                    };
                }

                amount = (monthlyRATA / workingDays) * daysPresent;
                basis = `Executive RATA: ₱${monthlyRATA.toLocaleString()} / ${workingDays} days × ${daysPresent} days present = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                calculationMethod = 'Days-based';
            }

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                rataType: isSBMember ? 'SB Member' : 'Executive',
                calculationMethod: calculationMethod,
                monthlyRATA: monthlyRATA,
                attendance: attendance
            };

        } catch (error) {
            console.error('RATA calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                rataType: 'Unknown',
                calculationMethod: 'Error',
                error: error.message
            };
        }
    }

    /**
     * Calculate Hazard Pay for eligible employees
     * 20-25% of basic salary based on department
     * @param {Object} employee - Employee object with department info
     * @param {number} daysWorked - Number of days worked
     * @returns {Object} - { amount, basis, rate, isEligible }
     */
    calculateHazardPay(employee, daysWorked) {
        try {
            // Validate inputs
            if (!employee) {
                return {
                    amount: 0,
                    basis: 'Missing employee data',
                    rate: 0,
                    isEligible: false,
                    error: 'Invalid employee parameter'
                };
            }

            if (daysWorked === null || daysWorked === undefined || daysWorked < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid days worked',
                    rate: 0,
                    isEligible: false,
                    error: 'Invalid days worked value'
                };
            }

            // Determine eligibility and rate based on department
            const department = (employee.department || '').toUpperCase();
            let rate = 0;
            let workerType = '';
            let isEligible = false;

            // Check if health worker (25%)
            if (this.hazardPayConfig.healthWorkers.departments.some(dept => department.includes(dept))) {
                rate = this.hazardPayConfig.healthWorkers.rate;
                workerType = 'Health Worker';
                isEligible = true;
            }
            // Check if social worker (20%)
            else if (this.hazardPayConfig.socialWorkers.departments.some(dept => department.includes(dept))) {
                rate = this.hazardPayConfig.socialWorkers.rate;
                workerType = 'Social Worker';
                isEligible = true;
            }

            if (!isEligible) {
                return {
                    amount: 0,
                    basis: `Not eligible for hazard pay (Department: ${employee.department || 'Unknown'})`,
                    rate: 0,
                    isEligible: false,
                    department: employee.department
                };
            }

            // Get basic salary information
            const monthlySalary = employee.current_monthly_salary || 0;
            const dailyRate = employee.current_daily_rate || (monthlySalary / 22);

            if (dailyRate === 0) {
                return {
                    amount: 0,
                    basis: 'Cannot calculate hazard pay - no salary information',
                    rate: rate,
                    isEligible: true,
                    error: 'Missing salary data'
                };
            }

            // Calculate hazard pay: (Daily Rate × Days Worked) × Rate
            const basePay = dailyRate * daysWorked;
            const amount = basePay * rate;

            // Build basis string
            const basis = `${workerType} Hazard Pay: (₱${dailyRate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × ${daysWorked} days) × ${(rate * 100)}% = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                rate: rate,
                isEligible: true,
                workerType: workerType,
                department: employee.department,
                dailyRate: parseFloat(dailyRate.toFixed(2)),
                daysWorked: daysWorked
            };

        } catch (error) {
            console.error('Hazard Pay calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                rate: 0,
                isEligible: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate Subsistence Allowance
     * Formula: ₱50 per day worked
     * @param {number} daysWorked - Number of days worked
     * @returns {Object} - { amount, basis, dailyRate }
     */
    calculateSubsistence(daysWorked) {
        try {
            // Handle edge cases
            if (daysWorked === null || daysWorked === undefined || daysWorked < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid days worked',
                    dailyRate: this.subsistenceConfig.dailyRate,
                    error: 'Invalid days worked value'
                };
            }

            if (daysWorked === 0) {
                return {
                    amount: 0,
                    basis: 'No days worked',
                    dailyRate: this.subsistenceConfig.dailyRate,
                    daysWorked: 0
                };
            }

            // Calculate subsistence
            const amount = this.subsistenceConfig.dailyRate * daysWorked;

            // Build basis string
            const basis = `Subsistence: ₱${this.subsistenceConfig.dailyRate} × ${daysWorked} days = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                dailyRate: this.subsistenceConfig.dailyRate,
                daysWorked: daysWorked
            };

        } catch (error) {
            console.error('Subsistence calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                dailyRate: this.subsistenceConfig.dailyRate,
                error: error.message
            };
        }
    }

    /**
     * Calculate Laundry Allowance
     * Formula: ₱6.818 per day worked
     * @param {number} daysWorked - Number of days worked
     * @returns {Object} - { amount, basis, dailyRate }
     */
    calculateLaundry(daysWorked) {
        try {
            // Handle edge cases
            if (daysWorked === null || daysWorked === undefined || daysWorked < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid days worked',
                    dailyRate: this.laundryConfig.dailyRate,
                    error: 'Invalid days worked value'
                };
            }

            if (daysWorked === 0) {
                return {
                    amount: 0,
                    basis: 'No days worked',
                    dailyRate: this.laundryConfig.dailyRate,
                    daysWorked: 0
                };
            }

            // Calculate laundry allowance
            const amount = this.laundryConfig.dailyRate * daysWorked;

            // Build basis string
            const basis = `Laundry: ₱${this.laundryConfig.dailyRate} × ${daysWorked} days = ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return {
                amount: parseFloat(amount.toFixed(2)),
                basis: basis,
                dailyRate: this.laundryConfig.dailyRate,
                daysWorked: daysWorked
            };

        } catch (error) {
            console.error('Laundry allowance calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                dailyRate: this.laundryConfig.dailyRate,
                error: error.message
            };
        }
    }

    /**
     * Helper method to determine if employee is a Sangguniang Bayan member
     * @param {Object} employee - Employee object
     * @returns {boolean}
     */
    isSangguniangBayanMember(employee) {
        if (!employee) return false;

        const position = (employee.position || '').toUpperCase();
        const department = (employee.department || '').toUpperCase();

        // Check for SB-related keywords
        const sbKeywords = ['SANGGUNIANG BAYAN', 'SB MEMBER', 'COUNCILOR', 'VICE MAYOR'];
        
        return sbKeywords.some(keyword => 
            position.includes(keyword) || department.includes(keyword)
        );
    }

    /**
     * Validate allowance calculation inputs
     * @param {number} days - Days value to validate
     * @param {number} workingDays - Working days to validate (optional)
     * @returns {Object} - { isValid, errors, warnings }
     */
    validateAllowanceInputs(days, workingDays = null) {
        const errors = [];
        const warnings = [];

        if (days === null || days === undefined) {
            errors.push('Days value is required');
        }

        if (typeof days !== 'number') {
            errors.push('Days must be a number');
        }

        if (days < 0) {
            errors.push('Days cannot be negative');
        }

        if (days === 0) {
            warnings.push('Days is zero - allowance will be zero');
        }

        if (workingDays !== null && workingDays !== undefined) {
            if (workingDays <= 0) {
                errors.push('Working days must be greater than zero');
            }

            if (days > workingDays) {
                warnings.push('Days present exceeds working days - may result in over 100% allowance');
            }
        }

        if (days > 31) {
            warnings.push('Days exceeds maximum days in a month (31)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

module.exports = AllowanceCalculator;
