// services/payrollService.js - Payroll Service with DTR Integration
const { executeQuery } = require('../config/database');
const PayrollPeriod = require('../models/Payroll/PayrollPeriod');
const PayrollItem = require('../models/Payroll/PayrollItem');
const Employee = require('../models/Employee');
const PayrollCalculationEngine = require('../utils/payrollCalculations');

/**
 * Payroll Service - Handles payroll processing with DTR integration
 * Integrates Daily Time Record (DTR) data into payroll processing workflow
 */
class PayrollService {
    constructor() {
        this.calculationEngine = new PayrollCalculationEngine();
    }

    /**
     * Get DTR data for a payroll period
     * Retrieves all active DTR records for the specified period
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} DTR records with employee information
     */
    async getDTRDataForPeriod(periodId) {
        try {
            const query = `
                SELECT 
                    dr.id,
                    dr.employee_id,
                    dr.employee_number,
                    dr.working_days,
                    dr.start_date,
                    dr.end_date,
                    e.first_name,
                    e.last_name,
                    e.middle_name,
                    e.plantilla_position,
                    e.current_daily_rate,
                    e.employment_status
                FROM dtr_records dr
                JOIN employees e ON dr.employee_id = e.id
                WHERE dr.payroll_period_id = ?
                AND dr.status = 'Active'
                AND e.deleted_at IS NULL
                AND e.employment_status = 'Active'
                ORDER BY e.last_name, e.first_name
            `;

            const result = await executeQuery(query, [periodId]);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to fetch DTR data for period'
                };
            }

            return {
                success: true,
                data: result.data
            };
        } catch (error) {
            console.error('Error fetching DTR data for period:', error);
            return {
                success: false,
                error: 'Failed to fetch DTR data',
                details: error.message
            };
        }
    }

    /**
     * Process payroll for a period using DTR data
     * Main method that orchestrates payroll processing with DTR integration
     * @param {number} periodId - Payroll period ID
     * @param {number} userId - User ID performing the processing
     * @returns {Promise<Object>} Processing result
     */
    async processPayroll(periodId, userId) {
        try {
            // Validate period exists and can be processed
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Check if period can be edited
            if (!period.canEdit()) {
                return {
                    success: false,
                    error: `Cannot process payroll for period with status: ${period.status}`
                };
            }

            // Get DTR data for this period
            const dtrResult = await this.getDTRDataForPeriod(periodId);
            
            if (!dtrResult.success) {
                return {
                    success: false,
                    error: 'Failed to retrieve DTR data',
                    details: dtrResult.error
                };
            }

            // Validate that DTR data exists
            if (!dtrResult.data || dtrResult.data.length === 0) {
                return {
                    success: false,
                    error: 'No DTR data found for this period. Please import DTR before processing payroll.',
                    code: 'NO_DTR_DATA'
                };
            }

            const dtrRecords = dtrResult.data;

            // Prepare employee data for bulk processing
            const employeesToProcess = dtrRecords.map(dtr => ({
                employee_id: dtr.employee_id,
                working_days: dtr.working_days
            }));

            // Process payroll items using DTR working days
            const processResult = await PayrollItem.bulkProcess(
                periodId,
                employeesToProcess,
                userId
            );

            if (!processResult.success) {
                return {
                    success: false,
                    error: 'Failed to process payroll items',
                    details: processResult.error
                };
            }

            // Update period status to Processing if it was Draft
            if (period.status === 'Draft') {
                period.status = 'Processing';
                await period.update();
            }

            return {
                success: true,
                data: {
                    period_id: periodId,
                    period_name: period.getPeriodName(),
                    employees_processed: processResult.data.processed_count,
                    employees_failed: processResult.data.failed_count,
                    dtr_source: {
                        total_records: dtrRecords.length,
                        total_working_days: dtrRecords.reduce((sum, dtr) => sum + parseFloat(dtr.working_days || 0), 0)
                    },
                    processing_details: processResult.data.items
                },
                message: 'Payroll processed successfully using DTR data'
            };
        } catch (error) {
            console.error('Error processing payroll:', error);
            return {
                success: false,
                error: 'Failed to process payroll',
                details: error.message
            };
        }
    }

    /**
     * Calculate basic pay using DTR working days
     * Formula: daily_rate × working_days
     * @param {number} dailyRate - Employee's daily rate
     * @param {number} workingDays - Working days from DTR
     * @returns {number} Calculated basic pay
     */
    calculateBasicPay(dailyRate, workingDays) {
        if (!dailyRate || !workingDays) {
            return 0;
        }

        const basicPay = parseFloat(dailyRate) * parseFloat(workingDays);
        
        // Round to 2 decimal places
        return Math.round(basicPay * 100) / 100;
    }

    /**
     * Validate DTR data exists before payroll processing
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Validation result
     */
    async validateDTRDataExists(periodId) {
        try {
            const query = `
                SELECT COUNT(*) as dtr_count
                FROM dtr_records
                WHERE payroll_period_id = ?
                AND status = 'Active'
            `;

            const result = await executeQuery(query, [periodId]);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to validate DTR data'
                };
            }

            const dtrCount = result.data[0].dtr_count;

            if (dtrCount === 0) {
                return {
                    success: false,
                    isValid: false,
                    error: 'No DTR data found for this period',
                    message: 'Please import DTR data before processing payroll'
                };
            }

            return {
                success: true,
                isValid: true,
                dtrCount: dtrCount,
                message: `Found ${dtrCount} active DTR records for this period`
            };
        } catch (error) {
            console.error('Error validating DTR data:', error);
            return {
                success: false,
                error: 'Failed to validate DTR data',
                details: error.message
            };
        }
    }

    /**
     * Get payroll summary with DTR information
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Summary with DTR data
     */
    async getPayrollSummaryWithDTR(periodId) {
        try {
            // Get period
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Get DTR summary
            const dtrQuery = `
                SELECT 
                    COUNT(DISTINCT dr.employee_id) as total_employees,
                    SUM(dr.working_days) as total_working_days,
                    MIN(dr.working_days) as min_working_days,
                    MAX(dr.working_days) as max_working_days,
                    AVG(dr.working_days) as avg_working_days
                FROM dtr_records dr
                WHERE dr.payroll_period_id = ?
                AND dr.status = 'Active'
            `;

            const dtrResult = await executeQuery(dtrQuery, [periodId]);

            // Get payroll items summary
            const payrollQuery = `
                SELECT 
                    COUNT(*) as total_items,
                    SUM(basic_pay) as total_basic_pay,
                    SUM(total_allowances) as total_allowances,
                    SUM(total_deductions) as total_deductions,
                    SUM(gross_pay) as total_gross_pay,
                    SUM(net_pay) as total_net_pay
                FROM payroll_items
                WHERE payroll_period_id = ?
            `;

            const payrollResult = await executeQuery(payrollQuery, [periodId]);

            const dtrSummary = dtrResult.success && dtrResult.data.length > 0 ? dtrResult.data[0] : null;
            const payrollSummary = payrollResult.success && payrollResult.data.length > 0 ? payrollResult.data[0] : null;

            return {
                success: true,
                data: {
                    period: {
                        id: period.id,
                        name: period.getPeriodName(),
                        status: period.status,
                        start_date: period.start_date,
                        end_date: period.end_date
                    },
                    dtr_summary: dtrSummary ? {
                        has_dtr_data: dtrSummary.total_employees > 0,
                        total_employees: parseInt(dtrSummary.total_employees) || 0,
                        total_working_days: parseFloat(dtrSummary.total_working_days) || 0,
                        min_working_days: parseFloat(dtrSummary.min_working_days) || 0,
                        max_working_days: parseFloat(dtrSummary.max_working_days) || 0,
                        avg_working_days: parseFloat(dtrSummary.avg_working_days) || 0
                    } : {
                        has_dtr_data: false,
                        total_employees: 0,
                        total_working_days: 0
                    },
                    payroll_summary: payrollSummary ? {
                        total_items: parseInt(payrollSummary.total_items) || 0,
                        total_basic_pay: parseFloat(payrollSummary.total_basic_pay) || 0,
                        total_allowances: parseFloat(payrollSummary.total_allowances) || 0,
                        total_deductions: parseFloat(payrollSummary.total_deductions) || 0,
                        total_gross_pay: parseFloat(payrollSummary.total_gross_pay) || 0,
                        total_net_pay: parseFloat(payrollSummary.total_net_pay) || 0
                    } : null
                }
            };
        } catch (error) {
            console.error('Error getting payroll summary with DTR:', error);
            return {
                success: false,
                error: 'Failed to get payroll summary',
                details: error.message
            };
        }
    }

    /**
     * Check if payroll can be reprocessed after DTR re-import
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Validation result
     */
    async canReprocessPayroll(periodId) {
        try {
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Check if period status allows reprocessing
            const allowedStatuses = ['Draft', 'Processing'];
            const canReprocess = allowedStatuses.includes(period.status);

            if (!canReprocess) {
                return {
                    success: true,
                    canReprocess: false,
                    reason: `Cannot reprocess payroll. Period status is '${period.status}'. Only 'Draft' or 'Processing' periods can be reprocessed.`
                };
            }

            return {
                success: true,
                canReprocess: true,
                message: 'Payroll can be reprocessed'
            };
        } catch (error) {
            console.error('Error checking if payroll can be reprocessed:', error);
            return {
                success: false,
                error: 'Failed to check reprocess eligibility',
                details: error.message
            };
        }
    }

    /**
     * Get employees with missing DTR data
     * Identifies active employees who don't have DTR records for a period
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} List of employees without DTR
     */
    async getEmployeesWithoutDTR(periodId) {
        try {
            const query = `
                SELECT 
                    e.id,
                    e.employee_number,
                    e.first_name,
                    e.last_name,
                    e.plantilla_position,
                    e.employment_status
                FROM employees e
                WHERE e.employment_status = 'Active'
                AND e.deleted_at IS NULL
                AND NOT EXISTS (
                    SELECT 1 
                    FROM dtr_records dr 
                    WHERE dr.employee_id = e.id 
                    AND dr.payroll_period_id = ?
                    AND dr.status = 'Active'
                )
                ORDER BY e.last_name, e.first_name
            `;

            const result = await executeQuery(query, [periodId]);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to fetch employees without DTR'
                };
            }

            return {
                success: true,
                data: {
                    employees: result.data,
                    count: result.data.length
                }
            };
        } catch (error) {
            console.error('Error getting employees without DTR:', error);
            return {
                success: false,
                error: 'Failed to get employees without DTR',
                details: error.message
            };
        }
    }

    /**
     * Cancel payroll period and revert to Draft
     * Deletes all processed payroll items and reverts period status
     * Only works for periods with Processing status
     * @param {number} periodId - Payroll period ID
     * @param {number} userId - User ID performing the cancellation
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelPeriod(periodId, userId) {
        try {
            // Get period
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Cancel and revert the period
            const cancelResult = await period.cancelAndRevert(userId);

            if (cancelResult.success) {
                console.log(`Payroll period ${periodId} cancelled by user ${userId}. Deleted ${cancelResult.data.deleted_items} items.`);
            }

            return cancelResult;
        } catch (error) {
            console.error('Error cancelling payroll period:', error);
            return {
                success: false,
                error: 'Failed to cancel payroll period',
                details: error.message
            };
        }
    }

    /**
     * Soft delete a completed payroll period
     * Marks the period as deleted without removing from database
     * Only works for periods with Completed status
     * @param {number} periodId - Payroll period ID
     * @param {number} userId - User ID performing the deletion
     * @returns {Promise<Object>} Deletion result
     */
    async softDeletePeriod(periodId, userId) {
        try {
            // Soft delete the period
            const deleteResult = await PayrollPeriod.softDelete(periodId);

            if (deleteResult.success) {
                console.log(`Payroll period ${periodId} soft deleted by user ${userId}`);
            }

            return deleteResult;
        } catch (error) {
            console.error('Error soft deleting payroll period:', error);
            return {
                success: false,
                error: 'Failed to soft delete payroll period',
                details: error.message
            };
        }
    }
}

module.exports = new PayrollService();
