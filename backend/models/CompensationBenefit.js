// models/CompensationBenefit.js - Compensation & Benefits model
const { executeQuery, findOne, executeTransaction } = require('../config/database');

class CompensationBenefit {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.benefit_type = data.benefit_type || null;
        this.days_used = data.days_used || null;
        this.amount = data.amount || null;
        this.notes = data.notes || null;
        this.processed_at = data.processed_at || null;
        this.processed_by = data.processed_by || null;
        
        // Additional fields for display
        this.employee_name = data.employee_name || null;
        this.employee_number = data.employee_number || null;
        this.monthly_salary = data.monthly_salary || null;
    }

    // Validate compensation benefit data
    validate() {
        const errors = [];

        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!this.benefit_type) {
            errors.push('Benefit type is required');
        }

        const validBenefitTypes = [
            'TERMINAL_LEAVE', 'MONETIZATION', 'PBB', 'MID_YEAR_BONUS', 
            'YEAR_END_BONUS', 'EC', 'GSIS', 'LOYALTY'
        ];

        if (this.benefit_type && !validBenefitTypes.includes(this.benefit_type)) {
            errors.push('Invalid benefit type');
        }

        if (!this.amount || this.amount <= 0) {
            errors.push('Amount must be a positive number');
        }

        // Validate days_used for specific benefit types
        if (['TERMINAL_LEAVE', 'MONETIZATION'].includes(this.benefit_type)) {
            if (!this.days_used || this.days_used <= 0) {
                errors.push('Days used is required for this benefit type');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save compensation benefit record
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
            return await this.create();
        } catch (error) {
            return {
                success: false,
                error: 'Failed to save compensation benefit record',
                details: error.message
            };
        }
    }

    // Create new compensation benefit record
    async create() {
        const query = `
            INSERT INTO comp_benefit_records (
                employee_id, benefit_type, days_used, amount, notes, processed_by
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.employee_id,
            this.benefit_type,
            this.days_used,
            this.amount,
            this.notes,
            this.processed_by
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            this.processed_at = new Date();
            return {
                success: true,
                data: this,
                message: 'Compensation benefit record created successfully'
            };
        }

        return result;
    }

    // Static methods

    // Find compensation benefit by ID
    static async findById(id) {
        const query = `
            SELECT cbr.*, 
                   CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
                   e.employee_number,
                   e.current_monthly_salary as monthly_salary
            FROM comp_benefit_records cbr
            JOIN employees e ON cbr.employee_id = e.id
            WHERE cbr.id = ?
        `;
        
        const result = await findOne(query, [id]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new CompensationBenefit(result.data)
            };
        }
        
        return result;
    }

    // Get all compensation benefit records with filters
    static async findAll(filters = {}) {
        let query = `
            SELECT cbr.*, 
                   CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
                   e.employee_number,
                   e.current_monthly_salary as monthly_salary
            FROM comp_benefit_records cbr
            JOIN employees e ON cbr.employee_id = e.id
            WHERE 1=1
        `;
        
        const params = [];

        // Filter by employee
        if (filters.employee_id) {
            query += ' AND cbr.employee_id = ?';
            params.push(filters.employee_id);
        }

        // Filter by benefit type
        if (filters.benefit_type) {
            query += ' AND cbr.benefit_type = ?';
            params.push(filters.benefit_type);
        }

        // Filter by year
        if (filters.year) {
            query += ' AND YEAR(cbr.processed_at) = ?';
            params.push(filters.year);
        }

        // Date range filters
        if (filters.date_from) {
            query += ' AND DATE(cbr.processed_at) >= ?';
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ' AND DATE(cbr.processed_at) <= ?';
            params.push(filters.date_to);
        }

        // Search by employee name or number
        if (filters.search) {
            query += ` AND (
                e.first_name LIKE ? OR 
                e.last_name LIKE ? OR 
                e.employee_number LIKE ? OR
                CONCAT(e.first_name, ' ', e.last_name) LIKE ?
            )`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY cbr.processed_at DESC, e.last_name, e.first_name';

        // Pagination
        if (filters.limit) {
            const limitValue = parseInt(filters.limit);
            if (filters.offset >= 0) {
                const offsetValue = parseInt(filters.offset);
                query += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
            } else {
                query += ` LIMIT ${limitValue}`;
            }
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            const records = result.data.map(row => new CompensationBenefit(row));
            return {
                success: true,
                data: records
            };
        }

        return result;
    }

    // Get total count for pagination
    static async getCount(filters = {}) {
        let query = `
            SELECT COUNT(*) as total
            FROM comp_benefit_records cbr
            JOIN employees e ON cbr.employee_id = e.id
            WHERE 1=1
        `;
        
        const params = [];

        // Apply same filters as findAll
        if (filters.employee_id) {
            query += ' AND cbr.employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.benefit_type) {
            query += ' AND cbr.benefit_type = ?';
            params.push(filters.benefit_type);
        }

        if (filters.year) {
            query += ' AND YEAR(cbr.processed_at) = ?';
            params.push(filters.year);
        }

        if (filters.date_from) {
            query += ' AND DATE(cbr.processed_at) >= ?';
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ' AND DATE(cbr.processed_at) <= ?';
            params.push(filters.date_to);
        }

        if (filters.search) {
            query += ` AND (
                e.first_name LIKE ? OR 
                e.last_name LIKE ? OR 
                e.employee_number LIKE ? OR
                CONCAT(e.first_name, ' ', e.last_name) LIKE ?
            )`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const result = await findOne(query, params);
        return result.success ? result.data.total : 0;
    }

    // Get benefit statistics
    static async getStatistics(filters = {}) {
        const queries = [
            // Total benefits by type
            `SELECT benefit_type, COUNT(*) as count, SUM(amount) as total_amount
             FROM comp_benefit_records cbr
             JOIN employees e ON cbr.employee_id = e.id
             WHERE 1=1 ${filters.year ? 'AND YEAR(cbr.processed_at) = ?' : ''}
             GROUP BY benefit_type`,
            
            // Monthly summary for current year
            `SELECT MONTH(processed_at) as month, COUNT(*) as count, SUM(amount) as total_amount
             FROM comp_benefit_records cbr
             JOIN employees e ON cbr.employee_id = e.id
             WHERE YEAR(processed_at) = YEAR(CURDATE())
             GROUP BY MONTH(processed_at)
             ORDER BY month`,
            
            // Top employees by total benefits
            `SELECT cbr.employee_id, 
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    e.employee_number,
                    COUNT(*) as benefit_count,
                    SUM(cbr.amount) as total_amount
             FROM comp_benefit_records cbr
             JOIN employees e ON cbr.employee_id = e.id
             WHERE 1=1 ${filters.year ? 'AND YEAR(cbr.processed_at) = ?' : ''}
             GROUP BY cbr.employee_id, e.first_name, e.last_name, e.employee_number
             ORDER BY total_amount DESC
             LIMIT 10`
        ];

        try {
            const params = filters.year ? [filters.year, filters.year] : [];
            const [benefitTypes, monthlySummary, topEmployees] = await Promise.all(
                queries.map((query, index) => {
                    const queryParams = filters.year && index !== 1 ? [filters.year] : [];
                    return executeQuery(query, queryParams);
                })
            );

            // Calculate total records and amount
            const totalRecords = benefitTypes.success ? 
                benefitTypes.data.reduce((sum, item) => sum + item.count, 0) : 0;
            const totalAmount = benefitTypes.success ? 
                benefitTypes.data.reduce((sum, item) => sum + parseFloat(item.total_amount), 0) : 0;

            return {
                success: true,
                data: {
                    total_records: totalRecords,
                    total_amount: totalAmount,
                    by_benefit_type: benefitTypes.success ? benefitTypes.data : [],
                    monthly_summary: monthlySummary.success ? monthlySummary.data : [],
                    top_employees: topEmployees.success ? topEmployees.data : []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get benefit statistics',
                details: error.message
            };
        }
    }

    // Bulk create compensation benefit records
    static async bulkCreate(records, processedBy) {
        return await executeTransaction(async (connection) => {
            const results = [];
            
            for (const record of records) {
                const benefit = new CompensationBenefit({
                    ...record,
                    processed_by: processedBy
                });
                
                const validation = benefit.validate();
                if (!validation.isValid) {
                    throw new Error(`Validation failed for employee ${record.employee_id}: ${validation.errors.join(', ')}`);
                }
                
                const query = `
                    INSERT INTO comp_benefit_records (
                        employee_id, benefit_type, days_used, amount, notes, processed_by
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                const params = [
                    benefit.employee_id,
                    benefit.benefit_type,
                    benefit.days_used,
                    benefit.amount,
                    benefit.notes,
                    benefit.processed_by
                ];
                
                const [result] = await connection.execute(query, params);
                results.push({
                    employee_id: benefit.employee_id,
                    id: result.insertId,
                    amount: benefit.amount
                });
            }
            
            return results;
        });
    }

    // Delete compensation benefit record (admin only)
    static async delete(id) {
        const query = 'DELETE FROM comp_benefit_records WHERE id = ?';
        return await executeQuery(query, [id]);
    }
}

module.exports = CompensationBenefit;