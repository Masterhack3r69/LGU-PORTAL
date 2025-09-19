// services/payrollOverrideService.js - Employee override management service
const { EmployeeAllowanceOverride, EmployeeDeductionOverride } = require('../models/Payroll/EmployeeOverride');
const { executeQuery, executeTransaction } = require('../config/database');
const { logPayrollAudit } = require('../middleware/payrollAudit');

class PayrollOverrideService {
    constructor() {
        this.maxOverridePercentage = 500; // Maximum 500% of default amount
        this.minOverrideAmount = 0;
    }

    // Get all overrides with filtering (for management)
    async getAllOverrides(filters = {}) {
        try {
            const results = {
                overrides: [],
                pagination: {
                    total: 0,
                    limit: parseInt(filters.limit) || 50,
                    offset: parseInt(filters.offset) || 0
                }
            };

            // Get allowance overrides
            const allowanceOverrides = await EmployeeAllowanceOverride.findAll({
                employee_id: filters.employee_id,
                is_active: filters.is_active,
                limit: filters.type === 'allowance' ? filters.limit : undefined,
                offset: filters.type === 'allowance' ? filters.offset : 0,
                search: filters.search
            });

            // Get deduction overrides
            const deductionOverrides = await EmployeeDeductionOverride.findAll({
                employee_id: filters.employee_id,
                is_active: filters.is_active,
                limit: filters.type === 'deduction' ? filters.limit : undefined,
                offset: filters.type === 'deduction' ? filters.offset : 0,
                search: filters.search
            });

            let allOverrides = [];

            if (!filters.type || filters.type === 'allowance') {
                if (allowanceOverrides.success) {
                    const allowanceData = allowanceOverrides.data.map(override => ({
                        ...override,
                        type: 'allowance'
                    }));
                    allOverrides = allOverrides.concat(allowanceData);
                }
            }

            if (!filters.type || filters.type === 'deduction') {
                if (deductionOverrides.success) {
                    const deductionData = deductionOverrides.data.map(override => ({
                        ...override,
                        type: 'deduction'
                    }));
                    allOverrides = allOverrides.concat(deductionData);
                }
            }

            // Apply search filter if needed
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                allOverrides = allOverrides.filter(override => 
                    override.employee?.full_name?.toLowerCase().includes(searchLower) ||
                    override.allowance_type?.name?.toLowerCase().includes(searchLower) ||
                    override.deduction_type?.name?.toLowerCase().includes(searchLower)
                );
            }

            // Apply pagination to combined results
            const start = parseInt(filters.offset) || 0;
            const limit = parseInt(filters.limit) || 50;
            const paginatedOverrides = allOverrides.slice(start, start + limit);

            results.overrides = paginatedOverrides;
            results.pagination.total = allOverrides.length;

            return {
                success: true,
                data: results
            };

        } catch (error) {
            return {
                success: false,
                error: 'Failed to retrieve overrides',
                details: error.message
            };
        }
    }

    // Create allowance override for employee
    async createAllowanceOverride(overrideData, userId) {
        try {
            // Validate override data
            const validation = this.validateAllowanceOverride(overrideData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                };
            }

            // Check for existing active override
            const existingOverride = await this.getActiveAllowanceOverride(
                overrideData.employee_id,
                overrideData.allowance_type_id
            );

            if (existingOverride.success && existingOverride.data) {
                // Deactivate existing override if new one starts immediately
                if (overrideData.effective_date <= new Date().toISOString().split('T')[0]) {
                    await this.deactivateAllowanceOverride(existingOverride.data.id, userId);
                }
            }

            // Create new override
            const override = new EmployeeAllowanceOverride({
                ...overrideData,
                created_by: userId
            });

            const result = await override.save();

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'CREATE_ALLOWANCE_OVERRIDE',
                    tableName: 'employee_allowance_overrides',
                    recordId: result.data.id,
                    newValues: overrideData,
                    ipAddress: 'system',
                    userAgent: 'system'
                });

                return {
                    success: true,
                    data: result.data,
                    message: 'Allowance override created successfully'
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to create allowance override',
                details: error.message
            };
        }
    }

    // Create deduction override for employee
    async createDeductionOverride(overrideData, userId) {
        try {
            // Validate override data
            const validation = this.validateDeductionOverride(overrideData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                };
            }

            // Check for existing active override
            const existingOverride = await this.getActiveDeductionOverride(
                overrideData.employee_id,
                overrideData.deduction_type_id
            );

            if (existingOverride.success && existingOverride.data) {
                // Deactivate existing override if new one starts immediately
                if (overrideData.effective_date <= new Date().toISOString().split('T')[0]) {
                    await this.deactivateDeductionOverride(existingOverride.data.id, userId);
                }
            }

            // Create new override
            const override = new EmployeeDeductionOverride({
                ...overrideData,
                created_by: userId
            });

            const result = await override.save();

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'CREATE_DEDUCTION_OVERRIDE',
                    tableName: 'employee_deduction_overrides',
                    recordId: result.data.id,
                    newValues: overrideData,
                    ipAddress: 'system',
                    userAgent: 'system'
                });

                return {
                    success: true,
                    data: result.data,
                    message: 'Deduction override created successfully'
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to create deduction override',
                details: error.message
            };
        }
    }

    // Update allowance override
    async updateAllowanceOverride(overrideId, updateData, userId) {
        try {
            const override = await EmployeeAllowanceOverride.findById(overrideId);
            if (!override.success || !override.data) {
                return {
                    success: false,
                    error: 'Allowance override not found'
                };
            }

            const oldValues = { ...override.data };

            // Update override properties
            Object.assign(override.data, updateData);

            // Validate updated data
            const validation = this.validateAllowanceOverride(override.data);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                };
            }

            const result = await override.data.update();

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'UPDATE_ALLOWANCE_OVERRIDE',
                    tableName: 'employee_allowance_overrides',
                    recordId: overrideId,
                    oldValues: oldValues,
                    newValues: updateData,
                    ipAddress: 'system',
                    userAgent: 'system'
                });

                return {
                    success: true,
                    data: result.data,
                    message: 'Allowance override updated successfully'
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to update allowance override',
                details: error.message
            };
        }
    }

    // Update deduction override
    async updateDeductionOverride(overrideId, updateData, userId) {
        try {
            const override = await EmployeeDeductionOverride.findById(overrideId);
            if (!override.success || !override.data) {
                return {
                    success: false,
                    error: 'Deduction override not found'
                };
            }

            const oldValues = { ...override.data };

            // Update override properties
            Object.assign(override.data, updateData);

            // Validate updated data
            const validation = this.validateDeductionOverride(override.data);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                };
            }

            const result = await override.data.update();

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'UPDATE_DEDUCTION_OVERRIDE',
                    tableName: 'employee_deduction_overrides',
                    recordId: overrideId,
                    oldValues: oldValues,
                    newValues: updateData,
                    ipAddress: 'system',
                    userAgent: 'system'
                });

                return {
                    success: true,
                    data: result.data,
                    message: 'Deduction override updated successfully'
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to update deduction override',
                details: error.message
            };
        }
    }

    // Deactivate allowance override
    async deactivateAllowanceOverride(overrideId, userId) {
        try {
            const result = await this.updateAllowanceOverride(overrideId, { 
                is_active: false,
                end_date: new Date().toISOString().split('T')[0]
            }, userId);

            if (result.success) {
                result.message = 'Allowance override deactivated successfully';
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to deactivate allowance override',
                details: error.message
            };
        }
    }

    // Deactivate deduction override
    async deactivateDeductionOverride(overrideId, userId) {
        try {
            const result = await this.updateDeductionOverride(overrideId, { 
                is_active: false,
                end_date: new Date().toISOString().split('T')[0]
            }, userId);

            if (result.success) {
                result.message = 'Deduction override deactivated successfully';
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to deactivate deduction override',
                details: error.message
            };
        }
    }

    // Get active allowance override for employee
    async getActiveAllowanceOverride(employeeId, allowanceTypeId, date = new Date()) {
        try {
            return await EmployeeAllowanceOverride.getActiveOverride(
                employeeId, 
                allowanceTypeId, 
                date
            );
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get active allowance override',
                details: error.message
            };
        }
    }

    // Get active deduction override for employee
    async getActiveDeductionOverride(employeeId, deductionTypeId, date = new Date()) {
        try {
            return await EmployeeDeductionOverride.getActiveOverride(
                employeeId, 
                deductionTypeId, 
                date
            );
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get active deduction override',
                details: error.message
            };
        }
    }

    // Get all overrides for employee
    async getEmployeeOverrides(employeeId, filters = {}) {
        try {
            const allowanceOverrides = await EmployeeAllowanceOverride.findByEmployee(
                employeeId, 
                filters
            );
            const deductionOverrides = await EmployeeDeductionOverride.findByEmployee(
                employeeId, 
                filters
            );

            return {
                success: true,
                data: {
                    allowance_overrides: allowanceOverrides.success ? allowanceOverrides.data : [],
                    deduction_overrides: deductionOverrides.success ? deductionOverrides.data : []
                }
            };

        } catch (error) {
            return {
                success: false,
                error: 'Failed to get employee overrides',
                details: error.message
            };
        }
    }

    // Bulk create allowance overrides
    async bulkCreateAllowanceOverrides(overrideDataArray, userId) {
        try {
            return await executeTransaction(async (connection) => {
                const results = [];
                const errors = [];

                for (const overrideData of overrideDataArray) {
                    try {
                        const result = await this.createAllowanceOverride(overrideData, userId);
                        if (result.success) {
                            results.push(result.data);
                        } else {
                            errors.push({
                                employee_id: overrideData.employee_id,
                                allowance_type_id: overrideData.allowance_type_id,
                                error: result.error,
                                details: result.details
                            });
                        }
                    } catch (error) {
                        errors.push({
                            employee_id: overrideData.employee_id,
                            allowance_type_id: overrideData.allowance_type_id,
                            error: error.message
                        });
                    }
                }

                return {
                    success: true,
                    data: {
                        successful_overrides: results,
                        failed_overrides: errors,
                        summary: {
                            total_requested: overrideDataArray.length,
                            successful_count: results.length,
                            failed_count: errors.length
                        }
                    }
                };
            });

        } catch (error) {
            return {
                success: false,
                error: 'Failed to bulk create allowance overrides',
                details: error.message
            };
        }
    }

    // Bulk create deduction overrides
    async bulkCreateDeductionOverrides(overrideDataArray, userId) {
        try {
            return await executeTransaction(async (connection) => {
                const results = [];
                const errors = [];

                for (const overrideData of overrideDataArray) {
                    try {
                        const result = await this.createDeductionOverride(overrideData, userId);
                        if (result.success) {
                            results.push(result.data);
                        } else {
                            errors.push({
                                employee_id: overrideData.employee_id,
                                deduction_type_id: overrideData.deduction_type_id,
                                error: result.error,
                                details: result.details
                            });
                        }
                    } catch (error) {
                        errors.push({
                            employee_id: overrideData.employee_id,
                            deduction_type_id: overrideData.deduction_type_id,
                            error: error.message
                        });
                    }
                }

                return {
                    success: true,
                    data: {
                        successful_overrides: results,
                        failed_overrides: errors,
                        summary: {
                            total_requested: overrideDataArray.length,
                            successful_count: results.length,
                            failed_count: errors.length
                        }
                    }
                };
            });

        } catch (error) {
            return {
                success: false,
                error: 'Failed to bulk create deduction overrides',
                details: error.message
            };
        }
    }

    // Delete allowance override
    async deleteAllowanceOverride(overrideId, userId) {
        try {
            // Get override for audit
            const override = await EmployeeAllowanceOverride.findById(overrideId);
            if (!override.success || !override.data) {
                return {
                    success: false,
                    error: 'Allowance override not found'
                };
            }

            const oldValues = { ...override.data };

            // Delete override
            const result = await EmployeeAllowanceOverride.delete(overrideId);

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'DELETE_ALLOWANCE_OVERRIDE',
                    tableName: 'employee_allowance_overrides',
                    recordId: overrideId,
                    oldValues: oldValues,
                    ipAddress: 'system',
                    userAgent: 'system'
                });

                return {
                    success: true,
                    message: 'Allowance override deleted successfully'
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to delete allowance override',
                details: error.message
            };
        }
    }

    // Delete deduction override
    async deleteDeductionOverride(overrideId, userId) {
        try {
            // Get override for audit
            const override = await EmployeeDeductionOverride.findById(overrideId);
            if (!override.success || !override.data) {
                return {
                    success: false,
                    error: 'Deduction override not found'
                };
            }

            const oldValues = { ...override.data };

            // Delete override
            const result = await EmployeeDeductionOverride.delete(overrideId);

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'DELETE_DEDUCTION_OVERRIDE',
                    tableName: 'employee_deduction_overrides',
                    recordId: overrideId,
                    oldValues: oldValues,
                    ipAddress: 'system',
                    userAgent: 'system'
                });

                return {
                    success: true,
                    message: 'Deduction override deleted successfully'
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: 'Failed to delete deduction override',
                details: error.message
            };
        }
    }

    // Validate allowance override data
    validateAllowanceOverride(overrideData) {
        const errors = [];

        // Required fields
        if (!overrideData.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!overrideData.allowance_type_id) {
            errors.push('Allowance type ID is required');
        }

        if (!overrideData.override_amount && overrideData.override_amount !== 0) {
            errors.push('Override amount is required');
        }

        if (!overrideData.effective_date) {
            errors.push('Effective date is required');
        }

        // Amount validation
        if (overrideData.override_amount < this.minOverrideAmount) {
            errors.push(`Override amount must be at least ₱${this.minOverrideAmount}`);
        }

        // Date validation
        if (overrideData.effective_date && overrideData.end_date) {
            const effectiveDate = new Date(overrideData.effective_date);
            const endDate = new Date(overrideData.end_date);

            if (endDate <= effectiveDate) {
                errors.push('End date must be after effective date');
            }
        }

        // Future date validation
        if (overrideData.effective_date) {
            const effectiveDate = new Date(overrideData.effective_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (effectiveDate < today) {
                errors.push('Effective date cannot be in the past');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate deduction override data
    validateDeductionOverride(overrideData) {
        const errors = [];

        // Required fields
        if (!overrideData.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!overrideData.deduction_type_id) {
            errors.push('Deduction type ID is required');
        }

        if (!overrideData.override_amount && overrideData.override_amount !== 0) {
            errors.push('Override amount is required');
        }

        if (!overrideData.effective_date) {
            errors.push('Effective date is required');
        }

        // Amount validation
        if (overrideData.override_amount < this.minOverrideAmount) {
            errors.push(`Override amount must be at least ₱${this.minOverrideAmount}`);
        }

        // Date validation
        if (overrideData.effective_date && overrideData.end_date) {
            const effectiveDate = new Date(overrideData.effective_date);
            const endDate = new Date(overrideData.end_date);

            if (endDate <= effectiveDate) {
                errors.push('End date must be after effective date');
            }
        }

        // Future date validation
        if (overrideData.effective_date) {
            const effectiveDate = new Date(overrideData.effective_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (effectiveDate < today) {
                errors.push('Effective date cannot be in the past');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get override summary for employee
    async getEmployeeOverrideSummary(employeeId) {
        try {
            const allowanceOverrides = await EmployeeAllowanceOverride.findByEmployee(
                employeeId, 
                { is_active: true }
            );
            const deductionOverrides = await EmployeeDeductionOverride.findByEmployee(
                employeeId, 
                { is_active: true }
            );

            const summary = {
                employee_id: employeeId,
                active_allowance_overrides: allowanceOverrides.success ? allowanceOverrides.data.length : 0,
                active_deduction_overrides: deductionOverrides.success ? deductionOverrides.data.length : 0,
                total_allowance_override_amount: 0,
                total_deduction_override_amount: 0,
                overrides: {
                    allowances: allowanceOverrides.success ? allowanceOverrides.data : [],
                    deductions: deductionOverrides.success ? deductionOverrides.data : []
                }
            };

            // Calculate totals
            if (allowanceOverrides.success) {
                summary.total_allowance_override_amount = allowanceOverrides.data
                    .reduce((sum, override) => sum + (override.override_amount || 0), 0);
            }

            if (deductionOverrides.success) {
                summary.total_deduction_override_amount = deductionOverrides.data
                    .reduce((sum, override) => sum + (override.override_amount || 0), 0);
            }

            return {
                success: true,
                data: summary
            };

        } catch (error) {
            return {
                success: false,
                error: 'Failed to get employee override summary',
                details: error.message
            };
        }
    }
}

module.exports = PayrollOverrideService;