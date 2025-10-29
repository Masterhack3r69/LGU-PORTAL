// routes/pdsRoutes.js - PDS data routes
const express = require('express');
const pdsController = require('../controllers/pdsController');
const authMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Apply audit logging
router.use(auditLogger);

// GET /api/pds/:employeeId - Get complete PDS data
router.get('/:employeeId', authMiddleware.requireEmployeeAccess, pdsController.getEmployeePDS);

// POST /api/pds/:employeeId/family-background - Save family background
router.post('/:employeeId/family-background', authMiddleware.requireEmployeeAccess, pdsController.saveFamilyBackground);

// POST /api/pds/:employeeId/children - Save children
router.post('/:employeeId/children', authMiddleware.requireEmployeeAccess, pdsController.saveChildren);

// POST /api/pds/:employeeId/education - Save education
router.post('/:employeeId/education', authMiddleware.requireEmployeeAccess, pdsController.saveEducation);

// POST /api/pds/:employeeId/work-experience - Save work experience
router.post('/:employeeId/work-experience', authMiddleware.requireEmployeeAccess, pdsController.saveWorkExperience);

// POST /api/pds/:employeeId/voluntary-work - Save voluntary work
router.post('/:employeeId/voluntary-work', authMiddleware.requireEmployeeAccess, pdsController.saveVoluntaryWork);

// POST /api/pds/:employeeId/other-info - Save other information
router.post('/:employeeId/other-info', authMiddleware.requireEmployeeAccess, pdsController.saveOtherInfo);

module.exports = router;
