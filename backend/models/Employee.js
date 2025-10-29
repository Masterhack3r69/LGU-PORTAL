// models/Employee.js - Employee model
const { executeQuery, findOne, executeTransaction } = require('../config/database');

class Employee {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.employee_number = data.employee_number || null;
        this.first_name = data.first_name || null;
        this.middle_name = data.middle_name || null;
        this.last_name = data.last_name || null;
        this.suffix = data.suffix || null;
        this.sex = data.sex || null;
        this.birth_date = data.birth_date || null;
        this.birth_place = data.birth_place || null;
        this.civil_status = data.civil_status || 'Single';
        this.contact_number = data.contact_number || null;
        this.email_address = data.email_address || null;
        this.current_address = data.current_address || null;
        this.permanent_address = data.permanent_address || null;
        this.tin = data.tin || null;
        this.gsis_number = data.gsis_number || null;
        this.pagibig_number = data.pagibig_number || null;
        this.philhealth_number = data.philhealth_number || null;
        this.sss_number = data.sss_number || null;
        this.appointment_date = data.appointment_date || null;
        this.plantilla_position = data.plantilla_position || null;
        this.department = data.department || null;
        this.plantilla_number = data.plantilla_number || null;
        this.salary_grade = data.salary_grade || null;
        this.step_increment = data.step_increment || 1;
        this.current_monthly_salary = data.current_monthly_salary || null;
        this.current_daily_rate = data.current_daily_rate || null;
        this.highest_monthly_salary = data.highest_monthly_salary || null;
        this.highest_daily_rate = data.highest_daily_rate || null;
        this.employment_status = data.employment_status || 'Active';
        this.separation_date = data.separation_date || null;
        this.separation_reason = data.separation_reason || null;
        this.deleted_at = data.deleted_at || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        
        // Additional PDS fields - I. PERSONAL INFORMATION
        this.height = data.height || null;
        this.weight = data.weight || null;
        this.blood_type = data.blood_type || null;
        this.umid_id_no = data.umid_id_no || null;
        this.philsys_number = data.philsys_number || null;
        this.agency_employee_no = data.agency_employee_no || null;
        this.citizenship = data.citizenship || 'Filipino';
        this.dual_citizenship_country = data.dual_citizenship_country || null;
        
        // Residential Address (detailed)
        this.residential_house_no = data.residential_house_no || null;
        this.residential_street = data.residential_street || null;
        this.residential_subdivision = data.residential_subdivision || null;
        this.residential_barangay = data.residential_barangay || null;
        this.residential_city = data.residential_city || null;
        this.residential_province = data.residential_province || null;
        this.residential_zipcode = data.residential_zipcode || null;
        
        // Permanent Address (detailed)
        this.permanent_house_no = data.permanent_house_no || null;
        this.permanent_street = data.permanent_street || null;
        this.permanent_subdivision = data.permanent_subdivision || null;
        this.permanent_barangay = data.permanent_barangay || null;
        this.permanent_city = data.permanent_city || null;
        this.permanent_province = data.permanent_province || null;
        this.permanent_zipcode = data.permanent_zipcode || null;
        
        this.telephone_no = data.telephone_no || null;
        this.mobile_no = data.mobile_no || null;
    }

    // Get full name
    getFullName() {
        const parts = [this.first_name, this.middle_name, this.last_name, this.suffix];
        return parts.filter(part => part && part.trim()).join(' ');
    }

    // Get display name with middle initial
    getDisplayName() {
        let displayName = this.first_name || '';
        
        if (this.middle_name && this.middle_name.trim()) {
            displayName += ` ${this.middle_name.charAt(0).toUpperCase()}.`;
        }
        
        if (this.last_name) {
            displayName += ` ${this.last_name}`;
        }
        
        return displayName.trim();
    }

    // Calculate daily rate from monthly salary
    calculateDailyRate(monthlySalary = null) {
        const salary = monthlySalary || this.current_monthly_salary;
        if (!salary) return null;
        
        // Standard calculation: Monthly salary / 22 working days per month
        return parseFloat((salary / 22).toFixed(2));
    }

    // Calculate monthly salary from daily rate
    calculateMonthlySalary(dailyRate = null) {
        const rate = dailyRate || this.current_daily_rate;
        if (!rate) return null;
        
        // Standard calculation: Daily rate * 22 working days per month
        return parseFloat((rate * 22).toFixed(2));
    }

    // Update salary rates to maintain consistency (22-day rule)
    updateSalaryRates() {
        // If we have monthly salary but no daily rate, calculate daily
        if (this.current_monthly_salary && !this.current_daily_rate) {
            this.current_daily_rate = this.calculateDailyRate(this.current_monthly_salary);
        }
        // If we have daily rate but no monthly salary, calculate monthly
        else if (this.current_daily_rate && !this.current_monthly_salary) {
            this.current_monthly_salary = this.calculateMonthlySalary(this.current_daily_rate);
        }
        // If we have both, ensure they're consistent (monthly takes precedence)
        else if (this.current_monthly_salary && this.current_daily_rate) {
            this.current_daily_rate = this.calculateDailyRate(this.current_monthly_salary);
        }
        
        // Same for highest salary
        if (this.highest_monthly_salary && !this.highest_daily_rate) {
            this.highest_daily_rate = this.calculateDailyRate(this.highest_monthly_salary);
        }
        else if (this.highest_daily_rate && !this.highest_monthly_salary) {
            this.highest_monthly_salary = this.calculateMonthlySalary(this.highest_daily_rate);
        }
        else if (this.highest_monthly_salary && this.highest_daily_rate) {
            this.highest_daily_rate = this.calculateDailyRate(this.highest_monthly_salary);
        }
    }

    // Check if employee is soft deleted
    isDeleted() {
        return this.deleted_at !== null && this.deleted_at !== undefined;
    }

    // Get formatted deleted date
    getDeletedDate() {
        return this.deleted_at ? new Date(this.deleted_at).toLocaleDateString() : null;
    }

    // Validate employee data
    validate() {
        const errors = [];

        // Required fields validation
        if (!this.first_name || this.first_name.trim().length === 0) {
            errors.push('First name is required');
        }

        if (!this.last_name || this.last_name.trim().length === 0) {
            errors.push('Last name is required');
        }

        if (!this.employee_number || this.employee_number.trim().length === 0) {
            errors.push('Employee number is required');
        }

        if (!this.sex || !['Male', 'Female'].includes(this.sex)) {
            errors.push('Valid sex (Male/Female) is required');
        }

        if (!this.birth_date) {
            errors.push('Birth date is required');
        }

        if (!this.appointment_date) {
            errors.push('Appointment date is required');
        }

        // Format and length validation
        if (this.first_name && this.first_name.length > 100) {
            errors.push('First name must not exceed 100 characters');
        }

        if (this.last_name && this.last_name.length > 100) {
            errors.push('Last name must not exceed 100 characters');
        }

        if (this.employee_number && this.employee_number.length > 20) {
            errors.push('Employee number must not exceed 20 characters');
        }

        // Email validation
        if (this.email_address && !/\S+@\S+\.\S+/.test(this.email_address)) {
            errors.push('Valid email address is required');
        }

        // Date validation
        if (this.birth_date && this.appointment_date) {
            const birthDate = new Date(this.birth_date);
            const appointmentDate = new Date(this.appointment_date);
            
            if (birthDate >= appointmentDate) {
                errors.push('Appointment date must be after birth date');
            }

            // Check minimum age (18 years)
            const minAge = new Date();
            minAge.setFullYear(minAge.getFullYear() - 18);
            if (birthDate > minAge) {
                errors.push('Employee must be at least 18 years old');
            }
        }

        // Salary validation
        if (this.current_monthly_salary && this.current_monthly_salary < 0) {
            errors.push('Monthly salary must be a positive number');
        }

        if (this.current_daily_rate && this.current_daily_rate < 0) {
            errors.push('Daily rate must be a positive number');
        }

        // Government ID format validation (basic)
        if (this.tin && this.tin.length > 15) {
            errors.push('TIN must not exceed 15 characters');
        }

        if (this.gsis_number && this.gsis_number.length > 20) {
            errors.push('GSIS number must not exceed 20 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save employee (create or update)
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
                error: 'Failed to save employee',
                details: error.message
            };
        }
    }

    // Create new employee
    async create() {
        // Update salary rates to ensure consistency before saving
        this.updateSalaryRates();
        
        const query = `
            INSERT INTO employees (
                user_id, employee_number, first_name, middle_name, last_name, suffix,
                sex, birth_date, birth_place, civil_status, contact_number, email_address,
                current_address, permanent_address, tin, gsis_number, pagibig_number,
                philhealth_number, sss_number, appointment_date, plantilla_position, department,
                plantilla_number, salary_grade, step_increment, current_monthly_salary,
                current_daily_rate, highest_monthly_salary, highest_daily_rate, employment_status,
                separation_date, separation_reason,
                height, weight, blood_type, umid_id_no, philsys_number, agency_employee_no,
                citizenship, dual_citizenship_country,
                residential_house_no, residential_street, residential_subdivision, residential_barangay,
                residential_city, residential_province, residential_zipcode,
                permanent_house_no, permanent_street, permanent_subdivision, permanent_barangay,
                permanent_city, permanent_province, permanent_zipcode,
                telephone_no, mobile_no
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.user_id, this.employee_number, this.first_name, this.middle_name,
            this.last_name, this.suffix, this.sex, this.birth_date, this.birth_place,
            this.civil_status, this.contact_number, this.email_address, this.current_address,
            this.permanent_address, this.tin, this.gsis_number, this.pagibig_number,
            this.philhealth_number, this.sss_number, this.appointment_date,
            this.plantilla_position, this.department, this.plantilla_number, this.salary_grade,
            this.step_increment, this.current_monthly_salary, this.current_daily_rate,
            this.highest_monthly_salary, this.highest_daily_rate, this.employment_status,
            this.separation_date, this.separation_reason,
            this.height, this.weight, this.blood_type, this.umid_id_no, this.philsys_number,
            this.agency_employee_no, this.citizenship, this.dual_citizenship_country,
            this.residential_house_no, this.residential_street, this.residential_subdivision,
            this.residential_barangay, this.residential_city, this.residential_province,
            this.residential_zipcode, this.permanent_house_no, this.permanent_street,
            this.permanent_subdivision, this.permanent_barangay, this.permanent_city,
            this.permanent_province, this.permanent_zipcode, this.telephone_no, this.mobile_no
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Employee created successfully'
            };
        }

        return result;
    }

    // Update existing employee
    async update() {
        // Update salary rates to ensure consistency before saving
        this.updateSalaryRates();
        
        const query = `
            UPDATE employees SET
                user_id = ?, employee_number = ?, first_name = ?, middle_name = ?,
                last_name = ?, suffix = ?, sex = ?, birth_date = ?, birth_place = ?,
                civil_status = ?, contact_number = ?, email_address = ?, current_address = ?,
                permanent_address = ?, tin = ?, gsis_number = ?, pagibig_number = ?,
                philhealth_number = ?, sss_number = ?, appointment_date = ?,
                plantilla_position = ?, department = ?, plantilla_number = ?, salary_grade = ?,
                step_increment = ?, current_monthly_salary = ?, current_daily_rate = ?,
                highest_monthly_salary = ?, highest_daily_rate = ?, employment_status = ?, 
                separation_date = ?, separation_reason = ?,
                height = ?, weight = ?, blood_type = ?, umid_id_no = ?, philsys_number = ?,
                agency_employee_no = ?, citizenship = ?, dual_citizenship_country = ?,
                residential_house_no = ?, residential_street = ?, residential_subdivision = ?,
                residential_barangay = ?, residential_city = ?, residential_province = ?,
                residential_zipcode = ?, permanent_house_no = ?, permanent_street = ?,
                permanent_subdivision = ?, permanent_barangay = ?, permanent_city = ?,
                permanent_province = ?, permanent_zipcode = ?, telephone_no = ?, mobile_no = ?
            WHERE id = ?
        `;

        const params = [
            this.user_id, this.employee_number, this.first_name, this.middle_name,
            this.last_name, this.suffix, this.sex, this.birth_date, this.birth_place,
            this.civil_status, this.contact_number, this.email_address, this.current_address,
            this.permanent_address, this.tin, this.gsis_number, this.pagibig_number,
            this.philhealth_number, this.sss_number, this.appointment_date,
            this.plantilla_position, this.department, this.plantilla_number, this.salary_grade,
            this.step_increment, this.current_monthly_salary, this.current_daily_rate,
            this.highest_monthly_salary, this.highest_daily_rate, this.employment_status,
            this.separation_date, this.separation_reason,
            this.height, this.weight, this.blood_type, this.umid_id_no, this.philsys_number,
            this.agency_employee_no, this.citizenship, this.dual_citizenship_country,
            this.residential_house_no, this.residential_street, this.residential_subdivision,
            this.residential_barangay, this.residential_city, this.residential_province,
            this.residential_zipcode, this.permanent_house_no, this.permanent_street,
            this.permanent_subdivision, this.permanent_barangay, this.permanent_city,
            this.permanent_province, this.permanent_zipcode, this.telephone_no, this.mobile_no,
            this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Employee updated successfully'
            };
        }

        return result;
    }

    // Static utility methods for salary calculations
    static calculateDailyFromMonthly(monthlySalary) {
        if (!monthlySalary || monthlySalary <= 0) return 0;
        return parseFloat((monthlySalary / 22).toFixed(2));
    }
    
    static calculateMonthlyFromDaily(dailyRate) {
        if (!dailyRate || dailyRate <= 0) return 0;
        return parseFloat((dailyRate * 22).toFixed(2));
    }
    
    // Get consistent salary values following the 22-day rule
    static getConsistentSalaryValues(employee) {
        let monthlySalary = parseFloat(employee.current_monthly_salary) || 0;
        let dailyRate = parseFloat(employee.current_daily_rate) || 0;
        
        // Calculate missing values based on the 22-day work month rule
        if (monthlySalary > 0 && dailyRate <= 0) {
            // Have monthly, calculate daily
            dailyRate = this.calculateDailyFromMonthly(monthlySalary);
        } else if (dailyRate > 0 && monthlySalary <= 0) {
            // Have daily, calculate monthly
            monthlySalary = this.calculateMonthlyFromDaily(dailyRate);
        } else if (monthlySalary <= 0 && dailyRate <= 0) {
            // Neither value is available, return zeros
            return { monthlySalary: 0, dailyRate: 0 };
        }
        
        return {
            monthlySalary: parseFloat(monthlySalary.toFixed(2)),
            dailyRate: parseFloat(dailyRate.toFixed(2))
        };
    }

    // ============================================================================
    // PAYROLL INTEGRATION METHODS
    // ============================================================================

    /**
     * Get consistent salary values ensuring 22-day rule compliance
     * Requirements: 2.1, 2.2
     * @returns {Object} { monthlySalary, dailyRate }
     */
    getConsistentSalaryValues() {
        return Employee.getConsistentSalaryValues(this);
    }

    /**
     * Get daily rate for a specific payroll period, considering overrides
     * Requirements: 2.1, 2.2, 13.1, 13.2, 13.3
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<number>} Daily rate with overrides applied
     */
    async getDailyRateForPeriod(periodId) {
        try {
            // Get base daily rate
            const { dailyRate } = this.getConsistentSalaryValues();
            
            // Check for salary overrides for this period
            const overrides = await this.getActiveOverrides(periodId);
            const salaryOverride = overrides.find(
                o => o.override_type === 'Salary Adjustment'
            );
            
            if (salaryOverride) {
                // Override amount is the adjusted daily rate
                return parseFloat(salaryOverride.override_amount);
            }
            
            return dailyRate;
        } catch (error) {
            console.error('Error getting daily rate for period:', error);
            // Return base daily rate on error
            return this.getConsistentSalaryValues().dailyRate;
        }
    }

    /**
     * Get active overrides for a specific payroll period
     * Requirements: 13.1, 13.2, 13.3
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Array>} Array of active overrides
     */
    async getActiveOverrides(periodId) {
        try {
            // First, get the payroll period dates
            const periodQuery = `
                SELECT start_date, end_date 
                FROM payroll_periods 
                WHERE id = ?
            `;
            const periodResult = await executeQuery(periodQuery, [periodId]);
            
            if (!periodResult.success || periodResult.data.length === 0) {
                return [];
            }
            
            const { start_date, end_date } = periodResult.data[0];
            
            // Get overrides that apply to this period
            const query = `
                SELECT 
                    eo.*,
                    u1.username as approved_by_username,
                    u2.username as created_by_username
                FROM employee_overrides eo
                LEFT JOIN users u1 ON eo.approved_by = u1.id
                LEFT JOIN users u2 ON eo.created_by = u2.id
                WHERE eo.employee_id = ?
                AND (
                    -- Period-specific override
                    (eo.payroll_period_id = ?)
                    OR
                    -- Date-range override that overlaps with period
                    (
                        eo.payroll_period_id IS NULL
                        AND eo.effective_from <= ?
                        AND (eo.effective_to IS NULL OR eo.effective_to >= ?)
                    )
                )
                ORDER BY eo.created_at DESC
            `;
            
            const result = await executeQuery(query, [
                this.id,
                periodId,
                end_date,
                start_date
            ]);
            
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting active overrides:', error);
            return [];
        }
    }

    /**
     * Static method to get active overrides for an employee and period
     * Requirements: 13.1, 13.2, 13.3
     * @param {number} employeeId - Employee ID
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Array>} Array of active overrides
     */
    static async getActiveOverridesForPeriod(employeeId, periodId) {
        try {
            // Get the payroll period dates
            const periodQuery = `
                SELECT start_date, end_date 
                FROM payroll_periods 
                WHERE id = ?
            `;
            const periodResult = await executeQuery(periodQuery, [periodId]);
            
            if (!periodResult.success || periodResult.data.length === 0) {
                return [];
            }
            
            const { start_date, end_date } = periodResult.data[0];
            
            // Get overrides that apply to this period
            const query = `
                SELECT 
                    eo.*,
                    u1.username as approved_by_username,
                    u2.username as created_by_username
                FROM employee_overrides eo
                LEFT JOIN users u1 ON eo.approved_by = u1.id
                LEFT JOIN users u2 ON eo.created_by = u2.id
                WHERE eo.employee_id = ?
                AND (
                    -- Period-specific override
                    (eo.payroll_period_id = ?)
                    OR
                    -- Date-range override that overlaps with period
                    (
                        eo.payroll_period_id IS NULL
                        AND eo.effective_from <= ?
                        AND (eo.effective_to IS NULL OR eo.effective_to >= ?)
                    )
                )
                ORDER BY eo.created_at DESC
            `;
            
            const result = await executeQuery(query, [
                employeeId,
                periodId,
                end_date,
                start_date
            ]);
            
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting active overrides:', error);
            return [];
        }
    }

    // Static methods

    // Find employee by ID (exclude soft deleted by default)
    static async findById(id, includeSoftDeleted = false) {
        let query = `
            SELECT e.*, u.username, u.email as user_email, u.role
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = ?
        `;
        
        if (!includeSoftDeleted) {
            query += ' AND e.deleted_at IS NULL';
        }
        
        const result = await findOne(query, [id]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new Employee(result.data)
            };
        }
        
        return result;
    }

    // Find employee by employee number (exclude soft deleted by default)
    static async findByEmployeeNumber(employeeNumber, includeSoftDeleted = false) {
        let query = `
            SELECT e.*, u.username, u.email as user_email, u.role
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.employee_number = ?
        `;
        
        if (!includeSoftDeleted) {
            query += ' AND e.deleted_at IS NULL';
        }
        
        const result = await findOne(query, [employeeNumber]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new Employee(result.data)
            };
        }
        
        return result;
    }

    // Find employee by user ID (exclude soft deleted by default)
    static async findByUserId(userId, includeSoftDeleted = false) {
        let query = `
            SELECT e.*, u.username, u.email as user_email, u.role
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.user_id = ?
        `;
        
        if (!includeSoftDeleted) {
            query += ' AND e.deleted_at IS NULL';
        }
        
        const result = await findOne(query, [userId]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new Employee(result.data)
            };
        }
        
        return result;
    }

    // Get all employees with optional filters and soft delete support
    static async findAll(filters = {}) {
        let query = `
            SELECT e.*, u.username, u.email as user_email, u.role
            FROM employees e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE 1=1
        `;
        
        const params = [];

        // Soft delete filter (exclude deleted by default unless specifically requested)
        if (filters.includeSoftDeleted !== true) {
            query += ' AND e.deleted_at IS NULL';
        }

        // Show only soft deleted records
        if (filters.onlySoftDeleted === true) {
            query += ' AND e.deleted_at IS NOT NULL';
        }

        if (filters.employment_status) {
            query += ' AND e.employment_status = ?';
            params.push(filters.employment_status);
        }

        if (filters.search) {
            query += ` AND (
                e.first_name LIKE ? OR 
                e.last_name LIKE ? OR 
                e.employee_number LIKE ? OR
                CONCAT(IFNULL(e.first_name, ''), ' ', IFNULL(e.last_name, '')) LIKE ? OR
                e.plantilla_position LIKE ?
            )`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters.department) {
            query += ' AND e.department = ?';
            params.push(filters.department);
        }

        if (filters.salary_grade) {
            query += ' AND e.salary_grade = ?';
            params.push(filters.salary_grade);
        }

        // Date range filters
        if (filters.appointment_date_from) {
            query += ' AND e.appointment_date >= ?';
            params.push(filters.appointment_date_from);
        }

        if (filters.appointment_date_to) {
            query += ' AND e.appointment_date <= ?';
            params.push(filters.appointment_date_to);
        }

        // Add sorting by employment status first, then alphabetically
        query += ` ORDER BY 
            CASE e.employment_status 
                WHEN 'Active' THEN 1 
                WHEN 'Retired' THEN 2 
                WHEN 'Resigned' THEN 3 
                WHEN 'Terminated' THEN 4 
                WHEN 'AWOL' THEN 5 
                ELSE 6 
            END,
            e.last_name, e.first_name`;

        // Improved pagination implementation - handle LIMIT/OFFSET separately
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
            const employees = result.data.map(row => new Employee(row));
            return {
                success: true,
                data: employees
            };
        }

        return result;
    }

    // Get total count for pagination
    static async getCount(filters = {}) {
        let query = `
            SELECT COUNT(*) as total
            FROM employees e
            WHERE 1=1
        `;
        
        const params = [];

        // Apply same filters as findAll for accurate count
        if (filters.includeSoftDeleted !== true) {
            query += ' AND e.deleted_at IS NULL';
        }

        if (filters.onlySoftDeleted === true) {
            query += ' AND e.deleted_at IS NOT NULL';
        }

        if (filters.employment_status) {
            query += ' AND e.employment_status = ?';
            params.push(filters.employment_status);
        }

        if (filters.search) {
            query += ` AND (
                e.first_name LIKE ? OR 
                e.last_name LIKE ? OR 
                e.employee_number LIKE ? OR
                CONCAT(IFNULL(e.first_name, ''), ' ', IFNULL(e.last_name, '')) LIKE ? OR
                e.plantilla_position LIKE ?
            )`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters.department) {
            query += ' AND e.plantilla_position LIKE ?';
            params.push(`%${filters.department}%`);
        }

        if (filters.salary_grade) {
            query += ' AND e.salary_grade = ?';
            params.push(filters.salary_grade);
        }

        if (filters.appointment_date_from) {
            query += ' AND e.appointment_date >= ?';
            params.push(filters.appointment_date_from);
        }

        if (filters.appointment_date_to) {
            query += ' AND e.appointment_date <= ?';
            params.push(filters.appointment_date_to);
        }

        const result = await findOne(query, params);
        return result.success ? result.data.total : 0;
    }

    // Soft delete employee
    static async softDelete(id) {
        const query = `
            UPDATE employees 
            SET deleted_at = NOW()
            WHERE id = ? AND deleted_at IS NULL
        `;
        
        const result = await executeQuery(query, [id]);
        
        if (result.success && result.data.affectedRows === 0) {
            return {
                success: false,
                error: 'Employee not found or already deleted'
            };
        }
        
        return result;
    }

    // Restore soft deleted employee
    static async restore(id) {
        const query = `
            UPDATE employees 
            SET deleted_at = NULL
            WHERE id = ? AND deleted_at IS NOT NULL
        `;
        
        const result = await executeQuery(query, [id]);
        
        if (result.success && result.data.affectedRows === 0) {
            return {
                success: false,
                error: 'Employee not found or not deleted'
            };
        }
        
        return result;
    }

    // Permanent delete employee (hard delete - admin only)
    static async forceDelete(id) {
        // First check if employee exists
        const existsResult = await findOne('SELECT id FROM employees WHERE id = ?', [id]);
        
        if (!existsResult.success || !existsResult.data) {
            return {
                success: false,
                error: 'Employee not found'
            };
        }

        const result = await executeQuery('DELETE FROM employees WHERE id = ?', [id]);
        return result;
    }

    // Legacy method for backward compatibility
    static async delete(id) {
        return await Employee.softDelete(id);
    }

    // Get employee statistics
    static async getStatistics() {
        const queries = [
            'SELECT COUNT(*) as total FROM employees WHERE employment_status = "Active"',
            'SELECT COUNT(*) as total FROM employees WHERE employment_status = "Resigned"',
            'SELECT COUNT(*) as total FROM employees WHERE employment_status = "Retired"',
            'SELECT COUNT(*) as total FROM employees WHERE employment_status = "Terminated"',
            'SELECT sex, COUNT(*) as count FROM employees WHERE employment_status = "Active" GROUP BY sex'
        ];

        try {
            const [active, resigned, retired, terminated, genderStats] = await Promise.all(
                queries.map(query => executeQuery(query))
            );

            return {
                success: true,
                data: {
                    active: active.success ? active.data[0].total : 0,
                    resigned: resigned.success ? resigned.data[0].total : 0,
                    retired: retired.success ? retired.data[0].total : 0,
                    terminated: terminated.success ? terminated.data[0].total : 0,
                    genderDistribution: genderStats.success ? genderStats.data : []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get employee statistics',
                details: error.message
            };
        }
    }

    // Update salary information
    async updateSalary(salaryGrade, stepIncrement, newSalary) {
        // Calculate daily rate from new salary
        const newDailyRate = this.calculateDailyRate(newSalary);
        const newHighestDaily = Math.max(this.highest_daily_rate || 0, newDailyRate);
        
        const query = `
            UPDATE employees SET 
                salary_grade = ?, 
                step_increment = ?, 
                current_monthly_salary = ?,
                current_daily_rate = ?,
                highest_monthly_salary = GREATEST(highest_monthly_salary, ?),
                highest_daily_rate = GREATEST(highest_daily_rate, ?)
            WHERE id = ?
        `;

        const params = [salaryGrade, stepIncrement, newSalary, newDailyRate, newSalary, newHighestDaily, this.id];
        const result = await executeQuery(query, params);

        if (result.success) {
            this.salary_grade = salaryGrade;
            this.step_increment = stepIncrement;
            this.current_monthly_salary = newSalary;
            this.current_daily_rate = newDailyRate;
            this.highest_monthly_salary = Math.max(this.highest_monthly_salary || 0, newSalary);
            this.highest_daily_rate = newHighestDaily;
        }

        return result;
    }

    // Process employee separation
    async processSeparation(separationDate, separationReason) {
        const query = `
            UPDATE employees SET 
                employment_status = ?, 
                separation_date = ?, 
                separation_reason = ?
            WHERE id = ?
        `;

        const status = separationReason.toLowerCase().includes('retire') ? 'Retired' : 'Resigned';
        const params = [status, separationDate, separationReason, this.id];
        
        const result = await executeQuery(query, params);

        if (result.success) {
            this.employment_status = status;
            this.separation_date = separationDate;
            this.separation_reason = separationReason;
        }

        return result;
    }
}

module.exports = Employee;