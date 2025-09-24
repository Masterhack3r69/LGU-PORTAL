// routes/importRoutes.js - Import functionality routes
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
    previewEmployeeImport,
    executeEmployeeImport,
    downloadImportTemplate
} = require('../controllers/importController');

// All import routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/import/employees/template - Download Excel import template
router.get('/employees/template', downloadImportTemplate);

// POST /api/import/employees/preview - Preview Excel import (validate and show preview)
router.post('/employees/preview', previewEmployeeImport);

// POST /api/import/employees/execute - Execute Excel import
router.post('/employees/execute', executeEmployeeImport);

module.exports = router;