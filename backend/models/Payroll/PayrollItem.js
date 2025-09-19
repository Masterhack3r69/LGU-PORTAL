// models/PayrollItem.js - Payroll Item model
const { executeQuery, findOne, findOneByTable } = require('../../config/database');

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
        // Simplified bulk processing
        const processedItems = [];
        
        for (const emp of employees) {
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
            
            // Basic calculation (this would be enhanced with the PayrollCalculationEngine)
            const workingDays = emp.working_days || 22;
            const dailyRate = 500; // Simplified daily rate - should come from employee data
            const basicPay = workingDays * dailyRate;
            const totalAllowances = 0; // Would be calculated based on allowance types
            const totalDeductions = 0; // Would be calculated based on deduction types
            const grossPay = basicPay + totalAllowances;
            const netPay = grossPay - totalDeductions;
            
            const params = [
                periodId, emp.employee_id, workingDays, dailyRate,
                basicPay, totalAllowances, totalDeductions, grossPay, 
                netPay, 'Processed', userId
            ];
            
            const result = await executeQuery(query, params);
            if (result.success) {
                processedItems.push({
                    employee_id: emp.employee_id,
                    status: 'success'
                });
            } else {
                processedItems.push({
                    employee_id: emp.employee_id,
                    status: 'error',
                    error: result.error
                });
            }
        }
        
        return {
            success: true,
            data: {
                processed_count: processedItems.filter(item => item.status === 'success').length,
                items: processedItems
            }
        };
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
}

module.exports = PayrollItem;
