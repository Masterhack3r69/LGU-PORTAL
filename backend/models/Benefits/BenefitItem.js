// models/Benefits/BenefitItem.js - Benefit Item model
const { executeQuery, findOne, findOneByTable, executeTransaction } = require('../../config/database');

class BenefitItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.benefit_cycle_id = data.benefit_cycle_id || null;
        this.employee_id = data.employee_id || null;
        this.base_salary = data.base_salary || 0.00;
        this.service_months = data.service_months || 12.00;
        this.calculated_amount = data.calculated_amount || 0.00;
        this.adjustment_amount = data.adjustment_amount || 0.00;
        this.final_amount = data.final_amount || 0.00;
        this.tax_amount = data.tax_amount || 0.00;
        this.net_amount = data.net_amount || 0.00;
        this.calculation_basis = data.calculation_basis || null;
        this.status = data.status || 'Draft';
        this.is_eligible = data.is_eligible !== undefined ? data.is_eligible : true;
        this.eligibility_notes = data.eligibility_notes || null;
        this.processed_by = data.processed_by || null;
        this.processed_at = data.processed_at || null;
        this.paid_by = data.paid_by || null;
        this.paid_at = data.paid_at || null;
        this.payment_reference = data.payment_reference || null;
        this.notes = data.notes || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;

        // Additional properties from joins
        this.employee = data.employee || null;
        this.employee_number = data.employee_number || null;
        this.employee_name = data.employee_name || null;
        this.first_name = data.first_name || null;
        this.middle_name = data.middle_name || null;
        this.last_name = data.last_name || null;
        this.current_monthly_salary = data.current_monthly_salary || null;
        this.current_daily_rate = data.current_daily_rate || null;
        this.appointment_date = data.appointment_date || null;
        this.benefit_cycle = data.benefit_cycle || null;
        this.cycle_name = data.cycle_name || null;
        this.benefit_type_name = data.benefit_type_name || null;
        this.benefit_type_code = data.benefit_type_code || null;
        this.cycle_year = data.cycle_year || null;
        this.processed_by_username = data.processed_by_username || null;
        this.paid_by_username = data.paid_by_username || null;
    }

    // Get employee full name
    getEmployeeFullName() {
        if (this.employee_name) return this.employee_name;
        
        const parts = [this.first_name, this.middle_name, this.last_name].filter(Boolean);
        return parts.join(' ');
    }

    // Check if item is modifiable
    isModifiable() {
        return ['Draft', 'Calculated'].includes(this.status);
    }

    // Check if item can be approved
    canApprove() {
        return this.status === 'Calculated' && this.is_eligible;
    }

    // Check if item can be paid
    canPay() {
        return this.status === 'Approved';
    }

    // Calculate final amount including adjustments
    calculateFinalAmount() {
        this.final_amount = this.calculated_amount + this.adjustment_amount;
        this.net_amount = this.final_amount - this.tax_amount;
        return this.final_amount;
    }

    // Validation
    validate() {
        const errors = [];

        if (!this.benefit_cycle_id) {
            errors.push('Benefit cycle is required');
        }

        if (!this.employee_id) {
            errors.push('Employee is required');
        }

        if (this.base_salary < 0) {
            errors.push('Base salary cannot be negative');
        }

        if (this.service_months < 0 || this.service_months > 60) {
            errors.push('Service months must be between 0 and 60');
        }

        if (this.calculated_amount < 0) {
            errors.push('Calculated amount cannot be negative');
        }

        if (this.final_amount < 0) {
            errors.push('Final amount cannot be negative');
        }

        if (this.net_amount < 0) {
            errors.push('Net amount cannot be negative');
        }

        if (!['Draft', 'Calculated', 'Approved', 'Paid', 'Cancelled'].includes(this.status)) {
            errors.push('Invalid status');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
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
            // Recalculate final and net amounts
            this.calculateFinalAmount();

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
        // Check for duplicate item in same cycle
        const duplicateCheck = await this.checkDuplicateItem();
        if (!duplicateCheck.isUnique) {
            console.log('Duplicate benefit item found:', duplicateCheck.errors);
            return {
                success: false,
                error: 'Duplicate benefit item',
                details: duplicateCheck.errors
            };
        }

        // Use only the essential columns to avoid column mismatch
        const query = `
            INSERT INTO benefit_items (
                benefit_cycle_id, employee_id, base_salary, service_months,
                calculated_amount, final_amount, net_amount, status, is_eligible
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.benefit_cycle_id, 
            this.employee_id, 
            parseFloat(this.base_salary) || 0, 
            parseFloat(this.service_months) || 12,
            parseFloat(this.calculated_amount) || 0, 
            parseFloat(this.final_amount) || 0, 
            parseFloat(this.net_amount) || 0, 
            this.status || 'Calculated', 
            this.is_eligible ? 1 : 0
        ];
        
        console.log('BenefitItem CREATE - SQL:', query);
        console.log('BenefitItem CREATE - Params:', params);
        console.log('BenefitItem CREATE - Param count:', params.length);

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
        if (!this.isModifiable()) {
            return {
                success: false,
                error: 'Cannot modify item in current status',
                details: `Item status is ${this.status}`
            };
        }

        const query = `
            UPDATE benefit_items SET
                base_salary = ?, service_months = ?, calculated_amount = ?,
                adjustment_amount = ?, final_amount = ?, tax_amount = ?,
                net_amount = ?, calculation_basis = ?, status = ?,
                is_eligible = ?, eligibility_notes = ?, notes = ?
            WHERE id = ?
        `;

        const params = [
            this.base_salary, this.service_months, this.calculated_amount,
            this.adjustment_amount, this.final_amount, this.tax_amount,
            this.net_amount, this.calculation_basis, this.status,
            this.is_eligible, this.eligibility_notes, this.notes, this.id
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

    // Check for duplicate item in same cycle
    async checkDuplicateItem(excludeId = null) {
        const errors = [];
        
        let query = 'SELECT id FROM benefit_items WHERE benefit_cycle_id = ? AND employee_id = ?';
        let params = [this.benefit_cycle_id, this.employee_id];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const result = await executeQuery(query, params);
        if (result.success && result.data.length > 0) {
            errors.push('Employee already has a benefit item in this cycle');
        }

        return {
            isUnique: errors.length === 0,
            errors
        };
    }

    // Approve benefit item
    async approve(userId) {
        if (!this.canApprove()) {
            return {
                success: false,
                error: 'Cannot approve item in current status',
                details: `Item status is ${this.status} or item is not eligible`
            };
        }

        this.status = 'Approved';
        this.processed_by = userId;
        this.processed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            UPDATE benefit_items SET
                status = ?, processed_by = ?, processed_at = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [
            this.status, this.processed_by, this.processed_at, this.id
        ]);

        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit item approved successfully'
            };
        }

        return result;
    }

    // Mark as paid
    async markAsPaid(userId, paymentReference = null) {
        if (!this.canPay()) {
            return {
                success: false,
                error: 'Cannot mark item as paid in current status',
                details: `Item status is ${this.status}`
            };
        }

        this.status = 'Paid';
        this.paid_by = userId;
        this.paid_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        this.payment_reference = paymentReference;

        const query = `
            UPDATE benefit_items SET
                status = ?, paid_by = ?, paid_at = ?, payment_reference = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [
            this.status, this.paid_by, this.paid_at, this.payment_reference, this.id
        ]);

        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit item marked as paid successfully'
            };
        }

        return result;
    }

    // Cancel benefit item
    async cancel(userId, reason = null) {
        if (!['Draft', 'Calculated', 'Approved'].includes(this.status)) {
            return {
                success: false,
                error: 'Cannot cancel item in current status',
                details: `Item status is ${this.status}`
            };
        }

        this.status = 'Cancelled';
        this.processed_by = userId;
        this.processed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (reason) {
            this.notes = (this.notes ? this.notes + '\n' : '') + `Cancelled: ${reason}`;
        }

        const query = `
            UPDATE benefit_items SET
                status = ?, processed_by = ?, processed_at = ?, notes = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [
            this.status, this.processed_by, this.processed_at, this.notes, this.id
        ]);

        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit item cancelled successfully'
            };
        }

        return result;
    }

    // Add adjustment
    async addAdjustment(adjustmentType, amount, reason, adjustedBy, description = null) {
        if (!this.isModifiable()) {
            return {
                success: false,
                error: 'Cannot adjust item in current status',
                details: `Item status is ${this.status}`
            };
        }

        return await executeTransaction(async (connection) => {
            // Insert adjustment record
            const adjustmentQuery = `
                INSERT INTO benefit_adjustments (
                    benefit_item_id, adjustment_type, amount, reason, 
                    description, adjusted_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            await connection.execute(adjustmentQuery, [
                this.id, adjustmentType, amount, reason, description, adjustedBy
            ]);

            // Update benefit item adjustment amount
            let newAdjustmentAmount = this.adjustment_amount || 0;
            
            switch (adjustmentType) {
                case 'Increase':
                    newAdjustmentAmount += amount;
                    break;
                case 'Decrease':
                    newAdjustmentAmount -= amount;
                    break;
                case 'Override':
                    newAdjustmentAmount = amount;
                    break;
            }

            this.adjustment_amount = newAdjustmentAmount;
            this.calculateFinalAmount();

            const updateQuery = `
                UPDATE benefit_items SET
                    adjustment_amount = ?, final_amount = ?, net_amount = ?
                WHERE id = ?
            `;

            await connection.execute(updateQuery, [
                this.adjustment_amount, this.final_amount, this.net_amount, this.id
            ]);

            return {
                success: true,
                data: this,
                message: 'Adjustment added successfully'
            };
        });
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                bi.*,
                e.employee_number,
                CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name,
                e.first_name,
                e.middle_name,
                e.last_name,
                e.current_monthly_salary,
                e.current_daily_rate,
                e.appointment_date,
                bc.cycle_name,
                bc.cycle_year,
                bt.name as benefit_type_name,
                bt.code as benefit_type_code,
                u1.username as processed_by_username,
                u2.username as paid_by_username
            FROM benefit_items bi
            LEFT JOIN employees e ON bi.employee_id = e.id
            LEFT JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
            LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
            LEFT JOIN users u1 ON bi.processed_by = u1.id
            LEFT JOIN users u2 ON bi.paid_by = u2.id
            WHERE e.deleted_at IS NULL
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
            if (Array.isArray(filters.status)) {
                query += ` AND bi.status IN (${filters.status.map(() => '?').join(',')})`;
                params.push(...filters.status);
            } else {
                query += ' AND bi.status = ?';
                params.push(filters.status);
            }
        }

        if (filters.is_eligible !== undefined) {
            query += ' AND bi.is_eligible = ?';
            params.push(filters.is_eligible);
        }

        if (filters.cycle_year) {
            query += ' AND bc.cycle_year = ?';
            params.push(filters.cycle_year);
        }

        if (filters.benefit_type_id) {
            query += ' AND bc.benefit_type_id = ?';
            params.push(filters.benefit_type_id);
        }

        if (filters.search) {
            query += ` AND (
                e.employee_number LIKE ? OR 
                e.first_name LIKE ? OR 
                e.last_name LIKE ? OR
                CONCAT(e.first_name, ' ', e.last_name) LIKE ?
            )`;
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (filters.min_amount) {
            query += ' AND bi.final_amount >= ?';
            params.push(filters.min_amount);
        }

        if (filters.max_amount) {
            query += ' AND bi.final_amount <= ?';
            params.push(filters.max_amount);
        }

        query += ' ORDER BY bc.cycle_year DESC, e.last_name ASC, e.first_name ASC';

        // Handle pagination
        if (filters.limit) {
            const limit = Math.max(1, Math.min(1000, parseInt(filters.limit) || 50));
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
        const query = `
            SELECT 
                bi.*,
                e.employee_number,
                CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name,
                e.first_name,
                e.middle_name,
                e.last_name,
                e.current_monthly_salary,
                e.current_daily_rate,
                e.appointment_date,
                bc.cycle_name,
                bc.cycle_year,
                bt.name as benefit_type_name,
                bt.code as benefit_type_code,
                u1.username as processed_by_username,
                u2.username as paid_by_username
            FROM benefit_items bi
            LEFT JOIN employees e ON bi.employee_id = e.id
            LEFT JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
            LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
            LEFT JOIN users u1 ON bi.processed_by = u1.id
            LEFT JOIN users u2 ON bi.paid_by = u2.id
            WHERE bi.id = ? AND e.deleted_at IS NULL
        `;

        const result = await findOne(query, [id]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitItem(result.data)
            };
        }
        return result;
    }

    static async getCount(filters = {}) {
        let query = `
            SELECT COUNT(*) as count 
            FROM benefit_items bi
            LEFT JOIN employees e ON bi.employee_id = e.id
            LEFT JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
            WHERE e.deleted_at IS NULL
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
            if (Array.isArray(filters.status)) {
                query += ` AND bi.status IN (${filters.status.map(() => '?').join(',')})`;
                params.push(...filters.status);
            } else {
                query += ' AND bi.status = ?';
                params.push(filters.status);
            }
        }

        if (filters.is_eligible !== undefined) {
            query += ' AND bi.is_eligible = ?';
            params.push(filters.is_eligible);
        }

        const result = await executeQuery(query, params);
        return result.success ? result.data[0].count : 0;
    }

    static async getByCycle(cycleId) {
        return await BenefitItem.findAll({ benefit_cycle_id: cycleId });
    }

    static async getByEmployee(employeeId, filters = {}) {
        const allFilters = { ...filters, employee_id: employeeId };
        return await BenefitItem.findAll(allFilters);
    }

    static async getStatistics(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN bi.status = 'Draft' THEN 1 END) as draft_count,
                COUNT(CASE WHEN bi.status = 'Calculated' THEN 1 END) as calculated_count,
                COUNT(CASE WHEN bi.status = 'Approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN bi.status = 'Paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN bi.status = 'Cancelled' THEN 1 END) as cancelled_count,
                COUNT(CASE WHEN bi.is_eligible = 1 THEN 1 END) as eligible_count,
                COUNT(CASE WHEN bi.is_eligible = 0 THEN 1 END) as ineligible_count,
                COALESCE(SUM(bi.calculated_amount), 0) as total_calculated_amount,
                COALESCE(SUM(bi.final_amount), 0) as total_final_amount,
                COALESCE(SUM(bi.net_amount), 0) as total_net_amount,
                COALESCE(AVG(bi.final_amount), 0) as average_benefit_amount
            FROM benefit_items bi
            LEFT JOIN employees e ON bi.employee_id = e.id
            LEFT JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
            WHERE e.deleted_at IS NULL
        `;
        const params = [];

        if (filters.benefit_cycle_id) {
            query += ' AND bi.benefit_cycle_id = ?';
            params.push(filters.benefit_cycle_id);
        }

        if (filters.cycle_year) {
            query += ' AND bc.cycle_year = ?';
            params.push(filters.cycle_year);
        }

        const result = await executeQuery(query, params);
        return result.success ? result.data[0] : null;
    }

    // Bulk operations
    static async bulkApprove(itemIds, userId) {
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return {
                success: false,
                error: 'No items provided for approval'
            };
        }

        const placeholders = itemIds.map(() => '?').join(',');
        const query = `
            UPDATE benefit_items SET
                status = 'Approved',
                processed_by = ?,
                processed_at = NOW()
            WHERE id IN (${placeholders})
                AND status = 'Calculated'
                AND is_eligible = 1
        `;

        const params = [userId, ...itemIds];
        const result = await executeQuery(query, params);

        if (result.success) {
            return {
                success: true,
                data: { affected_rows: result.data.affectedRows },
                message: `${result.data.affectedRows} items approved successfully`
            };
        }

        return result;
    }

    static async bulkMarkAsPaid(itemIds, userId, paymentReference = null) {
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return {
                success: false,
                error: 'No items provided for payment'
            };
        }

        const placeholders = itemIds.map(() => '?').join(',');
        const query = `
            UPDATE benefit_items SET
                status = 'Paid',
                paid_by = ?,
                paid_at = NOW(),
                payment_reference = ?
            WHERE id IN (${placeholders})
                AND status = 'Approved'
        `;

        const params = [userId, paymentReference, ...itemIds];
        const result = await executeQuery(query, params);

        if (result.success) {
            return {
                success: true,
                data: { affected_rows: result.data.affectedRows },
                message: `${result.data.affectedRows} items marked as paid successfully`
            };
        }

        return result;
    }

    // Delete benefit item
    async delete() {
        if (!['Draft', 'Cancelled'].includes(this.status)) {
            return {
                success: false,
                error: 'Cannot delete item in current status',
                details: `Item status is ${this.status}. Only Draft or Cancelled items can be deleted.`
            };
        }

        const query = 'DELETE FROM benefit_items WHERE id = ?';
        const result = await executeQuery(query, [this.id]);
        
        if (result.success) {
            return {
                success: true,
                message: 'Benefit item deleted successfully'
            };
        }
        
        return result;
    }
}

module.exports = BenefitItem;