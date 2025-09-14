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
    payrollPeriodValidationRules
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

module.exports = router;
