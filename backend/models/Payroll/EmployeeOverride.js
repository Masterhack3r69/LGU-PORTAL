// models/EmployeeOverride.js - Employee Allowance and Deduction Override models
const { executeQuery, findOne, findOneByTable } = require('../../config/database');

class EmployeeOverride {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.type = data.type || null; // 'allowance' or 'deduction'
        this.type_id = data.type_id || null;
        this.override_amount = data.override_amount || data.amount || 0;
        this.effective_date = data.effective_date || data.effective_from || null;
        this.end_date = data.end_date || data.effective_to || null;
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
        this.allowance_type_id = data.allowance_type_id || data.type_id || null;
    }

    // Static methods
    static async findAll(filters = {}) {
        let query = `
            SELECT eao.*, at.name as allowance_type_name, at.code as allowance_type_code,
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name, e.employee_number
            FROM employee_allowance_overrides eao
            LEFT JOIN allowance_types at ON eao.allowance_type_id = at.id
            LEFT JOIN employees e ON eao.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.employee_id) {
            query += ' AND eao.employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.is_active !== undefined) {
            query += ' AND eao.is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.search) {
            query += ' AND (at.name LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY eao.created_at DESC';

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
                data: result.data.map(row => new EmployeeAllowanceOverride({
                    ...row,
                    allowance_type: {
                        name: row.allowance_type_name,
                        code: row.allowance_type_code
                    },
                    employee: {
                        full_name: row.employee_name,
                        employee_number: row.employee_number
                    }
                }))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('employee_allowance_overrides', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new EmployeeAllowanceOverride(result.data)
            };
        }
        return result;
    }

    static async findByEmployee(employeeId, filters = {}) {
        let query = 'SELECT * FROM employee_allowance_overrides WHERE employee_id = ?';
        const params = [employeeId];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        query += ' ORDER BY created_at DESC';

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new EmployeeAllowanceOverride(row))
            };
        }
        return result;
    }

    async save() {
        try {
            const query = `INSERT INTO employee_allowance_overrides 
                (employee_id, allowance_type_id, override_amount, effective_date, end_date, is_active, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                this.employee_id,
                this.allowance_type_id,
                this.override_amount,
                this.effective_date,
                this.end_date,
                this.is_active,
                this.created_by
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
                error: error.message
            };
        }
    }

    async update() {
        try {
            const query = `UPDATE employee_allowance_overrides SET 
                override_amount = ?, effective_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            const params = [
                this.override_amount,
                this.effective_date,
                this.end_date,
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
                error: error.message
            };
        }
    }

    static async delete(id) {
        try {
            const query = 'DELETE FROM employee_allowance_overrides WHERE id = ?';
            const result = await executeQuery(query, [id]);
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Allowance override deleted successfully'
                };
            }
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async getActiveOverride(employeeId, allowanceTypeId, date = new Date()) {
        const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const query = `
            SELECT * FROM employee_allowance_overrides
            WHERE employee_id = ? AND allowance_type_id = ?
            AND is_active = 1
            AND effective_date <= ?
            AND (end_date IS NULL OR end_date >= ?)
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await executeQuery(query, [employeeId, allowanceTypeId, dateStr, dateStr]);
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
        this.deduction_type_id = data.deduction_type_id || data.type_id || null;
    }

    // Static methods  
    static async findAll(filters = {}) {
        let query = `
            SELECT edo.*, dt.name as deduction_type_name, dt.code as deduction_type_code,
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name, e.employee_number
            FROM employee_deduction_overrides edo
            LEFT JOIN deduction_types dt ON edo.deduction_type_id = dt.id
            LEFT JOIN employees e ON edo.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.employee_id) {
            query += ' AND edo.employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.is_active !== undefined) {
            query += ' AND edo.is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.search) {
            query += ' AND (dt.name LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY edo.created_at DESC';

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
                data: result.data.map(row => new EmployeeDeductionOverride({
                    ...row,
                    deduction_type: {
                        name: row.deduction_type_name,
                        code: row.deduction_type_code
                    },
                    employee: {
                        full_name: row.employee_name,
                        employee_number: row.employee_number
                    }
                }))
            };
        }
        return result;
    }

    static async findById(id) {
        const result = await findOneByTable('employee_deduction_overrides', { id });
        if (result.success && result.data) {
            return {
                success: true,
                data: new EmployeeDeductionOverride(result.data)
            };
        }
        return result;
    }

    static async findByEmployee(employeeId, filters = {}) {
        let query = 'SELECT * FROM employee_deduction_overrides WHERE employee_id = ?';
        const params = [employeeId];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        query += ' ORDER BY created_at DESC';

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => new EmployeeDeductionOverride(row))
            };
        }
        return result;
    }

    async save() {
        try {
            const query = `INSERT INTO employee_deduction_overrides 
                (employee_id, deduction_type_id, override_amount, effective_date, end_date, is_active, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            const params = [
                this.employee_id,
                this.deduction_type_id,
                this.override_amount,
                this.effective_date,
                this.end_date,
                this.is_active,
                this.created_by
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
                error: error.message
            };
        }
    }

    async update() {
        try {
            const query = `UPDATE employee_deduction_overrides SET 
                override_amount = ?, effective_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            const params = [
                this.override_amount,
                this.effective_date,
                this.end_date,
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
                error: error.message
            };
        }
    }

    static async delete(id) {
        try {
            const query = 'DELETE FROM employee_deduction_overrides WHERE id = ?';
            const result = await executeQuery(query, [id]);
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Deduction override deleted successfully'
                };
            }
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async getActiveOverride(employeeId, deductionTypeId, date = new Date()) {
        const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const query = `
            SELECT * FROM employee_deduction_overrides
            WHERE employee_id = ? AND deduction_type_id = ?
            AND is_active = 1
            AND effective_date <= ?
            AND (end_date IS NULL OR end_date >= ?)
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await executeQuery(query, [employeeId, deductionTypeId, dateStr, dateStr]);
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
