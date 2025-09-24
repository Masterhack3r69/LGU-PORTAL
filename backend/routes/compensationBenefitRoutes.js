// routes/compensationBenefitRoutes.js - Compensation & Benefits routes
const express = require('express');
const compensationBenefitController = require('../controllers/compensationBenefitController');
const authMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// Auth middleware and audit logging are applied at the server level

// GET /api/compensation-benefits/statistics - Get benefit statistics (admin only)
router.get('/statistics', authMiddleware.requireAdmin, compensationBenefitController.getStatistics.bind(compensationBenefitController));

// GET /api/compensation-benefits/eligible/:benefitType - Get eligible employees for benefit (admin only)
router.get('/eligible/:benefitType', authMiddleware.requireAdmin, compensationBenefitController.getEligibleEmployees.bind(compensationBenefitController));

// GET /api/compensation-benefits/calculate/:benefitType/:employeeId - Calculate specific benefit (admin only)
router.get('/calculate/:benefitType/:employeeId', authMiddleware.requireAdmin, compensationBenefitController.calculateBenefit.bind(compensationBenefitController));

// GET /api/compensation-benefits/leave-balance/:employeeId - Get employee leave balance (admin only)
router.get('/leave-balance/:employeeId', authMiddleware.requireAdmin, compensationBenefitController.getLeaveBalance.bind(compensationBenefitController));

// POST /api/compensation-benefits/bulk-calculate - Bulk calculate benefits (admin only)
router.post('/bulk-calculate', authMiddleware.requireAdmin, compensationBenefitController.bulkCalculate.bind(compensationBenefitController));

// POST /api/compensation-benefits/bulk-process - Bulk process benefits (admin only)
router.post('/bulk-process', authMiddleware.requireAdmin, compensationBenefitController.bulkProcess.bind(compensationBenefitController));

// POST /api/compensation-benefits/process-monetization - Process monetization with leave balance update (admin only)
router.post('/process-monetization', authMiddleware.requireAdmin, compensationBenefitController.processMonetization.bind(compensationBenefitController));

// GET /api/compensation-benefits/employee - Get compensation benefit records for current employee
router.get('/employee', authMiddleware.requireAuth, compensationBenefitController.getEmployeeRecords.bind(compensationBenefitController));

// GET /api/compensation-benefits - Get all compensation benefit records (admin only)
router.get('/', authMiddleware.requireAdmin, compensationBenefitController.getAllRecords.bind(compensationBenefitController));

// POST /api/compensation-benefits - Create single compensation benefit record (admin only)
router.post('/', authMiddleware.requireAdmin, ...compensationBenefitController.constructor.validationRules, compensationBenefitController.createRecord.bind(compensationBenefitController));

// GET /api/compensation-benefits/:id - Get compensation benefit record by ID (admin only)
router.get('/:id', authMiddleware.requireAdmin, compensationBenefitController.getRecordById.bind(compensationBenefitController));

// DELETE /api/compensation-benefits/:id - Delete compensation benefit record (admin only)
router.delete('/:id', authMiddleware.requireAdmin, compensationBenefitController.deleteRecord.bind(compensationBenefitController));

module.exports = router;