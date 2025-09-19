// models/DeductionType.js - Deduction Type model
const { executeQuery, findOne } = require('../../config/database');

class DeductionType {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.code = data.code || null;
        this.description = data.description || null;
        this.default_amount = data.default_amount || null;
        this.calculation_type = data.calculation_type || 'fixed';
        this.percentage_base = data.percentage_base || null;
        this.is_mandatory = data.is_mandatory || false;
        this.frequency = data.frequency || 'monthly';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM deduction_types WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.frequency) {
            query += ' AND frequency = ?';
            params.push(filters.frequency);
        }

        query += ' ORDER BY name ASC';

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new DeductionType(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOne('deduction_types', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new DeductionType(result.data)
            };
        }
        return result;
    }

    static async findByName(name) {
        const result = await findOne('deduction_types', { name });
        if (result.success && result.data) {
            return {
                success: true,
                data: new DeductionType(result.data)
            };
        }
        return result;
    }

    static async findByCode(code) {
        const result = await findOne('deduction_types', { code });
        if (result.success && result.data) {
            return {
                success: true,
                data: new DeductionType(result.data)
            };
        }
        return result;
    }
}

module.exports = DeductionType;