// routes/compensationBenefitsRoutes.js - Manual Compensation & Benefits Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles, requireAdminOrOwner } = require('../middleware/auth');
const {
    getAvailableBenefits,
    selectBenefits,
    processBenefits,
    getBenefitSelections
} = require('../controllers/compensationBenefitsController');

// ===================================================================
// BENEFIT AVAILABILITY AND SELECTION ROUTES
// ===================================================================

/**
 * @route   GET /api/compensation-benefits/available-benefits/:id
 * @desc    Get available benefits for employee for a specific year
 * @access  Admin or Employee (own data)
 * @params  id - Employee ID
 * @query   year - Year for benefit selection
 */
router.get('/available-benefits/:id',
    authenticateToken,
    requireAdminOrOwner,
    getAvailableBenefits
);

/**
 * @route   POST /api/compensation-benefits/submit-selections
 * @desc    Submit benefit selections for employee
 * @access  Admin or Employee (own data)
 * @body    { employee_id: number, year: number, selections: Array }
 */
router.post('/submit-selections',
    authenticateToken,
    requireAdminOrOwner,
    selectBenefits
);

/**
 * @route   GET /api/compensation-benefits/history/:id
 * @desc    Get employee's benefit selection history
 * @access  Admin or Employee (own data)
 * @params  id - Employee ID
 */
router.get('/history/:id',
    authenticateToken,
    requireAdminOrOwner,
    getBenefitSelections
);

// ===================================================================
// BENEFIT PROCESSING AND APPROVAL ROUTES
// ===================================================================

/**
 * @route   POST /api/compensation-benefits/process
 * @desc    Process and approve benefit selections for payment
 * @access  Admin only
 * @body    { selection_ids: number[], processed_by: number }
 */
router.post('/process', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    processBenefits
);

/**
 * @route   PUT /api/compensation-benefits/selections/:selection_id
 * @desc    Update specific benefit selection
 * @access  Admin only
 * @params  selection_id - Benefit selection ID
 * @body    { actual_amount?: number, status?: string, notes?: string }
 */
router.put('/selections/:selection_id', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    async (req, res) => {
        try {
            const { selection_id } = req.params;
            const { actual_amount, status, notes, payment_date } = req.body;
            const { executeQuery } = require('../config/database');
            
            // Build update query dynamically
            const updates = [];
            const params = [];
            
            if (actual_amount !== undefined) {
                updates.push('actual_amount = ?');
                params.push(actual_amount);
            }
            
            if (status) {
                updates.push('status = ?');
                params.push(status);
            }
            
            if (notes !== undefined) {
                updates.push('notes = ?');
                params.push(notes);
            }
            
            if (payment_date) {
                updates.push('payment_date = ?');
                params.push(payment_date);
            }
            
            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid update fields provided'
                });
            }
            
            updates.push('updated_at = NOW()');
            params.push(selection_id);
            
            const updateQuery = `
                UPDATE employee_benefit_selections 
                SET ${updates.join(', ')}
                WHERE id = ?
            `;
            
            const result = await executeQuery(updateQuery, params);
            
            if (!result.success) {
                throw new Error('Failed to update benefit selection');
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Benefit selection not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Benefit selection updated successfully'
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
// BENEFIT TYPES AND CONFIGURATION ROUTES
// ===================================================================

/**
 * @route   GET /api/compensation-benefits/benefit-types
 * @desc    Get all compensation & benefit types
 * @access  Admin and Employee
 */
router.get('/benefit-types', 
    authenticateToken, 
    async (req, res) => {
        try {
            const { executeQuery } = require('../config/database');
            const result = await executeQuery(`
                SELECT 
                    id, code, name, description, category, frequency,
                    calculation_method, base_amount, is_taxable, is_active
                FROM cb_benefit_types 
                WHERE is_active = 1 
                ORDER BY category, name ASC
            `);
            
            if (!result.success) {
                throw new Error('Failed to fetch benefit types');
            }
            
            // Group by category
            const benefitsByCategory = result.data.reduce((acc, benefit) => {
                if (!acc[benefit.category]) {
                    acc[benefit.category] = [];
                }
                acc[benefit.category].push(benefit);
                return acc;
            }, {});
            
            res.json({
                success: true,
                data: {
                    all_benefits: result.data,
                    benefits_by_category: benefitsByCategory
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

/**
 * @route   POST /api/compensation-benefits/benefit-types
 * @desc    Create new benefit type
 * @access  Admin only
 * @body    { code, name, description, category, frequency, calculation_method, ... }
 */
router.post('/benefit-types', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    async (req, res) => {
        try {
            const {
                code, name, description, category, frequency,
                calculation_method, base_amount, percentage_rate,
                is_taxable, eligibility_rules
            } = req.body;
            
            const { executeQuery } = require('../config/database');
            
            const insertQuery = `
                INSERT INTO cb_benefit_types 
                (code, name, description, category, frequency, calculation_method,
                 base_amount, percentage_rate, is_taxable, eligibility_rules)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await executeQuery(insertQuery, [
                code, name, description, category, frequency, calculation_method,
                base_amount || 0, percentage_rate || 0, is_taxable !== false,
                eligibility_rules ? JSON.stringify(eligibility_rules) : null
            ]);
            
            if (!result.success) {
                throw new Error('Failed to create benefit type');
            }
            
            res.status(201).json({
                success: true,
                data: { id: result.insertId },
                message: 'Benefit type created successfully'
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
// REPORTS AND ANALYTICS ROUTES
// ===================================================================

/**
 * @route   GET /api/compensation-benefits/report/summary/:year
 * @desc    Get benefit selections summary report for a year
 * @access  Admin only
 * @params  year - Report year
 * @query   department?, benefit_category?
 */
router.get('/report/summary/:year', 
    authenticateToken, 
    authorizeRoles(['admin']), 
    async (req, res) => {
        try {
            const { year } = req.params;
            const { department, benefit_category } = req.query;
            const { executeQuery } = require('../config/database');
            
            let whereConditions = ['ebs.year = ?'];
            let queryParams = [year];
            
            if (department) {
                whereConditions.push('e.department = ?');
                queryParams.push(department);
            }
            
            if (benefit_category) {
                whereConditions.push('cbt.category = ?');
                queryParams.push(benefit_category);
            }
            
            const whereClause = whereConditions.join(' AND ');
            
            const summaryQuery = `
                SELECT 
                    cbt.category,
                    cbt.name as benefit_name,
                    cbt.code as benefit_code,
                    COUNT(CASE WHEN ebs.is_selected = 1 THEN 1 END) as selection_count,
                    COUNT(CASE WHEN ebs.status = 'PAID' THEN 1 END) as paid_count,
                    SUM(CASE WHEN ebs.is_selected = 1 THEN ebs.calculated_amount ELSE 0 END) as total_calculated,
                    SUM(CASE WHEN ebs.status = 'PAID' THEN ebs.actual_amount ELSE 0 END) as total_paid,
                    AVG(CASE WHEN ebs.is_selected = 1 THEN ebs.actual_amount END) as average_amount
                FROM employee_benefit_selections ebs
                JOIN cb_benefit_types cbt ON ebs.benefit_type_id = cbt.id
                JOIN employees e ON ebs.employee_id = e.id
                WHERE ${whereClause}
                GROUP BY cbt.id, cbt.category, cbt.name, cbt.code
                ORDER BY cbt.category, total_paid DESC
            `;
            
            const result = await executeQuery(summaryQuery, queryParams);
            
            if (!result.success) {
                throw new Error('Failed to generate summary report');
            }
            
            // Group by category
            const reportByCategory = result.data.reduce((acc, item) => {
                if (!acc[item.category]) {
                    acc[item.category] = {
                        category: item.category,
                        benefits: [],
                        totals: {
                            total_calculated: 0,
                            total_paid: 0,
                            selection_count: 0,
                            paid_count: 0
                        }
                    };
                }
                
                acc[item.category].benefits.push(item);
                acc[item.category].totals.total_calculated += parseFloat(item.total_calculated || 0);
                acc[item.category].totals.total_paid += parseFloat(item.total_paid || 0);
                acc[item.category].totals.selection_count += parseInt(item.selection_count || 0);
                acc[item.category].totals.paid_count += parseInt(item.paid_count || 0);
                
                return acc;
            }, {});
            
            res.json({
                success: true,
                data: {
                    year: parseInt(year),
                    filters: { department, benefit_category },
                    summary: result.data,
                    by_category: reportByCategory,
                    grand_totals: {
                        total_calculated: result.data.reduce((sum, item) => sum + parseFloat(item.total_calculated || 0), 0),
                        total_paid: result.data.reduce((sum, item) => sum + parseFloat(item.total_paid || 0), 0),
                        total_selections: result.data.reduce((sum, item) => sum + parseInt(item.selection_count || 0), 0),
                        total_payments: result.data.reduce((sum, item) => sum + parseInt(item.paid_count || 0), 0)
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

/**
 * @route   GET /api/compensation-benefits/report/employee/:id
 * @desc    Get comprehensive benefit history for an employee
 * @access  Admin or Employee (own data)
 * @params  id - Employee ID
 * @query   years? - Number of years to include (default: 5)
 */
router.get('/report/employee/:id',
    authenticateToken,
    requireAdminOrOwner,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { years = 5 } = req.query;
            const { executeQuery } = require('../config/database');
            
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - parseInt(years) + 1;
            
            const query = `
                SELECT 
                    ebs.year,
                    cbt.category,
                    cbt.name as benefit_name,
                    cbt.code as benefit_code,
                    ebs.is_selected,
                    ebs.calculated_amount,
                    ebs.actual_amount,
                    ebs.status,
                    ebs.selection_date,
                    ebs.payment_date,
                    ebs.reference_number
                FROM employee_benefit_selections ebs
                JOIN cb_benefit_types cbt ON ebs.benefit_type_id = cbt.id
                WHERE ebs.employee_id = ? 
                    AND ebs.year >= ?
                ORDER BY ebs.year DESC, cbt.category, cbt.name
            `;
            
            const result = await executeQuery(query, [id, startYear]);
            
            if (!result.success) {
                throw new Error('Failed to generate employee benefit report');
            }
            
            // Group by year
            const benefitsByYear = result.data.reduce((acc, benefit) => {
                if (!acc[benefit.year]) {
                    acc[benefit.year] = {
                        year: benefit.year,
                        selections: [],
                        totals: {
                            selected_count: 0,
                            total_calculated: 0,
                            total_paid: 0
                        }
                    };
                }
                
                acc[benefit.year].selections.push(benefit);
                
                if (benefit.is_selected) {
                    acc[benefit.year].totals.selected_count++;
                    acc[benefit.year].totals.total_calculated += parseFloat(benefit.calculated_amount || 0);
                }
                
                if (benefit.status === 'PAID') {
                    acc[benefit.year].totals.total_paid += parseFloat(benefit.actual_amount || 0);
                }
                
                return acc;
            }, {});
            
            res.json({
                success: true,
                data: {
                    employee_id: parseInt(id),
                    years_covered: `${startYear}-${currentYear}`,
                    history: benefitsByYear,
                    summary: {
                        total_years: Object.keys(benefitsByYear).length,
                        lifetime_benefits: Object.values(benefitsByYear).reduce(
                            (sum, year) => sum + year.totals.total_paid, 0
                        )
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
