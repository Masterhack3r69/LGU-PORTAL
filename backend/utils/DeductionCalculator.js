// utils/DeductionCalculator.js - Government Mandatory Deductions Calculator
// Handles GSIS, Pag-IBIG, PhilHealth, and EC Fund calculations

/**
 * DeductionCalculator - Calculates mandatory government deductions
 * Based on Philippine government regulations (GSIS, Pag-IBIG, PhilHealth)
 */
class DeductionCalculator {
    constructor() {
        // GSIS rates and limits
        this.gsisConfig = {
            employeeRate: 0.09,      // 9% employee share
            employerRate: 0.12,      // 12% employer share (for reference)
            maxSalary: 100000        // Maximum salary subject to GSIS
        };

        // Pag-IBIG rates and limits
        this.pagibigConfig = {
            standardContribution: 100,     // Standard ₱100 for most employees
            highEarnerThreshold: 5000,     // Threshold for 2% calculation
            highEarnerRate: 0.02,          // 2% for high earners
            maxContribution: 200           // Maximum ₱200 contribution
        };

        // PhilHealth rates and limits (2024)
        this.philhealthConfig = {
            rate: 0.04,                    // 4% total premium (2% employee, 2% employer)
            employeeShare: 0.5,            // Employee pays 50% (2%)
            minSalary: 10000,              // Minimum salary for calculation
            maxSalary: 100000,             // Maximum salary for calculation
            minPremium: 400,               // Minimum monthly premium (total)
            maxPremium: 4000               // Maximum monthly premium (total)
        };

        // EC Fund (Employees Compensation)
        this.ecFundConfig = {
            amount: 100                    // Fixed ₱100 employer share
        };
    }

    /**
     * Calculate GSIS Premium (Employee Share)
     * Formula: 9% of basic salary (capped at max salary)
     * @param {number} basicSalary - Monthly basic salary
     * @returns {Object} - { amount, basis, employeeShare, employerShare }
     */
    calculateGSISPremium(basicSalary) {
        try {
            // Handle edge cases
            if (basicSalary === null || basicSalary === undefined || basicSalary < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid basic salary',
                    employeeShare: 0,
                    employerShare: 0,
                    error: 'Invalid basic salary value'
                };
            }

            if (basicSalary === 0) {
                return {
                    amount: 0,
                    basis: 'Zero basic salary',
                    employeeShare: 0,
                    employerShare: 0
                };
            }

            // Cap salary at maximum
            const cappedSalary = Math.min(basicSalary, this.gsisConfig.maxSalary);
            
            // Calculate employee share (9%)
            const employeeShare = cappedSalary * this.gsisConfig.employeeRate;
            
            // Calculate employer share (12%) - for reference
            const employerShare = cappedSalary * this.gsisConfig.employerRate;

            // Build basis string
            let basis = `${(this.gsisConfig.employeeRate * 100)}% of ₱${cappedSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            if (basicSalary > this.gsisConfig.maxSalary) {
                basis += ` (salary capped at ₱${this.gsisConfig.maxSalary.toLocaleString()})`;
            }

            return {
                amount: parseFloat(employeeShare.toFixed(2)),
                basis: basis,
                employeeShare: parseFloat(employeeShare.toFixed(2)),
                employerShare: parseFloat(employerShare.toFixed(2)),
                cappedSalary: parseFloat(cappedSalary.toFixed(2))
            };

        } catch (error) {
            console.error('GSIS calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                employeeShare: 0,
                employerShare: 0,
                error: error.message
            };
        }
    }

    /**
     * Calculate Pag-IBIG Premium (Employee Share)
     * Formula: ₱100 standard, or 2% for high earners (max ₱200)
     * @param {number} basicSalary - Monthly basic salary
     * @returns {Object} - { amount, basis, employeeShare, employerShare }
     */
    calculatePagIBIGPremium(basicSalary) {
        try {
            // Handle edge cases
            if (basicSalary === null || basicSalary === undefined || basicSalary < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid basic salary',
                    employeeShare: 0,
                    employerShare: 0,
                    error: 'Invalid basic salary value'
                };
            }

            if (basicSalary === 0) {
                return {
                    amount: 0,
                    basis: 'Zero basic salary',
                    employeeShare: 0,
                    employerShare: 0
                };
            }

            let employeeShare = 0;
            let basis = '';

            // Determine contribution based on salary
            if (basicSalary <= this.pagibigConfig.highEarnerThreshold) {
                // Standard contribution for lower earners
                employeeShare = this.pagibigConfig.standardContribution;
                basis = `Standard contribution: ₱${employeeShare} (salary ≤ ₱${this.pagibigConfig.highEarnerThreshold.toLocaleString()})`;
            } else {
                // 2% for high earners, capped at ₱200
                const calculated = basicSalary * this.pagibigConfig.highEarnerRate;
                employeeShare = Math.min(calculated, this.pagibigConfig.maxContribution);
                
                basis = `${(this.pagibigConfig.highEarnerRate * 100)}% of ₱${basicSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                if (calculated > this.pagibigConfig.maxContribution) {
                    basis += ` (capped at ₱${this.pagibigConfig.maxContribution})`;
                }
            }

            // Employer matches employee contribution
            const employerShare = employeeShare;

            return {
                amount: parseFloat(employeeShare.toFixed(2)),
                basis: basis,
                employeeShare: parseFloat(employeeShare.toFixed(2)),
                employerShare: parseFloat(employerShare.toFixed(2))
            };

        } catch (error) {
            console.error('Pag-IBIG calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                employeeShare: 0,
                employerShare: 0,
                error: error.message
            };
        }
    }

    /**
     * Calculate PhilHealth Premium (Employee Share)
     * Formula: 4% of basic salary / 2 (employee pays half), with floor and ceiling
     * @param {number} basicSalary - Monthly basic salary
     * @returns {Object} - { amount, basis, employeeShare, employerShare, totalPremium }
     */
    calculatePhilHealthPremium(basicSalary) {
        try {
            // Handle edge cases
            if (basicSalary === null || basicSalary === undefined || basicSalary < 0) {
                return {
                    amount: 0,
                    basis: 'Invalid basic salary',
                    employeeShare: 0,
                    employerShare: 0,
                    totalPremium: 0,
                    error: 'Invalid basic salary value'
                };
            }

            if (basicSalary === 0) {
                return {
                    amount: 0,
                    basis: 'Zero basic salary',
                    employeeShare: 0,
                    employerShare: 0,
                    totalPremium: 0
                };
            }

            // Apply floor and ceiling to salary
            let applicableSalary = basicSalary;
            let salaryAdjustment = '';

            if (basicSalary < this.philhealthConfig.minSalary) {
                applicableSalary = this.philhealthConfig.minSalary;
                salaryAdjustment = ` (minimum salary: ₱${this.philhealthConfig.minSalary.toLocaleString()})`;
            } else if (basicSalary > this.philhealthConfig.maxSalary) {
                applicableSalary = this.philhealthConfig.maxSalary;
                salaryAdjustment = ` (maximum salary: ₱${this.philhealthConfig.maxSalary.toLocaleString()})`;
            }

            // Calculate total premium (4% of salary)
            let totalPremium = applicableSalary * this.philhealthConfig.rate;

            // Apply premium floor and ceiling
            if (totalPremium < this.philhealthConfig.minPremium) {
                totalPremium = this.philhealthConfig.minPremium;
            } else if (totalPremium > this.philhealthConfig.maxPremium) {
                totalPremium = this.philhealthConfig.maxPremium;
            }

            // Employee pays half of total premium
            const employeeShare = totalPremium * this.philhealthConfig.employeeShare;
            const employerShare = totalPremium * this.philhealthConfig.employeeShare;

            // Build basis string
            const basis = `${(this.philhealthConfig.rate * 100)}% of ₱${applicableSalary.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${salaryAdjustment} ` +
                         `= ₱${totalPremium.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total ` +
                         `(employee share: 50%)`;

            return {
                amount: parseFloat(employeeShare.toFixed(2)),
                basis: basis,
                employeeShare: parseFloat(employeeShare.toFixed(2)),
                employerShare: parseFloat(employerShare.toFixed(2)),
                totalPremium: parseFloat(totalPremium.toFixed(2)),
                applicableSalary: parseFloat(applicableSalary.toFixed(2))
            };

        } catch (error) {
            console.error('PhilHealth calculation error:', error);
            return {
                amount: 0,
                basis: `Error: ${error.message}`,
                employeeShare: 0,
                employerShare: 0,
                totalPremium: 0,
                error: error.message
            };
        }
    }

    /**
     * Calculate EC Fund (Employees Compensation)
     * This is a fixed employer contribution, not deducted from employee
     * @returns {Object} - { amount, basis, employerShare }
     */
    calculateECFund() {
        return {
            amount: this.ecFundConfig.amount,
            basis: `Fixed EC Fund contribution: ₱${this.ecFundConfig.amount} (employer share only)`,
            employerShare: this.ecFundConfig.amount,
            employeeShare: 0
        };
    }

    /**
     * Calculate total mandatory deductions for an employee
     * @param {number} basicSalary - Monthly basic salary
     * @param {number} grossPay - Total gross pay (for reference)
     * @returns {Object} - { total, breakdown, employeeTotal, employerTotal }
     */
    getTotalMandatoryDeductions(basicSalary, grossPay = null) {
        try {
            // Calculate each deduction
            const gsis = this.calculateGSISPremium(basicSalary);
            const pagibig = this.calculatePagIBIGPremium(basicSalary);
            const philhealth = this.calculatePhilHealthPremium(basicSalary);
            const ecFund = this.calculateECFund();

            // Sum employee deductions
            const employeeTotal = gsis.employeeShare + pagibig.employeeShare + philhealth.employeeShare;

            // Sum employer contributions (for reference)
            const employerTotal = gsis.employerShare + pagibig.employerShare + philhealth.employerShare + ecFund.employerShare;

            // Build breakdown
            const breakdown = [
                {
                    name: 'GSIS Premium',
                    code: 'GSIS',
                    employeeShare: gsis.employeeShare,
                    employerShare: gsis.employerShare,
                    basis: gsis.basis,
                    error: gsis.error
                },
                {
                    name: 'Pag-IBIG Premium',
                    code: 'PAGIBIG',
                    employeeShare: pagibig.employeeShare,
                    employerShare: pagibig.employerShare,
                    basis: pagibig.basis,
                    error: pagibig.error
                },
                {
                    name: 'PhilHealth Premium',
                    code: 'PHILHEALTH',
                    employeeShare: philhealth.employeeShare,
                    employerShare: philhealth.employerShare,
                    basis: philhealth.basis,
                    error: philhealth.error
                },
                {
                    name: 'EC Fund',
                    code: 'EC',
                    employeeShare: ecFund.employeeShare,
                    employerShare: ecFund.employerShare,
                    basis: ecFund.basis
                }
            ];

            return {
                total: parseFloat(employeeTotal.toFixed(2)),
                employeeTotal: parseFloat(employeeTotal.toFixed(2)),
                employerTotal: parseFloat(employerTotal.toFixed(2)),
                breakdown: breakdown,
                summary: {
                    basicSalary: parseFloat(basicSalary.toFixed(2)),
                    grossPay: grossPay ? parseFloat(grossPay.toFixed(2)) : null,
                    totalEmployeeDeductions: parseFloat(employeeTotal.toFixed(2)),
                    totalEmployerContributions: parseFloat(employerTotal.toFixed(2))
                }
            };

        } catch (error) {
            console.error('Error calculating total mandatory deductions:', error);
            return {
                total: 0,
                employeeTotal: 0,
                employerTotal: 0,
                breakdown: [],
                error: error.message
            };
        }
    }

    /**
     * Validate deduction calculation inputs
     * @param {number} basicSalary - Basic salary to validate
     * @returns {Object} - { isValid, errors, warnings }
     */
    validateDeductionInputs(basicSalary) {
        const errors = [];
        const warnings = [];

        if (basicSalary === null || basicSalary === undefined) {
            errors.push('Basic salary is required');
        }

        if (typeof basicSalary !== 'number') {
            errors.push('Basic salary must be a number');
        }

        if (basicSalary < 0) {
            errors.push('Basic salary cannot be negative');
        }

        if (basicSalary === 0) {
            warnings.push('Basic salary is zero - all deductions will be zero');
        }

        if (basicSalary > this.gsisConfig.maxSalary) {
            warnings.push(`Basic salary exceeds GSIS maximum (₱${this.gsisConfig.maxSalary.toLocaleString()}) - GSIS will be capped`);
        }

        if (basicSalary > this.philhealthConfig.maxSalary) {
            warnings.push(`Basic salary exceeds PhilHealth maximum (₱${this.philhealthConfig.maxSalary.toLocaleString()}) - PhilHealth will be capped`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

module.exports = DeductionCalculator;
