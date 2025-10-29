// routes/employeeRoutes.js - Employee routes with audit logging
const express = require('express');
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// Apply audit logging to all routes
router.use(auditLogger);

// GET /api/employees - Get all employees (admin only)
router.get('/', authMiddleware.requireAdmin, employeeController.getAllEmployees);

// GET /api/employees/statistics - Get employee statistics (admin only)
router.get('/statistics', authMiddleware.requireAdmin, employeeController.getEmployeeStatistics);

// GET /api/employees/departments - Get unique departments (admin only)
router.get('/departments', authMiddleware.requireAdmin, employeeController.getDepartments);

// GET /api/employees/positions - Get unique positions (admin only)
router.get('/positions', authMiddleware.requireAdmin, employeeController.getPositions);

// GET /api/employees/deleted - Get soft deleted employees (admin only)
router.get('/deleted', authMiddleware.requireAdmin, employeeController.getDeletedEmployees);

// GET /api/employees/search - Search employees
router.get('/search', employeeController.searchEmployees);

// GET /api/employees/:id - Get employee by ID
router.get('/:id', authMiddleware.requireEmployeeAccess, employeeController.getEmployeeById);

// GET /api/employees/:id/leave-balances - Get employee leave balances
router.get('/:id/leave-balances', authMiddleware.requireEmployeeAccess, employeeController.getEmployeeLeaveBalances);

// POST /api/employees - Create new employee (admin only)
router.post('/', authMiddleware.requireAdmin, ...employeeController.employeeCreationRules, employeeController.createEmployee);

// PUT /api/employees/:id - Update employee
router.put('/:id', authMiddleware.requireEmployeeAccess, ...employeeController.employeeUpdateRules, employeeController.updateEmployee);

// PUT /api/employees/:id/salary - Update employee salary (admin only)
router.put('/:id/salary', authMiddleware.requireAdmin, employeeController.updateEmployeeSalary);

// PUT /api/employees/:id/daily-rate - Update employee daily rate (admin only)
router.put('/:id/daily-rate', authMiddleware.requireAdmin, employeeController.updateEmployeeDailyRate);

// PUT /api/employees/:id/separation - Process employee separation (admin only)
router.put('/:id/separation', authMiddleware.requireAdmin, employeeController.processEmployeeSeparation);

// PUT /api/employees/:id/restore - Restore soft deleted employee (admin only)
router.put('/:id/restore', authMiddleware.requireAdmin, employeeController.restoreEmployee);

// DELETE /api/employees/:id - Delete employee (admin only)
router.delete('/:id', authMiddleware.requireAdmin, employeeController.deleteEmployee);

module.exports = router;