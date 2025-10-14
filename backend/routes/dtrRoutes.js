// routes/dtrRoutes.js - DTR (Daily Time Record) routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Controllers
const dtrController = require('../controllers/dtrController');

// Utilities
const dtrFileStorage = require('../utils/dtrFileStorage');

// Middleware
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// Configure multer for DTR file uploads using the file storage utility
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use synchronous approach for multer compatibility
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const uploadPath = path.join(__dirname, '../uploads/dtr', String(year), month);
        
        // Create directory if it doesn't exist (synchronous)
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const periodId = req.params.periodId;
        const filename = dtrFileStorage.generateFilename(periodId, file.originalname);
        cb(null, filename);
    }
});

// File filter for Excel files only using the file storage utility
const fileFilter = (req, file, cb) => {
    const validation = dtrFileStorage.validateFileType(file.originalname, file.mimetype);
    
    if (validation.isValid) {
        cb(null, true);
    } else {
        cb(new Error(validation.error), false);
    }
};

// Configure multer upload with file storage utility settings
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: dtrFileStorage.maxFileSize, // Use max file size from utility
    }
});

// Apply authentication and admin role check to all DTR routes
router.use(requireAuth);
router.use(requireAdmin);

// ===== DTR TEMPLATE ROUTES =====

// GET /api/dtr/template/:periodId - Export DTR template for a payroll period
router.get('/template/:periodId', auditLogger, dtrController.exportTemplate);

// ===== DTR IMPORT ROUTES =====

// GET /api/dtr/reimport-check/:periodId - Check if re-import is allowed
router.get('/reimport-check/:periodId', dtrController.checkReimportEligibility);

// POST /api/dtr/import/:periodId - Upload and validate DTR file
// Note: multer must be before auditLogger to process the file first
router.post('/import/:periodId', upload.single('file'), dtrController.uploadAndValidate);

// POST /api/dtr/import/:periodId/confirm - Confirm and process validated DTR import
router.post('/import/:periodId/confirm', auditLogger, dtrController.confirmImport);

// ===== DTR RECORDS MANAGEMENT ROUTES =====

// GET /api/dtr/records/:periodId - Get all DTR records for a payroll period
router.get('/records/:periodId', dtrController.getDTRRecords);

// GET /api/dtr/records/:periodId/:employeeId - Get specific employee's DTR record
router.get('/records/:periodId/:employeeId', dtrController.getEmployeeDTRRecord);

// PUT /api/dtr/records/:id - Update a DTR record (working days, notes)
router.put('/records/:id', auditLogger, dtrController.updateDTRRecord);

// DELETE /api/dtr/records/:id - Soft delete a DTR record
router.delete('/records/:id', auditLogger, dtrController.deleteDTRRecord);

// ===== DTR IMPORT HISTORY ROUTES =====

// GET /api/dtr/imports/:periodId - Get import history for a payroll period
router.get('/imports/:periodId', dtrController.getImportHistory);

// GET /api/dtr/imports/batch/:batchId - Get detailed import batch information
router.get('/imports/batch/:batchId', dtrController.getImportBatchDetails);

// ===== DTR STATISTICS ROUTES =====

// GET /api/dtr/stats/:periodId - Get DTR statistics for a payroll period
router.get('/stats/:periodId', dtrController.getDTRStats);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    console.error('DTR Route Error:', error);
    if (error instanceof multer.MulterError) {
        console.error('Multer Error Code:', error.code);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'File size exceeds the maximum limit of 10MB'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'File upload error',
            message: error.message,
            code: error.code
        });
    } else if (error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid file',
            message: error.message
        });
    }
    next();
});

module.exports = router;
