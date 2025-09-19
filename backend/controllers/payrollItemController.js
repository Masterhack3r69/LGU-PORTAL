// controllers/payrollItemController.js - Payroll item management controller
const PayrollItem = require('../models/Payroll/PayrollItem');
const PayrollPeriod = require('../models/Payroll/PayrollPeriod');
const Employee = require('../models/Employee');
const PayrollCalculationEngine = require('../utils/payrollCalculations');
const PayrollValidationEngine = require('../utils/payrollValidation');
const { logPayrollAudit } = require('../middleware/payrollAudit');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class PayrollItemController {
    constructor() {
        this.calculationEngine = new PayrollCalculationEngine();
        this.validationEngine = new PayrollValidationEngine();
        
        // Bind methods to preserve 'this' context
        this.getAllPayrollItems = this.getAllPayrollItems.bind(this);
        this.getPayrollItem = this.getPayrollItem.bind(this);
        this.updatePayrollItem = this.updatePayrollItem.bind(this);
        this.recalculatePayrollItem = this.recalculatePayrollItem.bind(this);
        this.finalizePayrollItem = this.finalizePayrollItem.bind(this);
        this.markPayrollItemAsPaid = this.markPayrollItemAsPaid.bind(this);
        this.deletePayrollItem = this.deletePayrollItem.bind(this);
        this.getEmployeePayrollItems = this.getEmployeePayrollItems.bind(this);
        this.adjustWorkingDays = this.adjustWorkingDays.bind(this);
        this.addManualAdjustment = this.addManualAdjustment.bind(this);
        this.getCalculationDetails = this.getCalculationDetails.bind(this);
        this.generatePayslip = this.generatePayslip.bind(this);
    }

    // Get all payroll items with filters
    async getAllPayrollItems(req, res) {
        try {
            const { period_id, employee_id, status, search, limit = 50, offset = 0 } = req.query;

            // If period_id is provided, use the existing findByPeriod method
            if (period_id) {
                const filters = { search, status };
                const itemsResult = await PayrollItem.findByPeriod(period_id, filters);
                
                if (itemsResult.success) {
                    return successResponse(res, itemsResult.data, 'Payroll items retrieved successfully');
                }
                
                return errorResponse(res, 'Failed to retrieve payroll items', 500);
            }
            
            // If employee_id is provided, use findByEmployee method
            if (employee_id) {
                const filters = { status, limit, offset };
                const itemsResult = await PayrollItem.findByEmployee(employee_id, filters);
                
                if (itemsResult.success) {
                    return successResponse(res, itemsResult.data, 'Employee payroll items retrieved successfully');
                }
                
                return errorResponse(res, 'Failed to retrieve employee payroll items', 500);
            }

            // General query for all payroll items (with pagination)
            const filters = { status, search, limit, offset };
            const itemsResult = await PayrollItem.findAll(filters);
            
            if (itemsResult.success) {
                return successResponse(res, itemsResult.data, 'Payroll items retrieved successfully');
            }
            
            return errorResponse(res, 'Failed to retrieve payroll items', 500);

        } catch (error) {
            console.error('Get all payroll items error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get specific payroll item
    async getPayrollItem(req, res) {
        try {
            const { id } = req.params;
            const itemResult = await PayrollItem.findById(id);

            if (itemResult.success && itemResult.data) {
                return successResponse(res, itemResult.data, 'Payroll item retrieved successfully');
            }

            return errorResponse(res, 'Payroll item not found', 404);

        } catch (error) {
            console.error('Get payroll item error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Update payroll item
    async updatePayrollItem(req, res) {
        try {
            const { id } = req.params;
            const { working_days, notes } = req.body;
            const userId = req.session.user.id;

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;

            // Check if item can be edited
            if (!payrollItem.canEdit()) {
                return errorResponse(res, `Cannot edit payroll item with status: ${payrollItem.status}`, 400);
            }

            // Update properties
            if (working_days !== undefined) {
                payrollItem.working_days = working_days;
            }
            if (notes !== undefined) {
                payrollItem.notes = notes;
            }
            payrollItem.processed_by = userId;

            // Validate updated data
            const validation = await this.validationEngine.validateEmployeePayroll(
                { id: payrollItem.employee_id }, 
                { working_days: payrollItem.working_days }
            );

            if (!validation.isValid) {
                return errorResponse(res, 'Validation failed', 400, validation.errors);
            }

            const result = await payrollItem.update();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll item updated successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Update payroll item error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Recalculate payroll item
    async recalculatePayrollItem(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;

            // Check if item can be recalculated
            if (!payrollItem.canEdit()) {
                return errorResponse(res, `Cannot recalculate payroll item with status: ${payrollItem.status}`, 400);
            }

            // Set processing user
            payrollItem.processed_by = userId;

            // Recalculate
            const result = await payrollItem.recalculate();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll item recalculated successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Recalculate payroll item error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Finalize payroll item
    async finalizePayrollItem(req, res) {
        try {
            const { id } = req.params;

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;
            const result = await payrollItem.finalize();

            if (result.success) {
                return successResponse(res, result.data, 'Payroll item finalized successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Finalize payroll item error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Mark payroll item as paid
    async markPayrollItemAsPaid(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;
            const result = await payrollItem.markAsPaid(userId);

            if (result.success) {
                return successResponse(res, result.data, 'Payroll item marked as paid successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Mark payroll item as paid error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Delete payroll item
    async deletePayrollItem(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            const result = await PayrollItem.delete(id);

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'DELETE_PAYROLL_ITEM',
                    tableName: 'payroll_items',
                    recordId: id,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return successResponse(res, null, 'Payroll item deleted successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Delete payroll item error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get payroll items for employee
    async getEmployeePayrollItems(req, res) {
        try {
            const { employeeId } = req.params;
            const { year, status, limit = 20, offset = 0 } = req.query;

            const filters = { year, status, limit, offset };
            const itemsResult = await PayrollItem.findByEmployee(employeeId, filters);

            if (itemsResult.success) {
                return successResponse(res, itemsResult.data, 'Employee payroll items retrieved successfully');
            }

            return errorResponse(res, 'Failed to retrieve employee payroll items', 500);

        } catch (error) {
            console.error('Get employee payroll items error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Adjust working days for payroll item
    async adjustWorkingDays(req, res) {
        try {
            const { id } = req.params;
            const { working_days, reason } = req.body;
            const userId = req.session.user.id;

            if (!working_days || working_days < 0 || working_days > 31) {
                return errorResponse(res, 'Invalid working days value', 400);
            }

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;

            // Check if item can be edited
            if (!payrollItem.canEdit()) {
                return errorResponse(res, `Cannot adjust working days for payroll item with status: ${payrollItem.status}`, 400);
            }

            const oldWorkingDays = payrollItem.working_days;

            // Update working days
            payrollItem.working_days = working_days;
            payrollItem.processed_by = userId;
            
            if (reason) {
                payrollItem.notes = (payrollItem.notes || '') + 
                    `\nWorking days adjusted from ${oldWorkingDays} to ${working_days}. Reason: ${reason}`;
            }

            // Recalculate after adjustment
            const result = await payrollItem.recalculate();

            if (result.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'ADJUST_WORKING_DAYS',
                    tableName: 'payroll_items',
                    recordId: id,
                    oldValues: { working_days: oldWorkingDays },
                    newValues: { working_days: working_days, reason: reason },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                return successResponse(res, result.data, 'Working days adjusted and payroll recalculated successfully');
            }

            return errorResponse(res, result.error, 400);

        } catch (error) {
            console.error('Adjust working days error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Add manual adjustment to payroll item
    async addManualAdjustment(req, res) {
        try {
            const { id } = req.params;
            const { adjustment_type, description, amount, reason } = req.body;
            const userId = req.session.user.id;

            if (!adjustment_type || !['Allowance', 'Deduction', 'Adjustment'].includes(adjustment_type)) {
                return errorResponse(res, 'Invalid adjustment type', 400);
            }

            if (!description || !amount || amount === 0) {
                return errorResponse(res, 'Description and non-zero amount are required', 400);
            }

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;

            // Check if item can be edited
            if (!payrollItem.canEdit()) {
                return errorResponse(res, `Cannot add manual adjustment for payroll item with status: ${payrollItem.status}`, 400);
            }

            // Add manual adjustment through database
            const { executeQuery } = require('../config/database');
            
            const adjustmentResult = await executeQuery(`
                INSERT INTO payroll_item_lines (
                    payroll_item_id, line_type, description, amount, is_override, calculation_basis
                ) VALUES (?, ?, ?, ?, TRUE, ?)
            `, [id, adjustment_type, description, amount, `Manual adjustment: ${reason || 'No reason provided'}`]);

            if (!adjustmentResult.success) {
                return errorResponse(res, 'Failed to add manual adjustment', 500);
            }

            // Update payroll item totals
            if (adjustment_type === 'Allowance') {
                payrollItem.total_allowances += amount;
            } else if (adjustment_type === 'Deduction') {
                payrollItem.total_deductions += amount;
            }

            payrollItem.updateCalculatedAmounts();
            payrollItem.processed_by = userId;

            // Add note
            payrollItem.notes = (payrollItem.notes || '') + 
                `\nManual ${adjustment_type.toLowerCase()}: ${description} (₱${amount}). Reason: ${reason || 'Not specified'}`;

            const updateResult = await payrollItem.update();

            if (updateResult.success) {
                // Log audit
                await logPayrollAudit({
                    userId: userId,
                    action: 'MANUAL_PAYROLL_ADJUSTMENT',
                    tableName: 'payroll_items',
                    recordId: id,
                    newValues: { 
                        adjustment_type, 
                        description, 
                        amount, 
                        reason 
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });

                // Return updated payroll item
                const updatedItemResult = await PayrollItem.findById(id);
                return successResponse(res, updatedItemResult.data, 'Manual adjustment added successfully');
            }

            return errorResponse(res, updateResult.error, 400);

        } catch (error) {
            console.error('Add manual adjustment error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Get payroll item calculation details
    async getCalculationDetails(req, res) {
        try {
            const { id } = req.params;

            // Get payroll item with line items
            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;

            // Get employee data for context
            const employeeResult = await Employee.findById(payrollItem.employee_id);
            if (!employeeResult.success) {
                return errorResponse(res, 'Employee not found', 404);
            }

            const employee = employeeResult.data;

            // Prepare calculation breakdown
            const calculationDetails = {
                employee: {
                    id: employee.id,
                    employee_number: employee.employee_number,
                    name: `${employee.first_name} ${employee.last_name}`,
                    position: employee.plantilla_position,
                    current_monthly_salary: employee.current_monthly_salary,
                    current_daily_rate: employee.current_daily_rate
                },
                calculation: {
                    working_days: payrollItem.working_days,
                    daily_rate: payrollItem.daily_rate,
                    basic_pay: payrollItem.basic_pay,
                    basic_pay_calculation: `₱${payrollItem.daily_rate} × ${payrollItem.working_days} days = ₱${payrollItem.basic_pay}`,
                    total_allowances: payrollItem.total_allowances,
                    total_deductions: payrollItem.total_deductions,
                    gross_pay: payrollItem.gross_pay,
                    gross_pay_calculation: `₱${payrollItem.basic_pay} + ₱${payrollItem.total_allowances} = ₱${payrollItem.gross_pay}`,
                    net_pay: payrollItem.net_pay,
                    net_pay_calculation: `₱${payrollItem.gross_pay} - ₱${payrollItem.total_deductions} = ₱${payrollItem.net_pay}`,
                    status: payrollItem.status
                },
                line_items: payrollItem.line_items || []
            };

            return successResponse(res, calculationDetails, 'Calculation details retrieved successfully');

        } catch (error) {
            console.error('Get calculation details error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }

    // Generate payslip for employee
    async generatePayslip(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;
            const userRole = req.session.user.role;

            const itemResult = await PayrollItem.findById(id);
            if (!itemResult.success || !itemResult.data) {
                return errorResponse(res, 'Payroll item not found', 404);
            }

            const payrollItem = itemResult.data;

            // Check authorization - employees can only view their own payslips
            if (userRole === 'employee') {
                const employeeResult = await Employee.findByUserId(userId);
                if (!employeeResult.success || employeeResult.data.id !== payrollItem.employee_id) {
                    return errorResponse(res, 'Unauthorized access to payslip', 403);
                }
            }

            // Get complete calculation details
            const detailsResult = await this.getCalculationDetails(req, res);
            if (!detailsResult.success) {
                return detailsResult;
            }

            // For now, return the calculation details as the payslip
            // In a full implementation, this would generate a PDF or formatted document
            return successResponse(res, {
                payslip_id: id,
                generated_at: new Date().toISOString(),
                generated_by: userId,
                ...detailsResult.data
            }, 'Payslip generated successfully');

        } catch (error) {
            console.error('Generate payslip error:', error);
            return errorResponse(res, 'Internal server error', 500);
        }
    }
}

module.exports = new PayrollItemController();