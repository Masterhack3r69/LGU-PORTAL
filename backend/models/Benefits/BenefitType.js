// models/Benefits/BenefitType.js - Benefit Type model
const { executeQuery, findOne, findOneByTable } = require('../../config/database');

class BenefitType {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.code = data.code || null;
        this.description = data.description || null;
        
        // Handle category mapping - frontend sends uppercase, DB expects titlecase
        const categoryMap = {
            'ANNUAL': 'Annual',
            'PERFORMANCE': 'Performance', 
            'LOYALTY': 'Loyalty',
            'TERMINAL': 'Terminal',
            'SPECIAL': 'Special'
        };
        this.category = categoryMap[data.category] || data.category || 'Annual';
        
        this.calculation_type = data.calculation_type || 'Formula';
        this.calculation_formula = data.calculation_formula || null;
        this.percentage_rate = data.percentage_rate || null;
        
        // Handle default_amount from frontend mapping to fixed_amount in DB
        this.fixed_amount = data.fixed_amount || data.default_amount || null;
        
        this.is_taxable = data.is_taxable !== undefined ? data.is_taxable : true;
        this.is_prorated = data.is_prorated !== undefined ? data.is_prorated : true;
        this.minimum_service_months = data.minimum_service_months || 4;
        this.frequency = data.frequency || 'Annual';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        
        // Handle is_recurring field from frontend (not in DB but sent from frontend)
        this.is_recurring = data.is_recurring !== undefined ? data.is_recurring : true;
        
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Validation
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Benefit type name is required');
        }

        if (!this.code || this.code.trim().length === 0) {
            errors.push('Benefit type code is required');
        }

        if (this.code && this.code.length > 20) {
            errors.push('Benefit type code must be 20 characters or less');
        }

        const validCategories = ['Annual', 'Special', 'Terminal', 'Performance', 'Loyalty'];
        if (!validCategories.includes(this.category)) {
            errors.push(`Invalid benefit category. Must be one of: ${validCategories.join(', ')}`);
        }

        const validCalculationTypes = ['Fixed', 'Percentage', 'Formula', 'Manual'];
        if (!validCalculationTypes.includes(this.calculation_type)) {
            errors.push(`Invalid calculation type. Must be one of: ${validCalculationTypes.join(', ')}`);
        }

        if (this.calculation_type === 'Fixed' && !this.fixed_amount) {
            errors.push('Fixed amount is required for Fixed calculation type');
        }

        if (this.calculation_type === 'Percentage' && !this.percentage_rate) {
            errors.push('Percentage rate is required for Percentage calculation type');
        }

        if (this.calculation_type === 'Formula' && !this.calculation_formula) {
            errors.push('Calculation formula is required for Formula calculation type');
        }

        const validFrequencies = ['Annual', 'Biannual', 'Event-Based'];
        if (!validFrequencies.includes(this.frequency)) {
            errors.push(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`);
        }

        if (this.minimum_service_months !== null && this.minimum_service_months !== undefined && this.minimum_service_months < 0) {
            errors.push('Minimum service months cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save benefit type
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
                error: 'Failed to save benefit type',
                details: error.message
            };
        }
    }

    // Create new benefit type
    async create() {
        // Check for duplicate name or code
        const duplicateCheck = await this.checkDuplicates();
        if (!duplicateCheck.isUnique) {
            return {
                success: false,
                error: 'Duplicate benefit type',
                details: duplicateCheck.errors
            };
        }

        const query = `
            INSERT INTO benefit_types (
                name, code, description, category, calculation_type, 
                calculation_formula, percentage_rate, fixed_amount, 
                is_taxable, is_prorated, minimum_service_months, frequency, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.name, this.code, this.description, this.category, this.calculation_type,
            this.calculation_formula, this.percentage_rate, this.fixed_amount,
            this.is_taxable, this.is_prorated, this.minimum_service_months, 
            this.frequency, this.is_active
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Benefit type created successfully'
            };
        }

        return result;
    }

    // Update existing benefit type
    async update() {
        // Check for duplicate name or code (excluding current record)
        const duplicateCheck = await this.checkDuplicates(this.id);
        if (!duplicateCheck.isUnique) {
            return {
                success: false,
                error: 'Duplicate benefit type',
                details: duplicateCheck.errors
            };
        }

        const query = `
            UPDATE benefit_types SET
                name = ?, code = ?, description = ?, category = ?, 
                calculation_type = ?, calculation_formula = ?, percentage_rate = ?, 
                fixed_amount = ?, is_taxable = ?, is_prorated = ?, 
                minimum_service_months = ?, frequency = ?, is_active = ?
            WHERE id = ?
        `;

        const params = [
            this.name, this.code, this.description, this.category, this.calculation_type,
            this.calculation_formula, this.percentage_rate, this.fixed_amount,
            this.is_taxable, this.is_prorated, this.minimum_service_months, 
            this.frequency, this.is_active, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Benefit type updated successfully'
            };
        }

        return result;
    }

    // Check for duplicate name or code
    async checkDuplicates(excludeId = null) {
        const errors = [];
        
        // Check name
        let nameQuery = 'SELECT id FROM benefit_types WHERE name = ?';
        let nameParams = [this.name];
        
        if (excludeId) {
            nameQuery += ' AND id != ?';
            nameParams.push(excludeId);
        }

        const nameResult = await executeQuery(nameQuery, nameParams);
        if (nameResult.success && nameResult.data.length > 0) {
            errors.push('Benefit type name already exists');
        }

        // Check code
        let codeQuery = 'SELECT id FROM benefit_types WHERE code = ?';
        let codeParams = [this.code];
        
        if (excludeId) {
            codeQuery += ' AND id != ?';
            codeParams.push(excludeId);
        }

        const codeResult = await executeQuery(codeQuery, codeParams);
        if (codeResult.success && codeResult.data.length > 0) {
            errors.push('Benefit type code already exists');
        }

        return {
            isUnique: errors.length === 0,
            errors
        };
    }

    // Toggle active status
    async toggleActive() {
        this.is_active = !this.is_active;
        const query = 'UPDATE benefit_types SET is_active = ? WHERE id = ?';
        const result = await executeQuery(query, [this.is_active, this.id]);
        
        if (result.success) {
            return {
                success: true,
                data: this,
                message: `Benefit type ${this.is_active ? 'activated' : 'deactivated'} successfully`
            };
        }
        
        return result;
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM benefit_types WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters.calculation_type) {
            query += ' AND calculation_type = ?';
            params.push(filters.calculation_type);
        }

        if (filters.frequency) {
            query += ' AND frequency = ?';
            params.push(filters.frequency);
        }

        if (filters.search) {
            query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY category, name ASC';

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
                data: result.data.map(row => new BenefitType(row))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('benefit_types', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitType(result.data)
            };
        }
        return result;
    }

    static async findByCode(code) {
        const result = await findOneByTable('benefit_types', { code });
        if (result.success && result.data) {
            return {
                success: true,
                data: new BenefitType(result.data)
            };
        }
        return result;
    }

    static async getCount(filters = {}) {
        let query = 'SELECT COUNT(*) as count FROM benefit_types WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters.search) {
            query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const result = await executeQuery(query, params);
        return result.success ? result.data[0].count : 0;
    }

    static async getByCategory(category, activeOnly = true) {
        const filters = { category };
        if (activeOnly) {
            filters.is_active = true;
        }
        
        return await BenefitType.findAll(filters);
    }

    static async getAnnualBenefits() {
        return await BenefitType.getByCategory('Annual');
    }

    static async getLoyaltyAwards() {
        return await BenefitType.getByCategory('Loyalty');
    }

    static async getSpecialBenefits() {
        return await BenefitType.getByCategory('Special');
    }

    // Delete benefit type (soft delete check first)
    async delete() {
        // Check if benefit type is being used in any cycles
        const usageCheck = await executeQuery(
            'SELECT COUNT(*) as count FROM benefit_cycles WHERE benefit_type_id = ?',
            [this.id]
        );

        if (usageCheck.success && usageCheck.data[0].count > 0) {
            return {
                success: false,
                error: 'Cannot delete benefit type that is being used in benefit cycles',
                details: `This benefit type is used in ${usageCheck.data[0].count} benefit cycle(s)`
            };
        }

        const query = 'DELETE FROM benefit_types WHERE id = ?';
        const result = await executeQuery(query, [this.id]);
        
        if (result.success) {
            return {
                success: true,
                message: 'Benefit type deleted successfully'
            };
        }
        
        return result;
    }
}

module.exports = BenefitType;