// models/PayrollPeriod.js - Payroll Period model
const { executeQuery, findOne, findOneByTable, executeTransaction } = require('../../config/database');

class PayrollPeriod {
    constructor(data = {}) {
        this.id = data.id || null;
        this.year = data.year || null;
        this.month = data.month || null;
        this.period_number = data.period_number || null;
        this.start_date = data.start_date || null;
        this.end_date = data.end_date || null;
        this.pay_date = data.pay_date || null;
        this.status = data.status || 'Draft';
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
        return ['Draft', 'Processing'].includes(this.status);
    }

    // Check if period can be finalized
    canFinalize() {
        return this.status === 'Processing';
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
        this.status = 'Completed';
        this.finalized_by = userId;
        // Convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        this.finalized_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        return await this.update();
    }

    // Reopen period
    async reopen() {
        this.status = 'Processing';
        this.finalized_by = null;
        this.finalized_at = null;

        return await this.update();
    }

    // Mark period as paid
    async markAsPaid() {
        this.status = 'Completed';

        return await this.update();
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM payroll_periods WHERE 1=1';
        const params = [];

        // Exclude soft-deleted periods by default
        if (!filters.include_deleted) {
            query += ' AND deleted_at IS NULL';
        }

        // Add filters
        if (filters.year !== undefined && filters.year !== null && filters.year !== '') {
            query += ' AND year = ?';
            params.push(filters.year);
        }

        if (filters.month !== undefined && filters.month !== null && filters.month !== '') {
            query += ' AND month = ?';
            params.push(filters.month);
        }

        if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY year DESC, month DESC, period_number DESC';

        // Add pagination using string interpolation for LIMIT (MySQL doesn't support LIMIT with bound parameters)
        if (filters.limit) {
            const limit = Math.max(1, Math.min(1000, parseInt(filters.limit) || 20)); // Sanitize limit
            const offset = Math.max(0, parseInt(filters.offset) || 0); // Sanitize offset
            
            if (offset > 0) {
                query += ` LIMIT ${offset}, ${limit}`;
            } else {
                query += ` LIMIT ${limit}`;
            }
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            // For each period, get the aggregated data from payroll_items
            const periodsWithStats = await Promise.all(
                result.data.map(async (row) => {
                    const period = new PayrollPeriod(row);
                    
                    // Get aggregated data for this period
                    const statsQuery = `
                        SELECT 
                            COUNT(pi.id) as total_items,
                            COALESCE(SUM(pi.basic_pay), 0) as total_basic_pay,
                            COALESCE(SUM(pi.total_allowances), 0) as total_allowances,
                            COALESCE(SUM(pi.total_deductions), 0) as total_deductions,
                            COALESCE(SUM(pi.net_pay), 0) as total_net_pay
                        FROM payroll_items pi
                        WHERE pi.payroll_period_id = ?
                    `;
                    
                    const statsResult = await executeQuery(statsQuery, [period.id]);
                    if (statsResult.success && statsResult.data.length > 0) {
                        const stats = statsResult.data[0];
                        period.total_items = stats.total_items;
                        period.total_basic_pay = stats.total_basic_pay;
                        period.total_allowances = stats.total_allowances;
                        period.total_deductions = stats.total_deductions;
                        period.total_net_pay = stats.total_net_pay;
                    }
                    
                    return period;
                })
            );
            
            return {
                success: true,
                data: periodsWithStats
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('payroll_periods', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new PayrollPeriod(result.data)
            };
        }
        return result;
    }

    static async findByPeriod(year, month, periodNumber) {
        const result = await findOneByTable('payroll_periods', { 
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

        if (filters.year !== undefined && filters.year !== null && filters.year !== '') {
            query += ' AND year = ?';
            params.push(filters.year);
        }

        if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
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

    // Soft delete period (only for Completed status)
    static async softDelete(id) {
        try {
            // Check if period exists and is Completed
            const periodResult = await this.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;
            if (period.status !== 'Completed') {
                return {
                    success: false,
                    error: 'Can only soft delete completed periods'
                };
            }

            // Add deleted_at column if it doesn't exist (migration should handle this)
            const query = 'UPDATE payroll_periods SET deleted_at = NOW() WHERE id = ?';
            const result = await executeQuery(query, [id]);

            if (result.success) {
                return {
                    success: true,
                    message: 'Payroll period soft deleted successfully'
                };
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to soft delete payroll period',
                details: error.message
            };
        }
    }

    // Cancel period and revert to Draft (only for Processing status)
    async cancelAndRevert(userId) {
        try {
            // Check if period can be cancelled
            if (this.status !== 'Processing') {
                return {
                    success: false,
                    error: 'Can only cancel periods with Processing status'
                };
            }

            return await executeTransaction(async (connection) => {
                // First, get all payroll item IDs for this period
                const getItemsQuery = 'SELECT id FROM payroll_items WHERE payroll_period_id = ?';
                const itemsResult = await executeQuery(getItemsQuery, [this.id]);
                
                const itemIds = itemsResult.success && itemsResult.data.length > 0 
                    ? itemsResult.data.map(item => item.id) 
                    : [];

                // Delete payroll item lines first (if any items exist)
                if (itemIds.length > 0) {
                    const deleteLinesQuery = `DELETE FROM payroll_item_lines WHERE payroll_item_id IN (${itemIds.join(',')})`;
                    await executeQuery(deleteLinesQuery);
                }

                // Delete all payroll items for this period
                const deleteItemsQuery = 'DELETE FROM payroll_items WHERE payroll_period_id = ?';
                const deleteResult = await executeQuery(deleteItemsQuery, [this.id]);

                if (!deleteResult.success) {
                    throw new Error('Failed to delete payroll items');
                }

                // Delete DTR records for this period (so they can be re-imported)
                const deleteDTRQuery = 'DELETE FROM dtr_records WHERE payroll_period_id = ?';
                const dtrDeleteResult = await executeQuery(deleteDTRQuery, [this.id]);

                // Revert period status to Draft
                this.status = 'Draft';
                this.finalized_by = null;
                this.finalized_at = null;

                const updateResult = await this.update();
                if (!updateResult.success) {
                    throw new Error('Failed to update period status');
                }

                return {
                    success: true,
                    data: {
                        period_id: this.id,
                        deleted_items: deleteResult.data.affectedRows || 0,
                        deleted_dtr_records: dtrDeleteResult.success ? (dtrDeleteResult.data.affectedRows || 0) : 0,
                        new_status: this.status
                    },
                    message: 'Payroll period cancelled and reverted to Draft successfully'
                };
            });
        } catch (error) {
            return {
                success: false,
                error: 'Failed to cancel and revert payroll period',
                details: error.message
            };
        }
    }

    static async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM payroll_periods',
            'SELECT COUNT(*) as draft FROM payroll_periods WHERE status = "Draft"',
            'SELECT COUNT(*) as processing FROM payroll_periods WHERE status = "Processing"',
            'SELECT COUNT(*) as completed FROM payroll_periods WHERE status = "Completed"',
            'SELECT COUNT(*) as paid FROM payroll_periods WHERE status = "Paid"',
            `SELECT 
                COALESCE(SUM(pi.net_pay), 0) as total_net_pay,
                COALESCE(SUM(pi.basic_pay), 0) as total_basic_pay,
                COALESCE(SUM(pi.total_allowances), 0) as total_allowances,
                COALESCE(SUM(pi.total_deductions), 0) as total_deductions
             FROM payroll_periods pp
             LEFT JOIN payroll_items pi ON pp.id = pi.payroll_period_id
             WHERE pp.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`
        ];

        try {
            const results = await Promise.all(queries.map(query => executeQuery(query)));
            
            if (results.every(result => result.success)) {
                return {
                    success: true,
                    data: {
                        total_periods: results[0].data[0].total,
                        draft_periods: results[1].data[0].draft,
                        processing_periods: results[2].data[0].processing,
                        completed_periods: results[3].data[0].completed,
                        paid_periods: results[4].data[0].paid,
                        yearly_totals: results[5].data[0]
                    }
                };
            }

            return {
                success: false,
                error: 'Failed to retrieve statistics'
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to retrieve statistics',
                details: error.message
            };
        }
    }

    static async getCurrentPeriod() {
        const query = `
            SELECT * FROM payroll_periods 
            WHERE status IN ('Draft', 'Processing') 
            ORDER BY year DESC, month DESC, period_number DESC 
            LIMIT 1
        `;
        
        const result = await executeQuery(query);
        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: new PayrollPeriod(result.data[0])
            };
        }
        
        return {
            success: false,
            error: 'No active payroll period found'
        };
    }
}

module.exports = PayrollPeriod;
