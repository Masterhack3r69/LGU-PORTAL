// routes/leaveRoutes.js - Enhanced Leave management routes
const express = require('express');
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// ========================================
// LEAVE TYPE MANAGEMENT ROUTES (MOVED TO THE TOP)
// ========================================

// GET /api/leaves/types - Get all leave types
router.get('/types', leaveController.getAllLeaveTypes);

// GET /api/leaves/types/:id - Get leave type by ID
router.get('/types/:id', leaveController.getLeaveTypeById);

// POST /api/leaves/types - Create new leave type (admin only)
router.post('/types', authMiddleware.requireAdmin, ...leaveController.leaveTypeValidationRules, leaveController.createLeaveType);

// PUT /api/leaves/types/:id - Update leave type (admin only)
router.put('/types/:id', authMiddleware.requireAdmin, ...leaveController.leaveTypeValidationRules, leaveController.updateLeaveType);

// DELETE /api/leaves/types/:id - Delete leave type (admin only)
router.delete('/types/:id', authMiddleware.requireAdmin, leaveController.deleteLeaveType);

// GET /api/leaves/types/statistics - Get leave type statistics (admin only)
router.get('/types/statistics', authMiddleware.requireAdmin, leaveController.getLeaveTypeStatistics);

// ========================================
// LEAVE APPLICATION ROUTES
// ========================================

// GET /api/leaves - Get leave applications with advanced filtering
router.get('/', leaveController.getAllLeaves);

// GET /api/leaves/statistics - Get leave statistics
router.get('/statistics', leaveController.getLeaveStatistics);

// GET /api/leaves/calendar - Get leave calendar for conflict checking
router.get('/calendar', leaveController.getLeaveCalendar);

// POST /api/leaves/calculate-working-days - Calculate working days between dates
router.post('/calculate-working-days', leaveController.calculateWorkingDays);

// GET /api/leaves/pending-approvals - Get pending approvals dashboard (admin only)
router.get('/pending-approvals', authMiddleware.requireAdmin, leaveController.getPendingApprovals);

// POST /api/leaves - Create new leave application
router.post('/', ...leaveController.leaveValidationRules, leaveController.createLeave);

// POST /api/leaves/validate - Validate leave application data
router.post('/validate', leaveController.validateLeaveApplication);

// PUT /api/leaves/:id - Update leave application
router.put('/:id', ...leaveController.leaveValidationRules, leaveController.updateLeave);

// PUT /api/leaves/:id/approve - Approve leave application (admin only)
router.put('/:id/approve', authMiddleware.requireAdmin, leaveController.approveLeave);

// PUT /api/leaves/:id/reject - Reject leave application (admin only)
router.put('/:id/reject', authMiddleware.requireAdmin, leaveController.rejectLeave);

// PUT /api/leaves/:id/cancel - Cancel leave application
router.put('/:id/cancel', leaveController.cancelLeave);

// GET /api/leaves/:id - Get leave application by ID
router.get('/:id', leaveController.getLeaveById);

// ========================================
// LEAVE BALANCE ROUTES
// ========================================

// GET /api/leaves/balances/:employeeId - Get employee leave balances
router.get('/balances/:employeeId', leaveController.getLeaveBalances);

// POST /api/leaves/balances/create - Create or update employee leave balance (admin only)
router.post('/balances/create', authMiddleware.requireAdmin, leaveController.createLeaveBalance);

// PUT /api/leaves/balances/:id - Update employee leave balance (admin only)
router.put('/balances/:id', authMiddleware.requireAdmin, leaveController.updateLeaveBalance);

// DELETE /api/leaves/balances/:id - Delete employee leave balance (admin only)
router.delete('/balances/:id', authMiddleware.requireAdmin, leaveController.deleteLeaveBalance);

// POST /api/leaves/initialize-balances - Initialize yearly leave balances (admin only)
router.post('/initialize-balances', authMiddleware.requireAdmin, leaveController.initializeLeaveBalances);

// POST /api/leaves/process-accrual - Process monthly leave accrual (admin only)
router.post('/process-accrual', authMiddleware.requireAdmin, leaveController.processMonthlyAccrual);

// POST /api/leaves/admin-create - Admin creates leave on behalf of employee (auto-approved)
router.post('/admin-create', authMiddleware.requireAdmin, ...leaveController.leaveValidationRules, leaveController.createAdminLeave);

// POST /api/leaves/monetize - Process leave monetization (admin only)
router.post('/monetize', authMiddleware.requireAdmin, leaveController.processLeaveMonetization);

// POST /api/leaves/carry-forward - Process year-end carry forward (admin only)
router.post('/carry-forward', authMiddleware.requireAdmin, leaveController.processCarryForward);

// ========================================
// REPORTING AND ANALYTICS ROUTES
// ========================================

// GET /api/leaves/reports/summary - Generate leave summary report
router.get('/reports/summary', authMiddleware.requireAdmin, leaveController.generateLeaveSummaryReport);

// GET /api/leaves/reports/usage-analytics - Generate usage analytics
router.get('/reports/usage-analytics', authMiddleware.requireAdmin, leaveController.generateUsageAnalytics);

// GET /api/leaves/reports/balance-utilization - Generate balance utilization report
router.get('/reports/balance-utilization', authMiddleware.requireAdmin, leaveController.generateBalanceReport);

// GET /api/leaves/reports/pending-approvals-dashboard - Generate pending approvals dashboard
router.get('/reports/pending-approvals-dashboard', authMiddleware.requireAdmin, leaveController.generatePendingApprovalsDashboard);

// GET /api/leaves/reports/compliance - Generate compliance report
router.get('/reports/compliance', authMiddleware.requireAdmin, leaveController.generateComplianceReport);

// GET /api/leaves/reports/forecasting - Generate forecasting report
router.get('/reports/forecasting', authMiddleware.requireAdmin, leaveController.generateForecastingReport);

module.exports = router;