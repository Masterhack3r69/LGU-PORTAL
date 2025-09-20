// routes/compensationRoutes.js - Compensation Management Routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
    // Compensation Type Management
    getBenefitTypes,
    getBenefitTypeById,
    createBenefitType,
    updateBenefitType,
    deleteBenefitType,
    getBenefitTypesStatistics,

    // Employee Compensation Management
    getEmployeeCompensation,
    createEmployeeCompensation,
    updateEmployeeCompensation,
    deleteEmployeeCompensation,

    // Legacy methods (for backward compatibility)
    getEmployeeBenefits,
    calculateBenefits,
    getBenefitsSummary,
    processLoyaltyAward
} = require('../controllers/benefitsController');

const router = express.Router();

// =====================================================================
// COMPENSATION TYPE MANAGEMENT ROUTES
// =====================================================================

// GET /api/compensation/types - Get all compensation types with filtering and pagination
router.get('/types',
    authMiddleware.requireAdmin,
    getBenefitTypes
);

// GET /api/compensation/types/statistics - Get compensation types statistics
router.get('/types/statistics',
    authMiddleware.requireAdmin,
    getBenefitTypesStatistics
);

// GET /api/compensation/types/:id - Get compensation type by ID
router.get('/types/:id',
    authMiddleware.requireAdmin,
    getBenefitTypeById
);

// POST /api/compensation/types - Create new compensation type
router.post('/types',
    authMiddleware.requireAdmin,
    createBenefitType
);

// PUT /api/compensation/types/:id - Update compensation type
router.put('/types/:id',
    authMiddleware.requireAdmin,
    updateBenefitType
);

// DELETE /api/compensation/types/:id - Delete compensation type
router.delete('/types/:id',
    authMiddleware.requireAdmin,
    deleteBenefitType
);

// =====================================================================
// EMPLOYEE COMPENSATION MANAGEMENT ROUTES
// =====================================================================

// GET /api/compensation/employee/:id - Get employee compensation records
router.get('/employee/:id',
    authMiddleware.authenticate,
    authMiddleware.requireAdminOrOwner,
    getEmployeeCompensation
);

// POST /api/compensation/employee - Create employee compensation record
router.post('/employee',
    authMiddleware.requireAdmin,
    createEmployeeCompensation
);

// PUT /api/compensation/employee/:id - Update employee compensation record
router.put('/employee/:id',
    authMiddleware.requireAdmin,
    updateEmployeeCompensation
);

// DELETE /api/compensation/employee/:id - Delete employee compensation record
router.delete('/employee/:id',
    authMiddleware.requireAdmin,
    deleteEmployeeCompensation
);

// =====================================================================
// LEGACY ROUTES (for backward compatibility)
// =====================================================================

// GET /api/compensation/employee/:id/benefits - Get employee benefits (legacy)
router.get('/employee/:id/benefits',
    authMiddleware.authenticate,
    authMiddleware.requireAdminOrOwner,
    getEmployeeBenefits
);

// POST /api/compensation/calculate - Calculate benefits for employee (legacy)
router.post('/calculate',
    authMiddleware.requireAdmin,
    calculateBenefits
);

// GET /api/compensation/summary/:year - Get compensation summary report (legacy)
router.get('/summary/:year',
    authMiddleware.requireAdmin,
    getBenefitsSummary
);

// POST /api/compensation/loyalty-award - Process loyalty award (legacy)
router.post('/loyalty-award',
    authMiddleware.requireAdmin,
    processLoyaltyAward
);

module.exports = router;