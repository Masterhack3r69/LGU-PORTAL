// services/benefitSlipService.js - Benefit slip generation service
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { BenefitItem } = require('../models/Benefits');

class BenefitSlipService {
    constructor() {
        this.companyInfo = {
            name: process.env.COMPANY_NAME || 'Government Agency',
            address: process.env.COMPANY_ADDRESS || 'Main Office Address',
            contact: process.env.COMPANY_CONTACT || 'Contact Information',
            logo: null // Path to company logo if available
        };
    }

    /**
     * Generate benefit slip for a benefit item
     * @param {number} benefitItemId - Benefit item ID
     * @returns {Object} PDF generation result
     */
    async generateBenefitSlip(benefitItemId) {
        try {
            // Get benefit item with all related data
            const benefitItemResult = await BenefitItem.findById(benefitItemId);
            
            if (!benefitItemResult.success || !benefitItemResult.data) {
                throw new Error('Benefit item not found');
            }

            const benefitItem = benefitItemResult.data;
            
            // Validate that item is ready for slip generation
            if (!['Approved', 'Paid'].includes(benefitItem.status)) {
                throw new Error('Benefit item must be approved or paid to generate slip');
            }

            // Generate PDF
            const pdfBuffer = await this.createBenefitSlipPDF(benefitItem);
            
            // Generate filename
            const filename = this.generateFilename(benefitItem);
            
            return {
                success: true,
                data: {
                    buffer: pdfBuffer,
                    filename,
                    mimeType: 'application/pdf',
                    size: pdfBuffer.length
                }
            };

        } catch (error) {
            console.error('Benefit slip generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create PDF document for benefit slip
     * @param {Object} benefitItem - Benefit item data
     * @returns {Buffer} PDF buffer
     */
    async createBenefitSlipPDF(benefitItem) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: `Benefit Slip - ${benefitItem.employee_name}`,
                        Author: this.companyInfo.name,
                        Subject: `${benefitItem.benefit_type_name} - ${benefitItem.cycle_year}`,
                        Creator: 'EMS Benefit System'
                    }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Build PDF content
                this.buildBenefitSlipContent(doc, benefitItem);
                
                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Build the content of the benefit slip PDF
     * @param {PDFDocument} doc - PDF document instance
     * @param {Object} benefitItem - Benefit item data
     */
    buildBenefitSlipContent(doc, benefitItem) {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = doc.page.margins.left;
        const usableWidth = pageWidth - (margin * 2);

        // Header
        this.addHeader(doc, benefitItem, usableWidth);
        
        // Employee Information
        this.addEmployeeInfo(doc, benefitItem, usableWidth);
        
        // Benefit Details
        this.addBenefitDetails(doc, benefitItem, usableWidth);
        
        // Calculation Breakdown
        this.addCalculationBreakdown(doc, benefitItem, usableWidth);
        
        // Payment Information
        this.addPaymentInfo(doc, benefitItem, usableWidth);
        
        // Footer
        this.addFooter(doc, benefitItem, usableWidth);
    }

    /**
     * Add header section to PDF
     */
    addHeader(doc, benefitItem, usableWidth) {
        const headerHeight = 100;
        
        // Company logo placeholder (if available)
        if (this.companyInfo.logo) {
            try {
                doc.image(this.companyInfo.logo, margin, 50, { width: 80 });
            } catch (error) {
                console.warn('Logo not found:', this.companyInfo.logo);
            }
        }

        // Company information
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(this.companyInfo.name, margin + 100, 50, { width: usableWidth - 100 });

        doc.fontSize(10)
           .font('Helvetica')
           .text(this.companyInfo.address, margin + 100, 70, { width: usableWidth - 100 })
           .text(this.companyInfo.contact, margin + 100, 85, { width: usableWidth - 100 });

        // Document title
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('COMPENSATION & BENEFITS SLIP', margin, 120, { 
               width: usableWidth, 
               align: 'center' 
           });

        // Benefit type and year
        doc.fontSize(14)
           .font('Helvetica')
           .text(`${benefitItem.benefit_type_name} - ${benefitItem.cycle_year}`, margin, 145, {
               width: usableWidth,
               align: 'center'
           });

        // Add line separator
        doc.moveTo(margin, 170)
           .lineTo(pageWidth - margin, 170)
           .stroke();

        doc.y = 180;
    }

    /**
     * Add employee information section
     */
    addEmployeeInfo(doc, benefitItem, usableWidth) {
        const startY = doc.y + 10;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('EMPLOYEE INFORMATION', margin, startY);

        doc.fontSize(10)
           .font('Helvetica');

        const infoY = startY + 20;
        const labelWidth = 120;
        const valueX = margin + labelWidth;

        // Employee details
        doc.text('Employee Number:', margin, infoY)
           .text(benefitItem.employee_number || 'N/A', valueX, infoY);

        doc.text('Employee Name:', margin, infoY + 15)
           .text(benefitItem.employee_name || 'N/A', valueX, infoY + 15);

        doc.text('Base Salary:', margin, infoY + 30)
           .text(`₱${this.formatNumber(benefitItem.base_salary)}`, valueX, infoY + 30);

        doc.text('Service Months:', margin, infoY + 45)
           .text(`${benefitItem.service_months} months`, valueX, infoY + 45);

        doc.text('Benefit Cycle:', margin, infoY + 60)
           .text(benefitItem.cycle_name || 'N/A', valueX, infoY + 60);

        doc.y = infoY + 80;
    }

    /**
     * Add benefit details section
     */
    addBenefitDetails(doc, benefitItem, usableWidth) {
        const startY = doc.y + 15;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('BENEFIT DETAILS', margin, startY);

        // Create table for benefit breakdown
        const tableTop = startY + 25;
        const tableLeft = margin;
        const itemHeight = 20;
        
        // Table headers
        doc.fontSize(10)
           .font('Helvetica-Bold');

        doc.text('Description', tableLeft, tableTop)
           .text('Amount', tableLeft + 300, tableTop, { width: 100, align: 'right' });

        // Table border
        doc.rect(tableLeft, tableTop - 5, usableWidth, itemHeight)
           .stroke();

        // Table data
        doc.font('Helvetica');
        let currentY = tableTop + itemHeight;

        // Calculated Amount
        doc.text('Calculated Benefit Amount', tableLeft + 5, currentY)
           .text(`₱${this.formatNumber(benefitItem.calculated_amount)}`, 
                  tableLeft + 300, currentY, { width: 95, align: 'right' });
        
        doc.rect(tableLeft, currentY - 5, usableWidth, itemHeight).stroke();
        currentY += itemHeight;

        // Adjustment (if any)
        if (benefitItem.adjustment_amount && benefitItem.adjustment_amount !== 0) {
            const adjustmentLabel = benefitItem.adjustment_amount > 0 ? 'Adjustment (Addition)' : 'Adjustment (Deduction)';
            doc.text(adjustmentLabel, tableLeft + 5, currentY)
               .text(`₱${this.formatNumber(Math.abs(benefitItem.adjustment_amount))}`, 
                      tableLeft + 300, currentY, { width: 95, align: 'right' });
            
            doc.rect(tableLeft, currentY - 5, usableWidth, itemHeight).stroke();
            currentY += itemHeight;
        }

        // Gross Amount
        doc.font('Helvetica-Bold')
           .text('Gross Benefit Amount', tableLeft + 5, currentY)
           .text(`₱${this.formatNumber(benefitItem.final_amount)}`, 
                  tableLeft + 300, currentY, { width: 95, align: 'right' });
        
        doc.rect(tableLeft, currentY - 5, usableWidth, itemHeight).stroke();
        currentY += itemHeight;

        // Tax Withholding (if any)
        if (benefitItem.tax_amount && benefitItem.tax_amount > 0) {
            doc.font('Helvetica')
               .text('Withholding Tax', tableLeft + 5, currentY)
               .text(`₱${this.formatNumber(benefitItem.tax_amount)}`, 
                      tableLeft + 300, currentY, { width: 95, align: 'right' });
            
            doc.rect(tableLeft, currentY - 5, usableWidth, itemHeight).stroke();
            currentY += itemHeight;
        }

        // Net Amount
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .text('NET BENEFIT AMOUNT', tableLeft + 5, currentY)
           .text(`₱${this.formatNumber(benefitItem.net_amount)}`, 
                  tableLeft + 300, currentY, { width: 95, align: 'right' });
        
        doc.rect(tableLeft, currentY - 5, usableWidth, itemHeight + 5).stroke();

        doc.y = currentY + 30;
    }

    /**
     * Add calculation breakdown section
     */
    addCalculationBreakdown(doc, benefitItem, usableWidth) {
        if (!benefitItem.calculation_basis) return;

        const startY = doc.y + 10;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('CALCULATION BASIS', margin, startY);

        doc.fontSize(9)
           .font('Helvetica')
           .text(benefitItem.calculation_basis, margin, startY + 20, {
               width: usableWidth,
               lineGap: 2
           });

        doc.y += 50;
    }

    /**
     * Add payment information section
     */
    addPaymentInfo(doc, benefitItem, usableWidth) {
        const startY = doc.y + 10;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('PAYMENT INFORMATION', margin, startY);

        doc.fontSize(10)
           .font('Helvetica');

        const infoY = startY + 20;
        const labelWidth = 120;
        const valueX = margin + labelWidth;

        doc.text('Status:', margin, infoY)
           .text(benefitItem.status, valueX, infoY);

        if (benefitItem.payment_reference) {
            doc.text('Payment Reference:', margin, infoY + 15)
               .text(benefitItem.payment_reference, valueX, infoY + 15);
        }

        if (benefitItem.paid_at) {
            doc.text('Payment Date:', margin, infoY + 30)
               .text(this.formatDate(benefitItem.paid_at), valueX, infoY + 30);
        }

        doc.y = infoY + 50;
    }

    /**
     * Add footer section
     */
    addFooter(doc, benefitItem, usableWidth) {
        const footerY = doc.page.height - 150;
        
        // Signature section
        doc.y = footerY;
        
        doc.fontSize(10)
           .font('Helvetica')
           .text('Prepared by: ___________________________', margin, footerY)
           .text('Date: _________________', margin + 300, footerY);

        doc.text('Received by: ___________________________', margin, footerY + 30)
           .text('Date: _________________', margin + 300, footerY + 30);

        // Notice
        doc.fontSize(8)
           .font('Helvetica-Oblique')
           .text('This is a computer-generated document. No signature required.', 
                 margin, footerY + 60, {
                     width: usableWidth,
                     align: 'center'
                 });

        // Page number and generation info
        doc.text(`Generated on: ${this.formatDate(new Date())}`, 
                 margin, footerY + 80, {
                     width: usableWidth,
                     align: 'center'
                 });
    }

    /**
     * Generate filename for the benefit slip
     * @param {Object} benefitItem - Benefit item data
     * @returns {string} Filename
     */
    generateFilename(benefitItem) {
        const employeeNumber = benefitItem.employee_number || 'UNKNOWN';
        const benefitCode = benefitItem.benefit_type_code || 'BENEFIT';
        const year = benefitItem.cycle_year || new Date().getFullYear();
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        return `BenefitSlip_${employeeNumber}_${benefitCode}_${year}_${timestamp}.pdf`;
    }

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        if (!num || isNaN(num)) return '0.00';
        return parseFloat(num).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (!date) return 'N/A';
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Save benefit slip to file
     * @param {Buffer} pdfBuffer - PDF buffer
     * @param {string} filename - Filename
     * @returns {Object} Save result
     */
    async saveBenefitSlipToFile(pdfBuffer, filename) {
        try {
            const uploadsDir = path.join(__dirname, '..', 'uploads', 'benefit-slips');
            
            // Ensure directory exists
            try {
                await fs.access(uploadsDir);
            } catch {
                await fs.mkdir(uploadsDir, { recursive: true });
            }

            const filePath = path.join(uploadsDir, filename);
            await fs.writeFile(filePath, pdfBuffer);

            return {
                success: true,
                filePath,
                filename
            };

        } catch (error) {
            console.error('Save benefit slip error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate benefit slips for multiple items (bulk operation)
     * @param {Array} benefitItemIds - Array of benefit item IDs
     * @returns {Object} Bulk generation result
     */
    async generateBulkBenefitSlips(benefitItemIds) {
        const results = [];
        const errors = [];

        for (const itemId of benefitItemIds) {
            try {
                const result = await this.generateBenefitSlip(itemId);
                if (result.success) {
                    results.push({
                        item_id: itemId,
                        filename: result.data.filename,
                        size: result.data.size
                    });
                } else {
                    errors.push({
                        item_id: itemId,
                        error: result.error
                    });
                }
            } catch (error) {
                errors.push({
                    item_id: itemId,
                    error: error.message
                });
            }
        }

        return {
            success: errors.length === 0,
            results,
            errors,
            summary: {
                total: benefitItemIds.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }
}

module.exports = new BenefitSlipService();