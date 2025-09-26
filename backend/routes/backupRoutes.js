// routes/backupRoutes.js - Database backup and restore routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const backupController = require('../controllers/backupController');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware.requireAuth);
router.use(authMiddleware.requireAdmin);

// GET /api/backup/list - List available backups
router.get('/list', asyncHandler(backupController.listBackups));

// POST /api/backup/create - Create new backup
router.post('/create', asyncHandler(backupController.createBackup));

// POST /api/backup/restore/:filename - Restore from backup
router.post('/restore/:filename', asyncHandler(backupController.restoreBackup));

// DELETE /api/backup/:filename - Delete backup file
router.delete('/:filename', asyncHandler(backupController.deleteBackup));

// GET /api/backup/download/:filename - Download backup file
router.get('/download/:filename', asyncHandler(backupController.downloadBackup));

// GET /api/backup/status - Get backup/restore status
router.get('/status', asyncHandler(backupController.getBackupStatus));

module.exports = router;