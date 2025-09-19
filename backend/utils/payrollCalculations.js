// utils/payrollCalculations.js - Advanced payroll calculation engine
const AllowanceType = require('../models/Payroll/AllowanceType');
const DeductionType = require('../models/Payroll/DeductionType');
const { EmployeeAllowanceOverride, EmployeeDeductionOverride } = require('../models/Payroll/EmployeeOverride');

class PayrollCalculationEngine {
    constructor() {
        this.defaultWorkingDays = 22;
        this.minimumWage = 0; // Can be configured
        this.taxBrackets = this.initializeTaxBrackets();
        this.gsisBrackets = this.initializeGSISBrackets();
        this.philHealthBrackets = this.initializePhilHealthBrackets();
    }

    // Initialize Philippine tax brackets (2024)
    initializeTaxBrackets() {
        return [
            { min: 0, max: 250000, rate: 0, fixedAmount: 0 },
            { min: 250000, max: 400000, rate: 0.15, fixedAmount: 0 },
            { min: 400000, max: 800000, rate: 0.20, fixedAmount: 22500 },
            { min: 800000, max: 2000000, rate: 0.25, fixedAmount: 102500 },
            { min: 2000000, max: 8000000, rate: 0.30, fixedAmount: 402500 },
            { min: 8000000, max: Infinity, rate: 0.35, fixedAmount: 2202500 }
        ];
    }

    // Initialize GSIS premium brackets
    initializeGSISBrackets() {
        return {
            employeeRate: 0.09, // 9% employee share
            employerRate: 0.12, // 12% employer share
            maxSalary: 100000   // Maximum salary subject to GSIS
        };
    }

    // Initialize PhilHealth premium brackets
    initializePhilHealthBrackets() {
        return [
            { min: 0, max: 10000, premium: 275 },
            { min: 10000, max: 99999, rate: 0.0275, max: 1750 },
            { min: 100000, max: Infinity, premium: 1750 }
        ];
    }

    // Main calculation method for employee payroll
    async calculateEmployeePayroll(employee, periodData, workingDays = null, overrides = {}) {
        try {
            const calculation = {
                employee_id: employee.id,
                employee_name: `${employee.first_name} ${employee.last_name}`,
                employee_number: employee.employee_number,
                period_id: periodData.id,
                working_days: workingDays || this.defaultWorkingDays,
                daily_rate: employee.current_daily_rate || 0,
                basic_pay: 0,
                allowances: [],
                deductions: [],
                total_allowances: 0,
                total_deductions: 0,
                gross_pay: 0,
                taxable_income: 0,
                net_pay: 0,
                calculation_details: {},
                errors: [],
                warnings: []
            };

            // Validate inputs
            if (!this.validateCalculationInputs(employee, calculation)) {
                return { success: false, errors: calculation.errors };
            }

            // Calculate basic pay
            calculation.basic_pay = this.calculateBasicPay(
                calculation.daily_rate, 
                calculation.working_days
            );

            // Get and process allowances
            const allowances = await this.processAllowances(employee, calculation, overrides.allowances);
            calculation.allowances = allowances.items;
            calculation.total_allowances = allowances.total;

            // Calculate gross pay
            calculation.gross_pay = calculation.basic_pay + calculation.total_allowances;

            // Get and process deductions
            const deductions = await this.processDeductions(employee, calculation, overrides.deductions);
            calculation.deductions = deductions.items;
            calculation.total_deductions = deductions.total;

            // Calculate taxable income
            calculation.taxable_income = this.calculateTaxableIncome(calculation);

            // Calculate net pay
            calculation.net_pay = calculation.gross_pay - calculation.total_deductions;

            // Add calculation metadata
            calculation.calculation_details = {
                calculated_at: new Date().toISOString(),
                calculation_method: 'standard',
                working_days_basis: this.defaultWorkingDays,
                overrides_applied: Object.keys(overrides).length > 0
            };

            // Validate final amounts
            this.validateCalculationResults(calculation);

            return { success: true, data: calculation };

        } catch (error) {
            return {
                success: false,
                error: 'Calculation failed',
                details: error.message
            };
        }
    }

    // Calculate basic pay
    calculateBasicPay(dailyRate, workingDays) {
        return parseFloat((dailyRate * workingDays).toFixed(2));
    }

    // Process allowances with overrides
    async processAllowances(employee, calculation, allowanceOverrides = {}) {
        const allowanceItems = [];
        let totalAllowances = 0;

        try {
            // Get active allowance types
            const allowanceTypesResult = await AllowanceType.findAll({ 
                is_active: true, 
                frequency: 'Monthly' 
            });

            if (!allowanceTypesResult.success) {
                throw new Error('Failed to retrieve allowance types');
            }

            for (const allowanceType of allowanceTypesResult.data) {
                let amount = 0;
                let isOverride = false;
                let calculationBasis = '';

                // Check for employee-specific override
                const override = await this.getEmployeeAllowanceOverride(
                    employee.id, 
                    allowanceType.id
                );

                if (override) {
                    amount = override.override_amount;
                    isOverride = true;
                    calculationBasis = `Override: ₱${amount}`;
                } else if (allowanceOverrides[allowanceType.id]) {
                    // Manual override for this calculation
                    amount = allowanceOverrides[allowanceType.id];
                    isOverride = true;
                    calculationBasis = `Manual override: ₱${amount}`;
                } else {
                    // Calculate based on allowance type
                    const calcResult = this.calculateAllowanceAmount(
                        allowanceType, 
                        employee, 
                        calculation
                    );
                    amount = calcResult.amount;
                    calculationBasis = calcResult.basis;
                }

                if (amount > 0) {
                    allowanceItems.push({
                        type_id: allowanceType.id,
                        name: allowanceType.name,
                        code: allowanceType.code,
                        amount: parseFloat(amount.toFixed(2)),
                        is_override: isOverride,
                        is_taxable: allowanceType.is_taxable,
                        calculation_basis: calculationBasis
                    });
                    totalAllowances += amount;
                }
            }

        } catch (error) {
            calculation.errors.push(`Allowance calculation error: ${error.message}`);
        }

        return {
            items: allowanceItems,
            total: parseFloat(totalAllowances.toFixed(2))
        };
    }

    // Process deductions with overrides
    async processDeductions(employee, calculation, deductionOverrides = {}) {
        const deductionItems = [];
        let totalDeductions = 0;

        try {
            // Get active deduction types
            const deductionTypesResult = await DeductionType.findAll({ 
                is_active: true, 
                frequency: 'Monthly' 
            });

            if (!deductionTypesResult.success) {
                throw new Error('Failed to retrieve deduction types');
            }

            // Process mandatory deductions first
            const mandatoryTypes = deductionTypesResult.data.filter(dt => dt.is_mandatory);
            const optionalTypes = deductionTypesResult.data.filter(dt => !dt.is_mandatory);

            // Process mandatory deductions
            for (const deductionType of mandatoryTypes) {
                const result = await this.processDeductionType(
                    deductionType, 
                    employee, 
                    calculation, 
                    deductionOverrides
                );
                if (result.amount > 0) {
                    deductionItems.push(result);
                    totalDeductions += result.amount;
                }
            }

            // Process optional deductions
            for (const deductionType of optionalTypes) {
                const result = await this.processDeductionType(
                    deductionType, 
                    employee, 
                    calculation, 
                    deductionOverrides
                );
                if (result.amount > 0) {
                    deductionItems.push(result);
                    totalDeductions += result.amount;
                }
            }

        } catch (error) {
            calculation.errors.push(`Deduction calculation error: ${error.message}`);
        }

        return {
            items: deductionItems,
            total: parseFloat(totalDeductions.toFixed(2))
        };
    }

    // Process individual deduction type
    async processDeductionType(deductionType, employee, calculation, deductionOverrides) {
        let amount = 0;
        let isOverride = false;
        let calculationBasis = '';

        // Check for employee-specific override
        const override = await this.getEmployeeDeductionOverride(
            employee.id, 
            deductionType.id
        );

        if (override) {
            amount = override.override_amount;
            isOverride = true;
            calculationBasis = `Override: ₱${amount}`;
        } else if (deductionOverrides[deductionType.id]) {
            // Manual override for this calculation
            amount = deductionOverrides[deductionType.id];
            isOverride = true;
            calculationBasis = `Manual override: ₱${amount}`;
        } else {
            // Calculate based on deduction type
            const calcResult = this.calculateDeductionAmount(
                deductionType, 
                employee, 
                calculation
            );
            amount = calcResult.amount;
            calculationBasis = calcResult.basis;
        }

        return {
            type_id: deductionType.id,
            name: deductionType.name,
            code: deductionType.code,
            amount: parseFloat(amount.toFixed(2)),
            is_override: isOverride,
            is_mandatory: deductionType.is_mandatory,
            calculation_basis: calculationBasis
        };
    }

    // Calculate allowance amount based on type
    calculateAllowanceAmount(allowanceType, employee, calculation) {
        let amount = 0;
        let basis = '';

        switch (allowanceType.calculation_type) {
            case 'Fixed':
                amount = allowanceType.default_amount || 0;
                basis = `Fixed amount: ₱${amount}`;
                break;

            case 'Percentage':
                const baseAmount = this.getPercentageBase(
                    allowanceType.percentage_base, 
                    employee, 
                    calculation
                );
                const percentage = allowanceType.default_amount || 0;
                amount = (baseAmount * percentage) / 100;
                basis = `${percentage}% of ${allowanceType.percentage_base}: ₱${baseAmount}`;
                break;

            case 'Formula':
                // Custom formula calculations
                const formulaResult = this.applyAllowanceFormula(
                    allowanceType, 
                    employee, 
                    calculation
                );
                amount = formulaResult.amount;
                basis = formulaResult.basis;
                break;

            default:
                amount = 0;
                basis = 'Unknown calculation type';
        }

        return { amount, basis };
    }

    // Calculate deduction amount based on type
    calculateDeductionAmount(deductionType, employee, calculation) {
        let amount = 0;
        let basis = '';

        switch (deductionType.calculation_type) {
            case 'Fixed':
                amount = deductionType.default_amount || 0;
                basis = `Fixed amount: ₱${amount}`;
                break;

            case 'Percentage':
                const baseAmount = this.getPercentageBase(
                    deductionType.percentage_base, 
                    employee, 
                    calculation
                );
                const percentage = deductionType.default_amount || 0;
                amount = (baseAmount * percentage) / 100;
                basis = `${percentage}% of ${deductionType.percentage_base}: ₱${baseAmount}`;
                break;

            case 'Formula':
                // Government deduction formulas
                const formulaResult = this.applyDeductionFormula(
                    deductionType, 
                    employee, 
                    calculation
                );
                amount = formulaResult.amount;
                basis = formulaResult.basis;
                break;

            default:
                amount = 0;
                basis = 'Unknown calculation type';
        }

        return { amount, basis };
    }

    // Get percentage calculation base
    getPercentageBase(percentageBase, employee, calculation) {
        switch (percentageBase) {
            case 'BasicPay':
                return calculation.basic_pay;
            case 'MonthlySalary':
                return employee.current_monthly_salary || calculation.basic_pay;
            case 'GrossPay':
                return calculation.gross_pay || calculation.basic_pay;
            default:
                return calculation.basic_pay;
        }
    }

    // Apply custom allowance formulas
    applyAllowanceFormula(allowanceType, employee, calculation) {
        switch (allowanceType.code) {
            case 'OT':
                // Overtime calculation (example)
                const overtimeHours = 0; // Would come from timesheet data
                const overtimeRate = calculation.daily_rate / 8 * 1.25; // 25% premium
                return {
                    amount: overtimeHours * overtimeRate,
                    basis: `${overtimeHours} hours @ ₱${overtimeRate.toFixed(2)}/hour`
                };

            case 'NIGHT':
                // Night differential (10% of basic pay for night shift)
                const nightShiftDays = 0; // Would come from schedule data
                const nightDifferential = calculation.basic_pay * 0.10;
                return {
                    amount: nightShiftDays > 0 ? nightDifferential : 0,
                    basis: `10% night differential for ${nightShiftDays} days`
                };

            default:
                return {
                    amount: allowanceType.default_amount || 0,
                    basis: 'Default formula amount'
                };
        }
    }

    // Apply government deduction formulas
    applyDeductionFormula(deductionType, employee, calculation) {
        switch (deductionType.code) {
            case 'GSIS':
                return this.calculateGSIS(calculation.basic_pay);

            case 'PHILHEALTH':
                const monthlySalary = employee.current_monthly_salary || calculation.basic_pay;
                return this.calculatePhilHealth(monthlySalary);

            case 'PAGIBIG':
                return this.calculatePagIbig(employee.current_monthly_salary || calculation.basic_pay);

            case 'ITAX':
                return this.calculateIncomeTax(calculation.taxable_income || calculation.gross_pay);

            default:
                return {
                    amount: deductionType.default_amount || 0,
                    basis: 'Default formula amount'
                };
        }
    }

    // Calculate GSIS premium
    calculateGSIS(basicPay) {
        const cappedSalary = Math.min(basicPay, this.gsisBrackets.maxSalary);
        const amount = cappedSalary * this.gsisBrackets.employeeRate;
        return {
            amount,
            basis: `${(this.gsisBrackets.employeeRate * 100)}% of ₱${cappedSalary.toFixed(2)} (capped at ₱${this.gsisBrackets.maxSalary})`
        };
    }

    // Calculate PhilHealth premium
    calculatePhilHealth(monthlySalary) {
        for (const bracket of this.philHealthBrackets) {
            if (monthlySalary >= bracket.min && monthlySalary < bracket.max) {
                if (bracket.premium) {
                    return {
                        amount: bracket.premium,
                        basis: `Fixed premium for salary range ₱${bracket.min}-₱${bracket.max}`
                    };
                } else if (bracket.rate) {
                    const calculatedPremium = monthlySalary * bracket.rate;
                    const amount = Math.min(calculatedPremium, bracket.max);
                    return {
                        amount,
                        basis: `${(bracket.rate * 100)}% of ₱${monthlySalary.toFixed(2)} (max ₱${bracket.max})`
                    };
                }
            }
        }
        return { amount: 0, basis: 'No PhilHealth premium applicable' };
    }

    // Calculate Pag-IBIG contribution
    calculatePagIbig(monthlySalary) {
        let amount = 0;
        let basis = '';

        if (monthlySalary <= 5000) {
            amount = 100;
            basis = 'Fixed ₱100 for salary ≤ ₱5,000';
        } else {
            amount = 200;
            basis = 'Fixed ₱200 for salary > ₱5,000';
        }

        return { amount, basis };
    }

    // Calculate income tax
    calculateIncomeTax(annualTaxableIncome) {
        let tax = 0;
        let basis = '';

        // Convert monthly to annual if needed
        const annual = annualTaxableIncome * 12;

        for (const bracket of this.taxBrackets) {
            if (annual >= bracket.min && annual < bracket.max) {
                const excessAmount = annual - bracket.min;
                tax = bracket.fixedAmount + (excessAmount * bracket.rate);
                basis = `Annual income ₱${annual.toFixed(2)} in ${bracket.rate * 100}% bracket`;
                break;
            }
        }

        // Convert back to monthly
        const monthlyTax = tax / 12;
        return {
            amount: monthlyTax,
            basis: `${basis} (monthly: ₱${monthlyTax.toFixed(2)})`
        };
    }

    // Calculate taxable income
    calculateTaxableIncome(calculation) {
        // Taxable income = gross pay - non-taxable allowances
        let taxableIncome = calculation.basic_pay;

        // Add taxable allowances
        for (const allowance of calculation.allowances) {
            if (allowance.is_taxable) {
                taxableIncome += allowance.amount;
            }
        }

        return parseFloat(taxableIncome.toFixed(2));
    }

    // Get employee allowance override
    async getEmployeeAllowanceOverride(employeeId, allowanceTypeId) {
        try {
            const result = await EmployeeAllowanceOverride.getActiveOverride(
                employeeId, 
                allowanceTypeId
            );
            return result.success ? result.data : null;
        } catch (error) {
            return null;
        }
    }

    // Get employee deduction override
    async getEmployeeDeductionOverride(employeeId, deductionTypeId) {
        try {
            const result = await EmployeeDeductionOverride.getActiveOverride(
                employeeId, 
                deductionTypeId
            );
            return result.success ? result.data : null;
        } catch (error) {
            return null;
        }
    }

    // Validate calculation inputs
    validateCalculationInputs(employee, calculation) {
        if (!employee || !employee.id) {
            calculation.errors.push('Invalid employee data');
            return false;
        }

        if (!calculation.daily_rate || calculation.daily_rate <= 0) {
            calculation.errors.push('Invalid daily rate');
            return false;
        }

        if (calculation.working_days < 0 || calculation.working_days > 31) {
            calculation.errors.push('Invalid working days (must be 0-31)');
            return false;
        }

        if (this.minimumWage > 0 && calculation.daily_rate < this.minimumWage) {
            calculation.warnings.push(`Daily rate below minimum wage of ₱${this.minimumWage}`);
        }

        return true;
    }

    // Validate calculation results
    validateCalculationResults(calculation) {
        if (calculation.net_pay < 0) {
            calculation.warnings.push('Net pay is negative');
        }

        if (calculation.total_deductions > calculation.gross_pay * 0.5) {
            calculation.warnings.push('Deductions exceed 50% of gross pay');
        }

        if (calculation.gross_pay === 0 && calculation.working_days > 0) {
            calculation.warnings.push('Zero gross pay with positive working days');
        }
    }

    // Bulk calculation for multiple employees
    async calculateBulkPayroll(employees, periodData, employeeWorkingDays = {}, overrides = {}) {
        const results = [];
        const errors = [];

        for (const employee of employees) {
            const workingDays = employeeWorkingDays[employee.id] || this.defaultWorkingDays;
            const employeeOverrides = overrides[employee.id] || {};

            try {
                const result = await this.calculateEmployeePayroll(
                    employee, 
                    periodData, 
                    workingDays, 
                    employeeOverrides
                );

                if (result.success) {
                    results.push(result.data);
                } else {
                    errors.push({
                        employee_id: employee.id,
                        employee_name: `${employee.first_name} ${employee.last_name}`,
                        errors: result.errors || [result.error]
                    });
                }
            } catch (error) {
                errors.push({
                    employee_id: employee.id,
                    employee_name: `${employee.first_name} ${employee.last_name}`,
                    errors: [error.message]
                });
            }
        }

        return {
            success: true,
            data: {
                successful_calculations: results,
                failed_calculations: errors,
                summary: {
                    total_employees: employees.length,
                    successful_count: results.length,
                    failed_count: errors.length,
                    total_gross_pay: results.reduce((sum, calc) => sum + calc.gross_pay, 0),
                    total_net_pay: results.reduce((sum, calc) => sum + calc.net_pay, 0)
                }
            }
        };
    }
}

module.exports = PayrollCalculationEngine;