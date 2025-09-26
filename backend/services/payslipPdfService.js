// services/payslipPdfService.js - Professional Payslip PDF Generation Service
const PDFDocument = require("pdfkit");

class PayslipPdfService {
  constructor() {
    this.pageWidth = 612; // Letter width
    this.pageHeight = 792; // Letter height
    this.margin = 60; // Professional margins
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.colors = {
      primary: "#1a1a1a", // Deep black for main text
      secondary: "#666666", // Medium gray for labels
      accent: "#2563eb", // Professional blue
      lightGray: "#f8f9fa", // Very light background
      border: "#e1e5e9", // Subtle borders
      white: "#ffffff",
    };
  }

  async generatePayslipPDF(payslipData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margin: this.margin,
          bufferPages: true,
        });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        this.drawPayslipTemplate(doc, payslipData);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  drawPayslipTemplate(doc, data) {
    if (!data.employee || !data.calculation) {
      throw new Error("Employee and calculation data are required");
    }

    this.drawHeader(doc, data);
    this.drawEmployeeSection(doc, data);
    this.drawPayrollTable(doc, data);
    this.drawSummarySection(doc, data);
    this.drawFooter(doc);
  }

  // --- Professional Drawing Methods ---

  drawHeader(doc, data) {
    // Company header section
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(this.colors.primary)
      .text("Employee Management System", this.margin, 60);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(this.colors.secondary)
      .text("Government Office Complex, City Hall", this.margin, 85)
      .text("Phone: (02) 123-4567 | Email: hr@government.ph", this.margin, 100);

    // Payslip title and period
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(this.colors.accent)
      .text("PAYSLIP", this.pageWidth - this.margin - 100, 60, {
        width: 100,
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(this.colors.secondary)
      .text(
        data.payroll_period || "Current Period",
        this.pageWidth - this.margin - 120,
        80,
        { width: 120, align: "right" }
      )
      .text(
        `Pay Date: ${new Date(data.pay_date).toLocaleDateString("en-PH")}`,
        this.pageWidth - this.margin - 120,
        95,
        { width: 120, align: "right" }
      );

    // Header separator line
    doc
      .strokeColor(this.colors.border)
      .lineWidth(1)
      .moveTo(this.margin, 125)
      .lineTo(this.pageWidth - this.margin, 125)
      .stroke();

    doc.y = 140;
  }

  drawEmployeeSection(doc, data) {
    const startY = doc.y;

    // Employee information in clean layout
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(this.colors.secondary)
      .text("EMPLOYEE INFORMATION", this.margin, startY);

    const infoY = startY + 20;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(this.colors.primary)
      .text(data.employee.name, this.margin, infoY);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(this.colors.secondary)
      .text(
        `Employee ID: ${data.employee.employee_number}`,
        this.margin,
        infoY + 18
      )
      .text(`Position: ${data.employee.position}`, this.margin, infoY + 33);

    doc.y = infoY + 60;
  }

  drawPayrollTable(doc, data) {
    const tableY = doc.y;
    const colWidths = [280, 120, 120]; // Description, Earnings, Deductions
    const rowHeight = 25;

    // Table header
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(this.colors.secondary)
      .text("EARNINGS & DEDUCTIONS", this.margin, tableY);

    const headerY = tableY + 25;

    // Header background
    doc
      .rect(this.margin, headerY, this.contentWidth, rowHeight)
      .fill(this.colors.lightGray);

    // Header text
    doc.font("Helvetica-Bold").fontSize(10).fillColor(this.colors.primary);
    doc.text("Description", this.margin + 10, headerY + 8);
    doc.text("Earnings", this.margin + colWidths[0] + 10, headerY + 8, {
      width: colWidths[1] - 20,
      align: "right",
    });
    doc.text(
      "Deductions",
      this.margin + colWidths[0] + colWidths[1] + 10,
      headerY + 8,
      { width: colWidths[2] - 20, align: "right" }
    );

    let currentY = headerY + rowHeight;

    // Earnings rows
    const earnings = [
      { description: "Basic Pay", amount: data.calculation.basic_pay },
      ...(data.line_items.filter((item) => item.line_type === "Allowance") ||
        []),
    ];

    earnings.forEach((item, index) => {
      if (index % 2 === 1) {
        doc
          .rect(this.margin, currentY, this.contentWidth, rowHeight)
          .fill("#fafafa");
      }

      doc.font("Helvetica").fontSize(10).fillColor(this.colors.primary);
      doc.text(item.description, this.margin + 10, currentY + 8);
      doc.text(
        this.formatCurrency(item.amount),
        this.margin + colWidths[0] + 10,
        currentY + 8,
        { width: colWidths[1] - 20, align: "right" }
      );
      doc.text(
        "",
        this.margin + colWidths[0] + colWidths[1] + 10,
        currentY + 8,
        { width: colWidths[2] - 20, align: "right" }
      );

      currentY += rowHeight;
    });

    // Deductions rows
    const deductions =
      data.line_items.filter((item) => item.line_type === "Deduction") || [];
    if (deductions.length === 0) {
      if (earnings.length % 2 === 1) {
        doc
          .rect(this.margin, currentY, this.contentWidth, rowHeight)
          .fill("#fafafa");
      }
      doc.font("Helvetica").fontSize(10).fillColor(this.colors.primary);
      doc.text("No Deductions", this.margin + 10, currentY + 8);
      doc.text("", this.margin + colWidths[0] + 10, currentY + 8, {
        width: colWidths[1] - 20,
        align: "right",
      });
      doc.text(
        this.formatCurrency(0),
        this.margin + colWidths[0] + colWidths[1] + 10,
        currentY + 8,
        { width: colWidths[2] - 20, align: "right" }
      );
      currentY += rowHeight;
    } else {
      deductions.forEach((item, index) => {
        if ((earnings.length + index) % 2 === 1) {
          doc
            .rect(this.margin, currentY, this.contentWidth, rowHeight)
            .fill("#fafafa");
        }

        doc.font("Helvetica").fontSize(10).fillColor(this.colors.primary);
        doc.text(item.description, this.margin + 10, currentY + 8);
        doc.text("", this.margin + colWidths[0] + 10, currentY + 8, {
          width: colWidths[1] - 20,
          align: "right",
        });
        doc.text(
          this.formatCurrency(item.amount),
          this.margin + colWidths[0] + colWidths[1] + 10,
          currentY + 8,
          { width: colWidths[2] - 20, align: "right" }
        );

        currentY += rowHeight;
      });
    }

    // Totals row
    doc
      .rect(this.margin, currentY, this.contentWidth, rowHeight)
      .fill(this.colors.lightGray);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(this.colors.primary);
    doc.text("TOTALS", this.margin + 10, currentY + 8);
    doc.text(
      this.formatCurrency(data.calculation.gross_pay),
      this.margin + colWidths[0] + 10,
      currentY + 8,
      { width: colWidths[1] - 20, align: "right" }
    );
    doc.text(
      this.formatCurrency(data.calculation.total_deductions),
      this.margin + colWidths[0] + colWidths[1] + 10,
      currentY + 8,
      { width: colWidths[2] - 20, align: "right" }
    );

    doc.y = currentY + rowHeight + 20;
  }

  drawSummarySection(doc, data) {
    const summaryY = doc.y;

    // Summary calculations
    doc
      .strokeColor(this.colors.border)
      .lineWidth(1)
      .moveTo(this.margin + 200, summaryY)
      .lineTo(this.pageWidth - this.margin, summaryY)
      .stroke();

    const rightAlign = this.pageWidth - this.margin - 120;

    // Gross earnings
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(this.colors.secondary)
      .text("Gross Earnings:", rightAlign - 100, summaryY + 15);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(this.colors.primary)
      .text(
        this.formatCurrency(data.calculation.gross_pay),
        rightAlign,
        summaryY + 15,
        { width: 120, align: "right" }
      );

    // Total deductions
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(this.colors.secondary)
      .text("Total Deductions:", rightAlign - 100, summaryY + 35);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(this.colors.primary)
      .text(
        this.formatCurrency(data.calculation.total_deductions),
        rightAlign,
        summaryY + 35,
        { width: 120, align: "right" }
      );

    // Net pay separator
    doc
      .strokeColor(this.colors.border)
      .lineWidth(1)
      .moveTo(rightAlign - 100, summaryY + 55)
      .lineTo(this.pageWidth - this.margin, summaryY + 55)
      .stroke();

    // Net pay - prominent
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(this.colors.accent)
      .text("NET PAY:", rightAlign - 100, summaryY + 65);
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(this.colors.accent)
      .text(
        this.formatCurrency(data.calculation.net_pay),
        rightAlign,
        summaryY + 65,
        { width: 120, align: "right" }
      );

    doc.y = summaryY + 100;
  }

  drawFooter(doc) {
    const footerY = this.pageHeight - 80;

    // Footer separator
    doc
      .strokeColor(this.colors.border)
      .lineWidth(0.5)
      .moveTo(this.margin, footerY)
      .lineTo(this.pageWidth - this.margin, footerY)
      .stroke();

    // Footer text
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(this.colors.secondary)
      .text(
        "This payslip is system-generated and does not require a signature.",
        this.margin,
        footerY + 15,
        { align: "center", width: this.contentWidth }
      );

    doc.text(
      "For questions or discrepancies, please contact Human Resources at hr@government.ph",
      this.margin,
      footerY + 30,
      { align: "center", width: this.contentWidth }
    );
  }

  // --- Helper Methods ---

  formatCurrency(amount) {
    if (typeof amount !== "number") return amount;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Sample data generator for testing
  generateSampleData() {
    return {
      employee: {
        name: "Juan Dela Cruz",
        employee_number: "EMP001",
        position: "Software Developer",
      },
      payroll_period: "January 1-15, 2024",
      pay_date: new Date(),
      calculation: {
        basic_pay: 25000.0,
        gross_pay: 28500.0,
        total_deductions: 3200.0,
        net_pay: 25300.0,
      },
      line_items: [
        {
          description: "Transportation Allowance",
          amount: 2000.0,
          line_type: "Allowance",
        },
        {
          description: "Meal Allowance",
          amount: 1500.0,
          line_type: "Allowance",
        },
        {
          description: "SSS Contribution",
          amount: 1200.0,
          line_type: "Deduction",
        },
        { description: "PhilHealth", amount: 800.0, line_type: "Deduction" },
        { description: "Pag-IBIG", amount: 600.0, line_type: "Deduction" },
        {
          description: "Withholding Tax",
          amount: 600.0,
          line_type: "Deduction",
        },
      ],
    };
  }
}

module.exports = new PayslipPdfService();
