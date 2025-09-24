// services/compensationBenefitService.js - Compensation & Benefits calculation service
const { executeQuery, findOne, executeTransaction } = require('../config/database');
const Employee = require('../models/Employee');
const CompensationBenefit = require('../models/CompensationBenefit');

class CompensationBenefitService {
    constructor() {
        // Benefit calculation constants
        this.CONSTANTS = {
            TLB_FACTOR: 1.0, // Terminal Leave Benefit factor
            PBB_PERCENT: 1.0, // Performance-Based Bonus (100% of annual salary)
            GSIS_PERCENT: 0.09, // GSIS contribution percentage
            DEFAULT_WORKING_DAYS: 22, // Default working days per month
            LOYALTY_BASE_AMOUNT: 10000, // Base loyalty award amount
            LOYALTY_INCREMENT: 5000, // Additional amount per 5-year increment
            LOYALTY_BASE_YEARS: 10, // Minimum years for loyalty award
            LOYALTY_INCREMENT_YEARS: 5 // Years increment for additional amount
        };
    }

    // Calculate Terminal Leave Benefit
    async calculateTerminalLeave(employeeId) {
        try {
            // Get employee data
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;

            // Get unused leave balance (assuming vacation leave type ID = 1)
            const leaveBalanceQuery = `
                SELECT current_balance 
                FROM employee_leave_balances 
                WHERE employee_id = ? AND leave_type_id = 1 AND year = YEAR(CURDATE())
            `;
            
            const balanceResult = await findOne(leaveBalanceQuery, [employeeId]);
            if (!balanceResult.success) {
                return { success: false, error: 'Failed to get leave balance' };
            }

            const unusedLeave = balanceResult.data ? parseFloat(balanceResult.data.current_balance) : 0;
            const highestSalary = parseFloat(employee.highest_monthly_salary) || parseFloat(employee.current_monthly_salary) || 0;
            
            if (highestSalary <= 0) {
                return { success: false, error: 'Employee salary information not available' };
            }

            const dailyRate = highestSalary / this.CONSTANTS.DEFAULT_WORKING_DAYS;
            const amount = unusedLeave * dailyRate * this.CONSTANTS.TLB_FACTOR;

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'TERMINAL_LEAVE',
                    days_used: unusedLeave,
                    amount: parseFloat(amount.toFixed(2)),
                    calculation_details: {
                        unused_leave: unusedLeave,
                        highest_salary: highestSalary,
                        daily_rate: parseFloat(dailyRate.toFixed(2)),
                        tlb_factor: this.CONSTANTS.TLB_FACTOR
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate terminal leave benefit',
                details: error.message
            };
        }
    }

    // Calculate Monetization
    async calculateMonetization(employeeId, daysToMonetize) {
        try {
            // Get employee data
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;

            // Get current leave balance
            const leaveBalanceQuery = `
                SELECT current_balance 
                FROM employee_leave_balances 
                WHERE employee_id = ? AND leave_type_id = 1 AND year = YEAR(CURDATE())
            `;
            
            const balanceResult = await findOne(leaveBalanceQuery, [employeeId]);
            if (!balanceResult.success) {
                return { success: false, error: 'Failed to get leave balance' };
            }

            const currentBalance = balanceResult.data ? parseFloat(balanceResult.data.current_balance) : 0;
            
            if (daysToMonetize > currentBalance) {
                return { 
                    success: false, 
                    error: `Insufficient leave balance. Available: ${currentBalance} days, Requested: ${daysToMonetize} days` 
                };
            }

            const monthlySalary = parseFloat(employee.current_monthly_salary) || 0;
            if (monthlySalary <= 0) {
                return { success: false, error: 'Employee salary information not available' };
            }

            const dailyRate = monthlySalary / this.CONSTANTS.DEFAULT_WORKING_DAYS;
            const amount = daysToMonetize * dailyRate;

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'MONETIZATION',
                    days_used: daysToMonetize,
                    amount: parseFloat(amount.toFixed(2)),
                    calculation_details: {
                        current_balance: currentBalance,
                        days_to_monetize: daysToMonetize,
                        monthly_salary: monthlySalary,
                        daily_rate: parseFloat(dailyRate.toFixed(2))
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate monetization',
                details: error.message
            };
        }
    }

    // Calculate Performance-Based Bonus (PBB)
    async calculatePBB(employeeId) {
        try {
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;
            const monthlySalary = parseFloat(employee.current_monthly_salary) || 0;
            
            if (monthlySalary <= 0) {
                return { success: false, error: 'Employee salary information not available' };
            }

            const amount = monthlySalary * 12 * this.CONSTANTS.PBB_PERCENT;

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'PBB',
                    days_used: null,
                    amount: parseFloat(amount.toFixed(2)),
                    calculation_details: {
                        monthly_salary: monthlySalary,
                        pbb_percent: this.CONSTANTS.PBB_PERCENT,
                        annual_salary: monthlySalary * 12
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate PBB',
                details: error.message
            };
        }
    }

    // Calculate 13th Month Bonus (Mid-Year)
    async calculateMidYearBonus(employeeId) {
        try {
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;
            const monthlySalary = parseFloat(employee.current_monthly_salary) || 0;
            
            if (monthlySalary <= 0) {
                return { success: false, error: 'Employee salary information not available' };
            }

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'MID_YEAR_BONUS',
                    days_used: null,
                    amount: parseFloat(monthlySalary.toFixed(2)),
                    calculation_details: {
                        monthly_salary: monthlySalary
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate mid-year bonus',
                details: error.message
            };
        }
    }

    // Calculate 14th Month Bonus (Year-End)
    async calculateYearEndBonus(employeeId) {
        try {
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;
            const monthlySalary = parseFloat(employee.current_monthly_salary) || 0;
            
            if (monthlySalary <= 0) {
                return { success: false, error: 'Employee salary information not available' };
            }

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'YEAR_END_BONUS',
                    days_used: null,
                    amount: parseFloat(monthlySalary.toFixed(2)),
                    calculation_details: {
                        monthly_salary: monthlySalary
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate year-end bonus',
                details: error.message
            };
        }
    }

    // Calculate GSIS Contribution
    async calculateGSIS(employeeId) {
        try {
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;
            const monthlySalary = parseFloat(employee.current_monthly_salary) || 0;
            
            if (monthlySalary <= 0) {
                return { success: false, error: 'Employee salary information not available' };
            }

            const amount = monthlySalary * this.CONSTANTS.GSIS_PERCENT;

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'GSIS',
                    days_used: null,
                    amount: parseFloat(amount.toFixed(2)),
                    calculation_details: {
                        monthly_salary: monthlySalary,
                        gsis_percent: this.CONSTANTS.GSIS_PERCENT
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate GSIS contribution',
                details: error.message
            };
        }
    }

    // Calculate Loyalty Award
    async calculateLoyaltyAward(employeeId) {
        try {
            const employeeResult = await Employee.findById(employeeId);
            if (!employeeResult.success || !employeeResult.data) {
                return { success: false, error: 'Employee not found' };
            }

            const employee = employeeResult.data;
            const appointmentDate = new Date(employee.appointment_date);
            const currentDate = new Date();
            
            // Calculate years of service
            const yearsOfService = Math.floor((currentDate - appointmentDate) / (365.25 * 24 * 60 * 60 * 1000));
            
            if (yearsOfService < this.CONSTANTS.LOYALTY_BASE_YEARS) {
                return {
                    success: false,
                    error: `Employee not eligible for loyalty award. Minimum ${this.CONSTANTS.LOYALTY_BASE_YEARS} years required, current: ${yearsOfService} years`
                };
            }

            // Calculate loyalty award amount
            const additionalYears = Math.floor((yearsOfService - this.CONSTANTS.LOYALTY_BASE_YEARS) / this.CONSTANTS.LOYALTY_INCREMENT_YEARS);
            const amount = this.CONSTANTS.LOYALTY_BASE_AMOUNT + (additionalYears * this.CONSTANTS.LOYALTY_INCREMENT);

            return {
                success: true,
                data: {
                    employee_id: employeeId,
                    benefit_type: 'LOYALTY',
                    days_used: null,
                    amount: parseFloat(amount.toFixed(2)),
                    calculation_details: {
                        years_of_service: yearsOfService,
                        base_amount: this.CONSTANTS.LOYALTY_BASE_AMOUNT,
                        additional_increments: additionalYears,
                        increment_amount: this.CONSTANTS.LOYALTY_INCREMENT
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate loyalty award',
                details: error.message
            };
        }
    }

    // Bulk calculate benefits for multiple employees
    async bulkCalculateBenefit(benefitType, employeeIds, options = {}) {
        try {
            const results = [];
            
            for (const employeeId of employeeIds) {
                let calculation;
                
                switch (benefitType) {
                    case 'PBB':
                        calculation = await this.calculatePBB(employeeId);
                        break;
                    case 'MID_YEAR_BONUS':
                        calculation = await this.calculateMidYearBonus(employeeId);
                        break;
                    case 'YEAR_END_BONUS':
                        calculation = await this.calculateYearEndBonus(employeeId);
                        break;
                    case 'GSIS':
                        calculation = await this.calculateGSIS(employeeId);
                        break;
                    case 'LOYALTY':
                        calculation = await this.calculateLoyaltyAward(employeeId);
                        break;
                    case 'MONETIZATION':
                        if (!options.daysToMonetize || !options.daysToMonetize[employeeId]) {
                            calculation = { success: false, error: 'Days to monetize not specified' };
                        } else {
                            calculation = await this.calculateMonetization(employeeId, options.daysToMonetize[employeeId]);
                        }
                        break;
                    default:
                        calculation = { success: false, error: 'Invalid benefit type' };
                }
                
                results.push({
                    employee_id: employeeId,
                    calculation: calculation
                });
            }
            
            return {
                success: true,
                data: results
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to bulk calculate benefits',
                details: error.message
            };
        }
    }

    // Process monetization and update leave balances
    async processMonetization(employeeId, daysToMonetize, processedBy, notes = '') {
        return await executeTransaction(async (connection) => {
            // Calculate monetization
            const calculation = await this.calculateMonetization(employeeId, daysToMonetize);
            if (!calculation.success) {
                throw new Error(calculation.error);
            }

            // Create compensation benefit record
            const benefitRecord = new CompensationBenefit({
                ...calculation.data,
                notes: notes,
                processed_by: processedBy
            });

            const query = `
                INSERT INTO comp_benefit_records (
                    employee_id, benefit_type, days_used, amount, notes, processed_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const params = [
                benefitRecord.employee_id,
                benefitRecord.benefit_type,
                benefitRecord.days_used,
                benefitRecord.amount,
                benefitRecord.notes,
                benefitRecord.processed_by
            ];

            const [result] = await connection.execute(query, params);

            // Update leave balance
            const updateBalanceQuery = `
                UPDATE employee_leave_balances 
                SET current_balance = current_balance - ?,
                    monetized_days = monetized_days + ?
                WHERE employee_id = ? AND leave_type_id = 1 AND year = YEAR(CURDATE())
            `;

            await connection.execute(updateBalanceQuery, [daysToMonetize, daysToMonetize, employeeId]);

            return {
                id: result.insertId,
                ...calculation.data,
                processed_by: processedBy
            };
        });
    }

    // Get employees eligible for specific benefits
    async getEligibleEmployees(benefitType) {
        try {
            let query = `
                SELECT e.id, e.employee_number, 
                       CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as full_name,
                       e.current_monthly_salary, e.appointment_date, e.employment_status
                FROM employees e
                WHERE e.employment_status = 'Active' AND e.deleted_at IS NULL
            `;

            // Add specific eligibility criteria based on benefit type
            if (benefitType === 'LOYALTY') {
                query += ` AND DATEDIFF(CURDATE(), e.appointment_date) >= ${this.CONSTANTS.LOYALTY_BASE_YEARS * 365}`;
            }

            query += ' ORDER BY e.last_name, e.first_name';

            const result = await executeQuery(query);
            return result;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get eligible employees',
                details: error.message
            };
        }
    }
}

module.exports = CompensationBenefitService;