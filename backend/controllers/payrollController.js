// controllers/payrollController.js - Main payroll period management controller
const PayrollPeriod = require('../models/Payroll/PayrollPeriod');
const PayrollItem = require('../models/Payroll/PayrollItem');
const Employee = require('../models/Employee');
const PayrollCalculationEngine = require('../utils/payrollCalculations');
const PayrollValidationEngine = require('../utils/payrollValidation');
const { logPayrollAudit } = require('../middleware/payrollAudit');
const ApiResponse = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');
const payrollService = require('../services/payrollService');

class PayrollController {
    constructor() {
        try {
            console.log('Initializing PayrollController...');
            this.calculationEngine = new PayrollCalculationEngine();
            console.log('PayrollCalculationEngine initialized successfully');
            this.validationEngine = new PayrollValidationEngine();
            console.log('PayrollValidationEngine initialized successfully');
            
            // Bind all methods to preserve 'this' context
            this.getAllPeriods = this.getAllPeriods.bind(this);
            this.getPeriod = this.getPeriod.bind(this);
            this.createPeriod = this.createPeriod.bind(this);
            this.updatePeriod = this.updatePeriod.bind(this);
            this.deletePeriod = this.deletePeriod.bind(this);
            this.finalizePeriod = this.finalizePeriod.bind(this);
            this.reopenPeriod = this.reopenPeriod.bind(this);
            this.markPeriodAsPaid = this.markPeriodAsPaid.bind(this);
            this.getPeriodEmployees = this.getPeriodEmployees.bind(this);
            this.processEmployees = this.processEmployees.bind(this);
            this.getPeriodPayrollItems = this.getPeriodPayrollItems.bind(this);
            this.getPeriodSummary = this.getPeriodSummary.bind(this);
            this.getPayrollStatistics = this.getPayrollStatistics.bind(this);
            this.getCurrentPeriod = this.getCurrentPeriod.bind(this);
            this.bulkMarkAsPaid = this.bulkMarkAsPaid.bind(this);
            this.processPayrollWithDTR = this.processPayrollWithDTR.bind(this);
            this.validateDTRBeforeProcessing = this.validateDTRBeforeProcessing.bind(this);
            this.getPeriodSummaryWithDTR = this.getPeriodSummaryWithDTR.bind(this);
        } catch (error) {
            console.error('Error initializing PayrollController:', error);
            console.error('Stack trace:', error.stack);
            // Fallback to ensure properties exist
            this.calculationEngine = null;
            this.validationEngine = null;
        }
    }

    // Get all payroll periods
    async getAllPeriods(req, res) {
        try {
            const filters = {};
            
            // Only add filters with defined values
            if (req.query.year) filters.year = req.query.year;
            if (req.query.month) filters.month = req.query.month;
            if (req.query.status) filters.status = req.query.status;
            if (req.query.year_from) filters.year_from = req.query.year_from;
            if (req.query.year_to) filters.year_to = req.query.year_to;
            
            // Always include limit and offset with defaults
            filters.limit = req.query.limit || 20;
            filters.offset = req.query.offset || 0;

            const periodsResult = await PayrollPeriod.findAll(filters);
            const totalCount = await PayrollPeriod.getCount(filters);

            if (periodsResult.success) {
                const response = ApiResponse.success({
                    periods: periodsResult.data,
                    pagination: {
                        total: totalCount,
                        limit: parseInt(filters.limit),
                        offset: parseInt(filters.offset),
                        has_more: totalCount > (parseInt(filters.offset) + parseInt(filters.limit))
                    }
                }, 'Payroll periods retrieved successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error('Failed to retrieve payroll periods', 'FETCH_ERROR', null, 500);
            return res.status(500).json(response);

        } catch (error) {
            console.error('Get payroll periods error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get specific payroll period
    async getPeriod(req, res) {
        try {
            const { id } = req.params;
            const periodResult = await PayrollPeriod.findById(id);

            if (periodResult.success && periodResult.data) {
                const response = ApiResponse.success(periodResult.data, 'Payroll period retrieved successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.notFound('Payroll period');
            return res.status(404).json(response);

        } catch (error) {
            console.error('Get payroll period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Create new payroll period
    async createPeriod(req, res) {
        try {
            console.log('PayrollController createPeriod - this:', typeof this);
            console.log('PayrollController createPeriod - validationEngine:', typeof this.validationEngine);
            
            const { year, month, period_number, start_date, end_date, pay_date } = req.body;
            const userId = req.session.user.id;

            // Validate period data (with fallback if validation engine failed to initialize)
            if (this.validationEngine) {
                const validation = await this.validationEngine.validatePayrollPeriod(req.body);
                if (!validation.isValid) {
                    const response = ApiResponse.validationError('Validation failed', validation.errors);
                    return res.status(400).json(response);
                }
            } else {
                console.log('PayrollController - using fallback validation');
                // Basic validation fallback
                if (!year || !month || !period_number) {
                    const response = ApiResponse.validationError('Validation failed', ['Year, month, and period number are required']);
                    return res.status(400).json(response);
                }
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
                const response = ApiResponse.success(result.data, 'Payroll period created successfully');
                return res.status(201).json(response);
            }

            const response = ApiResponse.error(result.error, 'CREATE_ERROR', result.details, 400);
            return res.status(400).json(response);

        } catch (error) {
            console.error('Create payroll period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Update payroll period
    async updatePeriod(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
            }

            const period = periodResult.data;

            // Check if period can be edited
            if (!period.canEdit()) {
                const response = ApiResponse.error(`Cannot edit payroll period with status: ${period.status}`, 'INVALID_STATUS', null, 400);
                return res.status(400).json(response);
            }

            // Update period properties
            Object.assign(period, req.body);

            // Validate updated data (with fallback if validation engine failed to initialize)
            if (this.validationEngine) {
                const validation = await this.validationEngine.validatePayrollPeriod(period);
                if (!validation.isValid) {
                    const response = ApiResponse.validationError('Validation failed', validation.errors);
                    return res.status(400).json(response);
                }
            }

            const result = await period.update();

            if (result.success) {
                const response = ApiResponse.success(result.data, 'Payroll period updated successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error(result.error, 'UPDATE_ERROR', result.details, 400);
            return res.status(400).json(response);

        } catch (error) {
            console.error('Update payroll period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
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

                const response = ApiResponse.success(null, 'Payroll period deleted successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error(result.error, 'DELETE_ERROR', null, 400);
            return res.status(400).json(response);

        } catch (error) {
            console.error('Delete payroll period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Finalize payroll period
    async finalizePeriod(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            // Validate period can be finalized (with fallback if validation engine failed to initialize)
            if (this.validationEngine) {
                const validation = await this.validationEngine.validatePeriodFinalization(id);
                if (!validation.isValid) {
                    const response = ApiResponse.validationError('Cannot finalize period', validation.errors);
                    return res.status(400).json(response);
                }
            }

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
            }

            const period = periodResult.data;
            const result = await period.finalize(userId);

            if (result.success) {
                // Send notifications to all employees in the period
                try {
                    const { pool } = require('../config/database');
                    const [employeeRows] = await pool.execute(
                        `SELECT DISTINCT u.id, e.first_name, e.last_name
                         FROM users u
                         JOIN employees e ON e.user_id = u.id
                         JOIN payroll_items pi ON pi.employee_id = e.id
                         WHERE pi.payroll_period_id = ? AND u.is_active = 1`,
                        [id]
                    );
                    
                    for (const employee of employeeRows) {
                        await notificationService.createNotification({
                            user_id: employee.id,
                            type: 'payroll_finalized',
                            title: 'Payroll Period Finalized',
                            message: `The payroll period "${period.period_name}" has been finalized. Your payroll is now ready for review.`,
                            priority: 'HIGH',
                            reference_type: 'payroll_period',
                            reference_id: id,
                            metadata: {
                                period_name: period.period_name,
                                period_id: id
                            }
                        });
                    }
                } catch (notificationError) {
                    console.error('Failed to send payroll finalization notifications:', notificationError);
                    // Don't fail the request if notification fails
                }

                const response = ApiResponse.success(result.data, 'Payroll period finalized successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error(result.error, 'FINALIZE_ERROR', null, 400);
            return res.status(400).json(response);

        } catch (error) {
            console.error('Finalize payroll period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Reopen payroll period
    async reopenPeriod(req, res) {
        try {
            const { id } = req.params;

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
            }

            const period = periodResult.data;
            const result = await period.reopen();

            if (result.success) {
                const response = ApiResponse.success(result.data, 'Payroll period reopened successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error(result.error, 'REOPEN_ERROR', null, 400);
            return res.status(400).json(response);

        } catch (error) {
            console.error('Reopen payroll period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Mark period as paid
    async markPeriodAsPaid(req, res) {
        try {
            const { id } = req.params;

            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
            }

            const period = periodResult.data;
            const result = await period.markAsPaid();

            if (result.success) {
                const response = ApiResponse.success(result.data, 'Payroll period marked as paid successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error(result.error, 'MARK_PAID_ERROR', null, 400);
            return res.status(400).json(response);

        } catch (error) {
            console.error('Mark period as paid error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get employees for period processing
    // DEPRECATED: This endpoint is deprecated in favor of DTR-based processing
    // Use processPayrollWithDTR instead
    async getPeriodEmployees(req, res) {
        try {
            // Return deprecation warning
            const response = ApiResponse.error(
                'This endpoint is deprecated. Payroll processing now uses DTR data. Please import DTR data and use the processPayrollWithDTR endpoint.',
                'ENDPOINT_DEPRECATED',
                { 
                    deprecated: true,
                    alternative: 'POST /api/payroll/periods/:id/process-with-dtr',
                    message: 'Employee selection is no longer required. Import DTR data first.'
                },
                410
            );
            return res.status(410).json(response);

            /* LEGACY CODE - Kept for reference
            const { id } = req.params;
            const { search, status, limit = 50, offset = 0 } = req.query;

            // Get period
            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
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
                const response = ApiResponse.error('Failed to retrieve employees', 'FETCH_ERROR', null, 500);
                return res.status(500).json(response);
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

            const response = ApiResponse.success({
                employees: employees,
                period: periodResult.data,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: await Employee.getCount(employeeFilters)
                }
            }, 'Period employees retrieved successfully');
            return res.status(200).json(response);
            */

        } catch (error) {
            console.error('Get period employees error (deprecated):', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Process employees for payroll period
    // DEPRECATED: This endpoint is deprecated in favor of DTR-based processing
    // Use processPayrollWithDTR instead
    async processEmployees(req, res) {
        try {
            // Return deprecation warning
            const response = ApiResponse.error(
                'This endpoint is deprecated. Payroll processing now uses DTR data. Please import DTR data and use the processPayrollWithDTR endpoint.',
                'ENDPOINT_DEPRECATED',
                { 
                    deprecated: true,
                    alternative: 'POST /api/payroll/periods/:id/process-with-dtr',
                    message: 'Manual working days adjustment is no longer supported. Import DTR data first.'
                },
                410
            );
            return res.status(410).json(response);

            /* LEGACY CODE - Kept for reference
            const { id } = req.params;
            const { employees } = req.body; // Array of { employee_id, working_days }
            const userId = req.session.user.id;

            if (!employees || !Array.isArray(employees) || employees.length === 0) {
                const response = ApiResponse.error('No employees provided for processing', 'VALIDATION_ERROR', null, 400);
                return res.status(400).json(response);
            }

            // Get period
            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
            }

            const period = periodResult.data;
            if (!period.canEdit()) {
                const response = ApiResponse.error(`Cannot process employees for period with status: ${period.status}`, 'INVALID_STATUS', null, 400);
                return res.status(400).json(response);
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

            // Validate employees (with fallback if validation engine failed to initialize)
            if (this.validationEngine) {
                const validation = await this.validationEngine.validateBulkPayroll(
                    Object.values(employeeData), 
                    employees.reduce((acc, emp) => {
                        acc[emp.employee_id] = { working_days: emp.working_days };
                        return acc;
                    }, {})
                );

                if (!validation.isValid) {
                    const response = ApiResponse.validationError('Employee validation failed', validation.errors);
                    return res.status(400).json(response);
                }
            }

            // Process employees using bulk operation
            const result = await PayrollItem.bulkProcess(id, employees, userId);

            if (result.success) {
                // Update period status to Processing if it was Draft
                if (period.status === 'Draft') {
                    period.status = 'Processing';
                    await period.update();
                }

                // Send notifications to all processed employees
                try {
                    const { pool } = require('../config/database');
                    for (const employeeId of employeeIds) {
                        const [employeeRows] = await pool.execute(
                            'SELECT u.id, e.first_name, e.last_name FROM users u JOIN employees e ON e.user_id = u.id WHERE e.id = ? AND u.is_active = 1',
                            [employeeId]
                        );
                        
                        if (employeeRows.length > 0) {
                            const employee = employeeRows[0];
                            await notificationService.sendPayrollNotification({
                                period_id: id,
                                period_name: period.period_name,
                                employee_id: employeeId
                            }, [employee.id]);
                        }
                    }
                } catch (notificationError) {
                    console.error('Failed to send bulk payroll notifications:', notificationError);
                    // Don't fail the request if notification fails
                }

                const response = ApiResponse.success(result.data, 'Employees processed successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error(result.error, 'PROCESS_ERROR', result.details, 400);
            return res.status(400).json(response);
            */

        } catch (error) {
            console.error('Process employees error (deprecated):', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
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
                const response = ApiResponse.success(itemsResult.data, 'Payroll items retrieved successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error('Failed to retrieve payroll items', 'FETCH_ERROR', null, 500);
            return res.status(500).json(response);

        } catch (error) {
            console.error('Get period payroll items error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get payroll summary for period
    async getPeriodSummary(req, res) {
        try {
            const { id } = req.params;

            // Get period
            const periodResult = await PayrollPeriod.findById(id);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period');
                return res.status(404).json(response);
            }

            const period = periodResult.data;

            // Get payroll items for this period to calculate summary
            const itemsResult = await PayrollItem.findByPeriod(id);
            const payrollItems = itemsResult.success ? itemsResult.data : [];

            // Calculate summary statistics
            const summary = {
                period_id: parseInt(id),
                period_name: period.getPeriodName(),
                total_employees: payrollItems.length,
                total_basic_pay: 0,
                total_allowances: 0,
                total_deductions: 0,
                total_gross_pay: 0,
                total_net_pay: 0,
                period_status: period.status,
                items_by_status: {
                    draft: 0,
                    calculated: 0,
                    finalized: 0,
                    paid: 0
                }
            };

            // Calculate totals from payroll items
            payrollItems.forEach(item => {
                summary.total_basic_pay += parseFloat(item.basic_pay || 0);
                summary.total_allowances += parseFloat(item.total_allowances || 0);
                summary.total_deductions += parseFloat(item.total_deductions || 0);
                summary.total_gross_pay += parseFloat(item.gross_pay || 0);
                summary.total_net_pay += parseFloat(item.net_pay || 0);
                
                // Count items by status
                const status = (item.status || 'draft').toLowerCase();
                if (summary.items_by_status.hasOwnProperty(status)) {
                    summary.items_by_status[status]++;
                } else {
                    summary.items_by_status[status] = 1;
                }
            });

            const response = ApiResponse.success(summary, 'Payroll summary retrieved successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get payroll summary error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get payroll statistics
    async getPayrollStatistics(req, res) {
        try {
            const statisticsResult = await PayrollPeriod.getStatistics();

            if (statisticsResult.success) {
                const response = ApiResponse.success(statisticsResult.data, 'Payroll statistics retrieved successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error('Failed to retrieve payroll statistics', 'FETCH_ERROR', null, 500);
            return res.status(500).json(response);

        } catch (error) {
            console.error('Get payroll statistics error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get current active period
    async getCurrentPeriod(req, res) {
        try {
            const periodResult = await PayrollPeriod.getCurrentPeriod();

            if (periodResult.success) {
                const response = ApiResponse.success(periodResult.data, 'Current period retrieved successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.notFound('Active payroll period');
            return res.status(404).json(response);

        } catch (error) {
            console.error('Get current period error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Bulk mark payroll items as paid
    async bulkMarkAsPaid(req, res) {
        try {
            const { id } = req.params;
            const { item_ids } = req.body;
            const userId = req.session.user.id;

            if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
                const response = ApiResponse.error('No payroll items provided', 'VALIDATION_ERROR', null, 400);
                return res.status(400).json(response);
            }

            const result = await PayrollItem.bulkMarkPaid(item_ids, userId);

            if (result.success) {
                const response = ApiResponse.success(result.data, 'Payroll items marked as paid successfully');
                return res.status(200).json(response);
            }

            const response = ApiResponse.error('Failed to mark payroll items as paid', 'MARK_PAID_ERROR', null, 500);
            return res.status(500).json(response);

        } catch (error) {
            console.error('Bulk mark as paid error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get payroll periods where the current employee has payroll items
    async getEmployeePayrollPeriods(req, res) {
        try {
            const user = req.session.user;
            
            // Get employee record for this user
            const employeeResult = await Employee.findByUserId(user.id);
            if (!employeeResult.success || !employeeResult.data) {
                const response = ApiResponse.error('Employee record not found', 'EMPLOYEE_NOT_FOUND', null, 403);
                return res.status(403).json(response);
            }
            
            const employee = employeeResult.data;
            
            // Get all payroll items for this employee to find associated periods
            const itemsResult = await PayrollItem.findByEmployee(employee.id);
            if (!itemsResult.success) {
                const response = ApiResponse.error('Failed to retrieve payroll items', 'FETCH_ERROR', null, 500);
                return res.status(500).json(response);
            }
            
            // Extract unique period IDs from payroll items
            const periodIds = [...new Set(itemsResult.data.map(item => item.payroll_period_id))];
            
            if (periodIds.length === 0) {
                const response = ApiResponse.success([], 'No payroll periods found for employee');
                return res.status(200).json(response);
            }
            
            // Get period details for these period IDs
            const periods = [];
            for (const periodId of periodIds) {
                const periodResult = await PayrollPeriod.findById(periodId);
                if (periodResult.success && periodResult.data) {
                    periods.push(periodResult.data);
                }
            }
            
            // Sort periods by year and month (newest first)
            periods.sort((a, b) => {
                if (a.year !== b.year) {
                    return b.year - a.year;
                }
                if (a.month !== b.month) {
                    return b.month - a.month;
                }
                return b.period_number - a.period_number;
            });
            
            const response = ApiResponse.success(periods, 'Employee payroll periods retrieved successfully');
            return res.status(200).json(response);
            
        } catch (error) {
            console.error('Get employee payroll periods error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Get payslip for current employee for specific period
    async getEmployeePayslip(req, res) {
        try {
            const { periodId } = req.params;
            const user = req.session.user;
            
            // Get employee record for this user
            const employeeResult = await Employee.findByUserId(user.id);
            if (!employeeResult.success || !employeeResult.data) {
                const response = ApiResponse.error('Employee record not found', 'EMPLOYEE_NOT_FOUND', null, 403);
                return res.status(403).json(response);
            }
            
            const employee = employeeResult.data;
            
            // Get payroll item for this employee and period
            const itemsResult = await PayrollItem.findByPeriodAndEmployee(periodId, employee.id);
            if (!itemsResult.success || !itemsResult.data || itemsResult.data.length === 0) {
                const response = ApiResponse.notFound('Payslip not found for this period');
                return res.status(404).json(response);
            }
            
            const payrollItem = itemsResult.data[0]; // Get first (should be only one) item
            
            // Get period details
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                const response = ApiResponse.notFound('Payroll period not found');
                return res.status(404).json(response);
            }
            
            // Build payslip data
            const payslipData = {
                ...payrollItem,
                period: periodResult.data,
                employee: {
                    id: employee.id,
                    employee_id: employee.employee_id,
                    full_name: employee.full_name,
                    department: employee.department,
                    position: employee.position,
                    hire_date: employee.hire_date
                },
                allowances: payrollItem.allowances || [],
                deductions: payrollItem.deductions || []
            };
            
            const response = ApiResponse.success(payslipData, 'Employee payslip retrieved successfully');
            return res.status(200).json(response);
            
        } catch (error) {
            console.error('Get employee payslip error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // Download payslip PDF for current employee
    async downloadEmployeePayslip(req, res) {
        try {
            const { periodId } = req.params;
            const user = req.session.user;
            
            // Get employee record for this user
            const employeeResult = await Employee.findByUserId(user.id);
            if (!employeeResult.success || !employeeResult.data) {
                const response = ApiResponse.error('Employee record not found', 'EMPLOYEE_NOT_FOUND', null, 403);
                return res.status(403).json(response);
            }
            
            const employee = employeeResult.data;
            
            // Get payroll item for this employee and period
            const itemsResult = await PayrollItem.findByPeriodAndEmployee(periodId, employee.id);
            if (!itemsResult.success || !itemsResult.data || itemsResult.data.length === 0) {
                const response = ApiResponse.notFound('Payslip not found for this period');
                return res.status(404).json(response);
            }
            
            const payrollItem = itemsResult.data[0];
            
            // Use existing payslip generation service
            const payslipPdfService = require('../services/payslipPdfService');
            const pdfResult = await payslipPdfService.generatePayslipPDF(payrollItem.id);
            
            if (pdfResult.success) {
                const { buffer, filename, mimeType } = pdfResult.data;
                
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Length', buffer.length);
                
                return res.send(buffer);
            }
            
            const response = ApiResponse.error('Failed to generate payslip PDF', 'PDF_GENERATION_ERROR', null, 500);
            return res.status(500).json(response);
            
        } catch (error) {
            console.error('Download employee payslip error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    // ============================================================================
    // DTR-INTEGRATED PAYROLL PROCESSING ENDPOINTS
    // ============================================================================

    /**
     * Process payroll using DTR data
     * Automatically retrieves DTR records and processes payroll for all employees with DTR data
     * Replaces the old employee selection and manual working days adjustment workflow
     */
    async processPayrollWithDTR(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            // Validate DTR data exists before processing
            const validationResult = await payrollService.validateDTRDataExists(id);
            
            if (!validationResult.success || !validationResult.isValid) {
                const response = ApiResponse.error(
                    validationResult.error || 'No DTR data found for this period',
                    'NO_DTR_DATA',
                    {
                        message: validationResult.message || 'Please import DTR data before processing payroll',
                        dtrCount: validationResult.dtrCount || 0
                    },
                    400
                );
                return res.status(400).json(response);
            }

            // Process payroll using DTR data
            const processResult = await payrollService.processPayroll(id, userId);

            if (!processResult.success) {
                const statusCode = processResult.code === 'NO_DTR_DATA' ? 400 : 500;
                const response = ApiResponse.error(
                    processResult.error,
                    processResult.code || 'PROCESS_ERROR',
                    processResult.details,
                    statusCode
                );
                return res.status(statusCode).json(response);
            }

            // Log audit
            await logPayrollAudit({
                userId: userId,
                action: 'PROCESS_PAYROLL_WITH_DTR',
                tableName: 'payroll_items',
                recordId: id,
                newValues: {
                    employees_processed: processResult.data.employees_processed,
                    dtr_records_used: processResult.data.dtr_source.total_records
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Send notifications to all processed employees
            try {
                const { pool } = require('../config/database');
                const [employeeRows] = await pool.execute(
                    `SELECT DISTINCT u.id, e.first_name, e.last_name
                     FROM users u
                     JOIN employees e ON e.user_id = u.id
                     JOIN payroll_items pi ON pi.employee_id = e.id
                     WHERE pi.payroll_period_id = ? AND u.is_active = 1`,
                    [id]
                );
                
                const periodResult = await PayrollPeriod.findById(id);
                const period = periodResult.data;
                
                for (const employee of employeeRows) {
                    await notificationService.createNotification({
                        user_id: employee.id,
                        type: 'payroll_processed',
                        title: 'Payroll Processed',
                        message: `Your payroll for "${period.getPeriodName()}" has been processed using DTR data.`,
                        priority: 'MEDIUM',
                        reference_type: 'payroll_period',
                        reference_id: id,
                        metadata: {
                            period_name: period.getPeriodName(),
                            period_id: id
                        }
                    });
                }
            } catch (notificationError) {
                console.error('Failed to send payroll processing notifications:', notificationError);
                // Don't fail the request if notification fails
            }

            const response = ApiResponse.success(
                processResult.data,
                processResult.message || 'Payroll processed successfully using DTR data'
            );
            return res.status(200).json(response);

        } catch (error) {
            console.error('Process payroll with DTR error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    /**
     * Validate DTR data before processing
     * Checks if DTR data exists and returns validation status
     */
    async validateDTRBeforeProcessing(req, res) {
        try {
            const { id } = req.params;

            // Validate DTR data exists
            const validationResult = await payrollService.validateDTRDataExists(id);

            if (!validationResult.success) {
                const response = ApiResponse.error(
                    validationResult.error,
                    'VALIDATION_ERROR',
                    validationResult.details,
                    500
                );
                return res.status(500).json(response);
            }

            // Get employees without DTR data
            const missingDTRResult = await payrollService.getEmployeesWithoutDTR(id);
            const employeesWithoutDTR = missingDTRResult.success ? missingDTRResult.data : { employees: [], count: 0 };

            const responseData = {
                isValid: validationResult.isValid,
                hasDTRData: validationResult.isValid,
                dtrCount: validationResult.dtrCount || 0,
                message: validationResult.message,
                employeesWithoutDTR: employeesWithoutDTR.employees,
                missingDTRCount: employeesWithoutDTR.count,
                canProcess: validationResult.isValid && employeesWithoutDTR.count === 0
            };

            if (!validationResult.isValid) {
                const response = ApiResponse.error(
                    'DTR validation failed',
                    'DTR_VALIDATION_FAILED',
                    responseData,
                    400
                );
                return res.status(400).json(response);
            }

            const response = ApiResponse.success(
                responseData,
                'DTR validation successful'
            );
            return res.status(200).json(response);

        } catch (error) {
            console.error('Validate DTR before processing error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }

    /**
     * Get period summary with DTR information
     * Enhanced version of getPeriodSummary that includes DTR source data
     */
    async getPeriodSummaryWithDTR(req, res) {
        try {
            const { id } = req.params;

            // Get summary with DTR information
            const summaryResult = await payrollService.getPayrollSummaryWithDTR(id);

            if (!summaryResult.success) {
                const response = ApiResponse.error(
                    summaryResult.error,
                    'FETCH_ERROR',
                    summaryResult.details,
                    500
                );
                return res.status(500).json(response);
            }

            const response = ApiResponse.success(
                summaryResult.data,
                'Payroll summary with DTR information retrieved successfully'
            );
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get period summary with DTR error:', error);
            const response = ApiResponse.serverError('Internal server error');
            return res.status(500).json(response);
        }
    }
}

module.exports = new PayrollController();