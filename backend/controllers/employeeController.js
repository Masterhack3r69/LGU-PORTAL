// controllers/employeeController.js - Employee management controller
const Employee = require('../models/Employee');
const { LeaveBalance } = require('../models/Leave');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const helpers = require('../utils/helpers');
const { executeQuery, executeTransaction } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Validation rules for employee creation
const employeeCreationRules = [
    body('first_name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required and must be less than 100 characters'),
    body('last_name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required and must be less than 100 characters'),
    body('employee_number')
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Employee number is required and must be less than 20 characters'),
    body('sex')
        .isIn(['Male', 'Female'])
        .withMessage('Sex must be either Male or Female'),
    body('birth_date')
        .custom((value) => {
            if (!value) throw new Error('Birth date is required');
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid birth date is required (YYYY-MM-DD format)');
        }),
    body('appointment_date')
        .custom((value) => {
            if (!value) throw new Error('Appointment date is required');
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid appointment date is required (YYYY-MM-DD format)');
        }),
    body('email_address')
        .optional({ checkFalsy: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address is required'),
    body('contact_number')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 })
        .withMessage('Contact number must be less than 20 characters'),
    body('current_monthly_salary')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number'),
    body('current_daily_rate')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Daily rate must be a positive number'),
    body('salary_grade')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 33 })
        .withMessage('Salary grade must be between 1 and 33'),
    body('step_increment')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 8 })
        .withMessage('Step increment must be between 1 and 8'),
    body('employment_status')
        .optional({ checkFalsy: true })
        .isIn(['Active', 'Resigned', 'Retired', 'Terminated', 'AWOL'])
        .withMessage('Employment status must be one of: Active, Resigned, Retired, Terminated, AWOL'),
    body('civil_status')
        .optional({ checkFalsy: true })
        .isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])
        .withMessage('Civil status must be one of: Single, Married, Widowed, Separated, Divorced'),
    body('separation_date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Valid separation date is required'),
    body('separation_reason')
        .optional({ checkFalsy: true })
        .isLength({ max: 255 })
        .withMessage('Separation reason must not exceed 255 characters')
];

// Validation rules for employee updates (more flexible)
const employeeUpdateRules = [
    body('first_name')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be less than 100 characters'),
    body('last_name')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be less than 100 characters'),
    body('employee_number')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Employee number must be less than 20 characters'),
    body('sex')
        .optional({ checkFalsy: true })
        .isIn(['Male', 'Female'])
        .withMessage('Sex must be either Male or Female'),
    body('birth_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid birth date is required (YYYY-MM-DD format)');
        }),
    body('appointment_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid appointment date is required (YYYY-MM-DD format)');
        }),
    body('email_address')
        .optional({ checkFalsy: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address is required'),
    body('contact_number')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 })
        .withMessage('Contact number must be less than 20 characters'),
    body('current_monthly_salary')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number'),
    body('current_daily_rate')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Daily rate must be a positive number'),
    body('salary_grade')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 33 })
        .withMessage('Salary grade must be between 1 and 33'),
    body('step_increment')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 8 })
        .withMessage('Step increment must be between 1 and 8'),
    body('employment_status')
        .optional({ checkFalsy: true })
        .isIn(['Active', 'Resigned', 'Retired', 'Terminated', 'AWOL'])
        .withMessage('Employment status must be one of: Active, Resigned, Retired, Terminated, AWOL'),
    body('civil_status')
        .optional({ checkFalsy: true })
        .isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])
        .withMessage('Civil status must be one of: Single, Married, Widowed, Separated, Divorced'),
    body('separation_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid separation date is required (YYYY-MM-DD format)');
        })
        .withMessage('Last name is required and must be less than 100 characters'),
    body('employee_number')
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Employee number is required and must be less than 20 characters'),
    body('sex')
        .optional({ checkFalsy: true })
        .isIn(['Male', 'Female'])
        .withMessage('Sex must be either Male or Female'),
    body('birth_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid birth date is required (YYYY-MM-DD format)');
        }),
    body('appointment_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            // Allow yyyy-MM-dd format or ISO8601
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid appointment date is required (YYYY-MM-DD format)');
        }),
    body('email_address')
        .optional({ checkFalsy: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address is required'),
    body('contact_number')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 })
        .withMessage('Contact number must be less than 20 characters'),
    body('current_monthly_salary')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number'),
    body('current_daily_rate')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Daily rate must be a positive number'),
    body('salary_grade')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 33 })
        .withMessage('Salary grade must be between 1 and 33'),
    body('step_increment')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 8 })
        .withMessage('Step increment must be between 1 and 8'),
    body('employment_status')
        .optional({ checkFalsy: true })
        .isIn(['Active', 'Resigned', 'Retired', 'Terminated', 'AWOL'])
        .withMessage('Employment status must be one of: Active, Resigned, Retired, Terminated, AWOL'),
    body('civil_status')
        .optional({ checkFalsy: true })
        .isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])
        .withMessage('Civil status must be one of: Single, Married, Widowed, Separated, Divorced'),
    body('separation_date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Valid separation date is required'),
    body('separation_reason')
        .optional({ checkFalsy: true })
        .isLength({ max: 255 })
        .withMessage('Separation reason must not exceed 255 characters')
];

// GET /api/employees - Get all employees with pagination and filtering
const getAllEmployees = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        search, 
        employment_status, 
        department,
        salary_grade,
        appointment_date_from,
        appointment_date_to,
        include_deleted = false
    } = req.query;

    // Validate pagination parameters
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const offset = (pageNumber - 1) * pageSize;

    // Build filters object
    const filters = {
        limit: pageSize,
        offset: offset,
        includeSoftDeleted: include_deleted === 'true'
    };

    // Add optional filters
    if (search && search.trim()) {
        filters.search = search.trim();
    }

    if (employment_status) {
        filters.employment_status = employment_status;
    }

    if (department) {
        filters.department = department;
    }

    if (salary_grade) {
        filters.salary_grade = parseInt(salary_grade);
    }

    if (appointment_date_from) {
        filters.appointment_date_from = appointment_date_from;
    }

    if (appointment_date_to) {
        filters.appointment_date_to = appointment_date_to;
    }

    // Get employees and total count
    const [employeesResult, totalCount] = await Promise.all([
        Employee.findAll(filters),
        Employee.getCount(filters)
    ]);
    
    if (!employeesResult.success) {
        throw new Error(employeesResult.error);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = pageNumber < totalPages;
    const hasPrevious = pageNumber > 1;
    
    res.json({
        success: true,
        data: employeesResult.data,
        pagination: {
            currentPage: pageNumber,
            pageSize: pageSize,
            totalRecords: totalCount,
            totalPages: totalPages,
            hasNext: hasNext,
            hasPrevious: hasPrevious,
            nextPage: hasNext ? pageNumber + 1 : null,
            previousPage: hasPrevious ? pageNumber - 1 : null
        },
        filters: {
            search: search || null,
            employment_status: employment_status || null,
            department: department || null,
            salary_grade: salary_grade || null,
            appointment_date_from: appointment_date_from || null,
            appointment_date_to: appointment_date_to || null,
            include_deleted: include_deleted === 'true'
        }
    });
});

// GET /api/employees/:id - Get employee by ID with soft delete support
const getEmployeeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { include_deleted = false } = req.query;
    
    const result = await Employee.findById(id, include_deleted === 'true');
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    if (!result.data) {
        throw new NotFoundError('Employee not found');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: 'Employee retrieved successfully'
    });
});

// POST /api/employees - Create new employee with enhanced validation and user account creation
const createEmployee = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    // Check for duplicate employee number
    const existingEmployee = await Employee.findByEmployeeNumber(req.body.employee_number);
    if (existingEmployee.success && existingEmployee.data) {
        throw new ValidationError('Employee number already exists');
    }
    
    // Check for duplicate email if provided
    if (req.body.email_address) {
        const emailQuery = `
            SELECT id FROM employees 
            WHERE email_address = ? AND deleted_at IS NULL
        `;
        const emailResult = await executeQuery(emailQuery, [req.body.email_address]);
        if (emailResult.success && emailResult.data.length > 0) {
            throw new ValidationError('Email address already exists');
        }
    }
    
    let userId = null;
    let tempPassword = null;
    
    // Create user account if email is provided
    if (req.body.email_address) {
        // Generate username from employee number and first name
        let username = `${req.body.employee_number.toLowerCase()}_${req.body.first_name.toLowerCase().replace(/\s+/g, '')}`;
        
        // Check if username already exists and modify if needed
        const usernameQuery = 'SELECT id FROM users WHERE username = ?';
        const usernameResult = await executeQuery(usernameQuery, [username]);
        
        if (usernameResult.success && usernameResult.data.length > 0) {
            // Use employee number as fallback username
            username = req.body.employee_number.toLowerCase();
            
            // Check fallback username
            const fallbackResult = await executeQuery(usernameQuery, [username]);
            if (fallbackResult.success && fallbackResult.data.length > 0) {
                throw new ValidationError('Unable to generate unique username. Please create user account manually.');
            }
        }
        
        // Generate a secure temporary password
        const helpers = require('../utils/helpers');
        tempPassword = helpers.generateRandomPassword(12);
        
        // Create user account
        const userResult = await authMiddleware.createUser({
            username: username,
            email: req.body.email_address,
            password: tempPassword,
            role: 'employee'
        });
        
        if (!userResult.success) {
            throw new Error(`Failed to create user account: ${userResult.error}`);
        }
        
        userId = userResult.user_id;
    }
    
    // Create employee with user_id
    const employeeData = {
        ...req.body,
        user_id: userId
    };
    
    const employee = new Employee(employeeData);
    const result = await employee.save();
    
    if (!result.success) {
        // If employee creation fails and we created a user, we should clean up
        if (userId) {
            await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
        }
        throw new Error(result.error || 'Failed to create employee');
    }
    
    // Initialize leave balances for the current year
    const currentYear = new Date().getFullYear();
    try {
        await LeaveBalance.initializeYearlyBalances(result.data.id, currentYear, req.body.appointment_date);
    } catch (error) {
        console.warn(`Failed to initialize leave balances for employee ${result.data.id}:`, error.message);
        // Don't fail the entire operation if balance initialization fails
    }
    
    const response = {
        success: true,
        data: result.data,
        message: 'Employee created successfully'
    };
    
    // Include user account information in response if created
    if (userId) {
        response.user_account = {
            created: true,
            user_id: userId,
            temporary_password: tempPassword,
            message: 'User account created. Please advise employee to change password on first login.'
        };
    } else {
        response.user_account = {
            created: false,
            message: 'No user account created (email address not provided)'
        };
    }
    
    res.status(201).json(response);
});

// PUT /api/employees/:id - Update employee with enhanced validation and user account creation
const updateEmployee = asyncHandler(async (req, res) => {
    console.log('Update employee request body:', req.body);
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const { id } = req.params;
    
    // Get existing employee (include soft deleted for updates)
    const existingResult = await Employee.findById(id, true);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Employee not found');
    }

    const existingEmployee = existingResult.data;
    
    // Check if employee is soft deleted
    if (existingEmployee.isDeleted()) {
        throw new ValidationError('Cannot update deleted employee. Please restore first.');
    }
    
    // Check for duplicate employee number (excluding current employee)
    if (req.body.employee_number && req.body.employee_number !== existingEmployee.employee_number) {
        const duplicateEmployee = await Employee.findByEmployeeNumber(req.body.employee_number);
        if (duplicateEmployee.success && duplicateEmployee.data) {
            throw new ValidationError('Employee number already exists');
        }
    }
    
    // Check for duplicate email (excluding current employee)
    if (req.body.email_address && req.body.email_address !== existingEmployee.email_address) {
        const emailQuery = `
            SELECT id FROM employees 
            WHERE email_address = ? AND id != ? AND deleted_at IS NULL
        `;
        const emailResult = await executeQuery(emailQuery, [req.body.email_address, id]);
        if (emailResult.success && emailResult.data.length > 0) {
            throw new ValidationError('Email address already exists');
        }
    }
    
    // Create user account if employee doesn't have one and email is provided
    let userAccountCreated = false;
    let tempPassword = null;
    
    if (!existingEmployee.user_id && req.body.email_address) {
        try {
            // Generate username from employee number and first name
            let username = `${(req.body.employee_number || existingEmployee.employee_number).toLowerCase()}_${(req.body.first_name || existingEmployee.first_name).toLowerCase().replace(/\s+/g, '')}`;
            
            // Check if username already exists and modify if needed
            const usernameQuery = 'SELECT id FROM users WHERE username = ?';
            const usernameResult = await executeQuery(usernameQuery, [username]);
            
            if (usernameResult.success && usernameResult.data.length > 0) {
                // Use employee number as fallback username
                username = (req.body.employee_number || existingEmployee.employee_number).toLowerCase();
            }
            
            // Generate a secure temporary password
            const helpers = require('../utils/helpers');
            tempPassword = helpers.generateRandomPassword(12);
            
            // Create user account
            const userResult = await authMiddleware.createUser({
                username: username,
                email: req.body.email_address,
                password: tempPassword,
                role: 'employee'
            });
            
            if (userResult.success) {
                req.body.user_id = userResult.user_id;
                userAccountCreated = true;
            }
        } catch (error) {
            console.warn('Failed to create user account during employee update:', error.message);
            // Continue with employee update even if user creation fails
        }
    }
    
    // Store old values for audit logging
    const oldValues = { ...existingEmployee };
    
    // Update employee data
    Object.assign(existingEmployee, req.body);
    existingEmployee.id = id; // Ensure ID is preserved
    
    const result = await existingEmployee.save();
    
    if (!result.success) {
        // If employee update fails and we created a user, clean up
        if (userAccountCreated && req.body.user_id) {
            await executeQuery('DELETE FROM users WHERE id = ?', [req.body.user_id]);
        }
        throw new Error(result.error || 'Failed to update employee');
    }
    
    // Initialize leave balances if user account was created during update
    if (userAccountCreated) {
        const currentYear = new Date().getFullYear();
        try {
            // Use appointment date from request body or existing employee data
            const appointmentDate = req.body.appointment_date || existingEmployee.appointment_date;
            await LeaveBalance.initializeYearlyBalances(id, currentYear, appointmentDate);
        } catch (error) {
            console.warn(`Failed to initialize leave balances for employee ${id}:`, error.message);
            // Don't fail the entire operation if balance initialization fails
        }
    }
    
    const response = {
        success: true,
        data: result.data,
        message: 'Employee updated successfully'
    };
    
    // Include user account information in response if created
    if (userAccountCreated) {
        response.user_account = {
            created: true,
            user_id: req.body.user_id,
            temporary_password: tempPassword,
            message: 'User account created during update. Please advise employee to change password on first login.'
        };
    }
    
    res.json(response);
});

// DELETE /api/employees/:id - Soft delete employee
const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force = false } = req.query;
    
    // Check if employee exists (including soft deleted)
    const existingResult = await Employee.findById(id, true);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Employee not found');
    }

    const employee = existingResult.data;
    
    if (force === 'true') {
        // Force delete (hard delete) - admin only
        const result = await Employee.forceDelete(id);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to permanently delete employee');
        }
        
        res.json({
            success: true,
            message: 'Employee permanently deleted'
        });
    } else {
        // Soft delete
        if (employee.isDeleted()) {
            throw new ValidationError('Employee is already deleted');
        }
        
        const result = await Employee.softDelete(id);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to delete employee');
        }
        
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    }
});

// PUT /api/employees/:id/restore - Restore soft deleted employee
const restoreEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if employee exists and is deleted
    const existingResult = await Employee.findById(id, true);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Employee not found');
    }

    const employee = existingResult.data;
    
    if (!employee.isDeleted()) {
        throw new ValidationError('Employee is not deleted');
    }
    
    const result = await Employee.restore(id);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to restore employee');
    }
    
    res.json({
        success: true,
        message: 'Employee restored successfully'
    });
});

// GET /api/employees/deleted - Get soft deleted employees
const getDeletedEmployees = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        search
    } = req.query;

    // Validate pagination parameters
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNumber - 1) * pageSize;

    // Build filters for deleted employees only
    const filters = {
        limit: pageSize,
        offset: offset,
        onlySoftDeleted: true
    };

    if (search && search.trim()) {
        filters.search = search.trim();
    }

    // Get deleted employees and total count
    const [employeesResult, totalCount] = await Promise.all([
        Employee.findAll(filters),
        Employee.getCount(filters)
    ]);
    
    if (!employeesResult.success) {
        throw new Error(employeesResult.error);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = pageNumber < totalPages;
    const hasPrevious = pageNumber > 1;
    
    res.json({
        success: true,
        data: employeesResult.data,
        pagination: {
            currentPage: pageNumber,
            pageSize: pageSize,
            totalRecords: totalCount,
            totalPages: totalPages,
            hasNext: hasNext,
            hasPrevious: hasPrevious
        },
        message: 'Deleted employees retrieved successfully'
    });
});

// PUT /api/employees/:id/salary - Update employee salary
const updateEmployeeSalary = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { salary_grade, step_increment, new_salary } = req.body;
    
    // Validate required fields
    if (!salary_grade || !step_increment || !new_salary) {
        throw new ValidationError('Salary grade, step increment, and new salary are required');
    }
    
    // Get existing employee
    const existingResult = await Employee.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Employee not found');
    }
    
    const employee = existingResult.data;
    const result = await employee.updateSalary(salary_grade, step_increment, new_salary);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to update salary');
    }
    
    res.json({
        success: true,
        message: 'Employee salary updated successfully'
    });
});

// PUT /api/employees/:id/separation - Process employee separation
const processEmployeeSeparation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { separation_date, separation_reason } = req.body;
    
    // Validate required fields
    if (!separation_date || !separation_reason) {
        throw new ValidationError('Separation date and reason are required');
    }
    
    // Get existing employee
    const existingResult = await Employee.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Employee not found');
    }
    
    const employee = existingResult.data;
    const result = await employee.processSeparation(separation_date, separation_reason);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to process separation');
    }
    
    res.json({
        success: true,
        message: 'Employee separation processed successfully'
    });
});

// GET /api/employees/search - Search employees
const searchEmployees = asyncHandler(async (req, res) => {
    const { q, type = 'all' } = req.query;
    
    if (!q || q.trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
    }
    
    const filters = {
        search: q.trim(),
        limit: 20 // Limit search results
    };
    
    if (type === 'active') {
        filters.employment_status = 'Active';
    }
    
    const result = await Employee.findAll(filters);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data.map(emp => ({
            id: emp.id,
            employee_number: emp.employee_number,
            full_name: emp.getFullName(),
            position: emp.plantilla_position,
            employment_status: emp.employment_status
        }))
    });
});

// PUT /api/employees/:id/daily-rate - Update employee daily rate
const updateEmployeeDailyRate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { current_daily_rate } = req.body;
    
    // Validate required fields
    if (!current_daily_rate || current_daily_rate <= 0) {
        throw new ValidationError('Valid daily rate is required');
    }
    
    // Get existing employee
    const existingResult = await Employee.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Employee not found');
    }
    
    const employee = existingResult.data;
    
    // Calculate monthly salary from daily rate (daily rate * 22 working days)
    const calculatedMonthlySalary = parseFloat((current_daily_rate * 22).toFixed(2));
    
    // Update both daily rate and corresponding monthly salary
    employee.current_daily_rate = current_daily_rate;
    employee.current_monthly_salary = calculatedMonthlySalary;
    employee.highest_daily_rate = Math.max(employee.highest_daily_rate || 0, current_daily_rate);
    employee.highest_monthly_salary = Math.max(employee.highest_monthly_salary || 0, calculatedMonthlySalary);
    
    const result = await employee.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to update daily rate');
    }
    
    res.json({
        success: true,
        message: 'Employee daily rate updated successfully',
        data: {
            current_daily_rate: employee.current_daily_rate,
            current_monthly_salary: employee.current_monthly_salary,
            highest_daily_rate: employee.highest_daily_rate,
            highest_monthly_salary: employee.highest_monthly_salary
        }
    });
});

// GET /api/employees/statistics - Get employee statistics with soft delete info
const getEmployeeStatistics = asyncHandler(async (req, res) => {
    const [basicStats, deletedCount] = await Promise.all([
        Employee.getStatistics(),
        Employee.getCount({ onlySoftDeleted: true })
    ]);
    
    if (!basicStats.success) {
        throw new Error(basicStats.error);
    }
    
    res.json({
        success: true,
        data: {
            ...basicStats.data,
            deleted: deletedCount
        }
    });
});

// GET /api/employees/:id/leave-balances - Get employee leave balances
const getEmployeeLeaveBalances = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get leave balances for the employee
    const query = `
        SELECT elb.*, lt.name as leave_type_name, lt.max_days_per_year
        FROM employee_leave_balances elb
        JOIN leave_types lt ON elb.leave_type_id = lt.id
        WHERE elb.employee_id = ? AND elb.year = YEAR(CURDATE())
        ORDER BY lt.name
    `;
    
    const result = await executeQuery(query, [id]);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        leaveBalances: result.data
    });
});

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    restoreEmployee,
    getDeletedEmployees,
    getEmployeeStatistics,
    updateEmployeeSalary,
    updateEmployeeDailyRate,
    processEmployeeSeparation,
    searchEmployees,
    getEmployeeLeaveBalances,
    employeeCreationRules,
    employeeUpdateRules
};