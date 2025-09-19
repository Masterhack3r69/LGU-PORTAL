// models/AllowanceType.js - Allowance Type model
const { executeQuery, findOne, findOneByTable } = require('../../config/database');

class AllowanceType {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.code = data.code || null;
        this.description = data.description || null;
        this.default_amount = data.default_amount || null;
        this.calculation_type = data.calculation_type || 'fixed';
        this.percentage_base = data.percentage_base || null;
        this.is_taxable = data.is_taxable || false;
        this.frequency = data.frequency || 'monthly';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM allowance_types WHERE 1=1';
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

        if (filters.search) {
            query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY name ASC';

        // Handle pagination - use string interpolation like other successful models
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
            return {
                success: true,
                data: result.data.map(row => new AllowanceType(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('allowance_types', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new AllowanceType(result.data)
            };
        }
        return result;
    }

    static async findByName(name) {
        const result = await findOneByTable('allowance_types', { name });
        if (result.success && result.data) {
            return {
                success: true,
                data: new AllowanceType(result.data)
            };
        }
        return result;
    }

    static async findByCode(code) {
        const result = await findOneByTable('allowance_types', { code });
        if (result.success && result.data) {
            return {
                success: true,
                data: new AllowanceType(result.data)
            };
        }
        return result;
    }

    // Get count of allowance types with filters
    static async getCount(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM allowance_types WHERE 1=1';
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

    // Save new allowance type
    async save() {
        try {
            const query = `INSERT INTO allowance_types 
                (name, code, description, default_amount, calculation_type, percentage_base, is_taxable, frequency, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                this.name,
                this.code,
                this.description,
                this.default_amount,
                this.calculation_type,
                this.percentage_base,
                this.is_taxable,
                this.frequency,
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

    // Update allowance type
    async update() {
        try {
            const query = `UPDATE allowance_types SET 
                name = ?, code = ?, description = ?, default_amount = ?, 
                calculation_type = ?, percentage_base = ?, is_taxable = ?, 
                frequency = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            const params = [
                this.name,
                this.code,
                this.description,
                this.default_amount,
                this.calculation_type,
                this.percentage_base,
                this.is_taxable,
                this.frequency,
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

    // Delete allowance type
    static async delete(id) {
        try {
            const query = 'DELETE FROM allowance_types WHERE id = ?';
            const result = await executeQuery(query, [id]);
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Allowance type deleted successfully'
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
                    SUM(CASE WHEN calculation_type = 'Fixed' THEN 1 ELSE 0 END) as fixed_type,
                    SUM(CASE WHEN calculation_type = 'Percentage' THEN 1 ELSE 0 END) as percentage_type,
                    SUM(CASE WHEN calculation_type = 'Formula' THEN 1 ELSE 0 END) as formula_type
                FROM allowance_types`;
            
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
}

module.exports = AllowanceType;