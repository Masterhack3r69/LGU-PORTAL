// routes/payrollRoutes.js - Payroll management routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const {
    getPayrollPeriods,
    createPayrollPeriod,
    getPayrollPeriod,
    generatePayroll,
    getEmployeePayrollHistory,
    getPayrollLeaveSummary,
    calculateProratedSalary,
    processStepIncrements,
    finalizePayrollPeriod,
    getGovernmentContributionRates,
    payrollPeriodValidationRules,
    // Manual payroll processing
    getEmployeeManualPayrollDetails,
    calculateManualPayroll,
    processManualPayroll,
    deleteManualPayrollItem,
    getManualPayrollHistory
} = require('../controllers/payrollController');

const router = express.Router();

// All routes require admin authentication except employee payroll history
router.use(authMiddleware.authenticate);

// GET /api/payroll - Get payroll periods (Admin only)
router.get('/', 
    authMiddleware.requireAdmin,
    getPayrollPeriods
);

// POST /api/payroll/period - Create payroll period (Admin only)
router.post('/period',
    authMiddleware.requireAdmin,
    payrollPeriodValidationRules,
    createPayrollPeriod
);

// GET /api/payroll/period/:id - Get specific payroll period (Admin only)
router.get('/period/:id',
    authMiddleware.requireAdmin,
    getPayrollPeriod
);

// PUT /api/payroll/period/:id - Update payroll period (Admin only)
router.put('/period/:id',
    authMiddleware.requireAdmin,
    // TODO: Add update functionality
    (req, res) => res.json({ success: false, message: 'Update functionality coming soon' })
);

// DELETE /api/payroll/period/:id - Delete payroll period (Admin only)
router.delete('/period/:id',
    authMiddleware.requireAdmin,
    // TODO: Add delete functionality
    (req, res) => res.json({ success: false, message: 'Delete functionality coming soon' })
);

// POST /api/payroll/generate - Generate payroll for period (Admin only)
router.post('/generate',
    authMiddleware.requireAdmin,
    generatePayroll
);

// GET /api/payroll/employee/:id - Get employee payroll history
router.get('/employee/:id',
    authMiddleware.requireAdminOrOwner,
    getEmployeePayrollHistory
);

// GET /api/payroll/leave-summary/:id/:period - Get leave summary for payroll (Admin only)
router.get('/leave-summary/:id/:period',
    authMiddleware.requireAdmin,
    getPayrollLeaveSummary
);

// GET /api/payroll/report/:periodId - Generate payroll report (Admin only)
router.get('/report/:periodId',
    authMiddleware.requireAdmin,
    // TODO: Add report generation
    (req, res) => res.json({ success: false, message: 'Report generation coming soon' })
);

// POST /api/payroll/process - Process payroll (finalize) (Admin only)
router.post('/process',
    authMiddleware.requireAdmin,
    finalizePayrollPeriod
);

// POST /api/payroll/calculate-prorated - Calculate prorated salary (Admin only)
router.post('/calculate-prorated',
    authMiddleware.requireAdmin,
    calculateProratedSalary
);

// POST /api/payroll/process-step-increments - Process step increment for eligible employees (Admin only)
router.post('/process-step-increments',
    authMiddleware.requireAdmin,
    processStepIncrements
);

// GET /api/payroll/government-rates - Get current government contribution rates (Admin only)
router.get('/government-rates',
    authMiddleware.requireAdmin,
    getGovernmentContributionRates
);

// ===================================================================
// MANUAL PAYROLL PROCESSING ROUTES
// ===================================================================

// GET /api/payroll/manual/:employee_id - Get employee manual payroll details (Admin only)
router.get('/manual/:employee_id',
    authMiddleware.requireAdmin,
    getEmployeeManualPayrollDetails
);

// POST /api/payroll/manual/calculate - Calculate manual payroll for employee (Admin only)
router.post('/manual/calculate',
    authMiddleware.requireAdmin,
    calculateManualPayroll
);

// POST /api/payroll/manual/process - Process manual payroll entry (Admin only)
router.post('/manual/process',
    authMiddleware.requireAdmin,
    auditLogger.auditLogger,
    processManualPayroll
);

// DELETE /api/payroll/manual/:item_id - Delete manual payroll item (Admin only)
router.delete('/manual/:item_id',
    authMiddleware.requireAdmin,
    auditLogger.auditLogger,
    deleteManualPayrollItem
);

// GET /api/payroll/manual/history/:employee_id - Get manual payroll history for employee (Admin only)
router.get('/manual/history/:employee_id',
    authMiddleware.requireAdmin,
    getManualPayrollHistory
);

module.exports = router;
