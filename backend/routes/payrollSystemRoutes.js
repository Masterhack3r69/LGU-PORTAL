// routes/payrollSystemRoutes.js - Automated Payroll System Routes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    generateAutomatedPayroll,
    bulkProcessPayroll,
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
 * @route   POST /api/payroll-system/bulk-process
 * @desc    Process payroll for multiple employees with selected allowances/deductions
 * @access  Admin only
 * @body    { period_id: number, employee_ids: number[], selected_allowance_types: number[], selected_deduction_types: number[] }
 */
router.post('/bulk-process', 
    authMiddleware.requireAdmin,
    bulkProcessPayroll
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
 * @access  Admin or Employee (own data)
 */
router.put('/allowances/:employee_id', 
    authMiddleware.requireAdminOrOwner,
    updateEmployeeAllowances
);

/**
 * @route   GET /api/payroll-system/allowance-types
 * @desc    Get all available payroll allowance types
 * @access  Admin or Employee (for selection)
 */
router.get('/allowance-types', 
    authMiddleware.requireAuth,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { category, is_active, search } = req.query;
            
            let query = 'SELECT * FROM payroll_allowance_types WHERE 1=1';
            const params = [];
            
            if (is_active !== undefined) {
                query += ' AND is_active = ?';
                params.push(is_active === 'true' ? 1 : 0);
            }
            
            if (search) {
                query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            query += ' ORDER BY name ASC';
            
            const result = await executeQuery(query, params);
            
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

/**
 * @route   GET /api/payroll-system/allowance-types/:id
 * @desc    Get specific payroll allowance type
 * @access  Admin only
 */
router.get('/allowance-types/:id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            
            const result = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            if (!result.success || result.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll item type not found'
                });
            }
            
            res.json({
                success: true,
                data: result.data[0]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/payroll-system/allowance-types
 * @desc    Create new payroll allowance type
 * @access  Admin only
 */
router.post('/allowance-types', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { code, name, description, amount, is_monthly, is_prorated } = req.body;
            
            // Validation
            if (!code || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Code and name are required'
                });
            }
            
            // Validate amount
            const parsedAmount = parseFloat(amount) || 0;
            if (parsedAmount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number'
                });
            }
            
            // Check if code already exists
            const existingResult = await executeQuery(
                'SELECT id FROM payroll_allowance_types WHERE code = ?',
                [code]
            );
            
            if (existingResult.success && existingResult.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Code already exists'
                });
            }
            
            const result = await executeQuery(`
                INSERT INTO payroll_allowance_types 
                (code, name, description, amount, is_monthly, is_prorated) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, [code, name, description || null, parsedAmount,
                is_monthly !== undefined ? is_monthly : true, 
                is_prorated !== undefined ? is_prorated : true]);
            
            if (!result.success) {
                throw new Error('Failed to create payroll item type');
            }
            
            // Get the created item
            const createdResult = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE id = ?',
                [result.insertId]
            );
            
            res.status(201).json({
                success: true,
                data: createdResult.data[0],
                message: 'Payroll item type created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   PUT /api/payroll-system/allowance-types/:id
 * @desc    Update payroll allowance type
 * @access  Admin only
 */
router.put('/allowance-types/:id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            const { code, name, description, amount, is_monthly, is_prorated } = req.body;
            
            // Check if item exists
            const existingResult = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            if (!existingResult.success || existingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll item type not found'
                });
            }
            
            // Validate amount if provided
            let parsedAmount = existingResult.data[0].amount;
            if (amount !== undefined) {
                parsedAmount = parseFloat(amount) || 0;
                if (parsedAmount < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Amount must be a positive number'
                    });
                }
            }
            
            // Check if code already exists (excluding current item)
            if (code) {
                const codeCheckResult = await executeQuery(
                    'SELECT id FROM payroll_allowance_types WHERE code = ? AND id != ?',
                    [code, id]
                );
                
                if (codeCheckResult.success && codeCheckResult.data.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Code already exists'
                    });
                }
            }
            
            const result = await executeQuery(`
                UPDATE payroll_allowance_types 
                SET code = ?, name = ?, description = ?, amount = ?,
                    is_monthly = ?, is_prorated = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [code, name, description, parsedAmount, is_monthly, is_prorated, id]);
            
            if (!result.success) {
                throw new Error('Failed to update payroll item type');
            }
            
            // Get the updated item
            const updatedResult = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                data: updatedResult.data[0],
                message: 'Payroll item type updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   PUT /api/payroll-system/allowance-types/:id/toggle-status
 * @desc    Toggle active status of payroll allowance type
 * @access  Admin only
 */
router.put('/allowance-types/:id/toggle-status', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            
            // Get current status
            const currentResult = await executeQuery(
                'SELECT is_active FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            if (!currentResult.success || currentResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll item type not found'
                });
            }
            
            const newStatus = !currentResult.data[0].is_active;
            
            const result = await executeQuery(
                'UPDATE payroll_allowance_types SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStatus, id]
            );
            
            if (!result.success) {
                throw new Error('Failed to toggle status');
            }
            
            // Get the updated item
            const updatedResult = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                data: updatedResult.data[0],
                message: `Payroll item type ${newStatus ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   DELETE /api/payroll-system/allowance-types/:id
 * @desc    Delete payroll allowance type
 * @access  Admin only
 */
router.delete('/allowance-types/:id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            
            // Check if item exists
            const existingResult = await executeQuery(
                'SELECT * FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            if (!existingResult.success || existingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll item type not found'
                });
            }
            
            // Check if item is being used
            const usageResult = await executeQuery(
                'SELECT COUNT(*) as count FROM employee_payroll_allowances WHERE allowance_type_id = ?',
                [id]
            );
            
            if (usageResult.success && usageResult.data[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete payroll item type that is currently being used'
                });
            }
            
            const result = await executeQuery(
                'DELETE FROM payroll_allowance_types WHERE id = ?',
                [id]
            );
            
            if (!result.success) {
                throw new Error('Failed to delete payroll item type');
            }
            
            res.json({
                success: true,
                message: 'Payroll item type deleted successfully'
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
// PAYROLL DEDUCTION TYPES MANAGEMENT
// ===================================================================

/**
 * @route   GET /api/payroll-system/deduction-types
 * @desc    Get all available payroll deduction types
 * @access  Admin only
 */
router.get('/deduction-types', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { is_active, is_government, is_mandatory, deduction_type, search } = req.query;
            
            let query = 'SELECT * FROM payroll_deduction_types WHERE 1=1';
            const params = [];
            
            if (is_active !== undefined) {
                query += ' AND is_active = ?';
                params.push(is_active === 'true' ? 1 : 0);
            }
            
            if (is_government !== undefined) {
                query += ' AND is_government = ?';
                params.push(is_government === 'true' ? 1 : 0);
            }
            
            if (is_mandatory !== undefined) {
                query += ' AND is_mandatory = ?';
                params.push(is_mandatory === 'true' ? 1 : 0);
            }
            
            if (deduction_type) {
                query += ' AND deduction_type = ?';
                params.push(deduction_type);
            }
            
            if (search) {
                query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            query += ' ORDER BY is_government DESC, is_mandatory DESC, name ASC';
            
            const result = await executeQuery(query, params);
            
            if (!result.success) {
                throw new Error('Failed to fetch deduction types');
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

/**
 * @route   GET /api/payroll-system/deduction-types/:id
 * @desc    Get specific payroll deduction type
 * @access  Admin only
 */
router.get('/deduction-types/:id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            
            const result = await executeQuery(
                'SELECT * FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            if (!result.success || result.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll deduction type not found'
                });
            }
            
            res.json({
                success: true,
                data: result.data[0]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/payroll-system/deduction-types
 * @desc    Create new payroll deduction type
 * @access  Admin only
 */
router.post('/deduction-types', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { 
                code, name, description, deduction_type, amount, percentage, 
                max_amount, is_government, is_mandatory 
            } = req.body;
            
            // Validation
            if (!code || !name || !deduction_type) {
                return res.status(400).json({
                    success: false,
                    message: 'Code, name, and deduction type are required'
                });
            }
            
            // Validate deduction type values
            if (deduction_type === 'fixed') {
                const parsedAmount = parseFloat(amount) || 0;
                if (parsedAmount < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Amount must be a positive number'
                    });
                }
            } else if (deduction_type === 'percentage') {
                const parsedPercentage = parseFloat(percentage) || 0;
                if (parsedPercentage < 0 || parsedPercentage > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Percentage must be between 0 and 100'
                    });
                }
                if (max_amount && parseFloat(max_amount) < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Maximum amount must be a positive number'
                    });
                }
            }
            
            // Check if code already exists
            const existingResult = await executeQuery(
                'SELECT id FROM payroll_deduction_types WHERE code = ?',
                [code]
            );
            
            if (existingResult.success && existingResult.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Code already exists'
                });
            }
            
            const result = await executeQuery(`
                INSERT INTO payroll_deduction_types 
                (code, name, description, deduction_type, amount, percentage, max_amount, is_government, is_mandatory) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                code, name, description || null, deduction_type,
                parseFloat(amount) || 0, parseFloat(percentage) || 0, 
                max_amount ? parseFloat(max_amount) : null,
                is_government ? 1 : 0, is_mandatory ? 1 : 0
            ]);
            
            if (!result.success) {
                throw new Error('Failed to create payroll deduction type');
            }
            
            // Get the created item
            const createdResult = await executeQuery(
                'SELECT * FROM payroll_deduction_types WHERE id = ?',
                [result.insertId]
            );
            
            res.status(201).json({
                success: true,
                data: createdResult.data[0],
                message: 'Payroll deduction type created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   PUT /api/payroll-system/deduction-types/:id
 * @desc    Update payroll deduction type
 * @access  Admin only
 */
router.put('/deduction-types/:id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            const { 
                code, name, description, deduction_type, amount, percentage, 
                max_amount, is_government, is_mandatory 
            } = req.body;
            
            // Check if item exists
            const existingResult = await executeQuery(
                'SELECT * FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            if (!existingResult.success || existingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll deduction type not found'
                });
            }
            
            // Check if code already exists (excluding current item)
            if (code) {
                const codeCheckResult = await executeQuery(
                    'SELECT id FROM payroll_deduction_types WHERE code = ? AND id != ?',
                    [code, id]
                );
                
                if (codeCheckResult.success && codeCheckResult.data.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Code already exists'
                    });
                }
            }
            
            const result = await executeQuery(`
                UPDATE payroll_deduction_types 
                SET code = ?, name = ?, description = ?, deduction_type = ?, 
                    amount = ?, percentage = ?, max_amount = ?, 
                    is_government = ?, is_mandatory = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                code, name, description, deduction_type,
                parseFloat(amount) || 0, parseFloat(percentage) || 0,
                max_amount ? parseFloat(max_amount) : null,
                is_government ? 1 : 0, is_mandatory ? 1 : 0, id
            ]);
            
            if (!result.success) {
                throw new Error('Failed to update payroll deduction type');
            }
            
            // Get the updated item
            const updatedResult = await executeQuery(
                'SELECT * FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                data: updatedResult.data[0],
                message: 'Payroll deduction type updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   PUT /api/payroll-system/deduction-types/:id/toggle-status
 * @desc    Toggle active status of payroll deduction type
 * @access  Admin only
 */
router.put('/deduction-types/:id/toggle-status', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            
            // Get current status
            const currentResult = await executeQuery(
                'SELECT is_active FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            if (!currentResult.success || currentResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll deduction type not found'
                });
            }
            
            const newStatus = !currentResult.data[0].is_active;
            
            const result = await executeQuery(
                'UPDATE payroll_deduction_types SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStatus, id]
            );
            
            if (!result.success) {
                throw new Error('Failed to toggle status');
            }
            
            // Get the updated item
            const updatedResult = await executeQuery(
                'SELECT * FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                data: updatedResult.data[0],
                message: `Payroll deduction type ${newStatus ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   DELETE /api/payroll-system/deduction-types/:id
 * @desc    Delete payroll deduction type
 * @access  Admin only
 */
router.delete('/deduction-types/:id', 
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const { id } = req.params;
            
            // Check if item exists
            const existingResult = await executeQuery(
                'SELECT * FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            if (!existingResult.success || existingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Payroll deduction type not found'
                });
            }
            
            // Check if it's a government deduction (prevent deletion)
            if (existingResult.data[0].is_government) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete government deduction types'
                });
            }
            
            const result = await executeQuery(
                'DELETE FROM payroll_deduction_types WHERE id = ?',
                [id]
            );
            
            if (!result.success) {
                throw new Error('Failed to delete payroll deduction type');
            }
            
            res.json({
                success: true,
                message: 'Payroll deduction type deleted successfully'
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