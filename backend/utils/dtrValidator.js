// utils/dtrValidator.js - DTR validation utility
const moment = require('moment');

/**
 * DTR Validator for Daily Time Record imports
 * Validates DTR records against business rules and database constraints
 */
class DTRValidator {
    constructor() {
        // Validation error types
        this.ERROR_TYPES = {
            EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
            EMPLOYEE_INACTIVE: 'EMPLOYEE_INACTIVE',
            INVALID_WORKING_DAYS: 'INVALID_WORKING_DAYS',
            NEGATIVE_WORKING_DAYS: 'NEGATIVE_WORKING_DAYS',
            WORKING_DAYS_EXCEEDS_PERIOD: 'WORKING_DAYS_EXCEEDS_PERIOD',
            DATE_MISMATCH: 'DATE_MISMATCH',
            INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
            MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
            DUPLICATE_EMPLOYEE: 'DUPLICATE_EMPLOYEE',
            DECIMAL_PRECISION_ERROR: 'DECIMAL_PRECISION_ERROR'
        };
    }

    /**
     * Validate a single DTR record
     * @param {Object} record - DTR record to validate
     * @param {Object} period - Payroll period object
     * @param {Map} employeeMap - Map of employee numbers to employee objects
     * @returns {Object} Validation result with errors and warnings
     */
    validateRecord(record, period, employeeMap) {
        const errors = [];
        const warnings = [];

        // Validate required fields
        if (!record.employeeNumber) {
            errors.push({
                type: this.ERROR_TYPES.MISSING_REQUIRED_FIELD,
                field: 'employeeNumber',
                message: 'Employee number is required'
            });
        }

        if (record.startDate === null || record.startDate === undefined) {
            errors.push({
                type: this.ERROR_TYPES.MISSING_REQUIRED_FIELD,
                field: 'startDate',
                message: 'Start date is required'
            });
        }

        if (record.endDate === null || record.endDate === undefined) {
            errors.push({
                type: this.ERROR_TYPES.MISSING_REQUIRED_FIELD,
                field: 'endDate',
                message: 'End date is required'
            });
        }

        if (record.workingDays === null || record.workingDays === undefined) {
            errors.push({
                type: this.ERROR_TYPES.MISSING_REQUIRED_FIELD,
                field: 'workingDays',
                message: 'Working days is required'
            });
        }

        // If required fields are missing, return early
        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
                warnings,
                record
            };
        }

        // Validate employee exists
        const employeeValidation = this.validateEmployeeExists(record.employeeNumber, employeeMap);
        if (!employeeValidation.isValid) {
            errors.push(...employeeValidation.errors);
        } else if (employeeValidation.warnings.length > 0) {
            warnings.push(...employeeValidation.warnings);
        }

        // Store employee data if found
        let employee = null;
        if (employeeValidation.employee) {
            employee = employeeValidation.employee;
            record.employeeId = employee.id;
            record.employeeName = `${employee.first_name} ${employee.last_name}`;
            record.position = employee.plantilla_position;
        }

        // Validate date alignment with period
        if (record.startDate && record.endDate && period) {
            const dateValidation = this.validateDateMatch(
                record.startDate,
                record.endDate,
                period.start_date,
                period.end_date
            );
            if (!dateValidation.isValid) {
                errors.push(...dateValidation.errors);
            }
        }

        // Validate working days
        if (record.workingDays !== null && record.workingDays !== undefined) {
            // Check decimal precision
            const precisionValidation = this.validateDecimalPrecision(record.workingDays);
            if (!precisionValidation.isValid) {
                errors.push(...precisionValidation.errors);
            }

            // Calculate period duration for validation
            let maxDays = 31; // Default max
            if (period && period.start_date && period.end_date) {
                const startDate = moment(period.start_date);
                const endDate = moment(period.end_date);
                maxDays = endDate.diff(startDate, 'days') + 1; // +1 to include both start and end dates
            }

            const workingDaysValidation = this.validateWorkingDays(record.workingDays, maxDays);
            if (!workingDaysValidation.isValid) {
                errors.push(...workingDaysValidation.errors);
            } else if (workingDaysValidation.warnings.length > 0) {
                warnings.push(...workingDaysValidation.warnings);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            record,
            employee
        };
    }

    /**
     * Validate a batch of DTR records
     * @param {Array} records - Array of DTR records
     * @param {Object} period - Payroll period object
     * @param {Array} employees - Array of employee objects
     * @returns {Object} Batch validation result
     */
    validateBatch(records, period, employees) {
        // Create employee map for quick lookup
        const employeeMap = new Map();
        employees.forEach(emp => {
            employeeMap.set(emp.employee_number, emp);
        });

        const validRecords = [];
        const invalidRecords = [];
        const warningRecords = [];
        const seenEmployees = new Set();
        const duplicateEmployees = new Set();

        // Validate each record
        records.forEach((record, index) => {
            // Check for duplicate employees in the batch
            if (record.employeeNumber) {
                if (seenEmployees.has(record.employeeNumber)) {
                    duplicateEmployees.add(record.employeeNumber);
                }
                seenEmployees.add(record.employeeNumber);
            }

            const validation = this.validateRecord(record, period, employeeMap);

            // Add duplicate employee error if applicable
            if (duplicateEmployees.has(record.employeeNumber)) {
                validation.errors.push({
                    type: this.ERROR_TYPES.DUPLICATE_EMPLOYEE,
                    field: 'employeeNumber',
                    message: `Employee number ${record.employeeNumber} appears multiple times in the import file`
                });
                validation.isValid = false;
            }

            if (!validation.isValid) {
                invalidRecords.push({
                    rowNumber: record.rowNumber || index + 2,
                    employeeNumber: record.employeeNumber || 'Unknown',
                    employeeName: record.employeeName || 'Unknown',
                    errors: validation.errors,
                    warnings: validation.warnings,
                    record: validation.record
                });
            } else if (validation.warnings.length > 0) {
                warningRecords.push({
                    rowNumber: record.rowNumber || index + 2,
                    employeeNumber: record.employeeNumber,
                    employeeName: validation.record.employeeName,
                    warnings: validation.warnings,
                    record: validation.record
                });
                // Still add to valid records if only warnings
                validRecords.push(validation.record);
            } else {
                validRecords.push(validation.record);
            }
        });

        return {
            isValid: invalidRecords.length === 0,
            totalRecords: records.length,
            validRecords,
            invalidRecords,
            warningRecords,
            summary: {
                total: records.length,
                valid: validRecords.length,
                invalid: invalidRecords.length,
                warnings: warningRecords.length
            }
        };
    }

    /**
     * Validate employee exists in the system
     * @param {string} employeeNumber - Employee number to validate
     * @param {Map} employeeMap - Map of employee numbers to employee objects
     * @returns {Object} Validation result
     */
    validateEmployeeExists(employeeNumber, employeeMap) {
        const errors = [];
        const warnings = [];

        if (!employeeNumber) {
            errors.push({
                type: this.ERROR_TYPES.MISSING_REQUIRED_FIELD,
                field: 'employeeNumber',
                message: 'Employee number is required'
            });
            return { isValid: false, errors, warnings, employee: null };
        }

        const employee = employeeMap.get(employeeNumber);

        if (!employee) {
            errors.push({
                type: this.ERROR_TYPES.EMPLOYEE_NOT_FOUND,
                field: 'employeeNumber',
                message: `Employee number ${employeeNumber} not found in system`
            });
            return { isValid: false, errors, warnings, employee: null };
        }

        // Check if employee is active
        if (employee.employment_status !== 'Active') {
            warnings.push({
                type: this.ERROR_TYPES.EMPLOYEE_INACTIVE,
                field: 'employmentStatus',
                message: `Employee ${employeeNumber} is not active (status: ${employee.employment_status})`
            });
        }

        return { isValid: true, errors, warnings, employee };
    }

    /**
     * Validate start and end dates match the payroll period
     * @param {string} recordStartDate - Record start date (YYYY-MM-DD)
     * @param {string} recordEndDate - Record end date (YYYY-MM-DD)
     * @param {string} periodStartDate - Period start date (YYYY-MM-DD)
     * @param {string} periodEndDate - Period end date (YYYY-MM-DD)
     * @returns {Object} Validation result
     */
    validateDateMatch(recordStartDate, recordEndDate, periodStartDate, periodEndDate) {
        const errors = [];

        // Parse dates
        const recStart = moment(recordStartDate, 'YYYY-MM-DD', true);
        const recEnd = moment(recordEndDate, 'YYYY-MM-DD', true);
        const perStart = moment(periodStartDate, 'YYYY-MM-DD', true);
        const perEnd = moment(periodEndDate, 'YYYY-MM-DD', true);

        // Validate date formats
        if (!recStart.isValid()) {
            errors.push({
                type: this.ERROR_TYPES.INVALID_DATE_FORMAT,
                field: 'startDate',
                message: `Invalid start date format: ${recordStartDate}`
            });
        }

        if (!recEnd.isValid()) {
            errors.push({
                type: this.ERROR_TYPES.INVALID_DATE_FORMAT,
                field: 'endDate',
                message: `Invalid end date format: ${recordEndDate}`
            });
        }

        if (errors.length > 0) {
            return { isValid: false, errors };
        }

        // Check start date match
        if (!recStart.isSame(perStart, 'day')) {
            errors.push({
                type: this.ERROR_TYPES.DATE_MISMATCH,
                field: 'startDate',
                message: `Start date mismatch: Expected ${perStart.format('YYYY-MM-DD')}, Found ${recStart.format('YYYY-MM-DD')}`
            });
        }

        // Check end date match
        if (!recEnd.isSame(perEnd, 'day')) {
            errors.push({
                type: this.ERROR_TYPES.DATE_MISMATCH,
                field: 'endDate',
                message: `End date mismatch: Expected ${perEnd.format('YYYY-MM-DD')}, Found ${recEnd.format('YYYY-MM-DD')}`
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate working days value
     * @param {number} workingDays - Working days value
     * @param {number} maxDays - Maximum days in the period
     * @returns {Object} Validation result
     */
    validateWorkingDays(workingDays, maxDays = 31) {
        const errors = [];
        const warnings = [];

        // Check if it's a valid number
        if (typeof workingDays !== 'number' || isNaN(workingDays)) {
            errors.push({
                type: this.ERROR_TYPES.INVALID_WORKING_DAYS,
                field: 'workingDays',
                message: 'Working days must be a valid number'
            });
            return { isValid: false, errors, warnings };
        }

        // Check for negative values
        if (workingDays < 0) {
            errors.push({
                type: this.ERROR_TYPES.NEGATIVE_WORKING_DAYS,
                field: 'workingDays',
                message: 'Working days cannot be negative'
            });
        }

        // Warning for zero working days
        if (workingDays === 0) {
            warnings.push({
                type: this.ERROR_TYPES.INVALID_WORKING_DAYS,
                field: 'workingDays',
                message: 'Working days is zero'
            });
        }

        // Check if exceeds period duration
        if (workingDays > maxDays) {
            warnings.push({
                type: this.ERROR_TYPES.WORKING_DAYS_EXCEEDS_PERIOD,
                field: 'workingDays',
                message: `Working days (${workingDays}) exceeds period duration (${maxDays} days)`
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate decimal precision (max 2 decimal places)
     * @param {number} value - Decimal value to validate
     * @returns {Object} Validation result
     */
    validateDecimalPrecision(value) {
        const errors = [];

        if (typeof value !== 'number' || isNaN(value)) {
            errors.push({
                type: this.ERROR_TYPES.INVALID_WORKING_DAYS,
                field: 'workingDays',
                message: 'Value must be a valid number'
            });
            return { isValid: false, errors };
        }

        // Check decimal places
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
            errors.push({
                type: this.ERROR_TYPES.DECIMAL_PRECISION_ERROR,
                field: 'workingDays',
                message: `Working days must have at most 2 decimal places (found ${decimalPlaces})`
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format validation errors for user-friendly display
     * @param {Array} errors - Array of error objects
     * @returns {Array} Formatted error messages
     */
    formatValidationErrors(errors) {
        if (!errors || errors.length === 0) {
            return [];
        }

        return errors.map(error => {
            const fieldLabel = this._getFieldLabel(error.field);
            return {
                type: error.type,
                field: error.field,
                fieldLabel,
                message: error.message,
                severity: 'error'
            };
        });
    }

    /**
     * Format warnings for user-friendly display
     * @param {Array} warnings - Array of warning objects
     * @returns {Array} Formatted warning messages
     */
    formatWarnings(warnings) {
        if (!warnings || warnings.length === 0) {
            return [];
        }

        return warnings.map(warning => {
            const fieldLabel = this._getFieldLabel(warning.field);
            return {
                type: warning.type,
                field: warning.field,
                fieldLabel,
                message: warning.message,
                severity: 'warning'
            };
        });
    }

    /**
     * Get user-friendly field label
     * @private
     * @param {string} field - Field name
     * @returns {string} User-friendly label
     */
    _getFieldLabel(field) {
        const labels = {
            employeeNumber: 'Employee Number',
            employeeName: 'Employee Name',
            startDate: 'Start Date',
            endDate: 'End Date',
            workingDays: 'Working Days',
            position: 'Position',
            employmentStatus: 'Employment Status'
        };

        return labels[field] || field;
    }
}

module.exports = new DTRValidator();
