// controllers/benefitsController.js - Benefits management controller
const { asyncHandler } = require('../middleware/errorHandler');
const { BenefitType, BenefitCycle, BenefitItem } = require('../models/Benefits');
const Employee = require('../models/Employee');
const benefitsCalculationService = require('../services/benefitsCalculationService');
const benefitSlipService = require('../services/benefitSlipService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class BenefitsController {
    // ===== BENEFIT TYPES MANAGEMENT =====

    // Get all benefit types
    getAllBenefitTypes = asyncHandler(async (req, res) => {
        const filters = {
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
            category: req.query.category,
            calculation_type: req.query.calculation_type,
            frequency: req.query.frequency,
            search: req.query.search,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const [benefitTypesResult, totalCount] = await Promise.all([
            BenefitType.findAll(filters),
            BenefitType.getCount(filters)
        ]);

        if (benefitTypesResult.success) {
            return successResponse(res, {
                benefit_types: benefitTypesResult.data,
                pagination: {
                    total: totalCount,
                    limit: parseInt(filters.limit),
                    offset: parseInt(filters.offset),
                    has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                }
            }, 'Benefit types retrieved successfully');
        }

        return errorResponse(res, 'Failed to retrieve benefit types', 500);
    });

    // Get specific benefit type
    getBenefitType = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const benefitTypeResult = await BenefitType.findById(id);

        if (benefitTypeResult.success && benefitTypeResult.data) {
            return successResponse(res, benefitTypeResult.data, 'Benefit type retrieved successfully');
        }

        return errorResponse(res, 'Benefit type not found', 404);
    });

    // Create benefit type
    createBenefitType = asyncHandler(async (req, res) => {
        const benefitTypeData = req.body;
        const benefitType = new BenefitType(benefitTypeData);

        const result = await benefitType.save();

        if (result.success) {
            return successResponse(res, result.data, 'Benefit type created successfully', 201);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Update benefit type
    updateBenefitType = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const benefitTypeData = req.body;

        const benefitTypeResult = await BenefitType.findById(id);
        if (!benefitTypeResult.success || !benefitTypeResult.data) {
            return errorResponse(res, 'Benefit type not found', 404);
        }

        // Update properties
        Object.assign(benefitTypeResult.data, benefitTypeData);
        const result = await benefitTypeResult.data.save();

        if (result.success) {
            return successResponse(res, result.data, 'Benefit type updated successfully');
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Toggle benefit type active status
    toggleBenefitType = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const benefitTypeResult = await BenefitType.findById(id);
        if (!benefitTypeResult.success || !benefitTypeResult.data) {
            return errorResponse(res, 'Benefit type not found', 404);
        }

        const result = await benefitTypeResult.data.toggleActive();

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400);
    });

    // Delete benefit type
    deleteBenefitType = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const benefitTypeResult = await BenefitType.findById(id);
        if (!benefitTypeResult.success || !benefitTypeResult.data) {
            return errorResponse(res, 'Benefit type not found', 404);
        }

        const result = await benefitTypeResult.data.delete();

        if (result.success) {
            return successResponse(res, null, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // ===== BENEFIT CYCLES MANAGEMENT =====

    // Get all benefit cycles
    getAllBenefitCycles = asyncHandler(async (req, res) => {
        const filters = {
            benefit_type_id: req.query.benefit_type_id,
            cycle_year: req.query.cycle_year,
            status: req.query.status,
            category: req.query.category,
            search: req.query.search,
            from_date: req.query.from_date,
            to_date: req.query.to_date,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const [benefitCyclesResult, totalCount] = await Promise.all([
            BenefitCycle.findAll(filters),
            BenefitCycle.getCount(filters)
        ]);

        if (benefitCyclesResult.success) {
            return successResponse(res, {
                benefit_cycles: benefitCyclesResult.data,
                pagination: {
                    total: totalCount,
                    limit: parseInt(filters.limit),
                    offset: parseInt(filters.offset),
                    has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                }
            }, 'Benefit cycles retrieved successfully');
        }

        return errorResponse(res, 'Failed to retrieve benefit cycles', 500);
    });

    // Get specific benefit cycle
    getBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const benefitCycleResult = await BenefitCycle.findById(id);

        if (benefitCycleResult.success && benefitCycleResult.data) {
            return successResponse(res, benefitCycleResult.data, 'Benefit cycle retrieved successfully');
        }

        return errorResponse(res, 'Benefit cycle not found', 404);
    });

    // Create benefit cycle
    createBenefitCycle = asyncHandler(async (req, res) => {
        console.log('=== BENEFIT CYCLE CREATION DEBUG ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Session user:', req.session.user);
        console.log('Session user ID:', req.session.user?.id);

        // Validate session user exists
        if (!req.session.user || !req.session.user.id) {
            console.log('ERROR: No valid session user found');
            return errorResponse(res, 'Authentication required. Please log in again.', 401);
        }

        // Check if user exists in database
        const { executeQuery } = require('../config/database');
        const userCheckQuery = 'SELECT id, username FROM users WHERE id = ?';
        const userCheckResult = await executeQuery(userCheckQuery, [req.session.user.id]);

        if (!userCheckResult.success || userCheckResult.data.length === 0) {
            console.log('ERROR: Session user does not exist in database:', req.session.user.id);
            return errorResponse(res, 'User session is invalid. Please log in again.', 401);
        }

        console.log('User verified in database:', userCheckResult.data[0]);

        const benefitCycleData = {
            ...req.body,
            created_by: req.session.user.id
        };

        console.log('Final benefit cycle data:', JSON.stringify(benefitCycleData, null, 2));

        const benefitCycle = new BenefitCycle(benefitCycleData);
        console.log('BenefitCycle object created');

        const validation = benefitCycle.validate();
        console.log('Validation result:', validation);

        if (!validation.isValid) {
            console.log('Validation failed with errors:', validation.errors);
            return errorResponse(res, 'Validation failed', 400, validation.errors);
        }

        const result = await benefitCycle.save();
        console.log('Save result:', result);

        if (result.success) {
            return successResponse(res, result.data, 'Benefit cycle created successfully', 201);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Update benefit cycle
    updateBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const benefitCycleData = req.body;

        const benefitCycleResult = await BenefitCycle.findById(id);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        // Update properties
        Object.assign(benefitCycleResult.data, benefitCycleData);
        const result = await benefitCycleResult.data.save();

        if (result.success) {
            return successResponse(res, result.data, 'Benefit cycle updated successfully');
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Process benefit cycle
    processBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.session.user.id;

        const benefitCycleResult = await BenefitCycle.findById(id);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        const result = await benefitCycleResult.data.process(userId);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Finalize benefit cycle
    finalizeBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.session.user.id;

        const benefitCycleResult = await BenefitCycle.findById(id);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        const result = await benefitCycleResult.data.finalize(userId);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Release benefit cycle
    releaseBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.session.user.id;

        const benefitCycleResult = await BenefitCycle.findById(id);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        const result = await benefitCycleResult.data.release(userId);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Cancel benefit cycle
    cancelBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.session.user.id;

        const benefitCycleResult = await BenefitCycle.findById(id);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        const result = await benefitCycleResult.data.cancel(userId, reason);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Delete benefit cycle
    deleteBenefitCycle = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const benefitCycleResult = await BenefitCycle.findById(id);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        const result = await benefitCycleResult.data.delete();

        if (result.success) {
            return successResponse(res, null, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // ===== BENEFIT ITEMS MANAGEMENT =====

    // Get all benefit items
    getAllBenefitItems = asyncHandler(async (req, res) => {
        const filters = {
            benefit_cycle_id: req.query.benefit_cycle_id,
            employee_id: req.query.employee_id,
            status: req.query.status,
            is_eligible: req.query.is_eligible !== undefined ? req.query.is_eligible === 'true' : undefined,
            cycle_year: req.query.cycle_year,
            benefit_type_id: req.query.benefit_type_id,
            search: req.query.search,
            min_amount: req.query.min_amount,
            max_amount: req.query.max_amount,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const [benefitItemsResult, totalCount] = await Promise.all([
            BenefitItem.findAll(filters),
            BenefitItem.getCount(filters)
        ]);

        if (benefitItemsResult.success) {
            return successResponse(res, {
                benefit_items: benefitItemsResult.data,
                pagination: {
                    total: totalCount,
                    limit: parseInt(filters.limit),
                    offset: parseInt(filters.offset),
                    has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                }
            }, 'Benefit items retrieved successfully');
        }

        return errorResponse(res, 'Failed to retrieve benefit items', 500);
    });

    // Get benefit items for specific cycle
    getCycleBenefitItems = asyncHandler(async (req, res) => {
        const { cycleId } = req.params;
        const filters = {
            benefit_cycle_id: cycleId,
            status: req.query.status,
            is_eligible: req.query.is_eligible !== undefined ? req.query.is_eligible === 'true' : undefined,
            search: req.query.search,
            limit: req.query.limit || 100,
            offset: req.query.offset || 0
        };

        const [benefitItemsResult, totalCount] = await Promise.all([
            BenefitItem.findAll(filters),
            BenefitItem.getCount(filters)
        ]);

        if (benefitItemsResult.success) {
            return successResponse(res, {
                benefit_items: benefitItemsResult.data,
                pagination: {
                    total: totalCount,
                    limit: parseInt(filters.limit),
                    offset: parseInt(filters.offset),
                    has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                }
            }, 'Cycle benefit items retrieved successfully');
        }

        return errorResponse(res, 'Failed to retrieve cycle benefit items', 500);
    });

    // Get employee benefit items
    getEmployeeBenefitItems = asyncHandler(async (req, res) => {
        const { employeeId } = req.params;
        const filters = {
            employee_id: employeeId,
            cycle_year: req.query.cycle_year,
            status: req.query.status,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const [benefitItemsResult, totalCount] = await Promise.all([
            BenefitItem.findAll(filters),
            BenefitItem.getCount(filters)
        ]);

        if (benefitItemsResult.success) {
            return successResponse(res, {
                benefit_items: benefitItemsResult.data,
                pagination: {
                    total: totalCount,
                    limit: parseInt(filters.limit),
                    offset: parseInt(filters.offset),
                    has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                }
            }, 'Employee benefit items retrieved successfully');
        }

        return errorResponse(res, 'Failed to retrieve employee benefit items', 500);
    });

    // Get specific benefit item
    getBenefitItem = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const benefitItemResult = await BenefitItem.findById(id);

        if (benefitItemResult.success && benefitItemResult.data) {
            return successResponse(res, benefitItemResult.data, 'Benefit item retrieved successfully');
        }

        return errorResponse(res, 'Benefit item not found', 404);
    });

    // Calculate benefits for cycle
    calculateCycleBenefits = asyncHandler(async (req, res) => {
        const { cycleId } = req.params;
        const { employee_ids } = req.body; // Optional: specific employees

        // Get benefit cycle
        const benefitCycleResult = await BenefitCycle.findById(cycleId);
        if (!benefitCycleResult.success || !benefitCycleResult.data) {
            return errorResponse(res, 'Benefit cycle not found', 404);
        }

        const benefitCycle = benefitCycleResult.data;

        // Get benefit type
        const benefitTypeResult = await BenefitType.findById(benefitCycle.benefit_type_id);
        if (!benefitTypeResult.success || !benefitTypeResult.data) {
            return errorResponse(res, 'Benefit type not found', 404);
        }

        const benefitType = benefitTypeResult.data;

        try {
            let employees;
            
            if (employee_ids && Array.isArray(employee_ids)) {
                // Calculate for specific employees
                const employeePromises = employee_ids.map(id => Employee.findById(id));
                const employeeResults = await Promise.all(employeePromises);
                employees = employeeResults
                    .filter(result => result.success && result.data)
                    .map(result => result.data);
            } else {
                // Get eligible employees
                const eligibleResult = await benefitsCalculationService.getEligibleEmployees(
                    benefitType, 
                    benefitCycle.cutoff_date
                );
                
                if (!eligibleResult.success) {
                    return errorResponse(res, 'Failed to get eligible employees', 500);
                }
                
                employees = eligibleResult.data;
            }

            // Calculate benefits
            const calculations = await benefitsCalculationService.bulkCalculateBenefits(
                employees, 
                benefitType, 
                { cutoffDate: benefitCycle.cutoff_date }
            );

            // Create/update benefit items
            const benefitItems = [];
            for (const calc of calculations) {
                if (calc.success && calc.calculation) {
                    const benefitItemData = {
                        benefit_cycle_id: benefitCycle.id,
                        employee_id: calc.employee_id,
                        base_salary: calc.calculation.base_salary,
                        service_months: calc.calculation.service_months,
                        calculated_amount: calc.calculation.calculated_amount,
                        final_amount: calc.calculation.final_amount,
                        tax_amount: calc.calculation.tax_amount,
                        net_amount: calc.calculation.net_amount,
                        calculation_basis: calc.calculation.calculation_basis,
                        status: 'Calculated',
                        is_eligible: calc.calculation.is_eligible,
                        eligibility_notes: calc.calculation.eligibility_notes
                    };

                    const benefitItem = new BenefitItem(benefitItemData);
                    const saveResult = await benefitItem.save();
                    
                    if (saveResult.success) {
                        benefitItems.push(saveResult.data);
                    }
                }
            }

            // Update cycle statistics
            await benefitCycle.updateStatistics();

            // Generate summary
            const summary = benefitsCalculationService.generateCalculationSummary(calculations);

            return successResponse(res, {
                benefit_items: benefitItems,
                summary,
                calculations
            }, 'Benefits calculated successfully');

        } catch (error) {
            console.error('Calculate cycle benefits error:', error);
            return errorResponse(res, 'Failed to calculate benefits', 500);
        }
    });

    // Update benefit item
    updateBenefitItem = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const benefitItemData = req.body;

        const benefitItemResult = await BenefitItem.findById(id);
        if (!benefitItemResult.success || !benefitItemResult.data) {
            return errorResponse(res, 'Benefit item not found', 404);
        }

        // Update properties
        Object.assign(benefitItemResult.data, benefitItemData);
        const result = await benefitItemResult.data.save();

        if (result.success) {
            return successResponse(res, result.data, 'Benefit item updated successfully');
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Approve benefit item
    approveBenefitItem = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.session.user.id;

        const benefitItemResult = await BenefitItem.findById(id);
        if (!benefitItemResult.success || !benefitItemResult.data) {
            return errorResponse(res, 'Benefit item not found', 404);
        }

        const result = await benefitItemResult.data.approve(userId);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Mark benefit item as paid
    markBenefitItemAsPaid = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { payment_reference } = req.body;
        const userId = req.session.user.id;

        const benefitItemResult = await BenefitItem.findById(id);
        if (!benefitItemResult.success || !benefitItemResult.data) {
            return errorResponse(res, 'Benefit item not found', 404);
        }

        const result = await benefitItemResult.data.markAsPaid(userId, payment_reference);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400, result.details);
    });

    // Add adjustment to benefit item
    addBenefitItemAdjustment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { adjustment_type, amount, reason, description } = req.body;
        const userId = req.session.user.id;

        if (!adjustment_type || !amount || !reason) {
            return errorResponse(res, 'Adjustment type, amount, and reason are required', 400);
        }

        const benefitItemResult = await BenefitItem.findById(id);
        if (!benefitItemResult.success || !benefitItemResult.data) {
            return errorResponse(res, 'Benefit item not found', 404);
        }

        const result = await benefitItemResult.data.addAdjustment(
            adjustment_type, 
            amount, 
            reason, 
            userId, 
            description
        );

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400);
    });

    // Bulk approve benefit items
    bulkApproveBenefitItems = asyncHandler(async (req, res) => {
        const { item_ids } = req.body;
        const userId = req.session.user.id;

        if (!Array.isArray(item_ids) || item_ids.length === 0) {
            return errorResponse(res, 'Item IDs array is required', 400);
        }

        const result = await BenefitItem.bulkApprove(item_ids, userId);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400);
    });

    // Bulk mark as paid
    bulkMarkBenefitItemsAsPaid = asyncHandler(async (req, res) => {
        const { item_ids, payment_reference } = req.body;
        const userId = req.session.user.id;

        if (!Array.isArray(item_ids) || item_ids.length === 0) {
            return errorResponse(res, 'Item IDs array is required', 400);
        }

        const result = await BenefitItem.bulkMarkAsPaid(item_ids, userId, payment_reference);

        if (result.success) {
            return successResponse(res, result.data, result.message);
        }

        return errorResponse(res, result.error, 400);
    });

    // Get benefit statistics
    getBenefitStatistics = asyncHandler(async (req, res) => {
        const filters = {
            benefit_cycle_id: req.query.benefit_cycle_id,
            cycle_year: req.query.cycle_year
        };

        const statistics = await BenefitItem.getStatistics(filters);

        if (statistics) {
            return successResponse(res, statistics, 'Benefit statistics retrieved successfully');
        }

        return errorResponse(res, 'Failed to retrieve benefit statistics', 500);
    });

    // ===== UTILITY METHODS =====

    // Generate benefit slip
    generateBenefitSlip = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await benefitSlipService.generateBenefitSlip(id);

        if (result.success) {
            const { buffer, filename, mimeType } = result.data;
            
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            
            return res.send(buffer);
        }

        return errorResponse(res, result.error, 400);
    });

    // Bulk generate benefit slips
    bulkGenerateBenefitSlips = asyncHandler(async (req, res) => {
        const { item_ids } = req.body;

        if (!Array.isArray(item_ids) || item_ids.length === 0) {
            return errorResponse(res, 'Item IDs array is required', 400);
        }

        const result = await benefitSlipService.generateBulkBenefitSlips(item_ids);

        if (result.success) {
            return successResponse(res, result, 'Benefit slips generated successfully');
        }

        return successResponse(res, result, 'Benefit slip generation completed with some errors');
    });

    // Get eligible employees for benefit type
    getEligibleEmployees = asyncHandler(async (req, res) => {
        const { benefitTypeId } = req.params;
        const { cutoff_date } = req.query;

        const benefitTypeResult = await BenefitType.findById(benefitTypeId);
        if (!benefitTypeResult.success || !benefitTypeResult.data) {
            return errorResponse(res, 'Benefit type not found', 404);
        }

        const result = await benefitsCalculationService.getEligibleEmployees(
            benefitTypeResult.data,
            cutoff_date
        );

        if (result.success) {
            return successResponse(res, {
                eligible_employees: result.data,
                count: result.data.length
            }, 'Eligible employees retrieved successfully');
        }

        return errorResponse(res, result.error, 500);
    });

    // Preview benefit calculation
    previewBenefitCalculation = asyncHandler(async (req, res) => {
        const { benefitTypeId } = req.params;
        const { employee_id, cutoff_date } = req.body;

        if (!employee_id) {
            return errorResponse(res, 'Employee ID is required', 400);
        }

        // Get benefit type
        const benefitTypeResult = await BenefitType.findById(benefitTypeId);
        if (!benefitTypeResult.success || !benefitTypeResult.data) {
            return errorResponse(res, 'Benefit type not found', 404);
        }

        // Get employee
        const employeeResult = await Employee.findById(employee_id);
        if (!employeeResult.success || !employeeResult.data) {
            return errorResponse(res, 'Employee not found', 404);
        }

        // Calculate benefit
        const calculation = await benefitsCalculationService.calculateBenefitAmount(
            employeeResult.data,
            benefitTypeResult.data,
            { cutoffDate: cutoff_date }
        );

        if (calculation.success) {
            return successResponse(res, calculation.data, 'Benefit calculation preview generated');
        }

        return errorResponse(res, calculation.error, 500);
    });
}

module.exports = new BenefitsController();