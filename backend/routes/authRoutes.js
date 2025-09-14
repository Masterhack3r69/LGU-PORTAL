// routes/authRoutes.js - Authentication routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { asyncHandler } = require('../middleware/errorHandler');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth routes - more restrictive for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiting for session verification - more lenient
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 session checks per window (enough for normal usage)
    message: {
        error: 'Too many session verification requests, please try again later.',
        retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Validation rules
const loginValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Email or username must be between 3 and 100 characters'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        })
];

// POST /api/auth/login - User login (with strict rate limiting)
router.post('/login', loginLimiter, loginValidation, asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Attempt login
    const loginResult = await authMiddleware.login(username, password, ipAddress, userAgent);

    if (!loginResult.success) {
        return res.status(401).json({
            error: 'Login failed',
            message: loginResult.error
        });
    }

    // Store user in session
    req.session.user = loginResult.user;

    res.json({
        success: true,
        message: 'Login successful',
        user: {
            id: loginResult.user.id,
            username: loginResult.user.username,
            role: loginResult.user.role,
            employee_id: loginResult.user.employee_id,
            full_name: loginResult.user.full_name
        }
    });
}));

// POST /api/auth/logout - User logout
router.post('/logout', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({
                error: 'Logout failed',
                message: 'An error occurred during logout'
            });
        }

        res.clearCookie(process.env.SESSION_NAME || 'ems_session');
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
}));

// GET /api/auth/me - Get current user info (with lenient rate limiting)
router.get('/me', sessionLimiter, authMiddleware.requireAuth, asyncHandler(async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.session.user.id,
            username: req.session.user.username,
            email: req.session.user.email,
            role: req.session.user.role,
            employee_id: req.session.user.employee_id,
            employee_number: req.session.user.employee_number,
            full_name: req.session.user.full_name
        }
    });
}));

// POST /api/auth/change-password - Change user password (with login rate limiting)
router.post('/change-password', 
    loginLimiter, 
    authMiddleware.requireAuth, 
    changePasswordValidation, 
    asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;

        // Change password
        const changeResult = await authMiddleware.changePassword(userId, currentPassword, newPassword);

        if (!changeResult.success) {
            return res.status(400).json({
                error: 'Password change failed',
                message: changeResult.error
            });
        }

        res.json({
            success: true,
            message: changeResult.message
        });
    })
);

// PUT /api/auth/update-profile - Update user profile (with session rate limiting)
router.put('/update-profile',
    sessionLimiter,
    authMiddleware.requireAuth,
    [
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email address is required'),
        body('contact_number')
            .optional()
            .isMobilePhone('en-PH')
            .withMessage('Valid Philippine mobile number is required'),
        body('current_address')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Current address must be less than 500 characters'),
        body('permanent_address')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Permanent address must be less than 500 characters'),
        body('tin')
            .optional()
            .trim()
            .isLength({ max: 20 })
            .withMessage('TIN should be in format: XXXXXXXXXXXX'),
        body('gsis_number')
            .optional()
            .trim()
            .isLength({ max: 20 })
            .withMessage('GSIS number must be less than 20 characters'),
        body('pagibig_number')
            .optional()
            .trim()
            .isLength({ max: 20 })
            .withMessage('Pag-IBIG number must be less than 20 characters'),
        body('philhealth_number')
            .optional()
            .trim()
            .isLength({ max: 20 })
            .withMessage('PhilHealth number must be less than 20 characters'),
        body('sss_number')
            .optional()
            .trim()
            .isLength({ max: 20 })
            .withMessage('SSS number must be less than 20 characters')
    ],
    asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const userId = req.session.user.id;
        const employeeId = req.session.user.employee_id;
        const updates = req.body;

        try {
            // Separate user and employee updates
            const userUpdates = {};
            const employeeUpdates = {};

            // User account fields
            if (updates.username !== undefined) userUpdates.username = updates.username;
            if (updates.email !== undefined) userUpdates.email = updates.email;

            // Employee fields
            if (updates.contact_number !== undefined) employeeUpdates.contact_number = updates.contact_number;
            if (updates.current_address !== undefined) employeeUpdates.current_address = updates.current_address;
            if (updates.permanent_address !== undefined) employeeUpdates.permanent_address = updates.permanent_address;
            if (updates.tin !== undefined) employeeUpdates.tin = updates.tin;
            if (updates.gsis_number !== undefined) employeeUpdates.gsis_number = updates.gsis_number;
            if (updates.pagibig_number !== undefined) employeeUpdates.pagibig_number = updates.pagibig_number;
            if (updates.philhealth_number !== undefined) employeeUpdates.philhealth_number = updates.philhealth_number;
            if (updates.sss_number !== undefined) employeeUpdates.sss_number = updates.sss_number;
            
            // Also map email to employee email_address for consistency
            if (updates.email !== undefined) employeeUpdates.email_address = updates.email;

            // Update user account if there are user-specific changes
            if (Object.keys(userUpdates).length > 0) {
                // Check if username is already taken by another user
                if (userUpdates.username) {
                    const { executeQuery } = require('../config/database');
                    const existingUserQuery = 'SELECT id FROM users WHERE username = ? AND id != ?';
                    const existingUserResult = await executeQuery(existingUserQuery, [userUpdates.username, userId]);
                    
                    if (existingUserResult.success && existingUserResult.data.length > 0) {
                        return res.status(400).json({
                            error: 'Username already exists',
                            message: 'This username is already taken by another user'
                        });
                    }
                }

                // Check if email is already taken by another user
                if (userUpdates.email) {
                    const { executeQuery } = require('../config/database');
                    const existingEmailQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
                    const existingEmailResult = await executeQuery(existingEmailQuery, [userUpdates.email, userId]);
                    
                    if (existingEmailResult.success && existingEmailResult.data.length > 0) {
                        return res.status(400).json({
                            error: 'Email already exists',
                            message: 'This email is already taken by another user'
                        });
                    }
                }

                // Update user table
                const { executeQuery } = require('../config/database');
                const userUpdateFields = Object.keys(userUpdates).map(key => `${key} = ?`).join(', ');
                const userUpdateValues = Object.values(userUpdates);
                userUpdateValues.push(userId);
                
                const userUpdateQuery = `UPDATE users SET ${userUpdateFields}, updated_at = NOW() WHERE id = ?`;
                await executeQuery(userUpdateQuery, userUpdateValues);
            }

            // Update employee information if there are employee-specific changes and user has employee_id
            if (Object.keys(employeeUpdates).length > 0 && employeeId) {
                const Employee = require('../models/Employee');
                
                // First, get the current employee data
                const employeeResult = await Employee.findById(employeeId);
                if (!employeeResult.success) {
                    throw new Error('Employee not found');
                }
                
                // Update the employee instance with new data
                const employee = employeeResult.data;
                Object.keys(employeeUpdates).forEach(key => {
                    employee[key] = employeeUpdates[key];
                });
                
                // Save the updated employee
                const updateResult = await employee.update();
                if (!updateResult.success) {
                    throw new Error(updateResult.error);
                }
            }

            // Update session with new user data
            if (Object.keys(userUpdates).length > 0) {
                const { executeQuery } = require('../config/database');
                const updatedUserQuery = `
                    SELECT u.id, u.username, u.email, u.role, u.employee_id,
                           e.employee_number, 
                           CONCAT(e.first_name, ' ', e.last_name) as full_name
                    FROM users u
                    LEFT JOIN employees e ON u.employee_id = e.id
                    WHERE u.id = ?
                `;
                const updatedUserResult = await executeQuery(updatedUserQuery, [userId]);
                
                if (updatedUserResult.success && updatedUserResult.data.length > 0) {
                    req.session.user = {
                        ...req.session.user,
                        ...updatedUserResult.data[0]
                    };
                }
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: req.session.user
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({
                error: 'Profile update failed',
                message: error.message || 'An unexpected error occurred'
            });
        }
    })
);

// POST /api/auth/create-user - Create new user account (Admin only)
router.post('/create-user', 
    authMiddleware.requireAdmin,
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email address is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
        body('role')
            .isIn(['admin', 'employee'])
            .withMessage('Role must be either admin or employee')
    ],
    asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { username, email, password, role } = req.body;

        // Create user
        const createResult = await authMiddleware.createUser({
            username,
            email,
            password,
            role
        });

        if (!createResult.success) {
            return res.status(400).json({
                error: 'User creation failed',
                message: createResult.error
            });
        }

        res.status(201).json({
            success: true,
            message: createResult.message,
            user_id: createResult.user_id
        });
    })
);

// GET /api/auth/check-session - Check if session is valid (with lenient rate limiting)
router.get('/check-session', sessionLimiter, (req, res) => {
    if (req.session.user) {
        res.json({
            valid: true,
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                role: req.session.user.role,
                employee_id: req.session.user.employee_id,
                full_name: req.session.user.full_name
            }
        });
    } else {
        res.json({
            valid: false
        });
    }
});

module.exports = router;