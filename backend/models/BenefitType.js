// models/BenefitType.js - Benefit Type model for compensation types
const { executeQuery, findOne, findOneByTable } = require('../config/database');

class BenefitType {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.code = data.code || null;
        this.description = data.description || null;
        this.calculation_type = data.calculation_type || 'Fixed';
        this.default_amount = data.default_amount || null;
        this.percentage_base = data.percentage_base || null;
        this.formula = data.formula || null;
        this.frequency = data.frequency || 'Annual';
        this.is_taxable = data.is_taxable !== undefined ? data.is_taxable : true;
        this.is_recurring = data.is_recurring !== undefined ? data.is_recurring : true;
        this.requires_approval = data.requires_approval || false;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Validate benefit type data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Name is required');
        }

        if (!this.code || this.code.trim().length === 0) {
            errors.push('Code is required');
        }

        if (!this.calculation_type || !['Fixed', 'Percentage', 'Formula', 'MonthsWorked'].includes(this.calculation_type)) {
            errors.push('Valid calculation type is required');
        }

        if (!this.frequency || !['Annual', 'OneTime', 'Conditional'].includes(this.frequency)) {
            errors.push('Valid frequency is required');
        }

        if (this.calculation_type === 'Percentage' && !this.percentage_base) {
            errors.push('Percentage base is required for percentage calculation type');
        }

        if (this.calculation_type === 'Formula' && !this.formula) {
            errors.push('Formula is required for formula calculation type');
        }

        if (this.default_amount !== null && this.default_amount < 0) {
            errors.push('Default amount cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM compensation_types WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.frequency) {
            query += ' AND frequency = ?';
            params.push(filters.frequency);
        }

        if (filters.calculation_type) {
            query += ' AND calculation_type = ?';
            params.push(filters.calculation_type);
        }

        if (filters.is_taxable !== undefined) {
            query += ' AND is_taxable = ?';
            params.push(filters.is_taxable);
        }

        if (filters.is_recurring !== undefined) {
            query += ' AND is_recurring = ?';
            params.push(filters.is_recurring);
        }

        if (filters.requires_approval !== undefined) {
            query += ' AND requires_approval = ?';
            params.push(filters.requires_approval);
        }

        if (filters.search) {
            query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY name ASC';

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
                data: result.data.map(row => new BenefitType(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('compensation_types', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitType(result.data)
            };
        }
        return result;
    }

    static async findByName(name) {
        const result = await findOneByTable('compensation_types', { name });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitType(result.data)
            };
        }
        return result;
    }

    static async findByCode(code) {
        const result = await findOneByTable('compensation_types', { code });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitType(result.data)
            };
        }
        return result;
    }

    // Get count of benefit types with filters
    static async getCount(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM compensation_types WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.frequency) {
            query += ' AND frequency = ?';
            params.push(filters.frequency);
        }

        if (filters.calculation_type) {
            query += ' AND calculation_type = ?';
            params.push(filters.calculation_type);
        }

        if (filters.is_taxable !== undefined) {
            query += ' AND is_taxable = ?';
            params.push(filters.is_taxable);
        }

        if (filters.is_recurring !== undefined) {
            query += ' AND is_recurring = ?';
            params.push(filters.is_recurring);
        }

        if (filters.search) {
            query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            return result.data[0].count;
        }
        return 0;
    }

    // Save new benefit type
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
            const query = `INSERT INTO compensation_types
                (name, code, description, calculation_type, default_amount, percentage_base, formula, frequency, is_taxable, is_recurring, requires_approval, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                this.name,
                this.code,
                this.description,
                this.calculation_type,
                this.default_amount,
                this.percentage_base,
                this.formula,
                this.frequency,
                this.is_taxable,
                this.is_recurring,
                this.requires_approval,
                this.is_active
            ];

            const result = await executeQuery(query, params);
            if (result.success) {
                this.id = result.data.insertId;
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

    // Update benefit type
    async update() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }

        try {
            const query = `UPDATE compensation_types SET
                name = ?, code = ?, description = ?, calculation_type = ?,
                default_amount = ?, percentage_base = ?, formula = ?, frequency = ?,
                is_taxable = ?, is_recurring = ?, requires_approval = ?, is_active = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`;

            const params = [
                this.name,
                this.code,
                this.description,
                this.calculation_type,
                this.default_amount,
                this.percentage_base,
                this.formula,
                this.frequency,
                this.is_taxable,
                this.is_recurring,
                this.requires_approval,
                this.is_active,
                this.id
            ];

            const result = await executeQuery(query, params);
            if (result.success) {
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

    // Delete benefit type
    static async delete(id) {
        try {
            const query = 'DELETE FROM compensation_types WHERE id = ?';
            const result = await executeQuery(query, [id]);

            if (result.success) {
                return {
                    success: true,
                    message: 'Benefit type deleted successfully'
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

    // Toggle active status
    async toggleActive() {
        try {
            this.is_active = !this.is_active;
            const result = await this.update();
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: error
            };
        }
    }

    // Get statistics
    static async getStatistics() {
        try {
            const query = `
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
                    SUM(CASE WHEN is_taxable = 1 THEN 1 ELSE 0 END) as taxable,
                    SUM(CASE WHEN is_recurring = 1 THEN 1 ELSE 0 END) as recurring,
                    SUM(CASE WHEN calculation_type = 'Fixed' THEN 1 ELSE 0 END) as fixed_type,
                    SUM(CASE WHEN calculation_type = 'Percentage' THEN 1 ELSE 0 END) as percentage_type,
                    SUM(CASE WHEN calculation_type = 'Formula' THEN 1 ELSE 0 END) as formula_type,
                    SUM(CASE WHEN calculation_type = 'MonthsWorked' THEN 1 ELSE 0 END) as months_worked_type,
                    SUM(CASE WHEN frequency = 'Annual' THEN 1 ELSE 0 END) as annual_frequency,
                    SUM(CASE WHEN frequency = 'OneTime' THEN 1 ELSE 0 END) as onetime_frequency,
                    SUM(CASE WHEN frequency = 'Conditional' THEN 1 ELSE 0 END) as conditional_frequency
                FROM compensation_types`;

            const result = await executeQuery(query, []);
            if (result.success) {
                return {
                    success: true,
                    data: result.data[0]
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

    // Get benefit types by frequency
    static async getByFrequency(frequency) {
        const result = await this.findAll({ frequency, is_active: true });
        return result;
    }

    // Get benefit types by calculation type
    static async getByCalculationType(calculationType) {
        const result = await this.findAll({ calculation_type: calculationType, is_active: true });
        return result;
    }

    // Get recurring benefit types
    static async getRecurring() {
        const result = await this.findAll({ is_recurring: true, is_active: true });
        return result;
    }

    // Get taxable benefit types
    static async getTaxable() {
        const result = await this.findAll({ is_taxable: true, is_active: true });
        return result;
    }
}

module.exports = BenefitType;