// models/Leave.js - Enhanced Leave management model
const { executeQuery, findOne, executeTransaction } = require('../config/database');

class Leave {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.leave_type_id = data.leave_type_id || null;
        this.start_date = data.start_date || null;
        this.end_date = data.end_date || null;
        this.days_requested = data.days_requested || null;
        this.reason = data.reason || null;
        this.status = data.status || 'Pending';
        this.applied_at = data.applied_at || null;
        this.reviewed_by = data.reviewed_by || null;
        this.reviewed_at = data.reviewed_at || null;
        this.review_notes = data.review_notes || null;
        
        // Additional properties for enhanced functionality
        this.leave_type_name = data.leave_type_name || null;
        this.leave_type_code = data.leave_type_code || null;
        this.employee_name = data.employee_name || null;
        this.employee_number = data.employee_number || null;
        this.reviewer_name = data.reviewer_name || null;
        this.application_number = data.application_number || null;
        this.duration_days = data.duration_days || null;
    }

    // Enhanced validation with comprehensive business rules
    async validate() {
        const errors = [];
        const warnings = [];

        // Basic field validation
        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!this.leave_type_id) {
            errors.push('Leave type is required');
        }

        if (!this.start_date) {
            errors.push('Start date is required');
        }

        if (!this.end_date) {
            errors.push('End date is required');
        }

        if (!this.days_requested || this.days_requested <= 0) {
            errors.push('Days requested must be greater than 0');
        }

        if (this.start_date && this.end_date && new Date(this.start_date) > new Date(this.end_date)) {
            errors.push('Start date cannot be after end date');
        }

        // Advanced business rule validation
        if (this.start_date && this.end_date && this.employee_id && this.leave_type_id) {
            // Date validation
            const today = new Date();
            const startDate = new Date(this.start_date);
            const endDate = new Date(this.end_date);
            
            // Future date validation
            if (startDate <= today && this.status === 'Pending') {
                errors.push('Leave must be applied at least 1 day in advance');
            }

            // Maximum leave duration validation
            const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            if (duration > 30) {
                warnings.push('Leave duration exceeds 30 days - may require special approval');
            }

            // Check for overlapping leave applications
            const overlappingCheck = await this.checkOverlappingLeave();
            if (!overlappingCheck.success && overlappingCheck.hasOverlap) {
                errors.push('Leave dates overlap with existing approved leave');
            }

            // Validate sufficient leave balance
            const balanceCheck = await this.checkSufficientBalance();
            if (!balanceCheck.success) {
                errors.push(balanceCheck.error || 'Insufficient leave balance');
            } else if (balanceCheck.warning) {
                warnings.push(balanceCheck.warning);
            }

            // Leave type specific validations
            const leaveTypeValidation = await this.validateLeaveTypeRules();
            if (!leaveTypeValidation.success) {
                errors.push(...leaveTypeValidation.errors);
            }
            if (leaveTypeValidation.warnings) {
                warnings.push(...leaveTypeValidation.warnings);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Check for overlapping leave applications
    async checkOverlappingLeave() {
        if (!this.employee_id || !this.start_date || !this.end_date) {
            return { success: true, hasOverlap: false };
        }

        const query = `
            SELECT COUNT(*) as overlap_count
            FROM leave_applications
            WHERE employee_id = ? 
                AND status IN ('Pending', 'Approved')
                AND id != COALESCE(?, 0)
                AND (
                    (start_date <= ? AND end_date >= ?) OR
                    (start_date <= ? AND end_date >= ?) OR
                    (start_date >= ? AND end_date <= ?)
                )
        `;

        const params = [
            this.employee_id, this.id || 0,
            this.start_date, this.start_date,
            this.end_date, this.end_date,
            this.start_date, this.end_date
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            const hasOverlap = result.data[0].overlap_count > 0;
            return { success: true, hasOverlap };
        }

        return { success: false, error: 'Failed to check overlapping leave' };
    }

    // Check sufficient leave balance
    async checkSufficientBalance() {
        if (!this.employee_id || !this.leave_type_id || !this.days_requested) {
            return { success: true };
        }

        const year = new Date(this.start_date).getFullYear();
        const query = `
            SELECT current_balance, lt.max_days_per_year
            FROM employee_leave_balances elb
            JOIN leave_types lt ON elb.leave_type_id = lt.id
            WHERE elb.employee_id = ? AND elb.leave_type_id = ? AND elb.year = ?
        `;

        const result = await executeQuery(query, [this.employee_id, this.leave_type_id, year]);
        if (result.success && result.data.length > 0) {
            const balance = result.data[0];
            
            // Convert to numbers to ensure proper comparison
            const availableBalance = parseFloat(balance.current_balance) || 0;
            const requestedDays = parseFloat(this.days_requested) || 0;
            
            console.log(`Balance check - Available: ${availableBalance}, Requested: ${requestedDays}, Employee: ${this.employee_id}, Leave Type: ${this.leave_type_id}`);
            
            if (availableBalance < requestedDays) {
                return {
                    success: false,
                    error: `Insufficient leave balance. Available: ${availableBalance.toFixed(2)} days, Requested: ${requestedDays.toFixed(2)} days`
                };
            }

            // Warning if balance gets very low
            const remainingAfter = availableBalance - requestedDays;
            if (remainingAfter < 2 && balance.max_days_per_year > 10) {
                return {
                    success: true,
                    warning: `Low leave balance warning: Only ${remainingAfter.toFixed(2)} days will remain after this leave`
                };
            }

            return { success: true };
        }

        return { success: false, error: 'Leave balance not found for this year' };
    }

    // Validate leave type specific rules
    async validateLeaveTypeRules() {
        if (!this.leave_type_id) {
            return { success: true, errors: [], warnings: [] };
        }

        const query = `
            SELECT * FROM leave_types WHERE id = ?
        `;

        const result = await executeQuery(query, [this.leave_type_id]);
        if (!result.success || result.data.length === 0) {
            return { success: false, errors: ['Invalid leave type'] };
        }

        const leaveType = result.data[0];
        const errors = [];
        const warnings = [];
        const duration = this.days_requested;

        // Forced Leave validation
        if (leaveType.code === 'FL') {
            if (this.includesWeekend()) {
                errors.push('Forced leave cannot include weekends');
            }
            if (duration > 5) {
                warnings.push('Forced leave duration exceeds typical 5-day period');
            }
        }

        // Sick Leave validation
        if (leaveType.code === 'SL') {
            if (duration >= 3 && leaveType.requires_medical_certificate) {
                warnings.push('Medical certificate required for sick leave of 3 or more days');
            }
        }

        // Maternity Leave validation
        if (leaveType.code === 'ML') {
            if (duration > 105) {
                errors.push('Maternity leave cannot exceed 105 days');
            }
        }

        // Paternity Leave validation
        if (leaveType.code === 'PL') {
            if (duration > 7) {
                errors.push('Paternity leave cannot exceed 7 days');
            }
        }

        // Special Privilege Leave validation
        if (leaveType.code === 'SPL') {
            const currentYear = new Date(this.start_date).getFullYear();
            const splUsedQuery = `
                SELECT SUM(days_requested) as used_spl
                FROM leave_applications la
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE la.employee_id = ? AND lt.code = 'SPL' 
                    AND YEAR(la.start_date) = ? AND la.status = 'Approved'
                    AND la.id != COALESCE(?, 0)
            `;
            
            const splResult = await executeQuery(splUsedQuery, [this.employee_id, currentYear, this.id || 0]);
            if (splResult.success) {
                const usedSpl = splResult.data[0].used_spl || 0;
                if (usedSpl + duration > 3) {
                    errors.push(`SPL limit exceeded. Used: ${usedSpl} days, Annual limit: 3 days`);
                }
            }
        }

        return { success: errors.length === 0, errors, warnings };
    }

    // Check if leave period includes weekends
    includesWeekend() {
        if (!this.start_date || !this.end_date) return false;
        
        const start = new Date(this.start_date);
        const end = new Date(this.end_date);
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                return true;
            }
        }
        
        return false;
    }

    // Generate application number
    static generateApplicationNumber() {
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        return `LA-${year}-${timestamp}`;
    }

    // Enhanced working days calculation with holiday support
    static calculateWorkingDays(startDate, endDate, excludeHolidays = false) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let workingDays = 0;

        // Get holidays if needed (placeholder for future holiday table)
        const holidays = excludeHolidays ? [] : []; // TODO: Implement holiday checking

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            // Exclude weekends
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // TODO: Check if date is not a holiday
                workingDays++;
            }
        }

        return workingDays;
    }

    // Calculate calendar days between dates
    static calculateCalendarDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Enhanced save method with async validation
    async save() {
        const validation = await this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors,
                warnings: validation.warnings
            };
        }

        try {
            // Generate application number if creating new
            if (!this.id && !this.application_number) {
                this.application_number = Leave.generateApplicationNumber();
            }

            if (this.id) {
                return await this.update();
            } else {
                return await this.create();
            }
        } catch (error) {
            return {
                success: false,
                error: 'Failed to save leave application',
                details: error.message
            };
        }
    }

    // Create new leave application with application number
    async create() {
        const query = `
            INSERT INTO leave_applications (
                employee_id, leave_type_id, start_date, end_date, 
                days_requested, reason, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.employee_id, this.leave_type_id, this.start_date,
            this.end_date, this.days_requested, this.reason, this.status
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Leave application submitted successfully'
            };
        }

        return result;
    }

    // Update leave application
    async update() {
        const query = `
            UPDATE leave_applications SET
                employee_id = ?, leave_type_id = ?, start_date = ?, end_date = ?,
                days_requested = ?, reason = ?, status = ?, reviewed_by = ?,
                reviewed_at = ?, review_notes = ?
            WHERE id = ?
        `;

        const params = [
            this.employee_id, this.leave_type_id, this.start_date, this.end_date,
            this.days_requested, this.reason, this.status, this.reviewed_by,
            this.reviewed_at, this.review_notes, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Leave application updated successfully'
            };
        }

        return result;
    }

    // Enhanced approve method with comprehensive balance checking
    async approve(reviewedBy, reviewNotes = '') {
        const transactionResult = await executeTransaction(async (connection) => {
            // Validate current status
            if (this.status !== 'Pending') {
                throw new Error('Only pending leave applications can be approved');
            }

            // Re-validate balance before approval
            const balanceCheck = await this.checkSufficientBalance();
            if (!balanceCheck.success) {
                throw new Error(balanceCheck.error || 'Insufficient leave balance');
            }

            // Update leave application status
            await connection.execute(
                `UPDATE leave_applications SET 
                 status = 'Approved', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
                 WHERE id = ?`,
                [reviewedBy, reviewNotes, this.id]
            );

            // Deduct leave balance
            const year = new Date(this.start_date).getFullYear();
            const [updateResult] = await connection.execute(
                `UPDATE employee_leave_balances SET 
                 used_days = used_days + ?, 
                 current_balance = current_balance - ?
                 WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
                [this.days_requested, this.days_requested, this.employee_id, this.leave_type_id, year]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error('Failed to update leave balance - balance record not found');
            }

            // Update instance properties
            this.status = 'Approved';
            this.reviewed_by = reviewedBy;
            this.reviewed_at = new Date();
            this.review_notes = reviewNotes;

            // Fetch the updated leave with all related information
            const updatedLeave = await Leave.findById(this.id);
            if (!updatedLeave.success || !updatedLeave.data) {
                throw new Error('Failed to fetch updated leave information');
            }

            return updatedLeave.data;
        });

        // Handle transaction result
        if (!transactionResult.success) {
            return transactionResult;
        }

        return {
            success: true,
            data: transactionResult.data,
            message: 'Leave application approved and balance updated successfully'
        };
    }

    // Reject leave application
    async reject(reviewedBy, reviewNotes = '') {
        const query = `
            UPDATE leave_applications SET 
                status = 'Rejected', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [reviewedBy, reviewNotes, this.id]);
        
        if (result.success) {
            // Update instance properties
            this.status = 'Rejected';
            this.reviewed_by = reviewedBy;
            this.reviewed_at = new Date();
            this.review_notes = reviewNotes;

            // Fetch the updated leave with all related information
            const updatedLeave = await Leave.findById(this.id);
            if (!updatedLeave.success || !updatedLeave.data) {
                return {
                    success: false,
                    error: 'Failed to fetch updated leave information'
                };
            }

            return {
                success: true,
                data: updatedLeave.data,
                message: 'Leave application rejected successfully'
            };
        }

        return result;
    }

    // Cancel leave application
    async cancel() {
        const query = `
            UPDATE leave_applications SET status = 'Cancelled' WHERE id = ? AND status = 'Pending'
        `;

        const result = await executeQuery(query, [this.id]);
        
        if (result.success) {
            // Update instance properties
            this.status = 'Cancelled';

            // Fetch the updated leave with all related information
            const updatedLeave = await Leave.findById(this.id);
            if (!updatedLeave.success || !updatedLeave.data) {
                return {
                    success: false,
                    error: 'Failed to fetch updated leave information'
                };
            }

            return {
                success: true,
                data: updatedLeave.data,
                message: 'Leave application cancelled successfully'
            };
        }

        return result;
    }

    // Static methods

    // Find leave by ID
    static async findById(id) {
        const query = `
            SELECT la.*, lt.name as leave_type_name, lt.code as leave_type_code,
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                   CONCAT(r.first_name, ' ', r.last_name) as reviewer_name
            FROM leave_applications la
            LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
            LEFT JOIN employees e ON la.employee_id = e.id
            LEFT JOIN users u ON la.reviewed_by = u.id
            LEFT JOIN employees r ON u.id = r.user_id
            WHERE la.id = ?
        `;
        
        const result = await findOne(query, [id]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new Leave(result.data)
            };
        }
        
        return result;
    }

    // Enhanced findAll with comprehensive filtering and sorting
    static async findAll(filters = {}) {
        let query = `
            SELECT la.*, lt.name as leave_type_name, lt.code as leave_type_code,
                   CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
                   e.employee_number,
                   CONCAT(r.first_name, ' ', IFNULL(r.middle_name, ''), ' ', r.last_name) as reviewer_name,
                   DATEDIFF(la.end_date, la.start_date) + 1 as duration_days
            FROM leave_applications la
            LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
            LEFT JOIN employees e ON la.employee_id = e.id
            LEFT JOIN users u ON la.reviewed_by = u.id
            LEFT JOIN employees r ON u.id = r.user_id
            WHERE 1=1
        `;
        
        const params = [];

        // Apply filters
        if (filters.employee_id) {
            query += ' AND la.employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                query += ` AND la.status IN (${filters.status.map(() => '?').join(',')})`;
                params.push(...filters.status);
            } else {
                query += ' AND la.status = ?';
                params.push(filters.status);
            }
        }

        if (filters.leave_type_id) {
            query += ' AND la.leave_type_id = ?';
            params.push(filters.leave_type_id);
        }

        if (filters.leave_type_code) {
            query += ' AND lt.code = ?';
            params.push(filters.leave_type_code);
        }

        if (filters.start_date) {
            query += ' AND la.start_date >= ?';
            params.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ' AND la.end_date <= ?';
            params.push(filters.end_date);
        }

        if (filters.year) {
            query += ' AND YEAR(la.start_date) = ?';
            params.push(filters.year);
        }

        if (filters.month) {
            query += ' AND MONTH(la.start_date) = ?';
            params.push(filters.month);
        }

        if (filters.search) {
            query += ` AND (
                CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR
                e.employee_number LIKE ? OR
                la.reason LIKE ?
            )`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Sorting
        if (filters.sort_by) {
            const validSortFields = {
                'applied_at': 'la.applied_at',
                'start_date': 'la.start_date',
                'end_date': 'la.end_date',
                'status': 'la.status',
                'employee_name': 'employee_name',
                'leave_type': 'lt.name',
                'days_requested': 'la.days_requested'
            };
            
            const sortField = validSortFields[filters.sort_by] || 'la.applied_at';
            const sortOrder = filters.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${sortField} ${sortOrder}`;
        } else {
            query += ' ORDER BY la.applied_at DESC';
        }

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
            const leaves = result.data.map(row => new Leave(row));
            return {
                success: true,
                data: leaves
            };
        }

        return result;
    }

    // Get leave statistics
    static async getStatistics(filters = {}) {
        const conditions = [];
        const params = [];

        if (filters.year) {
            conditions.push('YEAR(la.start_date) = ?');
            params.push(filters.year);
        }

        if (filters.employee_id) {
            conditions.push('la.employee_id = ?');
            params.push(filters.employee_id);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const queries = [
            `SELECT COUNT(*) as total FROM leave_applications la ${whereClause}`,
            `SELECT COUNT(*) as total FROM leave_applications la ${whereClause} AND la.status = 'Pending'`,
            `SELECT COUNT(*) as total FROM leave_applications la ${whereClause} AND la.status = 'Approved'`,
            `SELECT COUNT(*) as total FROM leave_applications la ${whereClause} AND la.status = 'Rejected'`,
            `SELECT lt.name, COUNT(*) as count 
             FROM leave_applications la 
             LEFT JOIN leave_types lt ON la.leave_type_id = lt.id 
             ${whereClause} 
             GROUP BY la.leave_type_id`
        ];

        try {
            const [total, pending, approved, rejected, byType] = await Promise.all(
                queries.map(query => executeQuery(query, params))
            );

            return {
                success: true,
                data: {
                    total: total.success ? total.data[0].total : 0,
                    pending: pending.success ? pending.data[0].total : 0,
                    approved: approved.success ? approved.data[0].total : 0,
                    rejected: rejected.success ? rejected.data[0].total : 0,
                    byType: byType.success ? byType.data : []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get leave statistics',
                details: error.message
            };
        }
    }

        // Get leave applications count for pagination
        static async getCount(filters = {}) {
            let query = `
                SELECT COUNT(*) as total
                FROM leave_applications la
                LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
                LEFT JOIN employees e ON la.employee_id = e.id
                WHERE 1=1
            `;
            
            const params = [];
    
            // Apply same filters as findAll
            if (filters.employee_id) {
                query += ' AND la.employee_id = ?';
                params.push(filters.employee_id);
            }
    
            if (filters.status) {
                if (Array.isArray(filters.status)) {
                    query += ` AND la.status IN (${filters.status.map(() => '?').join(',')})`;
                    params.push(...filters.status);
                } else {
                    query += ' AND la.status = ?';
                    params.push(filters.status);
                }
            }
    
            if (filters.leave_type_id) {
                query += ' AND la.leave_type_id = ?';
                params.push(filters.leave_type_id);
            }
    
            if (filters.year) {
                query += ' AND YEAR(la.start_date) = ?';
                params.push(filters.year);
            }
    
            if (filters.search) {
                query += ` AND (
                    CONCAT(e.first_name, ' ', e.last_name) LIKE ? OR
                    e.employee_number LIKE ? OR
                    la.reason LIKE ?
                )`;
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
    
            const result = await executeQuery(query, params);
            return result.success ? result.data[0].total : 0;
        }
    
        // Get pending approvals for admins
        static async getPendingApprovals(filters = {}) {
            const pendingFilters = { ...filters, status: 'Pending' };
            return await Leave.findAll(pendingFilters);
        }
    
        // Get leave calendar for conflict checking
        static async getLeaveCalendar(startDate, endDate, excludeEmployeeId = null) {
            let query = `
                SELECT la.*, 
                       CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                       e.employee_number,
                       lt.name as leave_type_name,
                       lt.code as leave_type_code
                FROM leave_applications la
                JOIN employees e ON la.employee_id = e.id
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE la.status IN ('Approved', 'Pending')
                    AND la.start_date <= ? AND la.end_date >= ?
            `;
            
            const params = [endDate, startDate];
            
            if (excludeEmployeeId) {
                query += ' AND la.employee_id != ?';
                params.push(excludeEmployeeId);
            }
            
            query += ' ORDER BY la.start_date ASC';
            
            return await executeQuery(query, params);
        }
}

// Enhanced Leave Balance Model
class LeaveBalance {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.leave_type_id = data.leave_type_id || null;
        this.year = data.year || new Date().getFullYear();
        this.earned_days = parseFloat(data.earned_days) || 0;
        this.used_days = parseFloat(data.used_days) || 0;
        this.monetized_days = parseFloat(data.monetized_days) || 0;
        this.carried_forward = parseFloat(data.carried_forward) || 0;
        this.current_balance = parseFloat(data.current_balance) || 0;
        
        // Additional properties for enhanced functionality
        this.leave_type_name = data.leave_type_name || null;
        this.leave_type_code = data.leave_type_code || null;
        this.max_days_per_year = data.max_days_per_year || null;
        this.is_monetizable = data.is_monetizable || false;
    }

    // Enhanced calculate current balance with validation
    calculateBalance() {
        const earned = parseFloat(this.earned_days) || 0;
        const used = parseFloat(this.used_days) || 0;
        const monetized = parseFloat(this.monetized_days) || 0;
        const carriedForward = parseFloat(this.carried_forward) || 0;
        
        this.current_balance = earned + carriedForward - used - monetized;
        
        // Ensure balance doesn't go negative (business rule)
        if (this.current_balance < 0) {
            this.current_balance = 0;
        }
        
        return this.current_balance;
    }

    // Validate balance data
    validate() {
        const errors = [];
        
        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }
        
        if (!this.leave_type_id) {
            errors.push('Leave type ID is required');
        }
        
        if (!this.year || this.year < 2000 || this.year > 2100) {
            errors.push('Valid year is required');
        }
        
        if (this.earned_days < 0) {
            errors.push('Earned days cannot be negative');
        }
        
        if (this.used_days < 0) {
            errors.push('Used days cannot be negative');
        }
        
        if (this.monetized_days < 0) {
            errors.push('Monetized days cannot be negative');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Enhanced save with validation
    async save() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }
        
        this.calculateBalance();

        return await executeTransaction(async (connection) => {
            const query = `
                INSERT INTO employee_leave_balances (
                    employee_id, leave_type_id, year, earned_days, used_days,
                    monetized_days, carried_forward, current_balance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    earned_days = VALUES(earned_days),
                    used_days = VALUES(used_days),
                    monetized_days = VALUES(monetized_days),
                    carried_forward = VALUES(carried_forward),
                    current_balance = VALUES(current_balance)
            `;

            const params = [
                this.employee_id, this.leave_type_id, this.year,
                this.earned_days, this.used_days, this.monetized_days,
                this.carried_forward, this.current_balance
            ];

            const [result] = await connection.execute(query, params);
            
            return {
                success: true,
                data: this,
                message: 'Leave balance saved successfully'
            };
        });
    }

    // Enhanced getEmployeeBalances with detailed information
    static async getEmployeeBalances(employeeId, year = null) {
        const currentYear = year || new Date().getFullYear();
        
        const query = `
            SELECT elb.*, lt.id as leave_type_id, lt.name as leave_type_name, lt.code as leave_type_code,
                   lt.max_days_per_year, lt.is_monetizable, lt.requires_medical_certificate,
                   COALESCE(elb.current_balance, 0) as available_balance
            FROM leave_types lt
            LEFT JOIN employee_leave_balances elb ON lt.id = elb.leave_type_id 
                AND elb.employee_id = ? AND elb.year = ?
            ORDER BY lt.name
        `;

        const result = await executeQuery(query, [employeeId, currentYear]);
        
        if (result.success) {
            // Initialize balances for leave types that don't exist
            const balances = result.data.map(row => {
                if (!row.id) {
                    // No balance record exists, create default
                    return {
                        id: null,
                        employee_id: parseInt(employeeId),
                        leave_type_id: row.leave_type_id,
                        year: currentYear,
                        earned_days: 0,
                        used_days: 0,
                        monetized_days: 0,
                        carried_forward: 0,
                        pending_days: 0,
                        current_balance: 0,
                        leave_type_name: row.leave_type_name,
                        leave_type_code: row.leave_type_code,
                        max_days_per_year: row.max_days_per_year,
                        is_monetizable: row.is_monetizable,
                        requires_medical_certificate: row.requires_medical_certificate,
                        available_balance: 0,
                        created_at: null,
                        updated_at: null
                    };
                }
                return {
                    ...row,
                    employee_id: parseInt(employeeId),
                    pending_days: row.pending_days || 0
                };
            });
            
            return {
                success: true,
                data: balances
            };
        }
        
        return result;
    }

    // Process leave monetization
    static async processMonetization(employeeId, leaveTypeId, year, daysToMonetize, processedBy) {
        return await executeTransaction(async (connection) => {
            // Get current balance
            const [balanceResult] = await connection.execute(
                `SELECT * FROM employee_leave_balances elb
                 JOIN leave_types lt ON elb.leave_type_id = lt.id
                 WHERE elb.employee_id = ? AND elb.leave_type_id = ? AND elb.year = ?`,
                [employeeId, leaveTypeId, year]
            );

            if (balanceResult.length === 0) {
                throw new Error('Leave balance not found');
            }

            const balance = balanceResult[0];
            
            // Validate monetization eligibility
            if (!balance.is_monetizable) {
                throw new Error('This leave type is not monetizable');
            }

            if (balance.current_balance < daysToMonetize) {
                throw new Error(`Insufficient balance. Available: ${balance.current_balance} days`);
            }

            // Update balance
            await connection.execute(
                `UPDATE employee_leave_balances SET
                 monetized_days = monetized_days + ?,
                 current_balance = current_balance - ?
                 WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
                [daysToMonetize, daysToMonetize, employeeId, leaveTypeId, year]
            );

            // Log monetization in compensation table (if exists)
            // This would integrate with the compensation module
            
            return {
                success: true,
                message: `Successfully monetized ${daysToMonetize} days`,
                data: {
                    employee_id: employeeId,
                    leave_type_id: leaveTypeId,
                    year: year,
                    monetized_days: daysToMonetize,
                    remaining_balance: balance.current_balance - daysToMonetize
                }
            };
        });
    }

    // Process year-end carry forward
    static async processCarryForward(employeeId, fromYear, toYear) {
        return await executeTransaction(async (connection) => {
            // Get system settings for carry forward limits
            const [carrySettings] = await connection.execute(
                'SELECT setting_value FROM system_settings WHERE setting_key = "max_carry_forward_days"'
            );
            
            const maxCarryForward = parseFloat(carrySettings[0]?.setting_value || 5);

            // Get current year balances for carry-forward eligible leave types
            const [balances] = await connection.execute(
                `SELECT elb.*, lt.code, lt.name 
                 FROM employee_leave_balances elb
                 JOIN leave_types lt ON elb.leave_type_id = lt.id
                 WHERE elb.employee_id = ? AND elb.year = ? 
                   AND lt.code IN ('VL', 'SL')`, // Only VL and SL can be carried forward
                [employeeId, fromYear]
            );

            const carryForwardResults = [];

            for (const balance of balances) {
                const carryForwardDays = Math.min(balance.current_balance, maxCarryForward);
                
                if (carryForwardDays > 0) {
                    // Create or update next year's balance
                    await connection.execute(
                        `INSERT INTO employee_leave_balances 
                         (employee_id, leave_type_id, year, carried_forward, current_balance)
                         VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE 
                         carried_forward = VALUES(carried_forward),
                         current_balance = current_balance + VALUES(carried_forward)`,
                        [employeeId, balance.leave_type_id, toYear, carryForwardDays, carryForwardDays]
                    );

                    carryForwardResults.push({
                        leave_type: balance.name,
                        carried_forward: carryForwardDays
                    });
                }
            }

            return {
                success: true,
                message: 'Year-end carry forward processed successfully',
                data: carryForwardResults
            };
        });
    }

    // Initialize yearly balances for employee with prorated calculation
    static async initializeYearlyBalances(employeeId, year, appointmentDate = null) {
        return await executeTransaction(async (connection) => {
            // Get employee's appointment date if not provided
            let empAppointmentDate = appointmentDate;
            if (!empAppointmentDate) {
                const [employee] = await connection.execute(
                    'SELECT appointment_date FROM employees WHERE id = ?',
                    [employeeId]
                );
                if (employee.length === 0) {
                    throw new Error('Employee not found');
                }
                empAppointmentDate = employee[0].appointment_date;
            }

            // Calculate prorated months remaining in the year
            const appointmentDateObj = new Date(empAppointmentDate);
            const appointmentYear = appointmentDateObj.getFullYear();
            const appointmentMonth = appointmentDateObj.getMonth() + 1; // JavaScript months are 0-indexed
            
            // If appointment is not in the current year, use standard calculation
            let proratedMonths = 12;
            if (appointmentYear === year) {
                // Calculate remaining months from appointment date to end of year
                proratedMonths = 13 - appointmentMonth; // Including the appointment month
            }

            // Get VL and SL monthly accrual rates from system settings
            const [vlSetting] = await connection.execute(
                'SELECT setting_value FROM system_settings WHERE setting_key = "monthly_vl_accrual"'
            );
            const [slSetting] = await connection.execute(
                'SELECT setting_value FROM system_settings WHERE setting_key = "monthly_sl_accrual"'
            );

            const monthlyVLAccrual = parseFloat(vlSetting[0]?.setting_value || 1.25);
            const monthlySLAccrual = parseFloat(slSetting[0]?.setting_value || 1.25);

            // Get all leave types
            const [leaveTypes] = await connection.execute('SELECT * FROM leave_types');

            for (const leaveType of leaveTypes) {
                // Check if balance already exists
                const [existing] = await connection.execute(
                    'SELECT id FROM employee_leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
                    [employeeId, leaveType.id, year]
                );

                if (existing.length === 0) {
                    let earnedDays = 0;
                    
                    // Calculate prorated earned days based on leave type
                    if (leaveType.code === 'VL') {
                        // Vacation Leave: prorated based on remaining months
                        earnedDays = Math.round((monthlyVLAccrual * proratedMonths) * 100) / 100;
                    } else if (leaveType.code === 'SL') {
                        // Sick Leave: prorated based on remaining months
                        earnedDays = Math.round((monthlySLAccrual * proratedMonths) * 100) / 100;
                    } else if (leaveType.code === 'SPL' && leaveType.max_days_per_year) {
                        // Special Privilege Leave: prorated based on remaining months
                        const monthlySPLAccrual = leaveType.max_days_per_year / 12;
                        earnedDays = Math.round((monthlySPLAccrual * proratedMonths) * 100) / 100;
                    } else {
                        // For other leave types (ML, FL, etc.), use full allocation or 0
                        earnedDays = leaveType.max_days_per_year || 0;
                    }

                    await connection.execute(
                        `INSERT INTO employee_leave_balances 
                         (employee_id, leave_type_id, year, earned_days, current_balance)
                         VALUES (?, ?, ?, ?, ?)`,
                        [employeeId, leaveType.id, year, earnedDays, earnedDays]
                    );
                }
            }

            return { 
                success: true, 
                message: `Yearly balances initialized with prorated calculation (${proratedMonths} months)`,
                prorated_months: proratedMonths,
                appointment_date: empAppointmentDate
            };
        });
    }

    // Process monthly accrual with maximum credit enforcement
    static async processMonthlyAccrual(employeeId, year, month) {
        return await executeTransaction(async (connection) => {
            // First check if employee has existing leave balances for this year
            const [balanceCheck] = await connection.execute(
                `SELECT COUNT(*) as balance_count 
                 FROM employee_leave_balances 
                 WHERE employee_id = ? AND year = ?`,
                [employeeId, year]
            );

            // Only process if employee has existing balances (idempotent check)
            if (balanceCheck[0].balance_count === 0) {
                return { 
                    success: false, 
                    message: 'Employee has no existing leave balances for this year',
                    employee_id: employeeId,
                    year: year
                };
            }

            // Check if accrual has already been processed for this month
            const [accrualCheck] = await connection.execute(
                `SELECT COUNT(*) as accrual_count
                 FROM audit_logs 
                 WHERE action = 'MONTHLY_ACCRUAL_SUCCESS' 
                   AND JSON_EXTRACT(new_values, '$.employee_id') = ?
                   AND JSON_EXTRACT(new_values, '$.year') = ?
                   AND JSON_EXTRACT(new_values, '$.month') = ?
                   AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
                [employeeId, year, month]
            );

            if (accrualCheck[0].accrual_count > 0) {
                return {
                    success: false,
                    message: 'Monthly accrual already processed for this employee and month',
                    employee_id: employeeId,
                    year: year,
                    month: month
                };
            }

            // Get VL and SL accrual rates from system settings
            const [vlSetting] = await connection.execute(
                'SELECT setting_value FROM system_settings WHERE setting_key = "monthly_vl_accrual"'
            );
            const [slSetting] = await connection.execute(
                'SELECT setting_value FROM system_settings WHERE setting_key = "monthly_sl_accrual"'
            );

            const vlAccrual = parseFloat(vlSetting[0]?.setting_value || 1.25);
            const slAccrual = parseFloat(slSetting[0]?.setting_value || 1.25);

            // Get current balances and leave type limits
            const [currentBalances] = await connection.execute(
                `SELECT elb.*, lt.max_days_per_year, lt.code
                 FROM employee_leave_balances elb
                 JOIN leave_types lt ON elb.leave_type_id = lt.id
                 WHERE elb.employee_id = ? AND elb.year = ? AND lt.code IN ('VL', 'SL')`,
                [employeeId, year]
            );

            let vlProcessed = false;
            let slProcessed = false;
            const results = [];

            for (const balance of currentBalances) {
                const currentEarned = parseFloat(balance.earned_days || 0);
                const maxAllowed = parseFloat(balance.max_days_per_year || 15);
                let accrualAmount = 0;
                
                if (balance.code === 'VL') {
                    accrualAmount = vlAccrual;
                    vlProcessed = true;
                } else if (balance.code === 'SL') {
                    accrualAmount = slAccrual;
                    slProcessed = true;
                }

                // Calculate new earned days with maximum limit enforcement
                const newEarnedDays = Math.min(currentEarned + accrualAmount, maxAllowed);
                const actualAccrual = newEarnedDays - currentEarned;

                if (actualAccrual > 0) {
                    // Update balance with the actual accrual amount
                    await connection.execute(
                        `UPDATE employee_leave_balances 
                         SET earned_days = ?, current_balance = current_balance + ?
                         WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
                        [newEarnedDays, actualAccrual, employeeId, balance.leave_type_id, year]
                    );

                    results.push({
                        leave_type: balance.code,
                        previous_earned: currentEarned,
                        accrual_amount: actualAccrual,
                        new_earned: newEarnedDays,
                        max_allowed: maxAllowed,
                        at_maximum: newEarnedDays >= maxAllowed
                    });
                } else {
                    results.push({
                        leave_type: balance.code,
                        previous_earned: currentEarned,
                        accrual_amount: 0,
                        new_earned: currentEarned,
                        max_allowed: maxAllowed,
                        at_maximum: true,
                        message: 'Maximum credit limit reached'
                    });
                }
            }

            return { 
                success: true, 
                message: 'Monthly accrual processed with maximum credit enforcement', 
                employee_id: employeeId, 
                year: year,
                month: month,
                results: results,
                vl_processed: vlProcessed,
                sl_processed: slProcessed
            };
        });
    }
}

// Leave Type Management Model
class LeaveType {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.code = data.code || null;
        this.description = data.description || null;
        this.max_days_per_year = data.max_days_per_year || null;
        this.is_monetizable = data.is_monetizable || false;
        this.requires_medical_certificate = data.requires_medical_certificate || false;
        this.created_at = data.created_at || null;
    }

    // Validate leave type data
    validate() {
        const errors = [];
        
        if (!this.name || this.name.trim().length === 0) {
            errors.push('Leave type name is required');
        }
        
        if (!this.code || this.code.trim().length === 0) {
            errors.push('Leave type code is required');
        }
        
        if (this.code && this.code.length > 10) {
            errors.push('Leave type code must be 10 characters or less');
        }
        
        if (this.name && this.name.length > 50) {
            errors.push('Leave type name must be 50 characters or less');
        }
        
        if (this.max_days_per_year && this.max_days_per_year < 0) {
            errors.push('Maximum days per year cannot be negative');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save leave type
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
                error: 'Failed to save leave type',
                details: error.message
            };
        }
    }

    // Create new leave type
    async create() {
        // Check for duplicate name or code
        const duplicateCheck = await LeaveType.checkDuplicate(this.name, this.code);
        if (!duplicateCheck.success) {
            return duplicateCheck;
        }
        
        const query = `
            INSERT INTO leave_types (
                name, code, description, max_days_per_year, 
                is_monetizable, requires_medical_certificate
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.name, this.code, this.description, this.max_days_per_year,
            this.is_monetizable, this.requires_medical_certificate
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Leave type created successfully'
            };
        }

        return result;
    }

    // Update leave type
    async update() {
        // Check for duplicate name or code (excluding current record)
        const duplicateCheck = await LeaveType.checkDuplicate(this.name, this.code, this.id);
        if (!duplicateCheck.success) {
            return duplicateCheck;
        }
        
        const query = `
            UPDATE leave_types SET
                name = ?, code = ?, description = ?, max_days_per_year = ?,
                is_monetizable = ?, requires_medical_certificate = ?
            WHERE id = ?
        `;

        const params = [
            this.name, this.code, this.description, this.max_days_per_year,
            this.is_monetizable, this.requires_medical_certificate, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Leave type updated successfully'
            };
        }

        return result;
    }

    // Static methods

    // Find leave type by ID
    static async findById(id) {
        const query = 'SELECT * FROM leave_types WHERE id = ?';
        const result = await findOne(query, [id]);
        
        if (result.success && result.data) {
            return {
                success: true,
                data: new LeaveType(result.data)
            };
        }
        
        return result;
    }

    // Find leave type by code
    static async findByCode(code) {
        const query = 'SELECT * FROM leave_types WHERE code = ?';
        const result = await findOne(query, [code]);
        
        if (result.success && result.data) {
            return {
                success: true,
                data: new LeaveType(result.data)
            };
        }
        
        return result;
    }

    // Get all leave types
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM leave_types WHERE 1=1';
        const params = [];
        
        if (filters.is_monetizable !== undefined) {
            query += ' AND is_monetizable = ?';
            params.push(filters.is_monetizable);
        }
        
        if (filters.requires_medical_certificate !== undefined) {
            query += ' AND requires_medical_certificate = ?';
            params.push(filters.requires_medical_certificate);
        }
        
        if (filters.search) {
            query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY name ASC';
        
        const result = await executeQuery(query, params);
        if (result.success) {
            const leaveTypes = result.data.map(row => new LeaveType(row));
            return {
                success: true,
                data: leaveTypes
            };
        }
        
        return result;
    }

    // Check for duplicate name or code
    static async checkDuplicate(name, code, excludeId = null) {
        let query = 'SELECT id, name, code FROM leave_types WHERE (name = ? OR code = ?)';
        const params = [name, code];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await executeQuery(query, params);
        if (result.success) {
            if (result.data.length > 0) {
                const duplicate = result.data[0];
                const duplicateField = duplicate.name === name ? 'name' : 'code';
                return {
                    success: false,
                    error: `Leave type ${duplicateField} '${duplicate[duplicateField]}' already exists`
                };
            }
            return { success: true };
        }
        
        return result;
    }

    // Delete leave type (soft delete if balances exist)
    static async deleteById(id) {
        // Check if leave type is being used in balances or applications
        const usageCheckQueries = [
            'SELECT COUNT(*) as count FROM employee_leave_balances WHERE leave_type_id = ?',
            'SELECT COUNT(*) as count FROM leave_applications WHERE leave_type_id = ?'
        ];
        
        try {
            const [balanceUsage, applicationUsage] = await Promise.all(
                usageCheckQueries.map(query => executeQuery(query, [id]))
            );
            
            const hasBalances = balanceUsage.success && balanceUsage.data[0].count > 0;
            const hasApplications = applicationUsage.success && applicationUsage.data[0].count > 0;
            
            if (hasBalances || hasApplications) {
                return {
                    success: false,
                    error: 'Cannot delete leave type that is being used in employee balances or applications',
                    canSoftDelete: true
                };
            }
            
            // Safe to delete
            const deleteQuery = 'DELETE FROM leave_types WHERE id = ?';
            const result = await executeQuery(deleteQuery, [id]);
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Leave type deleted successfully'
                };
            }
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to delete leave type',
                details: error.message
            };
        }
    }

    // Get leave type statistics
    static async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM leave_types',
            'SELECT COUNT(*) as monetizable FROM leave_types WHERE is_monetizable = 1',
            'SELECT COUNT(*) as requires_certificate FROM leave_types WHERE requires_medical_certificate = 1',
            `SELECT lt.name, COUNT(la.id) as applications_count,
                    SUM(CASE WHEN la.status = 'Approved' THEN la.days_requested ELSE 0 END) as approved_days
             FROM leave_types lt
             LEFT JOIN leave_applications la ON lt.id = la.leave_type_id
             GROUP BY lt.id, lt.name
             ORDER BY applications_count DESC`
        ];
        
        try {
            const [total, monetizable, requiresCert, usage] = await Promise.all(
                queries.map(query => executeQuery(query))
            );
            
            return {
                success: true,
                data: {
                    total: total.success ? total.data[0].total : 0,
                    monetizable: monetizable.success ? monetizable.data[0].monetizable : 0,
                    requires_certificate: requiresCert.success ? requiresCert.data[0].requires_certificate : 0,
                    usage_statistics: usage.success ? usage.data : []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get leave type statistics',
                details: error.message
            };
        }
    }
}

// Leave Reports and Analytics Model
class LeaveReports {
    // Generate comprehensive leave summary report
    static async generateSummaryReport(filters = {}) {
        const { year, department, employee_id, start_date, end_date } = filters;
        
        let baseQuery = `
            SELECT 
                e.id as employee_id,
                e.employee_number,
                CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
                e.plantilla_position,
                lt.name as leave_type,
                lt.code as leave_type_code,
                COUNT(la.id) as total_applications,
                SUM(CASE WHEN la.status = 'Approved' THEN la.days_requested ELSE 0 END) as approved_days,
                SUM(CASE WHEN la.status = 'Pending' THEN la.days_requested ELSE 0 END) as pending_days,
                SUM(CASE WHEN la.status = 'Rejected' THEN la.days_requested ELSE 0 END) as rejected_days,
                elb.earned_days,
                elb.used_days,
                elb.monetized_days,
                elb.carried_forward,
                elb.current_balance
            FROM employees e
            LEFT JOIN leave_applications la ON e.id = la.employee_id
            LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
            LEFT JOIN employee_leave_balances elb ON e.id = elb.employee_id AND lt.id = elb.leave_type_id
            WHERE e.employment_status = 'Active'
        `;
        
        const params = [];
        
        if (year) {
            baseQuery += ' AND (YEAR(la.start_date) = ? OR elb.year = ?)';
            params.push(year, year);
        }
        
        if (employee_id) {
            baseQuery += ' AND e.id = ?';
            params.push(employee_id);
        }
        
        if (start_date && end_date) {
            baseQuery += ' AND la.start_date >= ? AND la.end_date <= ?';
            params.push(start_date, end_date);
        }
        
        baseQuery += `
            GROUP BY e.id, lt.id
            ORDER BY employee_name, leave_type
        `;
        
        return await executeQuery(baseQuery, params);
    }

    // Generate leave usage analytics
    static async generateUsageAnalytics(filters = {}) {
        const { year = new Date().getFullYear() } = filters;
        
        const queries = {
            // Monthly usage trends
            monthlyTrends: `
                SELECT 
                    MONTH(la.start_date) as month,
                    MONTHNAME(la.start_date) as month_name,
                    lt.name as leave_type,
                    COUNT(la.id) as applications,
                    SUM(la.days_requested) as total_days,
                    AVG(la.days_requested) as avg_days_per_application
                FROM leave_applications la
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE YEAR(la.start_date) = ? AND la.status = 'Approved'
                GROUP BY MONTH(la.start_date), lt.id
                ORDER BY month, lt.name
            `,
            
            // Department wise usage
            departmentUsage: `
                SELECT 
                    e.plantilla_position as department,
                    lt.name as leave_type,
                    COUNT(la.id) as applications,
                    SUM(la.days_requested) as total_days,
                    AVG(la.days_requested) as avg_days
                FROM leave_applications la
                JOIN employees e ON la.employee_id = e.id
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE YEAR(la.start_date) = ? AND la.status = 'Approved'
                GROUP BY e.plantilla_position, lt.id
                ORDER BY total_days DESC
            `,
            
            // Top leave users
            topUsers: `
                SELECT 
                    e.employee_number,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    e.plantilla_position,
                    COUNT(la.id) as total_applications,
                    SUM(la.days_requested) as total_days_used
                FROM leave_applications la
                JOIN employees e ON la.employee_id = e.id
                WHERE YEAR(la.start_date) = ? AND la.status = 'Approved'
                GROUP BY e.id
                ORDER BY total_days_used DESC
                LIMIT 20
            `,
            
            // Leave pattern analysis
            patternAnalysis: `
                SELECT 
                    DAYNAME(la.start_date) as day_of_week,
                    COUNT(la.id) as applications,
                    AVG(la.days_requested) as avg_duration
                FROM leave_applications la
                WHERE YEAR(la.start_date) = ? AND la.status = 'Approved'
                GROUP BY DAYOFWEEK(la.start_date)
                ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
            `
        };
        
        try {
            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await executeQuery(query, [year]);
                results[key] = result.success ? result.data : [];
            }
            
            return {
                success: true,
                data: results
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to generate usage analytics',
                details: error.message
            };
        }
    }

    // Generate balance utilization report
    static async generateBalanceReport(filters = {}) {
        const { year = new Date().getFullYear(), employee_id } = filters;
        
        let query = `
            SELECT 
                e.employee_number,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.plantilla_position,
                lt.name as leave_type,
                lt.code as leave_type_code,
                elb.earned_days,
                elb.used_days,
                elb.monetized_days,
                elb.carried_forward,
                elb.current_balance,
                ROUND((elb.used_days / NULLIF(elb.earned_days, 0)) * 100, 2) as utilization_percentage,
                CASE 
                    WHEN elb.current_balance < 2 THEN 'Low'
                    WHEN elb.current_balance > (elb.earned_days * 0.8) THEN 'High'
                    ELSE 'Normal'
                END as balance_status
            FROM employees e
            JOIN employee_leave_balances elb ON e.id = elb.employee_id
            JOIN leave_types lt ON elb.leave_type_id = lt.id
            WHERE elb.year = ? AND e.employment_status = 'Active'
        `;
        
        const params = [year];
        
        if (employee_id) {
            query += ' AND e.id = ?';
            params.push(employee_id);
        }
        
        query += ' ORDER BY employee_name, lt.name';
        
        return await executeQuery(query, params);
    }

    // Generate pending approvals dashboard
    static async generatePendingApprovalsDashboard() {
        const queries = {
            // Pending applications summary
            pendingSummary: `
                SELECT 
                    COUNT(*) as total_pending,
                    SUM(la.days_requested) as total_days_pending,
                    AVG(DATEDIFF(NOW(), la.applied_at)) as avg_pending_days
                FROM leave_applications la
                WHERE la.status = 'Pending'
            `,
            
            // Pending by leave type
            pendingByType: `
                SELECT 
                    lt.name as leave_type,
                    COUNT(la.id) as pending_count,
                    SUM(la.days_requested) as pending_days
                FROM leave_applications la
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE la.status = 'Pending'
                GROUP BY lt.id
                ORDER BY pending_count DESC
            `,
            
            // Urgent pending (older than 3 days)
            urgentPending: `
                SELECT 
                    la.id,
                    e.employee_number,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    lt.name as leave_type,
                    la.start_date,
                    la.end_date,
                    la.days_requested,
                    la.applied_at,
                    DATEDIFF(NOW(), la.applied_at) as days_pending
                FROM leave_applications la
                JOIN employees e ON la.employee_id = e.id
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE la.status = 'Pending' AND DATEDIFF(NOW(), la.applied_at) > 3
                ORDER BY la.applied_at ASC
            `
        };
        
        try {
            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await executeQuery(query);
                results[key] = result.success ? result.data : [];
            }
            
            return {
                success: true,
                data: results
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to generate pending approvals dashboard',
                details: error.message
            };
        }
    }

    // Generate compliance report
    static async generateComplianceReport(filters = {}) {
        const { year = new Date().getFullYear() } = filters;
        
        const queries = {
            // Medical certificate compliance
            medicalCertificateCompliance: `
                SELECT 
                    e.employee_number,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    la.id as application_id,
                    la.start_date,
                    la.days_requested,
                    la.status,
                    'Missing Medical Certificate' as compliance_issue
                FROM leave_applications la
                JOIN employees e ON la.employee_id = e.id
                JOIN leave_types lt ON la.leave_type_id = lt.id
                WHERE YEAR(la.start_date) = ?
                  AND lt.requires_medical_certificate = 1
                  AND la.days_requested >= 3
                  AND la.status IN ('Pending', 'Approved')
                  -- AND no medical certificate attached (placeholder)
                ORDER BY la.start_date DESC
            `,
            
            // Leave balance anomalies
            balanceAnomalies: `
                SELECT 
                    e.employee_number,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    lt.name as leave_type,
                    elb.current_balance,
                    elb.earned_days,
                    elb.used_days,
                    CASE 
                        WHEN elb.current_balance < 0 THEN 'Negative Balance'
                        WHEN elb.used_days > elb.earned_days + elb.carried_forward THEN 'Overuse'
                        ELSE 'Other'
                    END as anomaly_type
                FROM employees e
                JOIN employee_leave_balances elb ON e.id = elb.employee_id
                JOIN leave_types lt ON elb.leave_type_id = lt.id
                WHERE elb.year = ?
                  AND (elb.current_balance < 0 OR elb.used_days > elb.earned_days + elb.carried_forward)
                ORDER BY employee_name
            `
        };
        
        try {
            const results = {};
            for (const [key, query] of Object.entries(queries)) {
                const result = await executeQuery(query, [year]);
                results[key] = result.success ? result.data : [];
            }
            
            return {
                success: true,
                data: results
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to generate compliance report',
                details: error.message
            };
        }
    }

    // Generate forecasting report
    static async generateForecastingReport(filters = {}) {
        const { year = new Date().getFullYear() } = filters;
        
        const query = `
            SELECT 
                lt.name as leave_type,
                COUNT(la.id) as historical_applications,
                SUM(la.days_requested) as historical_days,
                AVG(la.days_requested) as avg_days_per_application,
                -- Simple projection based on historical data
                ROUND(COUNT(la.id) * 1.1) as projected_applications,
                ROUND(SUM(la.days_requested) * 1.1) as projected_days
            FROM leave_applications la
            JOIN leave_types lt ON la.leave_type_id = lt.id
            WHERE YEAR(la.start_date) = ? - 1 AND la.status = 'Approved'
            GROUP BY lt.id
            ORDER BY historical_days DESC
        `;
        
        return await executeQuery(query, [year]);
    }
}

module.exports = { Leave, LeaveBalance, LeaveType, LeaveReports };