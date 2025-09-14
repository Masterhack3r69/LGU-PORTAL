// middleware/errorHandler.js - Global error handling middleware
const fs = require('fs').promises;
const path = require('path');
const ApiResponse = require('../utils/apiResponse');

// Ensure logs directory exists
const ensureLogsDirectory = async () => {
    const logsDir = path.join(__dirname, '..', 'logs');
    try {
        await fs.access(logsDir);
    } catch {
        await fs.mkdir(logsDir, { recursive: true });
    }
    return logsDir;
};

// Log error to file
const logError = async (error, req, additionalInfo = {}) => {
    try {
        const logsDir = await ensureLogsDirectory();
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `error-${today}.log`);
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.session?.user?.id || null,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            ...additionalInfo
        };

        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
};

// Main error handler
const errorHandler = async (err, req, res, next) => {
    // Log error
    await logError(err, req);

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details = {};

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        details = { errors: err.details || err.message };
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized access';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Access forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry error';
        details = { field: err.sqlMessage };
    } else if (err.code && err.code.startsWith('ER_')) {
        // MySQL errors
        statusCode = 400;
        message = 'Database error';
        if (process.env.NODE_ENV === 'development') {
            details = { sqlError: err.sqlMessage };
        }
    } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'File or payload too large';
    }

    // Don't expose sensitive information in production
    if (process.env.NODE_ENV === 'production') {
        if (statusCode === 500) {
            message = 'An unexpected error occurred';
            details = {};
        }
    } else {
        // Include stack trace in development
        details.stack = err.stack;
    }

    // Send standardized error response
    const errorCode = err.code || (statusCode === 400 ? 'BAD_REQUEST' : 
                                   statusCode === 401 ? 'UNAUTHORIZED' :
                                   statusCode === 403 ? 'FORBIDDEN' :
                                   statusCode === 404 ? 'NOT_FOUND' :
                                   statusCode === 409 ? 'CONFLICT' :
                                   'INTERNAL_SERVER_ERROR');
    
    const response = ApiResponse.error(
        message,
        errorCode,
        {
            path: req.originalUrl,
            method: req.method,
            ...details
        },
        statusCode,
        req.id
    );
    
    res.status(statusCode).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Custom error classes
class ValidationError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

module.exports = {
    errorHandler,
    asyncHandler,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    logError
};