const express = require('express');
const tlbController = require('../controllers/tlbController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// ========================================
// TLB STATISTICS AND CALCULATION ROUTES (BEFORE DYNAMIC ID ROUTES)
// ========================================

// GET /api/tlb/statistics - Get TLB statistics
router.get('/statistics', tlbController.getTLBStatistics);

// GET /api/tlb/employee/:employeeId/calculation - Calculate TLB for an employee
router.get('/employee/:employeeId/calculation', tlbController.calculateEmployeeTLB);

// GET /api/tlb/reports/summary - Generate TLB summary report (admin only)
router.get('/reports/summary', authMiddleware.requireAdmin, tlbController.generateTLBSummaryReport);

// ========================================
// TLB CRUD ROUTES
// ========================================

// GET /api/tlb - Get all TLB records with filtering
router.get('/', tlbController.getAllTLBRecords);

// POST /api/tlb - Create new TLB record (admin only)
router.post('/', authMiddleware.requireAdmin, ...tlbController.tlbComputationValidationRules, tlbController.createTLBRecord);

// GET /api/tlb/:id - Get TLB record by ID
router.get('/:id', tlbController.getTLBRecordById);

// PUT /api/tlb/:id - Update TLB record (admin only)
router.put('/:id', authMiddleware.requireAdmin, ...tlbController.tlbUpdateValidationRules, tlbController.updateTLBRecord);

// DELETE /api/tlb/:id - Delete TLB record (admin only)
router.delete('/:id', authMiddleware.requireAdmin, tlbController.deleteTLBRecord);

module.exports = router;