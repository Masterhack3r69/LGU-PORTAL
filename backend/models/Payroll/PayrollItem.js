// models/PayrollItem.js - Payroll Item model
const { executeQuery, findOne, findOneByTable } = require('../../config/database');
const PayrollCalculationEngine = require('../../utils/payrollCalculations');

class PayrollItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.payroll_period_id = data.payroll_period_id || data.period_id || null;
        this.employee_id = data.employee_id || null;
        this.working_days = data.working_days || 22.00;
        this.daily_rate = data.daily_rate || 0.00;
        this.basic_pay = data.basic_pay || 0.00;
        this.total_allowances = data.total_allowances || 0.00;
        this.total_deductions = data.total_deductions || 0.00;
        this.gross_pay = data.gross_pay || 0.00;
        this.net_pay = data.net_pay || 0.00;
        this.status = data.status || 'Draft';
        this.processed_by = data.processed_by || null;
        this.processed_at = data.processed_at || null;
        this.paid_by = data.paid_by || null;
        this.paid_at = data.paid_at || null;
        this.notes = data.notes || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        
        // Additional employee information
        this.employee = data.employee || null;
        this.allowances = data.allowances || [];
        this.deductions = data.deductions || [];
    }

    // Static methods
    static async findByPeriod(periodId, filters = {}) {
        let query = `
            SELECT pi.*, 
                   e.id as employee_id, e.employee_number as employee_number, 
                   e.first_name, e.last_name, e.plantilla_position as position
            FROM payroll_items pi
            LEFT JOIN employees e ON pi.employee_id = e.id
            WHERE pi.payroll_period_id = ?
        `;
        const params = [periodId];

        if (filters.status) {
            query += ' AND pi.status = ?';
            params.push(filters.status);
        }

        if (filters.search) {
            query += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_number LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY e.last_name, e.first_name';

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => {
                    const item = new PayrollItem(row);
                    item.employee = {
                        id: row.employee_id,
                        employee_number: row.employee_number,
                        full_name: `${row.first_name} ${row.last_name}`,
                        position: row.position
                    };
                    return item;
                })
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('payroll_items', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new PayrollItem(result.data)
            };
        }
        return result;
    }

    static async bulkProcess(periodId, employees, userId) {
        const calculationEngine = new PayrollCalculationEngine();
        const processedItems = [];

        try {
            // Get period data for calculations
            const PayrollPeriod = require('./PayrollPeriod');
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }
            const periodData = periodResult.data;

            // Get employee overrides for this period
            const { EmployeeOverride } = require('./EmployeeOverride');
            const employeeOverrides = {};

            for (const emp of employees) {
                const overrides = await EmployeeOverride.getActiveOverridesForEmployee(emp.employee_id);
                if (overrides.success && overrides.data.length > 0) {
                    employeeOverrides[emp.employee_id] = {
                        allowances: {},
                        deductions: {}
                    };

                    overrides.data.forEach(override => {
                        if (override.override_type === 'allowance') {
                            employeeOverrides[emp.employee_id].allowances[override.allowance_type_id] = override.override_amount;
                        } else if (override.override_type === 'deduction') {
                            employeeOverrides[emp.employee_id].deductions[override.deduction_type_id] = override.override_amount;
                        }
                    });
                }
            }

            // Process each employee
            for (const emp of employees) {
                try {
                    // Get complete employee data
                    const Employee = require('../Employee');
                    const employeeResult = await Employee.findById(emp.employee_id);
                    if (!employeeResult.success || !employeeResult.data) {
                        processedItems.push({
                            employee_id: emp.employee_id,
                            status: 'error',
                            error: 'Employee not found'
                        });
                        continue;
                    }

                    const employee = employeeResult.data;
                    const workingDays = emp.working_days || 22;
                    const overrides = employeeOverrides[emp.employee_id] || {};

                    // Calculate payroll using the advanced engine
                    const calculationResult = await calculationEngine.calculateEmployeePayroll(
                        employee,
                        periodData,
                        workingDays,
                        overrides
                    );

                    if (!calculationResult.success) {
                        processedItems.push({
                            employee_id: emp.employee_id,
                            status: 'error',
                            error: calculationResult.error,
                            details: calculationResult.details
                        });
                        continue;
                    }

                    const calculation = calculationResult.data;

                    // Insert or update payroll item with calculated values
                    const query = `
                        INSERT INTO payroll_items (
                            payroll_period_id, employee_id, working_days, daily_rate,
                            basic_pay, total_allowances, total_deductions, gross_pay,
                            net_pay, status, processed_by, processed_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            working_days = VALUES(working_days),
                            daily_rate = VALUES(daily_rate),
                            basic_pay = VALUES(basic_pay),
                            total_allowances = VALUES(total_allowances),
                            total_deductions = VALUES(total_deductions),
                            gross_pay = VALUES(gross_pay),
                            net_pay = VALUES(net_pay),
                            status = VALUES(status),
                            processed_by = VALUES(processed_by),
                            processed_at = VALUES(processed_at)
                    `;

                    const params = [
                        periodId, emp.employee_id, calculation.working_days, calculation.daily_rate,
                        calculation.basic_pay, calculation.total_allowances, calculation.total_deductions,
                        calculation.gross_pay, calculation.net_pay, 'Processed', userId
                    ];

                    const result = await executeQuery(query, params);
                    if (result.success) {
                        processedItems.push({
                            employee_id: emp.employee_id,
                            status: 'success',
                            calculation_summary: {
                                basic_pay: calculation.basic_pay,
                                total_allowances: calculation.total_allowances,
                                total_deductions: calculation.total_deductions,
                                gross_pay: calculation.gross_pay,
                                net_pay: calculation.net_pay
                            }
                        });
                    } else {
                        processedItems.push({
                            employee_id: emp.employee_id,
                            status: 'error',
                            error: result.error
                        });
                    }

                } catch (error) {
                    console.error(`Error processing employee ${emp.employee_id}:`, error);
                    processedItems.push({
                        employee_id: emp.employee_id,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                data: {
                    processed_count: processedItems.filter(item => item.status === 'success').length,
                    failed_count: processedItems.filter(item => item.status === 'error').length,
                    items: processedItems
                }
            };

        } catch (error) {
            console.error('Bulk processing error:', error);
            return {
                success: false,
                error: 'Bulk processing failed',
                details: error.message
            };
        }
    }

    static async bulkMarkPaid(itemIds, userId) {
        const query = `
            UPDATE payroll_items 
            SET status = 'Paid', paid_by = ?, paid_at = NOW() 
            WHERE id IN (${itemIds.map(() => '?').join(',')})
        `;
        
        const result = await executeQuery(query, [userId, ...itemIds]);
        return {
            success: result.success,
            data: { updated_count: result.success ? result.data.affectedRows : 0 }
        };
    }

    // Instance methods
    canEdit() {
        // Check if the payroll item can be edited based on its status
        const editableStatuses = ['Draft', 'Calculated', 'Processing', 'Processed'];
        return editableStatuses.includes(this.status);
    }

    async update() {
        const query = `
            UPDATE payroll_items 
            SET working_days = ?, daily_rate = ?, basic_pay = ?, 
                total_allowances = ?, total_deductions = ?, 
                gross_pay = ?, net_pay = ?, status = ?, 
                processed_by = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const params = [
            this.working_days, this.daily_rate, this.basic_pay,
            this.total_allowances, this.total_deductions,
            this.gross_pay, this.net_pay, this.status,
            this.processed_by, this.notes, this.id
        ];
        
        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this
            };
        }
        return result;
    }

    async recalculate() {
        const calculationEngine = new PayrollCalculationEngine();
        
        try {
            // Get employee data
            const Employee = require('../Employee');
            const employeeResult = await Employee.findById(this.employee_id);
            if (!employeeResult.success || !employeeResult.data) {
                return {
                    success: false,
                    error: 'Employee not found'
                };
            }
            
            const employee = employeeResult.data;
            
            // Get period data
            const PayrollPeriod = require('./PayrollPeriod');
            const periodResult = await PayrollPeriod.findById(this.payroll_period_id);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }
            
            const period = periodResult.data;
            
            // Calculate payroll
            const calculationResult = await calculationEngine.calculateEmployeePayroll(
                employee,
                period,
                this.working_days
            );
            
            if (!calculationResult.success) {
                return calculationResult;
            }
            
            const calculation = calculationResult.data;
            
            // Update this instance with calculated values
            this.daily_rate = calculation.daily_rate;
            this.basic_pay = calculation.basic_pay;
            this.total_allowances = calculation.total_allowances;
            this.total_deductions = calculation.total_deductions;
            this.gross_pay = calculation.gross_pay;
            this.net_pay = calculation.net_pay;
            
            // Save to database
            return await this.update();
            
        } catch (error) {
            console.error('Recalculation error:', error);
            return {
                success: false,
                error: 'Recalculation failed',
                details: error.message
            };
        }
    }

    updateCalculatedAmounts() {
        this.gross_pay = this.basic_pay + this.total_allowances;
        this.net_pay = this.gross_pay - this.total_deductions;
    }

    async finalize() {
        if (this.status !== 'Processed') {
            return {
                success: false,
                error: 'Can only finalize processed payroll items'
            };
        }
        
        this.status = 'Finalized';
        return await this.update();
    }

    async markAsPaid(userId) {
        if (this.status !== 'Finalized') {
            return {
                success: false,
                error: 'Can only mark finalized payroll items as paid'
            };
        }
        
        this.status = 'Paid';
        this.paid_by = userId;
        // Convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        this.paid_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        return await this.update();
    }
}

module.exports = PayrollItem;
