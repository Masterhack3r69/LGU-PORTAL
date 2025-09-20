// models/BenefitItem.js - Benefit Item model for storing calculated benefit records
const { executeQuery, findOne, findOneByTable, executeTransaction } = require('../config/database');

class BenefitItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.benefit_cycle_id = data.benefit_cycle_id || null;
        this.employee_id = data.employee_id || null;
        this.working_days = data.working_days || null;
        this.basic_salary = data.basic_salary || null;
        this.calculated_amount = data.calculated_amount || 0;
        this.final_amount = data.final_amount || 0;
        this.status = data.status || 'Draft';
        this.calculation_details = data.calculation_details || null;
        this.adjustment_reason = data.adjustment_reason || null;
        this.is_eligible = data.is_eligible !== undefined ? data.is_eligible : true;
        this.eligibility_notes = data.eligibility_notes || null;
        this.processed_by = data.processed_by || null;
        this.processed_at = data.processed_at || null;
        this.approved_by = data.approved_by || null;
        this.approved_at = data.approved_at || null;
        this.paid_by = data.paid_by || null;
        this.paid_at = data.paid_at || null;
        this.payment_reference = data.payment_reference || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;

        // Additional computed properties
        this.employee_name = data.employee_name || null;
        this.employee_number = data.employee_number || null;
        this.cycle_name = data.cycle_name || null;
        this.compensation_type_name = data.compensation_type_name || null;
    }

    // Validate benefit item data
    validate() {
        const errors = [];

        if (!this.benefit_cycle_id) {
            errors.push('Benefit cycle is required');
        }

        if (!this.employee_id) {
            errors.push('Employee is required');
        }

        if (!this.status || !['Draft', 'Calculated', 'Adjusted', 'Approved', 'Paid', 'Cancelled'].includes(this.status)) {
            errors.push('Valid status is required');
        }

        if (this.calculated_amount < 0) {
            errors.push('Calculated amount cannot be negative');
        }

        if (this.final_amount < 0) {
            errors.push('Final amount cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if item can be edited
    canEdit() {
        return ['Draft', 'Calculated', 'Adjusted'].includes(this.status);
    }

    // Check if item can be approved
    canApprove() {
        return ['Calculated', 'Adjusted'].includes(this.status);
    }

    // Check if item can be paid
    canPay() {
        return this.status === 'Approved';
    }

    // Calculate adjustment
    calculateAdjustment(newAmount, reason) {
        this.final_amount = newAmount;
        this.adjustment_reason = reason;
        this.status = 'Adjusted';
    }

    // Save benefit item
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
                error: 'Failed to save benefit item',
                details: error.message
            };
        }
    }

    // Create new benefit item
    async create() {
        const query = `
            INSERT INTO benefit_items (
                benefit_cycle_id, employee_id, working_days, basic_salary, calculated_amount,
                final_amount, status, calculation_details, adjustment_reason, is_eligible,
                eligibility_notes, processed_by, processed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.benefit_cycle_id, this.employee_id, this.working_days, this.basic_salary,
            this.calculated_amount, this.final_amount, this.status, this.calculation_details,
            this.adjustment_reason, this.is_eligible, this.eligibility_notes,
            this.processed_by, this.processed_at
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Benefit item created successfully'
            };
        }

        return result;
    }

    // Update existing benefit item
    async update() {
        const query = `
            UPDATE benefit_items SET
                working_days = ?, basic_salary = ?, calculated_amount = ?, final_amount = ?,
                status = ?, calculation_details = ?, adjustment_reason = ?, is_eligible = ?,
                eligibility_notes = ?, processed_by = ?, processed_at = ?, approved_by = ?,
                approved_at = ?, paid_by = ?, paid_at = ?, payment_reference = ?
            WHERE id = ?
        `;

        const params = [
            this.working_days, this.basic_salary, this.calculated_amount, this.final_amount,
            this.status, this.calculation_details, this.adjustment_reason, this.is_eligible,
            this.eligibility_notes, this.processed_by, this.processed_at, this.approved_by,
            this.approved_at, this.paid_by, this.paid_at, this.payment_reference, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit item updated successfully'
            };
        }

        return result;
    }

    // Approve benefit item
    async approve(userId) {
        this.status = 'Approved';
        this.approved_by = userId;
        this.approved_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        return await this.update();
    }

    // Pay benefit item
    async pay(userId, paymentReference = null) {
        this.status = 'Paid';
        this.paid_by = userId;
        this.paid_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.payment_reference = paymentReference;

        return await this.update();
    }

    // Cancel benefit item
    async cancel() {
        this.status = 'Cancelled';

        return await this.update();
    }

    // Mark as ineligible
    async markIneligible(reason) {
        this.is_eligible = false;
        this.eligibility_notes = reason;
        this.status = 'Draft';

        return await this.update();
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM benefit_items WHERE 1=1';
        const params = [];

        if (filters.benefit_cycle_id) {
            query += ' AND benefit_cycle_id = ?';
            params.push(filters.benefit_cycle_id);
        }

        if (filters.employee_id) {
            query += ' AND employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.is_eligible !== undefined) {
            query += ' AND is_eligible = ?';
            params.push(filters.is_eligible);
        }

        if (filters.processed_by) {
            query += ' AND processed_by = ?';
            params.push(filters.processed_by);
        }

        if (filters.approved_by) {
            query += ' AND approved_by = ?';
            params.push(filters.approved_by);
        }

        query += ' ORDER BY created_at DESC';

        // Handle pagination
        if (filters.limit) {
            const limit = Math.max(1, Math.min(1000, parseInt(filters.limit) || 20));
            const offset = Math.max(0, parseInt(filters.offset) || 0);

            if (offset > 0) {
                query += ` LIMIT ${offset}, ${limit}`;
            } else {
                query += ` LIMIT ${limit}`;
            }
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new BenefitItem(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('benefit_items', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitItem(result.data)
            };
        }
        return result;
    }

    static async findByCycleAndEmployee(benefitCycleId, employeeId) {
        const result = await findOneByTable('benefit_items', {
            benefit_cycle_id: benefitCycleId,
            employee_id: employeeId
        });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitItem(result.data)
            };
        }
        return result;
    }

    static async getCount(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM benefit_items WHERE 1=1';
        const params = [];

        if (filters.benefit_cycle_id) {
            query += ' AND benefit_cycle_id = ?';
            params.push(filters.benefit_cycle_id);
        }

        if (filters.employee_id) {
            query += ' AND employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.is_eligible !== undefined) {
            query += ' AND is_eligible = ?';
            params.push(filters.is_eligible);
        }

        const result = await executeQuery(query, params);
        return result.success ? result.data[0].count : 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM benefit_items WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    static async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM benefit_items',
            'SELECT COUNT(*) as draft FROM benefit_items WHERE status = "Draft"',
            'SELECT COUNT(*) as calculated FROM benefit_items WHERE status = "Calculated"',
            'SELECT COUNT(*) as adjusted FROM benefit_items WHERE status = "Adjusted"',
            'SELECT COUNT(*) as approved FROM benefit_items WHERE status = "Approved"',
            'SELECT COUNT(*) as paid FROM benefit_items WHERE status = "Paid"',
            'SELECT COUNT(*) as cancelled FROM benefit_items WHERE status = "Cancelled"',
            'SELECT COUNT(*) as eligible FROM benefit_items WHERE is_eligible = 1',
            'SELECT COUNT(*) as ineligible FROM benefit_items WHERE is_eligible = 0',
            `SELECT
                COALESCE(SUM(calculated_amount), 0) as total_calculated,
                COALESCE(SUM(final_amount), 0) as total_final,
                COALESCE(SUM(CASE WHEN status = 'Paid' THEN final_amount ELSE 0 END), 0) as total_paid
             FROM benefit_items
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`
        ];

        try {
            const results = await Promise.all(queries.map(query => executeQuery(query)));

            if (results.every(result => result.success)) {
                return {
                    success: true,
                    data: {
                        total_items: results[0].data[0].total,
                        draft_items: results[1].data[0].draft,
                        calculated_items: results[2].data[0].calculated,
                        adjusted_items: results[3].data[0].adjusted,
                        approved_items: results[4].data[0].approved,
                        paid_items: results[5].data[0].paid,
                        cancelled_items: results[6].data[0].cancelled,
                        eligible_items: results[7].data[0].eligible,
                        ineligible_items: results[8].data[0].ineligible,
                        yearly_totals: results[9].data[0]
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

    // Get benefit items with employee and cycle details
    static async getWithDetails(filters = {}) {
        let query = `
            SELECT
                bi.*,
                e.employee_number,
                CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
                bc.cycle_name,
                bc.year,
                ct.name as compensation_type_name,
                ct.code as compensation_type_code
            FROM benefit_items bi
            JOIN employees e ON bi.employee_id = e.id
            JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
            JOIN compensation_types ct ON bc.compensation_type_id = ct.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.benefit_cycle_id) {
            query += ' AND bi.benefit_cycle_id = ?';
            params.push(filters.benefit_cycle_id);
        }

        if (filters.employee_id) {
            query += ' AND bi.employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.status) {
            query += ' AND bi.status = ?';
            params.push(filters.status);
        }

        if (filters.is_eligible !== undefined) {
            query += ' AND bi.is_eligible = ?';
            params.push(filters.is_eligible);
        }

        if (filters.search) {
            query += ' AND (e.employee_number LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY bi.created_at DESC';

        // Handle pagination
        if (filters.limit) {
            const limit = Math.max(1, Math.min(1000, parseInt(filters.limit) || 20));
            const offset = Math.max(0, parseInt(filters.offset) || 0);

            if (offset > 0) {
                query += ` LIMIT ${offset}, ${limit}`;
            } else {
                query += ` LIMIT ${limit}`;
            }
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new BenefitItem(row))
            };
        }
        return result;
    }

    // Get benefit items by cycle with aggregated data
    static async getByCycleWithAggregates(benefitCycleId) {
        const query = `
            SELECT
                bi.*,
                e.employee_number,
                CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
                e.plantilla_position
            FROM benefit_items bi
            JOIN employees e ON bi.employee_id = e.id
            WHERE bi.benefit_cycle_id = ?
            ORDER BY e.last_name ASC, e.first_name ASC
        `;

        const result = await executeQuery(query, [benefitCycleId]);
        if (result.success) {
            const items = result.data.map(row => new BenefitItem(row));

            // Calculate aggregates
            const aggregates = {
                total_items: items.length,
                eligible_items: items.filter(item => item.is_eligible).length,
                ineligible_items: items.filter(item => !item.is_eligible).length,
                total_calculated_amount: items.reduce((sum, item) => sum + parseFloat(item.calculated_amount || 0), 0),
                total_final_amount: items.reduce((sum, item) => sum + parseFloat(item.final_amount || 0), 0),
                total_paid_amount: items
                    .filter(item => item.status === 'Paid')
                    .reduce((sum, item) => sum + parseFloat(item.final_amount || 0), 0)
            };

            return {
                success: true,
                data: items,
                aggregates: aggregates
            };
        }
        return result;
    }

    // Bulk update status
    static async bulkUpdateStatus(itemIds, newStatus, userId) {
        try {
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

            let updateQuery = '';
            const updateParams = [newStatus, currentTime, userId];

            if (newStatus === 'Approved') {
                updateQuery = `
                    UPDATE benefit_items SET
                        status = ?, approved_by = ?, approved_at = ?
                    WHERE id IN (${itemIds.map(() => '?').join(',')})
                `;
                updateParams.push(...itemIds);
            } else if (newStatus === 'Paid') {
                updateQuery = `
                    UPDATE benefit_items SET
                        status = ?, paid_by = ?, paid_at = ?
                    WHERE id IN (${itemIds.map(() => '?').join(',')})
                `;
                updateParams.push(...itemIds);
            } else {
                updateQuery = `
                    UPDATE benefit_items SET
                        status = ?
                    WHERE id IN (${itemIds.map(() => '?').join(',')})
                `;
                updateParams.push(...itemIds);
            }

            const result = await executeQuery(updateQuery, updateParams);
            if (result.success) {
                return {
                    success: true,
                    message: `${itemIds.length} benefit items updated to ${newStatus}`,
                    affected_rows: result.data.affectedRows
                };
            }
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: error
            };
        }
    }
}

module.exports = BenefitItem;