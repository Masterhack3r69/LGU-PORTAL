// models/Benefits/BenefitCycle.js - Benefit Cycle model
const { executeQuery, findOne, findOneByTable, executeTransaction } = require('../../config/database');

class BenefitCycle {
    constructor(data = {}) {
        this.id = data.id || null;
        this.benefit_type_id = data.benefit_type_id || null;
        this.cycle_year = data.cycle_year || new Date().getFullYear();
        this.cycle_name = data.cycle_name || null;
        this.applicable_date = data.applicable_date || null;
        this.payment_date = data.payment_date || null;
        this.cutoff_date = data.cutoff_date || null;
        this.status = data.status || 'Draft';
        this.total_amount = data.total_amount || 0.00;
        this.employee_count = data.employee_count || 0;
        this.created_by = data.created_by || null;
        this.processed_by = data.processed_by || null;
        this.processed_at = data.processed_at || null;
        this.finalized_by = data.finalized_by || null;
        this.finalized_at = data.finalized_at || null;
        this.notes = data.notes || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;

        // Additional properties from joins
        this.benefit_type = data.benefit_type || null;
        this.benefit_type_name = data.benefit_type_name || null;
        this.benefit_type_code = data.benefit_type_code || null;
        this.category = data.category || null;
        this.created_by_username = data.created_by_username || null;
        this.processed_by_username = data.processed_by_username || null;
        this.finalized_by_username = data.finalized_by_username || null;
    }

    // Get cycle display name
    getCycleDisplayName() {
        return `${this.cycle_name} (${this.cycle_year})`;
    }

    // Check if cycle is modifiable
    isModifiable() {
        return ['Draft', 'Processing'].includes(this.status);
    }

    // Check if cycle can be processed
    canProcess() {
        return this.status === 'Draft';
    }

    // Check if cycle can be finalized
    canFinalize() {
        return this.status === 'Processing';
    }

    // Validation
    validate() {
        const errors = [];

        if (!this.benefit_type_id) {
            errors.push('Benefit type is required');
        }

        if (!this.cycle_year || this.cycle_year < 2020 || this.cycle_year > 2100) {
            errors.push('Valid cycle year is required');
        }

        if (!this.cycle_name || this.cycle_name.trim().length === 0) {
            errors.push('Cycle name is required');
        }

        if (!this.applicable_date) {
            errors.push('Applicable date is required');
        }

        if (!this.created_by) {
            errors.push('Created by user is required');
        }

        if (!['Draft', 'Processing', 'Completed', 'Released', 'Cancelled'].includes(this.status)) {
            errors.push('Invalid status');
        }

        // Date validations
        if (this.applicable_date && this.payment_date) {
            const applicableDate = new Date(this.applicable_date);
            const paymentDate = new Date(this.payment_date);
            
            if (paymentDate < applicableDate) {
                errors.push('Payment date cannot be before applicable date');
            }
        }

        if (this.cutoff_date && this.applicable_date) {
            const cutoffDate = new Date(this.cutoff_date);
            const applicableDate = new Date(this.applicable_date);
            
            if (cutoffDate > applicableDate) {
                errors.push('Cutoff date cannot be after applicable date');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save benefit cycle
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
                error: 'Failed to save benefit cycle',
                details: error.message
            };
        }
    }

    // Create new benefit cycle
    async create() {
        // Check for duplicate cycle
        const duplicateCheck = await this.checkDuplicateCycle();
        if (!duplicateCheck.isUnique) {
            return {
                success: false,
                error: 'Duplicate benefit cycle',
                details: duplicateCheck.errors
            };
        }

        const query = `
            INSERT INTO benefit_cycles (
                benefit_type_id, cycle_year, cycle_name, applicable_date,
                payment_date, cutoff_date, status, total_amount, employee_count,
                created_by, processed_by, processed_at, finalized_by, finalized_at,
                notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const params = [
            this.benefit_type_id, this.cycle_year, this.cycle_name, this.applicable_date,
            this.payment_date, this.cutoff_date, this.status, this.total_amount, this.employee_count,
            this.created_by, this.processed_by, this.processed_at, this.finalized_by, this.finalized_at,
            this.notes, now, now
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Benefit cycle created successfully'
            };
        }

        return result;
    }

    // Update existing benefit cycle
    async update() {
        if (!this.isModifiable()) {
            return {
                success: false,
                error: 'Cannot modify cycle in current status',
                details: `Cycle status is ${this.status}`
            };
        }

        // Check for duplicate cycle (excluding current record)
        const duplicateCheck = await this.checkDuplicateCycle(this.id);
        if (!duplicateCheck.isUnique) {
            return {
                success: false,
                error: 'Duplicate benefit cycle',
                details: duplicateCheck.errors
            };
        }

        const query = `
            UPDATE benefit_cycles SET
                benefit_type_id = ?, cycle_year = ?, cycle_name = ?,
                applicable_date = ?, payment_date = ?, cutoff_date = ?,
                status = ?, total_amount = ?, employee_count = ?,
                processed_by = ?, processed_at = ?, finalized_by = ?, finalized_at = ?,
                notes = ?, updated_at = ?
            WHERE id = ?
        `;

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const params = [
            this.benefit_type_id, this.cycle_year, this.cycle_name, this.applicable_date,
            this.payment_date, this.cutoff_date, this.status, this.total_amount, this.employee_count,
            this.processed_by, this.processed_at, this.finalized_by, this.finalized_at,
            this.notes, now, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit cycle updated successfully'
            };
        }

        return result;
    }

    // Check for duplicate cycle
    async checkDuplicateCycle(excludeId = null) {
        const errors = [];
        
        let query = 'SELECT id FROM benefit_cycles WHERE benefit_type_id = ? AND cycle_year = ? AND cycle_name = ?';
        let params = [this.benefit_type_id, this.cycle_year, this.cycle_name];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const result = await executeQuery(query, params);
        if (result.success && result.data.length > 0) {
            errors.push('A benefit cycle with the same type, year, and name already exists');
        }

        return {
            isUnique: errors.length === 0,
            errors
        };
    }

    // Process benefit cycle (move to Processing status)
    async process(userId) {
        if (!this.canProcess()) {
            return {
                success: false,
                error: 'Cannot process cycle in current status',
                details: `Cycle status is ${this.status}`
            };
        }

        this.status = 'Processing';
        this.processed_by = userId;
        this.processed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            UPDATE benefit_cycles SET
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
                message: 'Benefit cycle processing started'
            };
        }

        return result;
    }

    // Finalize benefit cycle (move to Completed status)
    async finalize(userId) {
        if (!this.canFinalize()) {
            return {
                success: false,
                error: 'Cannot finalize cycle in current status',
                details: `Cycle status is ${this.status}`
            };
        }

        this.status = 'Completed';
        this.finalized_by = userId;
        this.finalized_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            UPDATE benefit_cycles SET
                status = ?, finalized_by = ?, finalized_at = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [
            this.status, this.finalized_by, this.finalized_at, this.id
        ]);

        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit cycle finalized successfully'
            };
        }

        return result;
    }

    // Release benefit cycle (move to Released status)
    async release(userId) {
        if (this.status !== 'Completed') {
            return {
                success: false,
                error: 'Cannot release cycle that is not completed',
                details: `Cycle status is ${this.status}`
            };
        }

        this.status = 'Released';
        this.finalized_by = userId;
        this.finalized_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            UPDATE benefit_cycles SET
                status = ?, finalized_by = ?, finalized_at = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [
            this.status, this.finalized_by, this.finalized_at, this.id
        ]);

        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit cycle released successfully'
            };
        }

        return result;
    }

    // Cancel benefit cycle
    async cancel(userId, reason = null) {
        if (!['Draft', 'Processing'].includes(this.status)) {
            return {
                success: false,
                error: 'Cannot cancel cycle in current status',
                details: `Cycle status is ${this.status}`
            };
        }

        this.status = 'Cancelled';
        this.processed_by = userId;
        this.processed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (reason) {
            this.notes = (this.notes ? this.notes + '\n' : '') + `Cancelled: ${reason}`;
        }

        const query = `
            UPDATE benefit_cycles SET
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
                message: 'Benefit cycle cancelled successfully'
            };
        }

        return result;
    }

    // Update cycle statistics (total amount and employee count)
    async updateStatistics() {
        const query = `
            UPDATE benefit_cycles bc SET
                total_amount = (
                    SELECT COALESCE(SUM(final_amount), 0) 
                    FROM benefit_items 
                    WHERE benefit_cycle_id = bc.id AND status != 'Cancelled'
                ),
                employee_count = (
                    SELECT COUNT(*) 
                    FROM benefit_items 
                    WHERE benefit_cycle_id = bc.id AND status != 'Cancelled'
                )
            WHERE bc.id = ?
        `;

        const result = await executeQuery(query, [this.id]);
        
        if (result.success) {
            // Refresh the object with updated statistics
            const updatedCycle = await BenefitCycle.findById(this.id);
            if (updatedCycle.success) {
                this.total_amount = updatedCycle.data.total_amount;
                this.employee_count = updatedCycle.data.employee_count;
            }
            
            return {
                success: true,
                data: this,
                message: 'Cycle statistics updated successfully'
            };
        }
        
        return result;
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = `
            SELECT 
                bc.*,
                bt.name as benefit_type_name,
                bt.code as benefit_type_code,
                bt.category,
                u1.username as created_by_username,
                u2.username as processed_by_username,
                u3.username as finalized_by_username
            FROM benefit_cycles bc
            LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
            LEFT JOIN users u1 ON bc.created_by = u1.id
            LEFT JOIN users u2 ON bc.processed_by = u2.id
            LEFT JOIN users u3 ON bc.finalized_by = u3.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.benefit_type_id) {
            query += ' AND bc.benefit_type_id = ?';
            params.push(filters.benefit_type_id);
        }

        if (filters.cycle_year) {
            query += ' AND bc.cycle_year = ?';
            params.push(filters.cycle_year);
        }

        if (filters.status) {
            query += ' AND bc.status = ?';
            params.push(filters.status);
        }

        if (filters.category) {
            query += ' AND bt.category = ?';
            params.push(filters.category);
        }

        if (filters.search) {
            query += ' AND (bc.cycle_name LIKE ? OR bt.name LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern);
        }

        if (filters.from_date) {
            query += ' AND bc.applicable_date >= ?';
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            query += ' AND bc.applicable_date <= ?';
            params.push(filters.to_date);
        }

        query += ' ORDER BY bc.cycle_year DESC, bc.applicable_date DESC, bc.created_at DESC';

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
                data: result.data.map(row => new BenefitCycle(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const query = `
            SELECT 
                bc.*,
                bt.name as benefit_type_name,
                bt.code as benefit_type_code,
                bt.category,
                u1.username as created_by_username,
                u2.username as processed_by_username,
                u3.username as finalized_by_username
            FROM benefit_cycles bc
            LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
            LEFT JOIN users u1 ON bc.created_by = u1.id
            LEFT JOIN users u2 ON bc.processed_by = u2.id
            LEFT JOIN users u3 ON bc.finalized_by = u3.id
            WHERE bc.id = ?
        `;

        const result = await findOne(query, [id]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitCycle(result.data)
            };
        }
        return result;
    }

    static async getCount(filters = {}) {
        let query = `
            SELECT COUNT(*) as count 
            FROM benefit_cycles bc
            LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.benefit_type_id) {
            query += ' AND bc.benefit_type_id = ?';
            params.push(filters.benefit_type_id);
        }

        if (filters.cycle_year) {
            query += ' AND bc.cycle_year = ?';
            params.push(filters.cycle_year);
        }

        if (filters.status) {
            query += ' AND bc.status = ?';
            params.push(filters.status);
        }

        if (filters.category) {
            query += ' AND bt.category = ?';
            params.push(filters.category);
        }

        if (filters.search) {
            query += ' AND (bc.cycle_name LIKE ? OR bt.name LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern);
        }

        const result = await executeQuery(query, params);
        return result.success ? result.data[0].count : 0;
    }

    static async getCurrentCycles(year = null) {
        const currentYear = year || new Date().getFullYear();
        return await BenefitCycle.findAll({
            cycle_year: currentYear,
            status: ['Draft', 'Processing', 'Completed']
        });
    }

    static async getActiveCycles() {
        return await BenefitCycle.findAll({
            status: ['Draft', 'Processing']
        });
    }

    // Delete benefit cycle
    async delete() {
        if (!['Draft', 'Cancelled'].includes(this.status)) {
            return {
                success: false,
                error: 'Cannot delete cycle in current status',
                details: `Cycle status is ${this.status}. Only Draft or Cancelled cycles can be deleted.`
            };
        }

        const query = 'DELETE FROM benefit_cycles WHERE id = ?';
        const result = await executeQuery(query, [this.id]);
        
        if (result.success) {
            return {
                success: true,
                message: 'Benefit cycle deleted successfully'
            };
        }
        
        return result;
    }
}

module.exports = BenefitCycle;