// routes/payrollSystemRoutes.js - Automated Payroll System Routes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    generateAutomatedPayroll,
    getPayrollComputation,
    getEmployeeAllowances,
    updateEmployeeAllowances
} = require('../controllers/payrollSystemController');

// Import payroll periods function from the legacy controller
const { getPayrollPeriods } = require('../controllers/payrollController');

// All routes already have auth middleware applied at the router level in server.js
// So we only need to add role-specific authorization

// ===================================================================
// PAYROLL PERIODS MANAGEMENT
// ===================================================================

/**
 * @route   GET /api/payroll-system/periods
 * @desc    Get payroll periods with pagination and filtering
 * @access  Admin only
 * @query   page, limit, year, month, status
 */
router.get('/periods', 
    authMiddleware.requireAdmin,
    getPayrollPeriods
);

// ===================================================================
// AUTOMATED PAYROLL GENERATION ROUTES
// ===================================================================

/**
 * @route   POST /api/payroll-system/generate-automated
 * @desc    Generate automated payroll for a specific period
 * @access  Admin only
 * @body    { period_id: number }
 */
router.post('/generate-automated', 
    authMiddleware.requireAdmin,
    generateAutomatedPayroll
);

/**
 * @route   POST /api/payroll-system/generate
 * @desc    Legacy endpoint for automated payroll generation
 * @access  Admin only
 */
router.post('/generate', 
    authMiddleware.requireAdmin,
    generateAutomatedPayroll
);

/**
 * @route   GET /api/payroll-system/computations/:employee_id
 * @desc    Get detailed payroll computation for an employee
 * @access  Admin or Employee (own data)
 * @params  employee_id - Employee ID
 * @query   period_id - Payroll period ID
 */
router.get('/computations/:employee_id', 
    authMiddleware.requireAdminOrOwner,
    getPayrollComputation
);

/**
 * @route   GET /api/payroll-system/computation/:period_id
 * @desc    Get payroll computation for a specific period
 * @access  Admin only
 */
router.get('/computation/:period_id', 
    authMiddleware.requireAdmin,
    getPayrollComputation
);

// ===================================================================
// EMPLOYEE ALLOWANCE MANAGEMENT ROUTES
// ===================================================================

/**
 * @route   GET /api/payroll-system/allowances/:employee_id
 * @desc    Get employee's current payroll allowances
 * @access  Admin or Employee (own data)
 * @params  employee_id - Employee ID
 */
router.get('/allowances/:employee_id', 
    authMiddleware.requireAdminOrOwner,
    getEmployeeAllowances
);

/**
 * @route   PUT /api/payroll-system/allowances/:employee_id/:allowance_type_id
 * @desc    Update specific employee's payroll allowance
 * @access  Admin only
 * @params  employee_id - Employee ID
 * @params  allowance_type_id - Allowance Type ID
 * @body    { amount: number, effective_date: string }
 */
router.put('/allowances/:employee_id/:allowance_type_id', 
    authMiddleware.requireAdmin,
    updateEmployeeAllowances
);

/**
 * @route   PUT /api/payroll-system/allowances/:employee_id
 * @desc    Update employee allowances (bulk update)
 * @access  Admin only
 */
router.put('/allowances/:employee_id', 
    authMiddleware.requireAdmin,
    updateEmployeeAllowances
);

/**
 * @route   GET /api/payroll-system/allowance-types
 * @desc    Get all available payroll allowance types
 * @access  Admin only
 */
router.get('/allowance-types', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const result = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE is_active = 1 ORDER BY name ASC'
            );
            
            if (!result.success) {
                throw new Error('Failed to fetch allowance types');
            }
            
            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ===================================================================
// PAYROLL VALIDATION AND REPORTS
// ===================================================================

/**
 * @route   GET /api/payroll-system/validation/:period_id
 * @desc    Validate payroll computation for accuracy
 * @access  Admin only
 * @params  period_id - Payroll period ID
 */
router.get('/validation/:period_id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { period_id } = req.params;
            const { executeQuery } = require('../config/database');
            
            // Validation queries
            const validationQueries = {
                // Check for missing allowance items
                missingAllowances: `
                    SELECT 
                        pi.id as payroll_item_id,
                        e.employee_number,
                        e.first_name,
                        e.last_name,
                        COUNT(pai.id) as allowance_items_count
                    FROM payroll_items pi
                    JOIN employees e ON pi.employee_id = e.id
                    LEFT JOIN payroll_allowance_items pai ON pi.id = pai.payroll_item_id
                    WHERE pi.payroll_period_id = ?
                    GROUP BY pi.id
                    HAVING allowance_items_count = 0
                `,
                
                // Check for calculation discrepancies
                calculationCheck: `
                    SELECT 
                        pi.id,
                        e.employee_number,
                        pi.basic_salary,
                        pi.total_allowances,
                        pi.gross_pay,
                        pi.total_deductions,
                        pi.net_pay,
                        (pi.basic_salary + pi.total_allowances) as calculated_gross,
                        (pi.gross_pay - pi.total_deductions) as calculated_net
                    FROM payroll_items pi
                    JOIN employees e ON pi.employee_id = e.id
                    WHERE pi.payroll_period_id = ?
                        AND (
                            ABS(pi.gross_pay - (pi.basic_salary + pi.total_allowances)) > 0.01 OR
                            ABS(pi.net_pay - (pi.gross_pay - pi.total_deductions)) > 0.01
                        )
                `
            };
            
            const [missingAllowancesResult, calculationCheckResult] = await Promise.all([
                executeQuery(validationQueries.missingAllowances, [period_id]),
                executeQuery(validationQueries.calculationCheck, [period_id])
            ]);
            
            res.json({
                success: true,
                data: {
                    period_id,
                    validation_results: {
                        missing_allowances: missingAllowancesResult.data || [],
                        calculation_errors: calculationCheckResult.data || [],
                        is_valid: (missingAllowancesResult.data || []).length === 0 && 
                                 (calculationCheckResult.data || []).length === 0
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

module.exports = router;