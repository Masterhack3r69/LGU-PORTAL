// utils/PayrollCalculationEngine.js - Main Payroll Calculation Orchestrator
// Integrates all calculation components for complete payroll processing

const TaxCalculator = require('./TaxCalculator');
const DeductionCalculator = require('./DeductionCalculator');
const AllowanceCalculator = require('./AllowanceCalculator');
const SalaryCalculator = require('./SalaryCalculator');

/**
 * PayrollCalculationEngine - Main orchestrator for payroll calculations
 * Integrates salary, allowance, deduction, and tax calculations
 * Provides validation and error handling for complete payroll processing
 */
class PayrollCalculationEngine {
    constructor() {
        // Initialize calculator components
        this.taxCalculator = new TaxCalculator();
        this.deductionCalculator = new DeductionCalculator();
        this.allowanceCalculator = new AllowanceCalculator();
        this.salaryCalculator = new SalaryCalculator();

        // Configuration
        this.standardWorkingDays = 22;
    }

    /**
     * Calculate complete payroll for an employee
     * Main orchestrator method that coordinates all calculations
     * @param {Object} employee - Employee object with salary and position info
     * @param {Object} period - Payroll period information
     * @param {number} workingDays - Working days in the period
     * @param {Object} overrides - Optional overrides for calculations
     * @returns {Promise<Object>} - Complete payroll calculation result
     */
    async calculateEmployeePayroll(employee, period, workingDays = null, overrides = {}) {
        try {
            console.log(`\n=== Payroll Calculation Started ===`);
            console.log(`Employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`);
            console.log(`Period: ${period.year}-${period.month} (Period ${period.period_number})`);

            // Initialize calculation result object
            const calculation = {
                employee_id: employee.id,
                employee_name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                period_id: period.id,
                period_info: {
                    year: period.year,
                    month: period.month,
                    period_number: period.period_number,
                    start_date: period.start_date,
                    end_date: period.end_date,
                    pay_date: period.pay_date
                },
                working_days: workingDays || period.working_days || this.standardWorkingDays,
                days_present: overrides.daysPresent !== undefined ? overrides.daysPresent : (workingDays || this.standardWorkingDays),
                days_lwop: overrides.daysLWOP !== undefined ? overrides.daysLWOP : 0,
                
                // Salary components
                monthly_salary: employee.current_monthly_salary || 0,
                daily_rate: 0,
                basic_pay: 0,
                
                // Allowances
                allowances: [],
                total_allowances: 0,
                
                // Deductions
                deductions: [],
                total_deductions: 0,
                
                // Totals
                gross_pay: 0,
                taxable_income: 0,
                net_pay: 0,
                
                // Metadata
                calculation_timestamp: new Date().toISOString(),
                calculation_method: 'PayrollCalculationEngine',
                overrides_applied: Object.keys(overrides).length > 0,
                errors: [],
                warnings: []
            };

            // Step 1: Validate inputs
            console.log('\n--- Step 1: Input Validation ---');
            const inputValidation = this.validateCalculationInputs(employee, period, calculation);
            if (!inputValidation.isValid) {
                console.error('Input validation failed:', inputValidation.errors);
                return {
                    success: false,
                    errors: inputValidation.errors,
                    data: calculation
                };
            }
            if (inputValidation.warnings.length > 0) {
                calculation.warnings.push(...inputValidation.warnings);
            }

            // Step 2: Calculate daily rate
            console.log('\n--- Step 2: Daily Rate Calculation ---');
            const dailyRateResult = this.salaryCalculator.calculateDailyRate(calculation.monthly_salary);
            calculation.daily_rate = dailyRateResult.dailyRate;
            console.log(`Daily Rate: ₱${calculation.daily_rate}`);

            // Step 3: Calculate basic salary
            console.log('\n--- Step 3: Basic Salary Calculation ---');
            const basicSalaryResult = this.salaryCalculator.calculateBasicSalary(
                calculation.monthly_salary,
                calculation.working_days,
                calculation.days_present
            );
            calculation.basic_pay = basicSalaryResult.amount;
            console.log(`Basic Pay: ₱${calculation.basic_pay} (${basicSalaryResult.basis})`);

            // Step 4: Apply LWOP if applicable
            if (calculation.days_lwop > 0) {
                console.log('\n--- Step 4: LWOP Application ---');
                const lwopResult = this.salaryCalculator.applyLWOP(
                    calculation.basic_pay,
                    calculation.days_lwop,
                    calculation.daily_rate
                );
                calculation.basic_pay = lwopResult.amount;
                calculation.lwop_deduction = lwopResult.lwopDeduction;
                console.log(`LWOP Applied: -₱${lwopResult.lwopDeduction}, Adjusted Basic Pay: ₱${calculation.basic_pay}`);
                if (lwopResult.warnings) {
                    calculation.warnings.push(...lwopResult.warnings);
                }
            }

            // Step 5: Calculate allowances
            console.log('\n--- Step 5: Allowances Calculation ---');
            const allowancesResult = await this.calculateAllowances(employee, period, calculation, overrides);
            calculation.allowances = allowancesResult.items;
            calculation.total_allowances = allowancesResult.total;
            console.log(`Total Allowances: ₱${calculation.total_allowances}`);

            // Step 6: Calculate gross pay
            calculation.gross_pay = calculation.basic_pay + calculation.total_allowances;
            console.log(`\n--- Step 6: Gross Pay ---`);
            console.log(`Gross Pay: ₱${calculation.basic_pay} + ₱${calculation.total_allowances} = ₱${calculation.gross_pay}`);

            // Step 7: Calculate mandatory deductions
            console.log('\n--- Step 7: Mandatory Deductions ---');
            const mandatoryDeductions = this.deductionCalculator.getTotalMandatoryDeductions(
                calculation.basic_pay,
                calculation.gross_pay
            );
            
            // Add mandatory deductions to deductions array
            for (const deduction of mandatoryDeductions.breakdown) {
                if (deduction.code !== 'EC') { // EC is employer share only
                    calculation.deductions.push({
                        type: 'Mandatory',
                        code: deduction.code,
                        name: deduction.name,
                        amount: deduction.employeeShare,
                        basis: deduction.basis,
                        is_taxable: false
                    });
                }
            }

            // Step 8: Calculate taxable income
            console.log('\n--- Step 8: Taxable Income Calculation ---');
            const nonTaxableDeductions = calculation.deductions.filter(d => !d.is_taxable);
            const taxableIncomeResult = this.taxCalculator.calculateTaxableIncome(
                calculation.gross_pay,
                nonTaxableDeductions
            );
            calculation.taxable_income = taxableIncomeResult.taxableIncome;
            console.log(`Taxable Income: ₱${calculation.taxable_income} (${taxableIncomeResult.basis})`);

            // Step 9: Calculate withholding tax
            console.log('\n--- Step 9: Withholding Tax Calculation ---');
            const taxTable = await this.taxCalculator.getTaxTable(period.pay_date || new Date());
            const taxResult = this.taxCalculator.calculateWithholdingTax(
                calculation.taxable_income,
                taxTable
            );
            
            calculation.deductions.push({
                type: 'Tax',
                code: 'WTAX',
                name: 'Withholding Tax',
                amount: taxResult.amount,
                basis: taxResult.basis,
                is_taxable: false
            });
            console.log(`Withholding Tax: ₱${taxResult.amount}`);

            // Step 10: Add loan deductions from overrides
            if (overrides.loanDeductions && Array.isArray(overrides.loanDeductions)) {
                console.log('\n--- Step 10: Loan Deductions ---');
                for (const loan of overrides.loanDeductions) {
                    calculation.deductions.push({
                        type: 'Loan',
                        code: loan.code || 'LOAN',
                        name: loan.name || 'Loan Deduction',
                        amount: loan.amount || 0,
                        basis: loan.basis || 'From billing',
                        is_taxable: false
                    });
                    console.log(`${loan.name}: ₱${loan.amount}`);
                }
            }

            // Step 11: Calculate total deductions
            calculation.total_deductions = calculation.deductions.reduce(
                (sum, deduction) => sum + deduction.amount,
                0
            );
            console.log(`\n--- Step 11: Total Deductions ---`);
            console.log(`Total Deductions: ₱${calculation.total_deductions}`);

            // Step 12: Calculate net pay
            calculation.net_pay = calculation.gross_pay - calculation.total_deductions;
            console.log(`\n--- Step 12: Net Pay ---`);
            console.log(`Net Pay: ₱${calculation.gross_pay} - ₱${calculation.total_deductions} = ₱${calculation.net_pay}`);

            // Step 13: Validate calculation results
            console.log('\n--- Step 13: Result Validation ---');
            const resultValidation = this.validateCalculation(calculation);
            if (!resultValidation.isValid) {
                calculation.errors.push(...resultValidation.errors);
            }
            if (resultValidation.warnings.length > 0) {
                calculation.warnings.push(...resultValidation.warnings);
            }

            // Round all monetary values to 2 decimal places
            this.roundCalculationValues(calculation);

            console.log(`\n=== Payroll Calculation Completed ===`);
            console.log(`Status: ${calculation.errors.length > 0 ? 'WITH ERRORS' : 'SUCCESS'}`);
            console.log(`Warnings: ${calculation.warnings.length}`);
            console.log(`Net Pay: ₱${calculation.net_pay}\n`);

            return {
                success: calculation.errors.length === 0,
                data: calculation,
                errors: calculation.errors,
                warnings: calculation.warnings
            };

        } catch (error) {
            console.error('Payroll calculation error:', error);
            return {
                success: false,
                error: 'Calculation failed',
                message: error.message,
                stack: error.stack
            };
        }
    }

    /**
     * Calculate all allowances for an employee
     * @param {Object} employee - Employee object
     * @param {Object} period - Payroll period
     * @param {Object} calculation - Current calculation state
     * @param {Object} overrides - Calculation overrides
     * @returns {Promise<Object>} - { items, total }
     */
    async calculateAllowances(employee, period, calculation, overrides) {
        const allowanceItems = [];
        let totalAllowances = 0;

        try {
            // Calculate PERA
            const peraResult = this.allowanceCalculator.calculatePERA(
                calculation.days_present,
                calculation.working_days
            );
            if (peraResult.amount > 0 || !peraResult.error) {
                allowanceItems.push({
                    code: 'PERA',
                    name: 'Personnel Economic Relief Allowance',
                    amount: peraResult.amount,
                    basis: peraResult.basis,
                    is_taxable: true
                });
                totalAllowances += peraResult.amount;
                console.log(`PERA: ₱${peraResult.amount}`);
            }

            // Calculate RATA if applicable
            if (employee.monthly_rata || employee.rata_amount) {
                const attendance = {
                    daysPresent: calculation.days_present,
                    workingDays: calculation.working_days,
                    sessionsAttended: overrides.sessionsAttended,
                    totalSessions: overrides.totalSessions
                };
                
                const rataResult = this.allowanceCalculator.calculateRATA(
                    employee,
                    period,
                    attendance
                );
                
                if (rataResult.amount > 0 || !rataResult.error) {
                    allowanceItems.push({
                        code: 'RATA',
                        name: 'Representation and Transportation Allowance',
                        amount: rataResult.amount,
                        basis: rataResult.basis,
                        is_taxable: true
                    });
                    totalAllowances += rataResult.amount;
                    console.log(`RATA: ₱${rataResult.amount}`);
                }
            }

            // Calculate Hazard Pay if eligible
            const hazardPayResult = this.allowanceCalculator.calculateHazardPay(
                employee,
                calculation.days_present
            );
            
            if (hazardPayResult.isEligible) {
                allowanceItems.push({
                    code: 'HAZARD',
                    name: 'Hazard Pay',
                    amount: hazardPayResult.amount,
                    basis: hazardPayResult.basis,
                    is_taxable: true
                });
                totalAllowances += hazardPayResult.amount;
                console.log(`Hazard Pay: ₱${hazardPayResult.amount}`);
            }

            // Calculate Subsistence Allowance
            const subsistenceResult = this.allowanceCalculator.calculateSubsistence(
                calculation.days_present
            );
            if (subsistenceResult.amount > 0 || !subsistenceResult.error) {
                allowanceItems.push({
                    code: 'SUBSISTENCE',
                    name: 'Subsistence Allowance',
                    amount: subsistenceResult.amount,
                    basis: subsistenceResult.basis,
                    is_taxable: false
                });
                totalAllowances += subsistenceResult.amount;
                console.log(`Subsistence: ₱${subsistenceResult.amount}`);
            }

            // Calculate Laundry Allowance
            const laundryResult = this.allowanceCalculator.calculateLaundry(
                calculation.days_present
            );
            if (laundryResult.amount > 0 || !laundryResult.error) {
                allowanceItems.push({
                    code: 'LAUNDRY',
                    name: 'Laundry Allowance',
                    amount: laundryResult.amount,
                    basis: laundryResult.basis,
                    is_taxable: false
                });
                totalAllowances += laundryResult.amount;
                console.log(`Laundry: ₱${laundryResult.amount}`);
            }

            // Add custom allowances from overrides
            if (overrides.customAllowances && Array.isArray(overrides.customAllowances)) {
                for (const allowance of overrides.customAllowances) {
                    allowanceItems.push({
                        code: allowance.code || 'CUSTOM',
                        name: allowance.name || 'Custom Allowance',
                        amount: allowance.amount || 0,
                        basis: allowance.basis || 'Custom override',
                        is_taxable: allowance.is_taxable !== false
                    });
                    totalAllowances += allowance.amount || 0;
                    console.log(`${allowance.name}: ₱${allowance.amount}`);
                }
            }

        } catch (error) {
            console.error('Allowance calculation error:', error);
            calculation.errors.push(`Allowance calculation error: ${error.message}`);
        }

        return {
            items: allowanceItems,
            total: parseFloat(totalAllowances.toFixed(2))
        };
    }

    /**
     * Validate calculation inputs
     * @param {Object} employee - Employee object
     * @param {Object} period - Payroll period
     * @param {Object} calculation - Calculation object
     * @returns {Object} - { isValid, errors, warnings }
     */
    validateCalculationInputs(employee, period, calculation) {
        const errors = [];
        const warnings = [];

        // Validate employee
        if (!employee || !employee.id) {
            errors.push('Invalid employee data');
        }

        if (!employee.current_monthly_salary || employee.current_monthly_salary <= 0) {
            errors.push('Employee has no valid monthly salary');
        }

        // Validate period
        if (!period || !period.id) {
            errors.push('Invalid payroll period');
        }

        // Validate working days
        if (calculation.working_days <= 0 || calculation.working_days > 31) {
            errors.push('Invalid working days (must be 1-31)');
        }

        // Validate days present
        if (calculation.days_present < 0 || calculation.days_present > 31) {
            errors.push('Invalid days present (must be 0-31)');
        }

        if (calculation.days_present > calculation.working_days) {
            warnings.push('Days present exceeds working days');
        }

        // Validate LWOP
        if (calculation.days_lwop < 0) {
            errors.push('LWOP days cannot be negative');
        }

        if (calculation.days_lwop > calculation.days_present) {
            warnings.push('LWOP days exceeds days present');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Validate calculation results
     * @param {Object} calculation - Completed calculation object
     * @returns {Object} - { isValid, errors, warnings }
     */
    validateCalculation(calculation) {
        const errors = [];
        const warnings = [];

        // Check for negative net pay
        if (calculation.net_pay < 0) {
            errors.push('Net pay is negative - deductions exceed gross pay');
            // Force net pay to zero
            calculation.net_pay = 0;
        }

        // Check if deductions exceed gross pay
        if (calculation.total_deductions > calculation.gross_pay && calculation.gross_pay > 0) {
            warnings.push('Total deductions exceed gross pay');
        }

        // Check for zero gross pay with working days
        if (calculation.gross_pay === 0 && calculation.days_present > 0) {
            warnings.push('Zero gross pay despite having days present');
        }

        // Check for unusually high deduction percentage
        if (calculation.gross_pay > 0) {
            const deductionPercentage = (calculation.total_deductions / calculation.gross_pay) * 100;
            if (deductionPercentage > 50) {
                warnings.push(`Deductions are ${deductionPercentage.toFixed(1)}% of gross pay (exceeds 50%)`);
            }
        }

        // Check for zero net pay
        if (calculation.net_pay === 0 && calculation.gross_pay > 0) {
            warnings.push('Net pay is zero after deductions');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * Generate detailed calculation breakdown for audit trail
     * @param {Object} payrollItem - Completed payroll calculation
     * @returns {Object} - Detailed breakdown with all calculation steps
     */
    generateCalculationBreakdown(payrollItem) {
        try {
            const breakdown = {
                employee: {
                    id: payrollItem.employee_id,
                    name: payrollItem.employee_name,
                    number: payrollItem.employee_number
                },
                period: payrollItem.period_info,
                attendance: {
                    working_days: payrollItem.working_days,
                    days_present: payrollItem.days_present,
                    days_lwop: payrollItem.days_lwop || 0
                },
                salary: {
                    monthly_salary: payrollItem.monthly_salary,
                    daily_rate: payrollItem.daily_rate,
                    basic_pay: payrollItem.basic_pay,
                    lwop_deduction: payrollItem.lwop_deduction || 0
                },
                allowances: {
                    items: payrollItem.allowances,
                    total: payrollItem.total_allowances
                },
                deductions: {
                    items: payrollItem.deductions,
                    total: payrollItem.total_deductions
                },
                summary: {
                    gross_pay: payrollItem.gross_pay,
                    taxable_income: payrollItem.taxable_income,
                    total_deductions: payrollItem.total_deductions,
                    net_pay: payrollItem.net_pay
                },
                metadata: {
                    calculation_timestamp: payrollItem.calculation_timestamp,
                    calculation_method: payrollItem.calculation_method,
                    overrides_applied: payrollItem.overrides_applied,
                    errors: payrollItem.errors || [],
                    warnings: payrollItem.warnings || []
                }
            };

            return breakdown;

        } catch (error) {
            console.error('Error generating calculation breakdown:', error);
            return {
                error: 'Failed to generate breakdown',
                message: error.message
            };
        }
    }

    /**
     * Round all monetary values in calculation to 2 decimal places
     * @param {Object} calculation - Calculation object to round
     */
    roundCalculationValues(calculation) {
        // Round main values
        calculation.daily_rate = parseFloat(calculation.daily_rate.toFixed(2));
        calculation.basic_pay = parseFloat(calculation.basic_pay.toFixed(2));
        calculation.total_allowances = parseFloat(calculation.total_allowances.toFixed(2));
        calculation.total_deductions = parseFloat(calculation.total_deductions.toFixed(2));
        calculation.gross_pay = parseFloat(calculation.gross_pay.toFixed(2));
        calculation.taxable_income = parseFloat(calculation.taxable_income.toFixed(2));
        calculation.net_pay = parseFloat(calculation.net_pay.toFixed(2));

        if (calculation.lwop_deduction) {
            calculation.lwop_deduction = parseFloat(calculation.lwop_deduction.toFixed(2));
        }

        // Round allowance amounts
        calculation.allowances.forEach(allowance => {
            allowance.amount = parseFloat(allowance.amount.toFixed(2));
        });

        // Round deduction amounts
        calculation.deductions.forEach(deduction => {
            deduction.amount = parseFloat(deduction.amount.toFixed(2));
        });
    }
}

module.exports = PayrollCalculationEngine;
