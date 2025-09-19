// config/database.js - Database configuration and connection
const mysql = require('mysql2/promise');
require('dotenv').config();

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
    // Removed deprecated options: acquireTimeout and timeout
    // SSL configuration for production
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    } : false
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Enhanced database connection test with retry logic
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

// Execute query with error handling
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};

// Get single record
const findOne = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return { success: true, data: results[0] || null };
    } catch (error) {
        console.error('Database findOne error:', error.message);
        return { success: false, error: error.message };
    }
};

// Find one record by table name and conditions (helper function)
const findOneByTable = async (tableName, conditions = {}) => {
    try {
        const keys = Object.keys(conditions);
        if (keys.length === 0) {
            throw new Error('At least one condition is required');
        }
        
        const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
        const query = `SELECT * FROM ${tableName} WHERE ${whereClause}`;
        const params = keys.map(key => conditions[key]);
        
        const [results] = await pool.execute(query, params);
        return { success: true, data: results[0] || null };
    } catch (error) {
        console.error('Database findOneByTable error:', error.message);
        return { success: false, error: error.message };
    }
};

// Enhanced transaction wrapper with proper error handling
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

// Get pool statistics
const getPoolStats = () => {
    try {
        return {
            totalConnections: pool.pool?.config?.connectionLimit || 'unknown',
            activeConnections: pool.pool?._allConnections?.length || 0,
            idleConnections: pool.pool?._freeConnections?.length || 0,
            queuedRequests: pool.pool?._connectionQueue?.length || 0
        };
    } catch (error) {
        return {
            error: 'Unable to retrieve pool stats',
            totalConnections: 'unknown',
            activeConnections: 'unknown',
            idleConnections: 'unknown',
            queuedRequests: 'unknown'
        };
    }
};

// Close pool connection
const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Database connection pool closed');
    } catch (error) {
        console.error('❌ Error closing database pool:', error.message);
    }
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
    findOne,
    findOneByTable,
    executeTransaction,
    getPoolStats,
    closePool
};