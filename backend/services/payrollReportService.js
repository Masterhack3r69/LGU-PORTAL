// services/payrollReportService.js - Payroll Period Summary Report Generation Service
const PDFDocument = require('pdfkit');
const { pool } = require('../config/database');

class PayrollReportService {
  constructor() {
    this.pageWidth = 612; // Letter width
    this.pageHeight = 792; // Letter height
    this.margin = 50;
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.colors = {
      primary: '#1a1a1a',
      secondary: '#666666',
      accent: '#2563eb',
      lightGray: '#f8f9fa',
      border: '#e1e5e9',
      success: '#10b981',
      warning: '#f59e0b',
    };
  }

  async generatePeriodReport(periodId) {
    try {
      // Fetch period data
      const periodData = await this.fetchPeriodData(periodId);
      
      if (!periodData) {
        throw new Error('Period not found');
      }

      // Generate PDF
      return await this.createPDF(periodData);
    } catch (error) {
      console.error('Error generating period report:', error);
      throw error;
    }
  }

  async fetchPeriodData(periodId) {
    try {
      // Get period details
      const [periodRows] = await pool.execute(
        `SELECT * FROM payroll_periods WHERE id = ?`,
        [periodId]
      );

      if (periodRows.length === 0) {
        return null;
      }

      const period = periodRows[0];

      // Get payroll items for this period
      const [items] = await pool.execute(
        `SELECT 
          pi.*,
          e.employee_number,
          e.first_name,
          e.last_name,
          e.middle_name,
          e.plantilla_position,
          e.salary_grade
        FROM payroll_items pi
        JOIN employees e ON pi.employee_id = e.id
        WHERE pi.payroll_period_id = ?
        ORDER BY e.last_name, e.first_name`,
        [periodId]
      );

      // Get summary statistics
      const [summaryRows] = await pool.execute(
        `SELECT 
          COUNT(*) as total_employees,
          SUM(basic_pay) as total_basic_pay,
          SUM(total_allowances) as total_allowances,
          SUM(total_deductions) as total_deductions,
          SUM(net_pay) as total_net_pay
        FROM payroll_items
        WHERE payroll_period_id = ?`,
        [periodId]
      );

      const summary = summaryRows[0];

      // Get status breakdown
      const [statusRows] = await pool.execute(
        `SELECT 
          status,
          COUNT(*) as count
        FROM payroll_items
        WHERE payroll_period_id = ?
        GROUP BY status`,
        [periodId]
      );

      return {
        period,
        items,
        summary,
        statusBreakdown: statusRows,
      };
    } catch (error) {
      console.error('Error fetching period data:', error);
      throw error;
    }
  }

  async createPDF(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: this.margin,
          bufferPages: true,
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        this.drawReport(doc, data);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  drawReport(doc, data) {
    let yPos = this.margin;

    // Header
    yPos = this.drawHeader(doc, data, yPos);
    
    // Period Information
    yPos = this.drawPeriodInfo(doc, data, yPos);
    
    // Summary Statistics
    yPos = this.drawSummaryStats(doc, data, yPos);
    
    // Status Breakdown
    yPos = this.drawStatusBreakdown(doc, data, yPos);
    
    // Employee Details Table
    yPos = this.drawEmployeeTable(doc, data, yPos);
    
    // Footer
    this.drawFooter(doc);
  }

  drawHeader(doc, data, yPos) {
    // Company header
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(this.colors.primary)
      .text('PAYROLL PERIOD SUMMARY REPORT', this.margin, yPos, {
        align: 'center',
        width: this.contentWidth,
      });

    yPos += 25;

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(this.colors.secondary)
      .text('Employee Management System', this.margin, yPos, {
        align: 'center',
        width: this.contentWidth,
      });

    yPos += 15;

    doc
      .strokeColor(this.colors.border)
      .lineWidth(2)
      .moveTo(this.margin, yPos)
      .lineTo(this.pageWidth - this.margin, yPos)
      .stroke();

    return yPos + 20;
  }

  drawPeriodInfo(doc, data, yPos) {
    const { period } = data;
    
    // Period title
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(this.colors.accent)
      .text('Period Information', this.margin, yPos);

    yPos += 20;

    const monthName = new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' });
    const periodDesc = period.period_number === 1 
      ? `1st to 15th of ${monthName}` 
      : `16th to end of ${monthName}`;

    const info = [
      { label: 'Period:', value: `${monthName} ${period.year} - Period ${period.period_number}` },
      { label: 'Description:', value: periodDesc },
      { label: 'Start Date:', value: new Date(period.start_date).toLocaleDateString('en-PH') },
      { label: 'End Date:', value: new Date(period.end_date).toLocaleDateString('en-PH') },
      { label: 'Pay Date:', value: new Date(period.pay_date).toLocaleDateString('en-PH') },
      { label: 'Status:', value: period.status.toUpperCase() },
    ];

    doc.font('Helvetica').fontSize(10);

    info.forEach(item => {
      doc
        .fillColor(this.colors.secondary)
        .text(item.label, this.margin, yPos, { continued: true, width: 120 })
        .fillColor(this.colors.primary)
        .text(item.value);
      yPos += 18;
    });

    return yPos + 10;
  }

  drawSummaryStats(doc, data, yPos) {
    const { summary } = data;

    // Check for new page
    if (yPos > this.pageHeight - 200) {
      doc.addPage();
      yPos = this.margin;
    }

    // Section title
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(this.colors.accent)
      .text('Financial Summary', this.margin, yPos);

    yPos += 20;

    // Draw summary boxes
    const boxWidth = (this.contentWidth - 20) / 2;
    const boxHeight = 80;
    let xPos = this.margin;

    // Total Employees Box
    this.drawSummaryBox(doc, xPos, yPos, boxWidth, boxHeight, 
      'Total Employees', 
      summary.total_employees || 0,
      this.colors.accent
    );

    xPos += boxWidth + 20;

    // Total Net Pay Box
    this.drawSummaryBox(doc, xPos, yPos, boxWidth, boxHeight,
      'Total Net Pay',
      this.formatCurrency(summary.total_net_pay || 0),
      this.colors.success
    );

    yPos += boxHeight + 20;
    xPos = this.margin;

    // Basic Pay Box
    this.drawSummaryBox(doc, xPos, yPos, boxWidth, boxHeight,
      'Total Basic Pay',
      this.formatCurrency(summary.total_basic_pay || 0),
      this.colors.primary
    );

    xPos += boxWidth + 20;

    // Allowances Box
    this.drawSummaryBox(doc, xPos, yPos, boxWidth, boxHeight,
      'Total Allowances',
      this.formatCurrency(summary.total_allowances || 0),
      this.colors.success
    );

    yPos += boxHeight + 20;
    xPos = this.margin;

    // Deductions Box
    this.drawSummaryBox(doc, xPos, yPos, boxWidth, boxHeight,
      'Total Deductions',
      this.formatCurrency(summary.total_deductions || 0),
      this.colors.warning
    );

    return yPos + boxHeight + 20;
  }

  drawSummaryBox(doc, x, y, width, height, label, value, color) {
    // Draw box
    doc
      .rect(x, y, width, height)
      .fillAndStroke(this.colors.lightGray, this.colors.border);

    // Draw label
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(this.colors.secondary)
      .text(label, x + 15, y + 15, { width: width - 30 });

    // Draw value
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(color)
      .text(value.toString(), x + 15, y + 35, { width: width - 30 });
  }

  drawStatusBreakdown(doc, data, yPos) {
    const { statusBreakdown } = data;

    // Check for new page
    if (yPos > this.pageHeight - 150) {
      doc.addPage();
      yPos = this.margin;
    }

    // Section title
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(this.colors.accent)
      .text('Status Breakdown', this.margin, yPos);

    yPos += 20;

    doc.font('Helvetica').fontSize(10);

    statusBreakdown.forEach(item => {
      doc
        .fillColor(this.colors.secondary)
        .text(`${item.status}:`, this.margin, yPos, { continued: true, width: 150 })
        .fillColor(this.colors.primary)
        .text(`${item.count} employees`);
      yPos += 18;
    });

    return yPos + 15;
  }

  drawEmployeeTable(doc, data, yPos) {
    const { items } = data;

    // Check for new page
    if (yPos > this.pageHeight - 200) {
      doc.addPage();
      yPos = this.margin;
    }

    // Section title
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(this.colors.accent)
      .text('Employee Payroll Details', this.margin, yPos);

    yPos += 20;

    // Table headers
    const colWidths = {
      name: 150,
      empNo: 80,
      basic: 80,
      allowances: 80,
      deductions: 80,
      netPay: 90,
    };

    const startX = this.margin;
    let xPos = startX;

    // Draw header background
    doc
      .rect(startX, yPos, this.contentWidth, 25)
      .fillAndStroke(this.colors.lightGray, this.colors.border);

    // Draw headers
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(this.colors.primary);

    doc.text('Employee Name', xPos + 5, yPos + 8, { width: colWidths.name });
    xPos += colWidths.name;
    doc.text('Emp #', xPos + 5, yPos + 8, { width: colWidths.empNo });
    xPos += colWidths.empNo;
    doc.text('Basic Pay', xPos + 5, yPos + 8, { width: colWidths.basic });
    xPos += colWidths.basic;
    doc.text('Allowances', xPos + 5, yPos + 8, { width: colWidths.allowances });
    xPos += colWidths.allowances;
    doc.text('Deductions', xPos + 5, yPos + 8, { width: colWidths.deductions });
    xPos += colWidths.deductions;
    doc.text('Net Pay', xPos + 5, yPos + 8, { width: colWidths.netPay });

    yPos += 25;

    // Draw rows
    doc.font('Helvetica').fontSize(8);

    items.forEach((item, index) => {
      // Check for new page
      if (yPos > this.pageHeight - 100) {
        doc.addPage();
        yPos = this.margin;
        
        // Redraw headers on new page
        xPos = startX;
        doc
          .rect(startX, yPos, this.contentWidth, 25)
          .fillAndStroke(this.colors.lightGray, this.colors.border);

        doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.primary);
        doc.text('Employee Name', xPos + 5, yPos + 8, { width: colWidths.name });
        xPos += colWidths.name;
        doc.text('Emp #', xPos + 5, yPos + 8, { width: colWidths.empNo });
        xPos += colWidths.empNo;
        doc.text('Basic Pay', xPos + 5, yPos + 8, { width: colWidths.basic });
        xPos += colWidths.basic;
        doc.text('Allowances', xPos + 5, yPos + 8, { width: colWidths.allowances });
        xPos += colWidths.allowances;
        doc.text('Deductions', xPos + 5, yPos + 8, { width: colWidths.deductions });
        xPos += colWidths.deductions;
        doc.text('Net Pay', xPos + 5, yPos + 8, { width: colWidths.netPay });
        
        yPos += 25;
        doc.font('Helvetica').fontSize(8);
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc
          .rect(startX, yPos, this.contentWidth, 20)
          .fill(this.colors.lightGray);
      }

      xPos = startX;
      doc.fillColor(this.colors.primary);

      const fullName = `${item.last_name}, ${item.first_name}${item.middle_name ? ' ' + item.middle_name.charAt(0) + '.' : ''}`;
      doc.text(fullName, xPos + 5, yPos + 5, { width: colWidths.name - 10, ellipsis: true });
      xPos += colWidths.name;
      doc.text(item.employee_number || '-', xPos + 5, yPos + 5, { width: colWidths.empNo - 10 });
      xPos += colWidths.empNo;
      doc.text(this.formatCurrency(item.basic_pay), xPos + 5, yPos + 5, { width: colWidths.basic - 10 });
      xPos += colWidths.basic;
      doc.text(this.formatCurrency(item.total_allowances), xPos + 5, yPos + 5, { width: colWidths.allowances - 10 });
      xPos += colWidths.allowances;
      doc.text(this.formatCurrency(item.total_deductions), xPos + 5, yPos + 5, { width: colWidths.deductions - 10 });
      xPos += colWidths.deductions;
      doc.font('Helvetica-Bold').text(this.formatCurrency(item.net_pay), xPos + 5, yPos + 5, { width: colWidths.netPay - 10 });
      doc.font('Helvetica');

      yPos += 20;
    });

    return yPos + 20;
  }

  drawFooter(doc) {
    const footerY = this.pageHeight - 50;
    
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(this.colors.secondary)
      .text(
        `Generated on ${new Date().toLocaleString('en-PH')}`,
        this.margin,
        footerY,
        { align: 'center', width: this.contentWidth }
      );

    doc
      .text(
        'This is a system-generated report. No signature required.',
        this.margin,
        footerY + 12,
        { align: 'center', width: this.contentWidth }
      );
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }
}

module.exports = new PayrollReportService();
