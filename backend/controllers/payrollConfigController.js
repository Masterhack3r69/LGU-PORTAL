// controllers/payrollConfigController.js - Allowance and deduction type management controller
const AllowanceType = require('../models/Payroll/AllowanceType');
const DeductionType = require('../models/Payroll/DeductionType');
const PayrollOverrideService = require('../services/payrollOverrideService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class PayrollConfigController {
    constructor() {
        this.overrideService = new PayrollOverrideService();
        
        // Bind all methods to preserve 'this' context
        this.getAllowanceTypes = this.getAllowanceTypes.bind(this);
        this.getAllowanceType = this.getAllowanceType.bind(this);
        this.createAllowanceType = this.createAllowanceType.bind(this);
        this.updateAllowanceType = this.updateAllowanceType.bind(this);
        this.deleteAllowanceType = this.deleteAllowanceType.bind(this);
        this.toggleAllowanceType = this.toggleAllowanceType.bind(this);
        this.getDeductionTypes = this.getDeductionTypes.bind(this);
        this.getDeductionType = this.getDeductionType.bind(this);
        this.createDeductionType = this.createDeductionType.bind(this);
        this.updateDeductionType = this.updateDeductionType.bind(this);
        this.deleteDeductionType = this.deleteDeductionType.bind(this);
        this.toggleDeductionType = this.toggleDeductionType.bind(this);
        this.getAllOverrides = this.getAllOverrides.bind(this);
        this.getEmployeeOverrides = this.getEmployeeOverrides.bind(this);
        this.createAllowanceOverride = this.createAllowanceOverride.bind(this);
        this.createDeductionOverride = this.createDeductionOverride.bind(this);
        this.updateAllowanceOverride = this.updateAllowanceOverride.bind(this);
        this.updateDeductionOverride = this.updateDeductionOverride.bind(this);
        this.deleteAllowanceOverride = this.deleteAllowanceOverride.bind(this);
        this.deleteDeductionOverride = this.deleteDeductionOverride.bind(this);
        this.getEmployeeOverrideSummary = this.getEmployeeOverrideSummary.bind(this);
        this.bulkCreateAllowanceOverrides = this.bulkCreateAllowanceOverrides.bind(this);
        this.bulkCreateDeductionOverrides = this.bulkCreateDeductionOverrides.bind(this);
        this.getConfigurationStatistics = this.getConfigurationStatistics.bind(this);
    }

    // ===== ALLOWANCE TYPES =====

    // Get all allowance types
    async getAllowanceTypes(req, res) {
        try {
            const filters = {
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
                calculation_type: req.query.calculation_type,
                frequency: req.query.frequency,
                is_taxable: req.query.is_taxable !== undefined ? req.query.is_taxable === 'true' : undefined,
                search: req.query.search,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const allowanceTypesResult = await AllowanceType.findAll(filters);
            const totalCount = await AllowanceType.getCount(filters);

            if (allowanceTypesResult.success) {
                return successResponse(res, {
                    allowance_types: allowanceTypesResult.data,
                    pagination: {
                        total: totalCount,
                        limit: parseInt(filters.limit),
                        offset: parseInt(filters.offset),
                        has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                    }
                }, 'Allowance types retrieved successfully');
            }

            return errorResponse(res, 'Failed to retrieve allowance types', 500);

        } catch (error) {
            console.error('Get allowance types error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get specific allowance type
    async getAllowanceType(req, res) {
        try {
            const { id } = req.params;
            const allowanceTypeResult = await AllowanceType.findById(id);

            if (allowanceTypeResult.success && allowanceTypeResult.data) {
                return successResponse(res, allowanceTypeResult.data, 'Allowance type retrieved successfully');
            }

            return errorResponse(res, 'Allowance type not found', 404);

        } catch (error) {
            console.error('Get allowance type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Create allowance type
    async createAllowanceType(req, res) {
        try {
            const allowanceTypeData = req.body;
            const allowanceType = new AllowanceType(allowanceTypeData);

            const result = await allowanceType.save();

            if (result.success) {
                return successResponse(res, result.data, 'Allowance type created successfully', 201);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Create allowance type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update allowance type
    async updateAllowanceType(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const allowanceTypeResult = await AllowanceType.findById(id);
            if (!allowanceTypeResult.success || !allowanceTypeResult.data) {
                return errorResponse(res, 'Allowance type not found', 404);
            }

            const allowanceType = allowanceTypeResult.data;
            Object.assign(allowanceType, updateData);

            const result = await allowanceType.update();

            if (result.success) {
                return successResponse(res, result.data, 'Allowance type updated successfully');
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Update allowance type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Delete allowance type
    async deleteAllowanceType(req, res) {
        try {
            const { id } = req.params;
            const result = await AllowanceType.delete(id);

            if (result.success) {
                return successResponse(res, null, result.message || 'Allowance type deleted successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Delete allowance type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Toggle allowance type active status
    async toggleAllowanceType(req, res) {
        try {
            const { id } = req.params;

            const allowanceTypeResult = await AllowanceType.findById(id);
            if (!allowanceTypeResult.success || !allowanceTypeResult.data) {
                return errorResponse(res, 'Allowance type not found', 404);
            }

            const allowanceType = allowanceTypeResult.data;
            const result = await allowanceType.toggleActive();

            if (result.success) {
                const status = result.data.is_active ? 'activated' : 'deactivated';
                return successResponse(res, result.data, `Allowance type ${status} successfully`);
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Toggle allowance type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // ===== DEDUCTION TYPES =====

    // Get all deduction types
    async getDeductionTypes(req, res) {
        try {
            const filters = {
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
                is_mandatory: req.query.is_mandatory !== undefined ? req.query.is_mandatory === 'true' : undefined,
                calculation_type: req.query.calculation_type,
                frequency: req.query.frequency,
                search: req.query.search,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const deductionTypesResult = await DeductionType.findAll(filters);
            const totalCount = await DeductionType.getCount(filters);

            if (deductionTypesResult.success) {
                return successResponse(res, {
                    deduction_types: deductionTypesResult.data,
                    pagination: {
                        total: totalCount,
                        limit: parseInt(filters.limit),
                        offset: parseInt(filters.offset),
                        has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                    }
                }, 'Deduction types retrieved successfully');
            }

            return errorResponse(res, 'Failed to retrieve deduction types', 500);

        } catch (error) {
            console.error('Get deduction types error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get specific deduction type
    async getDeductionType(req, res) {
        try {
            const { id } = req.params;
            const deductionTypeResult = await DeductionType.findById(id);

            if (deductionTypeResult.success && deductionTypeResult.data) {
                return successResponse(res, deductionTypeResult.data, 'Deduction type retrieved successfully');
            }

            return errorResponse(res, 'Deduction type not found', 404);

        } catch (error) {
            console.error('Get deduction type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Create deduction type
    async createDeductionType(req, res) {
        try {
            const deductionTypeData = req.body;
            const deductionType = new DeductionType(deductionTypeData);

            const result = await deductionType.save();

            if (result.success) {
                return successResponse(res, result.data, 'Deduction type created successfully', 201);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Create deduction type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update deduction type
    async updateDeductionType(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const deductionTypeResult = await DeductionType.findById(id);
            if (!deductionTypeResult.success || !deductionTypeResult.data) {
                return errorResponse(res, 'Deduction type not found', 404);
            }

            const deductionType = deductionTypeResult.data;
            Object.assign(deductionType, updateData);

            const result = await deductionType.update();

            if (result.success) {
                return successResponse(res, result.data, 'Deduction type updated successfully');
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Update deduction type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Delete deduction type
    async deleteDeductionType(req, res) {
        try {
            const { id } = req.params;
            const result = await DeductionType.delete(id);

            if (result.success) {
                return successResponse(res, null, result.message || 'Deduction type deleted successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Delete deduction type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Toggle deduction type active status
    async toggleDeductionType(req, res) {
        try {
            const { id } = req.params;

            const deductionTypeResult = await DeductionType.findById(id);
            if (!deductionTypeResult.success || !deductionTypeResult.data) {
                return errorResponse(res, 'Deduction type not found', 404);
            }

            const deductionType = deductionTypeResult.data;
            const result = await deductionType.toggleActive();

            if (result.success) {
                const status = result.data.is_active ? 'activated' : 'deactivated';
                return successResponse(res, result.data, `Deduction type ${status} successfully`);
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Toggle deduction type error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // ===== EMPLOYEE OVERRIDES =====

    // Get all overrides (for management)
    async getAllOverrides(req, res) {
        try {
            const filters = {
                employee_id: req.query.employee_id,
                type: req.query.type,
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
                search: req.query.search,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const result = await this.overrideService.getAllOverrides(filters);

            if (result.success) {
                return successResponse(res, result.data, 'Overrides retrieved successfully');
            }

            return errorResponse(res, result.error, 500);

        } catch (error) {
            console.error('Get all overrides error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get employee overrides
    async getEmployeeOverrides(req, res) {
        try {
            const { employeeId } = req.params;
            const filters = {
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined
            };

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.getEmployeeOverrides(employeeId, filters);

            if (result.success) {
                return successResponse(res, result.data, 'Employee overrides retrieved successfully');
            }

            return errorResponse(res, result.error, 500);

        } catch (error) {
            console.error('Get employee overrides error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Create allowance override
    async createAllowanceOverride(req, res) {
        try {
            const overrideData = req.body;
            const userId = req.session.user.id;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.createAllowanceOverride(overrideData, userId);

            if (result.success) {
                return successResponse(res, result.data, result.message, 201);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Create allowance override error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Create deduction override
    async createDeductionOverride(req, res) {
        try {
            const overrideData = req.body;
            const userId = req.session.user.id;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.createDeductionOverride(overrideData, userId);

            if (result.success) {
                return successResponse(res, result.data, result.message, 201);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Create deduction override error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update allowance override
    async updateAllowanceOverride(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.session.user.id;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.updateAllowanceOverride(id, updateData, userId);

            if (result.success) {
                return successResponse(res, result.data, result.message);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Update allowance override error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update deduction override
    async updateDeductionOverride(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.session.user.id;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.updateDeductionOverride(id, updateData, userId);

            if (result.success) {
                return successResponse(res, result.data, result.message);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Update deduction override error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Delete allowance override
    async deleteAllowanceOverride(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.deleteAllowanceOverride(id, userId);

            if (result.success) {
                return successResponse(res, null, result.message);
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Delete allowance override error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Delete deduction override
    async deleteDeductionOverride(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.deleteDeductionOverride(id, userId);

            if (result.success) {
                return successResponse(res, null, result.message);
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Delete deduction override error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get employee override summary
    async getEmployeeOverrideSummary(req, res) {
        try {
            const { employeeId } = req.params;

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.getEmployeeOverrideSummary(employeeId);

            if (result.success) {
                return successResponse(res, result.data, 'Employee override summary retrieved successfully');
            }

            return errorResponse(res, result.error, 500);

        } catch (error) {
            console.error('Get employee override summary error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Bulk create allowance overrides
    async bulkCreateAllowanceOverrides(req, res) {
        try {
            const { overrides } = req.body;
            const userId = req.session.user.id;

            if (!overrides || !Array.isArray(overrides)) {
                return errorResponse(res, 'Invalid overrides data', 400);
            }

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.bulkCreateAllowanceOverrides(overrides, userId);

            if (result.success) {
                return successResponse(res, result.data, 'Bulk allowance overrides created successfully');
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Bulk create allowance overrides error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Bulk create deduction overrides
    async bulkCreateDeductionOverrides(req, res) {
        try {
            const { overrides } = req.body;
            const userId = req.session.user.id;

            if (!overrides || !Array.isArray(overrides)) {
                return errorResponse(res, 'Invalid overrides data', 400);
            }

            // Ensure service is available
            if (!this.overrideService) {
                this.overrideService = new PayrollOverrideService();
            }

            const result = await this.overrideService.bulkCreateDeductionOverrides(overrides, userId);

            if (result.success) {
                return successResponse(res, result.data, 'Bulk deduction overrides created successfully');
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Bulk create deduction overrides error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get configuration statistics
    async getConfigurationStatistics(req, res) {
        try {
            const allowanceStatsResult = await AllowanceType.getStatistics();
            const deductionStatsResult = await DeductionType.getStatistics();

            const statistics = {
                allowance_types: allowanceStatsResult.success ? allowanceStatsResult.data : {},
                deduction_types: deductionStatsResult.success ? deductionStatsResult.data : {},
                summary: {
                    total_allowance_types: (allowanceStatsResult.data?.active || 0) + (allowanceStatsResult.data?.inactive || 0),
                    total_deduction_types: (deductionStatsResult.data?.active || 0) + (deductionStatsResult.data?.inactive || 0),
                    active_allowance_types: allowanceStatsResult.data?.active || 0,
                    active_deduction_types: deductionStatsResult.data?.active || 0,
                    mandatory_deduction_types: deductionStatsResult.data?.mandatory || 0
                }
            };

            return successResponse(res, statistics, 'Configuration statistics retrieved successfully');

        } catch (error) {
            console.error('Get configuration statistics error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }
}

module.exports = new PayrollConfigController();