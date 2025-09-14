// routes/compensationRoutes.js - Compensation Management Routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
    getAllCompensations,
    getEmployeeCompensation,
    createCompensation,
    updateCompensation,
    deleteCompensation,
    getCompensationTypes,
    bulkCompensationOperations,
    compensationValidationRules
} = require('../controllers/compensationController');

const router = express.Router();

// GET /api/compensation - Get all compensation records (Admin only)
router.get('/', 
    authMiddleware.requireAdmin,
    getAllCompensations
);

// GET /api/compensation/types - Get compensation types (Admin only)
router.get('/types',
    authMiddleware.requireAdmin,
    getCompensationTypes
);

// GET /api/compensation/employee/:id - Get employee compensation
router.get('/employee/:id',
    authMiddleware.authenticate,
    authMiddleware.requireAdminOrOwner,
    getEmployeeCompensation
);

// POST /api/compensation - Create compensation record (Admin only)
router.post('/',
    authMiddleware.requireAdmin,
    compensationValidationRules,
    createCompensation
);

// POST /api/compensation/bulk - Bulk compensation operations (Admin only)
router.post('/bulk',
    authMiddleware.requireAdmin,
    bulkCompensationOperations
);

// PUT /api/compensation/:id - Update compensation record (Admin only)
router.put('/:id',
    authMiddleware.requireAdmin,
    updateCompensation
);

// DELETE /api/compensation/:id - Delete compensation record (Admin only)
router.delete('/:id',
    authMiddleware.requireAdmin,
    deleteCompensation
);

module.exports = router;