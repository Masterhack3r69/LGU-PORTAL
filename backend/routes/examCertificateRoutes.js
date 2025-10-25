// routes/examCertificateRoutes.js - Exam Certificate routes
const express = require('express');
const examCertificateController = require('../controllers/examCertificateController');
const authMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Apply audit logging to all routes
router.use(auditLogger);

// GET /api/exam-certificates/employee/:employeeId - Get all exam certificates for an employee
router.get('/employee/:employeeId', authMiddleware.requireEmployeeAccess, examCertificateController.getExamCertificatesByEmployee);

// GET /api/exam-certificates/:id - Get exam certificate by ID
router.get('/:id', authMiddleware.requireEmployeeAccess, examCertificateController.getExamCertificateById);

// POST /api/exam-certificates - Create new exam certificate (admin only)
router.post('/', authMiddleware.requireAdmin, ...examCertificateController.examCertificateCreationRules, examCertificateController.createExamCertificate);

// PUT /api/exam-certificates/:id - Update exam certificate (admin only)
router.put('/:id', authMiddleware.requireAdmin, ...examCertificateController.examCertificateUpdateRules, examCertificateController.updateExamCertificate);

// DELETE /api/exam-certificates/:id - Delete exam certificate (admin only)
router.delete('/:id', authMiddleware.requireAdmin, examCertificateController.deleteExamCertificate);

module.exports = router;
