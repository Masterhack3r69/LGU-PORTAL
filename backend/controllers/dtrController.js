// controllers/dtrController.js - DTR (Daily Time Record) Controller
const dtrService = require('../services/dtrService');
const dtrFileStorage = require('../utils/dtrFileStorage');
const ApiResponse = require('../utils/apiResponse');
const { logPayrollAudit } = require('../middleware/payrollAudit');
const path = require('path');
const fs = require('fs').promises;

/**
 * DTR Controller - Handles all DTR-related HTTP requests
 * Manages template export, import, validation, and record management
 */
class DTRController {
    constructor() {
        // Bind all methods to preserve 'this' context
        this.exportTemplate = this.exportTemplate.bind(this);
        this.checkReimportEligibility = this.checkReimportEligibility.bind(this);
        this.uploadAndValidate = this.uploadAndValidate.bind(this);
        this.confirmImport = this.confirmImport.bind(this);
        this.getDTRRecords = this.getDTRRecords.bind(this);
        this.getEmployeeDTRRecord = this.getEmployeeDTRRecord.bind(this);
        this.updateDTRRecord = this.updateDTRRecord.bind(this);
        this.deleteDTRRecord = this.deleteDTRRecord.bind(this);
        this.getImportHistory = this.getImportHistory.bind(this);
        this.getImportBatchDetails = this.getImportBatchDetails.bind(this);
        this.getDTRStats = this.getDTRStats.bind(this);
    }

    /**
     * GET /api/dtr/template/:periodId
     * Export DTR template for a payroll period
     */
    async exportTemplate(req, res) {
        try {
            const { periodId } = req.params;
            const userId = req.session.user.id;

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Generate template
            const result = await dtrService.generateTemplate(parseInt(periodId), userId);

            if (!result.success) {
                const response = ApiResponse.error(
                    result.error || 'Failed to generate template',
                    'TEMPLATE_GENERATION_ERROR',
                    result.details,
                    400
                );
                return res.status(400).json(response);
            }

            // Log audit
            await logPayrollAudit({
                userId,
                action: 'DTR_TEMPLATE_EXPORT',
                tableName: 'payroll_periods',
                recordId: parseInt(periodId),
                newValues: {
                    filename: result.data.filename,
                    employee_count: result.data.employeeCount,
                    period_name: result.data.period.name
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });

            // Set response headers for file download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
            res.setHeader('Content-Length', result.data.buffer.length);

            // Send file buffer
            return res.send(result.data.buffer);

        } catch (error) {
            console.error('Export DTR template error:', error);
            const response = ApiResponse.serverError('Failed to export template');
            return res.status(500).json(response);
        }
    }

    /**
     * GET /api/dtr/reimport-check/:periodId
     * Check if re-import is allowed for a payroll period
     */
    async checkReimportEligibility(req, res) {
        try {
            const { periodId } = req.params;

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Check re-import eligibility
            const result = await dtrService.checkReimportEligibility(parseInt(periodId));

            if (!result.success) {
                const response = ApiResponse.error(
                    result.error || 'Failed to check re-import eligibility',
                    'REIMPORT_CHECK_ERROR',
                    result.details,
                    400
                );
                return res.status(400).json(response);
            }

            const response = ApiResponse.success(
                result.data,
                'Re-import eligibility checked successfully'
            );
            return res.status(200).json(response);

        } catch (error) {
            console.error('Check re-import eligibility error:', error);
            const response = ApiResponse.serverError('Failed to check re-import eligibility');
            return res.status(500).json(response);
        }
    }

    /**
     * POST /api/dtr/import/:periodId
     * Upload and validate DTR file
     */
    async uploadAndValidate(req, res) {
        try {
            const { periodId } = req.params;
            const userId = req.session?.user?.id;

            console.log('DTR Upload - Period ID:', periodId);
            console.log('DTR Upload - User ID:', userId);
            console.log('DTR Upload - File:', req.file ? req.file.originalname : 'NO FILE');
            console.log('DTR Upload - Session:', req.session ? 'EXISTS' : 'MISSING');
            console.log('DTR Upload - User:', req.session?.user ? 'EXISTS' : 'MISSING');

            // Validate session and user
            if (!req.session || !req.session.user) {
                console.log('DTR Upload - No session or user');
                const response = ApiResponse.error(
                    'Authentication required',
                    'UNAUTHORIZED',
                    'Please log in to upload DTR files',
                    401
                );
                return res.status(401).json(response);
            }

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                console.log('DTR Upload - Invalid period ID');
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Check re-import eligibility first
            console.log('DTR Upload - Checking re-import eligibility...');
            const reimportCheck = await dtrService.checkReimportEligibility(parseInt(periodId));
            
            if (!reimportCheck.success) {
                console.log('DTR Upload - Re-import check failed:', reimportCheck.error);
                const response = ApiResponse.error(
                    reimportCheck.error || 'Failed to check re-import eligibility',
                    'REIMPORT_CHECK_ERROR',
                    reimportCheck.details,
                    400
                );
                return res.status(400).json(response);
            }

            console.log('DTR Upload - Re-import check result:', reimportCheck.data);

            // If re-import is not allowed, return error
            if (!reimportCheck.data.canReimport) {
                console.log('DTR Upload - Re-import not allowed');
                const response = ApiResponse.error(
                    reimportCheck.data.message || 'Re-import not allowed',
                    'REIMPORT_NOT_ALLOWED',
                    {
                        reason: reimportCheck.data.preventionReason,
                        payrollStatus: reimportCheck.data.payrollStatus,
                        lastImport: reimportCheck.data.lastImport
                    },
                    403
                );
                return res.status(403).json(response);
            }

            // Check if file was uploaded
            if (!req.file) {
                console.log('DTR Upload - No file uploaded');
                console.log('DTR Upload - req.body:', req.body);
                console.log('DTR Upload - req.files:', req.files);
                const response = ApiResponse.validationError('No file uploaded', ['Please upload an Excel file']);
                return res.status(400).json(response);
            }

            console.log('DTR Upload - File received, proceeding with validation...');
            console.log('DTR Upload - File details:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });

            const file = req.file;

            // Validate file type
            const allowedMimeTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel' // .xls
            ];

            if (!allowedMimeTypes.includes(file.mimetype)) {
                // Clean up uploaded file
                await fs.unlink(file.path).catch(err => console.error('Failed to delete invalid file:', err));
                
                const response = ApiResponse.validationError(
                    'Invalid file type',
                    ['Only Excel files (.xlsx, .xls) are allowed']
                );
                return res.status(400).json(response);
            }

            // Parse Excel file
            const parseResult = await dtrService.parseExcelFile(file.path);

            if (!parseResult.success) {
                // Clean up uploaded file
                await fs.unlink(file.path).catch(err => console.error('Failed to delete file:', err));
                
                const response = ApiResponse.error(
                    parseResult.error || 'Failed to parse Excel file',
                    'PARSE_ERROR',
                    parseResult.details,
                    400
                );
                return res.status(400).json(response);
            }

            // Validate DTR records
            const validationResult = await dtrService.validateDTRRecords(
                parseResult.data.records,
                parseInt(periodId)
            );

            if (!validationResult.success) {
                // Clean up uploaded file
                await fs.unlink(file.path).catch(err => console.error('Failed to delete file:', err));
                
                const response = ApiResponse.error(
                    validationResult.error || 'Failed to validate DTR records',
                    'VALIDATION_ERROR',
                    validationResult.details,
                    400
                );
                return res.status(400).json(response);
            }

            // Store file info in session for confirmation step
            req.session.dtrImportData = {
                periodId: parseInt(periodId),
                filePath: file.path,
                fileName: file.originalname,
                fileSize: file.size,
                validationResult: validationResult.data,
                reimportInfo: reimportCheck.data,
                uploadedAt: new Date().toISOString()
            };

            // Log audit for upload
            await logPayrollAudit({
                userId,
                action: 'DTR_UPLOAD_VALIDATE',
                tableName: 'dtr_import_batches',
                recordId: parseInt(periodId),
                newValues: {
                    file_name: file.originalname,
                    file_size: file.size,
                    total_records: validationResult.data.totalRecords,
                    valid_records: validationResult.data.validRecords.length,
                    invalid_records: validationResult.data.invalidRecords.length,
                    warning_records: validationResult.data.warningRecords.length,
                    is_reimport: reimportCheck.data.hasExistingRecords
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });

            // Return validation results with re-import information
            const response = ApiResponse.success(
                {
                    isValid: validationResult.data.isValid,
                    totalRecords: validationResult.data.totalRecords,
                    validRecords: validationResult.data.validRecords,
                    invalidRecords: validationResult.data.invalidRecords,
                    warningRecords: validationResult.data.warningRecords,
                    summary: validationResult.data.summary,
                    canProceed: validationResult.data.invalidRecords.length === 0,
                    reimportInfo: {
                        isReimport: reimportCheck.data.hasExistingRecords,
                        requiresWarning: reimportCheck.data.requiresWarning,
                        warningMessage: reimportCheck.data.warningMessage,
                        additionalWarning: reimportCheck.data.additionalWarning,
                        lastImport: reimportCheck.data.lastImport,
                        payrollStatus: reimportCheck.data.payrollStatus
                    }
                },
                'File uploaded and validated successfully'
            );
            return res.status(200).json(response);

        } catch (error) {
            console.error('Upload and validate DTR error:', error);
            
            // Clean up uploaded file if it exists
            if (req.file && req.file.path) {
                await fs.unlink(req.file.path).catch(err => console.error('Failed to delete file:', err));
            }
            
            const response = ApiResponse.serverError('Failed to process uploaded file');
            return res.status(500).json(response);
        }
    }

    /**
     * POST /api/dtr/import/:periodId/confirm
     * Confirm and process DTR import
     */
    async confirmImport(req, res) {
        try {
            const { periodId } = req.params;
            const userId = req.session.user.id;

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Check if import data exists in session
            if (!req.session.dtrImportData || req.session.dtrImportData.periodId !== parseInt(periodId)) {
                const response = ApiResponse.error(
                    'No pending import found',
                    'NO_PENDING_IMPORT',
                    'Please upload and validate a file first',
                    400
                );
                return res.status(400).json(response);
            }

            const importData = req.session.dtrImportData;
            const validationResult = importData.validationResult;

            // Check if there are invalid records
            if (validationResult.invalidRecords.length > 0) {
                const response = ApiResponse.error(
                    'Cannot import file with invalid records',
                    'INVALID_RECORDS_PRESENT',
                    'Please fix all errors before importing',
                    400
                );
                return res.status(400).json(response);
            }

            // Prepare batch info
            const batchInfo = {
                fileName: importData.fileName,
                filePath: importData.filePath,
                fileSize: importData.fileSize,
                totalRecords: validationResult.totalRecords,
                validRecords: validationResult.validRecords.length,
                invalidRecords: validationResult.invalidRecords.length,
                warningRecords: validationResult.warningRecords.length,
                errorLog: {
                    errors: validationResult.invalidRecords,
                    warnings: validationResult.warningRecords
                }
            };

            // Save DTR records
            const saveResult = await dtrService.saveDTRRecords(
                validationResult.validRecords,
                parseInt(periodId),
                batchInfo,
                userId
            );

            if (!saveResult.success) {
                const response = ApiResponse.error(
                    saveResult.error || 'Failed to save DTR records',
                    'SAVE_ERROR',
                    saveResult.details,
                    500
                );
                return res.status(500).json(response);
            }

            // Log audit for successful import
            await logPayrollAudit({
                userId,
                action: 'DTR_IMPORT_CONFIRM',
                tableName: 'dtr_import_batches',
                recordId: saveResult.batchId,
                newValues: {
                    batch_id: saveResult.batchId,
                    period_id: parseInt(periodId),
                    file_name: importData.fileName,
                    total_records: validationResult.totalRecords,
                    valid_records: validationResult.validRecords.length,
                    inserted_count: saveResult.insertedCount
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });

            // Clear session data
            delete req.session.dtrImportData;

            // Return success response
            const response = ApiResponse.success(
                {
                    batchId: saveResult.batchId,
                    periodId: saveResult.periodId,
                    insertedCount: saveResult.insertedCount,
                    summary: validationResult.summary
                },
                'DTR records imported successfully'
            );
            return res.status(201).json(response);

        } catch (error) {
            console.error('Confirm DTR import error:', error);
            const response = ApiResponse.serverError('Failed to confirm import');
            return res.status(500).json(response);
        }
    }

    /**
     * GET /api/dtr/records/:periodId
     * Retrieve all DTR records for a payroll period
     */
    async getDTRRecords(req, res) {
        try {
            const { periodId } = req.params;
            const { status, employeeNumber, employeeName, sortBy, sortOrder, limit, offset } = req.query;

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Build filters
            const filters = {
                status: status || 'Active',
                employeeNumber,
                employeeName,
                sortBy,
                sortOrder,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0
            };

            // Get DTR records
            const result = await dtrService.getDTRRecords(parseInt(periodId), filters);

            if (!result.success) {
                const response = ApiResponse.error(
                    result.error || 'Failed to retrieve DTR records',
                    'FETCH_ERROR',
                    result.details,
                    500
                );
                return res.status(500).json(response);
            }

            const response = ApiResponse.success(
                {
                    records: result.data.records,
                    pagination: {
                        total: result.data.totalCount,
                        page: result.data.page,
                        pageSize: result.data.pageSize,
                        hasMore: (result.data.page * result.data.pageSize) < result.data.totalCount
                    }
                },
                'DTR records retrieved successfully'
            );
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get DTR records error:', error);
            const response = ApiResponse.serverError('Failed to retrieve DTR records');
            return res.status(500).json(response);
        }
    }

    /**
     * GET /api/dtr/records/:periodId/:employeeId
     * Retrieve specific employee's DTR record
     */
    async getEmployeeDTRRecord(req, res) {
        try {
            const { periodId, employeeId } = req.params;

            // Validate parameters
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            if (!employeeId || isNaN(employeeId)) {
                const response = ApiResponse.validationError('Invalid employee ID', ['Employee ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Get DTR records with employee filter
            const result = await dtrService.getDTRRecords(parseInt(periodId), {
                status: 'Active',
                limit: 1,
                offset: 0
            });

            if (!result.success) {
                const response = ApiResponse.error(
                    result.error || 'Failed to retrieve DTR record',
                    'FETCH_ERROR',
                    result.details,
                    500
                );
                return res.status(500).json(response);
            }

            // Filter by employee ID
            const employeeRecord = result.data.records.find(
                record => record.employee_id === parseInt(employeeId)
            );

            if (!employeeRecord) {
                const response = ApiResponse.notFound('DTR record for this employee');
                return res.status(404).json(response);
            }

            const response = ApiResponse.success(employeeRecord, 'DTR record retrieved successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get employee DTR record error:', error);
            const response = ApiResponse.serverError('Failed to retrieve DTR record');
            return res.status(500).json(response);
        }
    }

    /**
     * PUT /api/dtr/records/:id
     * Update a DTR record
     */
    async updateDTRRecord(req, res) {
        try {
            const { id } = req.params;
            const { working_days, notes } = req.body;
            const userId = req.session.user.id;

            // Validate record ID
            if (!id || isNaN(id)) {
                const response = ApiResponse.validationError('Invalid record ID', ['Record ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Validate at least one field is provided
            if (working_days === undefined && notes === undefined) {
                const response = ApiResponse.validationError(
                    'No fields to update',
                    ['Please provide working_days or notes to update']
                );
                return res.status(400).json(response);
            }

            // Prepare updates
            const updates = {};
            if (working_days !== undefined) {
                updates.workingDays = parseFloat(working_days);
            }
            if (notes !== undefined) {
                updates.notes = notes;
            }

            // Update DTR record
            const result = await dtrService.updateDTRRecord(parseInt(id), updates, userId);

            if (!result.success) {
                const statusCode = result.error.includes('not found') ? 404 : 400;
                const response = ApiResponse.error(
                    result.error || 'Failed to update DTR record',
                    'UPDATE_ERROR',
                    result.details,
                    statusCode
                );
                return res.status(statusCode).json(response);
            }

            // Log audit
            await logPayrollAudit({
                userId,
                action: 'DTR_RECORD_UPDATE',
                tableName: 'dtr_records',
                recordId: parseInt(id),
                newValues: updates,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });

            const response = ApiResponse.success(result.data, result.message || 'DTR record updated successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Update DTR record error:', error);
            const response = ApiResponse.serverError('Failed to update DTR record');
            return res.status(500).json(response);
        }
    }

    /**
     * DELETE /api/dtr/records/:id
     * Soft delete a DTR record
     */
    async deleteDTRRecord(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            // Validate record ID
            if (!id || isNaN(id)) {
                const response = ApiResponse.validationError('Invalid record ID', ['Record ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Delete DTR record
            const result = await dtrService.deleteDTRRecord(parseInt(id), userId);

            if (!result.success) {
                const statusCode = result.error.includes('not found') ? 404 : 400;
                const response = ApiResponse.error(
                    result.error || 'Failed to delete DTR record',
                    'DELETE_ERROR',
                    result.details,
                    statusCode
                );
                return res.status(statusCode).json(response);
            }

            // Log audit
            await logPayrollAudit({
                userId,
                action: 'DTR_RECORD_DELETE',
                tableName: 'dtr_records',
                recordId: parseInt(id),
                newValues: { status: 'Deleted' },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });

            const response = ApiResponse.success(null, result.message || 'DTR record deleted successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Delete DTR record error:', error);
            const response = ApiResponse.serverError('Failed to delete DTR record');
            return res.status(500).json(response);
        }
    }

    /**
     * GET /api/dtr/imports/:periodId
     * Retrieve import history for a payroll period
     */
    async getImportHistory(req, res) {
        try {
            const { periodId } = req.params;

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Get import history
            const result = await dtrService.getImportHistory(parseInt(periodId));

            if (!result.success) {
                const response = ApiResponse.error(
                    result.error || 'Failed to retrieve import history',
                    'FETCH_ERROR',
                    result.details,
                    500
                );
                return res.status(500).json(response);
            }

            const response = ApiResponse.success(result.data, 'Import history retrieved successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get import history error:', error);
            const response = ApiResponse.serverError('Failed to retrieve import history');
            return res.status(500).json(response);
        }
    }

    /**
     * GET /api/dtr/imports/batch/:batchId
     * Retrieve detailed import batch information
     */
    async getImportBatchDetails(req, res) {
        try {
            const { batchId } = req.params;

            // Validate batchId
            if (!batchId || isNaN(batchId)) {
                const response = ApiResponse.validationError('Invalid batch ID', ['Batch ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Get batch details
            const result = await dtrService.getImportBatchDetails(parseInt(batchId));

            if (!result.success) {
                const statusCode = result.error.includes('not found') ? 404 : 500;
                const response = ApiResponse.error(
                    result.error || 'Failed to retrieve batch details',
                    'FETCH_ERROR',
                    result.details,
                    statusCode
                );
                return res.status(statusCode).json(response);
            }

            const response = ApiResponse.success(result.data, 'Batch details retrieved successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get import batch details error:', error);
            const response = ApiResponse.serverError('Failed to retrieve batch details');
            return res.status(500).json(response);
        }
    }

    /**
     * GET /api/dtr/stats/:periodId
     * Retrieve DTR statistics for a payroll period
     */
    async getDTRStats(req, res) {
        try {
            const { periodId } = req.params;

            // Validate periodId
            if (!periodId || isNaN(periodId)) {
                const response = ApiResponse.validationError('Invalid period ID', ['Period ID must be a valid number']);
                return res.status(400).json(response);
            }

            // Get DTR statistics from service
            const result = await dtrService.getDTRStats(parseInt(periodId));

            if (!result.success) {
                const response = ApiResponse.error(
                    result.error || 'Failed to retrieve DTR statistics',
                    'FETCH_ERROR',
                    result.details,
                    500
                );
                return res.status(500).json(response);
            }

            // Map service response to frontend expected format
            const stats = {
                periodId: parseInt(periodId),
                totalEmployees: result.data.totalEmployees,
                totalWorkingDays: result.data.totalWorkingDays,
                averageWorkingDays: result.data.totalEmployees > 0 
                    ? Math.round((result.data.totalWorkingDays / result.data.totalEmployees) * 100) / 100 
                    : 0,
                estimatedBasicPay: result.data.totalEstimatedPay || 0,
                lastImportDate: result.data.lastImportDate,
                lastImportBy: result.data.lastImportedBy,
                hasActiveRecords: result.data.hasData,
                hasImport: result.data.hasData // Frontend expects this property
            };

            const response = ApiResponse.success(stats, 'DTR statistics retrieved successfully');
            return res.status(200).json(response);

        } catch (error) {
            console.error('Get DTR statistics error:', error);
            const response = ApiResponse.serverError('Failed to retrieve DTR statistics');
            return res.status(500).json(response);
        }
    }
}

module.exports = new DTRController();
