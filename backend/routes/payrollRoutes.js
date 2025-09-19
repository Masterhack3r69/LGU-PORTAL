// routes/payrollRoutes.js - Comprehensive payroll system routes
const express = require('express');
const router = express.Router();

// Controllers
const payrollController = require('../controllers/payrollController');
const payrollItemController = require('../controllers/payrollItemController');
const payrollConfigController = require('../controllers/payrollConfigController');

// Middleware
const { auditLogger } = require('../middleware/auditLogger');
const { payrollAuditLogger } = require('../middleware/payrollAudit');
const {
    requireAdmin,
    requirePayrollAccess,
    validatePeriodAccess,
    validateItemAccess,
    checkPeriodModifiable,
    requirePayrollConfig,
    validateBulkOperation,
    logSensitiveOperation,
    rateLimitPayroll,
    validateBusinessHours
} = require('../middleware/payrollAuthMiddleware');

// Apply common middleware to all payroll routes
router.use(payrollAuditLogger);
router.use(validateBusinessHours);

// ===== PAYROLL PERIODS ROUTES =====

// GET /api/payroll/periods - Get all payroll periods
router.get('/periods', requireAdmin, rateLimitPayroll, payrollController.getAllPeriods);

// GET /api/payroll/periods/current - Get current active period
router.get('/periods/current', requireAdmin, rateLimitPayroll, payrollController.getCurrentPeriod);

// GET /api/payroll/periods/statistics - Get payroll statistics
router.get('/periods/statistics', requireAdmin, rateLimitPayroll, payrollController.getPayrollStatistics);

// GET /api/payroll/periods/:id - Get specific payroll period
router.get('/periods/:id', requireAdmin, validatePeriodAccess, payrollController.getPeriod);

// POST /api/payroll/periods - Create new payroll period
router.post('/periods', requireAdmin, auditLogger, payrollController.createPeriod);

// PUT /api/payroll/periods/:id - Update payroll period
router.put('/periods/:id', requireAdmin, validatePeriodAccess, checkPeriodModifiable, auditLogger, payrollController.updatePeriod);

// DELETE /api/payroll/periods/:id - Delete payroll period
router.delete('/periods/:id', requireAdmin, validatePeriodAccess, auditLogger, payrollController.deletePeriod);

// POST /api/payroll/periods/:id/finalize - Finalize payroll period
router.post('/periods/:id/finalize', requireAdmin, validatePeriodAccess, checkPeriodModifiable, logSensitiveOperation, auditLogger, payrollController.finalizePeriod);

// POST /api/payroll/periods/:id/reopen - Reopen payroll period
router.post('/periods/:id/reopen', requireAdmin, validatePeriodAccess, checkPeriodModifiable, logSensitiveOperation, auditLogger, payrollController.reopenPeriod);

// POST /api/payroll/periods/:id/mark-paid - Mark period as paid
router.post('/periods/:id/mark-paid', requireAdmin, validatePeriodAccess, logSensitiveOperation, auditLogger, payrollController.markPeriodAsPaid);

// ===== PAYROLL PERIOD EMPLOYEE MANAGEMENT =====

// GET /api/payroll/periods/:id/employees - Get employees for period processing
router.get('/periods/:id/employees', requireAdmin, validatePeriodAccess, payrollController.getPeriodEmployees);

// POST /api/payroll/periods/:id/employees - Process employees for payroll period
router.post('/periods/:id/employees', requireAdmin, validatePeriodAccess, validateBulkOperation, auditLogger, payrollController.processEmployees);

// GET /api/payroll/periods/:id/items - Get payroll items for period
router.get('/periods/:id/items', requireAdmin, validatePeriodAccess, payrollController.getPeriodPayrollItems);

// GET /api/payroll/periods/:id/summary - Get payroll summary for period
router.get('/periods/:id/summary', requireAdmin, validatePeriodAccess, payrollController.getPeriodSummary);

// POST /api/payroll/periods/:id/bulk-mark-paid - Bulk mark payroll items as paid
router.post('/periods/:id/bulk-mark-paid', requireAdmin, validatePeriodAccess, validateBulkOperation, logSensitiveOperation, auditLogger, payrollController.bulkMarkAsPaid);

// ===== PAYROLL ITEMS ROUTES =====

// GET /api/payroll/items - Get payroll items (with filters)
router.get('/items', requirePayrollAccess, payrollItemController.getAllPayrollItems);

// GET /api/payroll/items/:id - Get specific payroll item
router.get('/items/:id', requirePayrollAccess, validateItemAccess, payrollItemController.getPayrollItem);

// PUT /api/payroll/items/:id - Update payroll item
router.put('/items/:id', requireAdmin, validateItemAccess, auditLogger, payrollItemController.updatePayrollItem);

// DELETE /api/payroll/items/:id - Delete payroll item
router.delete('/items/:id', requireAdmin, validateItemAccess, auditLogger, payrollItemController.deletePayrollItem);

// POST /api/payroll/items/:id/recalculate - Recalculate payroll item
router.post('/items/:id/recalculate', requireAdmin, validateItemAccess, auditLogger, payrollItemController.recalculatePayrollItem);

// POST /api/payroll/items/:id/finalize - Finalize payroll item
router.post('/items/:id/finalize', requireAdmin, validateItemAccess, logSensitiveOperation, auditLogger, payrollItemController.finalizePayrollItem);

// POST /api/payroll/items/:id/mark-paid - Mark payroll item as paid
router.post('/items/:id/mark-paid', requireAdmin, validateItemAccess, logSensitiveOperation, auditLogger, payrollItemController.markPayrollItemAsPaid);

// POST /api/payroll/items/:id/adjust-working-days - Adjust working days for payroll item
router.post('/items/:id/adjust-working-days', requireAdmin, validateItemAccess, logSensitiveOperation, auditLogger, payrollItemController.adjustWorkingDays);

// POST /api/payroll/items/:id/manual-adjustment - Add manual adjustment to payroll item
router.post('/items/:id/manual-adjustment', requireAdmin, validateItemAccess, logSensitiveOperation, auditLogger, payrollItemController.addManualAdjustment);

// GET /api/payroll/items/:id/calculation-details - Get payroll item calculation details
router.get('/items/:id/calculation-details', requirePayrollAccess, validateItemAccess, payrollItemController.getCalculationDetails);

// GET /api/payroll/items/:id/payslip - Generate payslip for payroll item
router.get('/items/:id/payslip', requirePayrollAccess, validateItemAccess, payrollItemController.generatePayslip);

// ===== EMPLOYEE PAYROLL ROUTES =====

// GET /api/payroll/employees/:employeeId/items - Get payroll items for employee
router.get('/employees/:employeeId/items', payrollItemController.getEmployeePayrollItems);

// GET /api/payroll/employees/:employeeId/overrides - Get employee overrides
router.get('/employees/:employeeId/overrides', payrollConfigController.getEmployeeOverrides);

// GET /api/payroll/employees/:employeeId/override-summary - Get employee override summary
router.get('/employees/:employeeId/override-summary', payrollConfigController.getEmployeeOverrideSummary);

// GET /api/payroll/overrides - Get all overrides (for management)
router.get('/overrides', payrollConfigController.getAllOverrides);

// ===== ALLOWANCE TYPES ROUTES =====

// GET /api/payroll/allowance-types - Get all allowance types
router.get('/allowance-types', payrollConfigController.getAllowanceTypes);

// GET /api/payroll/allowance-types/:id - Get specific allowance type
router.get('/allowance-types/:id', payrollConfigController.getAllowanceType);

// POST /api/payroll/allowance-types - Create allowance type
router.post('/allowance-types', auditLogger, payrollConfigController.createAllowanceType);

// PUT /api/payroll/allowance-types/:id - Update allowance type
router.put('/allowance-types/:id', auditLogger, payrollConfigController.updateAllowanceType);

// DELETE /api/payroll/allowance-types/:id - Delete allowance type
router.delete('/allowance-types/:id', auditLogger, payrollConfigController.deleteAllowanceType);

// POST /api/payroll/allowance-types/:id/toggle - Toggle allowance type active status
router.post('/allowance-types/:id/toggle', auditLogger, payrollConfigController.toggleAllowanceType);

// ===== DEDUCTION TYPES ROUTES =====

// GET /api/payroll/deduction-types - Get all deduction types
router.get('/deduction-types', payrollConfigController.getDeductionTypes);

// GET /api/payroll/deduction-types/:id - Get specific deduction type
router.get('/deduction-types/:id', payrollConfigController.getDeductionType);

// POST /api/payroll/deduction-types - Create deduction type
router.post('/deduction-types', auditLogger, payrollConfigController.createDeductionType);

// PUT /api/payroll/deduction-types/:id - Update deduction type
router.put('/deduction-types/:id', auditLogger, payrollConfigController.updateDeductionType);

// DELETE /api/payroll/deduction-types/:id - Delete deduction type
router.delete('/deduction-types/:id', auditLogger, payrollConfigController.deleteDeductionType);

// POST /api/payroll/deduction-types/:id/toggle - Toggle deduction type active status
router.post('/deduction-types/:id/toggle', auditLogger, payrollConfigController.toggleDeductionType);

// ===== EMPLOYEE OVERRIDES ROUTES =====

// POST /api/payroll/overrides/allowances - Create allowance override
router.post('/overrides/allowances', auditLogger, payrollConfigController.createAllowanceOverride);

// POST /api/payroll/overrides/deductions - Create deduction override
router.post('/overrides/deductions', auditLogger, payrollConfigController.createDeductionOverride);

// PUT /api/payroll/overrides/allowances/:id - Update allowance override
router.put('/overrides/allowances/:id', auditLogger, payrollConfigController.updateAllowanceOverride);

// PUT /api/payroll/overrides/deductions/:id - Update deduction override
router.put('/overrides/deductions/:id', auditLogger, payrollConfigController.updateDeductionOverride);

// DELETE /api/payroll/overrides/allowances/:id - Delete allowance override
router.delete('/overrides/allowances/:id', auditLogger, payrollConfigController.deleteAllowanceOverride);

// DELETE /api/payroll/overrides/deductions/:id - Delete deduction override
router.delete('/overrides/deductions/:id', auditLogger, payrollConfigController.deleteDeductionOverride);

// POST /api/payroll/overrides/allowances/bulk - Bulk create allowance overrides
router.post('/overrides/allowances/bulk', auditLogger, payrollConfigController.bulkCreateAllowanceOverrides);

// POST /api/payroll/overrides/deductions/bulk - Bulk create deduction overrides
router.post('/overrides/deductions/bulk', auditLogger, payrollConfigController.bulkCreateDeductionOverrides);

// ===== CONFIGURATION AND STATISTICS =====

// GET /api/payroll/config/statistics - Get configuration statistics
router.get('/config/statistics', payrollConfigController.getConfigurationStatistics);

// ===== REPORTS ROUTES (Placeholder for future implementation) =====

// GET /api/payroll/reports/period/:id - Generate period report
router.get('/reports/period/:id', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Report generation not yet implemented'
    });
});

// GET /api/payroll/reports/employee/:employeeId - Generate employee payroll report
router.get('/reports/employee/:employeeId', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Employee payroll report not yet implemented'
    });
});

// GET /api/payroll/reports/summary - Generate payroll summary report
router.get('/reports/summary', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Payroll summary report not yet implemented'
    });
});

module.exports = router;