// middleware/payrollAudit.js - Payroll-specific audit logging middleware
const { executeQuery } = require('../config/database');

// Payroll-specific actions that should be audited
const PAYROLL_ACTIONS = {
    'create-period': 'CREATE_PAYROLL_PERIOD',
    'finalize-period': 'FINALIZE_PAYROLL_PERIOD',
    'reopen-period': 'REOPEN_PAYROLL_PERIOD',
    'mark-paid': 'MARK_PAYROLL_PAID',
    'process-employee': 'PROCESS_EMPLOYEE_PAYROLL',
    'recalculate': 'RECALCULATE_PAYROLL',
    'bulk-process': 'BULK_PROCESS_PAYROLL',
    'bulk-mark-paid': 'BULK_MARK_PAID',
    'create-override': 'CREATE_EMPLOYEE_OVERRIDE',
    'update-override': 'UPDATE_EMPLOYEE_OVERRIDE',
    'delete-override': 'DELETE_EMPLOYEE_OVERRIDE',
    'create-allowance-type': 'CREATE_ALLOWANCE_TYPE',
    'update-allowance-type': 'UPDATE_ALLOWANCE_TYPE',
    'delete-allowance-type': 'DELETE_ALLOWANCE_TYPE',
    'create-deduction-type': 'CREATE_DEDUCTION_TYPE',
    'update-deduction-type': 'UPDATE_DEDUCTION_TYPE',
    'delete-deduction-type': 'DELETE_DEDUCTION_TYPE',
    'adjust-working-days': 'ADJUST_WORKING_DAYS',
    'manual-adjustment': 'MANUAL_PAYROLL_ADJUSTMENT'
};

// Extract payroll operation from path and method
const extractPayrollOperation = (path, method) => {
    // Period operations
    if (path.includes('/finalize')) return 'finalize-period';
    if (path.includes('/reopen')) return 'reopen-period';
    if (path.includes('/mark-paid')) return 'mark-paid';
    if (path.includes('/bulk-mark-paid')) return 'bulk-mark-paid';
    if (path.includes('/bulk-process')) return 'bulk-process';
    if (path.includes('/recalculate')) return 'recalculate';
    if (path.includes('/adjust-working-days')) return 'adjust-working-days';
    if (path.includes('/manual-adjustment')) return 'manual-adjustment';
    
    // CRUD operations based on path and method
    if (path.includes('/periods') && method === 'POST') return 'create-period';
    if (path.includes('/employees') && method === 'POST') return 'process-employee';
    
    // Override operations
    if (path.includes('/overrides') && method === 'POST') return 'create-override';
    if (path.includes('/overrides') && method === 'PUT') return 'update-override';
    if (path.includes('/overrides') && method === 'DELETE') return 'delete-override';
    
    // Type operations
    if (path.includes('/allowance-types') && method === 'POST') return 'create-allowance-type';
    if (path.includes('/allowance-types') && method === 'PUT') return 'update-allowance-type';
    if (path.includes('/allowance-types') && method === 'DELETE') return 'delete-allowance-type';
    
    if (path.includes('/deduction-types') && method === 'POST') return 'create-deduction-type';
    if (path.includes('/deduction-types') && method === 'PUT') return 'update-deduction-type';
    if (path.includes('/deduction-types') && method === 'DELETE') return 'delete-deduction-type';
    
    return null;
};

// Determine table name based on operation
const getTableName = (operation, path) => {
    if (operation.includes('period')) return 'payroll_periods';
    if (operation.includes('override')) {
        if (path.includes('allowance')) return 'employee_allowance_overrides';
        if (path.includes('deduction')) return 'employee_deduction_overrides';
    }
    if (operation.includes('allowance-type')) return 'allowance_types';
    if (operation.includes('deduction-type')) return 'deduction_types';
    if (operation.includes('employee') || operation.includes('payroll')) return 'payroll_items';
    
    return 'payroll_operations';
};

// Extract relevant IDs from request
const extractPayrollIds = (req) => {
    const ids = {};
    
    // Extract from params
    if (req.params.id) ids.primary_id = parseInt(req.params.id);
    if (req.params.periodId) ids.period_id = parseInt(req.params.periodId);
    if (req.params.employeeId) ids.employee_id = parseInt(req.params.employeeId);
    if (req.params.itemId) ids.item_id = parseInt(req.params.itemId);
    if (req.params.overrideId) ids.override_id = parseInt(req.params.overrideId);
    
    // Extract from body
    if (req.body) {
        if (req.body.id) ids.primary_id = parseInt(req.body.id);
        if (req.body.payroll_period_id) ids.period_id = parseInt(req.body.payroll_period_id);
        if (req.body.employee_id) ids.employee_id = parseInt(req.body.employee_id);
        if (req.body.employees && Array.isArray(req.body.employees)) {
            ids.employee_count = req.body.employees.length;
        }
    }
    
    return ids;
};

// Get old values for comparison (for updates and deletes)
const getOldValues = async (tableName, recordId) => {
    if (!tableName || !recordId) return null;
    
    try {
        const result = await executeQuery(
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [recordId]
        );
        
        if (result.success && result.data.length > 0) {
            return result.data[0];
        }
    } catch (error) {
        console.error('Failed to get old values for payroll audit:', error);
    }
    
    return null;
};

// Enhanced payroll audit logging
const logPayrollAudit = async (auditData) => {
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
            additionalContext
        } = auditData;

        // Sanitize sensitive data
        const sanitizedOldValues = oldValues ? sanitizePayrollData(oldValues) : null;
        const sanitizedNewValues = newValues ? sanitizePayrollData(newValues) : null;

        // Create enhanced context
        const auditContext = {
            action: action,
            table: tableName,
            timestamp: new Date().toISOString(),
            user_agent: userAgent,
            ip_address: ipAddress,
            ...additionalContext
        };

        const query = `
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

        const params = [
            userId,
            action,
            tableName,
            recordId,
            sanitizedOldValues ? JSON.stringify(sanitizedOldValues) : null,
            sanitizedNewValues ? JSON.stringify(sanitizedNewValues) : null,
            ipAddress,
            userAgent
        ];

        await executeQuery(query, params);
        
        console.log(`📋 Payroll audit logged: ${action} by user ${userId}`);
        
    } catch (error) {
        console.error('Failed to log payroll audit entry:', error);
    }
};

// Sanitize payroll data for audit logging
const sanitizePayrollData = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sanitized = { ...data };
    
    // Keep important payroll fields but remove sensitive ones
    const sensitiveFields = ['bank_account', 'social_security', 'tax_id'];
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    // Round monetary values for consistency
    const monetaryFields = [
        'basic_pay', 'total_allowances', 'total_deductions', 'gross_pay', 'net_pay',
        'daily_rate', 'override_amount', 'default_amount'
    ];
    
    monetaryFields.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'number') {
            sanitized[field] = parseFloat(sanitized[field].toFixed(2));
        }
    });

    return sanitized;
};

// Main payroll audit middleware
const payrollAuditLogger = async (req, res, next) => {
    // Only process payroll-related routes
    if (!req.path.includes('/payroll')) {
        return next();
    }

    // Skip if user is not authenticated
    if (!req.session?.user) {
        return next();
    }

    const operation = extractPayrollOperation(req.path, req.method);
    
    // Skip if operation is not auditable
    if (!operation) {
        return next();
    }

    const action = PAYROLL_ACTIONS[operation];
    if (!action) {
        return next();
    }

    const tableName = getTableName(operation, req.path);
    const ids = extractPayrollIds(req);
    const recordId = ids.primary_id || ids.period_id || ids.item_id || null;

    let oldValues = null;

    // Capture old values for update/delete operations
    if ((operation.includes('update') || operation.includes('delete') || 
         operation.includes('finalize') || operation.includes('mark-paid')) && recordId) {
        oldValues = await getOldValues(tableName, recordId);
    }

    // Capture response to get new values
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody = null;

    res.send = function(body) {
        responseBody = body;
        originalSend.call(this, body);
    };

    res.json = function(body) {
        responseBody = body;
        originalJson.call(this, body);
    };

    // Log audit after response
    res.on('finish', async () => {
        try {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const additionalContext = {
                    operation: operation,
                    employee_count: ids.employee_count,
                    period_id: ids.period_id,
                    employee_id: ids.employee_id,
                    request_path: req.path,
                    request_method: req.method
                };

                await logPayrollAudit({
                    userId: req.session.user.id,
                    action: action,
                    tableName: tableName,
                    recordId: recordId,
                    oldValues: oldValues,
                    newValues: extractNewValues(req, responseBody, operation),
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    additionalContext: additionalContext
                });
            }
        } catch (error) {
            console.error('Payroll audit logging failed:', error);
        }
    });

    next();
};

// Extract new values based on operation type
const extractNewValues = (req, responseBody, operation) => {
    try {
        // For create operations, use request body
        if (operation.includes('create') || operation.includes('process')) {
            return req.body || null;
        }
        
        // For update operations, use request body
        if (operation.includes('update') || operation.includes('adjust')) {
            return req.body || null;
        }
        
        // For state change operations, capture the state change
        if (operation.includes('finalize') || operation.includes('mark-paid') || operation.includes('reopen')) {
            return {
                status_change: operation,
                timestamp: new Date().toISOString()
            };
        }
        
        // For bulk operations, capture summary
        if (operation.includes('bulk')) {
            let summary = { operation: operation };
            if (req.body && req.body.employees) {
                summary.employee_count = req.body.employees.length;
            }
            if (req.body && req.body.items) {
                summary.item_count = req.body.items.length;
            }
            return summary;
        }
        
        return null;
    } catch (error) {
        console.error('Failed to extract new values for payroll audit:', error);
        return null;
    }
};

// Get payroll audit logs with enhanced filtering
const getPayrollAuditLogs = async (filters = {}) => {
    try {
        let query = `
            SELECT 
                al.id,
                al.user_id,
                al.action,
                al.table_name,
                al.record_id,
                al.old_values,
                al.new_values,
                al.ip_address,
                al.created_at,
                u.username,
                CONCAT(IFNULL(e.first_name, ''), ' ', IFNULL(e.last_name, '')) as user_full_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN employees e ON u.id = e.user_id
            WHERE al.action LIKE '%PAYROLL%' OR al.table_name LIKE '%payroll%' 
               OR al.table_name LIKE '%allowance%' OR al.table_name LIKE '%deduction%'
        `;
        
        const params = [];

        // Apply filters
        if (filters.userId) {
            query += ' AND al.user_id = ?';
            params.push(parseInt(filters.userId));
        }

        if (filters.action) {
            query += ' AND al.action LIKE ?';
            params.push(`%${filters.action}%`);
        }

        if (filters.tableName) {
            query += ' AND al.table_name = ?';
            params.push(filters.tableName);
        }

        if (filters.recordId) {
            query += ' AND al.record_id = ?';
            params.push(parseInt(filters.recordId));
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

        // Handle pagination
        if (filters.limit) {
            const limit = parseInt(filters.limit);
            if (limit > 0 && limit <= 1000) {
                query += ` LIMIT ${limit}`;
                if (filters.offset) {
                    const offset = parseInt(filters.offset);
                    if (offset >= 0) {
                        query += ` OFFSET ${offset}`;
                    }
                }
            }
        }

        const result = await executeQuery(query, params);
        return result;
    } catch (error) {
        console.error('Failed to get payroll audit logs:', error);
        return { success: false, error: error.message };
    }
};

// Quick audit helper functions for direct use in models
const auditPayrollPeriodCreate = async (userId, periodData) => {
    await logPayrollAudit({
        userId,
        action: 'CREATE_PAYROLL_PERIOD',
        tableName: 'payroll_periods',
        recordId: periodData.id,
        newValues: periodData,
        ipAddress: 'system',
        userAgent: 'system'
    });
};

const auditPayrollItemProcess = async (userId, itemData) => {
    await logPayrollAudit({
        userId,
        action: 'PROCESS_EMPLOYEE_PAYROLL',
        tableName: 'payroll_items',
        recordId: itemData.id,
        newValues: itemData,
        ipAddress: 'system',
        userAgent: 'system'
    });
};

const auditPayrollCalculation = async (userId, itemData, calculationDetails) => {
    await logPayrollAudit({
        userId,
        action: 'RECALCULATE_PAYROLL',
        tableName: 'payroll_items',
        recordId: itemData.id,
        newValues: { ...itemData, calculation_details: calculationDetails },
        ipAddress: 'system',
        userAgent: 'system'
    });
};

module.exports = {
    payrollAuditLogger,
    getPayrollAuditLogs,
    logPayrollAudit,
    auditPayrollPeriodCreate,
    auditPayrollItemProcess,
    auditPayrollCalculation,
    PAYROLL_ACTIONS
};