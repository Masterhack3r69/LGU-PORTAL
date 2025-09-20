// middleware/auth.js - Authentication middleware
const bcrypt = require('bcryptjs');
const { findOne, executeQuery } = require('../config/database');

// Check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }
    
    // Set req.user for controller access
    req.user = req.session.user;
    next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Access denied',
            message: 'Administrator privileges required'
        });
    }
    
    // Set req.user for controller access
    req.user = req.session.user;
    next();
};

// Check if user can access employee data (own data or admin)
const requireEmployeeAccess = (req, res, next) => {
    const requestedEmployeeId = parseInt(req.params.employeeId || req.params.id);
    const currentUser = req.session.user;

    // Admin can access any employee data
    if (currentUser.role === 'admin') {
        return next();
    }

    // Employee can only access their own data
    if (currentUser.employee_id === requestedEmployeeId) {
        return next();
    }

    return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own employee data'
    });
};

// Check if user is admin or accessing their own data
const requireAdminOrOwner = (req, res, next) => {
    const requestedEmployeeId = parseInt(req.params.employeeId || req.params.id);
    const currentUser = req.session.user;

    // Check if user exists first
    if (!currentUser) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }

    // Admin can access any data
    if (currentUser.role === 'admin') {
        req.user = req.session.user;
        return next();
    }

    // Employee can only access their own data
    if (currentUser.employee_id === requestedEmployeeId) {
        req.user = req.session.user;
        return next();
    }

    return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own data'
    });
};

// Middleware to set user in request object
const authenticate = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }
    req.user = req.session.user;
    next();
};

// Login function
const login = async (usernameOrEmail, password, ipAddress, userAgent) => {
    try {
        // Get user with login attempt tracking - support both username and email
        const userResult = await findOne(
            `SELECT u.*, e.id as employee_id, e.employee_number, e.first_name, e.last_name 
             FROM users u 
             LEFT JOIN employees e ON u.id = e.user_id 
             WHERE (u.username = ? OR u.email = ?) AND u.is_active = 1`,
            [usernameOrEmail, usernameOrEmail]
        );

        if (!userResult.success || !userResult.data) {
            return {
                success: false,
                error: 'Invalid username or password'
            };
        }

        const user = userResult.data;

        // Check if account is locked
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
            const lockTimeRemaining = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
            return {
                success: false,
                error: `Account is locked. Try again in ${lockTimeRemaining} minutes.`
            };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            // Increment failed login attempts
            const failedAttempts = (user.failed_login_attempts || 0) + 1;
            const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
            const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000; // 15 minutes

            let updateQuery = 'UPDATE users SET failed_login_attempts = ?';
            let queryParams = [failedAttempts];

            // Lock account if max attempts reached
            if (failedAttempts >= maxAttempts) {
                const lockUntil = new Date(Date.now() + lockoutTime);
                updateQuery += ', locked_until = ?';
                queryParams.push(lockUntil);
            }

            updateQuery += ' WHERE id = ?';
            queryParams.push(user.id);

            await executeQuery(updateQuery, queryParams);

            return {
                success: false,
                error: failedAttempts >= maxAttempts 
                    ? `Account locked due to too many failed attempts. Try again in ${Math.ceil(lockoutTime / 1000 / 60)} minutes.`
                    : `Invalid username or password. ${maxAttempts - failedAttempts} attempts remaining.`
            };
        }

        // Successful login - reset failed attempts and update last login
        await executeQuery(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Create session data
        const sessionUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
            employee_number: user.employee_number,
            full_name: user.first_name && user.last_name 
                ? `${user.first_name}${user.middle_name ? ' ' + user.middle_name.charAt(0) + '.' : ''} ${user.last_name}` 
                : user.username
        };

        return {
            success: true,
            user: sessionUser
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: 'An error occurred during login. Please try again.'
        };
    }
};

// Change password function
const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        // Get current password hash
        const userResult = await findOne(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (!userResult.success || !userResult.data) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.data.password_hash);
        
        if (!isCurrentPasswordValid) {
            return {
                success: false,
                error: 'Current password is incorrect'
            };
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        const updateResult = await executeQuery(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        if (!updateResult.success) {
            return {
                success: false,
                error: 'Failed to update password'
            };
        }

        return {
            success: true,
            message: 'Password updated successfully'
        };

    } catch (error) {
        console.error('Change password error:', error);
        return {
            success: false,
            error: 'An error occurred while changing password'
        };
    }
};

// Create user account (admin only)
const createUser = async (userData) => {
    try {
        const { username, email, password, role = 'employee' } = userData;

        // Check if username or email already exists
        const existingUser = await findOne(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.success && existingUser.data) {
            return {
                success: false,
                error: 'Username or email already exists'
            };
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const createResult = await executeQuery(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, role]
        );

        if (!createResult.success) {
            return {
                success: false,
                error: 'Failed to create user account'
            };
        }

        return {
            success: true,
            user_id: createResult.data.insertId,
            message: 'User account created successfully'
        };

    } catch (error) {
        console.error('Create user error:', error);
        return {
            success: false,
            error: 'An error occurred while creating user account'
        };
    }
};

// Token-based authentication (alias for requireAuth for new routes)
const authenticateToken = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }
    next();
};

// Role-based authorization middleware
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource'
            });
        }

        if (!roles.includes(req.session.user.role)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireEmployeeAccess,
    requireAdminOrOwner,
    authenticate,
    authenticateToken,
    authorizeRoles,
    login,
    changePassword,
    createUser
};
