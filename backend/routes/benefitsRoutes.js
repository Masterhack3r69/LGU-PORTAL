// routes/benefitsRoutes.js - Compensation and Benefits routes
const express = require('express');
const router = express.Router();

// Controllers
const benefitsController = require('../controllers/benefitsController');

// Middleware
const { auditLogger } = require('../middleware/auditLogger');
const {
    requireAdmin,
    requireAuth,
    requireEmployeeAccess
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(requireAuth);

// Apply audit logging to all routes
router.use(auditLogger);

// ===== BENEFIT TYPES ROUTES =====

// GET /api/benefits/types - Get all benefit types
router.get('/types', benefitsController.getAllBenefitTypes);

// GET /api/benefits/types/:id - Get specific benefit type
router.get('/types/:id', benefitsController.getBenefitType);

// POST /api/benefits/types - Create benefit type (Admin only)
router.post('/types', requireAdmin, benefitsController.createBenefitType);

// PUT /api/benefits/types/:id - Update benefit type (Admin only)
router.put('/types/:id', requireAdmin, benefitsController.updateBenefitType);

// POST /api/benefits/types/:id/toggle - Toggle benefit type active status (Admin only)
router.post('/types/:id/toggle', requireAdmin, benefitsController.toggleBenefitType);

// DELETE /api/benefits/types/:id - Delete benefit type (Admin only)
router.delete('/types/:id', requireAdmin, benefitsController.deleteBenefitType);

// ===== BENEFIT CYCLES ROUTES =====

// GET /api/benefits/cycles - Get all benefit cycles
router.get('/cycles', benefitsController.getAllBenefitCycles);

// GET /api/benefits/cycles/:id - Get specific benefit cycle
router.get('/cycles/:id', benefitsController.getBenefitCycle);

// POST /api/benefits/cycles - Create benefit cycle (Admin only)
router.post('/cycles', requireAdmin, benefitsController.createBenefitCycle);

// PUT /api/benefits/cycles/:id - Update benefit cycle (Admin only)
router.put('/cycles/:id', requireAdmin, benefitsController.updateBenefitCycle);

// POST /api/benefits/cycles/:id/process - Process benefit cycle (Admin only)
router.post('/cycles/:id/process', requireAdmin, benefitsController.processBenefitCycle);

// POST /api/benefits/cycles/:id/finalize - Finalize benefit cycle (Admin only)
router.post('/cycles/:id/finalize', requireAdmin, benefitsController.finalizeBenefitCycle);

// POST /api/benefits/cycles/:id/release - Release benefit cycle (Admin only)
router.post('/cycles/:id/release', requireAdmin, benefitsController.releaseBenefitCycle);

// POST /api/benefits/cycles/:id/cancel - Cancel benefit cycle (Admin only)
router.post('/cycles/:id/cancel', requireAdmin, benefitsController.cancelBenefitCycle);

// DELETE /api/benefits/cycles/:id - Delete benefit cycle (Admin only)
router.delete('/cycles/:id', requireAdmin, benefitsController.deleteBenefitCycle);

// ===== BENEFIT CYCLE PROCESSING ROUTES =====

// GET /api/benefits/cycles/:cycleId/items - Get benefit items for cycle
router.get('/cycles/:cycleId/items', benefitsController.getCycleBenefitItems);

// POST /api/benefits/cycles/:cycleId/calculate - Calculate benefits for cycle (Admin only)
router.post('/cycles/:cycleId/calculate', requireAdmin, benefitsController.calculateCycleBenefits);

// ===== BENEFIT ITEMS ROUTES =====

// GET /api/benefits/items - Get all benefit items
router.get('/items', benefitsController.getAllBenefitItems);

// GET /api/benefits/items/:id - Get specific benefit item
router.get('/items/:id', benefitsController.getBenefitItem);

// PUT /api/benefits/items/:id - Update benefit item (Admin only)
router.put('/items/:id', requireAdmin, benefitsController.updateBenefitItem);

// POST /api/benefits/items/:id/approve - Approve benefit item (Admin only)
router.post('/items/:id/approve', requireAdmin, benefitsController.approveBenefitItem);

// POST /api/benefits/items/:id/mark-paid - Mark benefit item as paid (Admin only)
router.post('/items/:id/mark-paid', requireAdmin, benefitsController.markBenefitItemAsPaid);

// POST /api/benefits/items/:id/adjustment - Add adjustment to benefit item (Admin only)
router.post('/items/:id/adjustment', requireAdmin, benefitsController.addBenefitItemAdjustment);

// POST /api/benefits/items/:id/generate-slip - Generate benefit slip
router.post('/items/:id/generate-slip', benefitsController.generateBenefitSlip);

// ===== BULK OPERATIONS ROUTES =====

// POST /api/benefits/items/bulk-approve - Bulk approve benefit items (Admin only)
router.post('/items/bulk-approve', requireAdmin, benefitsController.bulkApproveBenefitItems);

// POST /api/benefits/items/bulk-mark-paid - Bulk mark benefit items as paid (Admin only)
router.post('/items/bulk-mark-paid', requireAdmin, benefitsController.bulkMarkBenefitItemsAsPaid);

// POST /api/benefits/items/bulk-generate-slips - Bulk generate benefit slips (Admin only)
router.post('/items/bulk-generate-slips', requireAdmin, benefitsController.bulkGenerateBenefitSlips);

// ===== EMPLOYEE-SPECIFIC ROUTES =====

// GET /api/benefits/employees/:employeeId/items - Get employee benefit items
// Allow employee access to their own records
router.get('/employees/:employeeId/items', requireEmployeeAccess, benefitsController.getEmployeeBenefitItems);

// ===== UTILITY AND PREVIEW ROUTES =====

// GET /api/benefits/types/:benefitTypeId/eligible-employees - Get eligible employees for benefit type (Admin only)
router.get('/types/:benefitTypeId/eligible-employees', requireAdmin, benefitsController.getEligibleEmployees);

// POST /api/benefits/types/:benefitTypeId/preview - Preview benefit calculation (Admin only)
router.post('/types/:benefitTypeId/preview', requireAdmin, benefitsController.previewBenefitCalculation);

// ===== STATISTICS AND REPORTING ROUTES =====

// GET /api/benefits/statistics - Get benefit statistics
router.get('/statistics', benefitsController.getBenefitStatistics);

// ===== FUTURE IMPLEMENTATION ROUTES (Placeholders) =====

// GET /api/benefits/reports/cycle/:id - Generate cycle report
router.get('/reports/cycle/:id', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Benefit cycle report generation not yet implemented'
    });
});

// GET /api/benefits/reports/employee/:employeeId - Generate employee benefit report
router.get('/reports/employee/:employeeId', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Employee benefit report not yet implemented'
    });
});

// GET /api/benefits/reports/summary - Generate benefit summary report
router.get('/reports/summary', (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Benefit summary report not yet implemented'
    });
});



// Error handling middleware specific to benefits routes
router.use((error, req, res, next) => {
    console.error('Benefits route error:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.details || error.message
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }
    
    return res.status(500).json({
        success: false,
        error: 'Internal server error in benefits module',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

module.exports = router;