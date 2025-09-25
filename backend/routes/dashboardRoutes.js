const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, authorizeRoles } = require('../middleware/auth');

// Admin dashboard routes
router.get('/admin', authorizeRoles(['admin']), dashboardController.getAdminDashboardStats);

// Employee dashboard routes  
router.get('/employee', requireAuth, dashboardController.getEmployeeDashboardStats);

// System health routes
router.get('/system-health', authorizeRoles(['admin']), dashboardController.getSystemHealth);

// Quick stats routes
router.get('/quick-stats', authorizeRoles(['admin']), dashboardController.getQuickStats);

module.exports = router;