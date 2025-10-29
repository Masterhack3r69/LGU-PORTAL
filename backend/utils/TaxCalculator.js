// utils/TaxCalculator.js - BIR Withholding Tax Calculator
const db = require('../config/database');

/**
 * TaxCalculator - Handles Philippine BIR withholding tax calculations
 * Implements graduated tax table based on TRAIN Law (Tax Reform for Acceleration and Inclusion)
 */
class TaxCalculator {
    constructor() {
        this.defaultTaxTable = this.initializeDefaultTaxTable();
    }

    /**
     * Initialize default BIR tax brackets (2024 TRAIN Law rates)
     * These are annual tax brackets
     */
    initializeDefaultTaxTable() {
        return [
            { 
                min: 0, 
                max: 250000, 
                rate: 0, 
                fixedAmount: 0,
                excessOver: 0
            },
            { 
                min: 250000, 
                max: 400000, 
                rate: 0.15, 
                fixedAmount: 0,
                excessOver: 250000
            },
            { 
                min: 400000, 
                max: 800000, 
                rate: 0.20, 
                fixedAmount: 22500,
                excessOver: 400000
            },
            { 
                min: 800000, 
                max: 2000000, 
                rate: 0.25, 
                fixedAmount: 102500,
                excessOver: 800000
            },
            { 
                min: 2000000, 
                max: 8000000, 
                rate: 0.30, 
                fixedAmount: 402500,
                excessOver: 2000000
            },
            { 
                min: 8000000, 
                max: Infinity, 
                rate: 0.35, 
                fixedAmount: 2202500,
                excessOver: 8000000
            }
        ];
    }

    /**
     * Calculate withholding tax based on taxable income and tax table
     * @param {number} taxableIncome - Monthly taxable income
     * @param {Array} taxTable - Optional custom tax table (uses default if not provided)
     * @returns {Object} - { amount, basis, annualTax, monthlyTax }
     */
    calculateWithholdingTax(taxableIncome, taxTable = null) {
        try {
            // Handle edge cases
            if (taxableIncome === null || taxableIncome === undefined) {
                return {
                    amount: 0,
                    basis: 'No taxable income provided',
                    annualTax: 0,
                    monthlyTax: 0,
                    error: 'Invalid input: taxable income is null or undefined'
                };
            }

            // Handle zero or negative income
            if (taxableIncome <= 0) {
                return {
                    amount: 0,
                    basis: 'Taxable income is zero or negative',
                    annualTax: 0,
                    monthlyTax: 0
                };
            }

            // Use provided tax table or default
            const table = taxTable && taxTable.length > 0 ? taxTable : this.defaultTaxTable;

            if (!table || table.length === 0) {
                return {
                    amount: 0,
                    basis: 'No tax table available',
                    annualTax: 0,
                    monthlyTax: 0,
                    error: 'Missing tax table'
                };
            }

            // Convert monthly taxable income to annual
            const annualTaxableIncome = taxableIncome * 12;

            // Find applicable tax bracket
            let applicableBracket = null;
            for (const bracket of table) {
                if (annualTaxableIncome >= bracket.min && 
                    (bracket.max === Infinity || annualTaxableIncome < bracket.max)) {
                    applicableBracket = bracket;
                    break;
                }
            }

            if (!applicableBracket) {
                // Default to highest bracket if not found
                applicableBracket = table[table.length - 1];
            }

            // Calculate annual tax using graduated formula
            // Tax = Fixed Amount + (Excess over threshold × Rate)
            const excessAmount = annualTaxableIncome - applicableBracket.excessOver;
            const annualTax = applicableBracket.fixedAmount + (excessAmount * applicableBracket.rate);

            // Convert to monthly tax
            const monthlyTax = annualTax / 12;

            // Build calculation basis string
            const bracketDesc = applicableBracket.max === Infinity 
                ? `₱${applicableBracket.min.toLocaleString()} and above`
                : `₱${applicableBracket.min.toLocaleString()} - ₱${applicableBracket.max.toLocaleString()}`;

            const basis = `Annual taxable income: ₱${annualTaxableIncome.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ` +
                         `(Bracket: ${bracketDesc}, Rate: ${(applicableBracket.rate * 100)}%, ` +
                         `Fixed: ₱${applicableBracket.fixedAmount.toLocaleString()}, ` +
                         `Excess: ₱${excessAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

            return {
                amount: parseFloat(monthlyTax.toFixed(2)),
                basis: basis,
                annualTax: parseFloat(annualTax.toFixed(2)),
                monthlyTax: parseFloat(monthlyTax.toFixed(2)),
                bracket: applicableBracket
            };

        } catch (error) {
            console.error('Tax calculation error:', error);
            return {
                amount: 0,
                basis: `Error calculating tax: ${error.message}`,
                annualTax: 0,
                monthlyTax: 0,
                error: error.message
            };
        }
    }

    /**
     * Get active tax table for a specific effective date
     * @param {Date|string} effectiveDate - Date to get tax table for
     * @returns {Promise<Array>} - Tax table brackets
     */
    async getTaxTable(effectiveDate = new Date()) {
        try {
            const date = effectiveDate instanceof Date ? effectiveDate : new Date(effectiveDate);
            
            const query = `
                SELECT 
                    bracket_min as min,
                    bracket_max as max,
                    base_tax as fixedAmount,
                    tax_rate as rate,
                    excess_over as excessOver
                FROM tax_tables
                WHERE effective_date <= ?
                    AND is_active = 1
                ORDER BY effective_date DESC, bracket_min ASC
                LIMIT 10
            `;

            const [rows] = await db.query(query, [date]);

            // If no tax table found in database, return default
            if (!rows || rows.length === 0) {
                console.warn('No tax table found in database, using default tax table');
                return this.defaultTaxTable;
            }

            // Convert bracket_max null to Infinity for highest bracket
            const taxTable = rows.map(row => ({
                min: parseFloat(row.min),
                max: row.max === null ? Infinity : parseFloat(row.max),
                rate: parseFloat(row.rate),
                fixedAmount: parseFloat(row.fixedAmount),
                excessOver: parseFloat(row.excessOver)
            }));

            return taxTable;

        } catch (error) {
            console.error('Error retrieving tax table from database:', error);
            // Return default tax table on error
            return this.defaultTaxTable;
        }
    }

    /**
     * Calculate taxable income from gross pay and non-taxable deductions
     * @param {number} grossPay - Total gross pay
     * @param {Array|number} nonTaxableDeductions - Array of deduction objects or total amount
     * @returns {Object} - { taxableIncome, basis, breakdown }
     */
    calculateTaxableIncome(grossPay, nonTaxableDeductions = []) {
        try {
            // Handle edge cases
            if (grossPay === null || grossPay === undefined || grossPay < 0) {
                return {
                    taxableIncome: 0,
                    basis: 'Invalid gross pay',
                    breakdown: {
                        grossPay: 0,
                        totalNonTaxableDeductions: 0,
                        taxableIncome: 0
                    },
                    error: 'Invalid gross pay value'
                };
            }

            let totalNonTaxableDeductions = 0;
            const deductionDetails = [];

            // Handle different input formats for nonTaxableDeductions
            if (Array.isArray(nonTaxableDeductions)) {
                // Array of deduction objects
                for (const deduction of nonTaxableDeductions) {
                    if (deduction && typeof deduction === 'object') {
                        const amount = parseFloat(deduction.amount) || 0;
                        if (amount > 0) {
                            totalNonTaxableDeductions += amount;
                            deductionDetails.push({
                                name: deduction.name || deduction.code || 'Unknown',
                                amount: amount
                            });
                        }
                    } else if (typeof deduction === 'number') {
                        totalNonTaxableDeductions += deduction;
                    }
                }
            } else if (typeof nonTaxableDeductions === 'number') {
                // Single number
                totalNonTaxableDeductions = nonTaxableDeductions;
            }

            // Calculate taxable income
            const taxableIncome = Math.max(0, grossPay - totalNonTaxableDeductions);

            // Build basis string
            let basis = `Gross Pay: ₱${grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            if (totalNonTaxableDeductions > 0) {
                basis += ` - Non-taxable deductions: ₱${totalNonTaxableDeductions.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                if (deductionDetails.length > 0) {
                    const detailStr = deductionDetails
                        .map(d => `${d.name}: ₱${d.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
                        .join(', ');
                    basis += ` (${detailStr})`;
                }
            }

            basis += ` = ₱${taxableIncome.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            return {
                taxableIncome: parseFloat(taxableIncome.toFixed(2)),
                basis: basis,
                breakdown: {
                    grossPay: parseFloat(grossPay.toFixed(2)),
                    totalNonTaxableDeductions: parseFloat(totalNonTaxableDeductions.toFixed(2)),
                    deductionDetails: deductionDetails,
                    taxableIncome: parseFloat(taxableIncome.toFixed(2))
                }
            };

        } catch (error) {
            console.error('Error calculating taxable income:', error);
            return {
                taxableIncome: 0,
                basis: `Error: ${error.message}`,
                breakdown: {
                    grossPay: 0,
                    totalNonTaxableDeductions: 0,
                    taxableIncome: 0
                },
                error: error.message
            };
        }
    }

    /**
     * Validate tax calculation inputs
     * @param {number} taxableIncome - Taxable income to validate
     * @returns {Object} - { isValid, errors }
     */
    validateTaxInputs(taxableIncome) {
        const errors = [];

        if (taxableIncome === null || taxableIncome === undefined) {
            errors.push('Taxable income is required');
        }

        if (typeof taxableIncome !== 'number') {
            errors.push('Taxable income must be a number');
        }

        if (taxableIncome < 0) {
            errors.push('Taxable income cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = TaxCalculator;
