// utils/apiResponse.js - Standardized API response helpers

class ApiResponse {
    /**
     * Success response
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @param {object} pagination - Pagination information
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized success response
     */
    static success(data, message = 'Success', pagination = null, requestId = null) {
        const response = {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        };

        if (pagination) {
            response.pagination = pagination;
        }

        if (requestId) {
            response.requestId = requestId;
        }

        return response;
    }

    /**
     * Error response
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {*} details - Error details
     * @param {number} statusCode - HTTP status code
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized error response
     */
    static error(message, code = null, details = null, statusCode = 500, requestId = null) {
        const response = {
            success: false,
            error: {
                message,
                ...(code && { code }),
                ...(details && { details })
            },
            statusCode,
            timestamp: new Date().toISOString()
        };

        if (requestId) {
            response.requestId = requestId;
        }

        return response;
    }

    /**
     * Validation error response
     * @param {string} message - Error message
     * @param {array} validationErrors - Validation error details
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized validation error response
     */
    static validationError(message = 'Validation failed', validationErrors = [], requestId = null) {
        return this.error(message, 'VALIDATION_ERROR', validationErrors, 400, requestId);
    }

    /**
     * Not found error response
     * @param {string} resource - Resource that was not found
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized not found response
     */
    static notFound(resource = 'Resource', requestId = null) {
        return this.error(`${resource} not found`, 'NOT_FOUND', null, 404, requestId);
    }

    /**
     * Unauthorized error response
     * @param {string} message - Error message
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized unauthorized response
     */
    static unauthorized(message = 'Authentication required', requestId = null) {
        return this.error(message, 'UNAUTHORIZED', null, 401, requestId);
    }

    /**
     * Forbidden error response
     * @param {string} message - Error message
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized forbidden response
     */
    static forbidden(message = 'Access forbidden', requestId = null) {
        return this.error(message, 'FORBIDDEN', null, 403, requestId);
    }

    /**
     * Conflict error response
     * @param {string} message - Error message
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized conflict response
     */
    static conflict(message = 'Resource conflict', requestId = null) {
        return this.error(message, 'CONFLICT', null, 409, requestId);
    }

    /**
     * Rate limit error response
     * @param {string} message - Error message
     * @param {number} retryAfter - Retry after seconds
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized rate limit response
     */
    static rateLimitExceeded(message = 'Rate limit exceeded', retryAfter = 900, requestId = null) {
        return this.error(message, 'RATE_LIMIT_EXCEEDED', { retryAfter }, 429, requestId);
    }

    /**
     * Server error response
     * @param {string} message - Error message
     * @param {string} requestId - Request ID for tracking
     * @returns {object} Standardized server error response
     */
    static serverError(message = 'Internal server error', requestId = null) {
        return this.error(message, 'INTERNAL_SERVER_ERROR', null, 500, requestId);
    }
}

// Helper functions for backward compatibility
const successResponse = (res, data, message = 'Success', status = 200) => {
    const response = ApiResponse.success(data, message);
    return res.status(status).json(response);
};

const errorResponse = (res, message, status = 500, details = null) => {
    const response = ApiResponse.error(message, null, details, status);
    return res.status(status).json(response);
};

module.exports = ApiResponse;
module.exports.successResponse = successResponse;
module.exports.errorResponse = errorResponse;