// models/BenefitCycle.js - Benefit Cycle model for managing benefit processing cycles
const { executeQuery, findOne, findOneByTable, executeTransaction } = require('../config/database');

class BenefitCycle {
    constructor(data = {}) {
        this.id = data.id || null;
        this.compensation_type_id = data.compensation_type_id || null;
        this.year = data.year || null;
        this.cycle_name = data.cycle_name || null;
        this.applicable_date = data.applicable_date || null;
        this.cutoff_date = data.cutoff_date || null;
        this.payment_date = data.payment_date || null;
        this.status = data.status || 'Draft';
        this.total_employees = data.total_employees || 0;
        this.total_amount = data.total_amount || 0;
        this.processing_notes = data.processing_notes || null;
        this.created_by = data.created_by || null;
        this.finalized_by = data.finalized_by || null;
        this.finalized_at = data.finalized_at || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;

        // Additional computed properties
        this.compensation_type_name = data.compensation_type_name || null;
        this.created_by_username = data.created_by_username || null;
        this.finalized_by_username = data.finalized_by_username || null;
    }

    // Validate benefit cycle data
    validate() {
        const errors = [];

        if (!this.compensation_type_id) {
            errors.push('Compensation type is required');
        }

        if (!this.year || this.year < 2020 || this.year > 2050) {
            errors.push('Valid year (2020-2050) is required');
        }

        if (!this.cycle_name || this.cycle_name.trim().length === 0) {
            errors.push('Cycle name is required');
        }

        if (!this.applicable_date) {
            errors.push('Applicable date is required');
        }

        if (!this.status || !['Draft', 'Processing', 'Completed', 'Released', 'Cancelled'].includes(this.status)) {
            errors.push('Valid status is required');
        }

        if (this.cutoff_date && this.cutoff_date > this.applicable_date) {
            errors.push('Cutoff date cannot be after applicable date');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if cycle can be edited
    canEdit() {
        return ['Draft', 'Processing'].includes(this.status);
    }

    // Check if cycle can be finalized
    canFinalize() {
        return this.status === 'Processing';
    }

    // Check if cycle can be released
    canRelease() {
        return this.status === 'Completed';
    }

    // Get cycle display name
    getDisplayName() {
        return `${this.cycle_name} (${this.year})`;
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
        const query = `
            INSERT INTO benefit_cycles (
                compensation_type_id, year, cycle_name, applicable_date, cutoff_date,
                payment_date, status, total_employees, total_amount, processing_notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.compensation_type_id, this.year, this.cycle_name, this.applicable_date,
            this.cutoff_date, this.payment_date, this.status, this.total_employees,
            this.total_amount, this.processing_notes, this.created_by
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
        const query = `
            UPDATE benefit_cycles SET
                compensation_type_id = ?, year = ?, cycle_name = ?, applicable_date = ?,
                cutoff_date = ?, payment_date = ?, status = ?, total_employees = ?,
                total_amount = ?, processing_notes = ?, finalized_by = ?, finalized_at = ?
            WHERE id = ?
        `;

        const params = [
            this.compensation_type_id, this.year, this.cycle_name, this.applicable_date,
            this.cutoff_date, this.payment_date, this.status, this.total_employees,
            this.total_amount, this.processing_notes, this.finalized_by,
            this.finalized_at, this.id
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

    // Finalize cycle
    async finalize(userId) {
        this.status = 'Completed';
        this.finalized_by = userId;
        this.finalized_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        return await this.update();
    }

    // Release cycle
    async release() {
        this.status = 'Released';

        return await this.update();
    }

    // Cancel cycle
    async cancel() {
        this.status = 'Cancelled';

        return await this.update();
    }

    // Update totals
    async updateTotals() {
        try {
            const query = `
                UPDATE benefit_cycles SET
                    total_employees = (
                        SELECT COUNT(*) FROM benefit_items
                        WHERE benefit_cycle_id = ? AND is_eligible = 1
                    ),
                    total_amount = (
                        SELECT COALESCE(SUM(final_amount), 0) FROM benefit_items
                        WHERE benefit_cycle_id = ? AND is_eligible = 1
                    )
                WHERE id = ?
            `;

            const result = await executeQuery(query, [this.id, this.id, this.id]);
            if (result.success) {
                // Refresh the object with updated totals
                const refreshResult = await BenefitCycle.findById(this.id);
                if (refreshResult.success) {
                    Object.assign(this, refreshResult.data);
                }
                return {
                    success: true,
                    data: this
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

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM benefit_cycles WHERE 1=1';
        const params = [];

        if (filters.compensation_type_id) {
            query += ' AND compensation_type_id = ?';
            params.push(filters.compensation_type_id);
        }

        if (filters.year) {
            query += ' AND year = ?';
            params.push(filters.year);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.created_by) {
            query += ' AND created_by = ?';
            params.push(filters.created_by);
        }

        if (filters.search) {
            query += ' AND (cycle_name LIKE ? OR processing_notes LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern);
        }

        query += ' ORDER BY year DESC, applicable_date DESC';

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
                data: result.data.map(row => new BenefitCycle(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('benefit_cycles', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitCycle(result.data)
            };
        }
        return result;
    }

    static async findByCompensationTypeAndYear(compensationTypeId, year) {
        const result = await findOneByTable('benefit_cycles', {
            compensation_type_id: compensationTypeId,
            year: year
        });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitCycle(result.data)
            };
        }
        return result;
    }

    static async getCount(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM benefit_cycles WHERE 1=1';
        const params = [];

        if (filters.compensation_type_id) {
            query += ' AND compensation_type_id = ?';
            params.push(filters.compensation_type_id);
        }

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
        const query = 'DELETE FROM benefit_cycles WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    static async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM benefit_cycles',
            'SELECT COUNT(*) as draft FROM benefit_cycles WHERE status = "Draft"',
            'SELECT COUNT(*) as processing FROM benefit_cycles WHERE status = "Processing"',
            'SELECT COUNT(*) as completed FROM benefit_cycles WHERE status = "Completed"',
            'SELECT COUNT(*) as released FROM benefit_cycles WHERE status = "Released"',
            'SELECT COUNT(*) as cancelled FROM benefit_cycles WHERE status = "Cancelled"',
            `SELECT
                COALESCE(SUM(total_amount), 0) as total_amount,
                COALESCE(SUM(total_employees), 0) as total_employees
             FROM benefit_cycles
             WHERE status IN ('Completed', 'Released') AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)`
        ];

        try {
            const results = await Promise.all(queries.map(query => executeQuery(query)));

            if (results.every(result => result.success)) {
                return {
                    success: true,
                    data: {
                        total_cycles: results[0].data[0].total,
                        draft_cycles: results[1].data[0].draft,
                        processing_cycles: results[2].data[0].processing,
                        completed_cycles: results[3].data[0].completed,
                        released_cycles: results[4].data[0].released,
                        cancelled_cycles: results[5].data[0].cancelled,
                        yearly_totals: results[6].data[0]
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

    static async getCurrentCycles() {
        const query = `
            SELECT * FROM benefit_cycles
            WHERE status IN ('Draft', 'Processing', 'Completed')
            ORDER BY year DESC, applicable_date DESC
            LIMIT 10
        `;

        const result = await executeQuery(query);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new BenefitCycle(row))
            };
        }

        return result;
    }

    static async getCyclesByYear(year) {
        const result = await this.findAll({ year });
        return result;
    }

    static async getCyclesByStatus(status) {
        const result = await this.findAll({ status });
        return result;
    }

    // Get benefit cycles with compensation type details
    static async getWithCompensationType(filters = {}) {
        let query = `
            SELECT bc.*, ct.name as compensation_type_name, ct.code as compensation_type_code
            FROM benefit_cycles bc
            JOIN compensation_types ct ON bc.compensation_type_id = ct.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.compensation_type_id) {
            query += ' AND bc.compensation_type_id = ?';
            params.push(filters.compensation_type_id);
        }

        if (filters.year) {
            query += ' AND bc.year = ?';
            params.push(filters.year);
        }

        if (filters.status) {
            query += ' AND bc.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY bc.year DESC, bc.applicable_date DESC';

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
                data: result.data.map(row => new BenefitCycle(row))
            };
        }
        return result;
    }
}

module.exports = BenefitCycle;