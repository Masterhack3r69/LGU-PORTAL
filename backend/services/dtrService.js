// services/dtrService.js - DTR (Daily Time Record) Service Layer
const XLSX = require('xlsx');
const moment = require('moment');
const { executeQuery, executeTransaction } = require('../config/database');
const excelParser = require('../utils/excelParser');
const dtrValidator = require('../utils/dtrValidator');
const Employee = require('../models/Employee');
const PayrollPeriod = require('../models/Payroll/PayrollPeriod');

/**
 * DTR Service - Handles all DTR-related business logic
 * Manages template generation, import processing, validation, and record management
 */
class DTRService {
    constructor() {
        this.BATCH_SIZE = 100; // Process records in batches
    }

    /**
     * Generate Excel template with employee data for a payroll period
     * @param {number} periodId - Payroll period ID
     * @param {number} userId - User ID performing the action
     * @returns {Promise<Object>} Template buffer and metadata
     */
    async generateTemplate(periodId, userId) {
        try {
            // Fetch payroll period
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Fetch active employees
            const employeesResult = await Employee.findAll({
                employment_status: 'Active',
                includeSoftDeleted: false
            });

            if (!employeesResult.success) {
                return {
                    success: false,
                    error: 'Failed to fetch employees'
                };
            }

            const employees = employeesResult.data;

            if (employees.length === 0) {
                return {
                    success: false,
                    error: 'No active employees found'
                };
            }

            // Create workbook
            const workbook = XLSX.utils.book_new();

            // Prepare data for template
            const templateData = employees.map(emp => ({
                'Employee Number': emp.employee_number,
                'Employee Name': emp.getFullName(),
                'Position': emp.plantilla_position || '',
                'Period Start Date': moment(period.start_date).format('YYYY-MM-DD'),
                'Period End Date': moment(period.end_date).format('YYYY-MM-DD'),
                'Total Working Days': ''
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(templateData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 18 }, // Employee Number
                { wch: 30 }, // Employee Name
                { wch: 35 }, // Position
                { wch: 18 }, // Period Start Date
                { wch: 18 }, // Period End Date
                { wch: 20 }  // Total Working Days
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'DTR Template');

            // Generate buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Generate filename
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const monthName = monthNames[period.month - 1];
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const filename = `DTR_Template_${period.year}_${monthName}_Period${period.period_number}_${timestamp}.xlsx`;

            return {
                success: true,
                data: {
                    buffer,
                    filename,
                    employeeCount: employees.length,
                    period: {
                        id: period.id,
                        name: period.getPeriodName(),
                        startDate: period.start_date,
                        endDate: period.end_date
                    }
                }
            };
        } catch (error) {
            console.error('Error generating DTR template:', error);
            return {
                success: false,
                error: 'Failed to generate template',
                details: error.message
            };
        }
    }

    /**
     * Parse uploaded Excel file
     * @param {string} filePath - Path to uploaded file
     * @returns {Promise<Object>} Parsed records
     */
    async parseExcelFile(filePath) {
        try {
            // Parse the file
            const parseResult = await excelParser.parseFile(filePath);
            if (!parseResult.success) {
                return {
                    success: false,
                    error: 'Failed to parse Excel file',
                    details: parseResult.error
                };
            }

            // Validate structure
            const structureValidation = excelParser.validateStructure(parseResult.data);
            if (!structureValidation.isValid) {
                return {
                    success: false,
                    error: 'Invalid file structure',
                    details: structureValidation.errors
                };
            }

            // Extract DTR records
            const extractResult = excelParser.extractDTRRecords(parseResult.data);

            return {
                success: true,
                data: {
                    records: extractResult.records,
                    parseErrors: extractResult.errors,
                    totalRows: extractResult.totalRows,
                    validRows: extractResult.validRows,
                    errorRows: extractResult.errorRows
                }
            };
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            return {
                success: false,
                error: 'Failed to parse Excel file',
                details: error.message
            };
        }
    }

    /**
     * Check if DTR records already exist for a period and validate re-import eligibility
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Re-import check result
     */
    async checkReimportEligibility(periodId) {
        try {
            // Fetch payroll period
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Check if DTR records already exist for this period
            const existingRecordsQuery = `
                SELECT COUNT(*) as count
                FROM dtr_records
                WHERE payroll_period_id = ? AND status = 'Active'
            `;
            const existingResult = await executeQuery(existingRecordsQuery, [periodId]);

            if (!existingResult.success) {
                return {
                    success: false,
                    error: 'Failed to check existing DTR records'
                };
            }

            const hasExistingRecords = existingResult.data[0].count > 0;

            // If no existing records, re-import is not applicable
            if (!hasExistingRecords) {
                return {
                    success: true,
                    data: {
                        hasExistingRecords: false,
                        canReimport: true,
                        requiresWarning: false
                    }
                };
            }

            // Get existing import information
            const lastImportQuery = `
                SELECT 
                    ib.id,
                    ib.file_name,
                    ib.imported_at,
                    ib.valid_records,
                    u.username as imported_by_username
                FROM dtr_import_batches ib
                JOIN users u ON ib.imported_by = u.id
                WHERE ib.payroll_period_id = ?
                ORDER BY ib.imported_at DESC
                LIMIT 1
            `;
            const lastImportResult = await executeQuery(lastImportQuery, [periodId]);

            const lastImport = lastImportResult.success && lastImportResult.data.length > 0
                ? lastImportResult.data[0]
                : null;

            // Check payroll status to determine if re-import is allowed
            const payrollStatus = period.status;

            // Prevent re-import if payroll is finalized (Completed or Paid)
            if (payrollStatus === 'Completed' || payrollStatus === 'Paid') {
                return {
                    success: true,
                    data: {
                        hasExistingRecords: true,
                        canReimport: false,
                        requiresWarning: false,
                        preventionReason: 'payroll_finalized',
                        payrollStatus,
                        lastImport,
                        message: 'Cannot re-import DTR. Payroll has been finalized for this period.'
                    }
                };
            }

            // Allow re-import if payroll is Draft or Processing
            if (payrollStatus === 'Draft' || payrollStatus === 'Processing') {
                return {
                    success: true,
                    data: {
                        hasExistingRecords: true,
                        canReimport: true,
                        requiresWarning: true,
                        payrollStatus,
                        lastImport,
                        warningMessage: 'DTR data already exists for this period. Re-importing will supersede existing records.',
                        additionalWarning: payrollStatus === 'Processing' 
                            ? 'Payroll items will need to be recalculated after re-import.'
                            : null
                    }
                };
            }

            // Default case (shouldn't reach here, but handle gracefully)
            return {
                success: true,
                data: {
                    hasExistingRecords: true,
                    canReimport: false,
                    requiresWarning: false,
                    preventionReason: 'unknown_status',
                    payrollStatus,
                    lastImport,
                    message: `Cannot re-import DTR. Payroll status is '${payrollStatus}'.`
                }
            };
        } catch (error) {
            console.error('Error checking re-import eligibility:', error);
            return {
                success: false,
                error: 'Failed to check re-import eligibility',
                details: error.message
            };
        }
    }

    /**
     * Validate DTR records against business rules
     * @param {Array} records - Array of DTR records
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Validation results
     */
    async validateDTRRecords(records, periodId) {
        try {
            // Fetch payroll period
            const periodResult = await PayrollPeriod.findById(periodId);
            if (!periodResult.success || !periodResult.data) {
                return {
                    success: false,
                    error: 'Payroll period not found'
                };
            }

            const period = periodResult.data;

            // Fetch all employees for validation
            const employeesResult = await Employee.findAll({
                includeSoftDeleted: false
            });

            if (!employeesResult.success) {
                return {
                    success: false,
                    error: 'Failed to fetch employees for validation'
                };
            }

            // Validate batch
            const validationResult = dtrValidator.validateBatch(
                records,
                period,
                employeesResult.data
            );

            // Calculate summary statistics
            const summary = this._calculateSummary(validationResult.validRecords, employeesResult.data);

            return {
                success: true,
                data: {
                    isValid: validationResult.isValid,
                    totalRecords: validationResult.totalRecords,
                    validRecords: validationResult.validRecords,
                    invalidRecords: validationResult.invalidRecords,
                    warningRecords: validationResult.warningRecords,
                    summary
                }
            };
        } catch (error) {
            console.error('Error validating DTR records:', error);
            return {
                success: false,
                error: 'Failed to validate DTR records',
                details: error.message
            };
        }
    }

    /**
     * Save DTR records to database with transaction
     * @param {Array} records - Valid DTR records
     * @param {number} periodId - Payroll period ID
     * @param {Object} batchInfo - Import batch information
     * @param {number} userId - User ID performing the import
     * @returns {Promise<Object>} Save result
     */
    async saveDTRRecords(records, periodId, batchInfo, userId) {
        try {
            return await executeTransaction(async (connection) => {
                // Create import batch record
                const batchQuery = `
                    INSERT INTO dtr_import_batches (
                        payroll_period_id, file_name, file_path, file_size,
                        total_records, valid_records, invalid_records, warning_records,
                        status, error_log, imported_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const batchParams = [
                    periodId,
                    batchInfo.fileName,
                    batchInfo.filePath,
                    batchInfo.fileSize,
                    batchInfo.totalRecords,
                    batchInfo.validRecords,
                    batchInfo.invalidRecords || 0,
                    batchInfo.warningRecords || 0,
                    'Processing',
                    JSON.stringify(batchInfo.errorLog || {}),
                    userId
                ];

                const [batchResult] = await connection.execute(batchQuery, batchParams);
                const batchId = batchResult.insertId;

                // Supersede previous records for this period
                await this._supersedePreviousRecordsInTransaction(connection, periodId, batchId);

                // Insert DTR records in batches
                let insertedCount = 0;
                for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
                    const batch = records.slice(i, i + this.BATCH_SIZE);
                    
                    const recordQuery = `
                        INSERT INTO dtr_records (
                            payroll_period_id, employee_id, employee_number,
                            start_date, end_date, working_days,
                            import_batch_id, status, imported_by
                        ) VALUES ?
                    `;

                    const recordValues = batch.map(record => [
                        periodId,
                        record.employeeId,
                        record.employeeNumber,
                        record.startDate,
                        record.endDate,
                        record.workingDays,
                        batchId,
                        'Active',
                        userId
                    ]);

                    await connection.query(recordQuery, [recordValues]);
                    insertedCount += batch.length;
                }

                // Update batch status to Completed
                const updateBatchQuery = `
                    UPDATE dtr_import_batches 
                    SET status = 'Completed', completed_at = NOW()
                    WHERE id = ?
                `;
                await connection.execute(updateBatchQuery, [batchId]);

                return {
                    batchId,
                    insertedCount,
                    periodId
                };
            });
        } catch (error) {
            console.error('Error saving DTR records:', error);
            return {
                success: false,
                error: 'Failed to save DTR records',
                details: error.message
            };
        }
    }

    /**
     * Get DTR records for a payroll period with filters
     * @param {number} periodId - Payroll period ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} DTR records
     */
    async getDTRRecords(periodId, filters = {}) {
        try {
            let query = `
                SELECT 
                    dr.*,
                    e.first_name, e.last_name, e.middle_name,
                    e.plantilla_position, e.current_daily_rate,
                    ib.file_name as import_file_name,
                    ib.imported_at as import_date,
                    u1.username as imported_by_username,
                    u2.username as updated_by_username,
                    (dr.working_days * e.current_daily_rate) as calculated_basic_pay
                FROM dtr_records dr
                JOIN employees e ON dr.employee_id = e.id
                JOIN dtr_import_batches ib ON dr.import_batch_id = ib.id
                JOIN users u1 ON dr.imported_by = u1.id
                LEFT JOIN users u2 ON dr.updated_by = u2.id
                WHERE dr.payroll_period_id = ?
                AND e.deleted_at IS NULL
            `;

            const params = [periodId];

            // Apply filters
            if (filters.status) {
                query += ' AND dr.status = ?';
                params.push(filters.status);
            } else {
                // Default to Active records only
                query += ' AND dr.status = ?';
                params.push('Active');
            }

            if (filters.employeeNumber) {
                query += ' AND dr.employee_number LIKE ?';
                params.push(`%${filters.employeeNumber}%`);
            }

            if (filters.employeeName) {
                query += ` AND (
                    e.first_name LIKE ? OR 
                    e.last_name LIKE ? OR
                    CONCAT(e.first_name, ' ', e.last_name) LIKE ?
                )`;
                const searchTerm = `%${filters.employeeName}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // Sorting
            const sortBy = filters.sortBy || 'e.last_name';
            const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${sortBy} ${sortOrder}`;

            // Pagination
            if (filters.limit) {
                const limit = parseInt(filters.limit) || 50;
                const offset = parseInt(filters.offset) || 0;
                query += ` LIMIT ${limit} OFFSET ${offset}`;
            }

            const result = await executeQuery(query, params);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to fetch DTR records'
                };
            }

            // Format records for frontend
            const formattedRecords = result.data.map(record => ({
                id: record.id,
                payrollPeriodId: record.payroll_period_id,
                employeeId: record.employee_id,
                employeeNumber: record.employee_number,
                employeeName: `${record.first_name} ${record.middle_name ? record.middle_name + ' ' : ''}${record.last_name}`.trim(),
                position: record.plantilla_position,
                startDate: record.start_date,
                endDate: record.end_date,
                workingDays: record.working_days,
                importBatchId: record.import_batch_id,
                status: record.status,
                notes: record.notes,
                importedBy: record.imported_by,
                importedByUsername: record.imported_by_username,
                importedAt: record.imported_at,
                importFileName: record.import_file_name,
                updatedBy: record.updated_by,
                updatedByUsername: record.updated_by_username,
                updatedAt: record.updated_at,
                calculatedBasicPay: record.calculated_basic_pay,
                currentDailyRate: record.current_daily_rate
            }));

            // Get total count for pagination
            const countQuery = `
                SELECT COUNT(*) as total
                FROM dtr_records dr
                JOIN employees e ON dr.employee_id = e.id
                WHERE dr.payroll_period_id = ?
                AND dr.status = 'Active'
                AND e.deleted_at IS NULL
            `;
            const countResult = await executeQuery(countQuery, [periodId]);
            const totalCount = countResult.success ? countResult.data[0].total : 0;

            return {
                success: true,
                data: {
                    records: formattedRecords,
                    totalCount,
                    page: filters.offset ? Math.floor(filters.offset / (filters.limit || 50)) + 1 : 1,
                    pageSize: filters.limit || 50
                }
            };
        } catch (error) {
            console.error('Error fetching DTR records:', error);
            return {
                success: false,
                error: 'Failed to fetch DTR records',
                details: error.message
            };
        }
    }

    /**
     * Update a DTR record
     * @param {number} recordId - DTR record ID
     * @param {Object} updates - Fields to update
     * @param {number} userId - User ID performing the update
     * @returns {Promise<Object>} Update result
     */
    async updateDTRRecord(recordId, updates, userId) {
        try {
            // Validate working days if provided
            if (updates.workingDays !== undefined) {
                const validation = dtrValidator.validateWorkingDays(updates.workingDays, 31);
                if (!validation.isValid) {
                    return {
                        success: false,
                        error: 'Invalid working days',
                        details: validation.errors
                    };
                }

                const precisionValidation = dtrValidator.validateDecimalPrecision(updates.workingDays);
                if (!precisionValidation.isValid) {
                    return {
                        success: false,
                        error: 'Invalid decimal precision',
                        details: precisionValidation.errors
                    };
                }
            }

            // Build update query
            const fields = [];
            const params = [];

            if (updates.workingDays !== undefined) {
                fields.push('working_days = ?');
                params.push(updates.workingDays);
            }

            if (updates.notes !== undefined) {
                fields.push('notes = ?');
                params.push(updates.notes);
            }

            if (fields.length === 0) {
                return {
                    success: false,
                    error: 'No fields to update'
                };
            }

            fields.push('updated_by = ?');
            params.push(userId);

            fields.push('updated_at = NOW()');

            params.push(recordId);

            const query = `
                UPDATE dtr_records 
                SET ${fields.join(', ')}
                WHERE id = ? AND status = 'Active'
            `;

            const result = await executeQuery(query, params);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to update DTR record'
                };
            }

            if (result.data.affectedRows === 0) {
                return {
                    success: false,
                    error: 'DTR record not found or already deleted'
                };
            }

            // Fetch updated record
            const fetchQuery = `
                SELECT dr.*, e.first_name, e.last_name, e.plantilla_position
                FROM dtr_records dr
                JOIN employees e ON dr.employee_id = e.id
                WHERE dr.id = ?
            `;
            const fetchResult = await executeQuery(fetchQuery, [recordId]);

            return {
                success: true,
                data: fetchResult.success ? fetchResult.data[0] : null,
                message: 'DTR record updated successfully'
            };
        } catch (error) {
            console.error('Error updating DTR record:', error);
            return {
                success: false,
                error: 'Failed to update DTR record',
                details: error.message
            };
        }
    }

    /**
     * Soft delete a DTR record
     * @param {number} recordId - DTR record ID
     * @param {number} userId - User ID performing the deletion
     * @returns {Promise<Object>} Delete result
     */
    async deleteDTRRecord(recordId, userId) {
        try {
            const query = `
                UPDATE dtr_records 
                SET status = 'Deleted', updated_by = ?, updated_at = NOW()
                WHERE id = ? AND status = 'Active'
            `;

            const result = await executeQuery(query, [userId, recordId]);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to delete DTR record'
                };
            }

            if (result.data.affectedRows === 0) {
                return {
                    success: false,
                    error: 'DTR record not found or already deleted'
                };
            }

            return {
                success: true,
                message: 'DTR record deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting DTR record:', error);
            return {
                success: false,
                error: 'Failed to delete DTR record',
                details: error.message
            };
        }
    }

    /**
     * Get import history for a payroll period
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Import batches
     */
    async getImportHistory(periodId) {
        try {
            const query = `
                SELECT 
                    ib.*,
                    u.username as imported_by_username,
                    u.email as imported_by_email
                FROM dtr_import_batches ib
                JOIN users u ON ib.imported_by = u.id
                WHERE ib.payroll_period_id = ?
                ORDER BY ib.imported_at DESC
            `;

            const result = await executeQuery(query, [periodId]);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to fetch import history'
                };
            }

            // Parse error_log JSON for each batch
            const batches = result.data.map(batch => ({
                ...batch,
                error_log: batch.error_log 
                    ? (typeof batch.error_log === 'string' ? JSON.parse(batch.error_log) : batch.error_log)
                    : null
            }));

            return {
                success: true,
                data: batches
            };
        } catch (error) {
            console.error('Error fetching import history:', error);
            return {
                success: false,
                error: 'Failed to fetch import history',
                details: error.message
            };
        }
    }

    /**
     * Get detailed information about an import batch
     * @param {number} batchId - Import batch ID
     * @returns {Promise<Object>} Batch details
     */
    async getImportBatchDetails(batchId) {
        try {
            // Get batch information
            const batchQuery = `
                SELECT 
                    ib.*,
                    u.username as imported_by_username,
                    u.email as imported_by_email,
                    pp.year, pp.month, pp.period_number
                FROM dtr_import_batches ib
                JOIN users u ON ib.imported_by = u.id
                JOIN payroll_periods pp ON ib.payroll_period_id = pp.id
                WHERE ib.id = ?
            `;

            const batchResult = await executeQuery(batchQuery, [batchId]);

            if (!batchResult.success || batchResult.data.length === 0) {
                return {
                    success: false,
                    error: 'Import batch not found'
                };
            }

            const batch = batchResult.data[0];
            batch.error_log = batch.error_log 
                ? (typeof batch.error_log === 'string' ? JSON.parse(batch.error_log) : batch.error_log)
                : null;

            // Get records from this batch
            const recordsQuery = `
                SELECT 
                    dr.*,
                    e.first_name, e.last_name, e.plantilla_position
                FROM dtr_records dr
                JOIN employees e ON dr.employee_id = e.id
                WHERE dr.import_batch_id = ?
                ORDER BY e.last_name, e.first_name
            `;

            const recordsResult = await executeQuery(recordsQuery, [batchId]);

            return {
                success: true,
                data: {
                    batch,
                    records: recordsResult.success ? recordsResult.data : []
                }
            };
        } catch (error) {
            console.error('Error fetching import batch details:', error);
            return {
                success: false,
                error: 'Failed to fetch import batch details',
                details: error.message
            };
        }
    }

    /**
     * Supersede previous DTR records for a period (mark as 'Superseded')
     * @param {number} periodId - Payroll period ID
     * @param {number} newBatchId - New import batch ID
     * @returns {Promise<Object>} Supersede result
     */
    async supersedePreviousRecords(periodId, newBatchId) {
        try {
            const query = `
                UPDATE dtr_records 
                SET status = 'Superseded'
                WHERE payroll_period_id = ? 
                AND import_batch_id != ?
                AND status = 'Active'
            `;

            const result = await executeQuery(query, [periodId, newBatchId]);

            if (!result.success) {
                return {
                    success: false,
                    error: 'Failed to supersede previous records'
                };
            }

            return {
                success: true,
                data: {
                    supersededCount: result.data.affectedRows
                }
            };
        } catch (error) {
            console.error('Error superseding previous records:', error);
            return {
                success: false,
                error: 'Failed to supersede previous records',
                details: error.message
            };
        }
    }

    /**
     * Supersede previous records within a transaction
     * @private
     */
    async _supersedePreviousRecordsInTransaction(connection, periodId, newBatchId) {
        const query = `
            UPDATE dtr_records 
            SET status = 'Superseded'
            WHERE payroll_period_id = ? 
            AND import_batch_id != ?
            AND status = 'Active'
        `;

        await connection.execute(query, [periodId, newBatchId]);
    }

    /**
     * Get DTR statistics for a payroll period
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} DTR statistics
     */
    async getDTRStats(periodId) {
        try {
            // First get the aggregate statistics
            const statsQuery = `
                SELECT 
                    COUNT(DISTINCT dr.employee_id) as total_employees,
                    COUNT(dr.id) as total_records,
                    SUM(dr.working_days) as total_working_days,
                    SUM(dr.working_days * e.current_daily_rate) as total_estimated_pay,
                    MAX(ib.imported_at) as last_import_date,
                    MAX(ib.id) as last_batch_id
                FROM dtr_records dr
                JOIN employees e ON dr.employee_id = e.id
                JOIN dtr_import_batches ib ON dr.import_batch_id = ib.id
                WHERE dr.payroll_period_id = ?
                AND dr.status = 'Active'
                AND e.deleted_at IS NULL
            `;

            const statsResult = await executeQuery(statsQuery, [periodId]);

            if (!statsResult.success) {
                return {
                    success: false,
                    error: 'Failed to fetch DTR statistics'
                };
            }

            const stats = statsResult.data[0];

            // If there's data, get the username of the last importer
            let lastImportedBy = null;
            if (stats.last_batch_id) {
                const userQuery = `
                    SELECT u.username
                    FROM dtr_import_batches ib
                    LEFT JOIN users u ON ib.imported_by = u.id
                    WHERE ib.id = ?
                `;
                const userResult = await executeQuery(userQuery, [stats.last_batch_id]);
                if (userResult.success && userResult.data.length > 0) {
                    lastImportedBy = userResult.data[0].username;
                }
            }

            return {
                success: true,
                data: {
                    totalEmployees: stats.total_employees || 0,
                    totalRecords: stats.total_records || 0,
                    totalWorkingDays: Math.round((stats.total_working_days || 0) * 100) / 100,
                    totalEstimatedPay: Math.round((stats.total_estimated_pay || 0) * 100) / 100,
                    lastImportDate: stats.last_import_date,
                    lastImportedBy: lastImportedBy,
                    hasData: stats.total_records > 0
                }
            };
        } catch (error) {
            console.error('Error fetching DTR statistics:', error);
            return {
                success: false,
                error: 'Failed to fetch DTR statistics',
                details: error.message
            };
        }
    }

    /**
     * Calculate summary statistics for valid records
     * @private
     */
    _calculateSummary(validRecords, employees) {
        const employeeMap = new Map();
        employees.forEach(emp => {
            employeeMap.set(emp.id, emp);
        });

        let totalWorkingDays = 0;
        let totalEstimatedPay = 0;

        validRecords.forEach(record => {
            totalWorkingDays += record.workingDays || 0;
            
            const employee = employeeMap.get(record.employeeId);
            if (employee && employee.current_daily_rate) {
                totalEstimatedPay += (record.workingDays || 0) * employee.current_daily_rate;
            }
        });

        return {
            totalEmployees: validRecords.length,
            totalWorkingDays: Math.round(totalWorkingDays * 100) / 100,
            estimatedBasicPay: Math.round(totalEstimatedPay * 100) / 100
        };
    }
}

module.exports = new DTRService();
