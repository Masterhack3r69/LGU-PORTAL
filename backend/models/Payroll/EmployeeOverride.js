// models/EmployeeOverride.js - Employee Allowance and Deduction Override models
const { executeQuery, findOne } = require('../../config/database');

class EmployeeOverride {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.type = data.type || null; // 'allowance' or 'deduction'
        this.type_id = data.type_id || null;
        this.amount = data.amount || 0;
        this.effective_from = data.effective_from || null;
        this.effective_to = data.effective_to || null;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        this.created_by = data.created_by || null;
    }
}

class EmployeeAllowanceOverride extends EmployeeOverride {
    constructor(data = {}) {
        super(data);
        this.type = 'allowance';
    }

    static async getActiveOverride(employeeId, allowanceTypeId) {
        const query = `
            SELECT * FROM employee_overrides 
            WHERE employee_id = ? AND type = 'allowance' AND type_id = ? 
            AND is_active = 1 
            AND (effective_to IS NULL OR effective_to >= CURDATE())
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        
        const result = await executeQuery(query, [employeeId, allowanceTypeId]);
        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: new EmployeeAllowanceOverride(result.data[0])
            };
        }
        return { success: false };
    }
}

class EmployeeDeductionOverride extends EmployeeOverride {
    constructor(data = {}) {
        super(data);
        this.type = 'deduction';
    }

    static async getActiveOverride(employeeId, deductionTypeId) {
        const query = `
            SELECT * FROM employee_overrides 
            WHERE employee_id = ? AND type = 'deduction' AND type_id = ? 
            AND is_active = 1 
            AND (effective_to IS NULL OR effective_to >= CURDATE())
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        
        const result = await executeQuery(query, [employeeId, deductionTypeId]);
        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: new EmployeeDeductionOverride(result.data[0])
            };
        }
        return { success: false };
    }
}

module.exports = {
    EmployeeOverride,
    EmployeeAllowanceOverride,
    EmployeeDeductionOverride
};