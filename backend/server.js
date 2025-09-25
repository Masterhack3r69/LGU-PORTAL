// server.js - Main application entry point
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fileUpload = require('express-fileupload');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import database connection
const { testConnection, closePool } = require('./config/database');

// Import middleware
const authMiddleware = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const documentRoutes = require('./routes/documentRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const jobRoutes = require('./routes/jobRoutes');
const compensationBenefitRoutes = require('./routes/compensationBenefitRoutes');
const importRoutes = require('./routes/importRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const trainingRoutes = require('./routes/trainingRoutes');


// Import job system
const monthlyAccrualJob = require('./jobs/monthlyAccrualJob'); // Add this line

const app = express();
const PORT = process.env.PORT || 3000;

// Disable x-powered-by header
app.disable('x-powered-by');

// ================================
// SECURITY MIDDLEWARE
// ================================

// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' 
        ? 1000 // Much higher limit for development
        : (parseInt(process.env.RATE_LIMIT_MAX) || 100), // 100 for production
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// ================================
// GENERAL MIDDLEWARE
// ================================

// Request ID middleware for tracking
app.use((req, res, next) => {
    req.id = uuidv4();
    res.set('X-Request-ID', req.id);
    next();
});

// Compression middleware
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    threshold: 1024
}));

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.CORS_ORIGINS 
            ? process.env.CORS_ORIGINS.split(',')
            : [
                'http://localhost:5173',
                'http://127.0.0.1:5173', 
                'http://10.0.0.73:5173',
                'http://10.0.0.73:3000',
                'http://localhost:3000',
                'https://localhost:5173',
                'https://127.0.0.1:5173', 
                'https://10.0.0.73:5173',
                'https://10.0.0.73:3000',
                'https://localhost:3000'
            ];
        
        // Allow any localhost/127.0.0.1 origin in development
        if (process.env.NODE_ENV !== 'production') {
            if (origin.startsWith('http://localhost:') || 
                origin.startsWith('http://127.0.0.1:') ||
                origin.startsWith('http://10.0.0.73:') ||
                origin.startsWith('https://localhost:') || 
                origin.startsWith('https://127.0.0.1:') ||
                origin.startsWith('https://10.0.0.73:')) {
                return callback(null, true);
            }
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'Origin',
        'X-Request-ID',
        'Cache-Control'
    ],
    exposedHeaders: ['X-Request-ID'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
    limits: { 
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
    },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: './uploads/temp/',
    safeFileNames: true,
    preserveExtension: true
}));

// Session configuration
app.use(session({
    name: process.env.SESSION_NAME || 'ems_session',
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to false for HTTP intranet applications
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        sameSite: 'lax' // Changed from 'strict' to 'lax' for better compatibility
    },
    rolling: true // Reset expiration on activity
}));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Explicit preflight handler for troubleshooting
app.options('*', (req, res) => {
    console.log(`🚀 CORS preflight: ${req.method} ${req.path} from ${req.get('Origin')}`);
    res.status(200).end();
});

// Request debugging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`🔍 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'} - User-Agent: ${req.get('User-Agent')?.substring(0, 50)}...`);
        next();
    });
}

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', authMiddleware.requireAuth, express.static(path.join(__dirname, 'uploads')));

// ================================
// ROUTES
// ================================

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    const { getPoolStats } = require('./config/database');
    
    try {
        const poolStats = getPoolStats();
        const memoryUsage = process.memoryUsage();
        
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            database: {
                status: 'connected',
                pool: poolStats
            },
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
            },
            requestId: req.id
        };
        
        res.set('Cache-Control', 'no-cache');
        res.json(health);
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
            requestId: req.id
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware.requireAuth, auditLogger, dashboardRoutes);
app.use('/api/employees', authMiddleware.requireAuth, auditLogger, employeeRoutes);
app.use('/api/leaves', authMiddleware.requireAuth, auditLogger, leaveRoutes);
app.use('/api/payroll', authMiddleware.requireAuth, require('./routes/payrollRoutes'));
app.use('/api/documents', authMiddleware.requireAuth, auditLogger, documentRoutes);
app.use('/api/reports', authMiddleware.requireAuth, auditLogger, reportsRoutes);
app.use('/api/jobs', authMiddleware.requireAuth, auditLogger, jobRoutes);
app.use('/api/compensation-benefits', authMiddleware.requireAuth, auditLogger, compensationBenefitRoutes);
app.use('/api/import', authMiddleware.requireAuth, auditLogger, importRoutes);

app.use('/api', authMiddleware.requireAuth, auditLogger, trainingRoutes);

// Serve frontend application (if using server-side rendering or static files)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// ================================
// ERROR HANDLING
// ================================

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use(errorHandler);

// ================================
// SERVER STARTUP
// ================================

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Start scheduled jobs
        monthlyAccrualJob.startScheduledJob(); // Add this line

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

        // Enhanced graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('✅ HTTP server closed');
                
                // Close database connection pool
                await closePool();
                
                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            });

            // Force exit after 30 seconds
            setTimeout(() => {
                console.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
