// services/payslipPdfService.js - PDF payslip generation service
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PayslipPdfService {
    constructor() {
        this.pageWidth = 612; // Letter width in points
        this.pageHeight = 792; // Letter height in points
        this.margin = 50;
        this.contentWidth = this.pageWidth - (2 * this.margin);
    }

    /**
     * Generate a professional payslip PDF
     * @param {Object} payslipData - Complete payslip data
     * @param {Buffer} companyLogo - Optional company logo buffer
     * @returns {Buffer} PDF buffer
     */
    async generatePayslipPDF(payslipData, companyLogo = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margin: this.margin,
                    bufferPages: true
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                this.drawPayslipTemplate(doc, payslipData, companyLogo);
                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Draw the complete payslip template
     */
    drawPayslipTemplate(doc, data, companyLogo) {
        // Company Header
        this.drawCompanyHeader(doc, data, companyLogo);

        // Employee Information Section
        this.drawEmployeeInfo(doc, data);

        // Payroll Period Section
        this.drawPayrollPeriod(doc, data);

        // Earnings Section
        this.drawEarningsSection(doc, data);

        // Deductions Section
        this.drawDeductionsSection(doc, data);

        // Net Pay Section
        this.drawNetPaySection(doc, data);

        // Payment Details
        this.drawPaymentDetails(doc, data);

        // Footer
        this.drawFooter(doc, data);
    }

    /**
     * Draw company header with logo
     */
    drawCompanyHeader(doc, data, companyLogo) {
        const headerY = 50;

        // Company name
        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#1a365d')
           .text('YOUR COMPANY NAME', this.margin, headerY);

        // Company address
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#4a5568')
           .text('123 Business Street, City, Province 1234', this.margin, headerY + 25)
           .text('Phone: (02) 123-4567 | Email: hr@company.com', this.margin, headerY + 40);

        // Payslip title
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .fillColor('#2d3748')
           .text('PAYSLIP', this.margin, headerY + 70);

        // Date generated
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#718096')
           .text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, headerY + 90);

        // Draw line separator
        doc.moveTo(this.margin, headerY + 110)
           .lineTo(this.pageWidth - this.margin, headerY + 110)
           .stroke('#e2e8f0');
    }

    /**
     * Draw employee information section
     */
    drawEmployeeInfo(doc, data) {
        const startY = 140;

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#2d3748')
           .text('EMPLOYEE INFORMATION', this.margin, startY);

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#4a5568');

        const employeeInfo = [
            { label: 'Employee ID:', value: data.employee.employee_number },
            { label: 'Name:', value: data.employee.name },
            { label: 'Position:', value: data.employee.position },
            { label: 'Department:', value: data.employee.plantilla_position || 'N/A' }
        ];

        let currentY = startY + 25;
        employeeInfo.forEach((info, index) => {
            doc.text(info.label, this.margin, currentY)
               .text(info.value, this.margin + 120, currentY);
            currentY += 15;
        });
    }

    /**
     * Draw payroll period section
     */
    drawPayrollPeriod(doc, data) {
        const startY = 220;

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#2d3748')
           .text('PAYROLL PERIOD', this.margin, startY);

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#4a5568')
           .text(`Period: ${data.payroll_period || 'N/A'}`, this.margin, startY + 25)
           .text(`Working Days: ${data.calculation.working_days}`, this.margin, startY + 40)
           .text(`Pay Date: ${data.pay_date || new Date().toLocaleDateString()}`, this.margin, startY + 55);
    }

    /**
     * Draw earnings section
     */
    drawEarningsSection(doc, data) {
        const startY = 300;

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#2d3748')
           .text('EARNINGS', this.margin, startY);

        // Table header
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor('#4a5568')
           .text('Description', this.margin, startY + 25)
           .text('Amount', this.margin + 300, startY + 25);

        doc.moveTo(this.margin, startY + 35)
           .lineTo(this.pageWidth - this.margin, startY + 35)
           .stroke('#e2e8f0');

        // Earnings items
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#2d3748');

        let currentY = startY + 45;
        const earnings = [
            { description: 'Basic Pay', amount: data.calculation.basic_pay },
            { description: 'Allowances', amount: data.calculation.total_allowances }
        ];

        // Add individual allowances if available
        if (data.line_items) {
            data.line_items
                .filter(item => item.line_type === 'Allowance')
                .forEach(item => {
                    earnings.push({
                        description: `  ${item.description}`,
                        amount: item.amount
                    });
                });
        }

        earnings.forEach(earning => {
            doc.text(earning.description, this.margin, currentY)
               .text(this.formatCurrency(earning.amount), this.margin + 300, currentY);
            currentY += 15;
        });

        // Total earnings
        doc.font('Helvetica-Bold')
           .text('Total Earnings', this.margin, currentY + 10)
           .text(this.formatCurrency(data.calculation.gross_pay), this.margin + 300, currentY + 10);
    }

    /**
     * Draw deductions section
     */
    drawDeductionsSection(doc, data) {
        const startY = 450;

        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor('#2d3748')
           .text('DEDUCTIONS', this.margin, startY);

        // Table header
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor('#4a5568')
           .text('Description', this.margin, startY + 25)
           .text('Amount', this.margin + 300, startY + 25);

        doc.moveTo(this.margin, startY + 35)
           .lineTo(this.pageWidth - this.margin, startY + 35)
           .stroke('#e2e8f0');

        // Deductions items
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#2d3748');

        let currentY = startY + 45;
        const deductions = [
            { description: 'Tax', amount: 0 },
            { description: 'SSS', amount: 0 },
            { description: 'PhilHealth', amount: 0 },
            { description: 'Pag-IBIG', amount: 0 }
        ];

        // Add individual deductions if available
        if (data.line_items) {
            data.line_items
                .filter(item => item.line_type === 'Deduction')
                .forEach(item => {
                    deductions.push({
                        description: `  ${item.description}`,
                        amount: item.amount
                    });
                });
        }

        deductions.forEach(deduction => {
            doc.text(deduction.description, this.margin, currentY)
               .text(this.formatCurrency(deduction.amount), this.margin + 300, currentY);
            currentY += 15;
        });

        // Total deductions
        doc.font('Helvetica-Bold')
           .text('Total Deductions', this.margin, currentY + 10)
           .text(this.formatCurrency(data.calculation.total_deductions), this.margin + 300, currentY + 10);
    }

    /**
     * Draw net pay section
     */
    drawNetPaySection(doc, data) {
        const startY = 600;

        // Net pay box
        doc.rect(this.margin, startY, this.contentWidth, 60)
           .fillAndStroke('#f7fafc', '#e2e8f0');

        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#1a365d')
           .text('NET PAY', this.margin + 20, startY + 15);

        doc.font('Helvetica-Bold')
           .fontSize(16)
           .fillColor('#2d3748')
           .text(this.formatCurrency(data.calculation.net_pay), this.margin + 20, startY + 35);
    }

    /**
     * Draw payment details
     */
    drawPaymentDetails(doc, data) {
        const startY = 680;

        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#2d3748')
           .text('PAYMENT DETAILS', this.margin, startY);

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor('#4a5568')
           .text(`Payment Method: ${data.payment_method || 'Bank Transfer'}`, this.margin, startY + 20)
           .text(`Account Number: ${data.account_number || 'N/A'}`, this.margin, startY + 35)
           .text(`Bank: ${data.bank_name || 'N/A'}`, this.margin, startY + 50);
    }

    /**
     * Draw footer
     */
    drawFooter(doc, data) {
        const footerY = this.pageHeight - 80;

        // Line separator
        doc.moveTo(this.margin, footerY)
           .lineTo(this.pageWidth - this.margin, footerY)
           .stroke('#e2e8f0');

        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#718096')
           .text('This is a system-generated payslip. Please contact HR for any discrepancies.', this.margin, footerY + 15)
           .text(`Generated by: ${data.generated_by || 'System'} | ID: ${data.payslip_id}`, this.margin, footerY + 30);
    }

    /**
     * Format currency value
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Generate sample payslip data for testing
     */
    generateSampleData() {
        return {
            payslip_id: 'PS-2024-001',
            generated_at: new Date().toISOString(),
            generated_by: 'System',
            employee: {
                employee_number: 'EMP001',
                name: 'John Doe',
                position: 'Software Engineer',
                department: 'IT Department'
            },
            payroll_period: 'January 2024',
            pay_date: '2024-01-31',
            calculation: {
                working_days: 22,
                daily_rate: 1000,
                basic_pay: 22000,
                total_allowances: 5000,
                total_deductions: 3500,
                gross_pay: 27000,
                net_pay: 23500
            },
            line_items: [
                { line_type: 'Allowance', description: 'Transportation Allowance', amount: 2000 },
                { line_type: 'Allowance', description: 'Meal Allowance', amount: 3000 },
                { line_type: 'Deduction', description: 'Tax Withholding', amount: 2000 },
                { line_type: 'Deduction', description: 'SSS Contribution', amount: 1000 },
                { line_type: 'Deduction', description: 'PhilHealth', amount: 500 }
            ],
            payment_method: 'Bank Transfer',
            account_number: '****1234',
            bank_name: 'BDO'
        };
    }
}

module.exports = new PayslipPdfService();