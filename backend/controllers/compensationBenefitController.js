// controllers/compensationBenefitController.js - Compensation & Benefits controller
const { body, validationResult } = require("express-validator");
const CompensationBenefit = require("../models/CompensationBenefit");
const CompensationBenefitService = require("../services/compensationBenefitService");
const Employee = require("../models/Employee");

class CompensationBenefitController {
  constructor() {
    this.service = new CompensationBenefitService();
  }

  // Validation rules for compensation benefit records
  static get validationRules() {
    return [
      body("employee_id")
        .isInt({ min: 1 })
        .withMessage("Valid employee ID is required"),
      body("benefit_type")
        .isIn([
          "TERMINAL_LEAVE",
          "MONETIZATION",
          "PBB",
          "MID_YEAR_BONUS",
          "YEAR_END_BONUS",
          "EC",
          "GSIS",
          "LOYALTY",
        ])
        .withMessage("Valid benefit type is required"),
      body("amount")
        .isFloat({ min: 0 })
        .withMessage("Amount must be a non-negative number"),
      body("days_used")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Days used must be a positive number"),
      body("notes")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Notes must not exceed 255 characters"),
    ];
  }

  // GET /api/compensation-benefits - Get all compensation benefit records
  async getAllRecords(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const filters = {
        employee_id: req.query.employee_id,
        benefit_type: req.query.benefit_type,
        year: req.query.year,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        limit,
        offset,
      };

      const [records, total] = await Promise.all([
        CompensationBenefit.findAll(filters),
        CompensationBenefit.getCount(filters),
      ]);

      if (!records.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch compensation benefit records",
          details: records.error,
        });
      }

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: records.data,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          recordsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching compensation benefit records:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // GET /api/compensation-benefits/employee - Get compensation benefit records for current employee
  async getEmployeeRecords(req, res) {
    try {
      const employeeId = req.user.employee_id;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: "Employee ID not found in user session"
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const filters = {
        employee_id: employeeId, // Only show records for current employee
        benefit_type: req.query.benefit_type,
        year: req.query.year,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit,
        offset,
      };

      const [records, total] = await Promise.all([
        CompensationBenefit.findAll(filters),
        CompensationBenefit.getCount(filters),
      ]);

      if (!records.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch compensation benefit records",
          details: records.error,
        });
      }

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: records.data,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          recordsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching employee compensation benefit records:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // GET /api/compensation-benefits/:id - Get compensation benefit record by ID
  async getRecordById(req, res) {
    try {
      const { id } = req.params;
      const result = await CompensationBenefit.findById(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: "Compensation benefit record not found",
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error fetching compensation benefit record:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // GET /api/compensation-benefits/statistics - Get benefit statistics
  async getStatistics(req, res) {
    try {
      const filters = {
        year: req.query.year,
      };

      const result = await CompensationBenefit.getStatistics(filters);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch benefit statistics",
          details: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error fetching benefit statistics:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // GET /api/compensation-benefits/calculate/:benefitType/:employeeId - Calculate specific benefit
  async calculateBenefit(req, res) {
    try {
      const { benefitType, employeeId } = req.params;
      const { daysToMonetize } = req.query;

      let result;

      switch (benefitType) {
        case "TERMINAL_LEAVE":
          result = await this.service.calculateTerminalLeave(employeeId);
          break;
        case "MONETIZATION":
          if (!daysToMonetize) {
            return res.status(400).json({
              success: false,
              error:
                "Days to monetize is required for monetization calculation",
            });
          }
          result = await this.service.calculateMonetization(
            employeeId,
            parseFloat(daysToMonetize)
          );
          break;
        case "PBB":
          result = await this.service.calculatePBB(employeeId);
          break;
        case "MID_YEAR_BONUS":
          result = await this.service.calculateMidYearBonus(employeeId);
          break;
        case "YEAR_END_BONUS":
          result = await this.service.calculateYearEndBonus(employeeId);
          break;
        case "GSIS":
          result = await this.service.calculateGSIS(employeeId);
          break;
        case "LOYALTY":
          result = await this.service.calculateLoyaltyAward(employeeId);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: "Invalid benefit type",
          });
      }

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error calculating benefit:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // GET /api/compensation-benefits/eligible/:benefitType - Get eligible employees for benefit
  async getEligibleEmployees(req, res) {
    try {
      const { benefitType } = req.params;
      const result = await this.service.getEligibleEmployees(benefitType);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to fetch eligible employees",
          details: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error fetching eligible employees:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // POST /api/compensation-benefits/bulk-calculate - Bulk calculate benefits
  async bulkCalculate(req, res) {
    try {
      const { benefitType, employeeIds, options } = req.body;

      if (
        !benefitType ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Benefit type and employee IDs are required",
        });
      }

      const result = await this.service.bulkCalculateBenefit(
        benefitType,
        employeeIds,
        options
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to bulk calculate benefits",
          details: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error bulk calculating benefits:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // POST /api/compensation-benefits - Create single compensation benefit record
  async createRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const benefitData = {
        ...req.body,
        processed_by: req.session.user.id,
      };

      const benefit = new CompensationBenefit(benefitData);
      const result = await benefit.save();

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: "Compensation benefit record created successfully",
      });
    } catch (error) {
      console.error("Error creating compensation benefit record:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // POST /api/compensation-benefits/bulk-process - Bulk process benefits
  async bulkProcess(req, res) {
    try {
      const { benefitType, employeeIds, notes } = req.body;

      if (
        !benefitType ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Benefit type and employee IDs are required",
        });
      }

      const processedBy = req.session.user.id;

      // First calculate benefits for all employees
      const calculations = await this.service.bulkCalculateBenefit(
        benefitType,
        employeeIds
      );

      if (!calculations.success) {
        return res.status(400).json(calculations);
      }

      // Create records from calculations
      const records = calculations.data.map((calc) => ({
        employee_id: calc.employee_id,
        benefit_type: calc.benefit_type,
        days_used: calc.days_used,
        amount: calc.amount,
        notes: notes || "",
      }));

      const result = await CompensationBenefit.bulkCreate(records, processedBy);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: `Successfully processed ${result.data.length} benefit records`,
      });
    } catch (error) {
      console.error("Error bulk processing benefits:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // POST /api/compensation-benefits/process-monetization - Process monetization with leave balance update
  async processMonetization(req, res) {
    try {
      const { employee_id, days_to_monetize, notes } = req.body;

      if (!employee_id || !days_to_monetize || days_to_monetize <= 0) {
        return res.status(400).json({
          success: false,
          error: "Employee ID and valid days to monetize are required",
        });
      }

      const processedBy = req.session.user.id;
      const result = await this.service.processMonetization(
        employee_id,
        days_to_monetize,
        processedBy,
        notes
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: "Monetization processed successfully",
      });
    } catch (error) {
      console.error("Error processing monetization:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // GET /api/compensation-benefits/leave-balance/:employeeId - Get employee leave balance
  async getLeaveBalance(req, res) {
    try {
      const { employeeId } = req.params;
      const result = await this.service.getEmployeeLeaveBalance(employeeId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: "Leave balance not found",
          details: result.error,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  // DELETE /api/compensation-benefits/:id - Delete compensation benefit record
  async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const result = await CompensationBenefit.delete(id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: "Compensation benefit record not found",
        });
      }

      res.json({
        success: true,
        message: "Compensation benefit record deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting compensation benefit record:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }
}

module.exports = new CompensationBenefitController();
