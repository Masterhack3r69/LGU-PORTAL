const express = require('express');
const trainingController = require('../controllers/trainingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// ========================================
// TRAINING PROGRAM ROUTES
// ========================================

// GET /api/training-programs - Get all training programs
router.get('/training-programs', trainingController.getAllTrainingPrograms);

// GET /api/training-programs/:id - Get training program by ID
router.get('/training-programs/:id', trainingController.getTrainingProgramById);

// POST /api/training-programs - Create new training program (admin only)
router.post('/training-programs', authMiddleware.requireAdmin, ...trainingController.trainingProgramValidationRules, trainingController.createTrainingProgram);

// PUT /api/training-programs/:id - Update training program (admin only)
router.put('/training-programs/:id', authMiddleware.requireAdmin, ...trainingController.trainingProgramValidationRules, trainingController.updateTrainingProgram);

// DELETE /api/training-programs/:id - Delete training program (admin only)
router.delete('/training-programs/:id', authMiddleware.requireAdmin, trainingController.deleteTrainingProgram);

// ========================================
// TRAINING RECORD ROUTES
// ========================================

// GET /api/trainings/statistics - Get training statistics
router.get('/trainings/statistics', trainingController.getTrainingStatistics);

// GET /api/trainings - Get training records with advanced filtering
router.get('/trainings', trainingController.getAllTrainings);

// POST /api/trainings - Create new training record
router.post('/trainings', ...trainingController.trainingValidationRules, trainingController.createTraining);

// GET /api/trainings/:id - Get training record by ID
router.get('/trainings/:id', trainingController.getTrainingById);

// PUT /api/trainings/:id - Update training record
router.put('/trainings/:id', ...trainingController.trainingValidationRules, trainingController.updateTraining);

// DELETE /api/trainings/:id - Delete training record
router.delete('/trainings/:id', trainingController.deleteTraining);

// GET /api/trainings/employee/:employeeId - Get employee training history
router.get('/trainings/employee/:employeeId', trainingController.getEmployeeTrainings);

module.exports = router;