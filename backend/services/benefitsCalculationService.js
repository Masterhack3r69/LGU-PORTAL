// services/benefitsCalculationService.js - Benefits calculation engine
const BenefitType = require('../models/Benefits/BenefitType');
const Employee = require('../models/Employee');

class BenefitsCalculationService {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.loyaltyAwardAmounts = {
            LOYALTY_10: 10000,
            LOYALTY_15: 15000,
            LOYALTY_20: 20000,
            LOYALTY_25: 25000
        };
    }

    /**
     * Calculate benefit amount for an employee based on benefit type
     * @param {Object} employee - Employee object
     * @param {Object} benefitType - BenefitType object
     * @param {Object} options - Additional calculation options
     * @returns {Object} Calculation result
     */
    async calculateBenefitAmount(employee, benefitType, options = {}) {
        try {
            const calculation = {
                employee_id: employee.id,
                benefit_type_id: benefitType.id,
                base_salary: this.getBaseSalary(employee),
                service_months: this.calculateServiceMonths(employee, options.cutoffDate),
                calculated_amount: 0,
                tax_amount: 0,
                final_amount: 0,
                net_amount: 0,
                calculation_basis: '',
                is_eligible: true,
                eligibility_notes: ''
            };

            // Check eligibility first
            const eligibilityCheck = this.checkEligibility(employee, benefitType, calculation.service_months);
            calculation.is_eligible = eligibilityCheck.is_eligible;
            calculation.eligibility_notes = eligibilityCheck.notes;

            if (!calculation.is_eligible) {
                return {
                    success: true,
                    data: calculation
                };
            }

            // Calculate amount based on benefit type
            const amountResult = await this.calculateAmountByType(employee, benefitType, calculation);
            calculation.calculated_amount = amountResult.amount;
            calculation.calculation_basis = amountResult.basis;

            // Apply proration if required
            if (benefitType.is_prorated && calculation.service_months < 12) {
                const prorationFactor = calculation.service_months / 12;
                calculation.calculated_amount = calculation.calculated_amount * prorationFactor;
                calculation.calculation_basis += ` (Prorated for ${calculation.service_months} months)`;
            }

            // Calculate tax if applicable
            if (benefitType.is_taxable) {
                calculation.tax_amount = this.calculateTax(calculation.calculated_amount);
            }

            // Calculate final amounts
            calculation.final_amount = calculation.calculated_amount;
            calculation.net_amount = calculation.final_amount - calculation.tax_amount;

            return {
                success: true,
                data: calculation
            };

        } catch (error) {
            console.error('Benefits calculation error:', error);
            return {
                success: false,
                error: 'Calculation failed',
                details: error.message
            };
        }
    }

    /**
     * Calculate amount based on benefit type
     */
    async calculateAmountByType(employee, benefitType, calculation) {
        switch (benefitType.calculation_type) {
            case 'Fixed':
                return this.calculateFixedAmount(benefitType);
            
            case 'Percentage':
                return this.calculatePercentageAmount(employee, benefitType, calculation);
            
            case 'Formula':
                return this.calculateFormulaAmount(employee, benefitType, calculation);
            
            case 'Manual':
                return this.calculateManualAmount(benefitType);
            
            default:
                throw new Error(`Unknown calculation type: ${benefitType.calculation_type}`);
        }
    }

    /**
     * Calculate fixed amount benefit
     */
    calculateFixedAmount(benefitType) {
        const amount = parseFloat(benefitType.fixed_amount) || 0;
        return {
            amount,
            basis: `Fixed amount: ₱${amount.toLocaleString()}`
        };
    }

    /**
     * Calculate percentage-based amount
     */
    calculatePercentageAmount(employee, benefitType, calculation) {
        const rate = parseFloat(benefitType.percentage_rate) || 0;
        const amount = (calculation.base_salary * rate) / 100;
        
        return {
            amount,
            basis: `${rate}% of base salary (₱${calculation.base_salary.toLocaleString()})`
        };
    }

    /**
     * Calculate formula-based amount
     */
    calculateFormulaAmount(employee, benefitType, calculation) {
        switch (benefitType.code) {
            case 'MID_YEAR':
            case 'YEAR_END':
                return this.calculate13thMonthBonus(employee, calculation);
            
            case 'LEAVE_MONETIZE':
                return this.calculateLeaveMonetization(employee, calculation);
            
            case 'PBB':
                return this.calculatePerformanceBonus(employee, calculation);
            
            default:
                return this.calculateGenericFormula(employee, benefitType, calculation);
        }
    }

    /**
     * Calculate manual amount (placeholder for admin input)
     */
    calculateManualAmount(benefitType) {
        return {
            amount: 0,
            basis: 'Manual entry required - amount to be set by administrator'
        };
    }

    /**
     * Calculate 13th month bonus (Mid-Year/Year-End)
     */
    calculate13thMonthBonus(employee, calculation) {
        // 13th month = (Basic Salary / 12) * (Service Months / 12)
        const monthlyEquivalent = calculation.base_salary / 12;
        const serviceFactor = Math.min(calculation.service_months, 12) / 12;
        const amount = monthlyEquivalent * serviceFactor;

        return {
            amount,
            basis: `1/12 of annual salary (₱${calculation.base_salary.toLocaleString()}) × ${calculation.service_months} months service`
        };
    }

    /**
     * Calculate leave monetization
     */
    calculateLeaveMonetization(employee, calculation) {
        // This would need leave balance data - for now return placeholder
        const dailyRate = employee.current_daily_rate || (calculation.base_salary / 22);
        const leaveDays = calculation.leave_days || 0; // This should come from leave system
        const amount = dailyRate * leaveDays;

        return {
            amount,
            basis: `Daily rate (₱${dailyRate.toLocaleString()}) × ${leaveDays} leave days`
        };
    }

    /**
     * Calculate performance bonus
     */
    calculatePerformanceBonus(employee, calculation) {
        // Performance bonus calculation - would need performance rating data
        const baseAmount = calculation.base_salary / 12; // 1 month equivalent
        const performanceRating = calculation.performance_rating || 1.0; // Default to satisfactory
        const amount = baseAmount * performanceRating;

        return {
            amount,
            basis: `Base amount (₱${baseAmount.toLocaleString()}) × Performance rating (${performanceRating})`
        };
    }

    /**
     * Calculate generic formula-based benefit
     */
    calculateGenericFormula(employee, benefitType, calculation) {
        try {
            if (!benefitType.calculation_formula) {
                return { amount: 0, basis: 'No formula defined' };
            }

            // Simple formula parser - supports basic operations
            let formula = benefitType.calculation_formula;
            const context = {
                basic_salary: calculation.base_salary,
                service_months: calculation.service_months,
                daily_rate: employee.current_daily_rate || (calculation.base_salary / 22),
                monthly_salary: employee.current_monthly_salary || calculation.base_salary
            };

            // Replace variables in formula
            Object.keys(context).forEach(key => {
                const regex = new RegExp(key, 'g');
                formula = formula.replace(regex, context[key]);
            });

            // Evaluate formula (basic math operations only)
            const amount = this.evaluateFormula(formula);

            return {
                amount,
                basis: `Formula: ${benefitType.calculation_formula} = ₱${amount.toLocaleString()}`
            };

        } catch (error) {
            console.error('Formula calculation error:', error);
            return {
                amount: 0,
                basis: `Formula error: ${error.message}`
            };
        }
    }

    /**
     * Safely evaluate mathematical formula
     */
    evaluateFormula(formula) {
        try {
            // Remove any non-math characters for security
            const sanitized = formula.replace(/[^0-9+\-*/.() ]/g, '');
            
            // Use Function constructor for safe evaluation
            const result = Function(`"use strict"; return (${sanitized})`)();
            
            return isNaN(result) ? 0 : Math.max(0, result);
        } catch (error) {
            console.error('Formula evaluation error:', error);
            return 0;
        }
    }

    /**
     * Check employee eligibility for benefit
     */
    checkEligibility(employee, benefitType, serviceMonths) {
        const eligibility = {
            is_eligible: true,
            notes: ''
        };

        // Check employment status
        if (employee.employment_status !== 'Active') {
            eligibility.is_eligible = false;
            eligibility.notes = `Employee status is ${employee.employment_status}`;
            return eligibility;
        }

        // Check minimum service months
        if (serviceMonths < benefitType.minimum_service_months) {
            eligibility.is_eligible = false;
            eligibility.notes = `Insufficient service months: ${serviceMonths} (minimum: ${benefitType.minimum_service_months})`;
            return eligibility;
        }

        // Special eligibility checks by benefit type
        switch (benefitType.code) {
            case 'LOYALTY_10':
                if (serviceMonths < 120) { // 10 years
                    eligibility.is_eligible = false;
                    eligibility.notes = 'Requires 10 years of service';
                }
                break;
            
            case 'LOYALTY_15':
                if (serviceMonths < 180) { // 15 years
                    eligibility.is_eligible = false;
                    eligibility.notes = 'Requires 15 years of service';
                }
                break;
            
            case 'LOYALTY_20':
                if (serviceMonths < 240) { // 20 years
                    eligibility.is_eligible = false;
                    eligibility.notes = 'Requires 20 years of service';
                }
                break;
            
            case 'LOYALTY_25':
                if (serviceMonths < 300) { // 25 years
                    eligibility.is_eligible = false;
                    eligibility.notes = 'Requires 25 years of service';
                }
                break;
            
            case 'PBB':
                // Performance bonus might need additional checks
                if (serviceMonths < 4) {
                    eligibility.is_eligible = false;
                    eligibility.notes = 'Requires minimum 4 months service for PBB eligibility';
                }
                break;
        }

        return eligibility;
    }

    /**
     * Calculate service months from appointment date to cutoff date
     */
    calculateServiceMonths(employee, cutoffDate = null) {
        if (!employee.appointment_date) {
            return 0;
        }

        const appointmentDate = new Date(employee.appointment_date);
        const endDate = cutoffDate ? new Date(cutoffDate) : new Date();

        // Calculate months difference
        const yearDiff = endDate.getFullYear() - appointmentDate.getFullYear();
        const monthDiff = endDate.getMonth() - appointmentDate.getMonth();
        const dayDiff = endDate.getDate() - appointmentDate.getDate();

        let totalMonths = yearDiff * 12 + monthDiff;

        // Adjust for partial month
        if (dayDiff >= 15) {
            totalMonths += 1;
        } else if (dayDiff < 0) {
            totalMonths -= 1;
        }

        return Math.max(0, totalMonths);
    }

    /**
     * Get base salary for calculation
     */
    getBaseSalary(employee) {
        return employee.current_monthly_salary || 0;
    }

    /**
     * Calculate basic tax withholding (simplified)
     */
    calculateTax(amount) {
        // Simplified tax calculation - in real implementation, 
        // this should use proper tax tables and brackets
        if (amount <= 250000 / 12) {
            return 0; // Tax-free threshold
        }

        // Basic flat rate for benefits (simplified)
        return amount * 0.10; // 10% withholding tax
    }

    /**
     * Bulk calculate benefits for multiple employees
     */
    async bulkCalculateBenefits(employees, benefitType, options = {}) {
        const results = [];
        
        for (const employee of employees) {
            try {
                const calculation = await this.calculateBenefitAmount(employee, benefitType, options);
                results.push({
                    employee_id: employee.id,
                    calculation: calculation.data,
                    success: calculation.success,
                    error: calculation.error
                });
            } catch (error) {
                results.push({
                    employee_id: employee.id,
                    calculation: null,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Get eligible employees for a specific benefit type
     */
    async getEligibleEmployees(benefitType, cutoffDate = null) {
        try {
            // Get all active employees
            const employeesResult = await Employee.findAll({
                employment_status: 'Active',
                limit: 1000 // Reasonable limit
            });

            if (!employeesResult.success) {
                throw new Error('Failed to retrieve employees');
            }

            const eligibleEmployees = [];
            
            for (const employee of employeesResult.data) {
                const serviceMonths = this.calculateServiceMonths(employee, cutoffDate);
                const eligibility = this.checkEligibility(employee, benefitType, serviceMonths);
                
                if (eligibility.is_eligible) {
                    eligibleEmployees.push({
                        ...employee,
                        service_months: serviceMonths
                    });
                }
            }

            return {
                success: true,
                data: eligibleEmployees
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate benefit calculation summary
     */
    generateCalculationSummary(calculations) {
        const summary = {
            total_employees: calculations.length,
            eligible_employees: calculations.filter(c => c.calculation?.is_eligible).length,
            ineligible_employees: calculations.filter(c => !c.calculation?.is_eligible).length,
            total_amount: 0,
            total_tax: 0,
            total_net: 0,
            average_benefit: 0
        };

        const eligibleCalculations = calculations.filter(c => c.calculation?.is_eligible);
        
        summary.total_amount = eligibleCalculations.reduce((sum, c) => sum + (c.calculation?.calculated_amount || 0), 0);
        summary.total_tax = eligibleCalculations.reduce((sum, c) => sum + (c.calculation?.tax_amount || 0), 0);
        summary.total_net = eligibleCalculations.reduce((sum, c) => sum + (c.calculation?.net_amount || 0), 0);
        
        summary.average_benefit = summary.eligible_employees > 0 
            ? summary.total_amount / summary.eligible_employees 
            : 0;

        return summary;
    }
}

module.exports = new BenefitsCalculationService();