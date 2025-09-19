// models/PayrollItem.js - Payroll Item model
const { executeQuery, findOne } = require('../../config/database');

class PayrollItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.period_id = data.period_id || null;
        this.employee_id = data.employee_id || null;
        this.basic_pay = data.basic_pay || 0.00;
        this.total_allowances = data.total_allowances || 0.00;
        this.total_deductions = data.total_deductions || 0.00;
        this.gross_pay = data.gross_pay || 0.00;
        this.total_taxes = data.total_taxes || 0.00;
        this.net_pay = data.net_pay || 0.00;
        this.status = data.status || 'draft';
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        this.calculated_at = data.calculated_at || null;
        this.approved_at = data.approved_at || null;
        this.approved_by = data.approved_by || null;
        this.paid_at = data.paid_at || null;
        
        // Additional employee information
        this.employee = data.employee || null;
        this.allowances = data.allowances || [];
        this.deductions = data.deductions || [];
    }

    // Static methods
    static async findByPeriod(periodId, filters = {}) {
        let query = `
            SELECT pi.*, 
                   e.id as employee_id, e.employee_id as employee_employee_id, 
                   e.first_name, e.last_name, e.current_department as department,
                   e.plantilla_position as position
            FROM payroll_items pi
            LEFT JOIN employees e ON pi.employee_id = e.id
            WHERE pi.period_id = ?
        `;
        const params = [periodId];

        if (filters.status) {
            query += ' AND pi.status = ?';
            params.push(filters.status);
        }

        if (filters.search) {
            query += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ?)';
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
                        employee_id: row.employee_employee_id,
                        full_name: `${row.first_name} ${row.last_name}`,
                        department: row.department,
                        position: row.position
                    };
                    return item;
                })
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOne('payroll_items', { id });
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
                    period_id, employee_id, basic_pay, total_allowances, 
                    total_deductions, gross_pay, net_pay, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    basic_pay = VALUES(basic_pay),
                    total_allowances = VALUES(total_allowances),
                    total_deductions = VALUES(total_deductions),
                    gross_pay = VALUES(gross_pay),
                    net_pay = VALUES(net_pay),
                    status = VALUES(status)
            `;
            
            // Basic calculation (this would be enhanced with the PayrollCalculationEngine)
            const basicPay = emp.working_days * 500; // Simplified daily rate
            const grossPay = basicPay;
            const netPay = grossPay;
            
            const params = [
                periodId, emp.employee_id, basicPay, 0, 0, grossPay, netPay, 'calculated'
            ];
            
            const result = await executeQuery(query, params);
            if (result.success) {
                processedItems.push({
                    employee_id: emp.employee_id,
                    status: 'success'
                });
            }
        }
        
        return {
            success: true,
            data: {
                processed_count: processedItems.length,
                items: processedItems
            }
        };
    }

    static async bulkMarkPaid(itemIds, userId) {
        const query = `
            UPDATE payroll_items 
            SET status = 'paid', paid_at = NOW() 
            WHERE id IN (${itemIds.map(() => '?').join(',')})
        `;
        
        const result = await executeQuery(query, itemIds);
        return {
            success: result.success,
            data: { updated_count: result.success ? result.data.affectedRows : 0 }
        };
    }
}

module.exports = PayrollItem;
