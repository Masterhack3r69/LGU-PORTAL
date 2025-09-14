// config/config.js - Application configuration
require('dotenv').config();

const config = {
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT) || 3000,
        env: process.env.NODE_ENV || 'development',
        name: process.env.APP_NAME || 'Employee Management System',
        version: process.env.APP_VERSION || '1.0.0'
    },

    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        name: process.env.DB_NAME || 'employee_management_system',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        charset: 'utf8mb4',
        timezone: '+00:00'
    },

    // Authentication Configuration
    auth: {
        sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
        sessionName: process.env.SESSION_NAME || 'ems_session',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
        sessionTimeout: 8 * 60 * 60 * 1000 // 8 hours
    },

    // File Upload Configuration
    upload: {
        path: process.env.UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        allowedTypes: {
            documents: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
            images: ['jpg', 'jpeg', 'png', 'gif'],
            all: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt']
        }
    },

    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
        authWindowMs: 15 * 60 * 1000, // 15 minutes for auth endpoints
        authMax: 5 // auth attempts per window
    },

    // Company Information
    company: {
        name: process.env.COMPANY_NAME || 'Your Company Name',
        address: process.env.COMPANY_ADDRESS || '',
        contact: process.env.COMPANY_CONTACT || '',
        email: process.env.COMPANY_EMAIL || ''
    },

    // Leave Management Configuration
    leave: {
        annualVLCredit: 15,
        annualSLCredit: 15,
        monthlyVLAccrual: 1.25,
        monthlySLAccrual: 1.25,
        maxMonetizableWithoutClearance: 29,
        tlbConstantFactor: 1.0
    },

    // Compensation Configuration
    compensation: {
        loyaltyAward10Years: 10000, // First 10 years
        loyaltyAward5Years: 5000,   // Every 5 years after
        pbbEligibilityMonths: 4,    // Minimum months for PBB eligibility
        stepIncrementYears: 3       // Years between step increments
    },

    // Email Configuration (if implementing email notifications)
    email: {
        smtp: {
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        },
        from: process.env.EMAIL_FROM || 'noreply@company.com',
        enabled: process.env.EMAIL_ENABLED === 'true'
    },

    // Security Configuration
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
                }
            }
        },
        cors: {
            origin: process.env.NODE_ENV === 'production' 
                ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : false)
                : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/app.log',
        errorFile: process.env.ERROR_LOG_FILE || './logs/error.log',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        maxSize: process.env.LOG_MAX_SIZE || '10m'
    },

    // Backup Configuration
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
        retention: parseInt(process.env.BACKUP_RETENTION) || 30, // days
        path: process.env.BACKUP_PATH || './backups'
    },

    // Feature Flags
    features: {
        enableEmailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true',
        enableFileUpload: process.env.FEATURE_FILE_UPLOAD !== 'false',
        enableAuditLogs: process.env.FEATURE_AUDIT_LOGS !== 'false',
        enableReports: process.env.FEATURE_REPORTS !== 'false',
        enablePayroll: process.env.FEATURE_PAYROLL === 'true'
    }
};

// Validate required configuration
const validateConfig = () => {
    const required = [
        'DB_HOST',
        'DB_USER', 
        'DB_NAME',
        'SESSION_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        console.error('Please check your .env file or environment configuration');
        return false;
    }

    // Validate session secret strength
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        console.warn('⚠️  SESSION_SECRET should be at least 32 characters long for security');
    }

    // Validate database connection parameters
    if (config.database.port < 1 || config.database.port > 65535) {
        console.error('❌ Invalid database port number');
        return false;
    }

    return true;
};

// Get configuration for specific environment
const getConfig = (env = process.env.NODE_ENV) => {
    const envConfig = { ...config };

    switch (env) {
        case 'production':
            envConfig.logging.level = 'warn';
            envConfig.server.env = 'production';
            break;
        case 'test':
            envConfig.database.name = `${config.database.name}_test`;
            envConfig.logging.level = 'error';
            break;
        case 'development':
        default:
            envConfig.logging.level = 'debug';
            break;
    }

    return envConfig;
};

module.exports = {
    ...config,
    validateConfig,
    getConfig
};