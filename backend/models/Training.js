const { executeQuery, findOne, executeTransaction } = require('../config/database');

class Training {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.training_program_id = data.training_program_id || null;
        this.training_title = data.training_title || null;
        this.start_date = data.start_date || null;
        this.end_date = data.end_date || null;
        this.duration_hours = data.duration_hours || null;
        this.venue = data.venue || null;
        this.organizer = data.organizer || null;
        this.certificate_issued = data.certificate_issued || false;
        this.certificate_number = data.certificate_number || null;
        this.created_at = data.created_at || null;
        
        // Joined fields from queries - following memory requirement for joined fields
        this.employee_name = data.employee_name || null;
        this.employee_number = data.employee_number || null;
        this.program_title = data.program_title || null;
        this.training_type = data.training_type || null;
    }

    // Validate training data
    validate() {
        const errors = [];

        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!this.training_title || this.training_title.trim().length === 0) {
            errors.push('Training title is required');
        }

        if (this.training_title && this.training_title.length > 255) {
            errors.push('Training title must not exceed 255 characters');
        }

        if (!this.start_date) {
            errors.push('Start date is required');
        }

        if (!this.end_date) {
            errors.push('End date is required');
        }

        if (this.start_date && this.end_date) {
            const startDate = new Date(this.start_date);
            const endDate = new Date(this.end_date);
            
            if (endDate < startDate) {
                errors.push('End date must be after or equal to start date');
            }
        }

        if (this.duration_hours && (this.duration_hours < 0 || this.duration_hours > 999.99)) {
            errors.push('Duration hours must be between 0 and 999.99');
        }

        if (this.venue && this.venue.length > 255) {
            errors.push('Venue must not exceed 255 characters');
        }

        if (this.organizer && this.organizer.length > 255) {
            errors.push('Organizer must not exceed 255 characters');
        }

        if (this.certificate_number && this.certificate_number.length > 100) {
            errors.push('Certificate number must not exceed 100 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Create new training record
    async create() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }

        try {
            const query = `
                INSERT INTO employee_trainings (
                    employee_id, training_program_id, training_title, start_date, end_date,
                    duration_hours, venue, organizer, certificate_issued, certificate_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                this.employee_id,
                this.training_program_id,
                this.training_title,
                this.start_date,
                this.end_date,
                this.duration_hours,
                this.venue,
                this.organizer,
                this.certificate_issued ? 1 : 0,
                this.certificate_number
            ];

            const result = await executeQuery(query, values);
            if (!result.success) {
                throw new Error(result.error);
            }
            this.id = result.data.insertId;

            return {
                success: true,
                data: this,
                message: 'Training record created successfully'
            };
        } catch (error) {
            console.error('Error creating training record:', error);
            return {
                success: false,
                error: 'Failed to create training record',
                details: error.message
            };
        }
    }

    // Update training record
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
            const query = `
                UPDATE employee_trainings 
                SET employee_id = ?, training_program_id = ?, training_title = ?, 
                    start_date = ?, end_date = ?, duration_hours = ?, venue = ?, 
                    organizer = ?, certificate_issued = ?, certificate_number = ?
                WHERE id = ?
            `;
            
            const values = [
                this.employee_id,
                this.training_program_id,
                this.training_title,
                this.start_date,
                this.end_date,
                this.duration_hours,
                this.venue,
                this.organizer,
                this.certificate_issued ? 1 : 0,
                this.certificate_number,
                this.id
            ];

            const result = await executeQuery(query, values);
            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                success: true,
                data: this,
                message: 'Training record updated successfully'
            };
        } catch (error) {
            console.error('Error updating training record:', error);
            return {
                success: false,
                error: 'Failed to update training record',
                details: error.message
            };
        }
    }

    // Save training record (create or update)
    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    // Static method to find all trainings with filters
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT 
                    et.*,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    e.employee_number,
                    tp.title as program_title,
                    tp.training_type
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                LEFT JOIN training_programs tp ON et.training_program_id = tp.id
                WHERE e.deleted_at IS NULL
            `;
            
            const queryParams = [];
            
            // Apply filters with proper WHERE clause construction
            if (filters.employee_id) {
                query += ' AND et.employee_id = ?';
                queryParams.push(parseInt(filters.employee_id));
            }
            
            if (filters.training_program_id) {
                query += ' AND et.training_program_id = ?';
                queryParams.push(parseInt(filters.training_program_id));
            }
            
            if (filters.training_type) {
                query += ' AND tp.training_type = ?';
                queryParams.push(filters.training_type);
            }
            
            if (filters.start_date) {
                query += ' AND et.start_date >= ?';
                queryParams.push(filters.start_date);
            }
            
            if (filters.end_date) {
                query += ' AND et.end_date <= ?';
                queryParams.push(filters.end_date);
            }
            
            if (filters.year) {
                query += ' AND YEAR(et.start_date) = ?';
                queryParams.push(parseInt(filters.year));
            }
            
            if (filters.search) {
                query += ' AND (et.training_title LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_number LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            
            if (filters.certificate_issued !== undefined) {
                query += ' AND et.certificate_issued = ?';
                queryParams.push(filters.certificate_issued ? 1 : 0);
            }
            
            // Sorting with validation
            const allowedSortFields = ['start_date', 'end_date', 'training_title', 'created_at', 'employee_name', 'duration_hours'];
            const sortBy = allowedSortFields.includes(filters.sort_by) ? filters.sort_by : 'start_date';
            const sortOrder = filters.sort_order === 'asc' ? 'ASC' : 'DESC';
            
            if (sortBy === 'employee_name') {
                query += ` ORDER BY e.first_name ${sortOrder}, e.last_name ${sortOrder}`;
            } else {
                query += ` ORDER BY et.${sortBy} ${sortOrder}`;
            }
            
            // Pagination - MySQL compatible syntax using string interpolation for LIMIT
            if (filters.limit) {
                const limit = parseInt(filters.limit);
                const offset = filters.offset ? parseInt(filters.offset) : 0;
                
                // Validate that limit and offset are positive integers
                if (limit < 1 || limit > 1000) {
                    throw new Error('Limit must be between 1 and 1000');
                }
                if (offset < 0) {
                    throw new Error('Offset must be non-negative');
                }
                
                if (offset > 0) {
                    query += ` LIMIT ${offset}, ${limit}`;
                } else {
                    query += ` LIMIT ${limit}`;
                }
            }

            const results = await executeQuery(query, queryParams);
            if (!results.success) {
                console.error('SQL Query:', query);
                console.error('Parameters:', queryParams);
                console.error('Parameters count:', queryParams.length);
                console.error('Question marks in query:', (query.match(/\?/g) || []).length);
                throw new Error(results.error);
            }
            
            return {
                success: true,
                data: results.data.map(row => new Training(row))
            };
        } catch (error) {
            console.error('Error finding trainings:', error);
            return {
                success: false,
                error: 'Failed to retrieve training records',
                details: error.message
            };
        }
    }

    // Static method to find training by ID
    static async findById(id) {
        try {
            const query = `
                SELECT 
                    et.*,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    e.employee_number,
                    tp.title as program_title,
                    tp.training_type
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                LEFT JOIN training_programs tp ON et.training_program_id = tp.id
                WHERE et.id = ? AND e.deleted_at IS NULL
            `;
            
            const result = await findOne(query, [id]);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            if (!result.data) {
                return {
                    success: true,
                    data: null,
                    error: 'Training record not found'
                };
            }
            
            return {
                success: true,
                data: new Training(result.data)
            };
        } catch (error) {
            console.error('Error finding training by ID:', error);
            return {
                success: false,
                error: 'Failed to retrieve training record',
                details: error.message
            };
        }
    }

    // Static method to get count of trainings with filters
    static async getCount(filters = {}) {
        try {
            let query = `
                SELECT COUNT(*) as count
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                LEFT JOIN training_programs tp ON et.training_program_id = tp.id
                WHERE e.deleted_at IS NULL
            `;
            
            const queryParams = [];
            
            // Apply same filters as findAll
            if (filters.employee_id) {
                query += ' AND et.employee_id = ?';
                queryParams.push(filters.employee_id);
            }
            
            if (filters.training_program_id) {
                query += ' AND et.training_program_id = ?';
                queryParams.push(filters.training_program_id);
            }
            
            if (filters.training_type) {
                query += ' AND tp.training_type = ?';
                queryParams.push(filters.training_type);
            }
            
            if (filters.start_date) {
                query += ' AND et.start_date >= ?';
                queryParams.push(filters.start_date);
            }
            
            if (filters.end_date) {
                query += ' AND et.end_date <= ?';
                queryParams.push(filters.end_date);
            }
            
            if (filters.year) {
                query += ' AND YEAR(et.start_date) = ?';
                queryParams.push(filters.year);
            }
            
            if (filters.search) {
                query += ' AND (et.training_title LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_number LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            
            if (filters.certificate_issued !== undefined) {
                query += ' AND et.certificate_issued = ?';
                queryParams.push(filters.certificate_issued ? 1 : 0);
            }

            const result = await findOne(query, queryParams);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data ? result.data.count : 0;
        } catch (error) {
            console.error('Error getting training count:', error);
            return 0;
        }
    }

    // Static method to delete training record
    static async delete(id) {
        try {
            const query = 'DELETE FROM employee_trainings WHERE id = ?';
            const result = await executeQuery(query, [id]);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return {
                success: true,
                message: 'Training record deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting training record:', error);
            return {
                success: false,
                error: 'Failed to delete training record',
                details: error.message
            };
        }
    }

    // Static method to get training statistics
    static async getStatistics(filters = {}) {
        try {
            const queryParams = [];
            let whereClause = 'WHERE e.deleted_at IS NULL';
            
            // Apply filters to statistics with proper WHERE clause construction
            if (filters.year) {
                whereClause += ' AND YEAR(et.start_date) = ?';
                queryParams.push(filters.year);
            }
            
            if (filters.employee_id) {
                whereClause += ' AND et.employee_id = ?';
                queryParams.push(filters.employee_id);
            }

            // Basic statistics
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_trainings,
                    COUNT(DISTINCT et.employee_id) as employees_trained,
                    AVG(et.duration_hours) as avg_duration,
                    SUM(et.duration_hours) as total_hours,
                    SUM(CASE WHEN et.certificate_issued = 1 THEN 1 ELSE 0 END) as certificates_issued
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                ${whereClause}
            `;
            
            const basicStats = await findOne(statsQuery, queryParams);
            if (!basicStats.success) {
                throw new Error(basicStats.error);
            }
            
            // Training by type statistics
            const typeStatsQuery = `
                SELECT 
                    COALESCE(tp.training_type, 'Other') as training_type,
                    COUNT(*) as count
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                LEFT JOIN training_programs tp ON et.training_program_id = tp.id
                ${whereClause}
                GROUP BY tp.training_type
                ORDER BY count DESC
            `;
            
            const typeStats = await executeQuery(typeStatsQuery, queryParams);
            if (!typeStats.success) {
                throw new Error(typeStats.error);
            }
            
            // Monthly training trends
            const trendsQuery = `
                SELECT 
                    DATE_FORMAT(et.start_date, '%Y-%m') as month,
                    COUNT(*) as count
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                ${whereClause}
                GROUP BY DATE_FORMAT(et.start_date, '%Y-%m')
                ORDER BY month DESC
                LIMIT 12
            `;
            
            const trends = await executeQuery(trendsQuery, queryParams);
            if (!trends.success) {
                throw new Error(trends.error);
            }
            
            // Employee training statistics (Top Performers)
            const employeeStatsQuery = `
                SELECT 
                    et.employee_id,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    COUNT(*) as count,
                    SUM(et.duration_hours) as hours,
                    SUM(CASE WHEN et.certificate_issued = 1 THEN 1 ELSE 0 END) as certificates
                FROM employee_trainings et
                JOIN employees e ON et.employee_id = e.id
                ${whereClause}
                GROUP BY et.employee_id, e.first_name, e.last_name
                ORDER BY count DESC, hours DESC
                LIMIT 20
            `;
            
            const employeeStats = await executeQuery(employeeStatsQuery, queryParams);
            if (!employeeStats.success) {
                throw new Error(employeeStats.error);
            }
            
            return {
                success: true,
                data: {
                    summary: {
                        total_trainings: basicStats.data?.total_trainings || 0,
                        employees_trained: basicStats.data?.employees_trained || 0,
                        avg_duration: parseFloat(basicStats.data?.avg_duration || 0).toFixed(2),
                        total_hours: parseFloat(basicStats.data?.total_hours || 0).toFixed(2),
                        certificates_issued: basicStats.data?.certificates_issued || 0
                    },
                    by_type: typeStats.data || [],
                    trends: (trends.data && Array.isArray(trends.data)) ? trends.data.reverse() : [], // Show oldest to newest
                    by_employee: employeeStats.data || []
                }
            };
        } catch (error) {
            console.error('Error getting training statistics:', error);
            return {
                success: false,
                error: 'Failed to retrieve training statistics',
                details: error.message
            };
        }
    }

    // Static method to get employee training history
    static async getEmployeeTrainings(employeeId, year = null) {
        try {
            let query = `
                SELECT 
                    et.*,
                    tp.title as program_title,
                    tp.training_type
                FROM employee_trainings et
                LEFT JOIN training_programs tp ON et.training_program_id = tp.id
                WHERE et.employee_id = ?
            `;
            
            const queryParams = [employeeId];
            
            if (year) {
                query += ' AND YEAR(et.start_date) = ?';
                queryParams.push(year);
            }
            
            query += ' ORDER BY et.start_date DESC';
            
            const results = await executeQuery(query, queryParams);
            if (!results.success) {
                throw new Error(results.error);
            }
            
            // Get training count for employee
            const countQuery = `
                SELECT 
                    COUNT(*) as total_count,
                    SUM(duration_hours) as total_hours,
                    COUNT(CASE WHEN certificate_issued = 1 THEN 1 END) as certificates_count
                FROM employee_trainings 
                WHERE employee_id = ?
                ${year ? 'AND YEAR(start_date) = ?' : ''}
            `;
            
            const countParams = year ? [employeeId, year] : [employeeId];
            const summary = await findOne(countQuery, countParams);
            if (!summary.success) {
                throw new Error(summary.error);
            }
            
            return {
                success: true,
                data: {
                    trainings: results.data.map(row => new Training(row)),
                    summary: {
                        total_trainings: summary.data?.total_count || 0,
                        total_hours: parseFloat(summary.data?.total_hours || 0).toFixed(2),
                        certificates_earned: summary.data?.certificates_count || 0
                    }
                }
            };
        } catch (error) {
            console.error('Error getting employee trainings:', error);
            return {
                success: false,
                error: 'Failed to retrieve employee training records',
                details: error.message
            };
        }
    }
}

// Training Program class for managing training programs
class TrainingProgram {
    constructor(data = {}) {
        this.id = data.id || null;
        this.title = data.title || null;
        this.description = data.description || null;
        this.duration_hours = data.duration_hours || null;
        this.training_type = data.training_type || null;
        this.created_at = data.created_at || null;
    }

    // Validate training program data
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Training program title is required');
        }

        if (this.title && this.title.length > 255) {
            errors.push('Title must not exceed 255 characters');
        }

        if (!this.training_type || !['Internal', 'External', 'Online', 'Seminar', 'Workshop'].includes(this.training_type)) {
            errors.push('Valid training type is required (Internal, External, Online, Seminar, Workshop)');
        }

        if (this.duration_hours && (this.duration_hours < 0 || this.duration_hours > 999)) {
            errors.push('Duration hours must be between 0 and 999');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Create new training program
    async create() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }

        try {
            const query = `
                INSERT INTO training_programs (title, description, duration_hours, training_type)
                VALUES (?, ?, ?, ?)
            `;
            
            const values = [this.title, this.description, this.duration_hours, this.training_type];
            const result = await executeQuery(query, values);
            if (!result.success) {
                throw new Error(result.error);
            }
            this.id = result.data.insertId;

            return {
                success: true,
                data: this,
                message: 'Training program created successfully'
            };
        } catch (error) {
            console.error('Error creating training program:', error);
            return {
                success: false,
                error: 'Failed to create training program',
                details: error.message
            };
        }
    }

    // Update training program
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
            const query = `
                UPDATE training_programs 
                SET title = ?, description = ?, duration_hours = ?, training_type = ?
                WHERE id = ?
            `;
            
            const values = [this.title, this.description, this.duration_hours, this.training_type, this.id];
            const result = await executeQuery(query, values);
            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                success: true,
                data: this,
                message: 'Training program updated successfully'
            };
        } catch (error) {
            console.error('Error updating training program:', error);
            return {
                success: false,
                error: 'Failed to update training program',
                details: error.message
            };
        }
    }

    // Save training program (create or update)
    async save() {
        if (this.id) {
            return await this.update();
        } else {
            return await this.create();
        }
    }

    // Static method to find all training programs
    static async findAll() {
        try {
            const query = `
                SELECT * FROM training_programs 
                ORDER BY title ASC
            `;
            
            const results = await executeQuery(query);
            if (!results.success) {
                throw new Error(results.error);
            }
            
            return {
                success: true,
                data: results.data.map(row => new TrainingProgram(row))
            };
        } catch (error) {
            console.error('Error finding training programs:', error);
            return {
                success: false,
                error: 'Failed to retrieve training programs',
                details: error.message
            };
        }
    }

    // Static method to find training program by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM training_programs WHERE id = ?';
            const result = await findOne(query, [id]);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            if (!result.data) {
                return {
                    success: true,
                    data: null,
                    error: 'Training program not found'
                };
            }
            
            return {
                success: true,
                data: new TrainingProgram(result.data)
            };
        } catch (error) {
            console.error('Error finding training program by ID:', error);
            return {
                success: false,
                error: 'Failed to retrieve training program',
                details: error.message
            };
        }
    }

    // Static method to delete training program
    static async delete(id) {
        try {
            // Check if program is used in any training records
            const checkQuery = 'SELECT COUNT(*) as count FROM employee_trainings WHERE training_program_id = ?';
            const checkResult = await findOne(checkQuery, [id]);
            if (!checkResult.success) {
                throw new Error(checkResult.error);
            }
            
            if (checkResult.data && checkResult.data.count > 0) {
                return {
                    success: false,
                    error: 'Cannot delete training program that is referenced in training records',
                    constraint: 'FOREIGN_KEY_CONSTRAINT'
                };
            }
            
            const query = 'DELETE FROM training_programs WHERE id = ?';
            const result = await executeQuery(query, [id]);
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return {
                success: true,
                message: 'Training program deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting training program:', error);
            return {
                success: false,
                error: 'Failed to delete training program',
                details: error.message
            };
        }
    }
}

module.exports = { Training, TrainingProgram };