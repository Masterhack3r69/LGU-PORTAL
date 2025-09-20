-- Active: 1756901281259@@localhost@3306@employee_management_system
-- Compensation & Benefits Module Database Schema
-- This script creates all tables required for the compensation and benefits management system
-- Execute this script after the main EMS database schema

-- =====================================================================
-- COMPENSATION TYPES TABLE
-- Defines benefit types with calculation rules and formulas
-- =====================================================================
CREATE TABLE IF NOT EXISTS `compensation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `calculation_type` enum('Fixed','Percentage','Formula','MonthsWorked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fixed',
  `default_amount` decimal(12,2) DEFAULT NULL,
  `percentage_base` enum('BasicPay','MonthlySalary','AnnualSalary','GrossPay') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formula` text COLLATE utf8mb4_unicode_ci COMMENT 'Custom calculation formula if type is Formula',
  `frequency` enum('Annual','OneTime','Conditional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Annual',
  `is_taxable` tinyint(1) NOT NULL DEFAULT '1',
  `is_recurring` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether this benefit type is recurring annually',
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_compensation_types_active` (`is_active`),
  KEY `idx_compensation_types_frequency` (`frequency`),
  KEY `idx_compensation_types_recurring` (`is_recurring`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Benefit types with calculation rules and formulas';

-- =====================================================================
-- EMPLOYEE COMPENSATION TABLE
-- Tracks employee compensation records and history
-- =====================================================================
CREATE TABLE IF NOT EXISTS `employee_compensation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `compensation_type_id` int NOT NULL,
  `year` year NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `calculation_basis` text COLLATE utf8mb4_unicode_ci COMMENT 'How the amount was calculated',
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Draft','Calculated','Approved','Paid','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_compensation` (`employee_id`,`compensation_type_id`,`year`),
  KEY `compensation_type_id` (`compensation_type_id`),
  KEY `approved_by` (`approved_by`),
  KEY `paid_by` (`paid_by`),
  KEY `created_by` (`created_by`),
  KEY `idx_employee_compensation_employee_year` (`employee_id`,`year`),
  KEY `idx_employee_compensation_status` (`status`),
  KEY `idx_employee_compensation_effective` (`effective_date`),
  CONSTRAINT `employee_compensation_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_compensation_ibfk_2` FOREIGN KEY (`compensation_type_id`) REFERENCES `compensation_types` (`id`),
  CONSTRAINT `employee_compensation_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `employee_compensation_ibfk_4` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`),
  CONSTRAINT `employee_compensation_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_employee_compensation_dates` CHECK ((`end_date` IS NULL OR `end_date` >= `effective_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Employee compensation records and history';

-- =====================================================================
-- BENEFIT CYCLES TABLE
-- Manages benefit processing cycles (yearly/special events)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_cycles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compensation_type_id` int NOT NULL,
  `year` year NOT NULL,
  `cycle_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., "2025 Mid-Year Bonus"',
  `applicable_date` date NOT NULL COMMENT 'When benefits are applicable',
  `cutoff_date` date DEFAULT NULL COMMENT 'Last date for eligibility consideration',
  `payment_date` date DEFAULT NULL,
  `status` enum('Draft','Processing','Completed','Released','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `total_employees` int NOT NULL DEFAULT '0',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `processing_notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `finalized_by` int DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_benefit_cycle` (`compensation_type_id`,`year`),
  KEY `created_by` (`created_by`),
  KEY `finalized_by` (`finalized_by`),
  KEY `idx_benefit_cycles_year_status` (`year`,`status`),
  KEY `idx_benefit_cycles_type_status` (`compensation_type_id`,`status`),
  CONSTRAINT `benefit_cycles_ibfk_1` FOREIGN KEY (`compensation_type_id`) REFERENCES `compensation_types` (`id`),
  CONSTRAINT `benefit_cycles_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_cycles_ibfk_3` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_benefit_cycles_dates` CHECK ((`cutoff_date` IS NULL OR `cutoff_date` <= `applicable_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Benefit processing cycles for yearly and special events';

-- =====================================================================
-- BENEFIT ITEMS TABLE
-- Stores calculated benefit records per employee within a cycle
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benefit_cycle_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `working_days` decimal(4,2) DEFAULT NULL COMMENT 'Days worked for calculation purposes',
  `basic_salary` decimal(12,2) DEFAULT NULL COMMENT 'Base salary used for calculation',
  `calculated_amount` decimal(12,2) NOT NULL,
  `final_amount` decimal(12,2) NOT NULL COMMENT 'Amount after adjustments',
  `status` enum('Draft','Calculated','Adjusted','Approved','Paid','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `calculation_details` json DEFAULT NULL COMMENT 'Detailed breakdown of calculation',
  `adjustment_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Reason for any adjustments',
  `is_eligible` tinyint(1) NOT NULL DEFAULT '1',
  `eligibility_notes` text COLLATE utf8mb4_unicode_ci,
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_benefit_cycle_employee` (`benefit_cycle_id`,`employee_id`),
  KEY `employee_id` (`employee_id`),
  KEY `processed_by` (`processed_by`),
  KEY `approved_by` (`approved_by`),
  KEY `paid_by` (`paid_by`),
  KEY `idx_benefit_items_cycle_status` (`benefit_cycle_id`,`status`),
  KEY `idx_benefit_items_employee_status` (`employee_id`,`status`),
  CONSTRAINT `benefit_items_ibfk_1` FOREIGN KEY (`benefit_cycle_id`) REFERENCES `benefit_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_items_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_items_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_items_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_items_ibfk_5` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_benefit_items_amounts` CHECK ((`calculated_amount` >= 0 AND `final_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Calculated benefit records per employee within a cycle';

-- =====================================================================
-- BENEFIT ITEM LINES TABLE
-- Detailed breakdown of benefit calculations and adjustments
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_item_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benefit_item_id` int NOT NULL,
  `line_type` enum('BaseCalculation','Adjustment','Override','Deduction','Addition') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `calculation_basis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Formula or basis for this line item',
  `is_override` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `benefit_item_id` (`benefit_item_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_benefit_lines_item_type` (`benefit_item_id`,`line_type`),
  CONSTRAINT `benefit_item_lines_ibfk_1` FOREIGN KEY (`benefit_item_id`) REFERENCES `benefit_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_item_lines_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detailed breakdown of benefit calculations and adjustments';

-- =====================================================================
-- INSERT DEFAULT COMPENSATION TYPES
-- Based on the workflow requirements
-- =====================================================================
INSERT INTO `compensation_types` (`name`, `code`, `description`, `calculation_type`, `default_amount`, `percentage_base`, `frequency`, `is_taxable`, `is_recurring`) VALUES
('Terminal Benefit Claims', 'TERMINAL', 'Terminal leave benefits for separated/retired employees', 'Formula', NULL, 'MonthlySalary', 'OneTime', 0, 0),
('Monetization of Leave Credits', 'MONETIZATION', 'Cash conversion of unused leave credits', 'Formula', NULL, 'MonthlySalary', 'Conditional', 1, 0),
('Performance-Based Bonus (PBB)', 'PBB', 'Performance-based bonus based on individual and agency performance', 'Percentage', NULL, 'AnnualSalary', 'Annual', 1, 1),
('Mid-Year Bonus (13th Month Pay)', 'MID_YEAR', 'Mid-year bonus equivalent to one month basic salary', 'MonthsWorked', NULL, 'MonthlySalary', 'Annual', 1, 1),
('Year-End Bonus (14th Month Pay)', 'YEAR_END', 'Year-end bonus as additional compensation', 'Fixed', NULL, 'MonthlySalary', 'Annual', 1, 1),
('Employee Compensation (EC)', 'EC', 'Employee compensation benefits and claims', 'Percentage', NULL, 'MonthlySalary', 'Conditional', 0, 0),
('GSIS Contributions/Claims', 'GSIS', 'Government Service Insurance System contributions and claims', 'Percentage', NULL, 'MonthlySalary', 'Annual', 0, 1),
('Loyalty Award Benefits', 'LOYALTY', 'Loyalty awards for employees reaching service milestones', 'Fixed', NULL, NULL, 'Conditional', 1, 0);

-- =====================================================================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_employee_compensation_employee_year_status` ON `employee_compensation` (`employee_id`, `year`, `status`);
CREATE INDEX `idx_benefit_cycles_year_type_status` ON `benefit_cycles` (`year`, `compensation_type_id`, `status`);
CREATE INDEX `idx_benefit_items_cycle_employee` ON `benefit_items` (`benefit_cycle_id`, `employee_id`);
CREATE INDEX `idx_benefit_items_eligible` ON `benefit_items` (`benefit_cycle_id`, `is_eligible`);
CREATE INDEX `idx_benefit_item_lines_item_override` ON `benefit_item_lines` (`benefit_item_id`, `is_override`);

-- =====================================================================
-- CREATE TRIGGERS FOR AUDIT LOGGING INTEGRATION
-- =====================================================================

DELIMITER $$

-- Trigger for benefit_cycles audit logging
CREATE TRIGGER `tr_benefit_cycles_insert` AFTER INSERT ON `benefit_cycles`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `new_values`)
    VALUES (NEW.created_by, 'CREATE_BENEFIT_CYCLE', 'benefit_cycles', NEW.id,
            JSON_OBJECT('compensation_type_id', NEW.compensation_type_id, 'year', NEW.year,
                       'cycle_name', NEW.cycle_name, 'applicable_date', NEW.applicable_date,
                       'status', NEW.status, 'total_employees', NEW.total_employees));
END$$

CREATE TRIGGER `tr_benefit_cycles_update` AFTER UPDATE ON `benefit_cycles`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`)
    VALUES (IFNULL(NEW.finalized_by, NEW.created_by), 'UPDATE_BENEFIT_CYCLE', 'benefit_cycles', NEW.id,
            JSON_OBJECT('status', OLD.status, 'total_employees', OLD.total_employees, 'total_amount', OLD.total_amount),
            JSON_OBJECT('status', NEW.status, 'total_employees', NEW.total_employees, 'total_amount', NEW.total_amount));
END$$

-- Trigger for benefit_items audit logging
CREATE TRIGGER `tr_benefit_items_insert` AFTER INSERT ON `benefit_items`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `new_values`)
    VALUES (IFNULL(NEW.processed_by, 1), 'CREATE_BENEFIT_ITEM', 'benefit_items', NEW.id,
            JSON_OBJECT('benefit_cycle_id', NEW.benefit_cycle_id, 'employee_id', NEW.employee_id,
                       'calculated_amount', NEW.calculated_amount, 'final_amount', NEW.final_amount,
                       'status', NEW.status, 'is_eligible', NEW.is_eligible));
END$$

CREATE TRIGGER `tr_benefit_items_update` AFTER UPDATE ON `benefit_items`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`)
    VALUES (IFNULL(NEW.approved_by, IFNULL(NEW.processed_by, 1)), 'UPDATE_BENEFIT_ITEM', 'benefit_items', NEW.id,
            JSON_OBJECT('calculated_amount', OLD.calculated_amount, 'final_amount', OLD.final_amount, 'status', OLD.status),
            JSON_OBJECT('calculated_amount', NEW.calculated_amount, 'final_amount', NEW.final_amount, 'status', NEW.status));
END$$

-- Trigger for employee_compensation audit logging
CREATE TRIGGER `tr_employee_compensation_insert` AFTER INSERT ON `employee_compensation`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `new_values`)
    VALUES (NEW.created_by, 'CREATE_EMPLOYEE_COMPENSATION', 'employee_compensation', NEW.id,
            JSON_OBJECT('employee_id', NEW.employee_id, 'compensation_type_id', NEW.compensation_type_id,
                       'year', NEW.year, 'amount', NEW.amount, 'status', NEW.status));
END$$

CREATE TRIGGER `tr_employee_compensation_update` AFTER UPDATE ON `employee_compensation`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`)
    VALUES (IFNULL(NEW.approved_by, IFNULL(NEW.paid_by, NEW.created_by)), 'UPDATE_EMPLOYEE_COMPENSATION', 'employee_compensation', NEW.id,
            JSON_OBJECT('amount', OLD.amount, 'status', OLD.status),
            JSON_OBJECT('amount', NEW.amount, 'status', NEW.status));
END$$

DELIMITER ;

-- =====================================================================
-- CREATE VIEWS FOR REPORTING AND ANALYTICS
-- =====================================================================

-- View for benefit cycle summary
CREATE OR REPLACE VIEW `v_benefit_cycle_summary` AS
SELECT
    bc.id,
    bc.compensation_type_id,
    ct.name as compensation_type_name,
    ct.code as compensation_type_code,
    bc.year,
    bc.cycle_name,
    bc.applicable_date,
    bc.cutoff_date,
    bc.payment_date,
    bc.status,
    bc.total_employees,
    bc.total_amount,
    bc.created_at,
    CONCAT(u1.username) as created_by_username,
    CONCAT(u2.username) as finalized_by_username
FROM benefit_cycles bc
JOIN compensation_types ct ON bc.compensation_type_id = ct.id
LEFT JOIN users u1 ON bc.created_by = u1.id
LEFT JOIN users u2 ON bc.finalized_by = u2.id;

-- View for employee benefit details
CREATE OR REPLACE VIEW `v_employee_benefit_details` AS
SELECT
    bi.id,
    bi.benefit_cycle_id,
    bc.cycle_name,
    bc.year,
    bc.applicable_date,
    bi.employee_id,
    e.employee_number,
    CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
    e.plantilla_position,
    bi.basic_salary,
    bi.working_days,
    bi.calculated_amount,
    bi.final_amount,
    bi.status,
    bi.is_eligible,
    bi.processed_at,
    bi.approved_at,
    bi.paid_at,
    CONCAT(u1.username) as processed_by_username,
    CONCAT(u2.username) as approved_by_username,
    CONCAT(u3.username) as paid_by_username
FROM benefit_items bi
JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
JOIN employees e ON bi.employee_id = e.id
LEFT JOIN users u1 ON bi.processed_by = u1.id
LEFT JOIN users u2 ON bi.approved_by = u2.id
LEFT JOIN users u3 ON bi.paid_by = u3.id
WHERE e.deleted_at IS NULL;

-- View for compensation summary by year and type
CREATE OR REPLACE VIEW `v_compensation_summary` AS
SELECT
    ct.name as compensation_type,
    ct.code as compensation_type_code,
    ec.year,
    COUNT(ec.id) as employee_count,
    COUNT(CASE WHEN ec.status = 'Paid' THEN 1 END) as paid_count,
    COALESCE(SUM(ec.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN ec.status = 'Paid' THEN ec.amount ELSE 0 END), 0) as total_paid_amount,
    ec.status
FROM employee_compensation ec
JOIN compensation_types ct ON ec.compensation_type_id = ct.id
GROUP BY ct.name, ct.code, ec.year, ec.status;

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================
SELECT 'Compensation & Benefits module database schema created successfully!' as Status,
        'Tables created: compensation_types, employee_compensation, benefit_cycles, benefit_items, benefit_item_lines' as TablesCreated,
        'Default benefit types inserted based on workflow requirements' as DefaultData,
        'Audit triggers and reporting views created' as AdditionalFeatures;