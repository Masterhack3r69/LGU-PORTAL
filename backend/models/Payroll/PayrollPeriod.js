// models/PayrollPeriod.js - Payroll Period model
const { executeQuery, findOne, executeTransaction } = require('../../config/database');

class PayrollPeriod {
    constructor(data = {}) {
        this.id = data.id || null;
        this.year = data.year || null;
        this.month = data.month || null;
        this.period_number = data.period_number || null;
        this.start_date = data.start_date || null;
        this.end_date = data.end_date || null;
        this.pay_date = data.pay_date || null;
        this.status = data.status || 'open';
        this.created_by = data.created_by || null;
        this.finalized_by = data.finalized_by || null;
        this.finalized_at = data.finalized_at || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        
        // Additional computed properties
        this.employee_count = data.employee_count || 0;
        this.total_items = data.total_items || 0;
        this.total_basic_pay = data.total_basic_pay || 0;
        this.total_allowances = data.total_allowances || 0;
        this.total_deductions = data.total_deductions || 0;
        this.total_net_pay = data.total_net_pay || 0;
    }

    // Get period display name
    getPeriodName() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[this.month - 1] || 'Unknown';
        const suffix = this.period_number === 1 ? '1st Half' : '2nd Half';
        return `${monthName} ${this.year} - ${suffix}`;
    }

    // Check if period can be edited
    canEdit() {
        return ['open', 'calculating'].includes(this.status);
    }

    // Check if period can be finalized
    canFinalize() {
        return this.status === 'calculating';
    }

    // Validate payroll period data
    validate() {
        const errors = [];

        if (!this.year || this.year < 2020 || this.year > 2050) {
            errors.push('Valid year (2020-2050) is required');
        }

        if (!this.month || this.month < 1 || this.month > 12) {
            errors.push('Valid month (1-12) is required');
        }

        if (!this.period_number || ![1, 2].includes(this.period_number)) {
            errors.push('Period number must be 1 or 2');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save payroll period
    async save() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }

        try {
            if (this.id) {
                return await this.update();
            } else {
                return await this.create();
            }
        } catch (error) {
            return {
                success: false,
                error: 'Failed to save payroll period',
                details: error.message
            };
        }
    }

    // Create new payroll period
    async create() {
        const query = `
            INSERT INTO payroll_periods (
                year, month, period_number, start_date, end_date, pay_date, 
                status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.year, this.month, this.period_number, this.start_date,
            this.end_date, this.pay_date, this.status, this.created_by
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Payroll period created successfully'
            };
        }

        return result;
    }

    // Update existing payroll period
    async update() {
        const query = `
            UPDATE payroll_periods SET
                year = ?, month = ?, period_number = ?, start_date = ?, 
                end_date = ?, pay_date = ?, status = ?, finalized_by = ?, 
                finalized_at = ?
            WHERE id = ?
        `;

        const params = [
            this.year, this.month, this.period_number, this.start_date,
            this.end_date, this.pay_date, this.status, this.finalized_by,
            this.finalized_at, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Payroll period updated successfully'
            };
        }

        return result;
    }

    // Finalize period
    async finalize(userId) {
        this.status = 'finalized';
        this.finalized_by = userId;
        this.finalized_at = new Date().toISOString();
        
        return await this.update();
    }

    // Reopen period
    async reopen() {
        this.status = 'calculating';
        this.finalized_by = null;
        this.finalized_at = null;
        
        return await this.update();
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = `
            SELECT p.*, 
                   COUNT(pi.id) as total_items,
                   SUM(pi.basic_pay) as total_basic_pay,
                   SUM(pi.total_allowances) as total_allowances,
                   SUM(pi.total_deductions) as total_deductions,
                   SUM(pi.net_pay) as total_net_pay
            FROM payroll_periods p
            LEFT JOIN payroll_items pi ON p.id = pi.period_id
            WHERE 1=1
        `;
        
        const params = [];

        if (filters.year) {
            query += ' AND p.year = ?';
            params.push(filters.year);
        }

        if (filters.month) {
            query += ' AND p.month = ?';
            params.push(filters.month);
        }

        if (filters.status) {
            query += ' AND p.status = ?';
            params.push(filters.status);
        }

        query += ' GROUP BY p.id ORDER BY p.year DESC, p.month DESC, p.period_number DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new PayrollPeriod(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOne('payroll_periods', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new PayrollPeriod(result.data)
            };
        }
        return result;
    }

    static async findByPeriod(year, month, periodNumber) {
        const result = await findOne('payroll_periods', { 
            year, 
            month, 
            period_number: periodNumber 
        });
        if (result.success && result.data) {
            return {
                success: true,
                data: new PayrollPeriod(result.data)
            };
        }
        return result;
    }

    static async getCount(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM payroll_periods WHERE 1=1';
        const params = [];

        if (filters.year) {
            query += ' AND year = ?';
            params.push(filters.year);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        const result = await executeQuery(query, params);
        return result.success ? result.data[0].count : 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM payroll_periods WHERE id = ?';
        return await executeQuery(query, [id]);
    }
}

module.exports = PayrollPeriod;