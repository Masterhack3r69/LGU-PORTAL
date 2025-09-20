// routes/benefitsRoutes.js - Comprehensive Benefits Management Routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
    // Benefit Type Management
    getBenefitTypes,
    getBenefitTypeById,
    createBenefitType,
    updateBenefitType,
    deleteBenefitType,
    getBenefitTypesStatistics,

    // Benefit Cycle Management
    getBenefitCycles,
    getBenefitCycleById,
    createBenefitCycle,
    updateBenefitCycle,
    finalizeBenefitCycle,
    releaseBenefitCycle,
    cancelBenefitCycle,
    getBenefitCyclesStatistics,

    // Employee Selection & Processing
    getEmployeesForBenefitCycle,
    processEmployeesForBenefitCycle,

    // Review & Adjustments
    getBenefitItemsForReview,
    adjustBenefitItem,
    bulkAdjustBenefitItems,

    // Finalization & Release
    approveBenefitItems,
    payBenefitItems,

    // Integration with Payroll
    getPayrollPeriodsForIntegration,
    integrateBenefitCycleWithPayroll,

    // Reporting
    generateBenefitSummaryReport,
    getEmployeeBenefitHistory,

    // Legacy methods (for backward compatibility)
    getEmployeeBenefits,
    calculateBenefits,
    getBenefitsSummary,
    processLoyaltyAward
} = require('../controllers/benefitsController');

const router = express.Router();

// =====================================================================
// BENEFIT TYPE MANAGEMENT ROUTES
// =====================================================================

// GET /api/benefits/types - Get all benefit types with filtering and pagination
router.get('/types',
    authMiddleware.requireAdmin,
    getBenefitTypes
);

// GET /api/benefits/types/statistics - Get benefit types statistics
router.get('/types/statistics',
    authMiddleware.requireAdmin,
    getBenefitTypesStatistics
);

// GET /api/benefits/types/:id - Get benefit type by ID
router.get('/types/:id',
    authMiddleware.requireAdmin,
    getBenefitTypeById
);

// POST /api/benefits/types - Create new benefit type
router.post('/types',
    authMiddleware.requireAdmin,
    createBenefitType
);

// PUT /api/benefits/types/:id - Update benefit type
router.put('/types/:id',
    authMiddleware.requireAdmin,
    updateBenefitType
);

// DELETE /api/benefits/types/:id - Delete benefit type
router.delete('/types/:id',
    authMiddleware.requireAdmin,
    deleteBenefitType
);

// =====================================================================
// BENEFIT CYCLE MANAGEMENT ROUTES
// =====================================================================

// GET /api/benefits/cycles - Get benefit cycles with filtering and pagination
router.get('/cycles',
    authMiddleware.requireAdmin,
    getBenefitCycles
);

// GET /api/benefits/cycles/statistics - Get benefit cycles statistics
router.get('/cycles/statistics',
    authMiddleware.requireAdmin,
    getBenefitCyclesStatistics
);

// GET /api/benefits/cycles/:id - Get benefit cycle by ID
router.get('/cycles/:id',
    authMiddleware.requireAdmin,
    getBenefitCycleById
);

// POST /api/benefits/cycles - Create new benefit cycle
router.post('/cycles',
    authMiddleware.requireAdmin,
    createBenefitCycle
);

// PUT /api/benefits/cycles/:id - Update benefit cycle
router.put('/cycles/:id',
    authMiddleware.requireAdmin,
    updateBenefitCycle
);

// POST /api/benefits/cycles/:id/finalize - Finalize benefit cycle
router.post('/cycles/:id/finalize',
    authMiddleware.requireAdmin,
    finalizeBenefitCycle
);

// POST /api/benefits/cycles/:id/release - Release benefit cycle
router.post('/cycles/:id/release',
    authMiddleware.requireAdmin,
    releaseBenefitCycle
);

// POST /api/benefits/cycles/:id/cancel - Cancel benefit cycle
router.post('/cycles/:id/cancel',
    authMiddleware.requireAdmin,
    cancelBenefitCycle
);

// =====================================================================
// EMPLOYEE SELECTION & PROCESSING ROUTES
// =====================================================================

// GET /api/benefits/cycles/:cycleId/employees - Get employees for benefit cycle
router.get('/cycles/:cycleId/employees',
    authMiddleware.requireAdmin,
    getEmployeesForBenefitCycle
);

// POST /api/benefits/cycles/:cycleId/process-employees - Process selected employees for benefit cycle
router.post('/cycles/:cycleId/process-employees',
    authMiddleware.requireAdmin,
    processEmployeesForBenefitCycle
);

// =====================================================================
// REVIEW & ADJUSTMENTS ROUTES
// =====================================================================

// GET /api/benefits/cycles/:cycleId/items - Get benefit items for review
router.get('/cycles/:cycleId/items',
    authMiddleware.requireAdmin,
    getBenefitItemsForReview
);

// PUT /api/benefits/items/:itemId/adjust - Adjust benefit item amount
router.put('/items/:itemId/adjust',
    authMiddleware.requireAdmin,
    adjustBenefitItem
);

// POST /api/benefits/items/bulk-adjust - Bulk adjust benefit items
router.post('/items/bulk-adjust',
    authMiddleware.requireAdmin,
    bulkAdjustBenefitItems
);

// =====================================================================
// FINALIZATION & RELEASE ROUTES
// =====================================================================

// POST /api/benefits/cycles/:cycleId/approve-items - Approve benefit items
router.post('/cycles/:cycleId/approve-items',
    authMiddleware.requireAdmin,
    approveBenefitItems
);

// POST /api/benefits/cycles/:cycleId/pay-items - Mark benefit items as paid
router.post('/cycles/:cycleId/pay-items',
    authMiddleware.requireAdmin,
    payBenefitItems
);

// =====================================================================
// INTEGRATION WITH PAYROLL ROUTES
// =====================================================================

// GET /api/benefits/payroll-periods - Get available payroll periods for integration
router.get('/payroll-periods',
    authMiddleware.requireAdmin,
    getPayrollPeriodsForIntegration
);

// POST /api/benefits/cycles/:cycleId/integrate-payroll - Integrate benefit cycle with payroll
router.post('/cycles/:cycleId/integrate-payroll',
    authMiddleware.requireAdmin,
    integrateBenefitCycleWithPayroll
);

// =====================================================================
// REPORTING ROUTES
// =====================================================================

// GET /api/benefits/reports/summary - Generate comprehensive benefit summary report
router.get('/reports/summary',
    authMiddleware.requireAdmin,
    generateBenefitSummaryReport
);

// GET /api/benefits/reports/employee/:employeeId - Get employee benefit history
router.get('/reports/employee/:employeeId',
    authMiddleware.authenticate,
    authMiddleware.requireAdminOrOwner,
    getEmployeeBenefitHistory
);

// =====================================================================
// LEGACY ROUTES (for backward compatibility)
// =====================================================================

// GET /api/benefits/employee/:id - Get employee benefits (legacy)
router.get('/employee/:id',
    authMiddleware.authenticate,
    authMiddleware.requireAdminOrOwner,
    getEmployeeBenefits
);

// POST /api/benefits/calculate - Calculate benefits for employee (legacy)
router.post('/calculate',
    authMiddleware.requireAdmin,
    calculateBenefits
);

// GET /api/benefits/summary/:year - Get benefits summary report (legacy)
router.get('/summary/:year',
    authMiddleware.requireAdmin,
    getBenefitsSummary
);

// POST /api/benefits/loyalty-award - Process loyalty award (legacy)
router.post('/loyalty-award',
    authMiddleware.requireAdmin,
    processLoyaltyAward
);

module.exports = router;