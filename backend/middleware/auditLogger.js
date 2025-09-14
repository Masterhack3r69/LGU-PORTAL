// middleware/auditLogger.js - Audit logging middleware
const { executeQuery } = require('../config/database');

// Actions that should be audited
const AUDITABLE_ACTIONS = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE'
};

// Specific leave operations that should be audited
const LEAVE_OPERATIONS = [
    'approve',
    'reject',
    'cancel',
    'admin-create'
];

// Extract table name from route path
const extractTableName = (path) => {
    const pathSegments = path.split('/').filter(segment => segment && segment !== 'api');
    
    if (pathSegments.length > 0) {
        const resource = pathSegments[0];
        
        // Map resource names to table names
        const tableMap = {
            'employees': 'employees',
            'leaves': 'leave_applications',
            'payroll': 'payroll_items',
            'documents': 'employee_documents',
            'trainings': 'employee_trainings',
            'compensation': 'employee_compensation',
            'auth': 'users'
        };
        
        return tableMap[resource] || resource;
    }
    
    return null;
};

// Extract record ID from various sources
const extractRecordId = (req) => {
    // Try common parameter names for IDs
    const idParams = ['id', 'employeeId', 'leaveId', 'payrollId', 'documentId', 'trainingId'];
    
    for (const param of idParams) {
        if (req.params[param]) {
            return parseInt(req.params[param]);
        }
    }
    
    // Check if there's an ID in the request body (for updates)
    if (req.body && req.body.id) {
        return parseInt(req.body.id);
    }
    
    return null;
};

// Check if this is a specific leave operation
const isLeaveOperation = (path) => {
    return LEAVE_OPERATIONS.some(op => path.includes(op));
};

// Get leave operation type
const getLeaveOperationType = (path) => {
    for (const op of LEAVE_OPERATIONS) {
        if (path.includes(op)) {
            return op;
        }
    }
    return null;
};

// Main audit logging middleware
const auditLogger = async (req, res, next) => {
    const action = AUDITABLE_ACTIONS[req.method];
    
    // Skip if action is not auditable and not a specific leave operation
    if (!action && !isLeaveOperation(req.path)) {
        return next();
    }

    // Skip if user is not authenticated
    if (!req.session?.user) {
        return next();
    }

    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseBody = null;
    let oldValues = null;

    // Capture old values for UPDATE and DELETE operations
    if ((action === 'UPDATE' || action === 'DELETE') && req.params.id) {
        try {
            const tableName = extractTableName(req.path);
            if (tableName) {
                const recordId = extractRecordId(req);
                if (recordId) {
                    const oldRecord = await executeQuery(
                        `SELECT * FROM ${tableName} WHERE id = ?`,
                        [recordId]
                    );
                    
                    if (oldRecord.success && oldRecord.data.length > 0) {
                        oldValues = oldRecord.data[0];
                    }
                }
            }
        } catch (error) {
            console.error('Failed to capture old values for audit:', error);
        }
    }

    // Override response methods to capture response data
    res.send = function(body) {
        responseBody = body;
        originalSend.call(this, body);
    };

    res.json = function(body) {
        responseBody = body;
        originalJson.call(this, body);
    };

    // Handle response completion
    res.on('finish', async () => {
        try {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Check if this is a specific leave operation
                if (isLeaveOperation(req.path)) {
                    const operationType = getLeaveOperationType(req.path);
                    await logAuditEntry({
                        userId: req.session.user.id,
                        action: `LEAVE_${operationType.toUpperCase()}`,
                        tableName: 'leave_applications',
                        recordId: extractRecordId(req),
                        oldValues: oldValues,
                        newValues: req.body,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent'),
                        requestPath: req.path,
                        requestMethod: req.method
                    });
                } else if (action) {
                    // Regular CRUD operation
                    await logAuditEntry({
                        userId: req.session.user.id,
                        action: action,
                        tableName: extractTableName(req.path),
                        recordId: extractRecordId(req),
                        oldValues: oldValues,
                        newValues: getNewValues(req, responseBody, action),
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent'),
                        requestPath: req.path,
                        requestMethod: req.method
                    });
                }
            }
        } catch (error) {
            console.error('Audit logging failed:', error);
        }
    });

    next();
};

// Extract new values based on action type
const getNewValues = (req, responseBody, action) => {
    try {
        if (action === 'CREATE') {
            // For CREATE operations, use the request body
            return req.body || null;
        } else if (action === 'UPDATE') {
            // For UPDATE operations, use the request body
            return req.body || null;
        } else if (action === 'DELETE') {
            // For DELETE operations, no new values
            return null;
        }
        
        return null;
    } catch (error) {
        console.error('Failed to extract new values:', error);
        return null;
    }
};

// Log audit entry to database
const logAuditEntry = async (auditData) => {
    try {
        const {
            userId,
            action,
            tableName,
            recordId,
            oldValues,
            newValues,
            ipAddress,
            userAgent,
            requestPath,
            requestMethod
        } = auditData;

        // Prepare values for database insertion
        const sanitizedOldValues = oldValues ? JSON.stringify(sanitizeForAudit(oldValues)) : null;
        const sanitizedNewValues = newValues ? JSON.stringify(sanitizeForAudit(newValues)) : null;

        const auditQuery = `
            INSERT INTO audit_logs (
                user_id, 
                action, 
                table_name, 
                record_id, 
                old_values, 
                new_values, 
                ip_address, 
                user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const auditParams = [
            userId,
            `${action}_${requestMethod}_${requestPath}`,
            tableName,
            recordId,
            sanitizedOldValues,
            sanitizedNewValues,
            ipAddress,
            userAgent
        ];

        await executeQuery(auditQuery, auditParams);
    } catch (error) {
        console.error('Failed to log audit entry:', error);
    }
};

// Sanitize data for audit logging (remove sensitive information)
const sanitizeForAudit = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
        'password',
        'password_hash',
        'token',
        'secret',
        'key'
    ];

    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
};

// Get audit logs for a specific record or user
const getAuditLogs = async (filters = {}) => {
    try {
        let query = `
            SELECT 
                al.*,
                u.username,
                CONCAT(e.first_name, ' ', e.last_name) as user_full_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN employees e ON u.id = e.user_id
            WHERE 1=1
        `;
        
        const params = [];

        if (filters.userId) {
            query += ' AND al.user_id = ?';
            params.push(filters.userId);
        }

        if (filters.tableName) {
            query += ' AND al.table_name = ?';
            params.push(filters.tableName);
        }

        if (filters.recordId) {
            query += ' AND al.record_id = ?';
            params.push(filters.recordId);
        }

        if (filters.action) {
            query += ' AND al.action LIKE ?';
            params.push(`%${filters.action}%`);
        }

        if (filters.startDate) {
            query += ' AND al.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND al.created_at <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY al.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const result = await executeQuery(query, params);
        return result;
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    auditLogger,
    getAuditLogs
};