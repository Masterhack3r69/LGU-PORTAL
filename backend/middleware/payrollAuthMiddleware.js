// middleware/payrollAuth.js - Payroll-specific authentication and authorization middleware
const Employee = require('../models/Employee');

// Check if user has admin role (required for most payroll operations)
const requireAdmin = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required for payroll operations'
        });
    }

    next();
};

// Check if user can access payroll data (admin or employee accessing own data)
const requirePayrollAccess = async (req, res, next) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = req.session.user;

        // Admin has access to all payroll data
        if (user.role === 'admin') {
            return next();
        }

        // Employee can only access their own payroll data
        if (user.role === 'employee') {
            // Get employee record for this user
            const employeeResult = await Employee.findByUserId(user.id);
            if (!employeeResult.success || !employeeResult.data) {
                return res.status(403).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            // Check if the requested employee data belongs to this user
            const requestedEmployeeId = req.params.employeeId || 
                                       req.body.employee_id ||
                                       req.query.employee_id;

            if (requestedEmployeeId && parseInt(requestedEmployeeId) !== employeeResult.data.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Can only view own payroll data'
                });
            }

            // Add employee info to request for easier access
            req.employee = employeeResult.data;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Invalid user role'
        });

    } catch (error) {
        console.error('Payroll access check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};

// Middleware to validate payroll period access
const validatePeriodAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Period ID is required'
            });
        }

        // Add period ID to request for easier access in controllers
        req.periodId = parseInt(id);
        next();

    } catch (error) {
        console.error('Period access validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Period access validation failed'
        });
    }
};

// Middleware to validate payroll item access
const validateItemAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.session.user;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Payroll item ID is required'
            });
        }

        // Admin has access to all payroll items
        if (user.role === 'admin') {
            req.itemId = parseInt(id);
            return next();
        }

        // Employee can only access their own payroll items
        if (user.role === 'employee') {
            const PayrollItem = require('../models/Payroll/PayrollItem');
            const itemResult = await PayrollItem.findById(id);
            
            if (!itemResult.success || !itemResult.data) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll item not found'
                });
            }

            // Get employee record for this user
            const employeeResult = await Employee.findByUserId(user.id);
            if (!employeeResult.success || !employeeResult.data) {
                return res.status(403).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            // Check if the payroll item belongs to this employee
            if (itemResult.data.employee_id !== employeeResult.data.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Can only view own payroll items'
                });
            }

            req.itemId = parseInt(id);
            req.employee = employeeResult.data;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Invalid user role'
        });

    } catch (error) {
        console.error('Item access validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Item access validation failed'
        });
    }
};

// Middleware to check if payroll period can be modified
const checkPeriodModifiable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const PayrollPeriod = require('../models/Payroll/PayrollPeriod');
        
        const periodResult = await PayrollPeriod.findById(id);
        if (!periodResult.success || !periodResult.data) {
            return res.status(404).json({
                success: false,
                message: 'Payroll period not found'
            });
        }

        const period = periodResult.data;

        // Check if period can be edited based on operation
        const operation = req.route.path;
        
        if (operation.includes('finalize')) {
            if (!period.canFinalize()) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot finalize period with status: ${period.status}`
                });
            }
        } else if (operation.includes('reopen')) {
            if (!period.canReopen()) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot reopen period with status: ${period.status}`
                });
            }
        } else {
            // General edit operations
            if (!period.canEdit()) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot modify period with status: ${period.status}`
                });
            }
        }

        req.period = period;
        next();

    } catch (error) {
        console.error('Period modifiable check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Period modification check failed'
        });
    }
};

// Middleware to validate payroll configuration access (admin only)
const requirePayrollConfig = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required for payroll configuration'
        });
    }

    next();
};

// Middleware to validate bulk operations
const validateBulkOperation = (req, res, next) => {
    const { employees, items, overrides } = req.body;
    
    // Check for bulk data
    const bulkData = employees || items || overrides;
    
    if (bulkData) {
        if (!Array.isArray(bulkData)) {
            return res.status(400).json({
                success: false,
                message: 'Bulk operation data must be an array'
            });
        }

        if (bulkData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bulk operation data cannot be empty'
            });
        }

        if (bulkData.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Bulk operation limited to 1000 items'
            });
        }

        req.bulkData = bulkData;
    }

    next();
};

// Middleware to log sensitive payroll operations
const logSensitiveOperation = (req, res, next) => {
    const sensitiveOperations = [
        'finalize',
        'mark-paid',
        'bulk-mark-paid',
        'manual-adjustment',
        'adjust-working-days'
    ];

    const operation = req.route.path;
    const isSensitive = sensitiveOperations.some(op => operation.includes(op));

    if (isSensitive) {
        console.log(`🔒 Sensitive payroll operation: ${req.method} ${req.originalUrl} by user ${req.session.user.id} (${req.session.user.username})`);
        
        // Add operation context to request
        req.sensitiveOperation = true;
        req.operationType = sensitiveOperations.find(op => operation.includes(op));
    }

    next();
};

// Middleware to rate limit payroll operations
const rateLimitPayroll = (req, res, next) => {
    // Skip rate limiting if user is not authenticated
    if (!req.session?.user?.id) {
        return next();
    }

    // Simple in-memory rate limiting (in production, use Redis)
    if (!global.payrollRateLimit) {
        global.payrollRateLimit = new Map();
    }

    const userId = req.session.user.id;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 100; // Max 100 requests per minute

    const userRequests = global.payrollRateLimit.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many payroll requests. Please try again later.'
        });
    }

    recentRequests.push(now);
    global.payrollRateLimit.set(userId, recentRequests);

    next();
};

// Middleware to validate request timing (business hours check)
const validateBusinessHours = (req, res, next) => {
    // Skip validation for read operations
    if (req.method === 'GET') {
        return next();
    }

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Business hours: Monday-Friday, 6 AM - 10 PM
    const isBusinessHours = day >= 1 && day <= 5 && hour >= 6 && hour <= 22;
    
    if (!isBusinessHours) {
        // Allow but log warning for operations outside business hours
        console.warn(`⚠️ Payroll operation outside business hours: ${req.method} ${req.originalUrl} at ${now.toISOString()}`);
    }

    next();
};

module.exports = {
    requireAdmin,
    requirePayrollAccess,
    validatePeriodAccess,
    validateItemAccess,
    checkPeriodModifiable,
    requirePayrollConfig,
    validateBulkOperation,
    logSensitiveOperation,
    rateLimitPayroll,
    validateBusinessHours
};