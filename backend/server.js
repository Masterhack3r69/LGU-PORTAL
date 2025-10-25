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

const { testConnection, closePool, getPoolStats } = require('./config/database');
const authMiddleware = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');

// Routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const documentRoutes = require('./routes/documentRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const jobRoutes = require('./routes/jobRoutes');
const compensationBenefitRoutes = require('./routes/compensationBenefitRoutes');
const importRoutes = require('./routes/importRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const backupRoutes = require('./routes/backupRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const examCertificateRoutes = require('./routes/examCertificateRoutes');

const monthlyAccrualJob = require('./jobs/monthlyAccrualJob');
const dtrFileCleanupJob = require('./jobs/dtrFileCleanupJob');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// Security
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
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX) || 100),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Request ID
app.use((req, res, next) => {
    req.id = uuidv4();
    res.set('X-Request-ID', req.id);
    next();
});

// Compression
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
    threshold: 1024
}));

// CORS - Handle preflight requests first
app.options('*', cors());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.CORS_ORIGINS 
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://10.0.0.1:5173'];
        
        // In development, allow all localhost and local network origins
        if (process.env.NODE_ENV !== 'production') {
            if (origin.startsWith('http://localhost:') || 
                origin.startsWith('http://127.0.0.1:') ||
                origin.startsWith('http://10.0.0.') ||
                origin.startsWith('http://192.168.')) {
                return callback(null, true);
            }
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked origin: ${origin}`);
            console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(null, true); // Allow anyway in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'Content-Length', 'Content-Type'],
    optionsSuccessStatus: 200,
    preflightContinue: false
}));

// Body parsing - skip for multipart/form-data (handled by multer)
app.use((req, res, next) => {
    // Skip body parsers for DTR import routes (multer handles them)
    if (req.path.startsWith('/api/dtr/import')) {
        return next();
    }
    // Skip for multipart/form-data
    const contentType = req.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        return next();
    }
    express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
    // Skip body parsers for DTR import routes (multer handles them)
    if (req.path.startsWith('/api/dtr/import')) {
        return next();
    }
    // Skip for multipart/form-data
    const contentType = req.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        return next();
    }
    express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// File upload - skip for DTR routes (they use multer instead)
app.use((req, res, next) => {
    // Skip express-fileupload for DTR routes (they use multer)
    if (req.path.startsWith('/api/dtr/import')) {
        return next();
    }
    fileUpload({
        limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
        abortOnLimit: true,
        createParentPath: true,
        useTempFiles: true,
        tempFileDir: './uploads/temp/',
        safeFileNames: true,
        preserveExtension: true
    })(req, res, next);
});

// Session
app.use(session({
    name: process.env.SESSION_NAME || 'ems_session',
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: 'lax'
    },
    rolling: true
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', authMiddleware.requireAuth, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', async (req, res) => {
    try {
        const poolStats = getPoolStats();
        const memoryUsage = process.memoryUsage();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            database: { status: 'connected', pool: poolStats },
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware.requireAuth, auditLogger, dashboardRoutes);
app.use('/api/employees', authMiddleware.requireAuth, auditLogger, employeeRoutes);
app.use('/api/leaves', authMiddleware.requireAuth, auditLogger, leaveRoutes);
app.use('/api/payroll', authMiddleware.requireAuth, require('./routes/payrollRoutes'));
app.use('/api/dtr', authMiddleware.requireAuth, require('./routes/dtrRoutes'));
app.use('/api/documents', authMiddleware.requireAuth, auditLogger, documentRoutes);
app.use('/api/reports', authMiddleware.requireAuth, auditLogger, reportsRoutes);
app.use('/api/jobs', authMiddleware.requireAuth, auditLogger, jobRoutes);
app.use('/api/compensation-benefits', authMiddleware.requireAuth, auditLogger, compensationBenefitRoutes);
app.use('/api/import', authMiddleware.requireAuth, auditLogger, importRoutes);
app.use('/api/backup', authMiddleware.requireAuth, auditLogger, backupRoutes);
app.use('/api', authMiddleware.requireAuth, auditLogger, trainingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/exam-certificates', authMiddleware.requireAuth, auditLogger, examCertificateRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handler
app.use(errorHandler);

// Server startup
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }

        monthlyAccrualJob.startScheduledJob();
        dtrFileCleanupJob.startScheduledJob();

        const server = app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
            console.log(`
🚀 Server Started
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔌 Host: ${process.env.HOST || '0.0.0.0'}
🔌 Port: ${PORT}
📊 Database: Connected
⏰ ${new Date().toISOString()}
            `);
        });

        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 ${signal} - Shutting down...`);
            server.close(async () => {
                await closePool();
                console.log('✅ Shutdown complete');
                process.exit(0);
            });

            setTimeout(() => {
                console.error('❌ Forced shutdown');
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

if (require.main === module) {
    startServer();
}

module.exports = app;
