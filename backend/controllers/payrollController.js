// controllers/payrollController.js - Main payroll period management controller
const PayrollPeriod = require('../models/Payroll/PayrollPeriod');
const PayrollItem = require('../models/Payroll/PayrollItem');
const Employee = require('../models/Employee');
const PayrollCalculationEngine = require('../utils/payrollCalculations');
const PayrollValidationEngine = require('../utils/payrollValidation');
const { logPayrollAudit } = require('../middleware/payrollAudit');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class PayrollController {
    constructor() {
        this.calculationEngine = new PayrollCalculationEngine();
        this.validationEngine = new PayrollValidationEngine();
    }

    // Get all payroll periods
    async getAllPeriods(req, res) {
        try {
            const filters = {
                year: req.query.year,
                month: req.query.month,
                status: req.query.status,
                year_from: req.query.year_from,
                year_to: req.query.year_to,
                limit: req.query.limit || 20,
                offset: req.query.offset || 0
            };

            const periodsResult = await PayrollPeriod.findAll(filters);
            const totalCount = await PayrollPeriod.getCount(filters);

            if (periodsResult.success) {
                return successResponse(res, {
                    periods: periodsResult.data,
                    pagination: {
                        total: totalCount,
                        limit: parseInt(filters.limit),
                        offset: parseInt(filters.offset),
                        has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                    }
                }, 'Payroll periods retrieved successfully');
            }

            return errorResponse(res, 'Failed to retrieve payroll periods', 500);

        } catch (error) {
            console.error('Get payroll periods error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get specific payroll period
    async getPeriod(req, res) {
        try {
            const { id } = req.params;
            const periodResult = await PayrollPeriod.findById(id);

            if (periodResult.success && periodResult.data) {
                return successResponse(res, periodResult.data, 'Payroll period retrieved successfully');
            }

            return errorResponse(res, 'Payroll period not found', 404);

        } catch (error) {
            console.error('Get payroll period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Create new payroll period
    async createPeriod(req, res) {
        try {
            const { year, month, period_number, start_date, end_date, pay_date } = req.body;
            const userId = req.session.user.id;

            // Validate period data
            const validation = await this.validationEngine.validatePayrollPeriod(req.body);
            if (!validation.isValid) {
                return errorResponse(res, 'Validation failed', 400, validation.errors);
            }

            // Create period
            const period = new PayrollPeriod({
                year,
                month,
                period_number,
                start_date,
                end_date,
                pay_date,
                status: 'Draft',
                created_by: userId
            });

            const result = await period.save();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll period created successfully', 201);
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Create payroll period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update payroll period
    async updatePeriod(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return errorResponse(res, 'Payroll period not found', 404);
            }

            const period = periodResult.data;

            // Check if period can be edited
            if (!period.canEdit()) {
                return errorResponse(res, `Cannot edit payroll period with status: ${period.status}`, 400);
            }

            // Update period properties
            Object.assign(period, req.body);

            // Validate updated data
            const validation = await this.validationEngine.validatePayrollPeriod(period);
            if (!validation.isValid) {
                return errorResponse(res, 'Validation failed', 400, validation.errors);
            }

            const result = await period.update();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll period updated successfully');
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Update payroll period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Delete payroll period
    async deletePeriod(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            const result = await PayrollPeriod.delete(id);

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'DELETE_PAYROLL_PERIOD',
                    tableName: 'payroll_periods',
                    recordId: id,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return successResponse(res, null, 'Payroll period deleted successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Delete payroll period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Finalize payroll period
    async finalizePeriod(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            // Validate period can be finalized
            const validation = await this.validationEngine.validatePeriodFinalization(id);
            if (!validation.isValid) {
                return errorResponse(res, 'Cannot finalize period', 400, validation.errors);
            }

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return errorResponse(res, 'Payroll period not found', 404);
            }

            const period = periodResult.data;
            const result = await period.finalize(userId);

            if (result.success) {
                return successResponse(res, result.data, 'Payroll period finalized successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Finalize payroll period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Reopen payroll period
    async reopenPeriod(req, res) {
        try {
            const { id } = req.params;

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return errorResponse(res, 'Payroll period not found', 404);
            }

            const period = periodResult.data;
            const result = await period.reopen();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll period reopened successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Reopen payroll period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Mark period as paid
    async markPeriodAsPaid(req, res) {
        try {
            const { id } = req.params;

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return errorResponse(res, 'Payroll period not found', 404);
            }

            const period = periodResult.data;
            const result = await period.markAsPaid();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll period marked as paid successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Mark period as paid error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get employees for period processing
    async getPeriodEmployees(req, res) {
        try {
            const { id } = req.params;
            const { search, status, limit = 50, offset = 0 } = req.query;

            // Get period
            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return errorResponse(res, 'Payroll period not found', 404);
            }

            // Get employees
            const employeeFilters = {
                employment_status: 'Active',
                search: search,
                limit: limit,
                offset: offset
            };

            const employeesResult = await Employee.findAll(employeeFilters);
            if (!employeesResult.success) {
                return errorResponse(res, 'Failed to retrieve employees', 500);
            }

            // Get existing payroll items for this period
            const payrollItemsResult = await PayrollItem.findByPeriod(id);
            const existingItems = payrollItemsResult.success ? payrollItemsResult.data : [];

            // Mark employees that already have payroll items
            const employees = employeesResult.data.map(employee => {
                const existingItem = existingItems.find(item => item.employee_id === employee.id);
                return {
                    ...employee,
                    has_payroll_item: !!existingItem,
                    payroll_status: existingItem ? existingItem.status : null,
                    working_days: existingItem ? existingItem.working_days : 22
                };
            });

            return successResponse(res, {
                employees: employees,
                period: periodResult.data,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: await Employee.getCount(employeeFilters)
                }
            }, 'Period employees retrieved successfully');

        } catch (error) {
            console.error('Get period employees error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Process employees for payroll period
    async processEmployees(req, res) {
        try {
            const { id } = req.params;
            const { employees } = req.body; // Array of { employee_id, working_days }
            const userId = req.session.user.id;

            if (!employees || !Array.isArray(employees) || employees.length === 0) {
                return errorResponse(res, 'No employees provided for processing', 400);
            }

            // Get period
            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                return errorResponse(res, 'Payroll period not found', 404);
            }

            const period = periodResult.data;
            if (!period.canEdit()) {
                return errorResponse(res, `Cannot process employees for period with status: ${period.status}`, 400);
            }

            // Get employee data
            const employeeIds = employees.map(emp => emp.employee_id);
            const employeeData = {};
            
            for (const empId of employeeIds) {
                const empResult = await Employee.findById(empId);
                if (empResult.success) {
                    employeeData[empId] = empResult.data;
                }
            }

            // Validate employees
            const validation = await this.validationEngine.validateBulkPayroll(
                Object.values(employeeData), 
                employees.reduce((acc, emp) => {
                    acc[emp.employee_id] = { working_days: emp.working_days };
                    return acc;
                }, {})
            );

            if (!validation.isValid) {
                return errorResponse(res, 'Employee validation failed', 400, validation.errors);
            }

            // Process employees using bulk operation
            const result = await PayrollItem.bulkProcess(id, employees, userId);

            if (result.success) {
                // Update period status to Processing if it was Draft
                if (period.status === 'Draft') {
                    period.status = 'Processing';
                    await period.update();
                }

                return successResponse(res, result.data, 'Employees processed successfully');
            }

            return errorResponse(res, result.error, 400, result.details);

        } catch (error) {
            console.error('Process employees error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get payroll items for period
    async getPeriodPayrollItems(req, res) {
        try {
            const { id } = req.params;
            const { search, status } = req.query;

            const filters = { search, status };
            const itemsResult = await PayrollItem.findByPeriod(id, filters);

            if (itemsResult.success) {
                return successResponse(res, itemsResult.data, 'Payroll items retrieved successfully');
            }

            return errorResponse(res, 'Failed to retrieve payroll items', 500);

        } catch (error) {
            console.error('Get period payroll items error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get payroll statistics
    async getPayrollStatistics(req, res) {
        try {
            const statisticsResult = await PayrollPeriod.getStatistics();

            if (statisticsResult.success) {
                return successResponse(res, statisticsResult.data, 'Payroll statistics retrieved successfully');
            }

            return errorResponse(res, 'Failed to retrieve payroll statistics', 500);

        } catch (error) {
            console.error('Get payroll statistics error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get current active period
    async getCurrentPeriod(req, res) {
        try {
            const periodResult = await PayrollPeriod.getCurrentPeriod();

            if (periodResult.success) {
                return successResponse(res, periodResult.data, 'Current period retrieved successfully');
            }

            return errorResponse(res, 'No active payroll period found', 404);

        } catch (error) {
            console.error('Get current period error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Bulk mark payroll items as paid
    async bulkMarkAsPaid(req, res) {
        try {
            const { id } = req.params;
            const { item_ids } = req.body;
            const userId = req.session.user.id;

            if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
                return errorResponse(res, 'No payroll items provided', 400);
            }

            const result = await PayrollItem.bulkMarkPaid(item_ids, userId);

            if (result.success) {
                return successResponse(res, result.data, 'Payroll items marked as paid successfully');
            }

            return errorResponse(res, 'Failed to mark payroll items as paid', 500);

        } catch (error) {
            console.error('Bulk mark as paid error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }
}

module.exports = new PayrollController();