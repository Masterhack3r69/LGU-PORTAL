// routes/benefitsRoutes.js - Benefits Management Routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
    getEmployeeBenefits,
    calculateBenefits,
    getBenefitTypes,
    processLoyaltyAward,
    getBenefitsSummary
} = require('../controllers/benefitsController');

const router = express.Router();

// GET /api/benefits/types - Get benefit types (Admin only)
router.get('/types',
    authMiddleware.requireAdmin,
    getBenefitTypes
);

// GET /api/benefits/summary/:year - Get benefits summary report (Admin only)
router.get('/summary/:year',
    authMiddleware.requireAdmin,
    getBenefitsSummary
);

// GET /api/benefits/employee/:id - Get employee benefits
router.get('/employee/:id',
    authMiddleware.authenticate,
    authMiddleware.requireAdminOrOwner,
    getEmployeeBenefits
);

// POST /api/benefits/calculate - Calculate benefits for employee (Admin only)
router.post('/calculate',
    authMiddleware.requireAdmin,
    calculateBenefits
);

// POST /api/benefits/loyalty-award - Process loyalty award (Admin only)
router.post('/loyalty-award',
    authMiddleware.requireAdmin,
    processLoyaltyAward
);

module.exports = router;