const { executeQuery, executeTransaction } = require('../config/database');
const { calculateTLB, formatCurrency, calculateYearsOfService } = require('../utils/helpers');

class TerminalLeaveBenefits {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.total_leave_credits = data.total_leave_credits || null;
        this.highest_monthly_salary = data.highest_monthly_salary || null;
        this.constant_factor = data.constant_factor || 1.0;
        this.computed_amount = data.computed_amount || null;
        this.claim_date = data.claim_date || null;
        this.separation_date = data.separation_date || null;
        this.processed_by = data.processed_by || null;
        this.processed_at = data.processed_at || null;
        this.status = data.status || 'Computed';
        this.check_number = data.check_number || null;
        this.payment_date = data.payment_date || null;
        this.notes = data.notes || null;
        
        // Additional properties for enhanced functionality
        this.employee_name = data.employee_name || null;
        this.employee_number = data.employee_number || null;
        this.processed_by_name = data.processed_by_name || null;
        this.plantilla_position = data.plantilla_position || null;
        this.appointment_date = data.appointment_date || null;
        this.years_of_service = data.years_of_service || null;
        this.formatted_amount = data.formatted_amount || null;
    }

    // Validate TLB record
    validate() {
        const errors = [];
        const warnings = [];

        // Basic field validation
        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!this.total_leave_credits || this.total_leave_credits < 0) {
            errors.push('Total leave credits must be a positive number');
        }

        if (!this.highest_monthly_salary || this.highest_monthly_salary <= 0) {
            errors.push('Highest monthly salary must be greater than 0');
        }

        if (this.constant_factor && (this.constant_factor < 0.1 || this.constant_factor > 2.0)) {
            errors.push('Constant factor must be between 0.1 and 2.0');
        }

        if (!this.claim_date) {
            errors.push('Claim date is required');
        }

        if (!this.separation_date) {
            errors.push('Separation date is required');
        }

        // Date validation
        if (this.claim_date && this.separation_date) {
            const claimDate = new Date(this.claim_date);
            const separationDate = new Date(this.separation_date);
            
            if (claimDate > separationDate) {
                errors.push('Claim date cannot be after separation date');
            }
            
            // Check if separation date is not too far in the future
            const today = new Date();
            const yearFromNow = new Date();
            yearFromNow.setFullYear(today.getFullYear() + 1);
            
            if (separationDate > yearFromNow) {
                warnings.push('Separation date is more than a year in the future');
            }
        }

        // Status-specific validations
        if (this.status === 'Paid' && !this.payment_date) {
            errors.push('Payment date is required for paid status');
        }

        if (this.status === 'Paid' && !this.check_number) {
            warnings.push('Check number is recommended for paid status');
        }

        // Amount validation
        if (this.computed_amount && this.computed_amount <= 0) {
            errors.push('Computed amount must be greater than 0');
        }

        // Large amount warning
        if (this.computed_amount && this.computed_amount > 1000000) {
            warnings.push('Computed amount is unusually high - please verify calculation');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Calculate TLB amount
    calculateAmount() {
        if (!this.total_leave_credits || !this.highest_monthly_salary) {
            return 0;
        }
        
        const amount = calculateTLB(
            this.total_leave_credits,
            this.highest_monthly_salary,
            this.constant_factor || 1.0
        );
        
        this.computed_amount = amount;
        this.formatted_amount = formatCurrency(amount);
        
        return amount;
    }

    // Save TLB record
    async save() {
        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Calculate amount before saving
        this.calculateAmount();

        try {
            if (this.id) {
                return await this.update();
            } else {
                return await this.create();
            }
        } catch (error) {
            throw new Error(`Failed to save TLB record: ${error.message}`);
        }
    }

    // Create new TLB record
    async create() {
        // Check if TLB record already exists for this employee
        const existingCheck = await executeQuery(
            'SELECT id FROM terminal_leave_benefits WHERE employee_id = ?',
            [this.employee_id]
        );

        if (existingCheck.success && existingCheck.data.length > 0) {
            throw new Error('TLB record already exists for this employee');
        }

        const query = `
            INSERT INTO terminal_leave_benefits (
                employee_id,
                total_leave_credits,
                highest_monthly_salary,
                constant_factor,
                computed_amount,
                claim_date,
                separation_date,
                processed_by,
                notes,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.employee_id,
            this.total_leave_credits,
            this.highest_monthly_salary,
            this.constant_factor,
            this.computed_amount,
            this.claim_date,
            this.separation_date,
            this.processed_by,
            this.notes,
            this.status
        ];

        const result = await executeQuery(query, params);
        
        if (result.success) {
            this.id = result.data.insertId;
            return { success: true, insertId: result.data.insertId };
        }
        
        throw new Error('Failed to create TLB record');
    }

    // Update existing TLB record
    async update() {
        if (!this.id) {
            throw new Error('Cannot update TLB record without ID');
        }

        const query = `
            UPDATE terminal_leave_benefits SET
                total_leave_credits = ?,
                highest_monthly_salary = ?,
                constant_factor = ?,
                computed_amount = ?,
                claim_date = ?,
                separation_date = ?,
                status = ?,
                check_number = ?,
                payment_date = ?,
                notes = ?
            WHERE id = ?
        `;

        const params = [
            this.total_leave_credits,
            this.highest_monthly_salary,
            this.constant_factor,
            this.computed_amount,
            this.claim_date,
            this.separation_date,
            this.status,
            this.check_number,
            this.payment_date,
            this.notes,
            this.id
        ];

        const result = await executeQuery(query, params);
        
        if (result.success) {
            return { success: true };
        }
        
        throw new Error('Failed to update TLB record');
    }

    // Delete TLB record
    async delete() {
        if (!this.id) {
            throw new Error('Cannot delete TLB record without ID');
        }

        // Prevent deletion of paid records
        if (this.status === 'Paid') {
            throw new Error('Cannot delete TLB records that have been paid');
        }

        const result = await executeQuery(
            'DELETE FROM terminal_leave_benefits WHERE id = ?',
            [this.id]
        );

        if (result.success) {
            return { success: true };
        }
        
        throw new Error('Failed to delete TLB record');
    }

    // Find TLB record by ID
    static async findById(id) {
        const query = `
            SELECT 
                tlb.*,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.employee_number,
                e.plantilla_position,
                e.appointment_date,
                processed_by_user.username as processed_by_name
            FROM terminal_leave_benefits tlb
            JOIN employees e ON tlb.employee_id = e.id
            LEFT JOIN users processed_by_user ON tlb.processed_by = processed_by_user.id
            WHERE tlb.id = ?
        `;

        const result = await executeQuery(query, [id]);
        
        if (result.success && result.data.length > 0) {
            const data = result.data[0];
            const tlb = new TerminalLeaveBenefits(data);
            
            // Calculate years of service
            if (data.appointment_date && data.separation_date) {
                tlb.years_of_service = calculateYearsOfService(data.appointment_date, data.separation_date);
            }
            
            // Format amount
            if (tlb.computed_amount) {
                tlb.formatted_amount = formatCurrency(tlb.computed_amount);
            }
            
            return tlb;
        }
        
        return null;
    }

    // Find TLB record by employee ID
    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT 
                tlb.*,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.employee_number,
                e.plantilla_position,
                e.appointment_date,
                processed_by_user.username as processed_by_name
            FROM terminal_leave_benefits tlb
            JOIN employees e ON tlb.employee_id = e.id
            LEFT JOIN users processed_by_user ON tlb.processed_by = processed_by_user.id
            WHERE tlb.employee_id = ?
        `;

        const result = await executeQuery(query, [employeeId]);
        
        if (result.success && result.data.length > 0) {
            const data = result.data[0];
            const tlb = new TerminalLeaveBenefits(data);
            
            // Calculate years of service
            if (data.appointment_date && data.separation_date) {
                tlb.years_of_service = calculateYearsOfService(data.appointment_date, data.separation_date);
            }
            
            // Format amount
            if (tlb.computed_amount) {
                tlb.formatted_amount = formatCurrency(tlb.computed_amount);
            }
            
            return tlb;
        }
        
        return null;
    }

    // Get all TLB records with filtering and pagination
    static async findAll(filters = {}, pagination = {}) {
        const {
            status,
            employee_id,
            year,
            search
        } = filters;

        const {
            page = 1,
            limit = 10,
            sort_by = 'claim_date',
            sort_order = 'DESC'
        } = pagination;

        let whereClause = '';
        const queryParams = [];
        const conditions = [];

        // Apply filters
        if (status) {
            conditions.push('tlb.status = ?');
            queryParams.push(status);
        }

        if (employee_id) {
            conditions.push('tlb.employee_id = ?');
            queryParams.push(employee_id);
        }

        if (year) {
            conditions.push('YEAR(tlb.claim_date) = ?');
            queryParams.push(year);
        }

        if (search) {
            conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_number LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        // Validate sort fields
        const validSortFields = ['claim_date', 'computed_amount', 'status', 'separation_date'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'claim_date';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Calculate pagination
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * pageSize;

        const query = `
            SELECT 
                tlb.*,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.employee_number,
                e.plantilla_position,
                e.appointment_date,
                processed_by_user.username as processed_by_name
            FROM terminal_leave_benefits tlb
            JOIN employees e ON tlb.employee_id = e.id
            LEFT JOIN users processed_by_user ON tlb.processed_by = processed_by_user.id
            ${whereClause ? whereClause : ''}
            ORDER BY tlb.${sortField} ${sortDirection}
            LIMIT ${pageSize} OFFSET ${offset}
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM terminal_leave_benefits tlb
            JOIN employees e ON tlb.employee_id = e.id
            ${whereClause ? whereClause : ''}
        `;

        const [recordsResult, countResult] = await Promise.all([
            executeQuery(query, queryParams).catch(err => {
                console.error('Records query error:', err);
                console.error('Query:', query);
                console.error('Params:', queryParams);
                throw err;
            }),
            executeQuery(countQuery, queryParams).catch(err => {
                console.error('Count query error:', err);
                console.error('Query:', countQuery);
                console.error('Params:', queryParams);
                throw err;
            })
        ]);

        if (recordsResult.success && countResult.success) {
            const records = recordsResult.data.map(data => {
                const tlb = new TerminalLeaveBenefits(data);
                
                // Calculate years of service
                if (data.appointment_date && data.separation_date) {
                    tlb.years_of_service = calculateYearsOfService(data.appointment_date, data.separation_date);
                }
                
                // Format amount
                if (tlb.computed_amount) {
                    tlb.formatted_amount = formatCurrency(tlb.computed_amount);
                }
                
                return tlb;
            });

            const totalRecords = countResult.data[0].total;
            const totalPages = Math.ceil(totalRecords / pageSize);

            return {
                success: true,
                data: records,
                pagination: {
                    currentPage: pageNum,
                    pageSize,
                    totalPages,
                    totalRecords,
                    hasNext: pageNum < totalPages,
                    hasPrevious: pageNum > 1
                }
            };
        }

        throw new Error('Failed to fetch TLB records');
    }

    // Calculate TLB for an employee without saving
    static async calculateForEmployee(employeeId, separationDate, claimDate) {
        // Get employee information
        const employeeQuery = `
            SELECT 
                e.*,
                u.username
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = ?
        `;

        const employeeResult = await executeQuery(employeeQuery, [employeeId]);

        if (!employeeResult.success || employeeResult.data.length === 0) {
            throw new Error('Employee not found');
        }

        const employee = employeeResult.data[0];

        // Get total leave credits
        const leaveCreditsQuery = `
            SELECT 
                SUM(earned_days) - SUM(used_days) - SUM(monetized_days) as total_leave_credits
            FROM employee_leave_balances
            WHERE employee_id = ?
        `;

        const leaveCreditsResult = await executeQuery(leaveCreditsQuery, [employeeId]);
        const totalLeaveCredits = leaveCreditsResult.success && leaveCreditsResult.data[0].total_leave_credits 
            ? parseFloat(leaveCreditsResult.data[0].total_leave_credits) 
            : 0;

        // Get highest monthly salary
        const salaryQuery = `
            SELECT MAX(salary) as highest_salary
            FROM service_records
            WHERE employee_id = ? AND salary IS NOT NULL
            UNION ALL
            SELECT current_monthly_salary as highest_salary
            FROM employees
            WHERE id = ? AND current_monthly_salary IS NOT NULL
            ORDER BY highest_salary DESC
            LIMIT 1
        `;

        const salaryResult = await executeQuery(salaryQuery, [employeeId, employeeId]);
        const highestMonthlySalary = salaryResult.success && salaryResult.data.length > 0 
            ? parseFloat(salaryResult.data[0].highest_salary) 
            : parseFloat(employee.current_monthly_salary || 0);

        // Get system constant factor
        const constantFactorQuery = `
            SELECT setting_value
            FROM system_settings
            WHERE setting_key = 'tlb_constant_factor'
        `;

        const constantFactorResult = await executeQuery(constantFactorQuery);
        const constantFactor = constantFactorResult.success && constantFactorResult.data.length > 0
            ? parseFloat(constantFactorResult.data[0].setting_value)
            : 1.0;

        // Create TLB instance for calculation
        const tlb = new TerminalLeaveBenefits({
            employee_id: employeeId,
            total_leave_credits: totalLeaveCredits,
            highest_monthly_salary: highestMonthlySalary,
            constant_factor: constantFactor,
            claim_date: claimDate,
            separation_date: separationDate,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            employee_number: employee.employee_number,
            plantilla_position: employee.plantilla_position,
            appointment_date: employee.appointment_date
        });

        // Calculate amount
        tlb.calculateAmount();

        // Calculate years of service
        if (employee.appointment_date && separationDate) {
            tlb.years_of_service = calculateYearsOfService(employee.appointment_date, separationDate);
        }

        return tlb;
    }

    // Get TLB statistics
    static async getStatistics(filters = {}) {
        const { year, employee_id } = filters;
        
        let whereClause = '';
        const queryParams = [];

        if (employee_id) {
            whereClause = 'WHERE tlb.employee_id = ?';
            queryParams.push(employee_id);
        }

        if (year) {
            if (whereClause) {
                whereClause += ' AND YEAR(tlb.claim_date) = ?';
            } else {
                whereClause = 'WHERE YEAR(tlb.claim_date) = ?';
            }
            queryParams.push(year);
        }

        const query = `
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN status = 'Computed' THEN 1 END) as computed_count,
                COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_count,
                COALESCE(SUM(computed_amount), 0) as total_computed_amount,
                COALESCE(SUM(CASE WHEN status = 'Paid' THEN computed_amount ELSE 0 END), 0) as total_paid_amount,
                COALESCE(AVG(computed_amount), 0) as average_amount,
                COALESCE(MAX(computed_amount), 0) as highest_amount,
                COALESCE(MIN(computed_amount), 0) as lowest_amount
            FROM terminal_leave_benefits tlb
            ${whereClause}
        `;

        const result = await executeQuery(query, queryParams);

        if (result.success) {
            const stats = result.data[0];
            return {
                success: true,
                data: {
                    summary: {
                        total_records: parseInt(stats.total_records),
                        total_computed_amount: parseFloat(stats.total_computed_amount),
                        total_paid_amount: parseFloat(stats.total_paid_amount),
                        average_amount: parseFloat(stats.average_amount),
                        highest_amount: parseFloat(stats.highest_amount),
                        lowest_amount: stats.total_records > 0 ? parseFloat(stats.lowest_amount) : 0
                    },
                    status_breakdown: {
                        computed: parseInt(stats.computed_count),
                        approved: parseInt(stats.approved_count),
                        paid: parseInt(stats.paid_count),
                        cancelled: parseInt(stats.cancelled_count)
                    }
                }
            };
        }

        throw new Error('Failed to get TLB statistics');
    }
}

module.exports = TerminalLeaveBenefits;