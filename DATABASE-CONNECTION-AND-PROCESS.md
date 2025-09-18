# Database Connection and Process Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Configuration](#database-configuration)
3. [Connection Process](#connection-process)
4. [Database Schema](#database-schema)
5. [Connection Pool Management](#connection-pool-management)
6. [Query Execution Process](#query-execution-process)
7. [Transaction Handling](#transaction-handling)
8. [Error Handling](#error-handling)
9. [Security Measures](#security-measures)
10. [Performance Optimization](#performance-optimization)

## Overview

The Employee Management System (EMS) uses MySQL 8.0 as its primary database with a connection pool managed by the mysql2/promise library. The system implements robust database connection handling with retry logic, transaction support, and comprehensive error handling.

## Database Configuration

### Connection Parameters

The database connection is configured through environment variables in the [.env](file:///c%3A/Users/PC/Documents/EMS-SYSTEM/backend/.env) file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=employee_management_system
DB_USER=root
DB_PASSWORD=3Quetras
```

### Configuration File

The [config.js](file:///c%3A/Users/PC/Documents/EMS-SYSTEM/backend/config/config.js) file contains the database configuration object:

```javascript
database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'employee_management_system',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    timezone: '+00:00'
}
```

### Database Connection File

The [database.js](file:///c%3A/Users/PC/Documents/EMS-SYSTEM/backend/config/database.js) file manages the actual database connection:

```javascript
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'employee_management_system',
    charset: 'utf8mb4',
    timezone: '+00:00',
    // Enhanced connection pool configuration
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || '20'),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    } : false
};
```

## Connection Process

### 1. Initialization

The database connection process starts when the server initializes:

1. Environment variables are loaded via `dotenv`
2. Database configuration is created from environment variables
3. A connection pool is created using `mysql2/promise`
4. Connection test is performed with retry logic

### 2. Connection Test with Retry Logic

The system implements a robust connection test with retry mechanism:

```javascript
const testConnection = async (retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const connection = await pool.getConnection();
            await connection.execute('SELECT 1 as health_check');
            connection.release();
            console.log('✅ Database connected successfully');
            return true;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error.message);
            
            if (attempt === retries) {
                console.error('❌ All database connection attempts failed');
                return false;
            }
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
    return false;
};
```

### 3. Server Startup Integration

The connection test is integrated into the server startup process in [server.js](file:///c%3A/Users/PC/Documents/EMS-SYSTEM/backend/server.js):

```javascript
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        
        // Start server
        const server = app.listen(PORT, '10.0.0.73', () => {
            console.log(`
🚀 Employee Management System Server Started
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔌 Host: 10.0.0.73:${PORT}
📊 Database: Connected
🔒 Security: Enabled
📁 Upload Path: ${process.env.UPLOAD_PATH || './uploads'}
⏰ Started at: ${new Date().toISOString()}
🌍 Intranet Access: http://10.0.0.73:${PORT}
            `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};
```

## Database Schema

The system uses a normalized database schema with 20+ tables:

### Core Tables

1. **users** - User authentication and roles
2. **employees** - Employee master data with soft delete support
3. **leave_applications** - Leave requests and approvals
4. **leave_types** - Types of leave available
5. **employee_leave_balances** - Employee leave balance tracking
6. **terminal_leave_benefits** - TLB calculations and records
7. **employee_trainings** - Employee training records
8. **training_programs** - Training program definitions
9. **employee_documents** - Employee document management
10. **audit_logs** - System audit trail

### Key Relationships

- One-to-One: User ↔ Employee
- One-to-Many: Employee → Leave Applications, Employee → Compensation Records
- Many-to-Many: Employee ↔ Training Programs (via junction table)

## Connection Pool Management

### Pool Configuration

The system uses connection pooling for efficient database resource management:

```javascript
const pool = mysql.createPool(dbConfig);

// Pool configuration parameters:
waitForConnections: true,     // Queue requests when pool is full
connectionLimit: 20,          // Maximum connections in pool
queueLimit: 0,                // Unlimited queued requests
enableKeepAlive: true,        // Enable keep-alive
keepAliveInitialDelay: 10000  // 10 second keep-alive delay
```

### Pool Statistics

The system provides pool statistics for monitoring:

```javascript
const getPoolStats = () => {
    return {
        totalConnections: pool.pool?.config?.connectionLimit || 'unknown',
        activeConnections: pool.pool?._allConnections?.length || 0,
        idleConnections: pool.pool?._freeConnections?.length || 0,
        queuedRequests: pool.pool?._connectionQueue?.length || 0
    };
};
```

### Graceful Shutdown

The system properly closes database connections on shutdown:

```javascript
const gracefulShutdown = async (signal) => {
    console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(async () => {
        console.log('✅ HTTP server closed');
        
        // Close database connection pool
        await closePool();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    });
};
```

## Query Execution Process

### Standard Query Execution

The system provides utility functions for executing database queries:

```javascript
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};
```

### Single Record Retrieval

For retrieving single records:

```javascript
const findOne = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results[0] || null };
    } catch (error) {
        console.error('Database findOne error:', error.message);
        return { success: false, error: error.message };
    }
};
```

### Model Integration

Models use these utility functions for database operations:

```javascript
// In Employee.js model
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
```

## Transaction Handling

The system provides a transaction wrapper for handling database transactions:

```javascript
const executeTransaction = async (callback) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        const result = await callback(connection);
        await connection.commit();
        return { success: true, data: result };
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Transaction rollback error:', rollbackError.message);
            }
        }
        console.error('Transaction error:', error.message);
        return { success: false, error: error.message };
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
```

Usage example in a model:

```javascript
// Example of using transaction in a complex operation
async updateWithBalanceAdjustment(leaveApplication) {
    return await executeTransaction(async (connection) => {
        // Update leave application status
        await connection.execute(
            'UPDATE leave_applications SET status = ? WHERE id = ?',
            ['Approved', leaveApplication.id]
        );
        
        // Adjust employee leave balance
        await connection.execute(
            'UPDATE employee_leave_balances SET used_days = used_days + ? WHERE employee_id = ? AND leave_type_id = ?',
            [leaveApplication.days_requested, leaveApplication.employee_id, leaveApplication.leave_type_id]
        );
        
        return { message: 'Leave approved and balance updated' };
    });
}
```

## Error Handling

### Database Query Error Handling

The system implements comprehensive error handling for database operations:

```javascript
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};
```

### Model Validation

Models include validation to prevent database errors:

```javascript
validate() {
    const errors = [];

    // Required fields validation
    if (!this.first_name || this.first_name.trim().length === 0) {
        errors.push('First name is required');
    }

    if (!this.last_name || this.last_name.trim().length === 0) {
        errors.push('Last name is required');
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

    return {
        isValid: errors.length === 0,
        errors
    };
}
```

## Security Measures

### SQL Injection Prevention

The system uses parameterized queries to prevent SQL injection:

```javascript
// Safe parameterized query
const query = 'SELECT * FROM employees WHERE id = ?';
const params = [employeeId];
const result = await executeQuery(query, params);
```

### Connection Security

SSL configuration for secure connections:

```javascript
ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
} : false
```

### Data Validation

Models validate data before database operations:

```javascript
// Email validation
if (this.email_address && !/\S+@\S+\.\S+/.test(this.email_address)) {
    errors.push('Valid email address is required');
}

// Salary validation
if (this.current_monthly_salary && this.current_monthly_salary < 0) {
    errors.push('Monthly salary must be a positive number');
}
```

## Performance Optimization

### Connection Pooling

The system uses connection pooling to optimize database connections:

```javascript
connectionLimit: parseInt(process.env.DB_POOL_SIZE || '20')
```

### Query Optimization

Models use efficient queries with proper indexing:

```javascript
// Efficient query with proper indexing
static async findAll(filters = {}) {
    let query = `
        SELECT e.*, u.username, u.email as user_email, u.role
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE 1=1
    `;
    
    // Use indexes for efficient filtering
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
    
    query += ' ORDER BY e.last_name, e.first_name';
    
    // Handle pagination properly
    if (filters.limit) {
        const limitValue = parseInt(filters.limit);
        if (filters.offset >= 0) {
            const offsetValue = parseInt(filters.offset);
            query += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
        } else {
            query += ` LIMIT ${limitValue}`;
        }
    }
    
    return await executeQuery(query, params);
}
```

### Index Usage

The database schema includes proper indexes for performance:

```sql
-- Performance indexes
KEY `idx_employee_number` (`employee_number`)
KEY `idx_employment_status` (`employment_status`)
KEY `idx_appointment_date` (`appointment_date`)
KEY `idx_employees_deleted_at` (`deleted_at`)
KEY `idx_leave_applications` (`employee_id`)
KEY `idx_leave_status` (`status`)
KEY `idx_leave_dates` (`start_date`,`end_date`)
```

### Caching Considerations

While not currently implemented, the system is designed to support caching:

```javascript
// Future caching implementation placeholder
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await client.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
        } catch (error) {
            console.error('Cache error:', error);
        }
        
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
            client.setex(key, duration, JSON.stringify(data));
            originalJson.call(this, data);
        };
        
        next();
    };
};
```