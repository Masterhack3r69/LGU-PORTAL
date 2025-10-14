// utils/excelParser.js - Excel file parsing utility for DTR imports
const XLSX = require('xlsx');
const moment = require('moment');

/**
 * Excel Parser for DTR (Daily Time Record) imports
 * Handles parsing, validation, and extraction of DTR data from Excel files
 */
class ExcelParser {
    constructor() {
        // Required columns in the DTR template
        this.requiredColumns = [
            'Employee Number',
            'Employee Name',
            'Position',
            'Period Start Date',
            'Period End Date',
            'Total Working Days'
        ];
    }

    /**
     * Parse Excel file and return raw data
     * @param {string|Buffer} filePath - Path to Excel file or file buffer
     * @returns {Promise<Object>} Parsed workbook data
     */
    async parseFile(filePath) {
        try {
            // Read the workbook
            const workbook = XLSX.readFile(filePath, {
                cellDates: true,
                cellNF: false,
                cellText: false
            });

            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                throw new Error('Excel file is empty or has no sheets');
            }

            const worksheet = workbook.Sheets[sheetName];
            
            // Convert sheet to JSON with header row
            const data = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                defval: null,
                blankrows: false
            });

            return {
                success: true,
                data,
                sheetName,
                rowCount: data.length
            };
        } catch (error) {
            throw new Error(`Failed to parse Excel file: ${error.message}`);
        }
    }

    /**
     * Validate Excel file structure
     * @param {Array} data - Parsed Excel data
     * @returns {Object} Validation result
     */
    validateStructure(data) {
        const errors = [];
        const warnings = [];

        // Check if data is empty
        if (!data || data.length === 0) {
            errors.push('Excel file contains no data rows');
            return { isValid: false, errors, warnings };
        }

        // Get column headers from first row
        const firstRow = data[0];
        const actualColumns = Object.keys(firstRow);

        // Check for required columns
        const missingColumns = [];
        for (const requiredCol of this.requiredColumns) {
            if (!actualColumns.includes(requiredCol)) {
                missingColumns.push(requiredCol);
            }
        }

        if (missingColumns.length > 0) {
            errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Check for extra columns (warning only)
        const extraColumns = actualColumns.filter(col => !this.requiredColumns.includes(col));
        if (extraColumns.length > 0) {
            warnings.push(`Extra columns found (will be ignored): ${extraColumns.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            columnCount: actualColumns.length,
            rowCount: data.length
        };
    }

    /**
     * Extract DTR records from parsed Excel data
     * @param {Array} data - Parsed Excel data
     * @returns {Array} Array of DTR record objects
     */
    extractDTRRecords(data) {
        const records = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header row

            try {
                // Skip completely empty rows
                if (this._isEmptyRow(row)) {
                    continue;
                }

                // Extract and validate each field
                const record = {
                    rowNumber,
                    employeeNumber: this._extractEmployeeNumber(row, rowNumber),
                    employeeName: this._extractEmployeeName(row, rowNumber),
                    position: this._extractPosition(row, rowNumber),
                    startDate: this.parseDateField(row['Period Start Date'], rowNumber, 'Period Start Date'),
                    endDate: this.parseDateField(row['Period End Date'], rowNumber, 'Period End Date'),
                    workingDays: this.parseDecimalField(row['Total Working Days'], rowNumber, 'Total Working Days')
                };

                // Collect any field-level errors
                const fieldErrors = [];
                if (record.employeeNumber === null) fieldErrors.push('Employee Number is required');
                if (record.startDate === null) fieldErrors.push('Period Start Date is required');
                if (record.endDate === null) fieldErrors.push('Period End Date is required');
                if (record.workingDays === null) fieldErrors.push('Total Working Days is required');

                if (fieldErrors.length > 0) {
                    errors.push({
                        rowNumber,
                        employeeNumber: record.employeeNumber || 'Unknown',
                        errors: fieldErrors
                    });
                    continue;
                }

                records.push(record);
            } catch (error) {
                errors.push({
                    rowNumber,
                    employeeNumber: row['Employee Number'] || 'Unknown',
                    errors: [error.message]
                });
            }
        }

        return {
            records,
            errors,
            totalRows: data.length,
            validRows: records.length,
            errorRows: errors.length
        };
    }

    /**
     * Parse date field handling various formats
     * @param {*} value - Date value from Excel
     * @param {number} rowNumber - Row number for error reporting
     * @param {string} fieldName - Field name for error reporting
     * @returns {string|null} ISO date string (YYYY-MM-DD) or null
     */
    parseDateField(value, rowNumber, fieldName) {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        try {
            // If it's already a Date object (from Excel)
            if (value instanceof Date) {
                return moment(value).format('YYYY-MM-DD');
            }

            // If it's a string, try various formats
            if (typeof value === 'string') {
                const trimmedValue = value.trim();
                
                // Try common date formats
                const formats = [
                    'YYYY-MM-DD',
                    'MM/DD/YYYY',
                    'DD/MM/YYYY',
                    'M/D/YYYY',
                    'D/M/YYYY',
                    'YYYY/MM/DD',
                    'MMM DD, YYYY',
                    'DD MMM YYYY',
                    'MMMM DD, YYYY',
                    'M/D/YY',
                    'MM/DD/YY',
                    'D/M/YY',
                    'DD/MM/YY'
                ];

                for (const format of formats) {
                    const parsed = moment(trimmedValue, format, true);
                    if (parsed.isValid()) {
                        return parsed.format('YYYY-MM-DD');
                    }
                }
            }

            // If it's a number (Excel serial date)
            if (typeof value === 'number') {
                // Excel date serial number (days since 1900-01-01)
                const excelEpoch = new Date(1900, 0, 1);
                const date = new Date(excelEpoch.getTime() + (value - 2) * 86400000); // -2 for Excel bug
                return moment(date).format('YYYY-MM-DD');
            }

            throw new Error(`Invalid date format: ${value}`);
        } catch (error) {
            throw new Error(`Row ${rowNumber}: Invalid ${fieldName} - ${error.message}`);
        }
    }

    /**
     * Parse decimal field handling comma and period separators
     * @param {*} value - Decimal value from Excel
     * @param {number} rowNumber - Row number for error reporting
     * @param {string} fieldName - Field name for error reporting
     * @returns {number|null} Parsed decimal number or null
     */
    parseDecimalField(value, rowNumber, fieldName) {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        try {
            // If it's already a number
            if (typeof value === 'number') {
                // Round to 2 decimal places
                return Math.round(value * 100) / 100;
            }

            // If it's a string, clean and parse
            if (typeof value === 'string') {
                let cleanedValue = value.trim();

                // Remove any whitespace
                cleanedValue = cleanedValue.replace(/\s/g, '');

                // Handle comma as decimal separator (European format)
                // Check if there's a comma and no period, or comma comes after period
                if (cleanedValue.includes(',')) {
                    const commaIndex = cleanedValue.lastIndexOf(',');
                    const periodIndex = cleanedValue.lastIndexOf('.');
                    
                    if (periodIndex === -1 || commaIndex > periodIndex) {
                        // Comma is the decimal separator
                        // Remove thousand separators (periods) and replace comma with period
                        cleanedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
                    } else {
                        // Period is the decimal separator, comma is thousand separator
                        cleanedValue = cleanedValue.replace(/,/g, '');
                    }
                }

                // Parse the cleaned value
                const parsed = parseFloat(cleanedValue);

                if (isNaN(parsed)) {
                    throw new Error(`Cannot convert "${value}" to a number`);
                }

                // Round to 2 decimal places
                return Math.round(parsed * 100) / 100;
            }

            throw new Error(`Unsupported value type: ${typeof value}`);
        } catch (error) {
            throw new Error(`Row ${rowNumber}: Invalid ${fieldName} - ${error.message}`);
        }
    }

    /**
     * Extract employee number from row
     * @private
     */
    _extractEmployeeNumber(row, rowNumber) {
        const value = row['Employee Number'];
        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value).trim();
    }

    /**
     * Extract employee name from row
     * @private
     */
    _extractEmployeeName(row, rowNumber) {
        const value = row['Employee Name'];
        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value).trim();
    }

    /**
     * Extract position from row
     * @private
     */
    _extractPosition(row, rowNumber) {
        const value = row['Position'];
        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value).trim();
    }

    /**
     * Check if a row is completely empty
     * @private
     */
    _isEmptyRow(row) {
        if (!row) return true;
        
        const values = Object.values(row);
        return values.every(val => 
            val === null || 
            val === undefined || 
            (typeof val === 'string' && val.trim() === '')
        );
    }
}

module.exports = new ExcelParser();
